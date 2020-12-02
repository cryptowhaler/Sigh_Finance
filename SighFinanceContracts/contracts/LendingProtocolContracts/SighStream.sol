pragma solidity ^0.5.0;

import "../openzeppelin-upgradeability/VersionedInitializable.sol";

import "../Configuration/IGlobalAddressesProvider.sol";
import "../SIGHFinanceContracts/Interfaces/ISighDistributionHandler.sol";
import "./interfaces/ILendingPoolCore.sol";
import "./interfaces/ITokenInterface.sol";

import "./libraries/WadRayMath.sol";
import "./interfaces/ISighStream.sol";

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

//import "./libraries/WadRayMath.sol";

/**
 * @title  $SIGH STREAMS
 *
 * @dev Implementation of the $SIGH Liquidity & Borrowing Streams for ITokens.
 * @author SIGH Finance 
 */
contract SighStream is ISighStream, VersionedInitializable {

    using SafeMath for uint256;
    uint private sighInitialIndex = 1e36;        // INDEX (SIGH RELATED)

    address public underlyingInstrumentAddress;
    ITokenInterface public iToken;

    IGlobalAddressesProvider private globalAddressesProvider;     // Only used in Constructor()
    ISighDistributionHandler public sighDistributionHandlerContract; // Fetches Instrument Indexes/ Calls Function to transfer accured SIGH
    ILendingPoolCore private core;                                  // Fetches user borrow Balances

    struct Double {
        uint mantissa;
    }

    struct Exp {
        uint mantissa;
    }

    // $SIGH PARAMETERS
    // EACH USER HAS 2 $SIGH STREAMS :-
    // 1. $SIGH STREAM BASED ON VOLATILITY OF THE LIQUIDITY PROVIDED
    // 1. $SIGH STREAM BASED ON VOLATILITY OF THE BORROWED AMOUNT
    // ---> Each $SIGH Stream can be Re-directed to another Account
    // ---> Authority to re-direct each $SIGH Stream can be given to another Account
    // ---> $SIGH Accured by a particular user = 
    // -----> if (Liquidity $SIGH not redirected ) => $SIGH Accured += Liquidity $SIGH Stream
    // -----> if (Borrow balance based $SIGH not redirected ) => $SIGH Accured += Borrowing $SIGH Stream
    // ----->  => $SIGH Accured += SUM(Liquidity $SIGH Streams re-directed to this account), this SUM is calculated by accuring $SIGH over the cummulated re-directed balance
    // ----->  => $SIGH Accured += SUM(Borrowing $SIGH Streams re-directed to this account), this SUM is calculated by accuring $SIGH over the cummulated re-directed balance

    uint public sigh_Transfer_Threshold = 1e19;                         // SIGH Transferred when accured >= 1 SIGH (in ETH)
    mapping (address => uint256) private AccuredSighBalance;           // SIGH Collected - ADDED BY SIGH FINANCE
    
    struct user_SIGH_State {
        uint256 userLiquiditySIGHStreamRedirectedBalance;        // SUM(Balance of Accounts from which Liquidity $SIGH Streams have been re-directed to this account)
        uint256 userBorrowingSIGHStreamRedirectedBalance;        // SUM(Balance of Accounts from which Borrowing $SIGH Streams have been re-directed to this account)

        uint256 userLiquiditySIGHStreamIndex;                     // SupplierIndex - ADDED BY SIGH FINANCE
        uint256 userBorrowingSIGHStreamIndex;                     // BorrowerIndex - ADDED BY SIGH FINANCE

        address userLiquiditySIGHStreamRedirectionAddress;       // Redirection Address - ADDED BY SIGH FINANCE
        address userBorrowingSIGHStreamRedirectionAddress;       // Redirection Address - ADDED BY SIGH FINANCE

        address userLiquiditySIGHStreamRedirectionAllowance;    // Allowance - ADDED BY SIGH FINANCE
        address userBorrowingSIGHStreamRedirectionAllowance;    // Allowance - ADDED BY SIGH FINANCE
    }
    
    mapping (address => user_SIGH_State) private user_SIGH_States;              

    // $SIGH STREAMS RELATED EVENTS

    // LIQUIDITY $SIGH STREAM
    event LiquiditySIGHStreamRedirectionAllowanceChanged(address instrument, address user, address allowedAccount );
    event LiquiditySIGHStreamStreamRedirected(address instrument,  address fromAccount, address toAccount, uint redirectedBalance );
    event LiquiditySIGHStreamRedirectedBalanceUpdated(address instrument,  address redirectionAddress,uint _balanceToAdd,uint _balanceToRemove,uint totalRedirectedBalanceForLiquiditySIGHStream );

    // BORROWING $SIGH STREAM
    event BorrowingSIGHStreamRedirectionAllowanceChanged(address instrument,  address user, address allowedAccount );
    event BorrowingSIGHStreamStreamRedirected(address instrument,  address fromAccount, address toAccount, uint redirectedBalance );
    event BorrowingSIGHStreamRedirectedBalanceUpdated(address instrument,  address redirectionAddress,uint _balanceToAdd,uint _balanceToRemove,uint totalRedirectedBalanceForBorrowingSIGHStream );

    event SighAccured(address instrument, address user, bool isLiquidityStream, uint recentSIGHAccured  , uint AccuredSighBalance );

    modifier onlyITokenContract {
        require( msg.sender == address(iToken), "The caller of this function must be the associated IToken Contract");
        _;
    }    
    

// ####################################################################################################################
// ####### PROXY RELATED ##############################################################################################
// ######  1. Sets the underlyingInstrumentAddress, and _iTokenAddress.              ###############################################################
// ######  2. The GlobalAddressesProvider's address is used to get the LendingPoolCore #######################################################
// ######     contract address, Sigh Distribution Handler contract address,  and set them.    ###################
// ####################################################################################################################

    uint256 public constant CONFIGURATOR_REVISION = 0x1;

    function getRevision() internal pure returns (uint256) {
        return CONFIGURATOR_REVISION;
    }

    function initialize(IGlobalAddressesProvider _globalAddressesProvider, address _underlyingAsset, address _iTokenAddress) public initializer {
        globalAddressesProvider = _globalAddressesProvider;
        core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        sighDistributionHandlerContract = ISighDistributionHandler(globalAddressesProvider.getSIGHMechanismHandler());
        iToken = ITokenInterface(_iTokenAddress) ;

        underlyingInstrumentAddress = _underlyingAsset;
    }


// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ######  ____ REDIRECTING Liquidity $SIGH STREAMS : FUNCTIONALITY ____     ##############################################################################################################
// ######  1. redirectLiquiditySIGHStream() [EXTERNAL] : User himself redirects his Liquidity SIGH stream.      #################################################################
// ######  2. allowLiquiditySIGHRedirectionTo() [EXTERNAL] : User gives the permission of redirecting the Liquidity SIGH stream to another account     ##########################
// ######  2. redirectLiquiditySIGHStreamOf() [EXTERNAL] : When account given the permission to redirect Liquidity SIGH stream (by the user) redirects the stream.    ###########
// ######  3. redirectLiquiditySIGHStreamInternal() [INTERNAL] --> Executes the redirecting of the Liquidity SIGH stream    #####################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################


    /**
    * @dev redirects the Liquidity $SIGH Stream being generated to a target address. 
    * @param _to the address to which the Liquidity $SIGH Stream will be redirected
    **/
    function redirectLiquiditySIGHStream(address from, address _to) external onlyITokenContract {
        redirectLiquiditySIGHStreamInternal(msg.sender, _to);
    }

    /**
    * @dev gives allowance to an address to execute the Liquidity $SIGH Stream redirection on behalf of the caller.
    * @param _to the address to which the Liquidity $SIGH Stream redirection permission is given. Pass address(0) to reset the allowance.
    **/
    function allowLiquiditySIGHRedirectionTo(address from, address _to) external onlyITokenContract {
        require(_to != from, "User cannot give allowance to himself");
        user_SIGH_States[from].userLiquiditySIGHStreamRedirectionAllowance = _to;
        emit LiquiditySIGHStreamRedirectionAllowanceChanged( underlyingInstrumentAddress, from , _to);
    }

    /**
    * @dev redirects the Liquidity $SIGH Stream generated by _from to a target address.
    * The caller needs to have allowance on the Liquidity $SIGH Stream redirection to be able to execute the function.
    * @param _from the address of the user whom Liquidity $SIGH Stream is being redirected
    * @param _to the address to which the Liquidity $SIGH Stream will be redirected
    **/
    function redirectLiquiditySIGHStreamOf(address user, address _from, address _to) external onlyITokenContract {
        require( user == user_SIGH_States[_from].userLiquiditySIGHStreamRedirectionAllowance , "Caller is not allowed to redirect the Liquidity $SIGH Stream of the user");
        redirectLiquiditySIGHStreamInternal(_from,_to);
    }

    /**
    * @dev executes the redirection of the Liquidity $SIGH Stream from one address to another.
    * immediately after redirection, the destination address will start to accrue $SIGH from Liquidity $SIGH Stream.
    * @param _from the source address
    * @param _to the destination address
    **/
    function redirectLiquiditySIGHStreamInternal( address _from, address _to) internal {

        // check 1
        address currentRedirectionAddress = user_SIGH_States[_from].userLiquiditySIGHStreamRedirectionAddress;
        require(_to != currentRedirectionAddress, "Liquidity $SIGH Stream is already redirected to the provided account");

        // check 2
        (,uint256 currentBalance , uint256 balanceIncrease, ) = iToken.cumulateBalance(_from);
        require( iToken.balanceOf(_from) > 0, "Liquidity $SIGH Stream stream can only be redirected if there is a valid Liquidity Balance accuring $SIGH for the user");
        

        // if the user is already redirecting the Liquidity $SIGH Stream to someone, before changing the redirection address 
        // 1. Add the interest accured by From Account to the redirected address
        // 1. We accure $SIGH for that address
        // 2. We substract the redirected balance of the from account from that address
        if (currentRedirectionAddress != address(0)) { 
             updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_from, balanceIncrease, 0 );    
            (,uint256 redirectionAddressAccountBalance, ,) = iToken.cumulateBalance(currentRedirectionAddress);    //cumulates the balance of the user being liquidated
            accure_SIGH_For_LiquidityStream_Internal(currentRedirectionAddress, redirectionAddressAccountBalance );
            updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_from,0, currentBalance );
        }

        //   if the user is redirecting the Liquidity $SIGH Stream back to himself, we simply set to 0 the Liquidity $SIGH Stream redirection address
        if(_to == _from) {               
            user_SIGH_States[_from].userLiquiditySIGHStreamRedirectionAddress = address(0);
            emit LiquiditySIGHStreamStreamRedirected(underlyingInstrumentAddress, _from, address(0), currentBalance );
            return;
        }

        // Redirecting Liquidity $SIGH Stream and adding the user balance to the redirected balance of the redirection address
        user_SIGH_States[_from].userLiquiditySIGHStreamRedirectionAddress = _to;     
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_from,currentBalance,0);                               
        emit LiquiditySIGHStreamStreamRedirected(underlyingInstrumentAddress, _from, _to, currentBalance );
    }

