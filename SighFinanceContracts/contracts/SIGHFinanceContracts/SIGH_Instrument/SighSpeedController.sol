pragma solidity ^0.5.16;

/**
 * @title Sigh Speed Controller Contract
 * @notice Distributes a token to a different contract at a fixed rate.
 * @dev This contract must be poked via the `drip()` function every so often.
 * @author SighFinance
 */

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol"; 
import "../Interfaces/ISighSpeedController.sol";
import "../../configuration/IGlobalAddressesProvider.sol";

import "../Interfaces/ISighDistributionHandler.sol"; 

contract SighSpeedController is ISighSpeedController {

  IGlobalAddressesProvider private addressesProvider;

  IERC20 private sighInstrument;                                         // SIGH INSTRUMENT CONTRACT
  ISighDistributionHandler private sighDistributionHandlerContract;      // SIGH DISTRIBUTION HANDLER CONTRACT
  address private treasuryAddress;                                       // SIGH TREASURY ADDRESS

  bool private isDripAllowed = false;  
  uint private lastDripBlockNumber;    
  
  Exp private treasurySpeedRatio = Exp({ mantissa: 50e18 });
    
  struct protocolState {
    bool isSupported;
    uint distributionSpeed;
    uint totalDrippedAmount;
    uint recentlyDrippedAmount;
  }

  mapping (address => protocolState) private supportedProtocols;
  address[] private storedSupportedProtocols; 

   uint private totalDrippedToTreasury;                 // TOTAL $SIGH DRIPPED TO TREASURY
   uint private recentlyDrippedToTreasury;              // $SIGH RECENTLY DRIPPED TO TREASURY

    struct Exp {
        uint mantissa;
    }

// ########################
// ####### EVENTS #########
// ########################

  event DistributionInitialized(uint blockNumber);
  event TreasurySpeedRatioUpdated(uint newTreasurySpeedRatio );

  event NewProtocolSupported (address protocolAddress, uint sighSpeed, uint totalDrippedAmount, uint blockNumber);
  event ProtocolRemoved(address protocolAddress, uint totalDrippedToProtocol, uint blockNumber);
  
  event DistributionSpeedChanged(address protocolAddress, uint prevSpeed , uint newSpeed, uint blockNumber );  
  event Dripped(address protocolAddress, uint deltaBlocks, uint distributionSpeed, uint AmountDripped, uint totalAmountDripped, uint blockNumber ); 
  event DrippedToTreasury(address treasuryAddress,uint deltaBlocks,uint treasuryDistributionSpeed,uint recentlyDrippedToTreasury ,uint totalDrippedToTreasury,uint blockNumber_ ); 

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

  /**
    * @notice Constructs a Reservoir
    * @param sighInstrument_ The token to drip
    * @param _addressesProvider The global addresses provider
    */
  constructor(address sighInstrument_, address _addressesProvider ) public {
    sighInstrument = IERC20(sighInstrument_);
    addressesProvider = IGlobalAddressesProvider(_addressesProvider);
    require(address(sighInstrument) == sighInstrument_, " SIGH Instrument not initialized Properly ");
    require(address(addressesProvider) == _addressesProvider, " AddressesProvider not initialized Properly ");
    
  }


// #############################################################################################
// ###########   SIGH DISTRIBUTION : INITIALIZED DRIPPING (Can be called only once)   ##########
// #############################################################################################

  function beginDripping ( address treasuryAddress_, address sighDistributionHandler_ ) external onlySighFinanceConfigurator returns (bool) {
    require(!isDripAllowed,"Dripping can only be initialized once");
    require(treasuryAddress_ != address(0),"Treasury Address not valid");
    require(sighDistributionHandler_ != address(0),"Treasury Address not valid");

    isDripAllowed = true;
    treasuryAddress = treasuryAddress_;
    sighDistributionHandlerContract = ISighDistributionHandler(sighDistributionHandler_);

    lastDripBlockNumber = block.number;

    emit DistributionInitialized( lastDripBlockNumber );
    return true;
  }

  function setTreasurySpeedRatio(uint newRatio) external onlySighFinanceConfigurator returns (bool) {
    require( 1e18 <= newRatio <=100e18,"Dripping can only be initialized once");
    treasurySpeedRatio = Exp({mantissa: newRatio });  
    emit TreasurySpeedRatioUpdated( treasurySpeedRatio.mantissa );
    return true;
  }

// ############################################################################################################
// ###########   SIGH DISTRIBUTION : ADDING / REMOVING NEW PROTOCOL WHICH WILL RECEIVE SIGH INSTRUMENTS   ##########
// ############################################################################################################

  function supportNewProtocol( address newProtocolAddress, uint sighSpeed ) external onlySighFinanceConfigurator returns (bool)  {
    require (!supportedProtocols[newProtocolAddress].isSupported, 'This Protocol is already supported by the Sigh Speed Controller');

    if (isDripAllowed) {
        dripInternal();
    }
    
    storedSupportedProtocols.push(newProtocolAddress);                              // ADDED TO THE LIST
    
    if ( supportedProtocols[newProtocolAddress].totalDrippedAmount > 0 ) {
        supportedProtocols[newProtocolAddress].isSupported = true;
        supportedProtocols[newProtocolAddress].distributionSpeed = sighSpeed;
    }
    else {
        supportedProtocols[newProtocolAddress] = protocolState({ isSupported: true, distributionSpeed: sighSpeed, totalDrippedAmount: uint(0), recentlyDrippedAmount: uint(0) });
    }
    
    lastDripBlockNumber = block.number; // EITHER THIS WAS ALREADY DONE IN DRIPINTERNAL() OR WE DO IT HERE IF DRIPPING IS NOT ALLOWED AND A PROTOCOL IS BEING ADDED
    require (supportedProtocols[newProtocolAddress].isSupported, 'Error occured when adding the new protocol');
    require (supportedProtocols[newProtocolAddress].distributionSpeed == sighSpeed, 'SIGH Speed for the new protocol was not initialized properly.');
    
    emit NewProtocolSupported(newProtocolAddress, supportedProtocols[newProtocolAddress].distributionSpeed, supportedProtocols[newProtocolAddress].totalDrippedAmount, block.number);
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
    supportedProtocols[protocolAddress_].distributionSpeed = 0;
    require (supportedProtocols[protocolAddress_].isSupported == false, 'Error occured when removing the protocol.');
    require (supportedProtocols[protocolAddress_].distributionSpeed == 0, 'SIGH Speed was not properly assigned to 0.');

    emit ProtocolRemoved( protocolAddress_,  supportedProtocols[protocolAddress_].totalDrippedAmount,  block.number );
    return true;
  }
  
// ######################################################################################
// ###########   SIGH DISTRIBUTION : FUNCTIONS TO UPDATE DISTRIBUTION SPEEDS   ##########
// ######################################################################################

  function changeProtocolSIGHSpeed (address targetAddress, uint newSpeed_) external onlySighFinanceConfigurator returns (bool) {
    require(supportedProtocols[targetAddress].isSupported,'The Protocol is not Supported by the Sigh Speed Controller' );
    if (isDripAllowed) {
        dripInternal();
    }
    uint prevSpeed = supportedProtocols[targetAddress].distributionSpeed;
    supportedProtocols[targetAddress].distributionSpeed = newSpeed_;

    require(supportedProtocols[targetAddress].distributionSpeed == newSpeed_, " Protocol's SIGH speed was not properly updated");
    emit DistributionSpeedChanged(targetAddress, prevSpeed , supportedProtocols[targetAddress].distributionSpeed, block.number );
    return true;
  }


// #####################################################################
// ###########   SIGH DISTRIBUTION FUNCTION - DRIP FUNCTION   ##########
// #####################################################################

  /**
    * @notice Drips the maximum amount of sighInstruments to match the drip rate since inception
    * @dev Note: this will only drip up to the amount of sighInstruments available.
    */
  function drip() public {
    require(isDripAllowed,'Dripping has not been initialized by the SIGH Finance Manager');    
    dripInternal();
    dripToTreasuryInternal();
  }

  function dripToTreasuryInternal() internal {
    if ( treasuryAddress == address(0) || address(sighDistributionHandlerContract) == address(0) ) {
      return true;
    }
    if (lastDripBlockNumber == block.number) {
        return;
    }

    uint treasuryDistributionSpeed = sighDistributionHandlerContract.getSIGHSpeedUsed();

      
    IERC20 sighInstrument_ = sighInstrument;
    
    uint blockNumber_ = block.number;
    uint reservoirBalance_ = sighInstrument_.balanceOf(address(this)); 
    uint deltaBlocks = sub(blockNumber_,lastDripBlockNumber,"Delta Blocks gave error");
                                    
    uint deltaDrip_ = mul(treasuryDistributionSpeed, deltaBlocks , "dripTotal overflow");
    uint toDrip_ = min(reservoirBalance_, deltaDrip_);
            
    require(reservoirBalance_ != 0, 'Protocol Transfer: The reservoir currently does not have any SIGH Instruments' );
    require(sighInstrument_.transfer(treasuryAddress, toDrip_), 'Protocol Transfer: The transfer did not complete.' );
                
    totalDrippedToTreasury = add(totalDrippedToTreasury,toDrip_,"Overflow");
    recentlyDrippedToTreasury = toDrip_;

    emit DrippedToTreasury( treasuryAddress, deltaBlocks, treasuryDistributionSpeed, recentlyDrippedToTreasury , totalDrippedToTreasury, blockNumber_ ); 
  }

  
  function dripInternal() internal {
     
    if (lastDripBlockNumber == block.number) {
        return;
    }
      
    IERC20 sighInstrument_ = sighInstrument;
    
    address[] memory protocols = storedSupportedProtocols;
    uint length = protocols.length;
    uint reservoirBalance_; 
    uint blockNumber_ = block.number;
    uint deltaBlocks = sub(blockNumber_,lastDripBlockNumber,"Delta Blocks gave error");
    
    if (length > 0) {
        
        for ( uint i=0; i < length; i++) {
            address current_protocol = protocols[i];
            
            if ( supportedProtocols[ current_protocol ].isSupported ) {
                
                reservoirBalance_ = sighInstrument_.balanceOf(address(this));
                uint deltaDrip_ = mul(supportedProtocols[ current_protocol ].distributionSpeed, deltaBlocks , "dripTotal overflow");
                uint toDrip_ = min(reservoirBalance_, deltaDrip_);
            
                require(reservoirBalance_ != 0, 'Protocol Transfer: The reservoir currently does not have any SIGH Instruments' );
                require(sighInstrument_.transfer(current_protocol, toDrip_), 'Protocol Transfer: The transfer did not complete.' );
                
                uint prevDrippedAmount = supportedProtocols[current_protocol].totalDrippedAmount;
                supportedProtocols[current_protocol].totalDrippedAmount = add(prevDrippedAmount,toDrip_,"Overflow");
                supportedProtocols[current_protocol].recentlyDrippedAmount = toDrip_;

                emit Dripped( current_protocol, deltaBlocks, supportedProtocols[ current_protocol ].distributionSpeed, toDrip_ , supportedProtocols[current_protocol].totalDrippedAmount, blockNumber_ ); 
            }
        }
    }
    
    lastDripBlockNumber = block.number;
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

  function getSupportedProtocolState(address protocolAddress) external view returns (bool isSupported,uint distributionSpeed,uint totalDrippedAmount,uint recentlyDrippedAmount ) {
  return (supportedProtocols[protocolAddress].isSupported,
          supportedProtocols[protocolAddress].distributionSpeed,
          supportedProtocols[protocolAddress].totalDrippedAmount,
          supportedProtocols[protocolAddress].recentlyDrippedAmount  );
  
  }

  function getTotalAmountDistributedToProtocol(address protocolAddress) external view returns (uint) {
    return supportedProtocols[protocolAddress].totalDrippedAmount;
  }

  function getRecentAmountDistributedToProtocol(address protocolAddress) external view returns (uint) {
    return supportedProtocols[protocolAddress].recentlyDrippedAmount;
  }
  
  function getSIGHSpeedForProtocol(address protocolAddress) external view returns (uint) {
      return supportedProtocols[protocolAddress].distributionSpeed;
  }
  
  function totalProtocolsSupported() external view returns (uint) {
      uint len = storedSupportedProtocols.length;
      return len;
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
      return mul_(a, b.mantissa) / expScale;
  }


  function min(uint a, uint b) internal pure returns (uint) {
    if (a <= b) {
      return a;
    } else {
      return b;
    }
  }
}
