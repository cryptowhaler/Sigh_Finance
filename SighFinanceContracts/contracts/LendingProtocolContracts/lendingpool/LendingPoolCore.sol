pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/utils/Address.sol";
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";

import "../libraries/WadRayMath.sol";
import "../libraries/EthAddressLib.sol";

import "../libraries/CoreLibrary.sol";
import "../../configuration/GlobalAddressesProvider.sol";
import "../interfaces/ILendingRateOracle.sol";
import "../interfaces/I_InstrumentInterestRateStrategy.sol";
import "../interfaces/ITokenInterface.sol";

import "../../SIGHFinanceContracts/Interfaces/ISighDistributionHandler.sol";

/**
* @title LendingPoolCore contract
* @author Aave, SIGH Finance
* @notice Holds the state of the lending pool and all the funds deposited
* @dev NOTE: The core does not enforce security checks on the update of the state
* (eg, getInstrumentTotalBorrows() does not enforce that borrowed is enabled on the Instrument).
* The check that an action can be performed is a duty of the overlying LendingPool contract.
**/

contract LendingPoolCore is VersionedInitializable {

    using SafeMath for uint256;
    using WadRayMath for uint256;
    using CoreLibrary for CoreLibrary.InstrumentData;
    using CoreLibrary for CoreLibrary.UserInstrumentData;
    using SafeERC20 for ERC20;
    using Address for address payable;

    GlobalAddressesProvider public addressesProvider;
    address public lendingPoolAddress;
    ISighDistributionHandler public sighMechanism;          // ADDED BY SIGH FINANCE

    address[] public instrumentsList;
    mapping(address => CoreLibrary.InstrumentData) internal reserves;
    mapping(address => mapping(address => CoreLibrary.UserInstrumentData)) internal usersInstrumentData;

    uint256 public constant CORE_REVISION = 0x1;          // NEEDED AS PART OF UPGRADABLE CONTRACTS FUNCTIONALITY ( VersionedInitializable )

    /**
    * @dev Emitted when the state of a instrument is updated
    * @param instrument the address of the instrument
    * @param liquidityRate the new liquidity rate
    * @param stableBorrowRate the new stable borrow rate
    * @param variableBorrowRate the new variable borrow rate
    * @param liquidityIndex the new liquidity index
    * @param variableBorrowIndex the new variable borrow index
    **/
    event InstrumentUpdated(  address indexed instrument,  uint256 liquidityRate,  uint256 stableBorrowRate,  uint256 variableBorrowRate, uint256 newSighPayRate, uint256 liquidityIndex, uint256 variableBorrowIndex, uint256 sighPayIndex );
    event SIGH_PAY_Amount_Transferred( address indexed stakingContract, address indexed instrument, uint256 totalLiquidity, uint256 _sighPayAccured, uint256 lastSIGHPayPaidIndex , uint256 lastSIGHPayCumulativeIndex );

// #######################
// ###### MODIFIERS ######
// #######################

    /**
    * @dev only lending pools can use functions affected by this modifier
    **/
    modifier onlyLendingPool {
        require(lendingPoolAddress == msg.sender, "The caller must be a lending pool contract");
        _;
    }

    /**
    * @dev only lending pools configurator can use functions affected by this modifier
    **/
    modifier onlyLendingPoolConfigurator {
        require( addressesProvider.getLendingPoolConfigurator() == msg.sender,  "The caller must be the lending pool configurator account" );
        _;
    }

// #####################################################
// ###### UPGRADABILITY (PROXY) RELATED FUNCTIONS ######
// #####################################################

    /**
    * @dev returns the revision number of the contract
    **/
    function getRevision() internal pure returns (uint256) {         // NEEDED AS PART OF UPGRADABLE CONTRACTS FUNCTIONALITY ( VersionedInitializable )
        return CORE_REVISION;
    }

    /**
    * @dev initializes the Core contract, invoked upon registration on the AddressesProvider
    * @param _addressesProvider the addressesProvider contract
    **/

    function initialize(GlobalAddressesProvider _addressesProvider) public initializer {
        addressesProvider = _addressesProvider;
        refreshConfigInternal();
    }

// ###########################################################
// ###### CALLED BY DEPOSIT() FROM LENDINGPOOL CONTRACT ######
// ###########################################################

    /**
    * @dev updates the state of the core as a result of a deposit action
    * @param _instrument the address of the instrument in which the deposit is happening
    * @param _user the address of the the user depositing
    * @param _amount the amount being deposited
    * @param _isFirstDeposit true if the user is depositing for the first time
    **/
    function updateStateOnDeposit( address _instrument, address _user, uint256 _amount, bool _isFirstDeposit) external onlyLendingPool {
        sighMechanism.updateSIGHSupplyIndex(_instrument);                                 // ADDED BY SIGH FINANCE (Instrument Index is updated)
        reserves[_instrument].updateCumulativeIndexes();
        updateInstrumentInterestRatesAndTimestampInternal(_instrument, _amount, 0);

        if (_isFirstDeposit) {           //if this is the first deposit of the user, we configure the deposit as enabled to be used as collateral
            setUserUseInstrumentAsCollateral(_instrument, _user, true);
        }
    }

    /**
    * @dev transfers an amount from a user to the destination instrument
    * @param _instrument the address of the instrument where the amount is being transferred
    * @param _user the address of the user from where the transfer is happening
    * @param _amount the amount being transferred
    **/
    function transferToReserve(address _instrument, address payable _user, uint256 _amount) external  payable onlyLendingPool {
        if (_instrument != EthAddressLib.ethAddress()) {
            require(msg.value == 0, "User is sending ETH along with the ERC20 transfer.");
            ERC20(_instrument).safeTransferFrom(_user, address(this), _amount);
        } 
        else {
            require(msg.value >= _amount, "The amount and the value sent to deposit do not match");
            if (msg.value > _amount) {      //send back excess ETH
                uint256 excessAmount = msg.value.sub(_amount);
                (bool result, ) = _user.call.value(excessAmount).gas(50000)("");
                require(result, "Transfer of ETH failed");
            }
        }
    }

// ####################################################################
// ###### CALLED BY REDEEMUNDERLYING() FROM LENDINGPOOL CONTRACT ######
// ####################################################################

    /**
    * @dev updates the state of the core as a result of a redeem action
    * @param _instrument the address of the instrument (underlying address) in which the redeem is happening
    * @param _user the address of the the user redeeming
    * @param _amountRedeemed the amount being redeemed
    * @param _userRedeemedEverything true if the user is redeeming everything
    **/
    function updateStateOnRedeem( address _instrument, address _user, uint256 _amountRedeemed,  bool _userRedeemedEverything) external onlyLendingPool {
        sighMechanism.updateSIGHSupplyIndex(_instrument);              // ADDED BY SIGH FINANCE (Instrument Index is updated)
        reserves[_instrument].updateCumulativeIndexes();               //compound liquidity and variable borrow interests
        updateInstrumentInterestRatesAndTimestampInternal(_instrument, 0, _amountRedeemed);

        if (_userRedeemedEverything) {          //if user redeemed everything the useInstrumentAsCollateral flag is reset
            setUserUseInstrumentAsCollateral(_instrument, _user, false);
        }
    }

    /**
    * @dev transfers to the user a specific amount from the reserve. (used during REDEEMUNDERLYING(), BORROW() & FLASHLOAN() in LendingPool Contract)
    * @param _instrument the address of the instrument (underlying address) where the transfer is happening
    * @param _user the address of the user receiving the transfer
    * @param _amount the amount being transferred
    **/
    function transferToUser(address _instrument, address payable _user, uint256 _amount) external  onlyLendingPool {    
        if (_instrument != EthAddressLib.ethAddress()) {
            ERC20(_instrument).safeTransfer(_user, _amount);
        } 
        else {
            (bool result, ) = _user.call.value(_amount).gas(50000)("");
            require(result, "Transfer of ETH failed");
        }
    }    

// #########################################################################################################################
// ###### CALLED BY BORROW() FROM LENDINGPOOL CONTRACT - alongwith the internal functions that only this function uses #####
// #########################################################################################################################

    /**
    * @dev updates the state of the core as a consequence of a borrow action.
    * @param _instrument the address of the instrument which the user is borrowing
    * @param _user the address of the borrower
    * @param _amountBorrowed the new amount borrowed
    * @param _borrowFee the fee on the amount borrowed
    * @param _rateMode the borrow rate mode (stable, variable)
    * @return the new borrow rate for the user
    **/
    function updateStateOnBorrow( address _instrument, address _user, uint256 _amountBorrowed, uint256 _borrowFee,  CoreLibrary.InterestRateMode _rateMode ) external onlyLendingPool returns (uint256, uint256) {
        sighMechanism.updateSIGHBorrowIndex(_instrument);              // ADDED BY SIGH FINANCE (Instrument Index is updated)        
        (uint256 principalBorrowBalance, , uint256 balanceIncrease) = getUserBorrowBalances( _instrument, _user );     // getting the previous borrow data of the user
    
        ITokenInterface iToken = ITokenInterface( reserves[_instrument].iTokenAddress );  // ITOKEN ADDRESS
        iToken.accure_SIGH_For_BorrowingStream(_user);                        // SIGH ACCURED FOR THE USER BEFORE BORROW BALANCE IS UPDATED ( ADDED BY SIGH FINANCE )

        updateInstrumentStateOnBorrowInternal( _instrument, _user, principalBorrowBalance, balanceIncrease, _amountBorrowed, _rateMode );
        updateUserStateOnBorrowInternal( _instrument, _user, _amountBorrowed, balanceIncrease, _borrowFee, _rateMode );
        updateInstrumentInterestRatesAndTimestampInternal(_instrument, 0, _amountBorrowed);

        return (getUserCurrentBorrowRate(_instrument, _user), balanceIncrease);
    }

    /**
    * @dev updates the state of a instrument as a consequence of a borrow action.
    * @param _instrument the address of the instrument on which the user is borrowing
    * @param _user the address of the borrower
    * @param _principalBorrowBalance the previous borrow balance of the borrower before the action
    * @param _balanceIncrease the accrued interest of the user on the previous borrowed amount
    * @param _amountBorrowed the new amount borrowed
    * @param _rateMode the borrow rate mode (stable, variable)
    **/
    function updateInstrumentStateOnBorrowInternal( address _instrument, address _user, uint256 _principalBorrowBalance, uint256 _balanceIncrease, uint256 _amountBorrowed, CoreLibrary.InterestRateMode _rateMode ) internal {
        reserves[_instrument].updateCumulativeIndexes();

        //increasing Instrument total borrows to account for the new borrow balance of the user. NOTE: Depending on the previous borrow mode, the borrows might need to be switched from variable to stable or vice versa
        updateInstrumentTotalBorrowsByRateModeInternal( _instrument, _user, _principalBorrowBalance,  _balanceIncrease, _amountBorrowed, _rateMode );
    }

    /**
    * @dev updates the state of a user as a consequence of a borrow action.
    * @param _instrument the address of the instrument on which the user is borrowing
    * @param _user the address of the borrower
    * @param _amountBorrowed the amount borrowed
    * @param _balanceIncrease the accrued interest of the user on the previous borrowed amount
    * @param _rateMode the borrow rate mode (stable, variable)
    * @return the final borrow rate for the user. Emitted by the borrow() event
    **/
    function updateUserStateOnBorrowInternal( address _instrument, address _user, uint256 _amountBorrowed, uint256 _balanceIncrease, uint256 _fee, CoreLibrary.InterestRateMode _rateMode  ) internal {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];

        if (_rateMode == CoreLibrary.InterestRateMode.STABLE) {      //stable. reset the user variable index, and update the stable rate
            user.stableBorrowRate = instrument.currentStableBorrowRate;
            user.lastVariableBorrowCumulativeIndex = 0;
        } 
        else if (_rateMode == CoreLibrary.InterestRateMode.VARIABLE) {  //variable. reset the user stable rate, and store the new borrow index            
            user.stableBorrowRate = 0;
            user.lastVariableBorrowCumulativeIndex = instrument.lastVariableBorrowCumulativeIndex;
        } 
        else {
            revert("Invalid borrow rate mode");
        }

        //increase the principal borrows and the Borrow fee
        user.principalBorrowBalance = user.principalBorrowBalance.add(_amountBorrowed).add( _balanceIncrease );
        ITokenInterface iToken = ITokenInterface( reserves[_instrument].iTokenAddress );  // ITOKEN ADDRESS
        iToken.updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddress(_user, _amountBorrowed.add( _balanceIncrease ), 0 );                        // SIGH ACCURED FOR THE USER BEFORE BORROW BALANCE IS UPDATED ( ADDED BY SIGH FINANCE )
        user.borrowFee = user.borrowFee.add(_fee);

        user.lastUpdateTimestamp = uint40(block.timestamp);
    }

    /**
    * @dev updates the state of the user as a consequence of a stable rate rebalance
    * @param _instrument the address of the principal instrument where the user borrowed
    * @param _user the address of the borrower
    * @param _balanceIncrease the accrued interest on the borrowed amount
    * @param _amountBorrowed the accrued interest on the borrowed amount
    **/
    function updateInstrumentTotalBorrowsByRateModeInternal( address _instrument,  address _user,  uint256 _principalBalance,  uint256 _balanceIncrease, uint256 _amountBorrowed, CoreLibrary.InterestRateMode _newBorrowRateMode ) internal {
        CoreLibrary.InterestRateMode previousRateMode = getUserCurrentBorrowRateMode( _instrument,  _user);
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];

        if (previousRateMode == CoreLibrary.InterestRateMode.STABLE) {
            CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];
            instrument.decreaseTotalBorrowsStableAndUpdateAverageRate( _principalBalance,  user.stableBorrowRate );
        } 
        else if (previousRateMode == CoreLibrary.InterestRateMode.VARIABLE) {
            instrument.decreaseTotalBorrowsVariable(_principalBalance);
        }

        uint256 newPrincipalAmount = _principalBalance.add(_balanceIncrease).add(_amountBorrowed);

        if (_newBorrowRateMode == CoreLibrary.InterestRateMode.STABLE) {
            instrument.increaseTotalBorrowsStableAndUpdateAverageRate( newPrincipalAmount, instrument.currentStableBorrowRate );
        } 
        else if (_newBorrowRateMode == CoreLibrary.InterestRateMode.VARIABLE) {
            instrument.increaseTotalBorrowsVariable(newPrincipalAmount);
        } 
        else {
            revert("Invalid new borrow rate mode");
        }
    }


