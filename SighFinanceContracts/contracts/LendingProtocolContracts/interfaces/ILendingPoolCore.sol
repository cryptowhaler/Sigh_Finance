pragma solidity ^0.5.0;

import "../libraries/CoreLibrary.sol";

interface ILendingPoolCore {


    function updateStateOnDeposit( address _instrument, address _user, uint256 _amount, bool _isFirstDeposit) external;
    function transferToReserve(address _instrument, address payable _user, uint256 _amount) external  payable;

// ####################################################################
// ###### CALLED BY REDEEMUNDERLYING() FROM LENDINGPOOL CONTRACT ######
// ####################################################################


    function updateStateOnRedeem( address _instrument, address _user, uint256 _amountRedeemed,  bool _userRedeemedEverything) external;
    function transferToUser(address _instrument, address payable _user, uint256 _amount) external;

// #########################################################################################################################
// ###### CALLED BY BORROW() FROM LENDINGPOOL CONTRACT - alongwith the internal functions that only this function uses #####
// #########################################################################################################################

    function updateStateOnBorrow( address _instrument, address _user, uint256 _amountBorrowed, uint256 _borrowFee,  CoreLibrary.InterestRateMode _rateMode ) external returns (uint256, uint256);

// ########################################################################################################################
// ###### CALLED BY REPAY() FROM LENDINGPOOL CONTRACT - alongwith the internal functions that only this function uses #####
// ########################################################################################################################

    function updateStateOnRepay(  address _instrument,  address _user, uint256 _paybackAmountMinusFees,  uint256 _originationFeeRepaid,  uint256 _balanceIncrease,  bool _repaidWholeLoan ) external;

// #####################################################################################################################################
// ###### CALLED BY SWAPBORROWRATEMODE() FROM LENDINGPOOL CONTRACT - alongwith the internal functions that only this function uses #####
// #####################################################################################################################################


    function updateStateOnSwapRate(  address _instrument, address _user, uint256 _principalBorrowBalance, uint256 _compoundedBorrowBalance, uint256 _balanceIncrease, CoreLibrary.InterestRateMode _currentRateMode ) external returns (CoreLibrary.InterestRateMode, uint256);


// #########################################################################################################################################
// ###### CALLED BY UPDATESTATEONREBALANCE() FROM LENDINGPOOL CONTRACT - alongwith the internal functions that only this function uses #####
// #########################################################################################################################################

    function updateStateOnRebalance(address _instrument, address _user, uint256 _balanceIncrease) external returns (uint256)  ;


// #########################################################################################################################################
// ###### CALLED BY SETUSERUSEINSTRUMENTASCOLLATERAL() FROM LENDINGPOOL CONTRACT (also some internal calls from this contract )        #####
// #########################################################################################################################################

    function setUserUseInstrumentAsCollateral(address _instrument, address _user, bool _useAsCollateral) external ;

// ################################################################### 
// ###### CALLED BY FLASHLOAN() FROM LENDINGPOOL CONTRACT        #####
// ################################################################### 

    function updateStateOnFlashLoan( address _instrument, uint256 _availableLiquidityBefore, uint256 _income,  uint256 _protocolFee ) external ;

// ############################################################################################################################################################################ 
// ###### CALLED BY LIQUIDATIONCALL() FROM LENDINGPOOL CONTRACT  (call is delegated to LendingPoolLiquidationManager.sol where the actual implementation is present)      #####
// ############################################################################################################################################################################

    /**
    * @dev updates the state of the core as a consequence of a liquidation action.
    * @param _principalInstrument the address of the principal instrument that is being repaid
    * @param _collateralInstrument the address of the collateral instrument that is being liquidated
    * @param _user the address of the borrower
    * @param _amountToLiquidate the amount being repaid by the liquidator
    * @param _collateralToLiquidate the amount of collateral being liquidated
    * @param _feeLiquidated the amount of origination fee being liquidated
    * @param _liquidatedCollateralForFee the amount of collateral equivalent to the origination fee + bonus
    * @param _balanceIncrease the accrued interest on the borrowed amount
    * @param _liquidatorReceivesIToken true if the liquidator will receive iTokens, false otherwise
    **/
    function updateStateOnLiquidation( address _principalInstrument, address _collateralInstrument, address _user, uint256 _amountToLiquidate, uint256 _collateralToLiquidate, uint256 _feeLiquidated, uint256 _liquidatedCollateralForFee, uint256 _balanceIncrease, bool _liquidatorReceivesIToken ) external ;


// #################################################################################################################################### 
// ###### CALLED BY LIQUIDATIONCALL() IN LENDINGPOOL CONTRACT (delegated to LendingPoolLiquidationManager.sol which calls) ############
// ################################################################### ################################################################

    /**
    * @dev transfers the fees to the fees collection address in the case of liquidation
    * @param _token the address of the token being transferred
    * @param _amount the amount being transferred
    * @param _destination the fee receiver address
    **/
    function liquidateFee( address _token, uint256 _amount, address _destination ) external payable ;
    
// ############################################################################################################## 
// ###### CALLED BY REPAY() IN LENDINGPOOL CONTRACT : transfers the fee to TokenDistributor Contract ############
// ################################################################### ########################################## 

    function transferToFeeCollectionAddress( address _token, address _user, uint256 _amount, address _destination ) external payable ;

// #################################################################
// ################     PUBLIC VIEW FUNCTIONS       ################
// #################################################################

    function getUserUnderlyingAssetBalance(address _instrument, address _user) external view returns (uint256) ;

    function getInstrumentInterestRateStrategyAddress(address _instrument) external view returns (address);
    function getInstrumentITokenAddress(address _instrument) external view returns (address);

