pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";

import "../IToken.sol";

/**
* @title LendingPoolConfigurator contract
* @author Aave, SIGH Finance (modified by SIGH FINANCE)
* @notice Executes configuration methods on the LendingPoolCore contract. Allows to enable/disable instruments,
* and set different protocol parameters.
**/

contract LendingPoolConfigurator is VersionedInitializable {

    using SafeMath for uint256;
    IGlobalAddressesProvider public globalAddressesProvider;

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

    /**
    * @dev emitted when borrowing is enabled on a instrument
    * @param _instrument the address of the instrument
    **/
    event BorrowingEnabledOnInstrument(address indexed _instrument);
    event BorrowingDisabledOnInstrument(address indexed _instrument);      // emitted when borrowing is disabled on a instrument

    /**
    * @dev emitted when a instrument is enabled as collateral.
    * @param _instrument the address of the instrument
    * @param _ltv the loan to value of the asset when used as collateral
    * @param _liquidationThreshold the threshold at which loans using this asset as collateral will be considered undercollateralized
    * @param _liquidationBonus the bonus liquidators receive to liquidate this asset
    **/
    event InstrumentEnabledAsCollateral(  address indexed _instrument,  uint256 _ltv,  uint256 _liquidationThreshold,  uint256 _liquidationBonus );    
    event InstrumentDisabledAsCollateral(address indexed _instrument);         // emitted when a instrument is disabled as collateral

    event StableRateOnInstrumentSwitched(address indexed _instrument, bool isEnabled);          // emitted when stable rate borrowing is switched on a instrument

    event InstrumentActivated(address indexed _instrument);                    // emitted when a instrument is activated
    event InstrumentDeactivated(address indexed _instrument);                  // emitted when a instrument is deactivated

    event InstrumentFreezeSwitched(address indexed _instrument, bool isFreezed);                      // emitted when a instrument is freezed    

    event InstrumentLiquidationThresholdChanged(address _instrument, uint256 _threshold);     // emitted when a _instrument liquidation threshold is updated
    event InstrumentLiquidationBonusChanged(address _instrument, uint256 _bonus);             // emitted when a _instrument liquidation bonus is updated
    
    event InstrumentInterestRateStrategyChanged(address _instrument, address _strategy);      // emitted when a _instrument interest strategy contract is updated
    event InstrumentBaseLtvChanged(address _instrument, uint256 _ltv);            // emitted when a _instrument loan to value (ltv) is updated


// #############################
// ####### PROXY RELATED #######
// #############################

    uint256 public constant CONFIGURATOR_REVISION = 0x1;

    function getRevision() internal pure returns (uint256) {
        return CONFIGURATOR_REVISION;
    }

    function initialize(IGlobalAddressesProvider _globalAddressesProvider) public initializer {
        globalAddressesProvider = _globalAddressesProvider;
    }

// ########################
// ####### MODIFIER #######
// ########################
    /**
    * @dev only the lending pool manager can call functions affected by this modifier
    **/
    modifier onlyLendingPoolManager {
        require( globalAddressesProvider.getLendingPoolManager() == msg.sender, "The caller must be a lending pool manager" );
        _;
    }

// ################################################################################################
// ####### INITIALIZE A NEW INSTRUMENT (Deploys a new IToken Contract for the INSTRUMENT) #########
// ################################################################################################

    /**
    * @dev initializes an instrument
    * @param _instrument the address of the instrument to be initialized
    * @param _interestRateStrategyAddress the address of the interest rate strategy contract for this instrument
    **/
    function initInstrument( address _instrument, address _interestRateStrategyAddress ) external onlyLendingPoolManager {
        ERC20Detailed asset = ERC20Detailed(_instrument);

        string memory iTokenName = string(abi.encodePacked("SIGH's supported Instrument - ", asset.name()));
        string memory iTokenSymbol = string(abi.encodePacked("i", asset.symbol()));
        uint8 decimals = uint8(asset.decimals());

        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());

        IToken iTokenInstance = new IToken( address(globalAddressesProvider), _instrument, decimals, iTokenName, iTokenSymbol ); // DEPLOYS A NEW ITOKEN CONTRACT
        core.initInstrument( _instrument, address(iTokenInstance), decimals, _interestRateStrategyAddress );
        emit InstrumentInitialized( _instrument, address(iTokenInstance), _interestRateStrategyAddress );
    }