// ########################################################################################################################
// ###### CALLED BY REPAY() FROM LENDINGPOOL CONTRACT - alongwith the internal functions that only this function uses #####
// ########################################################################################################################



    /**
    * @dev updates the state of the core as a consequence of a repay action.
    * @param _instrument the address of the instrument on which the user is repaying
    * @param _user the address of the borrower
    * @param _paybackAmountMinusFees the amount being paid back minus fees
    * @param _borrowFeeRepaid the fee on the amount that is being repaid
    * @param _balanceIncrease the accrued interest on the borrowed amount
    * @param _repaidWholeLoan true if the user is repaying the whole loan
    **/
    function updateStateOnRepay(  address _instrument,  address _user, uint256 _paybackAmountMinusFees,  uint256 _borrowFeeRepaid,  uint256 _balanceIncrease,  bool _repaidWholeLoan ) external onlyLendingPool {
        sighMechanism.updateSIGHBorrowIndex(_instrument);              // ADDED BY SIGH FINANCE (Instrument Index is updated)        

        ITokenInterface iToken = ITokenInterface( reserves[_instrument].iTokenAddress );  // ITOKEN ADDRESS
        iToken.accure_SIGH_For_BorrowingStream(_user);                        // SIGH ACCURED FOR THE USER BEFORE BORROW BALANCE IS UPDATED ( ADDED BY SIGH FINANCE )

        updateInstrumentStateOnRepayInternal(  _instrument, _user, _paybackAmountMinusFees,  _balanceIncrease );
        updateUserStateOnRepayInternal(  _instrument, _user, _paybackAmountMinusFees,  _borrowFeeRepaid, _balanceIncrease, _repaidWholeLoan  );
        updateInstrumentInterestRatesAndTimestampInternal(_instrument, _paybackAmountMinusFees, 0);
    }

    /**
    * @dev updates the state of the instrument as a consequence of a repay action.
    * @param _instrument the address of the instrument on which the user is repaying
    * @param _user the address of the borrower
    * @param _paybackAmountMinusFees the amount being paid back minus fees
    * @param _balanceIncrease the accrued interest on the borrowed amount
    **/
    function updateInstrumentStateOnRepayInternal(  address _instrument, address _user, uint256 _paybackAmountMinusFees, uint256 _balanceIncrease ) internal {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_instrument][_user];
        CoreLibrary.InterestRateMode borrowRateMode = getUserCurrentBorrowRateMode(_instrument, _user);

        reserves[_instrument].updateCumulativeIndexes();           //update the indexes

        //compound the cumulated interest to the borrow balance and then subtracting the payback amount
        if (borrowRateMode == CoreLibrary.InterestRateMode.STABLE) {
            instrument.increaseTotalBorrowsStableAndUpdateAverageRate( _balanceIncrease, user.stableBorrowRate );
            instrument.decreaseTotalBorrowsStableAndUpdateAverageRate(  _paybackAmountMinusFees, user.stableBorrowRate );
        } 
        else {
            instrument.increaseTotalBorrowsVariable(_balanceIncrease);
            instrument.decreaseTotalBorrowsVariable(_paybackAmountMinusFees);
        }
    }

    /**
    * @dev updates the state of the user as a consequence of a repay action.
    * @param _instrument the address of the instrument on which the user is repaying
    * @param _user the address of the borrower
    * @param _paybackAmountMinusFees the amount being paid back minus fees
    * @param _borrowFeeRepaid the fee on the amount that is being repaid
    * @param _balanceIncrease the accrued interest on the borrowed amount
    * @param _repaidWholeLoan true if the user is repaying the whole loan
    **/
    function updateUserStateOnRepayInternal( address _instrument, address _user, uint256 _paybackAmountMinusFees, uint256 _borrowFeeRepaid, uint256 _balanceIncrease, bool _repaidWholeLoan ) internal {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];

        //update the user principal borrow balance, adding the cumulated interest and then subtracting the payback amount
        ITokenInterface iToken = ITokenInterface( reserves[_instrument].iTokenAddress );  // ITOKEN ADDRESS
        iToken.updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddress(_user, _balanceIncrease, _paybackAmountMinusFees );      // SIGH ACCURED FOR THE USER BEFORE BORROW BALANCE IS UPDATED ( ADDED BY SIGH FINANCE )

        user.principalBorrowBalance = user.principalBorrowBalance.add(_balanceIncrease).sub( _paybackAmountMinusFees);
        user.lastVariableBorrowCumulativeIndex = instrument.lastVariableBorrowCumulativeIndex;

        //if the balance decrease is equal to the previous principal (user is repaying the whole loan) and the rate mode is stable, we reset the interest rate mode of the user
        if (_repaidWholeLoan) {
            user.stableBorrowRate = 0;
            user.lastVariableBorrowCumulativeIndex = 0;
        }
        user.borrowFee = user.borrowFee.sub(_borrowFeeRepaid);
        user.lastUpdateTimestamp = uint40(block.timestamp);
    }



