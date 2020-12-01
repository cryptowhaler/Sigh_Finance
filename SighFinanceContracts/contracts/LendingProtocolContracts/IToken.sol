pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

import "../Configuration/IGlobalAddressesProvider.sol";
import "./interfaces/ILendingPool.sol";
import "./interfaces/ILendingPoolDataProvider.sol";
import "./interfaces/ILendingPoolCore.sol";
import "../SIGHFinanceContracts/Interfaces/ISighDistributionHandler.sol";

import "./libraries/WadRayMath.sol";

/**
 * @title Aave ERC20 Itokens (modified by SIGH Finance)
 *
 * @dev Implementation of the interest bearing token for the protocol.
 * @author Aave, SIGH Finance (modified by SIGH Finance)
 */
contract IToken is ERC20, ERC20Detailed {

    using WadRayMath for uint256;
    uint private sighInitialIndex = 1e36;        // INDEX (SIGH RELATED)

    struct Double {
        uint mantissa;
    }

    struct Exp {
        uint mantissa;
    }

    uint256 public constant UINT_MAX_VALUE = uint256(-1);

    address public underlyingInstrumentAddress;

    IGlobalAddressesProvider private addressesProvider;     // Only used in Constructor()
    ILendingPoolCore private core;
    ILendingPool private pool;
    ILendingPoolDataProvider private dataProvider;
    ISighDistributionHandler public sighDistributionHandlerContract; // SIGH DISTRIBUTION HANDLER - ADDED BY SIGH FINANCE
    
    mapping (address => uint256) private userIndexes;                       // index values. Taken from core lending pool contract
    mapping (address => address) private interestRedirectionAddresses;      // Address to which the interest stream is being redirected
    mapping (address => uint256) private redirectedBalances;
    mapping (address => address) public interestRedirectionAllowances;     // Address allowed to perform interest redirection by the user
    
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

    mapping (address => uint256) private userLiquiditySIGHStreamRedirectedBalance;               // SUM(Balance of Accounts from which Liquidity $SIGH Streams have been re-directed to this account)
    mapping (address => uint256) private userBorrowingSIGHStreamRedirectedBalance;               // SUM(Balance of Accounts from which Borrowing $SIGH Streams have been re-directed to this account)

    mapping (address => uint256) private userLiquiditySIGHStreamIndex;               // SupplierIndex - ADDED BY SIGH FINANCE
    mapping (address => uint256) private userBorrowingSIGHStreamIndex;               // BorrowerIndex - ADDED BY SIGH FINANCE

    mapping (address => address) private userLiquiditySIGHStreamRedirectionAddress;      // Redirection Address - ADDED BY SIGH FINANCE
    mapping (address => address) private userBorrowingSIGHStreamRedirectionAddress;      // Redirection Address - ADDED BY SIGH FINANCE

    mapping (address => address) private userLiquiditySIGHStreamRedirectionAllowance;    // Allowance - ADDED BY SIGH FINANCE
    mapping (address => address) private userBorrowingSIGHStreamRedirectionAllowance;    // Allowance - ADDED BY SIGH FINANCE


// ########################
// ######  EVENTS #########
// ########################

    /**
    * @dev emitted after the redeem action
    * @param _from the address performing the redeem
    * @param _value the amount to be redeemed
    * @param _fromBalanceIncrease the cumulated balance since the last update of the user
    * @param _fromIndex the last index of the user
    **/
    event Redeem(address indexed _from,uint256 _value, uint256 _fromBalanceIncrease, uint256 _fromIndex);

    /**
    * @dev emitted after the mint action
    * @param _from the address performing the mint
    * @param _value the amount to be minted
    * @param _fromBalanceIncrease the cumulated balance since the last update of the user
    * @param _fromIndex the last index of the user
    **/
    event MintOnDeposit(address indexed _from, uint256 _value, uint256 _fromBalanceIncrease, uint256 _fromIndex);

    /**
    * @dev emitted during the liquidation action, when the liquidator reclaims the underlying asset
    * @param _from the address from which the tokens are being burned
    * @param _value the amount to be burned
    * @param _fromBalanceIncrease the cumulated balance since the last update of the user
    * @param _fromIndex the last index of the user
    **/
    event BurnOnLiquidation(address indexed _from, uint256 _value, uint256 _fromBalanceIncrease, uint256 _fromIndex);

    /**
    * @dev emitted during the transfer action
    * @param _from the address from which the tokens are being transferred
    * @param _to the adress of the destination
    * @param _value the amount to be minted
    * @param _fromBalanceIncrease the cumulated balance since the last update of the user
    * @param _toBalanceIncrease the cumulated balance since the last update of the destination
    * @param _fromIndex the last index of the user
    * @param _toIndex the last index of the liquidator
    **/
    event BalanceTransfer( address indexed _from, address indexed _to, uint256 _value, uint256 _fromBalanceIncrease, uint256 _toBalanceIncrease, uint256 _fromIndex, uint256 _toIndex );


    // INTEREST STREAMS RELATED EVENTS

    event InterestStreamRedirected( address indexed _from, address indexed _to, uint256 _redirectedBalance, uint256 _fromBalanceIncrease, uint256 _fromIndex);
    event InterestRedirectionAllowanceChanged( address indexed _from, address indexed _to );
    event InterestRedirectedBalanceUpdated( address interestRedirectionAddress, uint balanceToAdd, uint balanceToRemove, totalRedirectedBalanceForInterest );

    // $SIGH STREAMS RELATED EVENTS

    // LIQUIDITY $SIGH STREAM
    event LiquiditySIGHStreamRedirectionAllowanceChanged( address user, address allowedAccount );
    event LiquiditySIGHStreamStreamRedirected( address fromAccount, address toAccount, uint redirectedBalance );
    event LiquiditySIGHStreamRedirectedBalanceUpdated( address redirectionAddress,uint _balanceToAdd,uint _balanceToRemove,uint totalRedirectedBalanceForLiquiditySIGHStream );

    // BORROWING $SIGH STREAM
    event BorrowingSIGHStreamRedirectionAllowanceChanged( address user, address allowedAccount );
    event BorrowingSIGHStreamStreamRedirected( address fromAccount, address toAccount, uint redirectedBalance );
    event BorrowingSIGHStreamRedirectedBalanceUpdated( address redirectionAddress,uint _balanceToAdd,uint _balanceToRemove,uint totalRedirectedBalanceForBorrowingSIGHStream );

    event SighAccured(address underlyingInstrumentAddress, address user, bool isLiquidityStream, uint recentSIGHAccured  , uint AccuredSighBalance );


// ###########################
// ######  MODIFIERS #########
// ###########################

    modifier onlyLendingPool {
        require( msg.sender == address(pool), "The caller of this function must be the lending pool");
        _;
    }

    modifier onlyLendingPoolCore {
        require( msg.sender == address(core), "The caller of this function must be the lending pool Core");
        _;
    }

    modifier whenTransferAllowed(address _from, uint256 _amount) {
        require(isTransferAllowed(_from, _amount), "Transfer cannot be allowed.");
        _;
    }

    /**
     * @dev Used to validate transfers before actually executing them.
     * @param _user address of the user to check
     * @param _amount the amount to check
     * @return true if the _user can transfer _amount, false otherwise
     **/
    function isTransferAllowed(address _user, uint256 _amount) public view returns (bool) {
        return dataProvider.balanceDecreaseAllowed(underlyingInstrumentAddress, _user, _amount);
    }

// ################################################################################################################################################
// ######  CONSTRUCTOR ############################################################################################################################
// ######  1. Sets the underlyingInstrumentAddress, name, symbol, decimals.              ###############################################################
// ######  2. The GlobalAddressesProvider's address is used to get the LendingPoolCore #######################################################
// ######     contract address, LendingPool contract address, and the LendingPoolDataProvider contract address and set them.    ###################
// ################################################################################################################################################

   constructor( address _addressesProvider,    address _underlyingAsset, uint8 _underlyingAssetDecimals, string memory _name, string memory _symbol) public ERC20Detailed(_name, _symbol, _underlyingAssetDecimals) {
        addressesProvider = IGlobalAddressesProvider(_addressesProvider);
        core = ILendingPoolCore(addressesProvider.getLendingPoolCore());
        pool = ILendingPool(addressesProvider.getLendingPool());
        dataProvider = ILendingPoolDataProvider(addressesProvider.getLendingPoolDataProvider());
        sighDistributionHandlerContract = ISighDistributionHandler(addressesProvider.getSIGHMechanismHandler());
        underlyingInstrumentAddress = _underlyingAsset;
    }

// ###############################################################################################
// ######  MINT NEW ITOKENS ON DEPOST ############################################################
// ######  1. Can only be called by lendingPool Contract (called after amount is transferred) $$$$
// ######  2. If interest is being redirected, it adds the amount which is #######################
// ######     deposited to the increase in balance (through interest) and ########################
// ######     updates the redirected balance. ####################################################
// ######  3. It then mints new ITokens  #########################################################
// ###############################################################################################

    /**
     * @dev mints token in the event of users depositing the underlying asset into the lending pool. Only lending pools can call this function
     * @param _account the address receiving the minted tokens
     * @param _amount the amount of tokens to mint
     */
    function mintOnDeposit(address _account, uint256 _amount) external onlyLendingPool {
        (, uint256 currentCompoundedBalance, uint256 balanceIncrease, uint256 index) = cumulateBalanceInternal(_account);       //calculates new interest generated and mints the ITokens (based on interest)
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_account,balanceIncrease,0);
        accure_SIGH_For_LiquidityStream(_account,currentCompoundedBalance);                                                          // ADDED BY SIGH FINANCE (ACCURS SIGH FOR DEPOSITOR)

         //if the user is redirecting his interest / Liquidity $SIGH Stream towards someone else, we update the redirected balance 
         // of the redirection addresses by adding 1. Accrued interest, 2. Amount Deposited
        updateRedirectedBalanceOfRedirectionAddressesInternal(_account, balanceIncrease.add(_amount), 0);
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_account,_amount,0);
        _mint(_account, _amount);       //mint an equivalent amount of tokens to cover the new deposit

        emit MintOnDeposit(_account, _amount, balanceIncrease, index);
    }

