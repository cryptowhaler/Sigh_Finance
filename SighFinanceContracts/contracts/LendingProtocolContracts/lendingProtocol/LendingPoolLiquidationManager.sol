pragma solidity 0.6.12;

import {SafeMath} from '../../dependencies/openzeppelin/contracts//SafeMath.sol';
import {IERC20} from '../../dependencies/openzeppelin/contracts//IERC20.sol';
import {SafeERC20} from '../../dependencies/openzeppelin/contracts/SafeERC20.sol';

import {IAToken} from '../../interfaces/IAToken.sol';
import {IStableDebtToken} from '../../interfaces/IStableDebtToken.sol';
import {IVariableDebtToken} from '../../interfaces/IVariableDebtToken.sol';
import {IPriceOracleGetter} from '../../interfaces/IPriceOracleGetter.sol';
import {ILendingPoolCollateralManager} from '../../interfaces/ILendingPoolLiquidationManager.sol';

import {VersionedInitializable} from '../libraries/aave-upgradeability/VersionedInitializable.sol';
import {GenericLogic} from '../libraries/logic/GenericLogic.sol';
import {Helpers} from '../libraries/helpers/Helpers.sol';
import {WadRayMath} from '../libraries/math/WadRayMath.sol';
import {PercentageMath} from '../libraries/math/PercentageMath.sol';
import {Errors} from '../libraries/helpers/Errors.sol';
import {ValidationLogic} from '../libraries/logic/ValidationLogic.sol';
import {DataTypes} from '../libraries/types/DataTypes.sol';

import {LendingPoolStorage} from './LendingPoolStorage.sol';