// #####################################################################################################################################
// ###### CALLED BY SWAPBORROWRATEMODE() FROM LENDINGPOOL CONTRACT - alongwith the internal functions that only this function uses #####
// #####################################################################################################################################


    /**
    * @dev updates the state of the core as a consequence of a swap rate action.
    * @param _instrument the address of the _instrument on which the user is repaying
    * @param _user the address of the borrower
    * @param _principalBorrowBalance the amount borrowed by the user
    * @param _compoundedBorrowBalance the amount borrowed plus accrued interest
    * @param _balanceIncrease the accrued interest on the borrowed amount
    * @param _currentRateMode the current interest rate mode for the user
    **/
    function updateStateOnSwapRate(  address _instrument, address _user, uint256 _principalBorrowBalance, uint256 _compoundedBorrowBalance, uint256 _balanceIncrease, CoreLibrary.InterestRateMode _currentRateMode ) external onlyLendingPool returns (CoreLibrary.InterestRateMode, uint256) {
        sighMechanism.updateSIGHBorrowIndex(_instrument);              // ADDED BY SIGH FINANCE (Instrument Index is updated)        

        ITokenInterface iToken = ITokenInterface( reserves[_instrument].iTokenAddress );  // ITOKEN ADDRESS
        iToken.accure_SIGH_For_BorrowingStream(_user);                        // SIGH ACCURED FOR THE USER BEFORE BORROW BALANCE IS UPDATED ( ADDED BY SIGH FINANCE )

        updateInstrumentStateOnSwapRateInternal( _instrument, _user,_principalBorrowBalance,  _compoundedBorrowBalance, _currentRateMode );
        CoreLibrary.InterestRateMode newRateMode = updateUserStateOnSwapRateInternal( _instrument, _user, _balanceIncrease, _currentRateMode );
        updateInstrumentInterestRatesAndTimestampInternal(_instrument, 0, 0);
        return (newRateMode, getUserCurrentBorrowRate(_instrument, _user));
    }

    /**
    * @dev updates the state of the user as a consequence of a swap rate action.
    * @param _instrument the address of the instrument on which the user is performing the rate swap
    * @param _user the address of the borrower
    * @param _principalBorrowBalance the the principal amount borrowed by the user
    * @param _compoundedBorrowBalance the principal amount plus the accrued interest
    * @param _currentRateMode the rate mode at which the user borrowed
    **/
    function updateInstrumentStateOnSwapRateInternal( address _instrument, address _user, uint256 _principalBorrowBalance, uint256 _compoundedBorrowBalance, CoreLibrary.InterestRateMode _currentRateMode ) internal {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];

        instrument.updateCumulativeIndexes();      //compounding instrument indexes

        if (_currentRateMode == CoreLibrary.InterestRateMode.STABLE) {
            uint256 userCurrentStableRate = user.stableBorrowRate;              //swap to variable
            instrument.decreaseTotalBorrowsStableAndUpdateAverageRate( _principalBorrowBalance, userCurrentStableRate ); //decreasing stable from old principal balance
            instrument.increaseTotalBorrowsVariable(_compoundedBorrowBalance); //increase variable borrows
        } 
        else if (_currentRateMode == CoreLibrary.InterestRateMode.VARIABLE) {   //swap to stable
            uint256 currentStableRate = instrument.currentStableBorrowRate;
            instrument.decreaseTotalBorrowsVariable(_principalBorrowBalance);
            instrument.increaseTotalBorrowsStableAndUpdateAverageRate( _compoundedBorrowBalance,currentStableRate );
        } 
        else {
            revert("Invalid rate mode received");
        }
    }

    /**
    * @dev updates the state of the user as a consequence of a swap rate action.
    * @param _instrument the address of the instrument on which the user is performing the swap
    * @param _user the address of the borrower
    * @param _balanceIncrease the accrued interest on the borrowed amount
    * @param _currentRateMode the current rate mode of the user
    **/
    function updateUserStateOnSwapRateInternal(  address _instrument, address _user, uint256 _balanceIncrease, CoreLibrary.InterestRateMode _currentRateMode) internal returns (CoreLibrary.InterestRateMode) {
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        CoreLibrary.InterestRateMode newMode = CoreLibrary.InterestRateMode.NONE;

        if (_currentRateMode == CoreLibrary.InterestRateMode.VARIABLE) {                    //switch to stable            
            newMode = CoreLibrary.InterestRateMode.STABLE;
            user.stableBorrowRate = instrument.currentStableBorrowRate;
            user.lastVariableBorrowCumulativeIndex = 0;
        } 
        else if (_currentRateMode == CoreLibrary.InterestRateMode.STABLE) {
            newMode = CoreLibrary.InterestRateMode.VARIABLE;
            user.stableBorrowRate = 0;
            user.lastVariableBorrowCumulativeIndex = instrument.lastVariableBorrowCumulativeIndex;
        } 
        else {
            revert("Invalid interest rate mode received");
        }
        
        ITokenInterface iToken = ITokenInterface( reserves[_instrument].iTokenAddress );  // ITOKEN ADDRESS
        iToken.updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddress(_user, _balanceIncrease, 0 );                        // SIGH ACCURED FOR THE USER BEFORE BORROW BALANCE IS UPDATED ( ADDED BY SIGH FINANCE )

        user.principalBorrowBalance = user.principalBorrowBalance.add(_balanceIncrease);        //compounding cumulated interest
        user.lastUpdateTimestamp = uint40(block.timestamp);
        return newMode;
    }