// ###########################################################################################################################################################
// ######  ____  Liquidity $SIGH STREAMS : FUNCTIONALITY ____     ##############################################################################################################
// ######  1. updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddress() [EXTERNAL]
// ######  ---> Addition / Subtraction from the redirected balance of the address to which the user's Liquidity $SIGH stream is redirected      
// ######  2. accureLiquiditySighStream() [EXTERNAL]  
// ######  ---> Calls accureLiquiditySighStreamInternal()
// ######  3. accureLiquiditySighStreamInternal() [EXTERNAL]  
// ######  ---> Calls accure_SIGH_For_LiquidityStream_Internal() in case SIGH needs to be accured for both the user and the address to which it is redirecting $SIGH
// ######  4. accure_SIGH_For_LiquidityStream_Internal() [EXTERNAL]  
// ######  ---> Accures $SIGH for the user
// ###########################################################################################################################################################

    /**
    * @dev Updates the Liquidity $SIGH Stream Redirected Balances of the user. If the user is not redirecting anything, nothing is executed.
    * @param _user the address of the user for which the some change in the Liquidity is happening
    * @param _balanceToAdd the amount to add to the redirected balance
    * @param _balanceToRemove the amount to remove from the redirected balance
    **/
    function updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddress( address _user, uint256 _balanceToAdd, uint256 _balanceToRemove ) external onlyITokenContract {
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_user,_balanceToAdd,_balanceToRemove);
    }

    function updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal( address _user, uint256 _balanceToAdd, uint256 _balanceToRemove ) internal {
        address redirectionAddress = user_SIGH_States[_user].userLiquiditySIGHStreamRedirectionAddress;
        if(redirectionAddress == address(0)){           //if there isn't any redirection, nothing to be done
            return;
        }
        //updating the redirected balance
        user_SIGH_States[redirectionAddress].userLiquiditySIGHStreamRedirectedBalance = user_SIGH_States[redirectionAddress].userLiquiditySIGHStreamRedirectedBalance.add(_balanceToAdd).sub(_balanceToRemove);
        emit LiquiditySIGHStreamRedirectedBalanceUpdated(underlyingInstrumentAddress, redirectionAddress, _balanceToAdd, _balanceToRemove, user_SIGH_States[redirectionAddress].userLiquiditySIGHStreamRedirectedBalance );
    }

    function accureLiquiditySighStream( address supplier, uint unaccountedBalanceIncrease , uint256 currentCompoundedBalance )  external onlyITokenContract   {
        accureLiquiditySighStreamInternal(supplier,unaccountedBalanceIncrease,currentCompoundedBalance);
    }

    // $SIGH Accured for the Supplier (depositor/redeemer) and the address to which it is redirecting its stream to
    // --> For the redirected address, we cumulate its interest if it is not redirecting again
    // SIGH Accured by Supplier = { SUM(Redirected balances) + User's Balance (Only if it is also not redirected) } * {Delta Index}
    function accureLiquiditySighStreamInternal( address supplier, uint unaccountedBalanceIncrease , uint256 currentCompoundedBalance )  internal  {
        if (user_SIGH_States[supplier].userLiquiditySIGHStreamRedirectionAddress == address(0)) {
            accure_SIGH_For_LiquidityStream_Internal( supplier,currentCompoundedBalance );        
        }
        else {
            address redirectionAddress = user_SIGH_States[supplier].userLiquiditySIGHStreamRedirectionAddress;
            if (user_SIGH_States[redirectionAddress].userLiquiditySIGHStreamRedirectionAddress == address(0) ) {
                (,uint256 accountBalance, uint256 balanceIncrease, uint256 index) = iToken.cumulateBalance(redirectionAddress);    //cumulates the balance of the user being liquidated
                accure_SIGH_For_LiquidityStream_Internal(redirectionAddress,accountBalance.add(unaccountedBalanceIncrease) );
            }
            else {
                accure_SIGH_For_LiquidityStream_Internal(redirectionAddress,unaccountedBalanceIncrease);
            }
            accure_SIGH_For_LiquidityStream_Internal(supplier,0);
        }
    }


    function accure_SIGH_For_LiquidityStream_Internal( address user, uint256 currentCompoundedBalance ) internal  {
        uint supplyIndex = sighDistributionHandlerContract.getInstrumentSupplyIndex( underlyingInstrumentAddress );      // Instrument index retreived from the SIGHDistributionHandler Contract
        require(supplyIndex > 0, "SIGH Distribution Handler returned invalid supply Index for the instrument");

        // Total Balance = SUM(Redirected balances) + User's Balance (Only if it is not redirected)
        uint totalBalanceForAccuringSIGH = user_SIGH_States[user].userLiquiditySIGHStreamRedirectedBalance.add(currentCompoundedBalance);

        Double memory userIndex = Double({mantissa: user_SIGH_States[user].userLiquiditySIGHStreamIndex}) ;      // Stored User Index
        Double memory instrumentIndex = Double({mantissa: supplyIndex});                        // Instrument Index
        user_SIGH_States[user].userLiquiditySIGHStreamIndex = instrumentIndex.mantissa;                                   // User Index is UPDATED

        if (userIndex.mantissa == 0 && instrumentIndex.mantissa > 0) {
            userIndex.mantissa = instrumentIndex.mantissa; // sighInitialIndex;
        }

        Double memory deltaIndex = sub_(instrumentIndex, userIndex);                                // , 'Distribute Supplier SIGH : supplyIndex Subtraction Underflow'

        if ( deltaIndex.mantissa > 0 && totalBalanceForAccuringSIGH > 0 ) {
            uint supplierSighDelta = mul_(totalBalanceForAccuringSIGH, deltaIndex);                                      // Supplier Delta = Balance * Double(DeltaIndex)/DoubleScale
            accureSigh(user, supplierSighDelta, true );        // ACCURED SIGH AMOUNT IS ADDED TO THE AccuredSighBalance of the Supplier or the address to which SIGH is being redirected to 
        }
    }

// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ######  ____ REDIRECTING Borrowing $SIGH STREAMS : FUNCTIONALITY ____     ##############################################################################################################
// ######  1. redirectBorrowingSIGHStream() [EXTERNAL] : User himself redirects his Borrowing SIGH Stream.      #################################################################
// ######  2. allowBorrowingSIGHRedirectionTo() [EXTERNAL] : User gives the permission of redirecting the Borrowing SIGH Stream to another account     ##########################
// ######  2. redirectBorrowingSIGHStreamOf() [EXTERNAL] : When account given the permission to redirect Borrowing SIGH Stream (by the user) redirects the stream.    ###########
// ######  3. redirectBorrowingSIGHStreamInternal() [INTERNAL] --> Executes the redirecting of the Borrowing SIGH Stream    #####################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################
// ###########################################################################################################################################################

    /**
    * @dev redirects the Borrowing $SIGH Stream being generated to a target address. 
    * @param _to the address to which the Borrowing $SIGH Stream will be redirected
    **/
    function redirectBorrowingSIGHStream(address user, address _to) external onlyITokenContract {
        redirectBorrowingSIGHStreamInternal(user, _to);
    }

    /**
    * @dev gives allowance to an address to execute the Borrowing $SIGH Stream redirection on behalf of the caller.
    * @param _to the address to which the Borrowing $SIGH Stream redirection permission is given. Pass address(0) to reset the allowance.
    **/
    function allowBorrowingSIGHRedirectionTo(address user, address _to) external onlyITokenContract {
        require(_to != user, "User cannot give allowance to himself");
        user_SIGH_States[user].userBorrowingSIGHStreamRedirectionAllowance = _to;
        emit BorrowingSIGHStreamRedirectionAllowanceChanged(underlyingInstrumentAddress, user, _to);
    }

    /**
    * @dev redirects the Borrowing $SIGH Stream generated by _from to a target address.
    * The caller needs to have allowance on the Borrowing $SIGH Stream redirection to be able to execute the function.
    * @param _from the address of the user whom Borrowing $SIGH Stream is being redirected
    * @param _to the address to which the Borrowing $SIGH Stream will be redirected
    **/
    function redirectBorrowingSIGHStreamOf(address user, address _from, address _to) external onlyITokenContract {
        require( user == user_SIGH_States[_from].userBorrowingSIGHStreamRedirectionAllowance, "Caller is not allowed to redirect the Borrowing $SIGH Stream of the user");
        redirectBorrowingSIGHStreamInternal(_from,_to);
    }

    /**
    * @dev executes the redirection of the Borrowing $SIGH Stream from one address to another.
    * immediately after redirection, the destination address will start to accrue $SIGH from Borrowing $SIGH Stream.
    * @param _from the source address
    * @param _to the destination address
    **/
    function redirectBorrowingSIGHStreamInternal( address _from, address _to) internal {

        // check 1
        address currentRedirectionAddress = user_SIGH_States[_from].userBorrowingSIGHStreamRedirectionAddress;
        require(_to != currentRedirectionAddress, "Borrowing $SIGH Stream is already redirected to the provided account");

        // check 2
        ( uint principalBorrowBalance , uint compoundedBorrowBalance , uint balanceIncrease) = core.getUserBorrowBalances(underlyingInstrumentAddress, _from);                                 // Getting Borrow Balance of the User from LendingPool Core 
        require( compoundedBorrowBalance > 0, "Borrowing $SIGH Stream stream can only be redirected if there is a valid Principal Borrowing Balance accuring $SIGH for the user");
        

        // if the user is already redirecting the Borrowing $SIGH Stream to someone, before changing the redirection address 
        // 1. Add the compounded borrow interest by From Account to the redirected address
        // 1. We accure $SIGH for that address
        // 2. We substract the redirected compounded balance of the from account from that address
        if (currentRedirectionAddress != address(0)) { 
            accureBorrowingSighStreamInternal( _from );
            updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddressInternal(_from,0, principalBorrowBalance );
        }

        //   if the user is redirecting the Borrowing $SIGH Stream back to himself, we simply set to 0 the Borrowing $SIGH Stream redirection address
        if(_to == _from) {               
            user_SIGH_States[_from].userBorrowingSIGHStreamRedirectionAddress = address(0);
            emit BorrowingSIGHStreamStreamRedirected(underlyingInstrumentAddress,  _from, address(0), principalBorrowBalance );
            return;
        }

        // Redirecting Borrowing $SIGH Stream and adding the user principal borrow balance to the redirected balance of the redirection address
        user_SIGH_States[_from].userBorrowingSIGHStreamRedirectionAddress = _to;     
        updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddressInternal(_from,principalBorrowBalance,0);                               
        emit BorrowingSIGHStreamStreamRedirected(underlyingInstrumentAddress,  _from, _to, principalBorrowBalance );
    }

