pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./WadRayMath.sol";

/**
* @title CoreLibrary library
* @author Aave, SIGH Finance (extended by SIGH Finance)
* @notice Defines the data structures of the instruments and the user data
**/
library CoreLibrary {
    using SafeMath for uint256;
    using WadRayMath for uint256;

    enum InterestRateMode {NONE, STABLE, VARIABLE}

    uint256 internal constant SECONDS_PER_YEAR = 365 days;

// ############################
// #####  STRUCTS USED    #####
// ############################

    struct UserInstrumentData {
        bool useAsCollateral;                         //defines if a specific deposit should or not be used as a collateral in borrows        
        uint256 principalBorrowBalance;                 // principal amount borrowed by the user.
        uint256 stableBorrowRate;                       // stable borrow rate at which the user has borrowed. Expressed in ray                
        uint256 lastVariableBorrowCumulativeIndex;      // cumulated variable borrow index for the user. Expressed in ray
        uint256 borrowFee;                              // borrow fee cumulated by the user
        uint40 lastUpdateTimestamp;
    }   

    struct InstrumentData {
        address iTokenAddress;                          // IToken Contract Address
        address interestRateStrategyAddress;            // Interest Rate Strategy contract Address 

        uint256 decimals;                               //the decimals of the instrument asset

        bool isActive;                                  // isActive = true if Activated and Properly Configured
        bool isFreezed;                                 // isFreezed = true = Repays / Redeems Allowed. Deposits / Borrowings / Rate Swap Disabled

        bool borrowingEnabled;                          // borrowingEnabled = True = users can borrow from this instrument
        bool usageAsCollateralEnabled;                  // usageAsCollateralEnabled = true = users can use this instrument as collateral
        bool isStableBorrowRateEnabled;                 // isStableBorrowRateEnabled = true = users can borrow at Stable Rate

        uint256 currentVariableBorrowRate;              //the current variable borrow rate. Expressed in ray
        uint256 currentStableBorrowRate;                //the current stable borrow rate. Expressed in ray
        uint256 currentLiquidityRate;                   //the current supply rate. Expressed in ray
        uint256 currentSighPayRate;                     //the current SIGH Pay rate. Expressed in ray

        uint256 totalBorrowsStable;                     //the total borrows at stable rate. Expressed in the currency decimals
        uint256 totalBorrowsVariable;                   //the total borrows at variable rate. Expressed in the currency decimals

        uint256 currentAverageStableBorrowRate;         // Current Average Stable Borrow Rate --> Weighted average of all the different stable rate loans. Expressed in ray

        uint256 lastVariableBorrowCumulativeIndex;      // Variable Borrow Index --> Expressed in ray
        uint256 lastLiquidityCumulativeIndex;           // Liquidity Index --> Expressed in ray
        uint256 lastSIGHPayCumulativeIndex;             // SIGH PAY (Accured) Index --> Expressed in ray
        uint256 lastSIGHPayPaidIndex;             // SIGH PAY (PAID) Index --> Expressed in ray

        uint256 baseLTVasCollateral;                    // LTV (Loan to Volume) of the instrument --> Expressed in percentage (0-100)

        uint256 liquidationThreshold;                   // Liquidation Threshold --> Expressed in percentage (0-100)
        uint256 liquidationBonus;                       // Liquidation Bonus --> Expressed in percentage

        uint40 lastUpdateTimestamp;
    }


// ########################################################
// #####  INITIALIZE THE InstrumentData STRUCT    ############
// ########################################################

    /**
    * @dev initializes a instrument
    * @param _instrument the instrument object
    * @param _iTokenAddress the address of the overlying iToken contract
    * @param _decimals the number of decimals of the underlying asset
    * @param _interestRateStrategyAddress the address of the interest rate strategy contract
    **/
    function init( InstrumentData storage _instrument, address _iTokenAddress, uint256 _decimals, address _interestRateStrategyAddress) external {
        require(_instrument.iTokenAddress == address(0), "Instrument has already been initialized");

        if (_instrument.lastLiquidityCumulativeIndex == 0) {           //      if the instrument has not been initialized yet
            _instrument.lastLiquidityCumulativeIndex = WadRayMath.ray();
        }

        if (_instrument.lastVariableBorrowCumulativeIndex == 0) {
            _instrument.lastVariableBorrowCumulativeIndex = WadRayMath.ray();
        }

        if (_instrument.lastSIGHPayCumulativeIndex == 0) {
            _instrument.lastSIGHPayCumulativeIndex = WadRayMath.ray();
            _instrument.lastSIGHPayPaidIndex =  WadRayMath.ray();
        }

        _instrument.iTokenAddress = _iTokenAddress;
        _instrument.decimals = _decimals;
        _instrument.interestRateStrategyAddress = _interestRateStrategyAddress;
        _instrument.isActive = true;
        _instrument.isFreezed = false;
    }

// #################################################
// #####  ENABLE / DISABLE BORROWING    ############
// #################################################

    /**
    * @dev enables borrowing on a instrument
    * @param _instrument the instrument object
    **/
    function enableBorrowing(InstrumentData storage _instrument) external {
        require(_instrument.borrowingEnabled == false, "Instrument is already enabled");
        _instrument.borrowingEnabled = true;
    }

    /**
    * @dev disables borrowing on a instrument
    * @param _instrument the instrument object
    **/
    function disableBorrowing(InstrumentData storage _instrument) external {
        _instrument.borrowingEnabled = false;
    }

// #######################################################
// #####  ENABLE / DISABLE AS A COLLATERAL    ############
// #######################################################
    /**
    * @dev enables a instrument to be used as collateral
    * @param _instrument the instrument object
    * @param _baseLTVasCollateral the loan to value of the asset when used as collateral
    * @param _liquidationThreshold the threshold at which loans using this asset as collateral will be considered undercollateralized
    * @param _liquidationBonus the bonus liquidators receive to liquidate this asset
    **/
    function enableAsCollateral( InstrumentData storage _instrument,  uint256 _baseLTVasCollateral,  uint256 _liquidationThreshold, uint256 _liquidationBonus) external {
        require( _instrument.usageAsCollateralEnabled == false, "Instrument is already enabled as collateral" );

        _instrument.usageAsCollateralEnabled = true;
        _instrument.baseLTVasCollateral = _baseLTVasCollateral;
        _instrument.liquidationThreshold = _liquidationThreshold;
        _instrument.liquidationBonus = _liquidationBonus;

        if (_instrument.lastLiquidityCumulativeIndex == 0)
            _instrument.lastLiquidityCumulativeIndex = WadRayMath.ray();

    }

    /**
    * @dev disables a instrument as collateral
    * @param _instrument the instrument object
    **/
    function disableAsCollateral(InstrumentData storage _instrument) external {
        _instrument.usageAsCollateralEnabled = false;
    }

// ###########################################################################################################################################
// #####  INTERNAL FUNCTIONS    ##############################################################################################################
// ##### --> updateCumulativeIndexes() :  Updates the liquidity cumulative index Ci and variable borrow cumulative index Bvc. ################
// ##### --> cumulateToLiquidityIndex() : Accumulates a predefined amount of asset to the instrument as a fixed, one time income. ###############
// ##### --> increaseTotalBorrowsStableAndUpdateAverageRate() : Increases the total borrows at a stable rate on a specific instrument ###########
// #####                                                         and updates the average stable rate consequently  ###########################
// ##### --> decreaseTotalBorrowsStableAndUpdateAverageRate() : decreases the total borrows at a stable rate on a specific instrument ###########
// #####                                                         and updates the average stable rate consequently ############################
// ##### --> increaseTotalBorrowsVariable() : increases the total borrows at a variable rate #################################################
// ##### --> decreaseTotalBorrowsVariable() : decreases the total borrows at a variable rate #################################################
// ###########################################################################################################################################


    /**
    * @dev Updates the liquidity cumulative index Ci and variable borrow cumulative index Bvc. Refer to the AAVE whitepaper for a formal specification.
    * @param _instrument the instrument object
    **/
    function updateCumulativeIndexes(InstrumentData storage _instrument) internal {
        uint256 totalBorrows = getTotalBorrows(_instrument);

        if (totalBorrows > 0) {     //only cumulating if there is any income being produced
            uint256 cumulatedLiquidityInterest = calculateLinearInterest(  _instrument.currentLiquidityRate, _instrument.lastUpdateTimestamp );
            _instrument.lastLiquidityCumulativeIndex = cumulatedLiquidityInterest.rayMul( _instrument.lastLiquidityCumulativeIndex );

            uint256 cumulatedSIGHPayInterest = calculateLinearInterest(  _instrument.currentSighPayRate, _instrument.lastUpdateTimestamp );
            _instrument.lastSIGHPayCumulativeIndex = cumulatedSIGHPayInterest.rayMul( _instrument.lastSIGHPayCumulativeIndex );

            uint256 cumulatedVariableBorrowInterest = calculateCompoundedInterest(_instrument.currentVariableBorrowRate, _instrument.lastUpdateTimestamp);
            _instrument.lastVariableBorrowCumulativeIndex = cumulatedVariableBorrowInterest.rayMul(_instrument.lastVariableBorrowCumulativeIndex );
        }
    }


    /**
    * @dev accumulates a predefined amount of asset to the instrument as a fixed, one time income. Used for example to accumulate the flashloan fee to the instrument, and spread it through the depositors.
    * @param _instrument the instrument object
    * @param _totalLiquidity the total liquidity available in the instrument
    * @param _amount the amount to accomulate
    **/
    function cumulateToLiquidityIndex( InstrumentData storage _instrument, uint256 _totalLiquidity, uint256 _amount ) internal {
        uint256 amountToLiquidityRatio = _amount.wadToRay().rayDiv(_totalLiquidity.wadToRay());
        uint256 cumulatedLiquidity = amountToLiquidityRatio.add(WadRayMath.ray());
        _instrument.lastLiquidityCumulativeIndex = cumulatedLiquidity.rayMul( _instrument.lastLiquidityCumulativeIndex );
    }


    /**
    * @dev increases the total borrows at a stable rate on a specific instrument and updates the average stable rate consequently
    * @param _instrument the instrument object
    * @param _amount the amount to add to the total borrows stable
    * @param _rate the rate at which the amount has been borrowed
    **/
    function increaseTotalBorrowsStableAndUpdateAverageRate( InstrumentData storage _instrument,  uint256 _amount, uint256 _rate ) internal {
        uint256 previousTotalBorrowStable = _instrument.totalBorrowsStable;
        _instrument.totalBorrowsStable = _instrument.totalBorrowsStable.add(_amount);       //updating instrument borrows stable
        
        uint256 weightedLastBorrow = _amount.wadToRay().rayMul(_rate);
        uint256 weightedPreviousTotalBorrows = previousTotalBorrowStable.wadToRay().rayMul( _instrument.currentAverageStableBorrowRate );                   //weighted average of all the borrows
        _instrument.currentAverageStableBorrowRate = weightedLastBorrow.add(weightedPreviousTotalBorrows).rayDiv(_instrument.totalBorrowsStable.wadToRay());    //update the average stable rate
    }

    /**
    * @dev decreases the total borrows at a stable rate on a specific instrument and updates the average stable rate consequently
    * @param _instrument the instrument object
    * @param _amount the amount to substract to the total borrows stable
    * @param _rate the rate at which the amount has been repaid
    **/
    function decreaseTotalBorrowsStableAndUpdateAverageRate( InstrumentData storage _instrument, uint256 _amount, uint256 _rate ) internal {
        require(_instrument.totalBorrowsStable >= _amount, "Invalid amount to decrease");

        uint256 previousTotalBorrowStable = _instrument.totalBorrowsStable;
        _instrument.totalBorrowsStable = _instrument.totalBorrowsStable.sub(_amount);     //updating instrument borrows stable

        if (_instrument.totalBorrowsStable == 0) {
            _instrument.currentAverageStableBorrowRate = 0; //no income if there are no stable rate borrows
            return;
        }

        //update the average stable rate
        //weighted average of all the borrows
        uint256 weightedLastBorrow = _amount.wadToRay().rayMul(_rate);
        uint256 weightedPreviousTotalBorrows = previousTotalBorrowStable.wadToRay().rayMul( _instrument.currentAverageStableBorrowRate );

        require( weightedPreviousTotalBorrows >= weightedLastBorrow, "The amounts to subtract don't match");

        _instrument.currentAverageStableBorrowRate = weightedPreviousTotalBorrows.sub(weightedLastBorrow).rayDiv(_instrument.totalBorrowsStable.wadToRay());
    }

    /**
    * @dev increases the total borrows at a variable rate
    * @param _instrument the instrument object
    * @param _amount the amount to add to the total borrows variable
    **/
    function increaseTotalBorrowsVariable(InstrumentData storage _instrument, uint256 _amount) internal {
        _instrument.totalBorrowsVariable = _instrument.totalBorrowsVariable.add(_amount);
    }

    /**
    * @dev decreases the total borrows at a variable rate
    * @param _instrument the instrument object
    * @param _amount the amount to substract to the total borrows variable
    **/
    function decreaseTotalBorrowsVariable(InstrumentData storage _instrument, uint256 _amount) internal {
        require( _instrument.totalBorrowsVariable >= _amount, "The amount that is being subtracted from the variable total borrows is incorrect");
        _instrument.totalBorrowsVariable = _instrument.totalBorrowsVariable.sub(_amount);
    }

// ################################################################################################################################################
// #####  INTERNAL VIEW FUNCTIONS    ##############################################################################################################
// #####  --> getCompoundedBorrowBalance() :   calculates the compounded borrow balance of a user   ###############################################
// #####  --> getNormalizedIncome() :   returns the ongoing normalized income for the instrument.      ###############################################
// #####  --> calculateLinearInterest() :   function to calculate the interest using a linear interest rate formula   #############################
// #####  --> calculateCompoundedInterest() :  function to calculate the interest using a compounded interest rate formula ########################
// #####  --> getTotalBorrows() :   returns the total borrows on the instrument    ###################################################################
// ################################################################################################################################################

    /**
    * @dev calculates the compounded borrow balance of a user
    * @param user_instrument the userInstrument object
    * @param _instrument the instrument object
    * @return the user compounded borrow balance
    **/
    function getCompoundedBorrowBalance( CoreLibrary.UserInstrumentData storage user_instrument, CoreLibrary.InstrumentData storage _instrument) internal view returns (uint256) {
        if (user_instrument.principalBorrowBalance == 0) 
            return 0;

        uint256 principalBorrowBalanceRay = user_instrument.principalBorrowBalance.wadToRay();
        uint256 compoundedBalance = 0;
        uint256 cumulatedInterest = 0;

        if (user_instrument.stableBorrowRate > 0) {     // stable interest
            cumulatedInterest = calculateCompoundedInterest( user_instrument.stableBorrowRate, user_instrument.lastUpdateTimestamp );
        } 
        else {                                          //variable interest
            cumulatedInterest = calculateCompoundedInterest( _instrument.currentVariableBorrowRate,   _instrument.lastUpdateTimestamp).rayMul(_instrument.lastVariableBorrowCumulativeIndex).rayDiv(user_instrument.lastVariableBorrowCumulativeIndex);
        }

        compoundedBalance = principalBorrowBalanceRay.rayMul(cumulatedInterest).rayToWad();

        if (compoundedBalance == user_instrument.principalBorrowBalance) {
            if (user_instrument.lastUpdateTimestamp != block.timestamp) {   //no interest cumulation because of the rounding - we add 1 wei as symbolic cumulated interest to avoid interest free loans.                
                return user_instrument.principalBorrowBalance.add(1 wei);
            }
        }

        return compoundedBalance;
    }

    /**
    * @dev returns the ongoing normalized income for the instrument.
    * a value of 1e27 means there is no income. As time passes, the income is accrued.
    * A value of 2*1e27 means that the income of the instrument is double the initial amount.
    * @param _instrument the instrument object
    * @return the normalized income. expressed in ray
    **/
    function getNormalizedSIGHPay(CoreLibrary.InstrumentData storage _instrument) internal view returns (uint256) {
        uint256 cumulated = calculateLinearInterest( _instrument.currentSighPayRate, _instrument.lastUpdateTimestamp).rayMul(_instrument.lastSIGHPayCumulativeIndex);
        return cumulated;
    }
    /**
    * @dev returns the ongoing normalized income for the instrument.
    * a value of 1e27 means there is no income. As time passes, the income is accrued.
    * A value of 2*1e27 means that the income of the instrument is double the initial amount.
    * @param _instrument the instrument object
    * @return the normalized income. expressed in ray
    **/
    function getNormalizedIncome(CoreLibrary.InstrumentData storage _instrument) internal view returns (uint256) {
        uint256 cumulated = calculateLinearInterest( _instrument.currentLiquidityRate, _instrument.lastUpdateTimestamp).rayMul(_instrument.lastLiquidityCumulativeIndex);
        return cumulated;
    }

    // TO BE TESTED : SHOULD RETURN THE CURRENT COMPOUNDED VARIABLE BORROW BALANCE FOR THE INSTRUMENT
    function getCompoundedVariableBorrowBalance(CoreLibrary.InstrumentData storage _instrument) internal view returns (uint256) { 
            uint256 cumulated = calculateCompoundedInterest(_instrument.currentVariableBorrowRate, _instrument.lastUpdateTimestamp).rayMul(_instrument.lastVariableBorrowCumulativeIndex );
            uint compoundedVariableBorrowBalance = _instrument.totalBorrowsVariable.wadToRay().rayMul( cumulated ).rayToWad();
            return compoundedVariableBorrowBalance;
    }

    // TO BE TESTED : SHOULD RETURN THE CURRENT COMPOUNDED VARIABLE BORROW BALANCE FOR THE INSTRUMENT
    function getCompoundedStableBorrowBalance(CoreLibrary.InstrumentData storage _instrument) internal view returns (uint256) { 
            uint256 cumulated = calculateCompoundedInterest(_instrument.currentAverageStableBorrowRate, _instrument.lastUpdateTimestamp);
            uint compoundedStableBorrowBalance = _instrument.totalBorrowsStable.wadToRay().rayMul( cumulated ).rayToWad();
            return compoundedStableBorrowBalance;
    }

    /**
    * @dev function to calculate the interest using a linear interest rate formula
    * @param _rate the interest rate, in ray
    * @param _lastUpdateTimestamp the timestamp of the last update of the interest
    * @return the interest rate linearly accumulated during the timeDelta, in ray
    **/
    function calculateLinearInterest(uint256 _rate, uint40 _lastUpdateTimestamp)  internal view returns (uint256) {
        uint256 timeDifference = block.timestamp.sub(uint256(_lastUpdateTimestamp));
        uint256 timeDelta = timeDifference.wadToRay().rayDiv(SECONDS_PER_YEAR.wadToRay());
        return _rate.rayMul(timeDelta).add(WadRayMath.ray());
    }

    /**
    * @dev function to calculate the interest using a compounded interest rate formula
    * @param _rate the interest rate, in ray
    * @param _lastUpdateTimestamp the timestamp of the last update of the interest
    * @return the interest rate compounded during the timeDelta, in ray
    **/
    function calculateCompoundedInterest(uint256 _rate, uint40 _lastUpdateTimestamp) internal view returns (uint256) {
        uint256 timeDifference = block.timestamp.sub(uint256(_lastUpdateTimestamp));
        uint256 ratePerSecond = _rate.div(SECONDS_PER_YEAR);
        uint256 cumulated_interest = ratePerSecond.add(WadRayMath.ray()).rayPow(timeDifference);
        return  cumulated_interest;
    }

    /**
    * @dev returns the total borrows on the instrument
    * @param _instrument the instrument object
    * @return the total borrows (stable + variable)
    **/
    function getTotalBorrows(CoreLibrary.InstrumentData storage _instrument) internal view returns (uint256) {
        return _instrument.totalBorrowsStable.add(_instrument.totalBorrowsVariable);
    }

}