// #########################################################################################################################################
// ###### CALLED BY UPDATESTATEONREBALANCE() FROM LENDINGPOOL CONTRACT - alongwith the internal functions that only this function uses #####
// #########################################################################################################################################

    /**
    * @dev updates the state of the core as a consequence of a stable rate rebalance
    * @param _instrument the address of the principal instrument where the user borrowed
    * @param _user the address of the borrower
    * @param _balanceIncrease the accrued interest on the borrowed amount
    * @return the new stable rate for the user
    **/
    function updateStateOnRebalance(address _instrument, address _user, uint256 _balanceIncrease) external onlyLendingPool returns (uint256) {
        sighMechanism.updateSIGHBorrowIndex(_instrument);              // ADDED BY SIGH FINANCE (Instrument Index is updated)        
        ITokenInterface iToken = ITokenInterface( reserves[_instrument].iTokenAddress );  // ITOKEN ADDRESS
        iToken.accure_SIGH_For_BorrowingStream(_user);                        // SIGH ACCURED FOR THE USER BEFORE BORROW BALANCE IS UPDATED ( ADDED BY SIGH FINANCE )

        updateInstrumentStateOnRebalanceInternal(_instrument, _user, _balanceIncrease);
        updateUserStateOnRebalanceInternal(_instrument, _user, _balanceIncrease);      //update user data and rebalance the rate
        updateInstrumentInterestRatesAndTimestampInternal(_instrument, 0, 0);
        return usersInstrumentData[_user][_instrument].stableBorrowRate;
    }

    /**
    * @dev updates the state of the instrument as a consequence of a stable rate rebalance
    * @param _instrument the address of the principal instrument where the user borrowed
    * @param _user the address of the borrower
    * @param _balanceIncrease the accrued interest on the borrowed amount
    **/
    function updateInstrumentStateOnRebalanceInternal( address _instrument, address _user, uint256 _balanceIncrease ) internal {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];

        instrument.updateCumulativeIndexes();
        instrument.increaseTotalBorrowsStableAndUpdateAverageRate( _balanceIncrease, user.stableBorrowRate );
    }

    /**
    * @dev updates the state of the user as a consequence of a stable rate rebalance
    * @param _instrument the address of the principal instrument where the user borrowed
    * @param _user the address of the borrower
    * @param _balanceIncrease the accrued interest on the borrowed amount
    **/
    function updateUserStateOnRebalanceInternal( address _instrument, address _user, uint256 _balanceIncrease ) internal {
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];

        ITokenInterface iToken = ITokenInterface( reserves[_instrument].iTokenAddress );  // ITOKEN ADDRESS
        iToken.updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddress(_user, _balanceIncrease, 0 );                        // SIGH ACCURED FOR THE USER BEFORE BORROW BALANCE IS UPDATED ( ADDED BY SIGH FINANCE )

        user.principalBorrowBalance = user.principalBorrowBalance.add(_balanceIncrease);
        user.stableBorrowRate = instrument.currentStableBorrowRate;
        user.lastUpdateTimestamp = uint40(block.timestamp);
    }



// #########################################################################################################################################
// ###### CALLED BY SETUSERUSEINSTRUMENTASCOLLATERAL() FROM LENDINGPOOL CONTRACT (also some internal calls from this contract )        #####
// #########################################################################################################################################

    /**
    * @dev enables or disables a instrument as collateral
    * @param _instrument the address of the principal instrument where the user deposited
    * @param _user the address of the depositor
    * @param _useAsCollateral true if the depositor wants to use the instrument as collateral
    **/
    function setUserUseInstrumentAsCollateral(address _instrument, address _user, bool _useAsCollateral) public onlyLendingPool {
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];
        user.useAsCollateral = _useAsCollateral;
    }

// ################################################################### 
// ###### CALLED BY FLASHLOAN() FROM LENDINGPOOL CONTRACT        #####
// ################################################################### 

    /**
    * @dev updates the state of the core as a result of a flashloan action
    * @param _instrument the address of the instrument in which the flashloan is happening
    * @param _income the income of the protocol as a result of the action
    * @param _protocolFee the protocol fee charged
    **/
    function updateStateOnFlashLoan( address _instrument, uint256 _availableLiquidityBefore, uint256 _income,  uint256 _protocolFee ) external onlyLendingPool {
        transferFlashLoanProtocolFeeInternal(_instrument, _protocolFee);

        reserves[_instrument].updateCumulativeIndexes();                                   //compounding the cumulated interest
        uint256 totalLiquidityBefore = _availableLiquidityBefore.add( getInstrumentTotalBorrows(_instrument) );
        reserves[_instrument].cumulateToLiquidityIndex(totalLiquidityBefore, _income);     //compounding the received fee into the reserve

        updateInstrumentInterestRatesAndTimestampInternal(_instrument, _income, 0);           //refresh interest rates
    }

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
    function updateStateOnLiquidation( address _principalInstrument, address _collateralInstrument, address _user, uint256 _amountToLiquidate, uint256 _collateralToLiquidate, uint256 _feeLiquidated, uint256 _liquidatedCollateralForFee, uint256 _balanceIncrease, bool _liquidatorReceivesIToken ) external onlyLendingPool {
        sighMechanism.updateSIGHBorrowIndex(_principalInstrument);               // ADDED BY SIGH FINANCE (Instrument Index is updated)        
        sighMechanism.updateSIGHSupplyIndex(_collateralInstrument);              // ADDED BY SIGH FINANCE (Instrument Index is updated)        

        ITokenInterface iToken = ITokenInterface( reserves[_principalInstrument].iTokenAddress );  // ITOKEN ADDRESS
        iToken.accure_SIGH_For_BorrowingStream(_user);                        // SIGH ACCURED FOR THE USER BEFORE BORROW BALANCE IS UPDATED ( ADDED BY SIGH FINANCE )

        updatePrincipalInstrumentStateOnLiquidationInternal( _principalInstrument, _user, _amountToLiquidate, _balanceIncrease );
        updatePrincipalInstrumentStateOnLiquidationInternal(  _collateralInstrument );
        updateUserStateOnLiquidationInternal(  _principalInstrument,  _user,  _amountToLiquidate,  _feeLiquidated,  _balanceIncrease );
        updateInstrumentInterestRatesAndTimestampInternal(_principalInstrument, _amountToLiquidate, 0);

        if (!_liquidatorReceivesIToken) {
            updateInstrumentInterestRatesAndTimestampInternal(  _collateralInstrument,  0, _collateralToLiquidate.add(_liquidatedCollateralForFee) );
        }

    }

    /**
    * @dev updates the state of the principal instrument as a consequence of a liquidation action.
    * @param _principalInstrument the address of the principal instrument that is being repaid
    * @param _user the address of the borrower
    * @param _amountToLiquidate the amount being repaid by the liquidator
    * @param _balanceIncrease the accrued interest on the borrowed amount
    **/
    function updatePrincipalInstrumentStateOnLiquidationInternal( address _principalInstrument, address _user, uint256 _amountToLiquidate, uint256 _balanceIncrease ) internal {
        CoreLibrary.InstrumentData storage instrument = reserves[_principalInstrument];
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_principalInstrument];

        instrument.updateCumulativeIndexes();      //update principal instrument data
        CoreLibrary.InterestRateMode borrowRateMode = getUserCurrentBorrowRateMode( _principalInstrument, _user);

        if (borrowRateMode == CoreLibrary.InterestRateMode.STABLE) {
            instrument.increaseTotalBorrowsStableAndUpdateAverageRate(   _balanceIncrease, user.stableBorrowRate );        //increase the total borrows by the compounded interest
            instrument.decreaseTotalBorrowsStableAndUpdateAverageRate(  _amountToLiquidate,  user.stableBorrowRate );      //decrease by the actual amount to liquidate
        } 
        else {
            instrument.increaseTotalBorrowsVariable(_balanceIncrease);     //increase the total borrows by the compounded interest
            instrument.decreaseTotalBorrowsVariable(_amountToLiquidate);       //decrease by the actual amount to liquidate
        }
    }


    /**
    * @dev updates the state of the collateral instrument as a consequence of a liquidation action.
    * @param _collateralInstrument the address of the collateral instrument that is being liquidated
    **/
    function updatePrincipalInstrumentStateOnLiquidationInternal( address _collateralInstrument ) internal {
        reserves[_collateralInstrument].updateCumulativeIndexes();     //update collateral instrument
    }


    /**
    * @dev updates the state of the user being liquidated as a consequence of a liquidation action.
    * @param _instrument the address of the principal instrument that is being repaid
    * @param _user the address of the borrower
    * @param _amountToLiquidate the amount being repaid by the liquidator
    * @param _feeLiquidated the amount of origination fee being liquidated
    * @param _balanceIncrease the accrued interest on the borrowed amount
    **/
    function updateUserStateOnLiquidationInternal( address _instrument, address _user, uint256 _amountToLiquidate, uint256 _feeLiquidated, uint256 _balanceIncrease ) internal {
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        
        ITokenInterface iToken = ITokenInterface( reserves[_instrument].iTokenAddress );  // ITOKEN ADDRESS
        iToken.updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddress(_user, _balanceIncrease, _amountToLiquidate );                        // SIGH ACCURED FOR THE USER BEFORE BORROW BALANCE IS UPDATED ( ADDED BY SIGH FINANCE )

        user.principalBorrowBalance = user.principalBorrowBalance.add(_balanceIncrease).sub( _amountToLiquidate );  //first increase by the compounded interest, then decrease by the liquidated amount

        if (  getUserCurrentBorrowRateMode(_instrument, _user) == CoreLibrary.InterestRateMode.VARIABLE ) {
            user.lastVariableBorrowCumulativeIndex = instrument.lastVariableBorrowCumulativeIndex;
        }
        if(_feeLiquidated > 0){
            user.borrowFee = user.borrowFee.sub(_feeLiquidated);
        }
        user.lastUpdateTimestamp = uint40(block.timestamp);
    }



