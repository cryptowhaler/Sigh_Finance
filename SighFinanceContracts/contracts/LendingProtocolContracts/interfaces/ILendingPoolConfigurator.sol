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
    function initInstrumentWithData(  address _instrument,  string memory _iTokenName,  string memory _iTokenSymbol,  uint8 _underlyingAssetDecimals,  address _interestRateStrategyAddress ) external ;

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

    function enableBorrowingOnInstrument(address _instrument, bool _stableBorrowRateEnabled) external;
    function disableBorrowingOnInstrument(address _instrument) external;

    function enableInstrumentAsCollateral( address _instrument, uint256 _baseLTVasCollateral, uint256 _liquidationThreshold, uint256 _liquidationBonus ) external;
    function disableInstrumentAsCollateral(address _instrument) external;

    function enableInstrumentStableBorrowRate(address _instrument) external;
    function disableInstrumentStableBorrowRate(address _instrument) external;

    function activateInstrument(address _instrument) external;
    function deactivateInstrument(address _instrument) external;

    function freezeInstrument(address _instrument) external;
    function unfreezeInstrument(address _instrument) external;

    function setInstrumentBaseLTVasCollateral(address _instrument, uint256 _ltv) external;
    function setInstrumentLiquidationThreshold(address _instrument, uint256 _threshold) external;
    function setInstrumentLiquidationBonus(address _instrument, uint256 _bonus) external;

    function setInstrumentDecimals(address _instrument, uint256 _decimals) external;

    function setInstrumentInterestRateStrategyAddress(address _instrument, address _rateStrategyAddress) external ;

    function refreshLendingPoolCoreConfiguration() external ;

    // ##########################################################################################
    // ###############  LENDING POOL CONFIGURATOR'S CONTROL OVER SIGH MECHANICS  ################
    // ##########################################################################################

    function updateSIGHSpeedRatioForAnInstrument(address instrument_, uint supplierRatio) external ;

}