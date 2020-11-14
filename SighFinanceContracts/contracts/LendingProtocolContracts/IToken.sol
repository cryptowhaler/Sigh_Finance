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

    uint public sigh_Transfer_Threshold = 1e18;                         // SIGH Transferred when accured >= 1 SIGH (in ETH)
    mapping (address => uint256) private AccuredSighBalances;           // SIGH Collected - ADDED BY SIGH FINANCE
    mapping (address => uint256) private SupplierIndexes;               // SupplierIndex - ADDED BY SIGH FINANCE
    mapping (address => uint256) private BorrowerIndexes;               // BorrowerIndex - ADDED BY SIGH FINANCE
    mapping (address => address) private sighRedirectionAddresses;      // Redirection Address - ADDED BY SIGH FINANCE
    mapping (address => address) private sighRedirectionAllowances;    // Allowance - ADDED BY SIGH FINANCE


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
    event Redeem( address indexed _from,uint256 _value, uint256 _fromBalanceIncrease, uint256 _fromIndex);

    /**
    * @dev emitted after the mint action
    * @param _from the address performing the mint
    * @param _value the amount to be minted
    * @param _fromBalanceIncrease the cumulated balance since the last update of the user
    * @param _fromIndex the last index of the user
    **/
    event MintOnDeposit( address indexed _from, uint256 _value, uint256 _fromBalanceIncrease, uint256 _fromIndex);

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

    /**
    * @dev emitted when the accumulation of the interest
    * by an user is redirected to another user
    * @param _from the address from which the interest is being redirected
    * @param _to the adress of the destination
    * @param _fromBalanceIncrease the cumulated balance since the last update of the user
    * @param _fromIndex the last index of the user
    **/
    event InterestStreamRedirected( address indexed _from, address indexed _to, uint256 _redirectedBalance, uint256 _fromBalanceIncrease, uint256 _fromIndex);

    /**
    * @dev emitted when the redirected balance of an user is being updated
    * @param _targetAddress the address of which the balance is being updated
    * @param _targetBalanceIncrease the cumulated balance since the last update of the target
    * @param _targetIndex the last index of the user
    * @param _redirectedBalanceAdded the redirected balance being added
    * @param _redirectedBalanceRemoved the redirected balance being removed
    **/
    event RedirectedBalanceUpdated( address indexed _targetAddress, uint256 _targetBalanceIncrease, uint256 _targetIndex, uint256 _redirectedBalanceAdded, uint256 _redirectedBalanceRemoved);

    event InterestRedirectionAllowanceChanged( address indexed _from, address indexed _to );

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
        accure_Supplier_SIGH(_account);                                                          // ADDED BY SIGH FINANCE (ACCURS SIGH FOR DEPOSITOR)
        (, , uint256 balanceIncrease, uint256 index) = cumulateBalanceInternal(_account);       //calculates new interest generated and mints the ITokens (based on interest)

         //if the user is redirecting his interest towards someone else, we update the redirected balance of the redirection address by adding the accrued interest and the amount deposited
        updateRedirectedBalanceOfRedirectionAddressInternal(_account, balanceIncrease.add(_amount), 0);
        _mint(_account, _amount);       //mint an equivalent amount of tokens to cover the new deposit

        emit MintOnDeposit(_account, _amount, balanceIncrease, index);
    }

