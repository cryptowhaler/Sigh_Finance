pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "../../openzeppelin-upgradeability/VersionedInitializable.sol";
import "../libraries/CoreLibrary.sol";
import "../libraries/WadRayMath.sol";
import "../libraries/EthAddressLib.sol";

import "../../configuration/GlobalAddressesProvider.sol";
import "../interfaces/ILendingPoolParametersProvider.sol";
import "../interfaces/ITokenInterface.sol";
import "../interfaces/IFeeProvider.sol";
import "../interfaces/ILendingPoolCore.sol";
import "../interfaces/ILendingPoolDataProvider.sol";
import "../interfaces/ILendingPool.sol";

import "../flashloan/interfaces/IFlashLoanReceiver.sol";

import "./LendingPoolLiquidationManager.sol";


/**
* @title LendingPool contract (Created by Aave, modified by SIGH Finance)
* @notice Implements the actions of the LendingPool, and exposes accessory methods to fetch the users and financial instruments data
* @author Aave, SIGH Finance
 **/

contract LendingPool is ILendingPool, ReentrancyGuard, VersionedInitializable {

    using SafeMath for uint256;
    using WadRayMath for uint256;
    using Address for address;

    GlobalAddressesProvider public addressesProvider;
    ILendingPoolCore public core;
    ILendingPoolDataProvider public dataProvider;
    ILendingPoolParametersProvider public parametersProvider;
    IFeeProvider public feeProvider;

// #####################
// ######  EVENTS ######
// #####################

    /**
    * @dev emitted on deposit
    * @param _instrument the address of the instrument
    * @param _user the address of the user
    * @param _amount the amount to be deposited
    * @param _referral the referral number of the action
    * @param _timestamp the timestamp of the action
    **/
    event Deposit( address indexed _instrument, address indexed _user, uint256 _amount, uint16 indexed _referral, uint256 _timestamp);

    /**
    * @dev emitted during a redeem action.
    * @param _instrument the address of the instrument
    * @param _user the address of the user
    * @param _amount the amount to be deposited
    * @param _timestamp the timestamp of the action
    **/
    event RedeemUnderlying(address indexed _instrument, address indexed _user, uint256 _amount, uint256 _timestamp);

    /**
    * @dev emitted on borrow
    * @param _instrument the address of the instrument
    * @param _user the address of the user
    * @param _amount the amount to be deposited
    * @param _borrowRateMode the rate mode, can be either 1-stable or 2-variable
    * @param _borrowRate the rate at which the user has borrowed
    * @param _originationFee the origination fee to be paid by the user
    * @param _borrowBalanceIncrease the balance increase since the last borrow, 0 if it's the first time borrowing
    * @param _referral the referral number of the action
    * @param _timestamp the timestamp of the action
    **/
    event Borrow( address indexed _instrument, address indexed _user, uint256 _amount, uint256 _borrowRateMode, uint256 _borrowRate, uint256 _originationFee, uint256 _borrowBalanceIncrease, uint16 indexed _referral, uint256 _timestamp);

    /**
    * @dev emitted on repay
    * @param _instrument the address of the instrument
    * @param _user the address of the user for which the repay has been executed
    * @param _repayer the address of the user that has performed the repay action
    * @param _amountMinusFees the amount repaid minus fees
    * @param _fees the fees repaid
    * @param _borrowBalanceIncrease the balance increase since the last action
    * @param _timestamp the timestamp of the action
    **/
    event Repay( address indexed _instrument, address indexed _user, address indexed _repayer, uint256 _amountMinusFees, uint256 _fees, uint256 _borrowBalanceIncrease, uint256 _timestamp);

    /**
    * @dev emitted when a user performs a rate swap
    * @param _instrument the address of the instrument
    * @param _user the address of the user executing the swap
    * @param _newRateMode the new interest rate mode
    * @param _newRate the new borrow rate
    * @param _borrowBalanceIncrease the balance increase since the last action
    * @param _timestamp the timestamp of the action
    **/
    event Swap( address indexed _instrument, address indexed _user, uint256 _newRateMode, uint256 _newRate, uint256 _borrowBalanceIncrease, uint256 _timestamp);

    /**
    * @dev emitted when a user enables a instrument as collateral
    * @param _instrument the address of the instrument
    * @param _user the address of the user
    **/
    event InstrumentUsedAsCollateralEnabled(address indexed _instrument, address indexed _user);

    /**
    * @dev emitted when a user disables a instrument as collateral
    * @param _instrument the address of the instrument
    * @param _user the address of the user
    **/
    event InstrumentUsedAsCollateralDisabled(address indexed _instrument, address indexed _user);

    /**
    * @dev emitted when the stable rate of a user gets rebalanced
    * @param _instrument the address of the instrument
    * @param _user the address of the user for which the rebalance has been executed
    * @param _newStableRate the new stable borrow rate after the rebalance
    * @param _borrowBalanceIncrease the balance increase since the last action
    * @param _timestamp the timestamp of the action
    **/
    event RebalanceStableBorrowRate( address indexed _instrument, address indexed _user, uint256 _newStableRate, uint256 _borrowBalanceIncrease, uint256 _timestamp);

    /**
    * @dev emitted when a flashloan is executed
    * @param _target the address of the flashLoanReceiver
    * @param _instrument the address of the instrument
    * @param _amount the amount requested
    * @param _totalFee the total fee on the amount
    * @param _protocolFee the part of the fee for the protocol
    * @param _timestamp the timestamp of the action
    **/
    event FlashLoan( address indexed _target, address indexed _instrument, uint256 _amount, uint256 _totalFee, uint256 _protocolFee, uint256 _timestamp );

    /**
    * @dev these events are not emitted directly by the LendingPool
    * but they are declared here as the LendingPoolLiquidationManager
    * is executed using a delegateCall().
    * This allows to have the events in the generated ABI for LendingPool.
    **/

    /**
    * @dev emitted when a borrow fee is liquidated
    * @param _collateral the address of the collateral being liquidated
    * @param _instrument the address of the instrument
    * @param _user the address of the user being liquidated
    * @param _feeLiquidated the total fee liquidated
    * @param _liquidatedCollateralForFee the amount of collateral received by the protocol in exchange for the fee
    * @param _timestamp the timestamp of the action
    **/
    event OriginationFeeLiquidated( address indexed _collateral, address indexed _instrument, address indexed _user, uint256 _feeLiquidated, uint256 _liquidatedCollateralForFee, uint256 _timestamp);

    /**
    * @dev emitted when a borrower is liquidated
    * @param _collateral the address of the collateral being liquidated
    * @param _instrument the address of the instrument
    * @param _user the address of the user being liquidated
    * @param _purchaseAmount the total amount liquidated
    * @param _liquidatedCollateralAmount the amount of collateral being liquidated
    * @param _accruedBorrowInterest the amount of interest accrued by the borrower since the last action
    * @param _liquidator the address of the liquidator
    * @param _receiveIToken true if the liquidator wants to receive ITokens, false otherwise
    * @param _timestamp the timestamp of the action
    **/
    event LiquidationCall( address indexed _collateral, address indexed _instrument, address indexed _user, uint256 _purchaseAmount, uint256 _liquidatedCollateralAmount, uint256 _accruedBorrowInterest, address _liquidator, bool _receiveIToken, uint256 _timestamp);

// ########################
// ######  MODIFIERS ######
// ########################

    /**
    * @dev functions affected by this modifier can only be invoked by the IToken.sol contract
    * @param _instrument the address of the instrument
    **/
    modifier onlyOverlyingIToken(address _instrument) {
        require( msg.sender == core.getInstrumentITokenAddress(_instrument), "The caller of this function can only be the IToken contract of this instrument" );
        _;
    }

    /**
    * @dev functions affected by this modifier can only be invoked if the instrument is active
    * @param _instrument the address of the instrument
    **/
    modifier onlyActiveInstrument(address _instrument) {
        requireInstrumentActiveInternal(_instrument);
        _;
    }

    /**
    * @dev functions affected by this modifier can only be invoked if the instrument is not freezed.
    * A freezed instrument only allows redeems, repays, rebalances and liquidations.
    * @param _instrument the address of the instrument
    **/
    modifier onlyUnfreezedInstrument(address _instrument) {
        requireInstrumentNotFreezedInternal(_instrument);
        _;
    }

    /**
    * @dev functions affected by this modifier can only be invoked if the provided _amount input parameter is not zero.
    * @param _amount the amount provided
    **/
    modifier onlyAmountGreaterThanZero(uint256 _amount) {
        requireAmountGreaterThanZeroInternal(_amount);
        _;
    }

    uint256 public constant UINT_MAX_VALUE = uint256(-1);

// ############################################################################################################
// ######  initialize() function called by proxy contract when LendingPool is added to AddressesProvider ######
// ############################################################################################################

    uint256 public constant LENDINGPOOL_REVISION = 0x1;             // NEEDED AS PART OF UPGRADABLE CONTRACTS FUNCTIONALITY ( VersionedInitializable )

    function getRevision() internal pure returns (uint256) {        // NEEDED AS PART OF UPGRADABLE CONTRACTS FUNCTIONALITY ( VersionedInitializable )
        return LENDINGPOOL_REVISION;
    }

    /**
    * @dev this function is invoked by the proxy contract when the LendingPool contract is added to the AddressesProvider.
    * @param _addressesProvider the address of the GlobalAddressesProvider registry
    **/
    function initialize(GlobalAddressesProvider _addressesProvider) public initializer {
        addressesProvider = _addressesProvider;
        core = ILendingPoolCore(addressesProvider.getLendingPoolCore());
        dataProvider = ILendingPoolDataProvider(addressesProvider.getLendingPoolDataProvider());
        parametersProvider = ILendingPoolParametersProvider(addressesProvider.getLendingPoolParametersProvider());
        feeProvider = IFeeProvider(addressesProvider.getFeeProvider());
    }

// ###########################################
// ######  DEPOSIT and REDEEM FUNCTIONS ######
// ###########################################

    /**
    * @dev deposits The underlying asset into the instrument. A corresponding amount of the overlying asset (ITokens) is minted.
    * @param _instrument the address of the underlying instrument (to be deposited)
    * @param _amount the amount to be deposited
    * @param _referralCode integrators are assigned a referral code and can potentially receive rewards.
    **/
    function deposit(address _instrument, uint256 _amount, uint16 _referralCode) external payable nonReentrant
        onlyActiveInstrument(_instrument)
        onlyUnfreezedInstrument(_instrument)
        onlyAmountGreaterThanZero(_amount)
    {
        ITokenInterface iToken = ITokenInterface(core.getInstrumentITokenAddress(_instrument));
        bool isFirstDeposit = iToken.balanceOf(msg.sender) == 0;

        core.updateStateOnDeposit(_instrument, msg.sender, _amount, isFirstDeposit);
        iToken.mintOnDeposit(msg.sender, _amount);                                          //minting IToken to user 1:1 with the specific exchange rate
        core.transferToReserve.value(msg.value)(_instrument, msg.sender, _amount);          //transfer to the core contract

        emit Deposit(_instrument, msg.sender, _amount, _referralCode, block.timestamp);

    }

    /**
    * @dev Redeems the underlying amount of assets requested by _user.
    * This function is executed by the overlying IToken contract in response to a redeem action.
    * @param _instrument the address of the instrument (underlying instrument address)
    * @param _user the address of the user performing the action
    * @param _amount the underlying amount to be redeemed
    **/
    function redeemUnderlying( address _instrument,address payable _user,uint256 _amount, uint256 _ITokenBalanceAfterRedeem) external nonReentrant
        onlyOverlyingIToken(_instrument)
        onlyActiveInstrument(_instrument)
        onlyAmountGreaterThanZero(_amount)
    {
        uint256 currentAvailableLiquidity = core.getInstrumentAvailableLiquidity(_instrument);
        require( currentAvailableLiquidity >= _amount, "There is not enough liquidity available to redeem" );

        core.updateStateOnRedeem(_instrument, _user, _amount, _ITokenBalanceAfterRedeem == 0);
        core.transferToUser(_instrument, _user, _amount);

        emit RedeemUnderlying(_instrument, _user, _amount, block.timestamp);
    }

// #########################################
// ######  BORROW and REPAY FUNCTIONS ######
// #########################################

    /**
    * @dev data structures for local computations in the borrow() method.
    */

    struct BorrowLocalVars {
        uint256 principalBorrowBalance;
        uint256 currentLtv;
        uint256 currentLiquidationThreshold;
        uint256 borrowFee;
        uint256 requestedBorrowAmountETH;
        uint256 amountOfCollateralNeededETH;
        uint256 userCollateralBalanceETH;
        uint256 userBorrowBalanceETH;
        uint256 userTotalFeesETH;
        uint256 borrowBalanceIncrease;
        uint256 currentInstrumentStableRate;
        uint256 availableLiquidity;
        uint256 instrumentDecimals;
        uint256 finalUserBorrowRate;
        CoreLibrary.InterestRateMode rateMode;
        bool healthFactorBelowThreshold;
    }

    /**
    * @dev Allows users to borrow a specific amount of the instrument currency, provided that the borrower already deposited enough collateral.
    * @param _instrument the address of the instrument
    * @param _amount the amount to be borrowed
    * @param _interestRateMode the interest rate mode at which the user wants to borrow. Can be 0 (STABLE) or 1 (VARIABLE)
    **/
    function borrow(address _instrument,uint256 _amount,uint256 _interestRateMode,uint16 _referralCode) external nonReentrant onlyActiveInstrument(_instrument)
        onlyUnfreezedInstrument(_instrument)
        onlyAmountGreaterThanZero(_amount)
    {
        
        BorrowLocalVars memory vars;            // Usage of a memory struct of vars to avoid "Stack too deep" errors due to local variables
        require(core.isInstrumentBorrowingEnabled(_instrument), "Instrument is not enabled for borrowing");     //check that the instrument is enabled for borrowing

        //validate interest rate mode
        require( uint256(CoreLibrary.InterestRateMode.VARIABLE) == _interestRateMode || uint256(CoreLibrary.InterestRateMode.STABLE) == _interestRateMode, "Invalid interest rate mode selected");
        vars.rateMode = CoreLibrary.InterestRateMode(_interestRateMode);                //cast the rateMode to coreLibrary.interestRateMode

        vars.availableLiquidity = core.getInstrumentAvailableLiquidity(_instrument);    //check that the amount is available in the core contract
        require( vars.availableLiquidity >= _amount,"There is not enough liquidity available in the Instrument's reserve");

        ( , vars.userCollateralBalanceETH,  vars.userBorrowBalanceETH,  vars.userTotalFeesETH,  vars.currentLtv, vars.currentLiquidationThreshold,  , vars.healthFactorBelowThreshold  ) = dataProvider.calculateUserGlobalData(msg.sender);

        require(vars.userCollateralBalanceETH > 0, "The collateral balance is 0");
        require( !vars.healthFactorBelowThreshold, "The borrower can already be liquidated so he cannot borrow more");

        vars.borrowFee = feeProvider.calculateLoanOriginationFee(msg.sender, _amount);          //calculating fees
        require(vars.borrowFee > 0, "The amount to borrow is too small");

        vars.amountOfCollateralNeededETH = dataProvider.calculateCollateralNeededInETH( _instrument,  _amount, vars.borrowFee, vars.userBorrowBalanceETH, vars.userTotalFeesETH, vars.currentLtv);
        require(vars.amountOfCollateralNeededETH <= vars.userCollateralBalanceETH, "There is not enough collateral to cover a new borrow");

        /**
        * Following conditions need to be met if the user is borrowing at a stable rate:
        * 1. Financial Instrument must be enabled for stable rate borrowing
        * 2. Users cannot borrow from the instrument's reserve if their collateral is (mostly) the same instrument they are borrowing, to prevent abuses.
        * 3. Users will be able to borrow only a relatively small, configurable amount of the total liquidity
        **/

        if (vars.rateMode == CoreLibrary.InterestRateMode.STABLE) {         //check if the borrow mode is stable and if stable rate borrowing is enabled on this instrument
            require( core.isUserAllowedToBorrowAtStable(_instrument, msg.sender, _amount), "User cannot borrow the selected amount with a stable rate" );

            //calculate the max available loan size in stable rate mode as a percentage of the available liquidity
            uint256 maxLoanPercent = parametersProvider.getMaxStableRateBorrowSizePercent();        
            uint256 maxLoanSizeStable = vars.availableLiquidity.mul(maxLoanPercent).div(100);
            require(  _amount <= maxLoanSizeStable, "User is trying to borrow too much liquidity at a stable rate");
        }

        //all conditions passed - borrow is accepted
        (vars.finalUserBorrowRate, vars.borrowBalanceIncrease) = core.updateStateOnBorrow( _instrument, msg.sender, _amount, vars.borrowFee, vars.rateMode);
        core.transferToUser(_instrument, msg.sender, _amount);      //if we reached this point, we can transfer

        emit Borrow( _instrument, msg.sender, _amount, _interestRateMode, vars.finalUserBorrowRate, vars.borrowFee, vars.borrowBalanceIncrease, _referralCode, block.timestamp);
    }

    /**
    * @notice repays a borrow on the specific instrument, for the specified amount (or for the whole amount, if uint256(-1) is specified).
    * @dev the target user is defined by _onBehalfOf. If there is no repayment on behalf of another account,
    * _onBehalfOf must be equal to msg.sender.
    * @param _instrument the address of the instrument on which the user borrowed
    * @param _amount the amount to repay, or uint256(-1) if the user wants to repay everything
    * @param _onBehalfOf the address for which msg.sender is repaying.
    **/

    struct RepayLocalVars {
        uint256 principalBorrowBalance;
        uint256 compoundedBorrowBalance;
        uint256 borrowBalanceIncrease;
        bool isETH;
        uint256 paybackAmount;
        uint256 paybackAmountMinusFees;
        uint256 currentStableRate;
        uint256 originationFee;
    }

    function repay(address _instrument, uint256 _amount, address payable _onBehalfOf) external payable nonReentrant onlyActiveInstrument(_instrument) onlyAmountGreaterThanZero(_amount) {
        
        RepayLocalVars memory vars;     // Usage of a memory struct of vars to avoid "Stack too deep" errors due to local variables
        ( vars.principalBorrowBalance, vars.compoundedBorrowBalance, vars.borrowBalanceIncrease ) = core.getUserBorrowBalances(_instrument, _onBehalfOf);

        vars.originationFee = core.getUserOriginationFee(_instrument, _onBehalfOf);
        vars.isETH = EthAddressLib.ethAddress() == _instrument;

        require(vars.compoundedBorrowBalance > 0, "The user does not have any borrow pending");
        require( _amount != UINT_MAX_VALUE || msg.sender == _onBehalfOf, "To repay on behalf of an user an explicit amount to repay is needed.");

        vars.paybackAmount = vars.compoundedBorrowBalance.add(vars.originationFee);     //default to max amount

        if (_amount != UINT_MAX_VALUE && _amount < vars.paybackAmount) {
            vars.paybackAmount = _amount;
        }

        require( !vars.isETH || msg.value >= vars.paybackAmount, "Invalid msg.value sent for the repayment");

        //if the amount is smaller than the origination fee, just transfer the amount to the fee destination address
        if (vars.paybackAmount <= vars.originationFee) {
            core.updateStateOnRepay( _instrument, _onBehalfOf, 0, vars.paybackAmount, vars.borrowBalanceIncrease, false);
            core.transferToFeeCollectionAddress.value( vars.isETH ? vars.paybackAmount : 0)( _instrument, _onBehalfOf, vars.paybackAmount,  addressesProvider.getSIGHStaking() );

            emit Repay(_instrument, _onBehalfOf, msg.sender, 0, vars.paybackAmount, vars.borrowBalanceIncrease, block.timestamp );
            return;
        }

        vars.paybackAmountMinusFees = vars.paybackAmount.sub(vars.originationFee);
        core.updateStateOnRepay( _instrument, _onBehalfOf, vars.paybackAmountMinusFees, vars.originationFee, vars.borrowBalanceIncrease, vars.compoundedBorrowBalance == vars.paybackAmountMinusFees);

        //if the user didn't repay the origination fee, transfer the fee to the fee collection address
        if(vars.originationFee > 0) {
            core.transferToFeeCollectionAddress.value(vars.isETH ? vars.originationFee : 0)( _instrument, _onBehalfOf, vars.originationFee, addressesProvider.getSIGHStaking() );
        }

        //sending the total msg.value if the transfer is ETH.
        //the transferToReserve() function will take care of sending the excess ETH back to the caller
        core.transferToReserve.value(vars.isETH ? msg.value.sub(vars.originationFee) : 0)( _instrument, msg.sender, vars.paybackAmountMinusFees );
        emit Repay( _instrument, _onBehalfOf, msg.sender, vars.paybackAmountMinusFees, vars.originationFee, vars.borrowBalanceIncrease, block.timestamp);
    }


// ####################################################################
// ######  1. SWAP BETWEEN STABLE AND VARIABLE BORROW RATE MODES ######
// ######  2. REBALANCES THE STABLE INTEREST RATE OF A USER      ######
// ####################################################################

    /**
    * @dev borrowers can user this function to swap between stable and variable borrow rate modes.
    * @param _instrument the address of the instrument on which the user borrowed
    **/
    function swapBorrowRateMode(address _instrument) external nonReentrant onlyActiveInstrument(_instrument) onlyUnfreezedInstrument(_instrument) {
        (uint256 principalBorrowBalance, uint256 compoundedBorrowBalance, uint256 borrowBalanceIncrease) = core.getUserBorrowBalances(_instrument, msg.sender);

        require( compoundedBorrowBalance > 0,"User does not have a borrow in progress on this instrument");
        CoreLibrary.InterestRateMode currentRateMode = core.getUserCurrentBorrowRateMode(_instrument, msg.sender);

        if (currentRateMode == CoreLibrary.InterestRateMode.VARIABLE) {
            /**
            * user wants to swap to stable, before swapping we need to ensure that
            * 1. stable borrow rate is enabled on the instrument
            * 2. user is not trying to abuse the instrument by depositing
            * more collateral than he is borrowing, artificially lowering
            * the interest rate, borrowing at variable, and switching to stable
            **/
            require(core.isUserAllowedToBorrowAtStable(_instrument, msg.sender, compoundedBorrowBalance), "User cannot borrow the selected amount at stable");
        }

        (CoreLibrary.InterestRateMode newRateMode, uint256 newBorrowRate) = core.updateStateOnSwapRate(_instrument, msg.sender, principalBorrowBalance, compoundedBorrowBalance, borrowBalanceIncrease, currentRateMode );
        emit Swap( _instrument, msg.sender, uint256(newRateMode), newBorrowRate, borrowBalanceIncrease, block.timestamp);
    }

    /**
    * @dev rebalances the stable interest rate of a user if current liquidity rate > user stable rate.
    * this is regulated by Aave to ensure that the protocol is not abused, and the user is paying a fair
    * rate. Anyone can call this function though.
    * @param _instrument the address of the instrument
    * @param _user the address of the user to be rebalanced
    **/
    function rebalanceStableBorrowRate(address _instrument, address _user) external nonReentrant onlyActiveInstrument(_instrument) {
        (, uint256 compoundedBalance, uint256 borrowBalanceIncrease) = core.getUserBorrowBalances(_instrument, _user);

        //step 1: user must be borrowing on _instrument at a stable rate
        require(compoundedBalance > 0, "User does not have any borrow for this instrument");
        require( core.getUserCurrentBorrowRateMode(_instrument, _user) == CoreLibrary.InterestRateMode.STABLE,"The user borrow is variable and cannot be rebalanced" );

        uint256 userCurrentStableRate = core.getUserCurrentStableBorrowRate(_instrument, _user);
        uint256 liquidityRate = core.getInstrumentCurrentLiquidityRate(_instrument);
        uint256 instrumentCurrentStableRate = core.getInstrumentCurrentStableBorrowRate(_instrument);
        uint256 rebalanceDownRateThreshold = instrumentCurrentStableRate.rayMul( WadRayMath.ray().add( parametersProvider.getRebalanceDownRateDelta() ) );

        //step 2: we have two possible situations to rebalance:

        //1. user stable borrow rate is below the current liquidity rate. The loan needs to be rebalanced,
        //as this situation can be abused (user putting back the borrowed liquidity in the same instrument to earn on it)
        //2. user stable rate is above the market avg borrow rate of a certain delta, and utilization rate is low.
        //In this case, the user is paying an interest that is too high, and needs to be rescaled down.
        if ( userCurrentStableRate < liquidityRate || userCurrentStableRate > rebalanceDownRateThreshold) {
            uint256 newStableRate = core.updateStateOnRebalance( _instrument, _user, borrowBalanceIncrease );

            emit RebalanceStableBorrowRate( _instrument, _user, newStableRate, borrowBalanceIncrease, block.timestamp );
            return;
        }

        revert("Interest rate rebalance conditions were not met");
    }

// #####################################################################################################
// ######  1. DEPOSITORS CAN ENABLE DISABLE SPECIFIC DEPOSIT AS COLLATERAL                  ############
// ######  2. FUNCTION WHICH CAN BE INVOKED TO LIQUIDATE AN UNDERCOLLATERALIZED POSITION    ############
// #####################################################################################################

    /**
    * @dev allows depositors to enable or disable a specific deposit as collateral.
    * @param _instrument the address of the instrument
    * @param _useAsCollateral true if the user wants to user the deposit as collateral, false otherwise.
    **/
    function setUserUseInstrumentAsCollateral(address _instrument, bool _useAsCollateral) external nonReentrant onlyActiveInstrument(_instrument)  onlyUnfreezedInstrument(_instrument) {
       
        uint256 underlyingBalance = core.getUserUnderlyingAssetBalance(_instrument, msg.sender);

        require(underlyingBalance > 0, "User does not have any liquidity deposited");
        require( dataProvider.balanceDecreaseAllowed(_instrument, msg.sender, underlyingBalance), "User deposit is already being used as collateral");

        core.setUserUseInstrumentAsCollateral(_instrument, msg.sender, _useAsCollateral);

        if (_useAsCollateral) {
            emit InstrumentUsedAsCollateralEnabled(_instrument, msg.sender);
        } 
        else {
            emit InstrumentUsedAsCollateralDisabled(_instrument, msg.sender);
        }
    }

    /**
    * @dev users can invoke this function to liquidate an undercollateralized position.
    * @param _collateral the address of the collateral to liquidated
    * @param _instrument the address of the principal instrument
    * @param _user the address of the borrower
    * @param _purchaseAmount the amount of principal that the liquidator wants to repay
    * @param _receiveIToken true if the liquidators wants to receive the ITokens, false if
    * he wants to receive the underlying asset directly
    **/
    function liquidationCall( address _collateral, address _instrument, address _user, uint256 _purchaseAmount, bool _receiveIToken ) external payable nonReentrant 
        onlyActiveInstrument(_instrument) 
        onlyActiveInstrument(_collateral) {

        address liquidationManager = addressesProvider.getLendingPoolLiquidationManager();
        (bool success, bytes memory result) = liquidationManager.delegatecall( abi.encodeWithSignature("liquidationCall(address,address,address,uint256,bool)",  _collateral, _instrument, _user, _purchaseAmount, _receiveIToken ) );
        require(success, "Liquidation call failed");

        (uint256 returnCode, string memory returnMessage) = abi.decode(result, (uint256, string));

        if (returnCode != 0) {      //error found
            revert(string(abi.encodePacked("Liquidation failed: ", returnMessage)));
        }
    }

// ################################################################################################################
// ######  1. FLASH LOAN (total fee = protocol fee + fee distributed among depositors)                 ############
// ################################################################################################################
    /**
    * @dev allows smartcontracts to access the liquidity of the pool within one transaction,
    * as long as the amount taken plus a fee is returned. NOTE There are security concerns for developers of flashloan receiver contracts
    * that must be kept into consideration. For further details please visit https://developers.aave.com
    * @param _receiver The address of the contract receiving the funds. The receiver should implement the IFlashLoanReceiver interface.
    * @param _instrument the address of the principal instrument
    * @param _amount the amount requested for this flashloan
    **/
    function flashLoan(address _receiver, address _instrument, uint256 _amount, bytes memory _params)  public nonReentrant
        onlyActiveInstrument(_instrument)
        onlyAmountGreaterThanZero(_amount)
    {
        //check that the instrument has enough available liquidity
        //we avoid using the getAvailableLiquidity() function in LendingPoolCore to save gas
        uint256 availableLiquidityBefore = _instrument == EthAddressLib.ethAddress() ? address(core).balance : IERC20(_instrument).balanceOf(address(core));

        require( availableLiquidityBefore >= _amount, "There is not enough liquidity available to borrow");

        (uint256 totalFeeBips, uint256 protocolFeeBips) = parametersProvider.getFlashLoanFeesInBips();
        uint256 amountFee = _amount.mul(totalFeeBips).div(10000);           //calculate amount fee
        uint256 protocolFee = amountFee.mul(protocolFeeBips).div(10000);    //protocol fee is the part of the amountFee reserved for the protocol - the rest goes to depositors
        require( amountFee > 0 && protocolFee > 0, "The requested amount is too small for a flashLoan." );

        //get the FlashLoanReceiver instance
        IFlashLoanReceiver receiver = IFlashLoanReceiver(_receiver);
        address payable userPayable = address(uint160(_receiver));

        //transfer funds to the receiver
        core.transferToUser(_instrument, userPayable, _amount);

        //execute action of the receiver
        receiver.executeOperation(_instrument, _amount, amountFee, _params);

        //check that the actual balance of the core contract includes the returned amount
        uint256 availableLiquidityAfter = _instrument == EthAddressLib.ethAddress() ? address(core).balance : IERC20(_instrument).balanceOf(address(core));
        require( availableLiquidityAfter == availableLiquidityBefore.add(amountFee), "The actual balance of the protocol is inconsistent");

        core.updateStateOnFlashLoan( _instrument, availableLiquidityBefore, amountFee.sub(protocolFee), protocolFee );
        emit FlashLoan(_receiver, _instrument, _amount, amountFee, protocolFee, block.timestamp);
    }

// ####################################################################
// ######  FUNCTIONS TO FETCH DATA FROM THE CORE CONTRACT  ############
// ####################################################################
    /**
    * @dev accessory functions to fetch data from the core contract
    **/

    function getInstrumentConfigurationData(address _instrument) external view returns (
            uint256 ltv,
            uint256 liquidationThreshold,
            uint256 liquidationBonus,
            address interestRateStrategyAddress,
            bool usageAsCollateralEnabled,
            bool borrowingEnabled,
            bool stableBorrowRateEnabled,
            bool isActive
        )
    {
        return dataProvider.getInstrumentConfigurationData(_instrument);
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
        return dataProvider.getInstrumentData(_instrument);
    }

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
        return dataProvider.getUserAccountData(_user);
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
        return dataProvider.getUserInstrumentData(_instrument, _user);
    }

    function getInstruments() external view returns (address[] memory) {
        return core.getInstruments();
    }

// ########################################
// ######  INTERNAL FUNCTIONS  ############
// ########################################
    /**
    * @dev internal function to save on code size for the onlyActiveInstrument modifier
    **/
    function requireInstrumentActiveInternal(address _instrument) internal view {
        require(core.getInstrumentIsActive(_instrument), "Action requires an active instrument");
    }

    /**
    * @notice internal function to save on code size for the onlyUnfreezedInstrument modifier
    **/
    function requireInstrumentNotFreezedInternal(address _instrument) internal view {
        require(!core.getInstrumentIsFreezed(_instrument), "Action requires an unfreezed instrument");
    }

    /**
    * @notice internal function to save on code size for the onlyAmountGreaterThanZero modifier
    **/
    function requireAmountGreaterThanZeroInternal(uint256 _amount) internal pure {
        require(_amount > 0, "Amount must be greater than 0");
    }
}