// ###########################################################################################################################################################
// ######  ____  Borrowing $SIGH Streams : FUNCTIONALITY ____     ##############################################################################################################
// ######  1. updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddressesInternal() [INTERNAL] : Addition / Subtraction from the redirected balance of the address to which the user's Borrowing $SIGH Stream is redirected      #################################################################
// ######  2. accure_SIGH_For_BorrowingStream() [INTERNAL] : Accure SIGH from the Borrowing $SIGH Streams     ##########################
// ###########################################################################################################################################################


    /**
    * @dev Updates the Borrowing $SIGH Stream Redirected Balances of the user. If the user is not redirecting anything, nothing is executed.
    * @param _user the address of the user for which the some change in the Liquidity is happening
    * @param _balanceToAdd the amount to add to the redirected balance
    * @param _balanceToRemove the amount to remove from the redirected balance
    **/
    function updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddress( address _user, uint256 _balanceToAdd, uint256 _balanceToRemove ) onlyITokenContract external {
        updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddressInternal(_user,_balanceToAdd,_balanceToRemove);
    }

    function updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddressInternal( address _user, uint256 _balanceToAdd, uint256 _balanceToRemove ) internal {
        address redirectionAddress = user_SIGH_States[_user].userBorrowingSIGHStreamRedirectionAddress;
        if(redirectionAddress == address(0)){           //if there isn't any redirection, nothing to be done
            return;
        }
        //updating the redirected balance
        user_SIGH_States[redirectionAddress].userBorrowingSIGHStreamRedirectedBalance = user_SIGH_States[redirectionAddress].userBorrowingSIGHStreamRedirectedBalance.add(_balanceToAdd).sub(_balanceToRemove);
        emit BorrowingSIGHStreamRedirectedBalanceUpdated(underlyingInstrumentAddress,  redirectionAddress, _balanceToAdd, _balanceToRemove, user_SIGH_States[redirectionAddress].userBorrowingSIGHStreamRedirectedBalance );
    }


    // "userBorrowingSIGHStreamIndex" tracks the SIGH Accured per Instrument. user Index tracks the Sigh Accured by the user per Instrument
    // Delta Index = Instrument Index - User Index
    // SIGH Accured by user = { SUM(Redirected balances) + User's Compounded Borrow Balance (Only if it is also not redirected) } * {Delta Index}
    function accure_SIGH_For_BorrowingStream( address user) external onlyITokenContract {
        accureBorrowingSighStreamInternal(user);
    }

    function accureBorrowingSighStreamInternal( address user) internal  {
        ( uint principalBorrowBalance , uint compoundedBorrowBalance , uint balanceIncrease) = core.getUserBorrowBalances(underlyingInstrumentAddress, user);          // Getting Borrow Balance of the User from LendingPool Core 
        
        // Total Balance = SUM(Redirected balances) + User's Balance (Only if it is not redirected)
        if (user_SIGH_States[user].userBorrowingSIGHStreamRedirectionAddress == address(0)) {
            accure_SIGH_For_BorrowingStreamInternal(user, compoundedBorrowBalance );
        }
        else {
            address redirectionAddress = user_SIGH_States[user].userBorrowingSIGHStreamRedirectionAddress;
            if (user_SIGH_States[redirectionAddress].userBorrowingSIGHStreamRedirectionAddress == address(0) ) {
                (  , uint _compoundedBorrowBalance , ) = core.getUserBorrowBalances(underlyingInstrumentAddress, redirectionAddress);          // Getting Borrow Balance of the User from LendingPool Core 
                accure_SIGH_For_BorrowingStreamInternal(redirectionAddress, _compoundedBorrowBalance.add(balanceIncrease) );
            }
            else {
                accure_SIGH_For_BorrowingStreamInternal(redirectionAddress, balanceIncrease );
            }
        }
    }

    function accure_SIGH_For_BorrowingStreamInternal(address user, uint compoundedBalance) internal {
        uint borrowIndex = sighDistributionHandlerContract.getInstrumentBorrowIndex( underlyingInstrumentAddress );      // Instrument index retreived from the SIGHDistributionHandler Contract
        require(borrowIndex > 0, "SIGH Distribution Handler returned invalid borrow Index for the instrument");

        // Total Balance = SUM(Redirected balances) + User's Balance (Only if it is not redirected)
        uint totalBalanceForAccuringSIGH = user_SIGH_States[user].userBorrowingSIGHStreamRedirectedBalance.add(compoundedBalance);

        Double memory userIndex = Double({ mantissa: user_SIGH_States[user].userBorrowingSIGHStreamIndex }) ;      // Stored User Index
        Double memory instrumentIndex = Double({mantissa: borrowIndex});                        // Instrument Index
        user_SIGH_States[user].userBorrowingSIGHStreamIndex = instrumentIndex.mantissa;                                   // User Index is UPDATED

        if (userIndex.mantissa == 0 && instrumentIndex.mantissa > 0) {
            userIndex.mantissa = instrumentIndex.mantissa; // sighInitialIndex;
        }

        Double memory deltaIndex = sub_(instrumentIndex, userIndex);                                // , 'Distribute Supplier SIGH : supplyIndex Subtraction Underflow'

        if ( deltaIndex.mantissa > 0 && totalBalanceForAccuringSIGH > 0 ) {
            uint borrowerSighDelta = mul_(totalBalanceForAccuringSIGH, deltaIndex);                                      // Supplier Delta = Balance * Double(DeltaIndex)/DoubleScale
            accureSigh(user, borrowerSighDelta, false );        // ACCURED SIGH AMOUNT IS ADDED TO THE AccuredSighBalance of the Supplier or the address to which SIGH is being redirected to 
        }
    }

// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ############ ______SIGH ACCURING AND STREAMING FUNCTIONS______ ############
// ############ 1. accureSigh() [INTERNAL] : 
// ############ 2. claimMySIGH() [EXTERNAL] : All accured SIGH is transferred to the transacting account.
// ############ 3. claimSIGH() [EXTERNAL]  : Accepts an array of users. Same as 1 but for array of users.
// ############ 4. claimSighInternal() [INTERNAL] : CAlled from 1. and 2.
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################


    function claimMySIGH(address user) onlyITokenContract external {
        claimSighInternal(user);
    }


    function claimSighInternal(address user) internal {
        (,uint256 currentBalance , uint256 balanceIncrease, ) = iToken.cumulateBalance(user);
        accureLiquiditySighStreamInternal(user, balanceIncrease, iToken.balanceOf(user) );
        accureBorrowingSighStreamInternal(user);
        if (AccuredSighBalance[user] > 0) {
            AccuredSighBalance[user] = sighDistributionHandlerContract.transferSighTotheUser( underlyingInstrumentAddress, user, AccuredSighBalance[user] ); // Pending Amount Not Transferred is returned
        }
    }

    /**
     * @notice Accured SIGH amount is added to the ACCURED_SIGH_BALANCES of the Supplier/Borrower or the address to which SIGH is being redirected to.
     * @param user The user for which SIGH is being accured
     * @param accuredSighAmount The amount of SIGH accured
     */
    function accureSigh( address user, uint accuredSighAmount, bool isLiquidityStream ) internal {
        AccuredSighBalance[user] = AccuredSighBalance[user].add(accuredSighAmount);   // Accured SIGH added to the redirected user's sigh balance                    
        emit SighAccured( underlyingInstrumentAddress, user, isLiquidityStream, accuredSighAmount, AccuredSighBalance[user] );
        if ( AccuredSighBalance[user] > sigh_Transfer_Threshold ) {   // SIGH is Transferred if SIGH_ACCURED_BALANCE > 1e18 SIGH
            AccuredSighBalance[user] = sighDistributionHandlerContract.transferSighTotheUser( underlyingInstrumentAddress, user, AccuredSighBalance[user] ); // Pending Amount Not Transferred is returned
        }
    }

// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ######  VIEW FUNCTIONS ($SIGH STREAMS RELATED)    ################## 
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################
// ###########################################################################


    function getSighAccured(address account) external view returns (uint) {
        return AccuredSighBalance[account];
    }


    function getSIGHStreamsRedirectedTo(address user) external view returns (address liquiditySIGHStreamRedirectionAddress,address BorrowingSIGHStreamRedirectionAddress ) {
        return (user_SIGH_States[user].userLiquiditySIGHStreamRedirectionAddress , user_SIGH_States[user].userBorrowingSIGHStreamRedirectionAddress );
    }

    function getSIGHStreamsAllowances(address user) external view returns (address liquiditySIGHStreamRedirectionAllowance,address BorrowingSIGHStreamRedirectionAllowance ) {
        return (user_SIGH_States[user].userLiquiditySIGHStreamRedirectionAllowance , user_SIGH_States[user].userBorrowingSIGHStreamRedirectionAllowance );
    }    

    function getSIGHStreamsIndexes(address user) external view returns (uint liquiditySIGHStreamIndex, uint borrowingSIGHStreamIndex) {
        return (user_SIGH_States[user].userLiquiditySIGHStreamIndex , user_SIGH_States[user].userBorrowingSIGHStreamIndex) ;
    }    

    function getSIGHStreamsRedirectedBalances(address user) external view returns (uint liquiditySIGHStreamRedirectedBalance, uint borrowingSIGHStreamRedirectedBalance ) {
        return (user_SIGH_States[user].userLiquiditySIGHStreamRedirectedBalance , user_SIGH_States[user].userBorrowingSIGHStreamRedirectedBalance);
    }    


// ###### SAFE MATH ######

    function sub_(Double memory a, Double memory b) pure internal returns (Double memory) {
        require(b.mantissa <= a.mantissa, "SIGH Stream: Double Mantissa Subtraction underflow, amount to be subtracted greater than the amount from which it needs to be subtracted");
        uint result = a.mantissa - b.mantissa;
        return Double({mantissa: result});
    }


    function mul_(uint a, Double memory b) pure internal returns (uint) {
        if (a == 0 || b.mantissa == 0) {
            return 0;
        }
        uint c = a * b.mantissa;
        require( (c / a) == b.mantissa, "SIGH Stream: Multiplication (uint * Double) let to overflow");
        uint doubleScale = 1e36;
        return (c / doubleScale);
    }
    
}