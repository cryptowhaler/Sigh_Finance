pragma solidity ^0.5.0;

/**
* @title LendingPoolDataProvider contract 
* @author Aave, SIGH Finance 
* @notice Implements functions to fetch data from the core, and aggregate them in order to allow computation on the compounded balances and the account balances in ETH
**/
interface ILendingPoolDataProvider {


// #############################################################################################################################
// ############ PUBLIC VIEW FUNCTION (also called within this contract) TO CALCULATE USER DATA ACROSS THE PROTOCOL  ############
// #############################################################################################################################



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
        );
 
// ############################################################################################################################################################
// ############ EXTERNAL VIEW FUNCTION (called within LendingPool's setUserUseInstrumentAsCollateral() FUNCTION)    ###########################################
// ############ balanceDecreaseAllowedLocalVars() --> check if a specific balance decrease doesn't bring the user borrow position health factor    ############
// ############################################################################################################################################################

    /**
    * @dev check if a specific balance decrease is allowed (i.e. doesn't bring the user borrow position health factor under 1e18)
    * @param _instrument the address of the instrument
    * @param _user the address of the user
    * @param _amount the amount to decrease
    * @return true if the decrease of the balance is allowed
    **/
    function balanceDecreaseAllowed(address _instrument, address _user, uint256 _amount)  external view returns (bool); 

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
    function calculateCollateralNeededInETH( address _instrument, uint256 _amount, uint256 _fee, uint256 _userCurrentBorrowBalanceTH, uint256 _userCurrentFeesETH, uint256 _userCurrentLtv ) external view returns (uint256) ;


// ##########################################################################################################################################
// ############ EXTERNAL VIEW FUNCTIONS WHICH SIMPLY GET DATA FROM CORE CONTRACT  ###########################################################
// ############ 1. getInstrumentConfigurationData() --> Returns the configuration paramters related to an instrument     #######################
// ############ 2. getInstrumentData() --> Returns the performance metrics  related to an instrument    ########################################
// ############ 3. getUserInstrumentData() --> Returns the details of the user balance in an instrument   ######################################
// ##########################################################################################################################################

    /**
    * @dev accessory functions to fetch data from the lendingPoolCore
    **/
    function getInstrumentConfigurationData(address _instrument) external view returns ( 
                                                                                        uint256 ltv,  
                                                                                        uint256 liquidationThreshold, 
                                                                                        uint256 liquidationBonus,  
                                                                                        address rateStrategyAddress, 
                                                                                        bool usageAsCollateralEnabled, 
                                                                                        bool borrowingEnabled, 
                                                                                        bool stableBorrowRateEnabled,  
                                                                                        bool isActive 
                                                                                        ) ;

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
                                                                            );

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
                                                                                );

// #####################################################################################
// ############ returns the health factor liquidation threshold  #######################
// #####################################################################################

    function getHealthFactorLiquidationThreshold() public pure returns (uint256) ;


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
        );

}
