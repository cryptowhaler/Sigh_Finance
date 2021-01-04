pragma solidity ^0.5.16;

/**
 * @title Sigh Speed Controller Contract
 * @notice Distributes a token to a different contract at a fixed rate.
 * @dev This contract must be poked via the `drip()` function every so often.
 * @author SighFinance
 */

import "../../openzeppelin-upgradeability/VersionedInitializable.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol"; 
import "../Interfaces/ISighSpeedController.sol";
import "../../configuration/GlobalAddressesProvider.sol";

import "../Interfaces/ISIGHVolatilityHarvester.sol"; 

contract SighSpeedController is ISighSpeedController, ReentrancyGuard, VersionedInitializable  {

  GlobalAddressesProvider private addressesProvider;

  IERC20 private sighInstrument;                                         // SIGH INSTRUMENT CONTRACT
  uint constant expScale = 1e18;

  bool private isDripAllowed = false;  
  uint private lastDripBlockNumber;    

  ISIGHVolatilityHarvester private sighVolatilityHarvester;      // SIGH DISTRIBUTION HANDLER CONTRACT
  uint256 private sighVolatilityHarvestingSpeed;
    
  struct protocolState {
    bool isSupported;
    Exp sighSpeedRatio;
    uint totalDrippedAmount;
    uint recentlyDrippedAmount;
  }

  address[] private storedSupportedProtocols; 
  mapping (address => protocolState) private supportedProtocols;

   uint private totalDrippedToVolatilityHarvester;                 // TOTAL $SIGH DRIPPED TO SIGH VOLATILTIY HARVESTER
   uint private recentlyDrippedToVolatilityHarvester;              // $SIGH RECENTLY DRIPPED TO SIGH VOLATILTIY HARVESTER

    struct Exp {
        uint mantissa;
    }

// ########################
// ####### EVENTS #########
// ########################

  event DistributionInitialized(address sighVolatilityHarvesterAddress, uint blockNumber);

  event SighVolatilityHarvestsSpeedUpdated(uint newSIGHVolatilityharvestSpeed );

  event NewProtocolSupported (address protocolAddress, uint sighSpeedRatio, uint totalDrippedAmount, uint blockNumber);
  event ProtocolRemoved(address protocolAddress, uint totalDrippedToProtocol, uint blockNumber);
  
  event DistributionSpeedRatioChanged(address protocolAddress, uint prevSpeedRatio , uint newSpeedRatio, uint blockNumber );  
  event Dripped(address protocolAddress, uint deltaBlocks, uint sighSpeedRatio, uint distributionSpeed, uint AmountDripped, uint totalAmountDripped, uint blockNumber ); 
  event DrippedToVolatilityHarvester(address sighVolatilityHarvesterAddress,uint deltaBlocks,uint harvestDistributionSpeed,uint recentlyDrippedToVolatilityHarvester ,uint totalDrippedToVolatilityHarvester,uint blockNumber_ ); 

// ########################
// ####### MODIFIER #######
// ########################

    //only SIGH Finance Configurator can use functions affected by this modifier
    modifier onlySighFinanceConfigurator {
        require(addressesProvider.getSIGHFinanceConfigurator() == msg.sender, "The caller must be the SIGH Finanace Configurator Contract");
        _;
    }

// ###########################
// ####### CONSTRUCTOR #######
// ###########################

    uint256 public constant REVISION = 0x1;             // NEEDED AS PART OF UPGRADABLE CONTRACTS FUNCTIONALITY ( VersionedInitializable )

    function getRevision() internal pure returns (uint256) {        // NEEDED AS PART OF UPGRADABLE CONTRACTS FUNCTIONALITY ( VersionedInitializable )
        return REVISION;
    }

    /**
    * @dev this function is invoked by the proxy contract when the LendingPool contract is added to the AddressesProvider.
    * @param _addressesProvider the address of the GlobalAddressesProvider registry
    **/
    function initialize(GlobalAddressesProvider _addressesProvider) public initializer {
        addressesProvider = _addressesProvider;
        refreshConfigInternal();
    }

  function refreshConfigInternal() internal {
    sighInstrument = IERC20(addressesProvider.getSIGHAddress());
    require(address(sighInstrument) != address(0), " SIGH Instrument not initialized Properly ");
    require(address(addressesProvider) != address(0), " AddressesProvider not initialized Properly ");    
  }


// #############################################################################################
// ###########   SIGH DISTRIBUTION : INITIALIZED DRIPPING (Can be called only once)   ##########
// #############################################################################################

  function beginDripping () external onlySighFinanceConfigurator returns (bool) {
    require(!isDripAllowed,"Dripping can only be initialized once");
    address sighVolatilityHarvesterAddress_ = addressesProvider.getSIGHVolatilityHarvester();
    require(sighVolatilityHarvesterAddress_ != address(0),"SIGH Volatility Harvester Address not valid");

    isDripAllowed = true;
    sighVolatilityHarvester = ISIGHVolatilityHarvester(sighVolatilityHarvesterAddress_);
    lastDripBlockNumber = block.number;

    emit DistributionInitialized( sighVolatilityHarvesterAddress_ ,  lastDripBlockNumber );
    return true;
  }

  function updateSighVolatilityDistributionSpeed(uint newSpeed) external onlySighFinanceConfigurator returns (bool) {
    sighVolatilityHarvestingSpeed = newSpeed;  
    emit SighVolatilityHarvestsSpeedUpdated( sighVolatilityHarvestingSpeed );
    return true;
  }

// ############################################################################################################
// ###########   SIGH DISTRIBUTION : ADDING / REMOVING NEW PROTOCOL WHICH WILL RECEIVE SIGH INSTRUMENTS   ##########
// ############################################################################################################

  function supportNewProtocol( address newProtocolAddress, uint sighSpeedRatio ) external onlySighFinanceConfigurator returns (bool)  {
    require (!supportedProtocols[newProtocolAddress].isSupported, 'This Protocol is already supported by the Sigh Speed Controller');
    require ( sighSpeedRatio == 0 || ( 0.01e18 <=sighSpeedRatio && sighSpeedRatio <= 2e18 )  , "Invalid 'SIGH Volatiltiy harvesting - Speed Ratio' provided. ");


    if (isDripAllowed) {
        dripInternal();
    }
    
    storedSupportedProtocols.push(newProtocolAddress);                              // ADDED TO THE LIST
    
    if ( supportedProtocols[newProtocolAddress].totalDrippedAmount > 0 ) {
        supportedProtocols[newProtocolAddress].isSupported = true;
        supportedProtocols[newProtocolAddress].sighSpeedRatio = Exp({ mantissa: sighSpeedRatio });
    }
    else {
        supportedProtocols[newProtocolAddress] = protocolState({ isSupported: true, sighSpeedRatio: Exp({ mantissa: sighSpeedRatio }), totalDrippedAmount: uint(0), recentlyDrippedAmount: uint(0) });
    }
    
    lastDripBlockNumber = block.number; // EITHER THIS WAS ALREADY DONE IN DRIPINTERNAL() OR WE DO IT HERE IF DRIPPING IS NOT ALLOWED AND A PROTOCOL IS BEING ADDED
    require (supportedProtocols[newProtocolAddress].isSupported, 'Error occured when adding the new protocol');
    require (supportedProtocols[newProtocolAddress].sighSpeedRatio.mantissa == sighSpeedRatio, 'SIGH Volatiltiy harvesting - Speed Ratio, for the new protocol was not initialized properly.');
    
    emit NewProtocolSupported(newProtocolAddress, supportedProtocols[newProtocolAddress].sighSpeedRatio.mantissa, supportedProtocols[newProtocolAddress].totalDrippedAmount, block.number);
    return true;
  }
  

  function removeSupportedProtocol(address protocolAddress_ ) external onlySighFinanceConfigurator returns (bool) {
    require(supportedProtocols[protocolAddress_].isSupported,'The Protocol is already not Supported by the Sigh Speed Controller' );
    
    if (isDripAllowed) {
        dripInternal();
    }
    
    uint index = 0;
    uint len = storedSupportedProtocols.length;

    for (uint i=0; i< len; i++) {
        if ( storedSupportedProtocols[i] == protocolAddress_ ) {
            index = i;
            break;
        }
    }
    
    storedSupportedProtocols[index] = storedSupportedProtocols[len - 1];
    storedSupportedProtocols.length--;
    uint newLength = len - 1;
    require(storedSupportedProtocols.length == newLength, 'The length of the list was not properly decremented.' );
    
    supportedProtocols[protocolAddress_].isSupported = false;
    supportedProtocols[protocolAddress_].sighSpeedRatio = Exp({ mantissa: 0 });
    require (supportedProtocols[protocolAddress_].isSupported == false, 'Error occured when removing the protocol.');
    require (supportedProtocols[protocolAddress_].sighSpeedRatio.mantissa == 0, 'SIGH Volatiltiy harvesting - Speed Ratio was not properly assigned to 0.');

    emit ProtocolRemoved( protocolAddress_,  supportedProtocols[protocolAddress_].totalDrippedAmount,  block.number );
    return true;
  }
  
// ######################################################################################
// ###########   SIGH DISTRIBUTION : FUNCTIONS TO UPDATE DISTRIBUTION SPEEDS   ##########
// ######################################################################################

  function changeProtocolSIGHSpeedRatio (address targetAddress, uint newRatio_) external onlySighFinanceConfigurator returns (bool) {
    require(supportedProtocols[targetAddress].isSupported,'The Protocol is not Supported by the Sigh Speed Controller' );
    if (isDripAllowed) {
        dripInternal();
    }
    uint prevSpeed = supportedProtocols[targetAddress].sighSpeedRatio.mantissa;
    supportedProtocols[targetAddress].sighSpeedRatio.mantissa = newRatio_;

    require(supportedProtocols[targetAddress].sighSpeedRatio.mantissa == newRatio_, "SIGH Volatiltiy harvesting - Speed Ratio was not properly updated");
    emit DistributionSpeedRatioChanged(targetAddress, prevSpeed , supportedProtocols[targetAddress].sighSpeedRatio.mantissa, block.number );
    return true;
  }


// #####################################################################
// ###########   SIGH DISTRIBUTION FUNCTION - DRIP FUNCTION   ##########
// #####################################################################

  /**
    * @notice Drips the maximum amount of sighInstruments to match the drip rate since inception
    * @dev Note: this will only drip up to the amount of sighInstruments available.
    */
  function drip() nonReentrant public {
    require(isDripAllowed,'Dripping has not been initialized by the SIGH Finance Manager');    
    dripInternal();
    dripToVolatilityHarvesterInternal();
    lastDripBlockNumber = block.number;
  }

  function dripToVolatilityHarvesterInternal() internal {
    if ( address(sighVolatilityHarvester) == address(0) || lastDripBlockNumber == block.number ) {
      return;
    }
    
    uint blockNumber_ = block.number;
    uint reservoirBalance_ = sighInstrument.balanceOf(address(this)); 
    uint deltaBlocks = sub(blockNumber_,lastDripBlockNumber,"Delta Blocks gave error");
                                    
    uint deltaDrip_ = mul(sighVolatilityHarvestingSpeed, deltaBlocks , "dripTotal overflow");
    uint toDrip_ = min(reservoirBalance_, deltaDrip_);
            
    require(reservoirBalance_ != 0, 'Protocol Transfer: The reservoir currently does not have any SIGH' );
    require(sighInstrument.transfer(address(sighVolatilityHarvester), toDrip_), 'Protocol Transfer: The transfer did not complete.' );
                
    totalDrippedToVolatilityHarvester = add(totalDrippedToVolatilityHarvester,toDrip_,"Overflow");
    recentlyDrippedToVolatilityHarvester = toDrip_;

    emit DrippedToVolatilityHarvester( address(sighVolatilityHarvester), deltaBlocks, sighVolatilityHarvestingSpeed, recentlyDrippedToVolatilityHarvester , totalDrippedToVolatilityHarvester, blockNumber_ ); 
  }

  
  function dripInternal() internal {
     
    if (lastDripBlockNumber == block.number) {
        return;
    }
          
    address[] memory protocols = storedSupportedProtocols;
    uint length = protocols.length;

    uint currentVolatilityHarvestSpeed = sighVolatilityHarvester.getSIGHSpeedUsed();
    uint reservoirBalance_; 

    uint blockNumber_ = block.number;
    uint deltaBlocks = sub(blockNumber_,lastDripBlockNumber,"Delta Blocks gave error");
    
    if (length > 0 && currentVolatilityHarvestSpeed > 0) {
        
        for ( uint i=0; i < length; i++) {
            address current_protocol = protocols[i];
            
            if ( supportedProtocols[ current_protocol ].isSupported ) {
                
                reservoirBalance_ = sighInstrument.balanceOf(address(this));
                uint distributionSpeed = mul_(currentVolatilityHarvestSpeed, supportedProtocols[current_protocol].sighSpeedRatio );        // current Harvest Speed * Ratio / 1e18
                uint deltaDrip_ = mul(distributionSpeed, deltaBlocks , "dripTotal overflow");
                uint toDrip_ = min(reservoirBalance_, deltaDrip_);
            
                require(reservoirBalance_ != 0, 'Protocol Transfer: The reservoir currently does not have any SIGH Instruments' );
                require(sighInstrument.transfer(current_protocol, toDrip_), 'Protocol Transfer: The transfer did not complete.' );
                
                supportedProtocols[current_protocol].totalDrippedAmount = add(supportedProtocols[current_protocol].totalDrippedAmount , toDrip_,"Overflow");
                supportedProtocols[current_protocol].recentlyDrippedAmount = toDrip_;

                emit Dripped( current_protocol, deltaBlocks, supportedProtocols[ current_protocol ].sighSpeedRatio.mantissa, distributionSpeed , toDrip_ , supportedProtocols[current_protocol].totalDrippedAmount, blockNumber_ ); 
            }
        }
    }
    
  }




// ###############################################################
// ###########   EXTERNAL VIEW functions TO GET STATE   ##########
// ###############################################################

  function getSighAddress() external view returns (address) {
    return address(sighInstrument);
  }

  function getGlobalAddressProvider() external view returns (address) {
    return address(addressesProvider);
  }

  function getSighVolatilityHarvester() external view returns (address) {
    return address(sighVolatilityHarvester);
  }

  function getSIGHVolatilityHarvestingSpeed() external view returns (uint) {
    return sighVolatilityHarvestingSpeed;
  }

  function getSIGHBalance() external view returns (uint) {
    IERC20 sighInstrument_ = sighInstrument;   
    uint balance = sighInstrument_.balanceOf(address(this));
    return balance;
  }
  
  function getSupportedProtocols() external view returns (address[] memory) {
    return storedSupportedProtocols;
  }

  function isThisProtocolSupported(address protocolAddress) external view returns (bool) {
    return supportedProtocols[protocolAddress].isSupported;
  }

  function getSupportedProtocolState(address protocolAddress) external view returns (bool isSupported,uint sighHarvestingSpeedRatio,uint totalDrippedAmount,uint recentlyDrippedAmount ) {
  return (supportedProtocols[protocolAddress].isSupported,
          supportedProtocols[protocolAddress].sighSpeedRatio.mantissa,
          supportedProtocols[protocolAddress].totalDrippedAmount,
          supportedProtocols[protocolAddress].recentlyDrippedAmount  );
  
  }

  function getTotalAmountDistributedToProtocol(address protocolAddress) external view returns (uint) {
    return supportedProtocols[protocolAddress].totalDrippedAmount;
  }

  function getRecentAmountDistributedToProtocol(address protocolAddress) external view returns (uint) {
    return supportedProtocols[protocolAddress].recentlyDrippedAmount;
  }
  
  function getSIGHSpeedRatioForProtocol(address protocolAddress) external view returns (uint) {
      return supportedProtocols[protocolAddress].sighSpeedRatio.mantissa;
  }
  
  function totalProtocolsSupported() external view returns (uint) {
      uint len = storedSupportedProtocols.length;
      return len + 1;
  }
  

  function _isDripAllowed() external view returns (bool) {
      return isDripAllowed; 
  }
  
  function getlastDripBlockNumber() external view returns (uint) {
      return lastDripBlockNumber;
  }

// ###############################################################
// ########### Internal helper functions for safe math ###########
// ###############################################################

  function add(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
    uint c = a + b;
    require(c >= a, errorMessage);
    return c;
  }

  function sub(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
    require(b <= a, errorMessage);
    uint c = a - b;
    return c;
  }

  function mul(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
    if (a == 0) {
      return 0;
    }
    uint c = a * b;
    require(c / a == b, errorMessage);
    return c;
  }

  function mul_(uint a, Exp memory b) pure internal returns (uint) {
      return mul(a, b.mantissa, 'Multiplication error' ) / expScale;
  }


  function min(uint a, uint b) internal pure returns (uint) {
    if (a <= b) {
      return a;
    } else {
      return b;
    }
  }
}