// ###########################################################################################################################
// ######  REDEEM UNDERLYING TOKENS ##########################################################################################
// ######  1. If interest is being redirected, it adds the increase in balance (through interest) and ########################
// ######     subtracts the amount to be redeemed to the redirected balance. #################################################
// ######  2. It then burns the ITokens equal to amount to be redeemed  ###################################################### 
// ######  3. It then calls redeemUnderlying function of lendingPool Contract to transfer the underlying amount  #############
// ###########################################################################################################################

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
        accure_Supplier_SIGH(msg.sender);                                                          // ADDED BY SIGH FINANCE (ACCURS SIGH FOR REDEEMER)

        //if the user is redirecting his interest towards someone else,
        //we update the redirected balance of the redirection address by adding the accrued interest, and removing the amount to redeem
        updateRedirectedBalanceOfRedirectionAddressInternal(msg.sender, balanceIncrease, amountToRedeem);

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
        accure_Supplier_SIGH(_account);                                                          // ADDED BY SIGH FINANCE (ACCURS SIGH FOR REDEEMER)
        (,uint256 accountBalance,uint256 balanceIncrease,uint256 index) = cumulateBalanceInternal(_account);    //cumulates the balance of the user being liquidated

        //adds the accrued interest and substracts the burned amount to the redirected balance
        updateRedirectedBalanceOfRedirectionAddressInternal(_account, balanceIncrease, _value);
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
        accure_Supplier_SIGH(_from);                                                          // ADDED BY SIGH FINANCE (ACCURS SIGH FOR From Account)
        accure_Supplier_SIGH(_to);                                                            // ADDED BY SIGH FINANCE (ACCURS SIGH FOR To Account)
        
        (, uint256 fromBalance, uint256 fromBalanceIncrease, uint256 fromIndex ) = cumulateBalanceInternal(_from);   //cumulate the balance of the sender
        (, , uint256 toBalanceIncrease, uint256 toIndex ) = cumulateBalanceInternal(_to);       //cumulate the balance of the receiver

        //if the sender is redirecting his interest towards someone else, adds to the redirected balance the accrued interest and removes the amount being transferred
        updateRedirectedBalanceOfRedirectionAddressInternal(_from, fromBalanceIncrease, _value);
        //if the receiver is redirecting his interest towards someone else, adds to the redirected balance the accrued interest and the amount being transferred
        updateRedirectedBalanceOfRedirectionAddressInternal(_to, toBalanceIncrease.add(_value), 0);

        super._transfer(_from, _to, _value);        //performs the transfer

        bool fromIndexReset = false;
        
        if(fromBalance.sub(_value) == 0){           //reset the user data if the remaining balance is 0
            fromIndexReset = resetDataOnZeroBalanceInternal(_from);
        }

        emit BalanceTransfer(  _from, _to, _value, fromBalanceIncrease, toBalanceIncrease, fromIndexReset ? 0 : fromIndex, toIndex);
    }

// ###########################################################################################################################################################
// ######  REDIRECTING INTEREST STREAMS: FUNCTIONALITY #######################################################################################################
// ######  1. redirectInterestStream() : User himself redirects his interest stream.  ########################################################################
// ######  2. allowInterestRedirectionTo() : User gives the permission of redirecting the interest stream to another account  ################################ 
// ######  2. redirectInterestStreamOf() : When account given the permission to redirect interest stream (by the user) redirects the stream.  ################
// ######  3. redirectInterestStreamInternal() --> Executes the redirecting of the interest stream  ##########################################################
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
            updateRedirectedBalanceOfRedirectionAddressInternal(_from,0, previousPrincipalBalance);
        }

        //if the user is redirecting the interest back to himself, we simply set to 0 the interest redirection address
        if(_to == _from) {
            interestRedirectionAddresses[_from] = address(0);
            emit InterestStreamRedirected( _from, address(0), fromBalance, balanceIncrease,fromIndex);
            return;
        }
        
        interestRedirectionAddresses[_from] = _to;      // set the redirection address to the new recipient
        updateRedirectedBalanceOfRedirectionAddressInternal(_from,fromBalance,0);   //adds the user balance to the redirected balance of the destination

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
        _mint(_user, balanceIncrease);                                                                     //mints an amount of tokens equivalent to the amount accumulated
        uint256 index = userIndexes[_user] = core.getInstrumentNormalizedIncome(underlyingInstrumentAddress);      //updates the user index
        return ( previousPrincipalBalance, previousPrincipalBalance.add(balanceIncrease), balanceIncrease, index);
    }


