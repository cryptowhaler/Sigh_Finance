pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "../openzeppelin-upgradeability/VersionedInitializable.sol";

import "../configuration/GlobalAddressesProvider.sol";
import "./Interfaces/ISIGHVolatilityHarvester.sol";
import "./Interfaces/ISighTreasury.sol";
import "./Interfaces/ISighStaking.sol";
import "./Interfaces/ISighSpeedController.sol";

/**
* @title SighFinanceConfigurator contract
* @author SIGH Finance
* @notice Executes configuration methods for SIGH FINANCE contract, SIGHVolatilityHarvester and the SighStaking Contract
* to efficiently regulate the SIGH economics
**/

contract SighFinanceConfigurator is VersionedInitializable {

    using SafeMath for uint256;
    GlobalAddressesProvider public globalAddressesProvider;

// ######################
// ####### EVENTS #######
// ######################

    /**
    * @dev emitted when a instrument is initialized.
    * @param _instrument the address of the instrument
    * @param _iToken the address of the overlying iToken contract
    * @param _interestRateStrategyAddress the address of the interest rate strategy for the instrument
    **/
    event InstrumentInitialized( address indexed _instrument, address indexed _iToken, address _interestRateStrategyAddress );
    event InstrumentRemoved( address indexed _instrument);      // emitted when a instrument is removed.


// #############################
// ####### PROXY RELATED #######
// #############################

    uint256 public constant CONFIGURATOR_REVISION = 0x1;

    function getRevision() internal pure returns (uint256) {
        return CONFIGURATOR_REVISION;
    }

    function initialize(GlobalAddressesProvider _globalAddressesProvider) public initializer {
        globalAddressesProvider = _globalAddressesProvider;
    }

// ########################
// ####### MODIFIER #######
// ########################
    /**
    * @dev only the lending pool manager can call functions affected by this modifier
    **/
    modifier onlySIGHFinanceManager {
        require( globalAddressesProvider.getSIGHFinanceManager() == msg.sender, "The caller must be the SIGH Mechanism Manager" );
        _;
    }


// #################################################
// ####### SIGH SPEED CONTROLLER FUNCTIONS #########
// #################################################

    // CALLED ONLY ONCE
    function beginDrippingFromSIGHSpeedController() external onlySIGHFinanceManager returns (bool) { 
        ISighSpeedController sigh_speed_Controller = ISighSpeedController( globalAddressesProvider.getSIGHSpeedController() );
        require(sigh_speed_Controller.beginDripping(globalAddressesProvider.getSIGHVolatilityHarvester() ), "SIGH Dripping initialization from SIGH Speed Controller failed." );
        return true;
    }

    function updateSighVolatilityDistributionSpeedInSIGHSpeedController(uint newSpeed_) external onlySIGHFinanceManager returns (bool) { 
        ISighSpeedController sigh_speed_Controller = ISighSpeedController( globalAddressesProvider.getSIGHSpeedController() );
        require(sigh_speed_Controller.updateSighVolatilityDistributionSpeed(newSpeed_), " SIGH Volatility Distribution Speed update in SIGH Speed Controller failed." );
        return true;
    }    

    function supportNewProtocolInSIGHSpeedController( address newProtocolAddress, uint sighSpeedRatio ) external onlySIGHFinanceManager returns (bool) { 
        ISighSpeedController sigh_speed_Controller = ISighSpeedController( globalAddressesProvider.getSIGHSpeedController() );
        require(sigh_speed_Controller.supportNewProtocol(newProtocolAddress, sighSpeedRatio), "New Protocol addition to SIGH Speed Controller failed." );
        return true;
    }
    
    function removeSupportedProtocolFromSIGHSpeedController(address protocolAddress_) external onlySIGHFinanceManager returns (bool) { 
        ISighSpeedController sigh_speed_Controller = ISighSpeedController( globalAddressesProvider.getSIGHSpeedController() );
        require(sigh_speed_Controller.removeSupportedProtocol(protocolAddress_), " Protocol removal from SIGH Speed Controller failed." );
        return true;
    }    

    function changeProtocolSIGHSpeedRatioInSIGHSpeedController(address targetAddress, uint newRatio_) external onlySIGHFinanceManager returns (bool) { 
        ISighSpeedController sigh_speed_Controller = ISighSpeedController( globalAddressesProvider.getSIGHSpeedController() );
        require(sigh_speed_Controller.changeProtocolSIGHSpeedRatio(targetAddress, newRatio_), " Protocol SIGH Distribution Ratio speed update in SIGH Speed Controller failed." );
        return true;
    }    


// #####################################################_24HrVolatilityLimitAmount
// ####### SIGH DISTRIBUTION HANDLER FUNCTIONS #########
// #####################################################

    function refreshSIGHVolatilityHarvesterConfig() external onlySIGHFinanceManager  { 
        ISIGHVolatilityHarvester sigh_volatilitiy_harvester = ISIGHVolatilityHarvester( globalAddressesProvider.getSIGHVolatilityHarvester() );
        sigh_volatilitiy_harvester.refreshConfig() ;
    }

    function instrument__SIGH_StateUpdated_Distribution_Handler(address instrument_,  uint _bearSentiment,uint _bullSentiment, bool _isSIGHMechanismActivated ) external onlySIGHFinanceManager returns (bool) { 
        ISIGHVolatilityHarvester sigh_volatilitiy_harvester = ISIGHVolatilityHarvester( globalAddressesProvider.getSIGHVolatilityHarvester() );
        require(sigh_volatilitiy_harvester.Instrument_SIGH_StateUpdated( instrument_, _bearSentiment, _bullSentiment, _isSIGHMechanismActivated ), "Instrument_SIGH_StateUpdated() execution failed." );
        return true;
    }

    function updateSIGHSpeed_In_SIGH_Distribution_Handler(uint newSighSpeed) external onlySIGHFinanceManager returns (bool) { 
        ISIGHVolatilityHarvester sigh_volatilitiy_harvester = ISIGHVolatilityHarvester( globalAddressesProvider.getSIGHVolatilityHarvester() );
        require(sigh_volatilitiy_harvester.updateSIGHSpeed( newSighSpeed ), "updateSIGHSpeed() execution failed." );
        return true;
    }


    function updateStakingSpeedForAnInstrument_In_SIGH_Distribution_Handler(address instrument_, uint newStakingSpeed) external onlySIGHFinanceManager returns (bool) { 
        ISIGHVolatilityHarvester sigh_volatilitiy_harvester = ISIGHVolatilityHarvester( globalAddressesProvider.getSIGHVolatilityHarvester() );
        require(sigh_volatilitiy_harvester.updateStakingSpeedForAnInstrument( instrument_, newStakingSpeed ), "updateStakingSpeedForAnInstrument() execution failed." );
        return true;
    }        

    function UpdateCryptoMarketSentiment_In_SIGH_Distribution_Handler( uint maxVolatilityProtocolLimit_) external onlySIGHFinanceManager returns (bool) { 
        ISIGHVolatilityHarvester sigh_volatilitiy_harvester = ISIGHVolatilityHarvester( globalAddressesProvider.getSIGHVolatilityHarvester() );
        require(sigh_volatilitiy_harvester.updateCryptoMarketSentiment( maxVolatilityProtocolLimit_ ), "updateCryptoMarketSentiment() execution failed." );
        return true;
    }        

    function updateDeltaBlocksForSpeedRefresh_In_SIGH_Distribution_Handler(uint deltaBlocksLimit) external onlySIGHFinanceManager returns (bool) { 
        ISIGHVolatilityHarvester sigh_volatilitiy_harvester = ISIGHVolatilityHarvester( globalAddressesProvider.getSIGHVolatilityHarvester() );
        require(sigh_volatilitiy_harvester.updateDeltaBlocksForSpeedRefresh( deltaBlocksLimit ), "updateDeltaBlocksForSpeedRefresh() execution failed." );
        return true;
    } 

// #########################################
// ####### SIGH TREASURY FUNCTIONS #########
// #########################################

    function initializeInstrumentStateInSIGHTreasury(address instrument) external onlySIGHFinanceManager {
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.initializeInstrumentState(instrument),"Instrument initialization failed");
        
    }

    function refreshConfigInSIGHTreasury() external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.refreshConfig(),"Failed to refresh");
    } 
    
    function switchSIGHBurnAllowedInSIGHTreasury() external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.switchSIGHBurnAllowed(),"Switching SIGH Burn in Treasury Failed");
    } 

    function updateSIGHBurnSpeedInSIGHTreasury( uint newSpeed) external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.updateSIGHBurnSpeed(newSpeed),"Failed to update SIGH burn speed");
    } 

    function initializeInstrumentDistributionInSIGHTreasury(address targetAddress, address instrumnetToBeDistributed, uint distributionSpeed) external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.initializeInstrumentDistribution(targetAddress, instrumnetToBeDistributed, distributionSpeed),"Instrument Distribution function failed");
    } 

    function changeInstrumentBeingDrippedInSIGHTreasury(address instrumentToBeDistributed ) external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.changeInstrumentBeingDripped(instrumentToBeDistributed),"Change Instrument being Distributed function failed");
    } 

    function updateDripSpeedInSIGHTreasury( uint newdistributionSpeed ) external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.updateDripSpeed(newdistributionSpeed),"Change Instrument dripping speed function failed");
    } 

   function resetInstrumentDistributionInSIGHTreasury() external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.resetInstrumentDistribution(),"Reset Instrument distribution function failed");
    } 

   function transferSighFromSIGHTreasury(address target, uint amount) external onlySIGHFinanceManager returns (uint){ 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        uint sighTransferred = sigh_treasury.transferSighTo(target, amount);
        return sighTransferred;
    } 