/**
* @title LendingPoolLiquidationManager contract
* @author Aave, SIGH Finance
* @notice Implements the liquidation function.
**/
contract LendingPoolLiquidationManager is   ILendingPoolLiquidationManager, VersionedInitializable, LendingPoolStorage {

    using SafeERC20 for IERC20;
    using SafeMath for uint256;
    using WadRayMath for uint256;
    using PercentageMath for uint256;

    GlobalAddressesProvider public addressesProvider;
    ILendingPoolCore core;
    ILendingPoolDataProvider dataProvider;

    uint256 constant LIQUIDATION_CLOSE_FACTOR_PERCENT = 5000;   // 50 % 

    struct LiquidationCallLocalVars {
        uint256 userCollateralBalance;
        uint256 userStableDebt;
        uint256 userVariableDebt;
        uint256 maxLiquidatableDebt;
        uint256 actualDebtToLiquidate;
        uint256 liquidationRatio;
        uint256 maxAmountCollateralToLiquidate;
        uint256 userStableRate;
        uint256 maxCollateralToLiquidate;
        uint256 debtAmountNeeded;
        uint256 healthFactor;
        uint256 liquidatorPreviousATokenBalance;
        IAToken collateralAtoken;
        bool isCollateralEnabled;
        DataTypes.InterestRateMode borrowRateMode;
        uint256 errorCode;
        string errorMsg;
    }

// #####################
// ######  EVENTS ######
// #####################

    /**
    * @dev emitted when a borrow fee is liquidated
    * @param _collateral the address of the collateral being liquidated
    * @param _instrument the address of the instrument
    * @param _user the address of the user being liquidated
    * @param _feeLiquidated the total fee liquidated
    * @param _liquidatedCollateralForFee the amount of collateral received by the protocol in exchange for the fee
    * @param _timestamp the timestamp of the action
    **/
    event OriginationFeeLiquidated( address indexed _collateral, address indexed _instrument, address indexed _user,  uint256 _feeLiquidated,  uint256 _liquidatedCollateralForFee,  uint256 _timestamp );

    /**
    * @dev emitted when a borrower is liquidated
    * @param _collateral the address of the collateral being liquidated
    * @param _instrument the address of the instrument
    * @param _user the address of the user being liquidated
    * @param _purchaseAmount the total amount liquidated
    * @param _liquidatedCollateralAmount the amount of collateral being liquidated
    * @param _accruedBorrowInterest the amount of interest accrued by the borrower since the last action
    * @param _liquidator the address of the liquidator
    * @param _receiveIToken true if the liquidator wants to receive iTokens, false otherwise
    * @param _timestamp the timestamp of the action
    **/
    event LiquidationCall( address indexed _collateral, address indexed _instrument, address indexed _user, uint256 _purchaseAmount, uint256 _liquidatedCollateralAmount, uint256 _accruedBorrowInterest, address _liquidator, bool _receiveIToken, uint256 _timestamp );
    
    uint256 public constant LIQUIDATIONMANAGERL_REVISION = 0x1;             // NEEDED AS PART OF UPGRADABLE CONTRACTS FUNCTIONALITY ( VersionedInitializable )


    // as the contract extends the VersionedInitializable contract to match the state of the LendingPool contract, the getRevision() function is needed.
    function getRevision() internal pure returns (uint256) {
        return LIQUIDATIONMANAGERL_REVISION;
    }

// #############################################################################################################################################
// ######  LIQUIDATION FUNCTION --> Anyone can call this function to liquidate the position of the user whose position can be liquidated  ######
// #############################################################################################################################################

    /**
    * @dev users can invoke this function to liquidate an undercollateralized position. (Also defined in the LendingPool Contract, which delegates the Call here)
    * @param _collateral the address of the collateral to liquidated
    * @param _instrument the address of the principal instrument
    * @param _user the address of the borrower
    * @param _purchaseAmount the amount of principal that the liquidator wants to repay
    * @param _receiveIToken true if the liquidators wants to receive the iTokens, false if he wants to receive the underlying asset directly
    **/
    function liquidationCall( address collateralAsset, address debtAsset, address user, uint256 debtToCover, bool receiveIToken ) external payable returns (uint256, string memory) {

        DataTypes.InstrumentData storage collateralInstrument =_instruments[collateralAsset];
        DataTypes.InstrumentData storage debtInstrument =_instruments[debtAsset];
        DataTypes.UserConfigurationMap storage userConfig = _usersConfig[user];       

        LiquidationCallLocalVars memory vars;        // Usage of a memory struct of vars to avoid "Stack too deep" errors due to local variables

        (, , , , vars.healthFactor) = GenericLogic.calculateUserAccountData( user,_instruments, userConfig,_instrumentsList,_instrumentsCount, _addressesProvider.getPriceOracle() );
        (vars.userStableDebt, vars.userVariableDebt) = Helpers.getUserCurrentDebt(user, debtInstrument);
        (vars.errorCode, vars.errorMsg) = ValidationLogic.validateLiquidationCall( collateralInstrument, debtInstrument, userConfig, vars.healthFactor, vars.userStableDebt, vars.userVariableDebt );

        if (Errors.CollateralManagerErrors(vars.errorCode) != Errors.CollateralManagerErrors.NO_ERROR) {
            return (vars.errorCode, vars.errorMsg);
        }

        vars.collateralAtoken = IAToken(collateralInstrument.iTokenAddress);
        vars.userCollateralBalance = vars.collateralAtoken.balanceOf(user);

        vars.maxLiquidatableDebt = vars.userStableDebt.add(vars.userVariableDebt).percentMul(  LIQUIDATION_CLOSE_FACTOR_PERCENT );
        vars.actualDebtToLiquidate = debtToCover > vars.maxLiquidatableDebt ? vars.maxLiquidatableDebt : debtToCover;

        (  vars.maxCollateralToLiquidate,  vars.debtAmountNeeded) = _calculateAvailableCollateralToLiquidate( collateralInstrument, debtInstrument, collateralAsset, debtAsset, vars.actualDebtToLiquidate, vars.userCollateralBalance );

    // ###########################

        // FEE RELATED
        (vars.userStableDebtPlatformFee, vars.userVariableDebtPlatformFee) = Helpers.getUserCurrentPlatformFee(user, debtInstrument);
        (vars.userStableDebtReserveFee, vars.userVariableDebtReserveFee) = Helpers.getUserReserveFee(user, debtInstrument);

        // FEE RELATED
        vars.maxLiquidatablePlatformFee = vars.userStableDebtPlatformFee.add(vars.userVariableDebtPlatformFee).percentMul(LIQUIDATION_CLOSE_FACTOR_PERCENT);
        vars.maxLiquidatableReserveFee = vars.userStableDebtReserveFee.add(vars.userVariableDebtReserveFee).percentMul(LIQUIDATION_CLOSE_FACTOR_PERCENT);

        // Platform FEE RELATED
        if (vars.maxLiquidatablePlatformFee > 0) {
            (  vars.maxCollateralToLiquidateForPlatformFee,  vars.platformFeeLiquidated) = _calculateAvailableCollateralToLiquidate( collateralInstrument, debtInstrument, collateralAsset, debtAsset, vars.maxLiquidatablePlatformFee, vars.userCollateralBalance.sub(vars.maxCollateralToLiquidate) );
        } 

        // Reserve FEE RELATED
        if (vars.maxLiquidatableReserveFee > 0) {
            (  vars.maxCollateralToLiquidateForReserveFee,  vars.reserveFeeLiquidated) = _calculateAvailableCollateralToLiquidate( collateralInstrument, debtInstrument, collateralAsset, debtAsset, vars.maxLiquidatableReserveFee, vars.userCollateralBalance.sub(vars.maxCollateralToLiquidate).sub(vars.maxCollateralToLiquidateForPlatformFee) );
        } 

    // ###########################

        // If debtAmountNeeded < actualDebtToLiquidate, there isn't enough collateral to cover the actual amount that is being liquidated, hence we liquidate a smaller amount
        if (vars.debtAmountNeeded < vars.actualDebtToLiquidate) {
            vars.actualDebtToLiquidate = vars.debtAmountNeeded;
        }

        // If the liquidator reclaims the underlying asset, we make sure there is enough available liquidity in the collateral reserve
        if (!receiveIToken) {
            uint256 currentAvailableCollateral = IERC20(collateralAsset).balanceOf(address(vars.collateralAtoken));
            if (currentAvailableCollateral < vars.maxCollateralToLiquidate) {
                return (  uint256(Errors.CollateralManagerErrors.NOT_ENOUGH_LIQUIDITY),  Errors.LPCM_NOT_ENOUGH_LIQUIDITY_TO_LIQUIDATE );
            }
        }

        debtInstrument.updateState();

        if (vars.userVariableDebt >= vars.actualDebtToLiquidate) {
            IVariableDebtToken(debtInstrument.variableDebtTokenAddress).burn( user, vars.actualDebtToLiquidate, debtInstrument.variableBorrowIndex );
        } 
        else {      // If the user doesn't have variable debt, no need to try to burn variable debt tokens            
            if (vars.userVariableDebt > 0) {
                IVariableDebtToken(debtInstrument.variableDebtTokenAddress).burn( user, vars.userVariableDebt, debtInstrument.variableBorrowIndex );
            }
            IStableDebtToken(debtInstrument.stableDebtTokenAddress).burn( user, vars.actualDebtToLiquidate.sub(vars.userVariableDebt) );
        }

        debtInstrument.updateInterestRates( debtAsset, debtInstrument.iTokenAddress, vars.actualDebtToLiquidate, 0 );

        if (receiveIToken) {
            vars.liquidatorPreviousATokenBalance = IERC20(vars.collateralAtoken).balanceOf(msg.sender);
            vars.collateralAtoken.transferOnLiquidation(user, msg.sender, vars.maxCollateralToLiquidate);

            if (vars.liquidatorPreviousATokenBalance == 0) {
                DataTypes.UserConfigurationMap storage liquidatorConfig = _usersConfig[msg.sender];
                liquidatorConfig.setUsingAsCollateral(collateralInstrument.id, true);
                emit ReserveUsedAsCollateralEnabled(collateralAsset, msg.sender);
            }
        } 
        else {
            collateralInstrument.updateState();
            collateralInstrument.updateInterestRates( collateralAsset, address(vars.collateralAtoken), 0, vars.maxCollateralToLiquidate);

            // Burn the equivalent amount of aToken, sending the underlying to the liquidator
            vars.collateralAtoken.burn(user,msg.sender, vars.maxCollateralToLiquidate, collateralInstrument.liquidityIndex);
        }

        // If the collateral being liquidated is equal to the user balance, we set the currency as not being used as collateral anymore
        if (vars.maxCollateralToLiquidate == vars.userCollateralBalance) {
            userConfig.setUsingAsCollateral(collateralInstrument.id, false);
            emit InstrumentUsedAsCollateralDisabled(collateralAsset, user);
        }

        // Transfers the debt asset being repaid to the aToken, where the liquidity is kept
        IERC20(debtAsset).safeTransferFrom( msg.sender, debtInstrument.iTokenAddress, vars.actualDebtToLiquidate);

        emit LiquidationCall(collateralAsset, debtAsset, user, vars.actualDebtToLiquidate, vars.maxCollateralToLiquidate, msg.sender, receiveIToken);

        return (uint256(Errors.CollateralManagerErrors.NO_ERROR), Errors.LPCM_NO_ERRORS);
    }
















    struct AvailableCollateralToLiquidateLocalVars {
        uint256 userCompoundedBorrowBalance;
        uint256 liquidationBonus;
        uint256 collateralPrice;
        uint256 debtAssetPrice;
        uint256 maxAmountCollateralToLiquidate;
        uint256 debtAssetDecimals;
        uint256 collateralDecimals;
    }

    /**
    * @dev Calculates how much of a specific collateral can be liquidated, given a certain amount of debt asset.
    * - This function needs to be called after all the checks to validate the liquidation have been performed, otherwise it might fail.
    * @param collateralInstrument The data of the collateral reserve
    * @param debtInstrument The data of the debt reserve
    * @param collateralAsset The address of the underlying asset used as collateral, to receive as result of the liquidation
    * @param debtAsset The address of the underlying borrowed asset to be repaid with the liquidation
    * @param debtToCover The debt amount of borrowed `asset` the liquidator wants to cover
    * @param userCollateralBalance The collateral balance for the specific `collateralAsset` of the user being liquidated
    * @return collateralAmount: The maximum amount that is possible to liquidate given all the liquidation constraints  (user balance, close factor)
    *         debtAmountNeeded: The amount to repay with the liquidation
    **/
    function _calculateAvailableCollateralToLiquidate(  DataTypes.InstrumentData storage collateralInstrument,  DataTypes.InstrumentData storage debtInstrument,  address collateralAsset,  address debtAsset, uint256 debtToCover, uint256 userCollateralBalance ) internal view returns (uint256, uint256) {
        uint256 collateralAmount = 0;
        uint256 debtAmountNeeded = 0;
        IPriceOracleGetter oracle = IPriceOracleGetter(_addressesProvider.getPriceOracle());

        AvailableCollateralToLiquidateLocalVars memory vars;

        vars.collateralPrice = oracle.getAssetPrice(collateralAsset);
        vars.debtAssetPrice = oracle.getAssetPrice(debtAsset);

        (, , vars.liquidationBonus, vars.collateralDecimals, ) = collateralInstrument.configuration.getParams();
        vars.debtAssetDecimals = debtInstrument.configuration.getDecimals();

        // This is the maximum possible amount of the selected collateral that can be liquidated, given the max amount of liquidatable debt
        vars.maxAmountCollateralToLiquidate = vars.debtAssetPrice.mul(debtToCover).mul(10**vars.collateralDecimals).percentMul(vars.liquidationBonus).div( vars.collateralPrice.mul(10**vars.debtAssetDecimals) );

        if (vars.maxAmountCollateralToLiquidate > userCollateralBalance) {
            collateralAmount = userCollateralBalance;
            debtAmountNeeded = vars.collateralPrice.mul(collateralAmount).mul(10**vars.debtAssetDecimals).div(vars.debtAssetPrice.mul(10**vars.collateralDecimals)).percentDiv(vars.liquidationBonus);
        } 
        else {
            collateralAmount = vars.maxAmountCollateralToLiquidate;
            debtAmountNeeded = debtToCover;
        }
        return (collateralAmount, debtAmountNeeded);
    }
}