// #########################################################################################################
// ### updateRedirectedBalanceOfRedirectionAddressInternal( user ) --> updates the redirected balance of the user
// #########################################################################################################

    /**
    * @dev updates the redirected balance of the user. If the user is not redirecting his interest, nothing is executed.
    * @param _user the address of the user for which the interest is being accumulated
    * @param _balanceToAdd the amount to add to the redirected balance
    * @param _balanceToRemove the amount to remove from the redirected balance
    **/
    function updateRedirectedBalanceOfRedirectionAddressInternal( address _user, uint256 _balanceToAdd, uint256 _balanceToRemove ) internal {

        address redirectionAddress = interestRedirectionAddresses[_user];
        if(redirectionAddress == address(0)){               //if there isn't any redirection, nothing to be done
            return;
        }

        (,,uint256 balanceIncrease, uint256 index) = cumulateBalanceInternal(redirectionAddress);       //compound balances of the redirected address
        redirectedBalances[redirectionAddress] = redirectedBalances[redirectionAddress].add(_balanceToAdd).sub(_balanceToRemove);   //updating the redirected balance

        //if the interest of redirectionAddress is also being redirected, we need to update the redirected balance of the redirection target by adding the balance increase
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

        //if the _user is not redirecting the interest to anybody, accrues the interest for himself
        if(interestRedirectionAddresses[_user] == address(0)){
            //accruing for himself means that both the principal balance and the redirected balance partecipate in the interest
            return calculateCumulatedBalanceInternal(   _user, currentPrincipalBalance.add(redirectedBalance)   ).sub(redirectedBalance);
        }
        else { //if the user redirected the interest, then only the redirected balance generates interest. In that case, the interest generated
            //by the redirected balance is added to the current principal balance.
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
        return currentSupplyPrincipal.wadToRay().rayMul( core.getInstrumentNormalizedIncome(underlyingInstrumentAddress) ) .rayToWad();
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



// ###########################################################################
// ############ ______SIGH ACCURING AND STREAMING FUNCTIONS______ ############
// ############ 1. claimMySIGH() [EXTERNAL] : All accured SIGH is transferred to the transacting account.
// ############ 2. claimSIGH() [EXTERNAL]  : Accepts an array of users. Same as 1 but for array of users.
// ############ 3. claimSighInternal() [INTERNAL] : CAlled from 1. and 2.
// ############ 1. accure_Supplier_SIGH() [INTERNAL] :
// ############ 2. accure_Borrower_SIGH() [EXTERNAL] : Calls accure_Borrower_SIGH_Internal.
// ############ 3. accureSigh() [INTERNAL] : 
// ############ 4. transferSigh() [INTERNAL] :  


    function claimMySIGH() external {
        claimSighInternal(msg.sender);
    }

    function claimSIGH(address[] calldata holders ) external {        
        for (uint i = 0; i < holders.length; i++) {
            claimSighInternal(holders[i]);
        }
    }

    function claimSighInternal(address user) internal {
        accure_Supplier_SIGH(user);
        accure_Borrower_SIGH_Internal(user);
        if (AccuredSighBalances[user] > 0) {
            transferSigh(user, user);
        }
    } 

    event distributeSupplier_SIGH_test3(address supplier, uint supplyIndex_mantissa, uint supplierIndex_mantissa );
    event distributeSupplier_SIGH_test4(uint SupplierIndexes_,uint supplierTokens,uint deltaIndex_mantissa,uint supplierSighDelta );

    // Supply Index tracks the SIGH Accured per Instrument. Supplier Index tracks the Sigh Accured by the Supplier per Instrument
    // Delta Index = Supply Index - Supplier Index
    // SIGH Accured by Supplier = Supplier's Instrument Balance * Delta Index
    function accure_Supplier_SIGH( address supplier ) internal {
        uint supplyIndex = sighDistributionHandlerContract.getInstrumentSupplyIndex( underlyingInstrumentAddress );      // Instrument index retreived from the SIGHDistributionHandler Contract
        require(supplyIndex > 0, "SIGH Distribution Handler returned invalid supply Index for the instrument");

        Double memory supplierIndex = Double({mantissa: SupplierIndexes[supplier]}) ;      // Stored Supplier Index
        Double memory supplyIndex_ = Double({mantissa: supplyIndex});                        // Instrument Index
        SupplierIndexes[supplier] = supplyIndex_.mantissa;                                   // Supplier Index is UPDATED

        if (supplierIndex.mantissa == 0 && supplyIndex_.mantissa > 0) {
            supplierIndex.mantissa = supplyIndex_.mantissa; // sighInitialIndex;
        }

        emit distributeSupplier_SIGH_test3(supplier, supplyIndex_.mantissa, supplierIndex.mantissa );

        uint supplierTokens = super.balanceOf(supplier);                                                // Current Supplier IToken (1:1 mapping with instrument) Balance
        Double memory deltaIndex = sub_(supplyIndex_, supplierIndex);                                // , 'Distribute Supplier SIGH : supplyIndex Subtraction Underflow'

        emit distributeSupplier_SIGH_test4(SupplierIndexes[supplier], supplierTokens, deltaIndex.mantissa, mul_(supplierTokens, deltaIndex) );

        if (deltaIndex.mantissa > 0) {
            uint supplierSighDelta = mul_(supplierTokens, deltaIndex);                                      // Supplier Delta = Balance * Double(DeltaIndex)/DoubleScale
            accureSigh(supplier, supplierSighDelta );        // ACCURED SIGH AMOUNT IS ADDED TO THE ACCUREDSIGHBALANCES of the Supplier or the address to which SIGH is being redirected to 
        }
    }

    /**
     * @notice Calculate SIGH accrued by a borrower and possibly transfer it to them
     * @dev Borrowers will not begin to accrue until after the first interaction with the protocol.
     * @param borrower The address of the borrower to distribute Gsigh to
     */
    function accure_Borrower_SIGH(address borrower) external onlyLendingPoolCore {
        accure_Borrower_SIGH_Internal(borrower);
    }

    event distributeBorrower_SIGH_test3(address borrower, uint borrowIndex_mantissa, uint borrowerIndex_mantissa );
    event distributeBorrower_SIGH_test4(uint BorrowerIndexes, uint deltaIndex,uint marketBorrowIndex, uint borrowBalance,uint borrowerAmount, uint borrowerSIGHDelta );

    function accure_Borrower_SIGH_Internal(address borrower) internal {
        uint borrowIndex = sighDistributionHandlerContract.getInstrumentBorrowIndex( underlyingInstrumentAddress );      // Instrument index retreived from the SIGHDistributionHandler Contract
        require(borrowIndex > 0, "SIGH Distribution Handler returned invalid borrow Index for the instrument");
        
        Double memory borrowIndex_ = Double({mantissa: borrowIndex});                        // Instrument Index
        Double memory borrowerIndex = Double({mantissa: BorrowerIndexes[borrower]}) ;      // Stored Borrower Index
        BorrowerIndexes[borrower] = borrowIndex_.mantissa;                                   // Borrower Index is UPDATED

        if (borrowerIndex.mantissa == 0 && borrowIndex_.mantissa > 0) {
            borrowerIndex.mantissa = borrowIndex_.mantissa; //sighInitialIndex;
        }

        emit distributeBorrower_SIGH_test3(borrower, borrowIndex_.mantissa, borrowerIndex.mantissa );

        Double memory deltaIndex = sub_(borrowIndex_, borrowerIndex);                                                         // Sigh accured per instrument


        // if (deltaIndex.mantissa > 0) {
            Exp memory marketBorrowIndex = Exp({mantissa: core.getInstrumentVariableBorrowsCumulativeIndex( underlyingInstrumentAddress )});  // Getting index from LendingPool Core
            uint borrowBalance;
            ( , borrowBalance , , ) = core.getUserBasicInstrumentData(underlyingInstrumentAddress, borrower);                                 // Getting Borrow Balance of the User from LendingPool Core 
            uint borrowerAmount = div_(borrowBalance, marketBorrowIndex);
            uint borrowerSIGHDelta = mul_(borrowerAmount, deltaIndex);        // Additional Sigh Accured by the Borrower

            emit distributeBorrower_SIGH_test4(BorrowerIndexes[borrower], deltaIndex.mantissa, marketBorrowIndex.mantissa , borrowBalance, borrowerAmount, borrowerSIGHDelta );

            accureSigh( borrower,borrowerSIGHDelta );            // ACCURED SIGH AMOUNT IS ADDED TO THE ACCUREDSIGHBALANCES of the BORROWER or the address to which SIGH is being redirected to 
        // }
    }

    event SighAccured_(address user, address sighAccuredTo, uint AccuredSighBalance );
    event SighAccured(address user, address sighAccuredTo, uint AccuredSighBalance );

    /**
     * @notice Accured SIGH amount is added to the ACCURED_SIGH_BALANCES of the Supplier/Borrower or the address to which SIGH is being redirected to.
     * @param user The user for which SIGH is being accured
     * @param accuredSighAmount The amount of SIGH accured
     */
    function accureSigh( address user, uint accuredSighAmount ) internal {
        address sighAccuredTo = user;

        if ( sighRedirectionAddresses[sighAccuredTo] == address(0) ) {
            AccuredSighBalances[sighAccuredTo] = AccuredSighBalances[sighAccuredTo].add(accuredSighAmount);   // Accured SIGH added to the user's sigh balance
        }
        else {
            sighAccuredTo = sighRedirectionAddresses[user];
            AccuredSighBalances[sighAccuredTo] = AccuredSighBalances[sighAccuredTo].add(accuredSighAmount);   // Accured SIGH added to the redirected user's sigh balance            
        }
        emit SighAccured_( user , sighAccuredTo, accuredSighAmount );

        if ( AccuredSighBalances[sighAccuredTo] > sigh_Transfer_Threshold ) {   // SIGH is Transferred is SIGH_ACCURED_BALANCE > 1e18 SIGH
            transferSigh( user, sighAccuredTo );
        }
        emit SighAccured( user, sighAccuredTo, AccuredSighBalances[sighAccuredTo] );
    }

    /**
     * @notice Transfers all accured SIGH to the user
     * @dev Calls the transferSighTotheUser() of the sighDistributionHandlerContract which transfers SIGH to the user
     * @param user The user to which the accured SIGH is transferred
     */
    function transferSigh( address user,  address sighAccuredTo ) internal {
        uint amountToBeTransferred = AccuredSighBalances[sighAccuredTo];
        AccuredSighBalances[sighAccuredTo] = sighDistributionHandlerContract.transferSighTotheUser( underlyingInstrumentAddress, user, sighAccuredTo, amountToBeTransferred ); // Pending Amount Not Transferred is returned
    }

// ###########################################################################################################################################################
// ######  ____REDIRECTING Sigh STREAMS____     ##############################################################################################################
// ######  1. redirectSighStream() [EXTERNAL] : User himself redirects his Sigh stream.      #################################################################
// ######  2. allowSighRedirectionTo() [EXTERNAL] : User gives the permission of redirecting the Sigh stream to another account     ##########################
// ######  2. redirectSighStreamOf() [EXTERNAL] : When account given the permission to redirect Sigh stream (by the user) redirects the stream.    ###########
// ######  3. redirectSighStreamInternal() [INTERNAL] --> Executes the redirecting of the Sigh stream    #####################################################
// ###########################################################################################################################################################
    event SighRedirectionAllowanceChanged( address user, address allowedAccount );
    event SighStreamRedirected( address fromAccount, address toAccount, uint blockNumber );

    /**
    * @dev redirects the Sigh being generated to a target address. 
    * @param _to the address to which the Sigh will be redirected
    **/
    function redirectSighStream(address _to) external {
        redirectSighStreamInternal(msg.sender, _to);
    }

    /**
    * @dev gives allowance to an address to execute the Sigh redirection on behalf of the caller.
    * @param _to the address to which the Sigh redirection permission is given. Pass address(0) to reset the allowance.
    **/
    function allowSighRedirectionTo(address _to) external {
        require(_to != msg.sender, "User cannot give allowance to himself");
        sighRedirectionAllowances[msg.sender] = _to;
        emit SighRedirectionAllowanceChanged( msg.sender, _to);
    }

    /**
    * @dev redirects the Sigh generated by _from to a target address.
    * The caller needs to have allowance on the Sigh redirection to be able to execute the function.
    * @param _from the address of the user whom Sigh is being redirected
    * @param _to the address to which the Sigh will be redirected
    **/
    function redirectSighStreamOf(address _from, address _to) external {
        require( msg.sender == sighRedirectionAllowances[_from], "Caller is not allowed to redirect the Sigh of the user");
        redirectSighStreamInternal(_from,_to);
    }

    /**
    * @dev executes the redirection of the Sigh from one address to another.
    * immediately after redirection, the destination address will start to accrue Sigh.
    * @param _from the source address
    * @param _to the destination address
    **/
    function redirectSighStreamInternal( address _from, address _to) internal {

        address currentRedirectionAddress = sighRedirectionAddresses[_from];
        require(_to != currentRedirectionAddress, "Sigh is already redirected to the provided account");
        
        uint userSupplyBalance = super.balanceOf(_from);                                                        // SUPPLIED BALANCE
        uint borrowBalance;
        ( , borrowBalance , , ) = core.getUserBasicInstrumentData(underlyingInstrumentAddress, _from);          // DEPOSITED BALANCE
        require(userSupplyBalance > 0 || borrowBalance > 0 , "Sigh stream can only be redirected if there is a valid Supply or Borrow balance");

        if(_to == _from) {               //   if the user is redirecting the Sigh back to himself, we simply set to 0 the Sigh redirection address
            sighRedirectionAddresses[_from] = address(0);
            emit SighStreamRedirected( _from, address(0), block.number);
            return;
        }

        if (currentRedirectionAddress != address(0)) {      // If the SIGH stream is currently redirected, we transfer the amount to that address before changing it
            accure_Supplier_SIGH(_from);
            accure_Borrower_SIGH_Internal(_from);
        }
        
        sighRedirectionAddresses[_from] = _to;                                      // set the redirection address to the new recipient
        emit SighStreamRedirected( _from, _to, block.number);
    }

// ########################################################### 
// ######  VIEW FUNCTIONS (SIGH RELATED)    ################## 

    function getSighAccured(address account) external view returns (uint) {
        return AccuredSighBalances[account];
    }

    function getSighStreamRedirectedTo(address account) external view returns (address) {
        return sighRedirectionAddresses[account];
    }

    function getSighStreamAllowances(address account) external view returns (address) {
        return sighRedirectionAllowances[account];
    }    

    function getSupplierIndexes(address account) external view returns (uint) {
        return SupplierIndexes[account];
    }    

    function getBorrowerIndexes(address account) external view returns (uint) {
        return BorrowerIndexes[account];
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
