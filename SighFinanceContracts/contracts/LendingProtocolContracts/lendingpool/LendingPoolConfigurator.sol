pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";

import "../../configuration/GlobalAddressesProvider.sol";
import "./LendingPoolCore.sol";
import "../IToken.sol";

/**
* @title LendingPoolConfigurator contract
* @author Aave, SIGH Finance (modified by SIGH FINANCE)
* @notice Executes configuration methods on the LendingPoolCore contract. Allows to enable/disable instruments,
* and set different protocol parameters.
**/

contract LendingPoolConfigurator is VersionedInitializable {

    using SafeMath for uint256;
    GlobalAddressesProvider public poolAddressesProvider;

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
    * @param _stableRateEnabled true if stable rate borrowing is enabled, false otherwise
    **/
    event BorrowingEnabledOnInstrument(address _instrument, bool _stableRateEnabled);
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

    event StableRateEnabledOnInstrument(address indexed _instrument);          // emitted when stable rate borrowing is enabled on a instrument
    event StableRateDisabledOnInstrument(address indexed _instrument);         // emitted when stable rate borrowing is disabled on a instrument

    event InstrumentActivated(address indexed _instrument);                    // emitted when a instrument is activated
    event InstrumentDeactivated(address indexed _instrument);                  // emitted when a instrument is deactivated

    event InstrumentFreezed(address indexed _instrument);                      // emitted when a instrument is freezed    
    event InstrumentUnfreezed(address indexed _instrument);                    // emitted when a instrument is unfreezed


    event InstrumentLiquidationThresholdChanged(address _instrument, uint256 _threshold);     // emitted when a _instrument liquidation threshold is updated
    event InstrumentLiquidationBonusChanged(address _instrument, uint256 _bonus);             // emitted when a _instrument liquidation bonus is updated
    
    event InstrumentDecimalsChanged(address _instrument, uint256 _decimals);                  // emitted when the _instrument decimals are updated
    event InstrumentInterestRateStrategyChanged(address _instrument, address _strategy);      // emitted when a _instrument interest strategy contract is updated
    event InstrumentBaseLtvChanged(address _instrument, uint256 _ltv);            // emitted when a _instrument loan to value (ltv) is updated


// #############################
// ####### PROXY RELATED #######
// #############################

    uint256 public constant CONFIGURATOR_REVISION = 0x3;

    function getRevision() internal pure returns (uint256) {
        return CONFIGURATOR_REVISION;
    }

    function initialize(GlobalAddressesProvider _poolAddressesProvider) public initializer {
        poolAddressesProvider = _poolAddressesProvider;
    }

// ########################
// ####### MODIFIER #######
// ########################
    /**
    * @dev only the lending pool manager can call functions affected by this modifier
    **/
    modifier onlyLendingPoolManager {
        require( poolAddressesProvider.getLendingPoolManager() == msg.sender, "The caller must be a lending pool manager" );
        _;
    }

// ################################################################################################
// ####### INITIALIZE A NEW INSTRUMENT (Deploys a new IToken Contract for the INSTRUMENT) #########
// ################################################################################################

    /**
    * @dev initializes an instrument
    * @param _instrument the address of the instrument to be initialized
    * @param _underlyingAssetDecimals the decimals of the instrument underlying asset
    * @param _interestRateStrategyAddress the address of the interest rate strategy contract for this instrument
    **/
    function initInstrument( address _instrument, uint8 _underlyingAssetDecimals, address _interestRateStrategyAddress ) external onlyLendingPoolManager {
        ERC20Detailed asset = ERC20Detailed(_instrument);

        string memory iTokenName = string(abi.encodePacked("SIGH's supported Instrument - ", asset.name()));
        string memory iTokenSymbol = string(abi.encodePacked("i", asset.symbol()));

        initInstrumentWithData(  _instrument,  iTokenName,  iTokenSymbol,  _underlyingAssetDecimals,  _interestRateStrategyAddress );
    }

    /**
    * @dev initializes a instrument using iTokenData provided externally (useful if the underlying ERC20 contract doesn't expose name or decimals)
    * @param _instrument the address of the instrument to be initialized
    * @param _iTokenName the name of the iToken contract
    * @param _iTokenSymbol the symbol of the iToken contract
    * @param _underlyingAssetDecimals the decimals of the instrument underlying asset
    * @param _interestRateStrategyAddress the address of the interest rate strategy contract for this instrument
    **/
    function initInstrumentWithData(  address _instrument,  string memory _iTokenName,  string memory _iTokenSymbol,  uint8 _underlyingAssetDecimals,  address _interestRateStrategyAddress ) public onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());

        IToken iTokenInstance = new IToken( poolAddressesProvider, _instrument, _underlyingAssetDecimals, _iTokenName, _iTokenSymbol ); // DEPLOYS A NEW ITOKEN CONTRACT
        core.initInstrument( _instrument, address(iTokenInstance), _underlyingAssetDecimals, _interestRateStrategyAddress );

        emit InstrumentInitialized( _instrument, address(iTokenInstance), _interestRateStrategyAddress );
    }