// ################################################################################################### 
// ###### function enforces that the caller is a contract, to support flashloan transfers ############
// ################################################################### ###############################

    /**
    * @dev fallback function enforces that the caller is a contract, to support flashloan transfers
    **/
    function() external payable {       //only contracts can send ETH to the core        
        require(msg.sender.isContract(), "Only contracts can send ether to the Lending pool core");

    }


// #################################################################################################################################### 
// ###### CALLED BY LIQUIDATIONCALL() IN LENDINGPOOL CONTRACT (delegated to LendingPoolLiquidationManager.sol which calls) ############
// ################################################################### ################################################################

    /**
    * @dev transfers the fees to the fees collection address in the case of liquidation
    * @param _token the address of the token being transferred
    * @param _amount the amount being transferred
    * @param _destination the fee receiver address
    **/
    function liquidateFee( address _token, uint256 _amount, address _destination ) external payable onlyLendingPool {
        address payable feeAddress = address(uint160(_destination)); //cast the address to payable
        require( msg.value == 0, "Fee liquidation does not require any transfer of value" );

        if (_token != EthAddressLib.ethAddress()) {
            ERC20(_token).safeTransfer(feeAddress, _amount);
        } 
        else {
            (bool result, ) = feeAddress.call.value(_amount).gas(50000)("");
            require(result, "Transfer of ETH failed");
        }
    }

// ############################################################################################################## 
// ###### CALLED BY REPAY() IN LENDINGPOOL CONTRACT : transfers the fee to SIGH Staking Contract ############
// ################################################################### ########################################## 

    /**
    * @dev transfers the protocol fees to the fees collection address
    * @param _token the address of the token (instrument) being transferred
    * @param _user the address of the user from where the transfer is happening
    * @param _amount the amount being transferred
    * @param _destination the fee receiver address
    **/
    function transferToFeeCollectionAddress( address _token, address _user, uint256 _amount, address _destination ) external payable onlyLendingPool {
        address payable feeAddress = address(uint160(_destination)); //cast the address to payable

        if (_token != EthAddressLib.ethAddress()) {
            require( msg.value == 0, "User is sending ETH along with the ERC20 transfer. Check the value attribute of the transaction" );
            ERC20(_token).safeTransferFrom(_user, feeAddress, _amount);
        } 
        else {
            require(msg.value >= _amount, "The amount and the value sent to deposit do not match");
            (bool result, ) = feeAddress.call.value(_amount).gas(50000)("");
            require(result, "Transfer of ETH failed");
        }
    }


// #################################################################
// ################     PUBLIC VIEW FUNCTIONS       ################
// #################################################################

    /**
    * @dev gets the underlying asset balance (including the interest accured) of a user based on the corresponding iToken balance.
    * @param _instrument the instrument address
    * @param _user the user address
    * @return the underlying deposit balance of the user
    **/
    function getUserUnderlyingAssetBalance(address _instrument, address _user) public view returns (uint256) {
        ITokenInterface iToken = ITokenInterface(reserves[_instrument].iTokenAddress);
        return iToken.balanceOf(_user);
    }

    /**
    * @dev gets the interest rate strategy contract address for the instrument
    * @param _instrument the instrument address
    * @return the address of the interest rate strategy contract
    **/
    function getInstrumentInterestRateStrategyAddress(address _instrument) public view returns (address interestRateStrategy) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.interestRateStrategyAddress;
    }

    /**
    * @dev gets the iToken contract address for the instrument
    * @param _instrument the instrument address
    * @return the address of the iToken contract
    **/
    function getInstrumentITokenAddress(address _instrument) public view returns (address) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.iTokenAddress;
    }

    /**
    * @dev gets the available liquidity in the instrument. The available liquidity is the balance of the core contract
    * @param _instrument the Instrument address (underlying instrument address)
    * @return the available liquidity
    **/
    function getInstrumentAvailableLiquidity(address _instrument) public view returns (uint256) {
        uint256 balance = 0;

        if (_instrument == EthAddressLib.ethAddress()) {
            balance = address(this).balance;
        } 
        else {
            balance = IERC20(_instrument).balanceOf(address(this));
        }
        return balance;
    }

    /**
    * @dev gets the total liquidity in the instrument. The total liquidity is the balance of the core contract + total borrows
    * @param _instrument the instrument address
    * @return the total liquidity
    **/
    function getInstrumentTotalLiquidity(address _instrument) public view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return getInstrumentAvailableLiquidity(_instrument).add(instrument.getTotalBorrows());
    }

    /**
    * @dev gets the instrument total borrows
    * @param _instrument the _instrument address
    * @return the total borrows (stable + variable)
    **/
    function getInstrumentTotalBorrows(address _instrument) public view returns (uint256) {
        return reserves[_instrument].getTotalBorrows();
    }

    /**
    * @dev gets the instrument current stable borrow rate. Is the market rate if the instrument is empty
    * @param _instrument the instrument address
    * @return the instrument current stable borrow rate
    **/
    function getInstrumentCurrentStableBorrowRate(address _instrument) public view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        ILendingRateOracle oracle = ILendingRateOracle(addressesProvider.getLendingRateOracle());

        if (instrument.currentStableBorrowRate == 0) {     //no stable rate borrows yet
            return oracle.getMarketBorrowRate(_instrument);
        }

        return instrument.currentStableBorrowRate;
    }

    /**
    * @dev returns the utilization rate U of a specific instrument
    * @param _instrument the instrument for which the information is needed
    * @return the utilization rate in ray
    **/
    function getInstrumentUtilizationRate(address _instrument) public view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        uint256 totalBorrows = instrument.getTotalBorrows();

        if (totalBorrows == 0) {
            return 0;
        }

        uint256 availableLiquidity = getInstrumentAvailableLiquidity(_instrument);
        return totalBorrows.rayDiv(availableLiquidity.add(totalBorrows));
    }

    /**
    * @dev users with no loans in progress have NONE as borrow rate mode
    * @param _instrument the address of the _instrument for which the information is needed
    * @param _user the address of the user for which the information is needed
    * @return the borrow rate mode for the user,
    **/
    function getUserCurrentBorrowRateMode(address _instrument, address _user) public view returns (CoreLibrary.InterestRateMode) {
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];

        if (user.principalBorrowBalance == 0) {
            return CoreLibrary.InterestRateMode.NONE;
        }

        return user.stableBorrowRate > 0  ? CoreLibrary.InterestRateMode.STABLE : CoreLibrary.InterestRateMode.VARIABLE;
    }

    /**
    * @dev calculates and returns the borrow balances of the user
    * @param _instrument the address of the instrument
    * @param _user the address of the user
    * @return the principal borrow balance, the compounded balance and the balance increase since the last borrow/repay/swap/rebalance
    **/
    function getUserBorrowBalances(address _instrument, address _user) public view returns (uint256, uint256, uint256) {
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];
        if (user.principalBorrowBalance == 0) {
            return (0, 0, 0);
        }
        uint256 principal = user.principalBorrowBalance;
        uint256 compoundedBalance = CoreLibrary.getCompoundedBorrowBalance( user,  reserves[_instrument] );
        return (principal, compoundedBalance, compoundedBalance.sub(principal));
    }