// ###########################################################################################################################
// ######  REDEEM UNDERLYING TOKENS ##########################################################################################
// ######  1. If interest is being redirected, it adds the increase in balance (through interest) and ########################
// ######     subtracts the amount to be redeemed to the redirected balance. #################################################
// ######  2. It then burns the ITokens equal to amount to be redeemed  ###################################################### 
// ######  3. It then calls redeemUnderlying function of lendingPool Contract to transfer the underlying amount  #############
// #########################################################

    /**
    * @dev redeems Itoken for the underlying asset
    * @param _amount the amount being redeemed
    **/
    function redeem(uint256 _amount) external {

        require(_amount > 0, "Amount to redeem needs to be > 0");
        
        (, uint256 currentBalance, uint256 balanceIncrease, uint256 index) = cumulateBalanceInternal(msg.sender);   //cumulates the balance of the user
        uint256 amountToRedeem = _amount;

        //if amount is equal to uint(-1), the user wants to redeem everything
        if(_amount == UINT_MAX_VALUE){
            amountToRedeem = currentBalance;
        }

        require(amountToRedeem <= currentBalance, "User cannot redeem more than the available balance");
        require(isTransferAllowed(msg.sender, amountToRedeem), "Transfer cannot be allowed.");       //check that the user is allowed to redeem the amount

        pool.redeemUnderlying( underlyingInstrumentAddress, msg.sender, amountToRedeem, currentBalance.sub(amountToRedeem) );   // executes redeem of the underlying asset
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(msg.sender, balanceIncrease, 0);
        accure_SIGH_For_LiquidityStream(msg.sender,currentBalance );                                                          // ADDED BY SIGH FINANCE (ACCURS SIGH FOR REDEEMER)

        //if the user is redirecting his interest towards someone else,
        //we update the redirected balance of the redirection address by adding the accrued interest, and removing the amount to redeem
        updateRedirectedBalanceOfRedirectionAddressesInternal(msg.sender, balanceIncrease, amountToRedeem);
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(msg.sender, 0, amountToRedeem);

        _burn(msg.sender, amountToRedeem);      // burns tokens equivalent to the amount requested

        bool userIndexReset = false;
        
        if(currentBalance.sub(amountToRedeem) == 0){        //reset the user data if the remaining balance is 0
            userIndexReset = resetDataOnZeroBalanceInternal(msg.sender);
        }

        emit Redeem(msg.sender, amountToRedeem, balanceIncrease, userIndexReset ? 0 : index);
    }

