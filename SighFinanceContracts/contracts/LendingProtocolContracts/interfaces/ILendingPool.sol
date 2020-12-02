pragma solidity ^0.5.0;

interface ILendingPool {

// ###########################################################
// ######  EXTERNAL FUNCTIONS THAT USERS INTERACT WITH  ######
// ###########################################################
    function refreshConfig() external;  // Called by LendingPool Configurator - to refresh addresses

    // function deposit(address _instrument, uint256 _amount, uint16 _referralCode) external payable ;

    function redeemUnderlying( address _instrument,address payable _user,uint256 _amount, uint256 _ITokenBalanceAfterRedeem) external; 

    // function borrow(address _instrument,uint256 _amount,uint256 _interestRateMode,uint16 _referralCode) external;

    // function repay(address _instrument, uint256 _amount, address payable _onBehalfOf) external payable;

    // function swapBorrowRateMode(address _instrument) external ;

    // function rebalanceStableBorrowRate(address _instrument, address _user) external;

    // function setUserUseInstrumentAsCollateral(address _instrument, bool _useAsCollateral) external;

    // function liquidationCall( address _collateral, address _instrument, address _user, uint256 _purchaseAmount, bool _receiveIToken ) external payable;

    // function flashLoan(address _receiver, address _instrument, uint256 _amount, bytes calldata _params)  external;

// ##############################
// ######  VIEW FUNCTIONS  ######
// ##############################

    // function getInstrumentConfigurationData(address _instrument) external view returns (
    //         uint256 ltv,
    //         uint256 liquidationThreshold,
    //         uint256 liquidationBonus,
    //         address interestRateStrategyAddress,
    //         bool usageAsCollateralEnabled,
    //         bool borrowingEnabled,
    //         bool stableBorrowRateEnabled,
    //         bool isActive
    //     );

    // function getInstrumentData(address _instrument) external view returns (
    //         uint256 totalLiquidity,
    //         uint256 availableLiquidity,
    //         uint256 totalBorrowsStable,
    //         uint256 totalBorrowsVariable,
    //         uint256 liquidityRate,
    //         uint256 variableBorrowRate,
    //         uint256 stableBorrowRate,
    //         uint256 averageStableBorrowRate,
    //         uint256 utilizationRate,
    //         uint256 liquidityIndex,
    //         uint256 variableBorrowIndex,
    //         address iTokenAddress,
    //         uint40 lastUpdateTimestamp
    //     );

    // function getUserAccountData(address _user) external view returns (
    //         uint256 totalLiquidityETH,
    //         uint256 totalCollateralETH,
    //         uint256 totalBorrowsETH,
    //         uint256 totalFeesETH,
    //         uint256 availableBorrowsETH,
    //         uint256 currentLiquidationThreshold,
    //         uint256 ltv,
    //         uint256 healthFactor
    //     );

    // function getUserInstrumentData(address _instrument, address _user) external view returns (
    //         uint256 currentITokenBalance,
    //         uint256 currentBorrowBalance,
    //         uint256 principalBorrowBalance,
    //         uint256 borrowRateMode,
    //         uint256 borrowRate,
    //         uint256 liquidityRate,
    //         uint256 originationFee,
    //         uint256 variableBorrowIndex,
    //         uint256 lastUpdateTimestamp,
    //         bool usageAsCollateralEnabled
    //     );

    // function getInstruments() external view returns (address[] memory);



}