// ###################################################################
// ################     EXTERNAL VIEW FUNCTIONS       ################
// ###################################################################

    /**
    * @dev returns the basic data (balances, fee accrued, instrument enabled/disabled as collateral)
    * needed to calculate the global account data in the LendingPoolDataProvider
    * @param _instrument the address of the instrument
    * @param _user the address of the user
    * @return User's Deposited Balance                         // returns IToken Balance
    * @return User's Principal Borrow Balance                 // calculated by compound interest (stable / variable interests have different caculations)
    * @return User's Origination Fee                         // stored value is returmed
    * @return Instrument is enabled as collateral or not    // returns a stored boolean
    the principal borrow balance, the fee, and if the instrument is enabled as collateral or not
    **/
    function getUserBasicInstrumentData(address _instrument, address _user) external view returns (uint256, uint256, uint256, bool) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];

        uint256 underlyingBalance = getUserUnderlyingAssetBalance(_instrument, _user);

        if (user.principalBorrowBalance == 0) {
            return (underlyingBalance, 0, 0, user.useAsCollateral);
        }

        return ( underlyingBalance, user.getCompoundedBorrowBalance(instrument), user.borrowFee, user.useAsCollateral );
    }

    /**
    * @dev checks if a user is allowed to borrow at a stable rate
    * @param _instrument the instrument address (underlying)
    * @param _user the user
    * @param _amount the amount the the user wants to borrow
    * @return true if the user is allowed to borrow at a stable rate, false otherwise
    **/
    function isUserAllowedToBorrowAtStable(address _instrument, address _user, uint256 _amount) external view returns (bool) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];

        if (!instrument.isStableBorrowRateEnabled) 
            return false;

        return !user.useAsCollateral || !instrument.usageAsCollateralEnabled || _amount > getUserUnderlyingAssetBalance(_instrument, _user) ;
    }

    /**
    * @dev gets the normalized income of the instrument. a value of 1e27 means there is no income. A value of 2e27 means there
    * there has been 100% income.
    * @param _instrument the instrument address (the underlying address)
    * @return the instrument normalized income
    **/
    function getInstrumentNormalizedIncome(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.getNormalizedIncome();
    }

    /**
    * @dev gets the instrument total borrows stable
    * @param _instrument the instrument address
    * @return the total borrows stable
    **/
    function getInstrumentTotalBorrowsStable(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.totalBorrowsStable;
    }

    // TO BE TESTED : SHOULD RETURN COMPOUNDED STABLE BORROW BALANCE
    function getInstrumentCompoundedBorrowsStable(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.getCompoundedStableBorrowBalance();
    }


    /**
    * @dev gets the instrument total borrows variable
    * @param _instrument the instrument address
    * @return the total borrows variable
    **/
    function getInstrumentTotalBorrowsVariable(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.totalBorrowsVariable;
    }

    // TO BE TESTED : SHOULD RETURN COMPOUNDED VARIABLE BORROW BALANCE
    function getInstrumentCompoundedBorrowsVariable(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.getCompoundedVariableBorrowBalance();
    }

    /**
    * @dev gets the instrument liquidation threshold
    * @param _instrument the instrument address
    * @return the instrument liquidation threshold
    **/
    function getInstrumentLiquidationThreshold(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.liquidationThreshold;
    }

    /**
    * @dev gets the instrument liquidation bonus
    * @param _instrument the instrument address
    * @return the instrument liquidation bonus
    **/
    function getInstrumentLiquidationBonus(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.liquidationBonus;
    }

    /**
    * @dev gets the instrument's current variable borrow rate. Is the base variable borrow rate if the reserve is empty
    * @param _instrument the instrument address
    * @return the instrument current variable borrow rate
    **/
    function getInstrumentCurrentVariableBorrowRate(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];

        if (instrument.currentVariableBorrowRate == 0) {
            return I_InstrumentInterestRateStrategy(instrument.interestRateStrategyAddress).getBaseVariableBorrowRate();
        }
        return instrument.currentVariableBorrowRate;
    }

    /**
    * @dev gets the _instrument average stable borrow rate. The average stable rate is the weighted average
    * of all the loans taken at stable rate.
    * @param _instrument the _instrument address
    * @return the _instrument current average borrow rate
    **/
    function getInstrumentCurrentAverageStableBorrowRate(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.currentAverageStableBorrowRate;
    }

    /**
    * @dev gets the _instrument liquidity rate
    * @param _instrument the _instrument address
    * @return the _instrument liquidity rate
    **/
    function getInstrumentCurrentLiquidityRate(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.currentLiquidityRate;
    }

    /**
    * @dev gets the _instrument liquidity cumulative index
    * @param _instrument the _instrument address
    * @return the _instrument liquidity cumulative index
    **/
    function getInstrumentLiquidityCumulativeIndex(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.lastLiquidityCumulativeIndex;
    }

    /**
    * @dev gets the _instrument variable borrow index
    * @param _instrument the _instrument address
    * @return the _instrument variable borrow index
    **/
    function getInstrumentVariableBorrowsCumulativeIndex(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.lastVariableBorrowCumulativeIndex;
    }

    function getInstrumentSIGHPayCumulativeIndex(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.lastSIGHPayCumulativeIndex;
    }

    function getInstrumentSIGHPayPaidIndex(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.lastSIGHPayPaidIndex;
    }

    function getInstrumentSIGHPayRate(address _instrument) external view returns (uint256) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.currentSighPayRate;
    }

    /**
    * @dev this function aggregates the configuration parameters of the instrument. It's used in the LendingPoolDataProvider specifically to save gas, and avoid multiple external contract calls to fetch the same data.
    * @param _instrument the _instrument address
    * @return Instrument's Decimals
    * @return Base LTV (Loan To Volume) as Collateral
    * @return Liquidation Threshold
    * @return Instrument Used as Collateral or not
    **/
    function getInstrumentConfiguration(address _instrument) external  view returns (uint256, uint256, uint256, bool) {
        uint256 decimals;
        uint256 baseLTVasCollateral;
        uint256 liquidationThreshold;
        bool usageAsCollateralEnabled;

        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        decimals = instrument.decimals;
        baseLTVasCollateral = instrument.baseLTVasCollateral;
        liquidationThreshold = instrument.liquidationThreshold;
        usageAsCollateralEnabled = instrument.usageAsCollateralEnabled;

        return (decimals, baseLTVasCollateral, liquidationThreshold, usageAsCollateralEnabled);
    }

    /**
    * @dev returns the decimals of the _instrument
    * @param _instrument the _instrument address
    * @return the _instrument decimals
    **/
    function getInstrumentDecimals(address _instrument) external view returns (uint256) {
        return reserves[_instrument].decimals;
    }

    /**
    * @dev returns true if the instrument is enabled for borrowing
    * @param _instrument the instrument address
    * @return true if the instrument is enabled for borrowing, false otherwise
    **/

    function isInstrumentBorrowingEnabled(address _instrument) external view returns (bool) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.borrowingEnabled;
    }

    /**
    * @dev returns true if the _instrument is enabled as collateral
    * @param _instrument the _instrument address
    * @return true if the _instrument is enabled as collateral, false otherwise
    **/

    function isInstrumentUsageAsCollateralEnabled(address _instrument) external view returns (bool) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.usageAsCollateralEnabled;
    }

    /**
    * @dev returns true if the stable rate is enabled on _instrument
    * @param _instrument the _instrument address
    * @return true if the stable rate is enabled on _instrument, false otherwise
    **/
    function getInstrumentIsStableBorrowRateEnabled(address _instrument) external view returns (bool) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.isStableBorrowRateEnabled;
    }

    /**
    * @dev returns true if the _instrument is active
    * @param _instrument the _instrument address
    * @return true if the _instrument is active, false otherwise
    **/
    function getInstrumentIsActive(address _instrument) external view returns (bool) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.isActive;
    }

    /**
    * @notice returns if a _instrument is freezed
    * @param _instrument the _instrument for which the information is needed
    * @return true if the _instrument is freezed, false otherwise
    **/
    function getInstrumentIsFreezed(address _instrument) external view returns (bool) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        return instrument.isFreezed;
    }

    /**
    * @notice returns the timestamp of the last action on the _instrument
    * @param _instrument the _instrument for which the information is needed
    * @return the last updated timestamp of the _instrument
    **/
    function getInstrumentLastUpdate(address _instrument) external view returns (uint40 timestamp) {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        timestamp = instrument.lastUpdateTimestamp;
    }

    /**
    * @return the array of instruments configured on the core
    **/
    function getInstruments() external view returns (address[] memory) {
        return instrumentsList;
    }

    /**
    * @param _instrument the address of the _instrument for which the information is needed
    * @param _user the address of the user for which the information is needed
    * @return true if the user has chosen to use the _instrument as collateral, false otherwise
    **/
    function isUserUseInstrumentAsCollateralEnabled(address _instrument, address _user) external view returns (bool) {
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];
        return user.useAsCollateral;
    }

    /**
    * @param _instrument the address of the instrument for which the information is needed
    * @param _user the address of the user for which the information is needed
    * @return the Borrow fee for the user
    **/
    function getUserBorrowFee(address _instrument, address _user) external view returns (uint256) {
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];
        return user.borrowFee;
    }

    /**
    * @dev the stable rate returned is 0 if the user is borrowing at variable or not borrowing at all
    * @param _instrument the address of the _instrument for which the information is needed
    * @param _user the address of the user for which the information is needed
    * @return the user stable rate
    **/
    function getUserCurrentStableBorrowRate(address _instrument, address _user) external  view returns (uint256) {
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];
        return user.stableBorrowRate;
    }

    /**
    * @dev the variable borrow index of the user is 0 if the user is not borrowing or borrowing at stable
    * @param _instrument the address of the _instrument for which the information is needed
    * @param _user the address of the user for which the information is needed
    * @return the variable borrow index for the user
    **/
    function getUserVariableBorrowCumulativeIndex(address _instrument, address _user)  external view returns (uint256) {
        CoreLibrary.UserInstrumentData storage user = usersInstrumentData[_user][_instrument];
        return user.lastVariableBorrowCumulativeIndex;
    }


    function getNormalizedSIGHPay( address instrumentAddress ) external view returns (uint) {
        CoreLibrary.InstrumentData storage instrument = reserves[instrumentAddress];
        return instrument.getNormalizedSIGHPay();
    }    