// ###################################################################################################
// ####### FUNCTIONS WHICH INTERACT WITH LENDINGPOOLCORE CONTRACT ####################################
// ####### --> removeLastAddedInstrument() : REMOVE INSTRUMENT    #####################################
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

    /**
    * @dev removes the last added instrument in the list of the instruments
    * @param _instrumentToRemove the address of the instrument
    **/
    function removeLastAddedInstrument( address _instrumentToRemove) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.removeLastAddedInstrument(_instrumentToRemove);
        emit InstrumentRemoved(_instrumentToRemove);
    }

    /**
    * @dev enables borrowing on a instrument
    * @param _instrument the address of the instrument
    * @param _stableBorrowRateEnabled true if stable borrow rate needs to be enabled by default on this instrument
    **/
    function enableBorrowingOnInstrument(address _instrument, bool _stableBorrowRateEnabled) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.enableBorrowingOnInstrument(_instrument, _stableBorrowRateEnabled);
        emit BorrowingEnabledOnInstrument(_instrument, _stableBorrowRateEnabled);
    }

    /**
    * @dev disables borrowing on a instrument
    * @param _instrument the address of the instrument
    **/
    function disableBorrowingOnInstrument(address _instrument) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.disableBorrowingOnInstrument(_instrument);
        emit BorrowingDisabledOnInstrument(_instrument);
    }

    /**
    * @dev enables a instrument to be used as collateral
    * @param _instrument the address of the instrument
    * @param _baseLTVasCollateral the loan to value of the asset when used as collateral
    * @param _liquidationThreshold the threshold at which loans using this asset as collateral will be considered undercollateralized
    * @param _liquidationBonus the bonus liquidators receive to liquidate this asset
    **/
    function enableInstrumentAsCollateral( address _instrument, uint256 _baseLTVasCollateral, uint256 _liquidationThreshold, uint256 _liquidationBonus ) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.enableInstrumentAsCollateral( _instrument, _baseLTVasCollateral, _liquidationThreshold, _liquidationBonus );
        emit InstrumentEnabledAsCollateral( _instrument, _baseLTVasCollateral, _liquidationThreshold, _liquidationBonus );
    }

    /**
    * @dev disables a instrument as collateral
    * @param _instrument the address of the instrument
    **/
    function disableInstrumentAsCollateral(address _instrument) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.disableInstrumentAsCollateral(_instrument);
        emit InstrumentDisabledAsCollateral(_instrument);
    }

    /**
    * @dev enable stable rate borrowing on a instrument
    * @param _instrument the address of the instrument
    **/
    function enableInstrumentStableBorrowRate(address _instrument) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.enableInstrumentStableBorrowRate(_instrument);
        emit StableRateEnabledOnInstrument(_instrument);
    }

    /**
    * @dev disable stable rate borrowing on a _instrument
    * @param _instrument the address of the _instrument
    **/
    function disableInstrumentStableBorrowRate(address _instrument) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.disableInstrumentStableBorrowRate(_instrument);
        emit StableRateDisabledOnInstrument(_instrument);
    }

    /**
    * @dev activates a _instrument
    * @param _instrument the address of the _instrument
    **/
    function activateInstrument(address _instrument) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.activateInstrument(_instrument);
        emit InstrumentActivated(_instrument);
    }

    /**
    * @dev deactivates a _instrument
    * @param _instrument the address of the _instrument
    **/
    function deactivateInstrument(address _instrument) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        require(core.getInstrumentTotalLiquidity(_instrument) == 0, "The liquidity of the Instrument needs to be 0");
        core.deactivateInstrument(_instrument);
        emit InstrumentDeactivated(_instrument);
    }

    /**
    * @dev freezes an _instrument. A freezed _instrument doesn't accept any new deposit, borrow or rate swap, but can accept repayments, liquidations, rate rebalances and redeems
    * @param _instrument the address of the _instrument
    **/
    function freezeInstrument(address _instrument) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.freezeInstrument(_instrument);
        emit InstrumentFreezed(_instrument);
    }

    /**
    * @dev unfreezes a _instrument
    * @param _instrument the address of the _instrument
    **/
    function unfreezeInstrument(address _instrument) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.unfreezeInstrument(_instrument);
        emit InstrumentUnfreezed(_instrument);
    }

    /**
    * @dev emitted when a _instrument loan to value is updated
    * @param _instrument the address of the _instrument
    * @param _ltv the new value for the loan to value
    **/
    function setInstrumentBaseLTVasCollateral(address _instrument, uint256 _ltv) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.setInstrumentBaseLTVasCollateral(_instrument, _ltv);
        emit InstrumentBaseLtvChanged(_instrument, _ltv);
    }

    /**
    * @dev updates the liquidation threshold of a _instrument.
    * @param _instrument the address of the _instrument
    * @param _threshold the new value for the liquidation threshold
    **/
    function setInstrumentLiquidationThreshold(address _instrument, uint256 _threshold) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.setInstrumentLiquidationThreshold(_instrument, _threshold);
        emit InstrumentLiquidationThresholdChanged(_instrument, _threshold);
    }

    /**
    * @dev updates the liquidation bonus of a _instrument
    * @param _instrument the address of the _instrument
    * @param _bonus the new value for the liquidation bonus
    **/
    function setInstrumentLiquidationBonus(address _instrument, uint256 _bonus) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.setInstrumentLiquidationBonus(_instrument, _bonus);
        emit InstrumentLiquidationBonusChanged(_instrument, _bonus);
    }

    /**
    * @dev updates the _instrument decimals
    * @param _instrument the address of the _instrument
    * @param _decimals the new number of decimals
    **/
    function setInstrumentDecimals(address _instrument, uint256 _decimals) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.setInstrumentDecimals(_instrument, _decimals);
        emit InstrumentDecimalsChanged(_instrument, _decimals);
    }

    /**
    * @dev sets the interest rate strategy of a _instrument
    * @param _instrument the address of the _instrument
    * @param _rateStrategyAddress the new address of the interest strategy contract
    **/
    function setInstrumentInterestRateStrategyAddress(address _instrument, address _rateStrategyAddress) external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.setInstrumentInterestRateStrategyAddress(_instrument, _rateStrategyAddress);
        emit InstrumentInterestRateStrategyChanged(_instrument, _rateStrategyAddress);
    }

    /**
    * @dev refreshes the lending pool core configuration to update the cached address
    **/
    function refreshLendingPoolCoreConfiguration() external onlyLendingPoolManager {
        LendingPoolCore core = LendingPoolCore(poolAddressesProvider.getLendingPoolCore());
        core.refreshConfiguration();
    }

    // ##########################################################################################
    // ###############  LENDING POOL CONFIGURATOR'S CONTROL OVER SIGH MECHANICS  ################
    // ##########################################################################################

    /**
    * @dev refreshes the lending pool core configuration to update the cached address
    **/
    function updateSIGHSpeedRatioForAnInstrument(address instrument_, uint supplierRatio) external onlyLendingPoolManager {
        ISighDistributionHandler sigh_distribution_mechanism = ISighDistributionHandler( globalAddressesProvider.getSIGHMechanismHandler() );        
        sigh_distribution_mechanism.updateSIGHSpeedRatioForAnInstrument( instrument_,  supplierRatio);
    }




}