// ###################################################################################################
// ####### FUNCTIONS WHICH INTERACT WITH LENDINGPOOLCORE CONTRACT ####################################
// ####### --> removeInstrument() : REMOVE INSTRUMENT    #####################################
// ####### --> enableBorrowingOnInstrument()   :   BORROWING RELATED  #################################
// ####### --> disableBorrowingOnInstrument()  :   BORROWING RELATED  #################################
// ####### --> enableInstrumentAsCollateral()    :   COLLATERAL RELATED  ##############################
// ####### --> disableInstrumentAsCollateral()   :   COLLATERAL RELATED  ##############################
// ####### --> enableInstrumentStableBorrowRate()    :     STABLE BORROW RATE RELATED  ################
// ####### --> disableInstrumentStableBorrowRate()   :     STABLE BORROW RATE RELATED  ################
// ####### --> activateInstrument()      :      INSTRUMENT ACTIVATION  ################################
// ####### --> deactivateInstrument()    :      INSTRUMENT DE-ACTIVATION  #############################
// ####### --> freezeInstrument()     :      FREEZE INSTRUMENT  #######################################
// ####### --> unfreezeInstrument()   :      UNFREEZE INSTRUMENT  #####################################
// ####### --> setInstrumentBaseLTVasCollateral()    :   SETTING VARIABLES  ###########################
// ####### --> setInstrumentLiquidationThreshold()   :   SETTING VARIABLES  ###########################
// ####### --> setInstrumentLiquidationBonus()       :   SETTING VARIABLES  ###########################
// ####### --> setInstrumentDecimals()               :   SETTING VARIABLES  ###########################
// ####### --> setInstrumentInterestRateStrategyAddress()     : SETTING INTEREST RATE STRATEGY  #######
// ####### --> refreshLendingPoolCoreConfiguration()   :   REFRESH THE ADDRESS OF CORE  ###############
// ###################################################################################################

    // function removeInstrument( address _instrument ) external onlyLendingPoolManager {
    //     ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
    //     require(core.removeInstrument( _instrument ),"Failed to remove instrument" );
    //     emit InstrumentRemoved( _instrument );
    // }

    /**
    * @dev activates/deactivates a _instrument
    * @param _instrument the address of the _instrument
    * @param switch_  true / false to activate / deactivate
    **/
    function instrumentActivationSwitch(address _instrument, bool switch_) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        if (switch_) {
            core.activateInstrument(_instrument);
            emit InstrumentActivated(_instrument);
        }
        else {
            core.deactivateInstrument(_instrument);
            emit InstrumentDeactivated(_instrument);
        }
    }

    /**
    * @dev enables borrowing on a instrument
    * @param _instrument the address of the instrument
    * @param borrowRateSwitch true if stable borrow rate needs to be enabled & false if it needs to be disabled
    **/
    function instrumentBorrowingSwitch(address _instrument, bool borrowRateSwitch) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        if (borrowRateSwitch) {
            core.enableBorrowingOnInstrument(_instrument);
            emit BorrowingEnabledOnInstrument(_instrument);
        }
        else {
            core.disableBorrowingOnInstrument(_instrument);
            emit BorrowingDisabledOnInstrument(_instrument);
        }
    }

    /**
    * @dev switch stable rate borrowing on a instrument
    * @param _instrument the address of the instrument
    * @param switchStableBorrowRate true / false to enable / disable
    **/
    function instrumentStableBorrowRateSwitch(address _instrument,bool switchStableBorrowRate) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        if (switchStableBorrowRate) {
            core.enableInstrumentStableBorrowRate(_instrument);
        }
        else {
            core.disableInstrumentStableBorrowRate(_instrument);
        }
        emit StableRateOnInstrumentSwitched(_instrument, switchStableBorrowRate);        
    }

    /**
    * @dev enables a instrument to be used as collateral
    * @param _instrument the address of the instrument
    * @param _baseLTVasCollateral the loan to value of the asset when used as collateral
    * @param _liquidationThreshold the threshold at which loans using this asset as collateral will be considered undercollateralized
    * @param _liquidationBonus the bonus liquidators receive to liquidate this asset
    **/
    function enableInstrumentAsCollateral( address _instrument, uint256 _baseLTVasCollateral, uint256 _liquidationThreshold, uint256 _liquidationBonus ) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.enableInstrumentAsCollateral( _instrument, _baseLTVasCollateral, _liquidationThreshold, _liquidationBonus );
        emit InstrumentEnabledAsCollateral( _instrument, _baseLTVasCollateral, _liquidationThreshold, _liquidationBonus );
    }

    /**
    * @dev disables a instrument as collateral
    * @param _instrument the address of the instrument
    **/
    function disableInstrumentAsCollateral(address _instrument) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.disableInstrumentAsCollateral(_instrument);
        emit InstrumentDisabledAsCollateral(_instrument);
    }

    /**
    * @dev freezes an _instrument. A freezed _instrument doesn't accept any new deposit, borrow or rate swap, but can accept repayments, liquidations, rate rebalances and redeems
    * @param _instrument the address of the _instrument
    **/
    function instrumentFreezeSwitch(address _instrument, bool switch_) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        if (switch_) {
            core.freezeInstrument(_instrument);
        }
        else {
            core.unfreezeInstrument(_instrument);
        }
        emit InstrumentFreezeSwitched(_instrument,switch_);
    }


    /**
    * @dev emitted when a _instrument loan to value is updated
    * @param _instrument the address of the _instrument
    * @param _ltv the new value for the loan to value
    **/
    function setInstrumentBaseLTVasCollateral(address _instrument, uint256 _ltv) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.setInstrumentBaseLTVasCollateral(_instrument, _ltv);
        emit InstrumentBaseLtvChanged(_instrument, _ltv);
    }

    /**
    * @dev updates the liquidation threshold of a _instrument.
    * @param _instrument the address of the _instrument
    * @param _threshold the new value for the liquidation threshold
    **/
    function setInstrumentLiquidationThreshold(address _instrument, uint256 _threshold) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.setInstrumentLiquidationThreshold(_instrument, _threshold);
        emit InstrumentLiquidationThresholdChanged(_instrument, _threshold);
    }

    /**
    * @dev updates the liquidation bonus of a _instrument
    * @param _instrument the address of the _instrument
    * @param _bonus the new value for the liquidation bonus
    **/
    function setInstrumentLiquidationBonus(address _instrument, uint256 _bonus) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.setInstrumentLiquidationBonus(_instrument, _bonus);
        emit InstrumentLiquidationBonusChanged(_instrument, _bonus);
    }

    /**
    * @dev sets the interest rate strategy of a _instrument
    * @param _instrument the address of the _instrument
    * @param _rateStrategyAddress the new address of the interest strategy contract
    **/
    function setInstrumentInterestRateStrategyAddress(address _instrument, address _rateStrategyAddress) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.setInstrumentInterestRateStrategyAddress(_instrument, _rateStrategyAddress);
        emit InstrumentInterestRateStrategyChanged(_instrument, _rateStrategyAddress);
    }

    // refreshes the lending pool core configuration to update the cached address
    function refreshLendingPoolCoreConfiguration() external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.refreshConfiguration();
    }

//   // refreshes the lending pool configuration to update the cached address
    function refreshLendingPoolConfiguration() external onlyLendingPoolManager {
        ILendingPool lendingPool = ILendingPool(globalAddressesProvider.getLendingPool());
        lendingPool.refreshConfig();
    }

}