// #########################################################################################################
// ######  BURN ITOKENS WHEN LIQUIDATION OCCURS ############################################################
// ######  1. Can only be called by lendingPool Contract  ##################################################
// ######  1. If interest is being redirected, it adds the increase in balance (through interest) and  #####
// ######     subtracts the amount to be burnt to the redirected balance. ##################################
// ######  2. It then burns the ITokens equal to amount to be burnt   ######################################
// #########################################################################################################

    /**
     * @dev burns token in the event of a borrow being liquidated, in case the liquidators reclaims the underlying asset
     * Transfer of the liquidated asset is executed by the lending pool contract.
     * only lending pools can call this function
     * @param _account the address from which burn the Itokens
     * @param _value the amount to burn
     **/
    function burnOnLiquidation(address _account, uint256 _value) external onlyLendingPool {
        (,uint256 accountBalance,uint256 balanceIncrease,uint256 index) = cumulateBalanceInternal(_account);    //cumulates the balance of the user being liquidated
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_account, balanceIncrease, 0);
        accure_SIGH_For_LiquidityStream(_account,accountBalance);                                                          // ADDED BY SIGH FINANCE (ACCURS SIGH FOR REDEEMER)

        //adds the accrued interest and substracts the burned amount to the redirected balance
        updateRedirectedBalanceOfRedirectionAddressesInternal(_account, balanceIncrease, _value);
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_account, 0, _value);
        _burn(_account, _value);        //burns the requested amount of tokens

        bool userIndexReset = false;
        if(accountBalance.sub(_value) == 0){        //reset the user data if the remaining balance is 0
            userIndexReset = resetDataOnZeroBalanceInternal(_account);
        }

        emit BurnOnLiquidation(_account, _value, balanceIncrease, userIndexReset ? 0 : index);
    }

