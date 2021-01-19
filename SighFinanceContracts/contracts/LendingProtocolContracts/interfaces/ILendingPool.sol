pragma solidity ^0.5.0;

interface ILendingPool {


// #####################
// ######  EVENTS ######
// #####################



  /**
   * @dev Emitted on deposit()
   * @param instrument The address of the underlying asset of the instrument
   * @param user The address initiating the deposit
   * @param onBehalfOf The beneficiary of the deposit, receiving the iTokens
   * @param amount The amount deposited
   * @param depositFee The platform fee paid
   * @param sighPay The SIGH PAY fee paid
   * @param _boosterId The ID of the Booster used to get discount
   **/
  event Deposit( address indexed instrument, address indexed user, address indexed onBehalfOf,  uint256 amount, uint256 depositFee, uint256 sighPay, uint16 _boosterId);


    /**
    * @dev emitted during a redeem action.
    * @param _instrument the address of the instrument
    * @param _user the address of the user
    * @param _amount the amount redeemed
    **/
    event Withdraw(address indexed _instrument, address indexed _user, uint256 _amount);

  /**
   * @dev Emitted on borrow() and flashLoan() when debt needs to be opened
   * @param instrument The address of the underlying asset being borrowed
   * @param user The address of the user initiating the borrow(), receiving the funds on borrow() or just
   * initiator of the transaction on flashLoan()
   * @param onBehalfOf The address that will be getting the debt
   * @param amount The amount borrowed out
   * @param borrowRateMode The rate mode: 1 for Stable, 2 for Variable
   * @param borrowRate The numeric rate at which the user has borrowed
   * @param _borrowFee The fee paid   
   * @param _boosterId The ID of the Booster used to get discount
   **/
  event Borrow( address indexed instrument, address user, address indexed onBehalfOf, uint256 amount, uint256 borrowRateMode, uint256 borrowRate, uint256 _borrowFee, uint16 _boosterId );

  /**
   * @dev Emitted on repay()
   * @param instrument The address of the underlying asset of the instrument
   * @param user The beneficiary of the repayment, getting his debt reduced
   * @param repayer The address of the user initiating the repay(), providing the funds
   * @param amount The amount repaid
   **/
  event Repay( address indexed instrument, address indexed user, address indexed repayer, uint256 platformFeePay, uint256 reserveFeePay, uint256 amount);

  /**
   * @dev Emitted on swapBorrowRateMode()
   * @param instrument The address of the underlying asset of the instrument
   * @param user The address of the user swapping his rate mode
   * @param rateMode The rate mode that the user wants to swap to
   **/
  event Swap(address indexed instrument, address indexed user, uint256 rateMode);

  /**
   * @dev Emitted on setUserUseReserveAsCollateral()
   * @param instrument The address of the underlying asset of the instrument
   * @param user The address of the user enabling the usage as collateral
   **/
  event ReserveUsedAsCollateralEnabled(address indexed instrument, address indexed user);

  /**
   * @dev Emitted on setUserUseReserveAsCollateral()
   * @param instrument The address of the underlying asset of the instrument
   * @param user The address of the user enabling the usage as collateral
   **/
  event InstrumentUsedAsCollateralDisabled(address indexed instrument, address indexed user);

  /**
   * @dev Emitted on rebalanceStableBorrowRate()
   * @param instrument The address of the underlying asset of the instrument
   * @param user The address of the user for which the rebalance has been executed
   **/
  event RebalanceStableBorrowRate(address indexed instrument, address indexed user);

  /**
   * @dev Emitted on flashLoan()
   * @param target The address of the flash loan receiver contract
   * @param initiator The address initiating the flash loan
   * @param asset The address of the asset being flash borrowed
   * @param amount The amount flash borrowed
   * @param premium The fee flash borrowed
   * @param _boosterId The referral code used
   **/
  event FlashLoan( address indexed target, address indexed initiator, address indexed asset, uint256 amount, uint256 premium, uint16 _boosterId );

  /**
   * @dev Emitted when a borrower is liquidated. This event is emitted by the LendingPool via
   * LendingPoolCollateral manager using a DELEGATECALL
   * This allows to have the events in the generated ABI for LendingPool.
   * @param collateralAsset The address of the underlying asset used as collateral, to receive as result of the liquidation
   * @param debtAsset The address of the underlying borrowed asset to be repaid with the liquidation
   * @param user The address of the borrower getting liquidated
   * @param debtToCover The debt amount of borrowed `asset` the liquidator wants to cover
   * @param liquidatedCollateralAmount The amount of collateral received by the liiquidator
   * @param liquidator The address of the liquidator
   * @param receiveAToken `true` if the liquidators wants to receive the collateral iTokens, `false` if he wants
   * to receive the underlying collateral asset directly
   **/
  event LiquidationCall(  address indexed collateralAsset,  address indexed debtAsset,  address indexed user,  uint256 debtToCover,  uint256 liquidatedCollateralAmount,  address liquidator,  bool receiveAToken );

  /**
   * @dev Emitted when the state of a instrument is updated. NOTE: This event is actually declared
   * in the InstrumentReserveLogic library and emitted in the updateInterestRates() function. Since the function is internal,
   * the event will actually be fired by the LendingPool contract. The event is therefore replicated here so it
   * gets added to the LendingPool ABI
   * @param instrument The address of the underlying asset of the instrument
   * @param liquidityRate The new liquidity rate
   * @param stableBorrowRate The new stable borrow rate
   * @param variableBorrowRate The new variable borrow rate
   * @param liquidityIndex The new liquidity index
   * @param variableBorrowIndex The new variable borrow index
   **/
  event ReserveDataUpdated( address indexed instrument, uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate, uint256 liquidityIndex, uint256 variableBorrowIndex);


  /**
   * @dev Emitted when the pause is triggered.
   */
  event Paused();

  /**
   * @dev Emitted when the pause is lifted.
   */
  event Unpaused();

// ###########################################################
// ######  EXTERNAL FUNCTIONS THAT USERS INTERACT WITH  ######
// ###########################################################
    function refreshConfig() external;  // Called by LendingPool Configurator - to refresh addresses

    function deposit(address _instrument, uint256 _amount, uint16 __boosterId) external payable ;

    function redeemUnderlying( address _instrument,address payable _user,uint256 _amount, uint256 _ITokenBalanceAfterRedeem) external; 

    function borrow(address _instrument,uint256 _amount,uint256 _interestRateMode,uint16 __boosterId) external;

    function repay(address _instrument, uint256 _amount, address payable _onBehalfOf) external payable;

    function swapBorrowRateMode(address _instrument) external ;

    function rebalanceStableBorrowRate(address _instrument, address _user) external;

    function setUserUseInstrumentAsCollateral(address _instrument, bool _useAsCollateral) external;

    function liquidationCall( address _collateral, address _instrument, address _user, uint256 _purchaseAmount, bool _receiveIToken ) external payable;

    function flashLoan(address _receiver, address _instrument, uint256 _amount, bytes calldata _params)  external;

    function transferSIGHPayToStakingContract(address _instrument)  external;

// ##############################
// ######  VIEW FUNCTIONS  ######
// ##############################

    function getInstrumentConfigurationData(address _instrument) external view returns (
            uint256 ltv,
            uint256 liquidationThreshold,
            uint256 liquidationBonus,
            address interestRateStrategyAddress,
            bool usageAsCollateralEnabled,
            bool borrowingEnabled,
            bool stableBorrowRateEnabled,
            bool isActive
        );

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

    function getInstruments() external view returns (address[] memory);



}
