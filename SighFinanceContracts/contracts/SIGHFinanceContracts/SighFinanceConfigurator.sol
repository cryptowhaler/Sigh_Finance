pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";

import "../../configuration/GlobalAddressesProvider.sol";
import "./LendingPoolCore.sol";
import "../IToken.sol";

/**
* @title SighFinanceConfigurator contract
* @author SIGH Finance
* @notice Executes configuration methods on the LendingPoolCore contract, SIGHDistributionHandler and the SighStaking Contract
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

// #####################################################
// ####### SIGH DISTRIBUTION HANDLER FUNCTIONS #########
// #####################################################

    function sigh_instrument(address instrument_) external onlySIGHFinanceManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.Instrument_SIGHed( instrument_ ), "Instrument_SIGHed() execution failed." );
        return true;
    }

    function UNsigh_instrument(address instrument_) external onlySIGHFinanceManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.Instrument_UNSIGHed( instrument_ ), "Instrument_UNSIGHed() execution failed." );
        return true;
    }

    function updateSIGHSpeed(uint newSighSpeed) external onlySIGHFinanceManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.updateSIGHSpeed( newSighSpeed ), "updateSIGHSpeed() execution failed." );
        return true;
    }

    function refreshConfig() external onlySIGHFinanceManager  { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        sigh_distribution_mechanism.refreshConfig() ;
    }

    function updateStakingSpeedForAnInstrument(address instrument_, uint newStakingSpeed) external onlySIGHFinanceManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.updateStakingSpeedForAnInstrument( instrument_, newStakingSpeed ), "updateStakingSpeedForAnInstrument() execution failed." );
        return true;
    }        

    function SpeedUpperCheckSwitch(bool isActivated, uint profitPercentage) external onlySIGHFinanceManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.SpeedUpperCheckSwitch( isActivated, profitPercentage ), "SpeedUpperCheckSwitch() execution failed." );
        return true;
    }        

    function updateDeltaBlocksForSpeedRefresh(uint deltaBlocksLimit) external onlySIGHFinanceManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.updateDeltaBlocksForSpeedRefresh( deltaBlocksLimit ), "updateDeltaBlocksForSpeedRefresh() execution failed." );
        return true;
    } 

// #########################################
// ####### SIGH TREASURY FUNCTIONS #########
// #########################################

    function refreshTreasuryConfig() external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        sigh_treasury.refreshConfig();
    } 

    function changeSIGHBurnAllowed( uint val) external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        sigh_treasury.changeSIGHBurnAllowed(val);
    } 

    function updateSIGHBurnSpeed( uint newSpeed) external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        sigh_treasury.updateSIGHBurnSpeed(newSpeed);
    } 

    function initializeInstrumentDistribution(address targetAddress, address instrumnetToBeDistributed, uint distributionSpeed) external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.initializeInstrumentDistribution(targetAddress, instrumnetToBeDistributed, distributionSpeed),"Instrument Distribution function failed");
    } 

    function changeInstrumentBeingDripped(address targetAddress, address instrumnetToBeDistributed, uint distributionSpeed) external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.changeInstrumentBeingDripped(newInstrumnetToBeDistributed),"Change Instrument being Distributed function failed");
    } 

    function updateDripSpeed( uint newdistributionSpeed ) external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.updateDripSpeed(newdistributionSpeed),"Change Instrument dripping speed function failed");
    } 

   function resetInstrumentDistribution() external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.resetInstrumentDistribution(),"Reset Instrument distribution function failed");
    } 

   function transferSighTo(address target, uint amount) external onlySIGHFinanceManager { 
        ISighTreasury sigh_treasury = ISighTreasury( globalAddressesProvider.getSIGHTreasury() );
        require(sigh_treasury.transferSighTo(target, amount),"Transfer SIGH from the treasury function failed");
    } 

// #########################################
// ####### SIGH STAKING FUNCTIONS ##########
// #########################################

   function supportNewInstrumentForDistribution(address instrument, uint speed) external onlySIGHFinanceManager { 
        ISighStaking sigh_staking = ISighStaking( globalAddressesProvider.getSIGHStaking() );
        require(sigh_staking.supportNewInstrumentForDistribution(instrument, speed),"Addition of new instrument as SIGH Staking reward failed");
    } 

   function setDistributionSpeedForStakingReward(address instrument, uint speed) external onlySIGHFinanceManager { 
        ISighStaking sigh_staking = ISighStaking( globalAddressesProvider.getSIGHStaking() );
        require(sigh_staking.setDistributionSpeed(instrument, speed),"Updating distribution speed for SIGH Staking reward failed");
    } 

   function updateMaxSighThatCanBeStaked( uint amount) external onlySIGHFinanceManager { 
        ISighStaking sigh_staking = ISighStaking( globalAddressesProvider.getSIGHStaking() );
        require(sigh_staking.updateMaxSighThatCanBeStaked(amount),"Updating Maximum SIGH Staking limit failed");
    } 

}