// ###################################################################
// ################     INTERNAL VIEW FUNCTIONS       ################
// ###################################################################

    /**
    * @dev gets the current borrow rate of the user
    * @param _instrument the address of the _instrument for which the information is needed
    * @param _user the address of the user for which the information is needed
    * @return the borrow rate for the user,
    **/
    function getUserCurrentBorrowRate(address _instrument, address _user) internal view returns (uint256) {
        CoreLibrary.InterestRateMode rateMode = getUserCurrentBorrowRateMode(_instrument, _user);

        if (rateMode == CoreLibrary.InterestRateMode.NONE) {
            return 0;
        }

        return rateMode == CoreLibrary.InterestRateMode.STABLE ? usersInstrumentData[_user][_instrument].stableBorrowRate : reserves[_instrument].currentVariableBorrowRate;
    }


// ##############################################################################################
// ################     FUNCTION CALLS BY LENDINGPOOLCONFIGURATOR CONTRACT       ################
// ##############################################################################################


    /**
    * @dev updates the lending pool core configuration
    **/
    function refreshConfiguration() external onlyLendingPoolConfigurator {
        refreshConfigInternal();
    }

    // updates the internal configuration of the core (lendingPool Address and SIGH Mechanism Address)
    function refreshConfigInternal() internal {
        lendingPoolAddress = addressesProvider.getLendingPool();
        sighMechanism = ISighDistributionHandler( addressesProvider.getSIGHMechanismHandler()  );        // ADDED BY SIGH FINANCE
    }    

    // ###########      ADDING & INITITALIZING A NEW INSTRUMENT      ###########

    /**
    * @dev initializes a instrument
    * @param _instrument the address of the instrument
    * @param _iTokenAddress the address of the overlying iToken contract
    * @param _decimals the decimals of the instrument currency
    * @param _interestRateStrategyAddress the address of the interest rate strategy contract
    **/
    function initInstrument( address _instrument, address _iTokenAddress,  uint256 _decimals, address _interestRateStrategyAddress, address _sighStreamAddress ) external onlyLendingPoolConfigurator {
        reserves[_instrument].init(_iTokenAddress, _decimals, _interestRateStrategyAddress);
        addInstrumentToListInternal(_instrument);
        // ADDED BY SIGH FINANCE
        require( sighMechanism.addInstrument( _instrument, _iTokenAddress, _sighStreamAddress, _decimals ), "Instrument failed to be properly added to the list of Instruments supported by SIGH Finance" ); // ADDED BY SIGH FINANCE        
        ITokenInterface iToken = ITokenInterface( _iTokenAddress ); 
        require( iToken.setSighStreamAddress( _sighStreamAddress ), "Sigh Stream Address failed to be properly initialized in ITOKEN " ); // ADDED BY SIGH FINANCE
    }

    // adds a instrument to the array of the instruments address
    function addInstrumentToListInternal(address _instrument) internal {
        bool _instrumentAlreadyAdded = false;
        for (uint256 i = 0; i < instrumentsList.length; i++)
            if (instrumentsList[i] == _instrument) {
                _instrumentAlreadyAdded = true;
            }
        if (!_instrumentAlreadyAdded) 
            instrumentsList.push(_instrument);
    }


    // UPADATES SIGH STREAM CONTRACT FOR AN ITOKEN
    // function sighStreamAddressUpdated(address instrument, address sighstreamAddress_ ) external onlyLendingPoolConfigurator returns (bool) {
    //     require ( sighMechanism.updateSighStreamAddressForInstrument( instrument, sighstreamAddress_ ), "Sigh Stream Address failed to be properly updated in SIGH Distribution Handler " ); // ADDED BY SIGH FINANCE
    //     ITokenInterface iToken = ITokenInterface( reserves[instrument].iTokenAddress ); 
    //     require ( iToken.updateSighStreamAddress( sighstreamAddress_ ), "Sigh Stream Address failed to be properly updated in ITOKEN " ); // ADDED BY SIGH FINANCE
    // }

    /**
    // * @dev removes the last added instrument in the instrumentsList array
    // * @param _instrumentToRemove the address of the instrument
    **/
    // function removeInstrument(address _instrumentToRemove) external onlyLendingPoolConfigurator returns (bool) {

    //     //as we can't check if totalLiquidity is 0 (since the instrument added might not be an ERC20) we at least check that there is nothing borrowed
    //     require(getInstrumentTotalBorrows(_instrumentToRemove) == 0, "Cannot remove an Instrument with open Borrows");
    //     require(getInstrumentTotalLiquidity(_instrumentToRemove) == 0, "Cannot remove an Instrument with non-zero Liquidity");

    //     delete reserves[_instrumentToRemove];
    //     // reserves[_instrumentToRemove].borrowingEnabled = false;
    //     // reserves[_instrumentToRemove].usageAsCollateralEnabled = false;
    //     // reserves[_instrumentToRemove].interestRateStrategyAddress = address(0);
    //     // reserves[_instrumentToRemove].iTokenAddress = address(0);
    //     // reserves[_instrumentToRemove].decimals = 0;
    //     // reserves[_instrumentToRemove].lastLiquidityCumulativeIndex = 0;
    //     // reserves[_instrumentToRemove].lastVariableBorrowCumulativeIndex = 0;
    //     // reserves[_instrumentToRemove].baseLTVasCollateral = 0;
    //     // reserves[_instrumentToRemove].liquidationThreshold = 0;
    //     // reserves[_instrumentToRemove].liquidationBonus = 0;

    //     uint index = 0;
    //     uint length_ = instrumentsList.length;
    //     for (uint i = 0 ; i < length_ ; i++) {
    //         if (instrumentsList[i] == _instrumentToRemove) {
    //             index = i;
    //             break;
    //         }
    //     }
    //     instrumentsList[index] = instrumentsList[length_ - 1];
    //     instrumentsList.length--;
    //     uint newLen = length_ - 1;
    //     require(instrumentsList.length == newLen,"Instrument not properly removed from the list of instruments supported by SIGH Finance's Lending Protocol");
    //     require(sighMechanism.removeInstrument(_instrumentToRemove ),"Instrument not properly removed from the list of instruments supported by SIGH FINANCE's SIGH Mechanism");
    //     return true;
    // }

    /**
    * @dev updates the address of the interest rate strategy contract
    * @param _instrument the address of the Instrument
    * @param _rateStrategyAddress the address of the interest rate strategy contract
    **/
    function setInstrumentInterestRateStrategyAddress(address _instrument, address _rateStrategyAddress) external onlyLendingPoolConfigurator {
        reserves[_instrument].interestRateStrategyAddress = _rateStrategyAddress;
    }


    /**
    * @dev enables a instrument to be used as collateral
    * @param _instrument the address of the instrument
    **/
    function enableInstrumentAsCollateral( address _instrument, uint256 _baseLTVasCollateral, uint256 _liquidationThreshold, uint256 _liquidationBonus ) external onlyLendingPoolConfigurator {
        reserves[_instrument].enableAsCollateral( _baseLTVasCollateral, _liquidationThreshold, _liquidationBonus);
    }

    /**
    * @dev disables a instrument to be used as collateral
    * @param _instrument the address of the instrument
    **/
    function disableInstrumentAsCollateral(address _instrument) external onlyLendingPoolConfigurator {
        reserves[_instrument].disableAsCollateral();
    }


    /**
    * @dev Switches borrowing on a instrument. Also sets the stable rate borrowing
    * @param _instrument the address of the instrument
    **/
    function borrowingOnInstrumentSwitch(address _instrument, bool toBeActivated)  external onlyLendingPoolConfigurator {
        if (toBeActivated) {
            reserves[_instrument].enableBorrowing();
        }
        else {
            reserves[_instrument].disableBorrowing();
        }
    }

    /**
    * @dev Switches the stable borrow rate mode on a instrument
    * @param _instrument the address of the instrument
    **/
    function instrumentStableBorrowRateSwitch(address _instrument, bool toBeActivated) external onlyLendingPoolConfigurator {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        if (toBeActivated) {
            instrument.isStableBorrowRateEnabled = true;
        }
        else {
            instrument.isStableBorrowRateEnabled = false;
        }
    }


    /**
    * @dev Switches isActive of an instrument
    * @param _instrument the address of the instrument
    **/
    function InstrumentActivationSwitch(address _instrument , bool toBeActivated) external onlyLendingPoolConfigurator {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        require(  instrument.lastLiquidityCumulativeIndex > 0 &&  instrument.lastVariableBorrowCumulativeIndex > 0, "Instrument has not been initialized yet");
        if (toBeActivated) {
            instrument.isActive = true;
        }
        else {
            instrument.isActive = false;
        }
    }

    /**
    * @notice allows the configurator to freeze/unfreeze the instrument.
    * A freezed instrument does not allow any action apart from repay, redeem, liquidationCall, rebalance.
    * @param _instrument the address of the instrument
    **/
    function InstrumentFreezeSwitch(address _instrument , bool toBeActivated) external onlyLendingPoolConfigurator {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        if (toBeActivated) {
            instrument.isFreezed = true;
        }
        else {
            instrument.isFreezed = false;
        }
    }

    /**
    * @notice allows the configurator to update the loan to value of a instrument, liquidation threshold, liquidation bonus
    * @param _instrument the address of the instrument
    * @param _ltv the new loan to value
    **/
    function updateInstrumentCollateralParameters(address _instrument, uint256 _ltv, uint256 _threshold, uint256 _bonus) external onlyLendingPoolConfigurator {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        instrument.baseLTVasCollateral = _ltv;
        instrument.liquidationThreshold = _threshold;
        instrument.liquidationBonus = _bonus;
    }

