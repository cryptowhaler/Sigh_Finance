pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";
import "../libraries/CoreLibrary.sol";
import "../libraries/WadRayMath.sol";

import "../../configuration/GlobalAddressesProvider.sol";

import "../interfaces/ILendingPoolParametersProvider.sol";
import "../interfaces/ITokenInterface.sol";
import "../interfaces/ILendingPoolCore.sol";
import "../interfaces/ILendingPoolDataProvider.sol";
import "../interfaces/IPriceOracleGetter.sol";

/**
* @title LendingPoolLiquidationManager contract
* @author Aave, SIGH Finance
* @notice Implements the liquidation function.
**/
contract LendingPoolLiquidationManager is ReentrancyGuard, VersionedInitializable {

    using SafeMath for uint256;
    using WadRayMath for uint256;
    using Address for address;

    GlobalAddressesProvider public addressesProvider;
    ILendingPoolCore core;
    ILendingPoolDataProvider dataProvider;

    uint256 constant LIQUIDATION_CLOSE_FACTOR_PERCENT = 50;

    enum LiquidationErrors {
        NO_ERROR,
        NO_COLLATERAL_AVAILABLE,
        COLLATERAL_CANNOT_BE_LIQUIDATED,
        INSTRUMENT_NOT_BORROWED,
        HEALTH_FACTOR_ABOVE_THRESHOLD,
        NOT_ENOUGH_LIQUIDITY
    }

    struct LiquidationCallLocalVars {
        uint256 userCollateralBalance;
        uint256 userCompoundedBorrowBalance;
        uint256 borrowBalanceIncrease;
        uint256 maxPrincipalAmountToLiquidate;
        uint256 actualAmountToLiquidate;
        uint256 liquidationRatio;
        uint256 collateralPrice;
        uint256 principalCurrencyPrice;
        uint256 maxAmountCollateralToLiquidate;
        uint256 originationFee;
        uint256 feeLiquidated;
        uint256 liquidatedCollateralForFee;
        CoreLibrary.InterestRateMode borrowRateMode;
        uint256 userStableRate;
        bool isCollateralEnabled;
        bool healthFactorBelowThreshold;
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


    // as the contract extends the VersionedInitializable contract to match the state of the LendingPool contract, the getRevision() function is needed.
    function getRevision() internal pure returns (uint256) {
        return 0;
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
    function liquidationCall( address _collateral, address _instrument, address _user, uint256 _purchaseAmount, bool _receiveIToken ) external payable returns (uint256, string memory) {
       
        LiquidationCallLocalVars memory vars;        // Usage of a memory struct of vars to avoid "Stack too deep" errors due to local variables

        (, , , , , , , vars.healthFactorBelowThreshold) = dataProvider.calculateUserGlobalData(  _user );

        //  ############     Health factor needs to be below threshold for liquidation to take place     ############
        if (!vars.healthFactorBelowThreshold) {
            return ( uint256(LiquidationErrors.HEALTH_FACTOR_ABOVE_THRESHOLD), "Health factor is not below the threshold" );
        }

        //  ############     if _user hasn't deposited this specific collateral, nothing can be liquidated      ############
        vars.userCollateralBalance = core.getUserUnderlyingAssetBalance(_collateral, _user);        
        if (vars.userCollateralBalance == 0) {
            return ( uint256(LiquidationErrors.NO_COLLATERAL_AVAILABLE), "Invalid collateral to liquidate" );
        }

        // ############      if _collateral isn't enabled as collateral by _user, it cannot be liquidated       ############
        vars.isCollateralEnabled = core.isInstrumentUsageAsCollateralEnabled(_collateral) && core.isUserUseInstrumentAsCollateralEnabled(_collateral, _user);
        if (!vars.isCollateralEnabled) {
            return ( uint256(LiquidationErrors.COLLATERAL_CANNOT_BE_LIQUIDATED), "The collateral chosen cannot be liquidated" );
        }

        // ############       if the user hasn't borrowed the specific currency defined by _instrument, it cannot be liquidated     ############
        (, vars.userCompoundedBorrowBalance, vars.borrowBalanceIncrease) = core.getUserBorrowBalances(_instrument, _user);
        if (vars.userCompoundedBorrowBalance == 0) {
            return ( uint256(LiquidationErrors.INSTRUMENT_NOT_BORROWED), "User did not borrow the specified currency");
        }

        //  ############       all clear - calculate the max principal amount that can be liquidated          ############
        vars.maxPrincipalAmountToLiquidate = vars.userCompoundedBorrowBalance.mul(LIQUIDATION_CLOSE_FACTOR_PERCENT).div(100);
        vars.actualAmountToLiquidate = _purchaseAmount > vars.maxPrincipalAmountToLiquidate ? vars.maxPrincipalAmountToLiquidate : _purchaseAmount;

        (uint256 maxCollateralToLiquidate, uint256 principalAmountNeeded) = calculateAvailableCollateralToLiquidate( _collateral, _instrument, vars.actualAmountToLiquidate, vars.userCollateralBalance );

        vars.originationFee = core.getUserOriginationFee(_instrument, _user);

        //  ############         if there is a fee to liquidate, calculate the maximum amount of fee that can be liquidated       ############
        if (vars.originationFee > 0) {
            ( vars.liquidatedCollateralForFee, vars.feeLiquidated ) = calculateAvailableCollateralToLiquidate( _collateral, _instrument, vars.originationFee, vars.userCollateralBalance.sub(maxCollateralToLiquidate) );
        }

        //if principalAmountNeeded < vars.ActualAmountToLiquidate, there isn't enough of _collateral to cover the actual amount that is being liquidated, hence we liquidate a smaller amount
        if (principalAmountNeeded < vars.actualAmountToLiquidate) {
            vars.actualAmountToLiquidate = principalAmountNeeded;
        }

        //if liquidator reclaims the underlying asset, we make sure there is enough available collateral in the instrument
        if (!_receiveIToken) {
            uint256 currentAvailableCollateral = core.getInstrumentAvailableLiquidity(_collateral);
            if (currentAvailableCollateral < maxCollateralToLiquidate) {
                return ( uint256(LiquidationErrors.NOT_ENOUGH_LIQUIDITY), "There isn't enough liquidity available to liquidate" );
            }
        }

        core.updateStateOnLiquidation( _instrument, _collateral, _user, vars.actualAmountToLiquidate, maxCollateralToLiquidate, vars.feeLiquidated, vars.liquidatedCollateralForFee, vars.borrowBalanceIncrease, _receiveIToken );
        ITokenInterface collateralIToken = ITokenInterface(core.getInstrumentITokenAddress(_collateral));
        
        if (_receiveIToken) {               //if liquidator reclaims the iToken, he receives the equivalent iToken amount
            collateralIToken.transferOnLiquidation(_user, msg.sender, maxCollateralToLiquidate);
        } 
        else {                           //otherwise receives the underlying asset burn the equivalent amount of iToken    
            collateralIToken.burnOnLiquidation(_user, maxCollateralToLiquidate);
            core.transferToUser(_collateral, msg.sender, maxCollateralToLiquidate);
        }

        core.transferToReserve.value(msg.value)(_instrument, msg.sender, vars.actualAmountToLiquidate);        //transfers the principal currency to the pool

        if (vars.feeLiquidated > 0) {           //if there is enough collateral to liquidate the fee, first transfer burn an equivalent amount of iTokens of the user            
            collateralIToken.burnOnLiquidation(_user, vars.liquidatedCollateralForFee);
            core.liquidateFee( _collateral, vars.liquidatedCollateralForFee, addressesProvider.getTokenDistributor() );     //then liquidate the fee by transferring it to the fee collection address
            emit OriginationFeeLiquidated( _collateral, _instrument, _user, vars.feeLiquidated, vars.liquidatedCollateralForFee,  block.timestamp );
        }
        emit LiquidationCall(  _collateral,  _instrument,  _user,  vars.actualAmountToLiquidate,  maxCollateralToLiquidate,  vars.borrowBalanceIncrease,  msg.sender,  _receiveIToken, block.timestamp  );

        return (uint256(LiquidationErrors.NO_ERROR), "No errors");
    }

    struct AvailableCollateralToLiquidateLocalVars {
        uint256 userCompoundedBorrowBalance;
        uint256 liquidationBonus;
        uint256 collateralPrice;
        uint256 principalCurrencyPrice;
        uint256 maxAmountCollateralToLiquidate;
    }

    /**
    * @dev calculates how much of a specific collateral can be liquidated, given
    * a certain amount of principal currency. This function needs to be called after
    * all the checks to validate the liquidation have been performed, otherwise it might fail.
    * @param _collateral the collateral to be liquidated
    * @param _principal the principal currency to be liquidated
    * @param _purchaseAmount the amount of principal being liquidated
    * @param _userCollateralBalance the collatera balance for the specific _collateral asset of the user being liquidated
    * @return the maximum amount that is possible to liquidated given all the liquidation constraints (user balance, close factor) and
    * the purchase amount
    **/
    function calculateAvailableCollateralToLiquidate( address _collateral, address _principal, uint256 _purchaseAmount, uint256 _userCollateralBalance ) internal view returns (uint256 collateralAmount, uint256 principalAmountNeeded) {
        collateralAmount = 0;
        principalAmountNeeded = 0;
        IPriceOracleGetter oracle = IPriceOracleGetter(addressesProvider.getPriceOracle());
        AvailableCollateralToLiquidateLocalVars memory vars;                     // Usage of a memory struct of vars to avoid "Stack too deep" errors due to local variables
        vars.collateralPrice = oracle.getAssetPrice(_collateral);
        vars.principalCurrencyPrice = oracle.getAssetPrice(_principal);
        vars.liquidationBonus = core.getInstrumentLiquidationBonus(_collateral);

        //this is the maximum possible amount of the selected collateral that can be liquidated, given the max amount of principal currency that is available for liquidation.
        vars.maxAmountCollateralToLiquidate = vars.principalCurrencyPrice.mul(_purchaseAmount).div(vars.collateralPrice).mul(vars.liquidationBonus).div(100);

        if (vars.maxAmountCollateralToLiquidate > _userCollateralBalance) {
            collateralAmount = _userCollateralBalance;
            principalAmountNeeded = vars.collateralPrice.mul(collateralAmount).div(vars.principalCurrencyPrice).mul(100).div(vars.liquidationBonus);
        } else {
            collateralAmount = vars.maxAmountCollateralToLiquidate;
            principalAmountNeeded = _purchaseAmount;
        }

        return (collateralAmount, principalAmountNeeded);
    }
}