// ##################################################################################################################################################################
// ######  TRANSFER FUNCTIONALITY ###################################################################################################################################
// ######  1. transferOnLiquidation() : Can only be called by lendingPool Contract. Called to transfer Collateral when liquidating  #################################
// ######  2. _transfer() : Over-rides the internal _transfer() called by the ERC20's transfer() & transferFrom() ###################################################
// ######  3. executeTransferInternal() --> It actually executes the transfer. Accures interest and updates redirected balances before executing transfer.  #########
// ##################################################################################################################################################################

    /**
     * @dev transfers tokens in the event of a borrow being liquidated, in case the liquidators reclaims the Itoken  only lending pools can call this function
     * @param _from the address from which transfer the Itokens
     * @param _to the destination address
     * @param _value the amount to transfer
     **/
    function transferOnLiquidation(address _from, address _to, uint256 _value) external onlyLendingPool {
        executeTransferInternal(_from, _to, _value);
    }

    /**
     * @notice ERC20 implementation internal function backing transfer() and transferFrom()
     * @dev validates the transfer before allowing it. NOTE: This is not standard ERC20 behavior
     **/
    function _transfer(address _from, address _to, uint256 _amount) internal whenTransferAllowed(_from, _amount) {
        executeTransferInternal(_from, _to, _amount);
    }

    /**
    * @dev executes the transfer of Itokens, invoked by both _transfer() and transferOnLiquidation()
    * @param _from the address from which transfer the Itokens
    * @param _to the destination address
    * @param _value the amount to transfer
    **/
    function executeTransferInternal( address _from, address _to,  uint256 _value) internal {
        require(_value > 0, "Transferred amount needs to be greater than zero");
        (, uint256 fromBalance, uint256 fromBalanceIncrease, uint256 fromIndex ) = cumulateBalanceInternal(_from);   //cumulate the balance of the sender
        (, uint256 toBalance, uint256 toBalanceIncrease, uint256 toIndex ) = cumulateBalanceInternal(_to);       //cumulate the balance of the receiver

        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_from, fromBalanceIncrease, 0);
        accure_SIGH_For_LiquidityStream(_from,fromBalance);                                                          // ADDED BY SIGH FINANCE (ACCURS SIGH FOR From Account)
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_to, toBalanceIncrease, 0);
        accure_SIGH_For_LiquidityStream(_to,toBalance);                                                            // ADDED BY SIGH FINANCE (ACCURS SIGH FOR To Account)
        
        //if the sender is redirecting his interest towards someone else, adds to the redirected balance the accrued interest and removes the amount being transferred
        updateRedirectedBalanceOfRedirectionAddressesInternal(_from, fromBalanceIncrease, _value);
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_from, 0, _value);

        //if the receiver is redirecting his $SIGH Liquidity Stream towards someone else, adds to the redirected balance the accrued interest and the amount being transferred
        updateRedirectedBalanceOfRedirectionAddressesInternal(_to, toBalanceIncrease.add(_value), 0);
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_to, _value, 0);

        super._transfer(_from, _to, _value);        //performs the transfer

        bool fromIndexReset = false;
        
        if(fromBalance.sub(_value) == 0){           //reset the user data if the remaining balance is 0
            fromIndexReset = resetDataOnZeroBalanceInternal(_from);
        }

        emit BalanceTransfer(  _from, _to, _value, fromBalanceIncrease, toBalanceIncrease, fromIndexReset ? 0 : fromIndex, toIndex);
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
// ######  REDIRECTING INTEREST STREAMS: FUNCTIONALITY #######################################################################################################
// ######  1. redirectInterestStream() : User himself redirects his interest stream.  ########################################################################
// ######  2. allowInterestRedirectionTo() : User gives the permission of redirecting the interest stream to another account  ################################ 
// ######  2. redirectInterestStreamOf() : When account given the permission to redirect interest stream (by the user) redirects the stream.  ################
// ######  3. redirectInterestStreamInternal() --> Executes the redirecting of the interest stream  ##########################################################
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
    * @dev redirects the interest generated to a target address. When the interest is redirected, the user balance is added to the recepient redirected balance.
    * @param _to the address to which the interest will be redirected
    **/
    function redirectInterestStream(address _to) external {
        redirectInterestStreamInternal(msg.sender, _to);
    }

    /**
    * @dev gives allowance to an address to execute the interest redirection on behalf of the caller.
    * @param _to the address to which the interest will be redirected. Pass address(0) to reset the allowance.
    **/
    function allowInterestRedirectionTo(address _to) external {
        require(_to != msg.sender, "User cannot give allowance to himself");
        interestRedirectionAllowances[msg.sender] = _to;
        emit InterestRedirectionAllowanceChanged( msg.sender, _to);
    }

    /**
    * @dev redirects the interest generated by _from to a target address.
    * The caller needs to have allowance on the interest redirection to be able to execute the function.
    * @param _from the address of the user whom interest is being redirected
    * @param _to the address to which the interest will be redirected
    **/
    function redirectInterestStreamOf(address _from, address _to) external {
        require( msg.sender == interestRedirectionAllowances[_from], "Caller is not allowed to redirect the interest of the user");
        redirectInterestStreamInternal(_from,_to);
    }


    /**
    * @dev executes the redirection of the interest from one address to another.
    * immediately after redirection, the destination address will start to accrue interest.
    * @param _from the address from which transfer the Itokens
    * @param _to the destination address
    **/
    function redirectInterestStreamInternal( address _from, address _to) internal {

        address currentRedirectionAddress = interestRedirectionAddresses[_from];
        require(_to != currentRedirectionAddress, "Interest is already redirected to the user");

        (uint256 previousPrincipalBalance, uint256 fromBalance, uint256 balanceIncrease, uint256 fromIndex) = cumulateBalanceInternal(_from);   //accumulates the accrued interest to the principal
        require(fromBalance > 0, "Interest stream can only be redirected if there is a valid balance");

        //if the user is already redirecting the interest to someone, before changing the redirection address we substract the redirected balance of the previous recipient
        if(currentRedirectionAddress != address(0)){
            updateRedirectedBalanceOfRedirectionAddressesInternal(_from,0, previousPrincipalBalance);
        }

        //if the user is redirecting the interest back to himself, we simply set to 0 the interest redirection address
        if(_to == _from) {
            interestRedirectionAddresses[_from] = address(0);
            emit InterestStreamRedirected( _from, address(0), fromBalance, balanceIncrease,fromIndex);
            return;
        }
        
        interestRedirectionAddresses[_from] = _to;      // set the redirection address to the new recipient
        updateRedirectedBalanceOfRedirectionAddressesInternal(_from,fromBalance,0);   //adds the user balance to the redirected balance of the destination

        emit InterestStreamRedirected( _from, _to, fromBalance, balanceIncrease, fromIndex);
    }

// ##################################################################################################################################
// ### cumulateBalanceInternal( user ) --> returns 4 values and mints the balanceIncrease amount  ###################################
// ###  1. previousPrincipalBalance : IToken balance of the user  ###################################################################
// ###  2. newPrincipalBalance : new balance after adding balanceIncrease  ##########################################################
// ###  3. balanceIncrease : increase in balance based on interest from both principal and redirected interest streams  #############
// ###  4. index : updated user Index (gets the value from the core lending pool contract)  #########################################
// ##################################################################################################################################

    /**
    * @dev accumulates the accrued interest of the user to the principal balance
    * @param _user the address of the user for which the interest is being accumulated
    * @return the previous principal balance, the new principal balance, the balance increase
    * and the new user index
    **/
    function cumulateBalanceInternal(address _user) internal returns(uint256, uint256, uint256, uint256) {

        uint256 previousPrincipalBalance = super.balanceOf(_user);                                         // Current IToken Balance
        uint256 balanceIncrease = balanceOf(_user).sub(previousPrincipalBalance);                          //calculate the accrued interest since the last accumulation
        if (balanceIncrease > 0) {
            _mint(_user, balanceIncrease);                                                                     //mints an amount of tokens equivalent to the amount accumulated
        }
        uint256 index = userIndexes[_user] = core.getInstrumentNormalizedIncome(underlyingInstrumentAddress);      //updates the user index
        return ( previousPrincipalBalance, previousPrincipalBalance.add(balanceIncrease), balanceIncrease, index);
    }