// ##########################################################################
// ################    FREQUENTLY USED INTERNAL FUNCTIONS    ################
// ##########################################################################

    /**
    * @dev Updates the instrument's current stable borrow rate Rf, the current variable borrow rate Rv and the current liquidity rate Rl.
    * Also updates the lastUpdateTimestamp value. Please refer to the whitepaper for further information.
    * @param _instrument the address of the instrument to be updated
    * @param _liquidityAdded the amount of liquidity added to the protocol (deposit or repay) in the previous action
    * @param _liquidityTaken the amount of liquidity taken from the protocol (redeem or borrow)
    **/
    function updateInstrumentInterestRatesAndTimestampInternal( address _instrument, uint256 _liquidityAdded, uint256 _liquidityTaken ) internal {
        CoreLibrary.InstrumentData storage instrument = reserves[_instrument];
        (uint256 newLiquidityRate, uint256 newStableRate, uint256 newVariableRate, uint256 newSighPayRate) = I_InstrumentInterestRateStrategy(instrument.interestRateStrategyAddress).calculateInterestRates( _instrument, getInstrumentAvailableLiquidity(_instrument).add(_liquidityAdded).sub(_liquidityTaken),    instrument.totalBorrowsStable, instrument.totalBorrowsVariable, instrument.currentAverageStableBorrowRate   );

        instrument.currentLiquidityRate = newLiquidityRate;
        instrument.currentStableBorrowRate = newStableRate;
        instrument.currentVariableBorrowRate = newVariableRate;
        instrument.currentSighPayRate = newSighPayRate;                 // SIGH PAY RATE
        instrument.lastUpdateTimestamp = uint40(block.timestamp);

        emit InstrumentUpdated(  _instrument,  newLiquidityRate,  newStableRate,  newVariableRate, newSighPayRate, instrument.lastLiquidityCumulativeIndex,  instrument.lastVariableBorrowCumulativeIndex, instrument.lastSIGHPayCumulativeIndex );
    }

    /**
    * @dev transfers to the protocol fees of a flashloan to the fees collection address
    * @param _token the address of the token being transferred
    * @param _amount the amount being transferred
    **/
    function transferFlashLoanProtocolFeeInternal(address _token, uint256 _amount) internal {
        address payable receiver = address(uint160(addressesProvider.getSIGHFinanceFeeCollector()));

        if (_token != EthAddressLib.ethAddress()) {
            ERC20(_token).safeTransfer(receiver, _amount);
        } else {
            receiver.transfer(_amount);
        }
    }

// ############################################################################################################
// ################   FUNCTION TO DISTRIBUTE COLLECTED INTEREST TO STAKING CONTRACT ADDRESS    ################
// ############################################################################################################

    /**
    * @dev transfers to the $SIGH Staking Contract 
    * @param instrumentAddress the address of the Instrument for which SIGH PAY is being being transferred [to SIGH Staking Contract]
    **/
    function transferSIGHPayToStakingContract(address instrumentAddress) external onlyLendingPool { // address will be changed later
        address payable receiver = address(uint160(addressesProvider.getSIGHStaking()));
        require(address(receiver) != address(0),'SIGH Staking contract address not set properly');
        CoreLibrary.InstrumentData storage instrument = reserves[instrumentAddress];

        // Cumulates the indexes
        instrument.updateCumulativeIndexes();
        sighMechanism.updateSIGHSupplyIndex(instrumentAddress); 

        uint256 totalLiquidity = getInstrumentTotalLiquidity(instrumentAddress);
        uint256 normalizedSIGHPay = instrument.getNormalizedSIGHPay();
        uint256 interestAccuredBalance = totalLiquidity.wadToRay().rayMul( normalizedSIGHPay ).rayDiv( instrument.lastSIGHPayPaidIndex ).rayToWad();
        instrument.lastSIGHPayPaidIndex = normalizedSIGHPay;

        // Update the SIGH PAY : Paid Index
        uint256 _sighPayAccured = interestAccuredBalance.sub(totalLiquidity);

        if (instrumentAddress != EthAddressLib.ethAddress()) {
            ERC20(instrumentAddress).safeTransfer(receiver, _sighPayAccured);
        } else {
            receiver.transfer(_sighPayAccured);
        }

        updateInstrumentInterestRatesAndTimestampInternal(instrumentAddress, 0, _sighPayAccured);
        emit SIGH_PAY_Amount_Transferred( address(receiver), address(instrumentAddress), totalLiquidity, _sighPayAccured, instrument.lastSIGHPayPaidIndex , instrument.lastSIGHPayCumulativeIndex );
    }
    
    

}