// #########################################
// ####### SIGH STAKING FUNCTIONS ##########
// #########################################

   function supportNewInstrumentForDistributionInSIGH_Staking(address instrument, uint speed) external onlySIGHFinanceManager { 
        ISighStaking sigh_staking = ISighStaking( globalAddressesProvider.getSIGHStaking() );
        require(sigh_staking.supportNewInstrumentForDistribution(instrument, speed),"Addition of new instrument as SIGH Staking reward failed");
    } 

   function removeInstrumentFromDistributionInSIGH_Staking(address instrument ) external onlySIGHFinanceManager { 
        ISighStaking sigh_staking = ISighStaking( globalAddressesProvider.getSIGHStaking() );
        require(sigh_staking.removeInstrumentFromDistribution(instrument ),"Removing the instrument as a SIGH Staking reward failed");
    } 

   function setDistributionSpeedForStakingRewardInSIGH_Staking(address instrument, uint speed) external onlySIGHFinanceManager { 
        ISighStaking sigh_staking = ISighStaking( globalAddressesProvider.getSIGHStaking() );
        require(sigh_staking.setDistributionSpeed(instrument, speed),"Updating distribution speed for SIGH Staking reward failed");
    } 

   function updateMaxSighThatCanBeStakedInSIGH_Staking( uint amount) external onlySIGHFinanceManager { 
        ISighStaking sigh_staking = ISighStaking( globalAddressesProvider.getSIGHStaking() );
        require(sigh_staking.updateMaxSighThatCanBeStaked(amount),"Updating Maximum SIGH Staking limit failed");
    } 

}