// #########################################################################################################
// ### updateRedirectedBalanceOfRedirectionAddressesInternal( user ) --> updates the redirected balance of the user
// #########################################################################################################

    /**
    * @dev Updates the Interest / Liquidity $SIGH Stream Redirected Balances of the user. If the user is not redirecting anything, nothing is executed.
    * @param _user the address of the user for which the interest is being accumulated
    * @param _balanceToAdd the amount to add to the redirected balance
    * @param _balanceToRemove the amount to remove from the redirected balance
    **/
    function updateRedirectedBalanceOfRedirectionAddressesInternal( address _user, uint256 _balanceToAdd, uint256 _balanceToRemove ) internal {

        address redirectionAddress = interestRedirectionAddresses[_user];
        //if there isn't any redirection, nothing to be done
        if(redirectionAddress == address(0)){
            return;
        }

        //compound balances of the redirected address
        (,,uint256 balanceIncrease, uint256 index) = cumulateBalanceInternal(redirectionAddress);

        //updating the redirected balance
        redirectedBalances[redirectionAddress] = redirectedBalances[redirectionAddress].add(_balanceToAdd).sub(_balanceToRemove);

        //if the interest of redirectionAddress is also being redirected, we need to update
        //the redirected balance of the redirection target by adding the balance increase
        address targetOfRedirectionAddress = interestRedirectionAddresses[redirectionAddress];

        if(targetOfRedirectionAddress != address(0)){
            redirectedBalances[targetOfRedirectionAddress] = redirectedBalances[targetOfRedirectionAddress].add(balanceIncrease);
        }
        emit RedirectedBalanceUpdated( redirectionAddress, balanceIncrease, index, _balanceToAdd, _balanceToRemove );
    }



    /**
    * @dev calculate the interest accrued by _user on a specific balance
    * @param _user the address of the user for which the interest is being accumulated
    * @param _balance the balance on which the interest is calculated
    * @return the interest rate accrued
    **/
    function calculateCumulatedBalanceInternal( address _user,  uint256 _balance) internal view returns (uint256) {
        return _balance.wadToRay().rayMul(core.getInstrumentNormalizedIncome(underlyingInstrumentAddress)).rayDiv(userIndexes[_user]).rayToWad();
    }


// #################################################
// #### Called when the user balance becomes 0  ####
// #################################################
    /**
    * @dev function to reset the interest stream redirection and the user index, if the user has no balance left.
    * @param _user the address of the user
    * @return true if the user index has also been reset, false otherwise. useful to emit the proper user index value
    **/
    function resetDataOnZeroBalanceInternal(address _user) internal returns(bool) {
        
        interestRedirectionAddresses[_user] = address(0);       //if the user has 0 principal balance, the interest stream redirection gets reset
        emit InterestStreamRedirected(_user, address(0),0,0,0);     //emits a InterestStreamRedirected event to notify that the redirection has been reset

        //if the redirected balance is also 0, we clear up the user index
        if(redirectedBalances[_user] == 0){
            userIndexes[_user] = 0;
            return true;
        }
        else{
            return false;
        }
    }