    function getInstrumentAvailableLiquidity(address _instrument) external view returns (uint256);
    function getInstrumentTotalLiquidity(address _instrument) external view returns (uint256);

    function getInstrumentTotalBorrows(address _instrument) external view returns (uint256) ;

    function getInstrumentCurrentStableBorrowRate(address _instrument) external view returns (uint256) ;
    function getInstrumentUtilizationRate(address _instrument) external view returns (uint256) ;

    function getUserCurrentBorrowRateMode(address _instrument, address _user) external view returns (CoreLibrary.InterestRateMode) ;
    function getUserBorrowBalances(address _instrument, address _user) external view returns (uint256, uint256, uint256) ;

// ###################################################################
// ################     EXTERNAL VIEW FUNCTIONS       ################
// ###################################################################

    function getUserBasicInstrumentData(address _instrument, address _user) external view returns (uint256, uint256, uint256, bool);

    function isUserAllowedToBorrowAtStable(address _instrument, address _user, uint256 _amount) external view returns (bool);

    function getInstrumentNormalizedIncome(address _instrument) external view returns (uint256) ;

    function getInstrumentTotalBorrowsStable(address _instrument) external view returns (uint256) ;
    function getInstrumentCompoundedBorrowsStable(address _instrument) external view returns (uint256);

    function getInstrumentTotalBorrowsVariable(address _instrument) external view returns (uint256) ;
    function getInstrumentCompoundedBorrowsVariable(address _instrument) external view returns (uint256);

    function getInstrumentLiquidationThreshold(address _instrument) external view returns (uint256) ;
    function getInstrumentLiquidationBonus(address _instrument) external view returns (uint256) ;

    function getInstrumentCurrentVariableBorrowRate(address _instrument) external view returns (uint256) ;
    function getInstrumentCurrentAverageStableBorrowRate(address _instrument) external view returns (uint256) ;

    function getInstrumentCurrentLiquidityRate(address _instrument) external view returns (uint256);

    function getInstrumentLiquidityCumulativeIndex(address _instrument) external view returns (uint256) ;
    function getInstrumentVariableBorrowsCumulativeIndex(address _instrument) external view returns (uint256) ;

    function getInstrumentConfiguration(address _instrument) external  view returns (uint256, uint256, uint256, bool) ;

    function getInstrumentDecimals(address _instrument) external view returns (uint256) ;

    function isInstrumentBorrowingEnabled(address _instrument) external view returns (bool);
    function isInstrumentUsageAsCollateralEnabled(address _instrument) external view returns (bool) ;
    function getInstrumentIsStableBorrowRateEnabled(address _instrument) external view returns (bool);
    function getInstrumentIsActive(address _instrument) external view returns (bool) ;
    function getInstrumentIsFreezed(address _instrument) external view returns (bool) ;
    function getInstrumentLastUpdate(address _instrument) external view returns (uint40 timestamp) ;

    function getInstruments() external view returns (address[] memory) ;

    function isUserUseInstrumentAsCollateralEnabled(address _instrument, address _user) external view returns (bool) ;
    function getUserOriginationFee(address _instrument, address _user) external view returns (uint256) ;
    function getUserCurrentStableBorrowRate(address _instrument, address _user) external  view returns (uint256) ;
    function getUserVariableBorrowCumulativeIndex(address _instrument, address _user)  external view returns (uint256) ;
    function getUserLastUpdate(address _instrument, address _user) external view returns (uint256 timestamp) ;


// ##############################################################################################
// ################     FUNCTION CALLS BY LENDINGPOOLCONFIGURATOR CONTRACT       ################
// ##############################################################################################

    function refreshConfiguration() external ;

    function initInstrument( address _instrument, address _iTokenAddress,  uint256 _decimals, address _interestRateStrategyAddress ) external;
    // function removeInstrument(address _instrumentToRemove) external  returns (bool) ;
  
    function setInstrumentInterestRateStrategyAddress(address _instrument, address _rateStrategyAddress) external;
    
    function enableInstrumentAsCollateral( address _instrument, uint256 _baseLTVasCollateral, uint256 _liquidationThreshold, uint256 _liquidationBonus ) external ;
    function disableInstrumentAsCollateral(address _instrument) external ;

    function borrowingOnInstrumentSwitch(address _instrument, bool toBeActivated) external ;
    function instrumentStableBorrowRateSwitch(address _instrument, bool toBeActivated) external ;
    function InstrumentActivationSwitch(address _instrument , bool toBeActivated) external ;
    function InstrumentFreezeSwitch(address _instrument , bool toBeActivated) external;
    function updateInstrumentCollateralParameters(address _instrument, uint256 _ltv, uint256 _threshold, uint256 _bonus) external;
    
    // function enableBorrowingOnInstrument(address _instrument)  external ;
    // function disableBorrowingOnInstrument(address _instrument) external ;


    // function enableInstrumentStableBorrowRate(address _instrument) external ;
    // function disableInstrumentStableBorrowRate(address _instrument) external ;

    // function activateInstrument(address _instrument) external ;
    // function deactivateInstrument(address _instrument) external ;

    // function freezeInstrument(address _instrument) external ;
    // function unfreezeInstrument(address _instrument) external ;

    // function setInstrumentBaseLTVasCollateral(address _instrument, uint256 _ltv) external ;
    // function setInstrumentLiquidationThreshold(address _instrument, uint256 _threshold) external ;
    // function setInstrumentLiquidationBonus(address _instrument, uint256 _bonus) external  ;
    function setInstrumentDecimals(address _instrument, uint256 _decimals) external ;

}