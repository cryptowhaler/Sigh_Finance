pragma solidity ^0.5.0;

/**
* @title LendingPoolConfigurator contract
* @author Aave, SIGH Finance (modified by SIGH FINANCE)
* @notice Executes configuration methods on the LendingPoolCore contract. Allows to enable/disable instruments,
* and set different protocol parameters.
**/

interface ILendingPoolConfigurator { 

    // ################################################################################################
    // ####### INITIALIZE A NEW INSTRUMENT (Deploys a new IToken Contract for the INSTRUMENT) #########
    // ################################################################################################

    function initInstrument( address _instrument, uint8 _underlyingAssetDecimals, address _interestRateStrategyAddress ) external;
    // function initInstrumentWithData(  address _instrument,  string calldata _iTokenName,  string calldata _iTokenSymbol,  uint8 _underlyingAssetDecimals,  address _interestRateStrategyAddress ) external ;

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


    function removeLastAddedInstrument( address _instrumentToRemove) external ;


    function enableInstrumentAsCollateral( address _instrument, uint256 _baseLTVasCollateral, uint256 _liquidationThreshold, uint256 _liquidationBonus ) external;
    function disableInstrumentAsCollateral(address _instrument) external;


    function switchInstrument(address _instrument, bool switch_) external;
    function switchInstrumentStableBorrowRate(address _instrument, bool borrowRateSwitch) external;
    function switchBorrowingOnInstrument(address _instrument, bool _stableBorrowRateEnabled) external;
    function switchInstrumentFreeze(address _instrument, bool switch_) external;

    function setInstrumentBaseLTVasCollateral(address _instrument, uint256 _ltv) external;
    function setInstrumentLiquidationThreshold(address _instrument, uint256 _threshold) external;
    function setInstrumentLiquidationBonus(address _instrument, uint256 _bonus) external;

    function setInstrumentInterestRateStrategyAddress(address _instrument, address _rateStrategyAddress) external ;

    function refreshLendingPoolCoreConfiguration() external ;

    // ##########################################################################################
    // ###############  LENDING POOL CONFIGURATOR'S CONTROL OVER SIGH MECHANICS  ################
    // ##########################################################################################

    function updateSIGHSpeedRatioForAnInstrument(address instrument_, uint supplierRatio) external ;

    // ############################################################################
    // ###############  ADDING NEW SOURCE ETC TO THE PRICE ORACLE  ################
    // ############################################################################

    function supportNewAsset(address asset_, address source_) external;

    function setAssetSources(address[] calldata _assets, address[] calldata _sources) external;

    function setFallbackOracle(address _fallbackOracle) external ;



}