// ############################################################
// #### Getting the State of the Contract (View Functions) ####
// ############################################################

    /**
    * @dev calculates the balance of the user, which is the principal balance + interest generated by the principal balance + interest generated by the redirected balance
    * @param _user the user for which the balance is being calculated
    * @return the total balance of the user
    **/
    function balanceOf(address _user) public view returns(uint256) {

        uint256 currentPrincipalBalance = super.balanceOf(_user);       //current principal balance of the user
        uint256 redirectedBalance = redirectedBalances[_user];          //balance redirected by other users to _user for interest rate accrual

        if(currentPrincipalBalance == 0 && redirectedBalance == 0) {
            return 0;
        }

        // current balance = prev balance + interest on (prev balance + redirected balance)
        if(interestRedirectionAddresses[_user] == address(0)){
            return calculateCumulatedBalanceInternal(_user, currentPrincipalBalance.add(redirectedBalance) ).sub(redirectedBalance);
        }
        // current balance = prev balance + interest on (redirected balance)
        else { 
            return currentPrincipalBalance.add( calculateCumulatedBalanceInternal( _user, redirectedBalance ).sub(redirectedBalance) );
        }
    }

    /**
    * @dev returns the principal balance of the user. The principal balance is the last updated stored balance, which does not consider the perpetually accruing interest.
    * @param _user the address of the user
    * @return the principal balance of the user
    **/
    function principalBalanceOf(address _user) external view returns(uint256) {
        return super.balanceOf(_user);
    }
    
    /**
    * @dev calculates the total supply of the specific Itoken. since the balance of every single user increases over time, the total supply does that too.
    * @return the current total supply
    **/
    function totalSupply() public view returns(uint256) {
        uint256 currentSupplyPrincipal = super.totalSupply();
        if(currentSupplyPrincipal == 0){
            return 0;
        }
        return currentSupplyPrincipal.wadToRay().rayMul( core.getInstrumentNormalizedIncome(underlyingInstrumentAddress) ).rayToWad();
    }

    /**
    * @dev returns the last index of the user, used to calculate the balance of the user
    * @param _user address of the user
    * @return the last user index
    **/
    function getUserIndex(address _user) external view returns(uint256) {
        return userIndexes[_user];
    }

    /**
    * @dev returns the address to which the interest is redirected
    * @param _user address of the user
    * @return 0 if there is no redirection, an address otherwise
    **/
    function getInterestRedirectionAddress(address _user) external view returns(address) {
        return interestRedirectionAddresses[_user];
    }

    /**
    * @dev returns the redirected balance of the user. The redirected balance is the balance redirected by other accounts to the user, that is accrueing interest for him.
    * @param _user address of the user
    * @return the total redirected balance
    **/
    function getRedirectedBalance(address _user) external view returns(uint256) {
        return redirectedBalances[_user];
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
    function redirectLiquiditySIGHStream(address _to) external {
        redirectLiquiditySIGHStreamInternal(msg.sender, _to);
    }

    /**
    * @dev gives allowance to an address to execute the Liquidity $SIGH Stream redirection on behalf of the caller.
    * @param _to the address to which the Liquidity $SIGH Stream redirection permission is given. Pass address(0) to reset the allowance.
    **/
    function allowLiquiditySIGHRedirectionTo(address _to) external {
        require(_to != msg.sender, "User cannot give allowance to himself");
        userLiquiditySIGHStreamRedirectionAllowance[msg.sender] = _to;
        emit LiquiditySIGHStreamRedirectionAllowanceChanged( msg.sender, _to);
    }

    /**
    * @dev redirects the Liquidity $SIGH Stream generated by _from to a target address.
    * The caller needs to have allowance on the Liquidity $SIGH Stream redirection to be able to execute the function.
    * @param _from the address of the user whom Liquidity $SIGH Stream is being redirected
    * @param _to the address to which the Liquidity $SIGH Stream will be redirected
    **/
    function redirectLiquiditySIGHStreamOf(address _from, address _to) external {
        require( msg.sender == userLiquiditySIGHStreamRedirectionAllowance[_from], "Caller is not allowed to redirect the Liquidity $SIGH Stream of the user");
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
        address currentRedirectionAddress = userLiquiditySIGHStreamRedirectionAddress[_from];
        require(_to != currentRedirectionAddress, "Liquidity $SIGH Stream is already redirected to the provided account");

        // check 2
        (,uint256 currentBalance , uint256 balanceIncrease, uint256 index) = cumulateBalanceInternal(_from);
        require( balanceOf(_from) > 0, "Liquidity $SIGH Stream stream can only be redirected if there is a valid Liquidity Balance accuring $SIGH for the user");
        

        // if the user is already redirecting the Liquidity $SIGH Stream to someone, before changing the redirection address 
        // 1. Add the interest accured by From Account to the redirected address
        // 1. We accure $SIGH for that address
        // 2. We substract the redirected balance of the from account from that address
        if (currentRedirectionAddress != address(0)) { 
             updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_from, balanceIncrease, 0 );    
            (,uint256 redirectionAddressAccountBalance,uint256 redirectionAddressbalanceIncrease,uint256 index) = cumulateBalanceInternal(redirectionAddress);    //cumulates the balance of the user being liquidated
            accure_SIGH_For_LiquidityStream(currentRedirectionAddress, redirectionAddressAccountBalance );
            updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_from,0, currentBalance );
        }

        //   if the user is redirecting the Liquidity $SIGH Stream back to himself, we simply set to 0 the Liquidity $SIGH Stream redirection address
        if(_to == _from) {               
            userLiquiditySIGHStreamRedirectionAddress[_from] = address(0);
            emit LiquiditySIGHStreamStreamRedirected( _from, address(0), currentBalance );
            return;
        }

        // Redirecting Liquidity $SIGH Stream and adding the user balance to the redirected balance of the redirection address
        userLiquiditySIGHStreamRedirectionAddress[_from] = _to;     
        updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal(_from,currentBalance,0);                               
        emit LiquiditySIGHStreamStreamRedirected( _from, _to, currentBalance );
    }

