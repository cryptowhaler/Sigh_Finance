// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

import {SafeMath} from '../../../dependencies/openzeppelin/contracts/SafeMath.sol';
import {IERC20} from '../../../dependencies/openzeppelin/contracts/IERC20.sol';
import {SafeERC20} from '../../../dependencies/openzeppelin/contracts/SafeERC20.sol';
import {IAToken} from '../../../interfaces/IAToken.sol';
import {IStableDebtToken} from '../../../interfaces/IStableDebtToken.sol';
import {IVariableDebtToken} from '../../../interfaces/IVariableDebtToken.sol';
import {IReserveInterestRateStrategy} from '../../../interfaces/IReserveInterestRateStrategy.sol';
import {InstrumentConfiguration} from '../configuration/InstrumentConfiguration.sol';
import {MathUtils} from '../math/MathUtils.sol';
import {WadRayMath} from '../math/WadRayMath.sol';
import {PercentageMath} from '../math/PercentageMath.sol';
import {DataTypes} from '../types/DataTypes.sol';

/**
 * @title InstrumentReserveLogic library
 * @author Aave
 * @notice Implements the logic to update the reserves state
 */
library InstrumentReserveLogic {
    using SafeMath for uint256;
    using WadRayMath for uint256;
    using PercentageMath for uint256;
    using SafeERC20 for IERC20;

    /**
    * @dev Emitted when the state of a reserve is updated
    * @param asset The address of the underlying asset of the reserve
    * @param liquidityRate The new liquidity rate
    * @param stableBorrowRate The new stable borrow rate
    * @param variableBorrowRate The new variable borrow rate
    * @param liquidityIndex The new liquidity index
    * @param variableBorrowIndex The new variable borrow index
    **/
    event InstrumentDataUpdated(address indexed asset,uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate,uint256 liquidityIndex, uint256 variableBorrowIndex);

    using InstrumentReserveLogic for DataTypes.InstrumentData;
    using InstrumentConfiguration for DataTypes.InstrumentConfigurationMap;

    /**
    * @dev Returns the ongoing normalized income for the reserve
    * A value of 1e27 means there is no income. As time passes, the income is accrued
    * A value of 2*1e27 means for each unit of asset one unit of income has been accrued
    * @param reserve The reserve object
    * @return the normalized income. expressed in ray
    **/
    function getNormalizedIncome(DataTypes.InstrumentData storage reserve) internal view returns (uint256) {
        uint40 timestamp = reserve.lastUpdateTimestamp;

        if (timestamp == uint40(block.timestamp)) {
            return reserve.liquidityIndex;  //if the index was updated in the same block, no need to perform any calculation
        }

        uint256 cumulated = MathUtils.calculateLinearInterest(reserve.currentLiquidityRate, timestamp).rayMul( reserve.liquidityIndex );
        return cumulated;
    }

    /**
    * @dev Returns the ongoing normalized variable debt for the reserve
    * A value of 1e27 means there is no debt. As time passes, the income is accrued
    * A value of 2*1e27 means that for each unit of debt, one unit worth of interest has been accumulated
    * @param reserve The reserve object
    * @return The normalized variable debt. expressed in ray
    **/
    function getNormalizedDebt(DataTypes.InstrumentData storage reserve) internal view returns (uint256) {
        uint40 timestamp = reserve.lastUpdateTimestamp;

        if (timestamp == uint40(block.timestamp)) {
            return reserve.variableBorrowIndex;
        }

        uint256 cumulated = MathUtils.calculateCompoundedInterest(reserve.currentVariableBorrowRate, timestamp).rayMul(reserve.variableBorrowIndex);
        return cumulated;
    }

    /**
    * @dev Updates the liquidity cumulative index and the variable borrow index.
    * @param instrument the instrument object
    **/
    function updateState(DataTypes.InstrumentData storage instrument) internal {
        uint256 scaledVariableDebt = IVariableDebtToken(instrument.variableDebtTokenAddress).scaledTotalSupply();
        uint256 previousVariableBorrowIndex = instrument.variableBorrowIndex;
        uint256 previousLiquidityIndex = instrument.liquidityIndex;
        uint40 lastUpdatedTimestamp = instrument.lastUpdateTimestamp;

        (uint256 newLiquidityIndex, uint256 newVariableBorrowIndex) = _updateIndexes( instrument, scaledVariableDebt, previousLiquidityIndex, previousVariableBorrowIndex, lastUpdatedTimestamp );
        _mintToTreasury( instrument, scaledVariableDebt, previousVariableBorrowIndex, newLiquidityIndex, newVariableBorrowIndex, lastUpdatedTimestamp );
    }

    /**
    * @dev Accumulates a predefined amount of asset to the reserve of the instrument as a fixed, instantaneous income. Used for example to accumulate the flashloan fee to the reserve, and spread it between all the depositors
    * @param instrument The instrument object
    * @param totalLiquidity The total liquidity available in the reserve for the instrument 
    * @param amount The amount to accomulate
    **/
    function cumulateToLiquidityIndex( DataTypes.InstrumentData storage instrument, uint256 totalLiquidity, uint256 amount ) internal {
        uint256 amountToLiquidityRatio = amount.wadToRay().rayDiv(totalLiquidity.wadToRay());
        uint256 result = amountToLiquidityRatio.add(WadRayMath.ray());

        result = result.rayMul(instrument.liquidityIndex);
        require(result <= type(uint128).max, "Cumulating Indexes : Liquidity Index overflow error");

        instrument.liquidityIndex = uint128(result);
    }

    /**
    * @dev Initializes an instrument reserve
    * @param instrument The instrument object
    * @param iTokenAddress The address of the overlying atoken contract
    * @param interestRateStrategyAddress The address of the interest rate strategy contract
    **/
    function init( DataTypes.InstrumentData storage instrument, address iTokenAddress, address stableDebtTokenAddress, address variableDebtTokenAddress, address interestRateStrategyAddress) external {
        require(instrument.iTokenAddress == address(0), "The underlying instrument is already supported by SIGH Finance's lending protocol");

        instrument.liquidityIndex = uint128(WadRayMath.ray());
        instrument.variableBorrowIndex = uint128(WadRayMath.ray());
        instrument.iTokenAddress = iTokenAddress;
        instrument.stableDebtTokenAddress = stableDebtTokenAddress;
        instrument.variableDebtTokenAddress = variableDebtTokenAddress;
        instrument.interestRateStrategyAddress = interestRateStrategyAddress;
    }

    struct UpdateInterestRatesLocalVars {
        address stableDebtTokenAddress;
        uint256 availableLiquidity;
        uint256 totalStableDebt;
        uint256 newLiquidityRate;
        uint256 newStableRate;
        uint256 newVariableRate;
        uint256 avgStableRate;
        uint256 totalVariableDebt;
    }

    /**
    * @dev Updates the instrument current stable borrow rate, the current variable borrow rate and the current liquidity rate
    * @param instrumentAddress The address of the instrument to be updated
    * @param liquidityAdded The amount of liquidity added to the protocol (deposit or repay) in the previous action
    * @param liquidityTaken The amount of liquidity taken from the protocol (redeem or borrow)
    **/
    function updateInterestRates( DataTypes.InstrumentData storage instrument, address instrumentAddress, address iTokenAddress, uint256 liquidityAdded, uint256 liquidityTaken ) internal {
        UpdateInterestRatesLocalVars memory vars;

        vars.stableDebtTokenAddress = instrument.stableDebtTokenAddress;
        (vars.totalStableDebt, vars.avgStableRate) = IStableDebtToken(vars.stableDebtTokenAddress).getTotalSupplyAndAvgRate();

        //calculates the total variable debt locally using the scaled total supply instead of totalSupply(), 
        // as it's noticeably cheaper. Also, the index has been updated by the previous updateState() call
        vars.totalVariableDebt = IVariableDebtToken(instrument.variableDebtTokenAddress).scaledTotalSupply().rayMul(instrument.variableBorrowIndex);
        vars.availableLiquidity = IERC20(instrumentAddress).balanceOf(iTokenAddress);

        (vars.newLiquidityRate, vars.newStableRate, vars.newVariableRate) = IReserveInterestRateStrategy(instrument.interestRateStrategyAddress).calculateInterestRates(
                                                                                                                                                instrumentAddress,
                                                                                                                                                vars.availableLiquidity.add(liquidityAdded).sub(liquidityTaken),
                                                                                                                                                vars.totalStableDebt,
                                                                                                                                                vars.totalVariableDebt,
                                                                                                                                                vars.avgStableRate,
                                                                                                                                                instrument.configuration.getReserveFactor()
                                                                                                                                            );
        require(vars.newLiquidityRate <= type(uint128).max, "Updated Liquidity Rate not valid");
        require(vars.newStableRate <= type(uint128).max, "Updated Liquidity Rate not valid");
        require(vars.newVariableRate <= type(uint128).max, "Updated Liquidity Rate not valid");

        instrument.currentLiquidityRate = uint128(vars.newLiquidityRate);
        instrument.currentStableBorrowRate = uint128(vars.newStableRate);
        instrument.currentVariableBorrowRate = uint128(vars.newVariableRate);

        emit InstrumentDataUpdated( instrumentAddress, vars.newLiquidityRate, vars.newStableRate,  vars.newVariableRate,  instrument.liquidityIndex,  instrument.variableBorrowIndex );
    }

    struct MintToTreasuryLocalVars {
        uint256 currentStableDebt;
        uint256 principalStableDebt;
        uint256 previousStableDebt;
        uint256 currentVariableDebt;
        uint256 previousVariableDebt;
        uint256 avgStableRate;
        uint256 cumulatedStableInterest;
        uint256 totalDebtAccrued;
        uint256 amountToMint;
        uint256 reserveFactor;
        uint40 stableSupplyUpdatedTimestamp;
    }

    /**
    * @dev Mints part of the repaid interest to the Reserve Treasury as a function of the reserveFactor for the specific asset.
    * @param instrument The instrument reserve to be updated
    * @param scaledVariableDebt The current scaled total variable debt
    * @param previousVariableBorrowIndex The variable borrow index before the last accumulation of the interest
    * @param newLiquidityIndex The new liquidity index
    * @param newVariableBorrowIndex The variable borrow index after the last accumulation of the interest
    **/
    function _mintToTreasury( DataTypes.InstrumentData storage instrument, uint256 scaledVariableDebt, uint256 previousVariableBorrowIndex, uint256 newLiquidityIndex, uint256 newVariableBorrowIndex, uint40 timestamp ) internal {
        MintToTreasuryLocalVars memory vars;
        vars.reserveFactor = instrument.configuration.getReserveFactor();

        if (vars.reserveFactor == 0) {
            return;
        }

        //fetching the principal, total stable debt and the avg stable rate
        ( vars.principalStableDebt, vars.currentStableDebt, vars.avgStableRate, vars.stableSupplyUpdatedTimestamp) = IStableDebtToken(instrument.stableDebtTokenAddress).getSupplyData();        

        vars.previousVariableDebt = scaledVariableDebt.rayMul(previousVariableBorrowIndex); //calculate the last principal variable debt
        vars.currentVariableDebt = scaledVariableDebt.rayMul(newVariableBorrowIndex);       //calculate the new total supply after accumulation of the index

        //calculate the stable debt until the last timestamp update
        vars.cumulatedStableInterest = MathUtils.calculateCompoundedInterest(vars.avgStableRate, vars.stableSupplyUpdatedTimestamp, timestamp );
        vars.previousStableDebt = vars.principalStableDebt.rayMul(vars.cumulatedStableInterest);

        //debt accrued is the sum of the current debt minus the sum of the debt at the last update
        vars.totalDebtAccrued = vars.currentVariableDebt.add(vars.currentStableDebt).sub(vars.previousVariableDebt).sub(vars.previousStableDebt);
        vars.amountToMint = vars.totalDebtAccrued.percentMul(vars.reserveFactor);

        if (vars.amountToMint != 0) {
            IAToken(instrument.iTokenAddress).mintToTreasury(vars.amountToMint, newLiquidityIndex);
        }
    }

    /**
    * @dev Updates the instrument's reserve indexes and the timestamp of the update
    * @param instrument The instrument reserve to be updated
    * @param scaledVariableDebt The scaled variable debt
    * @param liquidityIndex The last stored liquidity index
    * @param variableBorrowIndex The last stored variable borrow index
    **/
    function _updateIndexes( DataTypes.InstrumentData storage instrument, uint256 scaledVariableDebt, uint256 liquidityIndex, uint256 variableBorrowIndex, uint40 timestamp) internal returns (uint256, uint256) {
        uint256 currentLiquidityRate = instrument.currentLiquidityRate;

        uint256 newLiquidityIndex = liquidityIndex;
        uint256 newVariableBorrowIndex = variableBorrowIndex;

        //only cumulating if there is any income being produced
        if (currentLiquidityRate > 0) {

            uint256 cumulatedLiquidityInterest = MathUtils.calculateLinearInterest(currentLiquidityRate, timestamp);
            newLiquidityIndex = cumulatedLiquidityInterest.rayMul(liquidityIndex);
            require(newLiquidityIndex <= type(uint128).max, "Updating Indexes : Liquidity Index overflow error");
            instrument.liquidityIndex = uint128(newLiquidityIndex);

            //as the liquidity rate might come only from stable rate loans, we need to ensure that there is actual variable debt before accumulating
            if (scaledVariableDebt != 0) {
                uint256 cumulatedVariableBorrowInterest = MathUtils.calculateCompoundedInterest(reserve.currentVariableBorrowRate, timestamp);
                newVariableBorrowIndex = cumulatedVariableBorrowInterest.rayMul(variableBorrowIndex);
                require( newVariableBorrowIndex <= type(uint128).max, "Updating Indexes : Variable Borrow Index overflow error" );
                instrument.variableBorrowIndex = uint128(newVariableBorrowIndex);
            }
        }

        instrument.lastUpdateTimestamp = uint40(block.timestamp);
        return (newLiquidityIndex, newVariableBorrowIndex);
    }
}