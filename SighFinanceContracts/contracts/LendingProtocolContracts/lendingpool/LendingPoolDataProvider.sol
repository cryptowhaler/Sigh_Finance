pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";

import "../libraries/CoreLibrary.sol";
import "../libraries/WadRayMath.sol";

import "../../configuration/GlobalAddressesProvider.sol";
import "../interfaces/IPriceOracleGetter.sol";
import "../interfaces/IFeeProvider.sol";
import "../interfaces/ITokenInterface.sol";
import "../interfaces/ILendingPoolCore.sol";

/**
* @title LendingPoolDataProvider contract 
* @author Aave, SIGH Finance 
* @notice Implements functions to fetch data from the core, and aggregate them in order to allow computation on the compounded balances and the account balances in ETH
**/
contract LendingPoolDataProvider is VersionedInitializable {
    using SafeMath for uint256;
    using WadRayMath for uint256;

    ILendingPoolCore public core;
    GlobalAddressesProvider public addressesProvider;

    //specifies the health factor threshold at which the user position is liquidated. 1e18 by default, if the health factor drops below 1e18, the loan can be liquidated.
    uint256 public constant HEALTH_FACTOR_LIQUIDATION_THRESHOLD = 1e18;
    uint256 public constant DATA_PROVIDER_REVISION = 0x1;           // NEEDED AS PART OF UPGRADABLE CONTRACTS FUNCTIONALITY ( VersionedInitializable )

    function getRevision() internal pure returns (uint256) {
        return DATA_PROVIDER_REVISION;
    }

    function initialize(GlobalAddressesProvider _addressesProvider) public initializer {       // NEEDED AS PART OF UPGRADABLE CONTRACTS FUNCTIONALITY ( VersionedInitializable )
        addressesProvider = _addressesProvider;
        core = ILendingPoolCore(_addressesProvider.getLendingPoolCore());
    }

// #############################################################################################################################
// ############ PUBLIC VIEW FUNCTION (also called within this contract) TO CALCULATE USER DATA ACROSS THE PROTOCOL  ############
// #############################################################################################################################

    /**
    * @dev struct to hold calculateUserGlobalData() local computations
    **/
    struct UserGlobalDataLocalVars {
        uint256 instrumentUnitPrice;
        uint256 tokenUnit;
        uint256 compoundedLiquidityBalance;
        uint256 compoundedBorrowBalance;
        uint256 instrumentDecimals;
        uint256 baseLtv;
        uint256 liquidationThreshold;
        uint256 originationFee;
        bool usageAsCollateralEnabled;
        bool userUsesInstrumentAsCollateral;
        address currentInstrument;
    }

    /**
    * @dev calculates the user data across the instruments.
    * this includes the total liquidity/collateral/borrow balances in ETH,
    * the average Loan To Value, the average Liquidation Ratio, and the Health factor.
    * @param _user the address of the user
    * @return the total liquidity, total collateral, total borrow balances of the user in ETH.
    * also the average Ltv, liquidation threshold, and the health factor
    **/
    function calculateUserGlobalData(address _user) public view returns (
            uint256 totalLiquidityBalanceETH,
            uint256 totalCollateralBalanceETH,
            uint256 totalBorrowBalanceETH,
            uint256 totalFeesETH,
            uint256 currentLtv,
            uint256 currentLiquidationThreshold,
            uint256 healthFactor,
            bool healthFactorBelowThreshold
        )
    {
        IPriceOracleGetter oracle = IPriceOracleGetter(addressesProvider.getPriceOracle());
        UserGlobalDataLocalVars memory vars;        // Usage of a memory struct of vars to avoid "Stack too deep" errors due to local variables

        address[] memory instruments = core.getInstruments();

        for (uint256 i = 0; i < instruments.length; i++) {

            vars.currentInstrument = instruments[i];
            ( vars.compoundedLiquidityBalance, vars.compoundedBorrowBalance, vars.originationFee, vars.userUsesInstrumentAsCollateral ) = core.getUserBasicInstrumentData(vars.currentInstrument, _user);
            if (vars.compoundedLiquidityBalance == 0 && vars.compoundedBorrowBalance == 0) {
                continue;
            }

            //fetch instrument data
            ( vars.instrumentDecimals, vars.baseLtv, vars.liquidationThreshold, vars.usageAsCollateralEnabled ) = core.getInstrumentConfiguration(vars.currentInstrument);
            vars.tokenUnit = 10 ** vars.instrumentDecimals;
            vars.instrumentUnitPrice = oracle.getAssetPrice(vars.currentInstrument);

            //liquidity and collateral balance
            if (vars.compoundedLiquidityBalance > 0) {
                uint256 liquidityBalanceETH = vars.instrumentUnitPrice.mul(vars.compoundedLiquidityBalance).div(vars.tokenUnit);
                totalLiquidityBalanceETH = totalLiquidityBalanceETH.add(liquidityBalanceETH);

                if (vars.usageAsCollateralEnabled && vars.userUsesInstrumentAsCollateral) {
                    totalCollateralBalanceETH = totalCollateralBalanceETH.add(liquidityBalanceETH);
                    currentLtv = currentLtv.add( liquidityBalanceETH.mul(vars.baseLtv) );
                    currentLiquidationThreshold = currentLiquidationThreshold.add( liquidityBalanceETH.mul(vars.liquidationThreshold) );
                }
            }

            if (vars.compoundedBorrowBalance > 0) {
                totalBorrowBalanceETH = totalBorrowBalanceETH.add( vars.instrumentUnitPrice.mul(vars.compoundedBorrowBalance).div(vars.tokenUnit) );
                totalFeesETH = totalFeesETH.add( vars.originationFee.mul(vars.instrumentUnitPrice).div(vars.tokenUnit) );
            }
        }

        currentLtv = totalCollateralBalanceETH > 0 ? currentLtv.div(totalCollateralBalanceETH) : 0;
        currentLiquidationThreshold = totalCollateralBalanceETH > 0 ? currentLiquidationThreshold.div(totalCollateralBalanceETH) : 0;

        healthFactor = calculateHealthFactorFromBalancesInternal( totalCollateralBalanceETH, totalBorrowBalanceETH, totalFeesETH, currentLiquidationThreshold );
        healthFactorBelowThreshold = healthFactor < HEALTH_FACTOR_LIQUIDATION_THRESHOLD;
    }

// ############################################################################################################################################################
// ############ EXTERNAL VIEW FUNCTION (called within LendingPool's setUserUseInstrumentAsCollateral() FUNCTION)    ###########################################
// ############ balanceDecreaseAllowedLocalVars() --> check if a specific balance decrease doesn't bring the user borrow position health factor    ############
// ############################################################################################################################################################

    struct balanceDecreaseAllowedLocalVars {
        uint256 decimals;
        uint256 collateralBalanceETH;
        uint256 borrowBalanceETH;
        uint256 totalFeesETH;
        uint256 currentLiquidationThreshold;
        uint256 instrumentLiquidationThreshold;
        uint256 amountToDecreaseETH;
        uint256 collateralBalancefterDecrease;
        uint256 liquidationThresholdAfterDecrease;
        uint256 healthFactorAfterDecrease;
        bool instrumentUsageAsCollateralEnabled;
    }

    /**
    * @dev check if a specific balance decrease is allowed (i.e. doesn't bring the user borrow position health factor under 1e18)
    * @param _instrument the address of the instrument
    * @param _user the address of the user
    * @param _amount the amount to decrease
    * @return true if the decrease of the balance is allowed
    **/
    function balanceDecreaseAllowed(address _instrument, address _user, uint256 _amount)  external view returns (bool) {
        
        balanceDecreaseAllowedLocalVars memory vars;    // Usage of a memory struct of vars to avoid "Stack too deep" errors due to local variables
        ( vars.decimals, ,  vars.instrumentLiquidationThreshold, vars.instrumentUsageAsCollateralEnabled ) = core.getInstrumentConfiguration(_instrument);

        if ( !vars.instrumentUsageAsCollateralEnabled || !core.isUserUseInstrumentAsCollateralEnabled(_instrument, _user) ) {
            return true;                                             // if instrument is not used as collateral, no reasons to block the transfer
        }

        (  , vars.collateralBalanceETH, vars.borrowBalanceETH, vars.totalFeesETH, , vars.currentLiquidationThreshold, , ) = calculateUserGlobalData(_user);

        if (vars.borrowBalanceETH == 0) {
            return true;                                            //  no borrows - no reasons to block the transfer
        }

        IPriceOracleGetter oracle = IPriceOracleGetter(addressesProvider.getPriceOracle());
        vars.amountToDecreaseETH = oracle.getAssetPrice(_instrument).mul(_amount).div( 10 ** vars.decimals );
        vars.collateralBalancefterDecrease = vars.collateralBalanceETH.sub(  vars.amountToDecreaseETH );

        
        if (vars.collateralBalancefterDecrease == 0) {      //if there is a borrow, there can't be 0 collateral
            return false;
        }

        vars.liquidationThresholdAfterDecrease = vars.collateralBalanceETH.mul(vars.currentLiquidationThreshold).sub(vars.amountToDecreaseETH.mul(vars.instrumentLiquidationThreshold)).div(vars.collateralBalancefterDecrease);
        uint256 healthFactorAfterDecrease = calculateHealthFactorFromBalancesInternal( vars.collateralBalancefterDecrease, vars.borrowBalanceETH, vars.totalFeesETH, vars.liquidationThresholdAfterDecrease );

        return healthFactorAfterDecrease > HEALTH_FACTOR_LIQUIDATION_THRESHOLD;
    }

// ##########################################################################################################################################
// ############ EXTERNAL VIEW FUNCTION (called within LendingPool's borrow() FUNCTION)    ###################################################
// ############ calculateCollateralNeededInETH() --> calculates the amount of collateral needed in ETH to cover a new borrow     ############
// ##########################################################################################################################################


    /**
   * @notice calculates the amount of collateral needed in ETH to cover a new borrow.
   * @param _instrument the instrument from which the user wants to borrow
   * @param _amount the amount the user wants to borrow
   * @param _fee the fee for the amount that the user needs to cover
   * @param _userCurrentBorrowBalanceTH the current borrow balance of the user (before the borrow)
   * @param _userCurrentLtv the average ltv of the user given his current collateral
   * @return the total amount of collateral in ETH to cover the current borrow balance + the new amount + fee
   **/
    function calculateCollateralNeededInETH( address _instrument, uint256 _amount, uint256 _fee, uint256 _userCurrentBorrowBalanceTH, uint256 _userCurrentFeesETH, uint256 _userCurrentLtv ) external view returns (uint256) {

        uint256 instrumentDecimals = core.getInstrumentDecimals(_instrument);
        IPriceOracleGetter oracle = IPriceOracleGetter(addressesProvider.getPriceOracle());
        uint256 requestedBorrowAmountETH = oracle.getAssetPrice(_instrument).mul(_amount.add(_fee)).div(10 ** instrumentDecimals); //price is in ether

        //add the current already borrowed amount to the amount requested to calculate the total collateral needed.
        uint256 collateralNeededInETH = _userCurrentBorrowBalanceTH.add(_userCurrentFeesETH).add(requestedBorrowAmountETH).mul(100).div(_userCurrentLtv); //LTV is calculated in percentage

        return collateralNeededInETH;

    }


// ##########################################################################################################################################
// ############ EXTERNAL VIEW FUNCTIONS WHICH SIMPLY GET DATA FROM CORE CONTRACT  ###########################################################
// ############ 1. getInstrumentConfigurationData() --> Returns the configuration paramters related to an instrument     #######################
// ############ 2. getInstrumentData() --> Returns the performance metrics  related to an instrument    ########################################
// ############ 3. getUserInstrumentData() --> Returns the details of the user balance in an instrument   ######################################
// ##########################################################################################################################################

    /**
    * @dev accessory functions to fetch data from the lendingPoolCore
    **/
    function getInstrumentConfigurationData(address _instrument) external view returns ( uint256 ltv,  uint256 liquidationThreshold, uint256 liquidationBonus,  address rateStrategyAddress, bool usageAsCollateralEnabled, bool borrowingEnabled, bool stableBorrowRateEnabled,  bool isActive ) {
        (, ltv, liquidationThreshold, usageAsCollateralEnabled) = core.getInstrumentConfiguration( _instrument );
        stableBorrowRateEnabled = core.getInstrumentIsStableBorrowRateEnabled(_instrument);
        borrowingEnabled = core.isInstrumentBorrowingEnabled(_instrument);
        isActive = core.getInstrumentIsActive(_instrument);
        liquidationBonus = core.getInstrumentLiquidationBonus(_instrument);
        rateStrategyAddress = core.getInstrumentInterestRateStrategyAddress(_instrument);
    }

    function getInstrumentData(address _instrument) external view returns (
            uint256 totalLiquidity,
            uint256 availableLiquidity,
            uint256 totalBorrowsStable,
            uint256 totalBorrowsVariable,
            uint256 liquidityRate,
            uint256 variableBorrowRate,
            uint256 stableBorrowRate,
            uint256 averageStableBorrowRate,
            uint256 utilizationRate,
            uint256 liquidityIndex,
            uint256 variableBorrowIndex,
            address iTokenAddress,
            uint40 lastUpdateTimestamp
        )
    {
        totalLiquidity = core.getInstrumentTotalLiquidity(_instrument);
        availableLiquidity = core.getInstrumentAvailableLiquidity(_instrument);
        totalBorrowsStable = core.getInstrumentTotalBorrowsStable(_instrument);
        totalBorrowsVariable = core.getInstrumentTotalBorrowsVariable(_instrument);
        liquidityRate = core.getInstrumentCurrentLiquidityRate(_instrument);
        variableBorrowRate = core.getInstrumentCurrentVariableBorrowRate(_instrument);
        stableBorrowRate = core.getInstrumentCurrentStableBorrowRate(_instrument);
        averageStableBorrowRate = core.getInstrumentCurrentAverageStableBorrowRate(_instrument);
        utilizationRate = core.getInstrumentUtilizationRate(_instrument);
        liquidityIndex = core.getInstrumentLiquidityCumulativeIndex(_instrument);
        variableBorrowIndex = core.getInstrumentVariableBorrowsCumulativeIndex(_instrument);
        iTokenAddress = core.getInstrumentITokenAddress(_instrument);
        lastUpdateTimestamp = core.getInstrumentLastUpdate(_instrument);
    }

    function getUserInstrumentData(address _instrument, address _user) external view returns (
            uint256 currentITokenBalance,
            uint256 currentBorrowBalance,
            uint256 principalBorrowBalance,
            uint256 borrowRateMode,
            uint256 borrowRate,
            uint256 liquidityRate,
            uint256 originationFee,
            uint256 variableBorrowIndex,
            uint256 lastUpdateTimestamp,
            bool usageAsCollateralEnabled
        )
    {
        currentITokenBalance = ITokenInterface(core.getInstrumentITokenAddress(_instrument)).balanceOf(_user);
        CoreLibrary.InterestRateMode mode = core.getUserCurrentBorrowRateMode(_instrument, _user);
        (principalBorrowBalance, currentBorrowBalance, ) = core.getUserBorrowBalances(  _instrument, _user  );

        //default is 0, if mode == CoreLibrary.InterestRateMode.NONE
        if (mode == CoreLibrary.InterestRateMode.STABLE) {
            borrowRate = core.getUserCurrentStableBorrowRate(_instrument, _user);
        } 
        else if (mode == CoreLibrary.InterestRateMode.VARIABLE) {
            borrowRate = core.getInstrumentCurrentVariableBorrowRate(_instrument);
        }

        borrowRateMode = uint256(mode);
        liquidityRate = core.getInstrumentCurrentLiquidityRate(_instrument);
        originationFee = core.getUserOriginationFee(_instrument, _user);
        variableBorrowIndex = core.getUserVariableBorrowCumulativeIndex(_instrument, _user);
        lastUpdateTimestamp = core.getUserLastUpdate(_instrument, _user);
        usageAsCollateralEnabled = core.isUserUseInstrumentAsCollateralEnabled(_instrument, _user);
    }

// #####################################################################################
// ############ returns the health factor liquidation threshold  #######################
// #####################################################################################

    function getHealthFactorLiquidationThreshold() public pure returns (uint256) {
        return HEALTH_FACTOR_LIQUIDATION_THRESHOLD;
    }


// ################################################################################################
// ############ EXTERNAL VIEW FUNCTION  ###########################################################
// ############ 1. getUserAccountData() --> Returns the global account data for a user     ########
// ################################################################################################

    function getUserAccountData(address _user) external view returns (
            uint256 totalLiquidityETH,
            uint256 totalCollateralETH,
            uint256 totalBorrowsETH,
            uint256 totalFeesETH,
            uint256 availableBorrowsETH,
            uint256 currentLiquidationThreshold,
            uint256 ltv,
            uint256 healthFactor
        )
    {
        ( totalLiquidityETH, totalCollateralETH, totalBorrowsETH, totalFeesETH, ltv,  currentLiquidationThreshold, healthFactor, ) = calculateUserGlobalData(_user);
        availableBorrowsETH = calculateAvailableBorrowsETHInternal(  totalCollateralETH, totalBorrowsETH, totalFeesETH, ltv );
    }

// ######################################################################################################################################
// ############ INTERNAL FUNCTIONS  #####################################################################################################
// ############ 1. calculateAvailableBorrowsETHInternal() --> calculates the equivalent amount in ETH that a user can borrow     ########
// ############ 1. calculateHealthFactorFromBalancesInternal() --> calculates the health factor from the corresponding balances  ########
// ######################################################################################################################################


    /**
    * @dev calculates the equivalent amount in ETH that a user can borrow, depending on the available collateral and the average Loan To Value.
    * @param collateralBalanceETH the total collateral balance
    * @param borrowBalanceETH the total borrow balance
    * @param totalFeesETH the total fees
    * @param ltv the average loan to value
    * @return the amount available to borrow in ETH for the user
    **/
    function calculateAvailableBorrowsETHInternal( uint256 collateralBalanceETH,uint256 borrowBalanceETH, uint256 totalFeesETH, uint256 ltv ) internal view returns (uint256) {
        uint256 availableBorrowsETH = collateralBalanceETH.mul(ltv).div(100); //ltv is in percentage
        if (availableBorrowsETH < borrowBalanceETH) {
            return 0;
        }
        availableBorrowsETH = availableBorrowsETH.sub(borrowBalanceETH.add(totalFeesETH));       
        uint256 borrowFee = IFeeProvider(addressesProvider.getFeeProvider()).calculateLoanOriginationFee(msg.sender, availableBorrowsETH);       //calculate fee
        return availableBorrowsETH.sub(borrowFee);
    }


    /**
    * @dev calculates the health factor from the corresponding balances
    * @param collateralBalanceETH the total collateral balance in ETH
    * @param borrowBalanceETH the total borrow balance in ETH
    * @param totalFeesETH the total fees in ETH
    * @param liquidationThreshold the avg liquidation threshold
    **/
    function calculateHealthFactorFromBalancesInternal( uint256 collateralBalanceETH, uint256 borrowBalanceETH, uint256 totalFeesETH, uint256 liquidationThreshold ) internal pure returns (uint256) {
        if (borrowBalanceETH == 0) 
            return uint256(-1);

        return (collateralBalanceETH.mul(liquidationThreshold).div(100)).wadDiv( borrowBalanceETH.add(totalFeesETH) );
    }

}