// ###########################################################################################################################################################
// ######  ____  Liquidity $SIGH STREAMS : FUNCTIONALITY ____     ##############################################################################################################
// ######  1. updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal() [INTERNAL] : Addition / Subtraction from the redirected balance of the address to which the user's Liquidity $SIGH stream is redirected      #################################################################
// ######  2. accure_SIGH_For_LiquidityStream() [INTERNAL] : Accure SIGH from the Liquidity $SIGH Streams     ##########################
// ###########################################################################################################################################################

    /**
    * @dev Updates the Liquidity $SIGH Stream Redirected Balances of the user. If the user is not redirecting anything, nothing is executed.
    * @param _user the address of the user for which the some change in the Liquidity is happening
    * @param _balanceToAdd the amount to add to the redirected balance
    * @param _balanceToRemove the amount to remove from the redirected balance
    **/
    function updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddressesInternal( address _user, uint256 _balanceToAdd, uint256 _balanceToRemove ) internal {
        address redirectionAddress = userLiquiditySIGHStreamRedirectionAddress[_user];
        if(redirectionAddress == address(0)){           //if there isn't any redirection, nothing to be done
            return;
        }
        //updating the redirected balance
        userLiquiditySIGHStreamRedirectedBalance[redirectionAddress] = userLiquiditySIGHStreamRedirectedBalance[redirectionAddress].add(_balanceToAdd).sub(_balanceToRemove);
        emit LiquiditySIGHStreamRedirectedBalanceUpdated( redirectionAddress, _balanceToAdd, _balanceToRemove, userLiquiditySIGHStreamRedirectedBalance[redirectionAddress] );
    }

    // If the USER's liquidity $SIGH Stream is redirected, we accure the SIGH for the redirected Address and the Supplier
    // SIGH Accured by Supplier = { SUM(Redirected balances) + User's Balance (Only if it is also not redirected) } * {Delta Index}
    function accure_SIGH_For_LiquidityStream( address supplier, uint256 currentCompoundedBalance ) internal  {
        if (userLiquiditySIGHStreamRedirectionAddress[supplier] == address(0)) {
            accure_SIGH_For_LiquidityStreamInternal(supplier,currentCompoundedBalance);        
        }
        else {
            address redirectionAddress = userLiquiditySIGHStreamRedirectionAddress[supplier];
            if (userLiquiditySIGHStreamRedirectionAddress[redirectionAddress] == 0 ) {
                (,uint256 accountBalance,uint256 balanceIncrease,uint256 index) = cumulateBalanceInternal(redirectionAddress);    //cumulates the balance of the user being liquidated
                accure_SIGH_For_LiquidityStreamInternal(redirectionAddress,accountBalance);
            }
            else {
                accure_SIGH_For_LiquidityStreamInternal(redirectionAddress,0);
            }
            accure_SIGH_For_LiquidityStreamInternal(supplier,0);
        }
    }


    function accure_SIGH_For_LiquidityStreamInternal( address user, uint256 currentCompoundedBalance ) internal  {
        uint supplyIndex = sighDistributionHandlerContract.getInstrumentSupplyIndex( underlyingInstrumentAddress );      // Instrument index retreived from the SIGHDistributionHandler Contract
        require(supplyIndex > 0, "SIGH Distribution Handler returned invalid supply Index for the instrument");

        // Total Balance = SUM(Redirected balances) + User's Balance (Only if it is not redirected)
        uint totalBalanceForAccuringSIGH = userLiquiditySIGHStreamRedirectedBalance[user].add(currentCompoundedBalance);

        Double memory userIndex = Double({mantissa: userLiquiditySIGHStreamIndex[user]}) ;      // Stored User Index
        Double memory instrumentIndex = Double({mantissa: supplyIndex});                        // Instrument Index
        userLiquiditySIGHStreamIndex[user] = instrumentIndex.mantissa;                                   // User Index is UPDATED

        if (userIndex.mantissa == 0 && instrumentIndex.mantissa > 0) {
            userIndex.mantissa = instrumentIndex.mantissa; // sighInitialIndex;
        }

        Double memory deltaIndex = sub_(instrumentIndex, userIndex);                                // , 'Distribute Supplier SIGH : supplyIndex Subtraction Underflow'
        uint supplierSighDelta = 0;

        if ( deltaIndex.mantissa > 0 && totalBalanceForAccuringSIGH > 0 ) {
            supplierSighDelta = mul_(totalBalanceForAccuringSIGH, deltaIndex);                                      // Supplier Delta = Balance * Double(DeltaIndex)/DoubleScale
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
    function redirectBorrowingSIGHStream(address _to) external {
        redirectBorrowingSIGHStreamInternal(msg.sender, _to);
    }

    /**
    * @dev gives allowance to an address to execute the Borrowing $SIGH Stream redirection on behalf of the caller.
    * @param _to the address to which the Borrowing $SIGH Stream redirection permission is given. Pass address(0) to reset the allowance.
    **/
    function allowBorrowingSIGHRedirectionTo(address _to) external {
        require(_to != msg.sender, "User cannot give allowance to himself");
        userBorrowingSIGHStreamRedirectionAllowance[msg.sender] = _to;
        emit BorrowingSIGHStreamRedirectionAllowanceChanged( msg.sender, _to);
    }

    /**
    * @dev redirects the Borrowing $SIGH Stream generated by _from to a target address.
    * The caller needs to have allowance on the Borrowing $SIGH Stream redirection to be able to execute the function.
    * @param _from the address of the user whom Borrowing $SIGH Stream is being redirected
    * @param _to the address to which the Borrowing $SIGH Stream will be redirected
    **/
    function redirectBorrowingSIGHStreamOf(address _from, address _to) external {
        require( msg.sender == userBorrowingSIGHStreamRedirectionAllowance[_from], "Caller is not allowed to redirect the Borrowing $SIGH Stream of the user");
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
        address currentRedirectionAddress = userBorrowingSIGHStreamRedirectionAddress[_from];
        require(_to != currentRedirectionAddress, "Borrowing $SIGH Stream is already redirected to the provided account");

        // check 2
        ( uint principalBorrowBalance , uint compoundedBorrowBalance , uint balanceIncrease) = core.getUserBorrowBalances(underlyingInstrumentAddress, _from);                                 // Getting Borrow Balance of the User from LendingPool Core 
        require( compoundedBorrowBalance > 0, "Borrowing $SIGH Stream stream can only be redirected if there is a valid Principal Borrowing Balance accuring $SIGH for the user");
        

        // if the user is already redirecting the Borrowing $SIGH Stream to someone, before changing the redirection address 
        // 1. Add the compounded borrow interest by From Account to the redirected address
        // 1. We accure $SIGH for that address
        // 2. We substract the redirected compounded balance of the from account from that address
        if (currentRedirectionAddress != address(0)) { 
             updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddressesInternal(_from, balanceIncrease, 0 );           
            accure_SIGH_For_BorrowingStream( currentRedirectionAddress );
            updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddressesInternal(_from,0, compoundedBorrowBalance );
        }

        //   if the user is redirecting the Borrowing $SIGH Stream back to himself, we simply set to 0 the Borrowing $SIGH Stream redirection address
        if(_to == _from) {               
            userBorrowingSIGHStreamRedirectionAddress[_from] = address(0);
            emit BorrowingSIGHStreamStreamRedirected( _from, address(0), principalBorrowBalance );
            return;
        }

        // Redirecting Borrowing $SIGH Stream and adding the user principal borrow balance to the redirected balance of the redirection address
        userBorrowingSIGHStreamRedirectionAddress[_from] = _to;     
        updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddressesInternal(_from,principalBorrowBalance,0);                               
        emit BorrowingSIGHStreamStreamRedirected( _from, _to, principalBorrowBalance );
    }

// ###########################################################################################################################################################
// ######  ____  Borrowing $SIGH StreamS : FUNCTIONALITY ____     ##############################################################################################################
// ######  1. updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddressesInternal() [INTERNAL] : Addition / Subtraction from the redirected balance of the address to which the user's Borrowing $SIGH Stream is redirected      #################################################################
// ######  2. accure_SIGH_For_BorrowingStream() [INTERNAL] : Accure SIGH from the Borrowing $SIGH Streams     ##########################
// ###########################################################################################################################################################

    /**
    * @dev Updates the Borrowing $SIGH Stream Redirected Balances of the user. If the user is not redirecting anything, nothing is executed.
    * @param _user the address of the user for which the some change in the Liquidity is happening
    * @param _balanceToAdd the amount to add to the redirected balance
    * @param _balanceToRemove the amount to remove from the redirected balance
    **/
    function updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddressesInternal( address _user, uint256 _balanceToAdd, uint256 _balanceToRemove ) internal {
        address redirectionAddress = userBorrowingSIGHStreamRedirectionAddress[_user];
        if(redirectionAddress == address(0)){           //if there isn't any redirection, nothing to be done
            return;
        }
        //updating the redirected balance
        userBorrowingSIGHStreamRedirectedBalance[redirectionAddress] = userBorrowingSIGHStreamRedirectedBalance[redirectionAddress].add(_balanceToAdd).sub(_balanceToRemove);
        emit BorrowingSIGHStreamRedirectedBalanceUpdated( redirectionAddress, _balanceToAdd, _balanceToRemove, userLiquiditySIGHStreamRedirectedBalance[redirectionAddress] );
    }

    // "userBorrowingSIGHStreamIndex" tracks the SIGH Accured per Instrument. user Index tracks the Sigh Accured by the user per Instrument
    // Delta Index = Instrument Index - User Index
    // SIGH Accured by user = { SUM(Redirected balances) + User's Compounded Borrow Balance (Only if it is also not redirected) } * {Delta Index}
    function accure_SIGH_For_BorrowingStream( address user) internal  {
        uint borrowIndex = sighDistributionHandlerContract.getInstrumentBorrowIndex( underlyingInstrumentAddress );      // Instrument index retreived from the SIGHDistributionHandler Contract
        require(borrowIndex > 0, "SIGH Distribution Handler returned invalid borrow Index for the instrument");
        
        // Total Balance = SUM(Redirected balances) + User's Balance (Only if it is not redirected)
        uint totalBalanceForAccuringSIGH = userBorrowingSIGHStreamRedirectedBalance[user];
        if (userBorrowingSIGHStreamRedirectionAddress[user] == address(0)) {
            ( uint principalBorrowBalance , uint compoundedBorrowBalance , uint balanceIncrease) = core.getUserBorrowBalances(underlyingInstrumentAddress, user);          // Getting Borrow Balance of the User from LendingPool Core 
            totalBalanceForAccuringSIGH = totalBalanceForAccuringSIGH.add(compoundedBorrowBalance);
        }

        Double memory userIndex = Double({mantissa: userBorrowingSIGHStreamIndex[user]}) ;      // Stored User Index
        Double memory instrumentIndex = Double({mantissa: borrowIndex});                        // Instrument Index
        userBorrowingSIGHStreamIndex[user] = instrumentIndex.mantissa;                                   // User Index is UPDATED

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

    function claimMySIGH() external {
        claimSighInternal(msg.sender);
    }

    function claimSIGH(address[] calldata holders ) external {        
        for (uint i = 0; i < holders.length; i++) {
            claimSighInternal(holders[i]);
        }
    }

    function claimSighInternal(address user) internal {
        accure_SIGH_For_LiquidityStream(user, balanceOf(user) );
        accure_SIGH_For_BorrowingStream(user);
        if (AccuredSighBalance[user] > 0) {
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
        return (userLiquiditySIGHStreamRedirectionAddress[user], userBorrowingSIGHStreamRedirectionAddress[user]);
    }

    function getSIGHStreamsAllowances(address user) external view returns (address liquiditySIGHStreamRedirectionAllowance,address BorrowingSIGHStreamRedirectionAllowance ) {
        return (userLiquiditySIGHStreamRedirectionAllowance[user], userBorrowingSIGHStreamRedirectionAllowance[user]);
    }    

    function getSIGHStreamsIndexes(address user) external view returns (uint liquiditySIGHStreamIndex, uint borrowingSIGHStreamIndex) {
        return (userLiquiditySIGHStreamIndex[user], userBorrowingSIGHStreamIndex[user]) ;
    }    

    function getSIGHStreamsRedirectedBalances(address user) external view returns (uint liquiditySIGHStreamRedirectedBalance, uint liquiditySIGHStreamRedirectedBalance ) {
        return (userLiquiditySIGHStreamRedirectedBalance[user], userBorrowingSIGHStreamRedirectedBalance[user]);
    }    

// 
// ###### SAFE MATH ######
// 


    function sub_(Double memory a, Double memory b) pure internal returns (Double memory) {
        return Double({mantissa: sub_(a.mantissa, b.mantissa)});
    }

    function sub_(uint a, uint b) pure internal returns (uint) {
        return sub_(a, b, "subtraction underflow");
    }

    function sub_(uint a, uint b, string memory errorMessage) pure internal returns (uint) {
        require(b <= a, errorMessage);
        return a - b;
    }

    function mul_(uint a, Double memory b) pure internal returns (uint) {
        uint doubleScale = 1e36;
        return mul_(a, b.mantissa) / doubleScale;
    }

    function mul_(uint a, uint b) pure internal returns (uint) {
        return mul_(a, b, "multiplication overflow");
    }

    function mul_(uint a, uint b, string memory errorMessage) pure internal returns (uint) {
        if (a == 0 || b == 0) {
            return 0;
        }
        uint c = a * b;
        require(c / a == b, errorMessage);
        return c;
    }

    function div_(uint a, Exp memory b) pure internal returns (uint) {
        uint expScale = 1e18;
        return div_(mul_(a, expScale), b.mantissa);
    }

    function div_(uint a, uint b) pure internal returns (uint) {
        return div_(a, b, "divide by zero");
    }

    function div_(uint a, uint b, string memory errorMessage) pure internal returns (uint) {
        require(b > 0, errorMessage);
        return a / b;
    }

}
