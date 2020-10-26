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
    modifier onlySIGHMechanismManager {
        require( globalAddressesProvider.getSIGHMechanismManager() == msg.sender, "The caller must be the SIGH Mechanism Manager" );
        _;
    }

// ################################################################################################
// ####### INITIALIZE A NEW INSTRUMENT (Deploys a new IToken Contract for the INSTRUMENT) #########
// ################################################################################################

    function sigh_instrument(address instrument_) external onlySIGHMechanismManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.Instrument_SIGHed( instrument_ ), "Instrument_SIGHed() execution failed." );
        return true;
    }

    function UNsigh_instrument(address instrument_) external onlySIGHMechanismManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.Instrument_UNSIGHed( instrument_ ), "Instrument_UNSIGHed() execution failed." );
        return true;
    }

    function updateSIGHSpeed(uint newSighSpeed) external onlySIGHMechanismManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.updateSIGHSpeed( newSighSpeed ), "updateSIGHSpeed() execution failed." );
        return true;
    }

    function refreshConfig() external onlySIGHMechanismManager  { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        sigh_distribution_mechanism.refreshConfig() ;
    }

    function updateStakingSpeedForAnInstrument(address instrument_, uint newStakingSpeed) external onlySIGHMechanismManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.updateStakingSpeedForAnInstrument( instrument_, newStakingSpeed ), "updateStakingSpeedForAnInstrument() execution failed." );
        return true;
    }        

    function SpeedUpperCheckSwitch(bool isActivated, uint profitPercentage) external onlySIGHMechanismManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.SpeedUpperCheckSwitch( isActivated, profitPercentage ), "SpeedUpperCheckSwitch() execution failed." );
        return true;
    }        

    function updateDeltaBlocksForSpeedRefresh(uint deltaBlocksLimit) external onlySIGHMechanismManager return bool { 
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );
        require(sigh_distribution_mechanism.updateDeltaBlocksForSpeedRefresh( deltaBlocksLimit ), "updateDeltaBlocksForSpeedRefresh() execution failed." );
        return true;
    } 







}
