pragma solidity ^0.5.0;

/**
 * @title  ERC20 Itokens (modified by SIGH Finance)
 *
 * @dev Implementation of the interest bearing token for the protocol.
 * @author Aave, SIGH Finance (modified by SIGH Finance)
 */
interface ITokenInterface {

// #############################
// #####  ERC20 FUNCTIONS  #####
// #############################

    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);    
    function totalSupply() external view returns (uint256);
    function balanceOf(address user) external view returns (uint256);    

// ################################################
// #####  ITOKEN (LENDING RELATED) FUNCTIONS  #####
// ################################################

    function mintOnDeposit(address _account, uint256 _amount) external;
    function redeem(uint256 _amount) external;
    function burnOnLiquidation(address _account, uint256 _value) external;
    function transferOnLiquidation(address _from, address _to, uint256 _value) external;

// #################################################################################################################################################
// ######  REDIRECTING INTEREST STREAMS: FUNCTIONALITY #############################################################################################
// ######  1. redirectInterestStream() : User himself redirects his interest stream.  ##############################################################
// ######  2. allowInterestRedirectionTo() : User gives the permission of redirecting the interest stream to another account  ######################
// ######  3. redirectInterestStreamOf() : When account given the permission to redirect interest stream (by the user) redirects the stream.  ######
// #################################################################################################################################################

    function redirectInterestStream(address _to) external;
    function allowInterestRedirectionTo(address _to) external;
    function redirectInterestStreamOf(address _from, address _to) external;

// ##############################################
// #####  VIEW (LENDING RELATED) FUNCTIONS  #####
// ##############################################

    function principalBalanceOf(address _user) external view returns(uint256);
    function getUserIndex(address _user) external view returns(uint256);
    function getInterestRedirectionAddress(address _user) external view returns(address);
    function getRedirectedBalance(address _user) external view returns(uint256);

// ####################################
// #####  SIGH RELATED FUNCTIONS  #####
// ####################################

    function redirectLiquiditySIGHStream(address _to) external;
    function allowLiquiditySIGHRedirectionTo(address _to) external;
    function redirectLiquiditySIGHStreamOf(address _from, address _to) external;

    function updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddress( address _user, uint256 _balanceToAdd, uint256 _balanceToRemove ) external;
    function accure_SIGH_For_BorrowingStream( address user) external ;

    function redirectBorrowingSIGHStream(address _to) external;
    function allowBorrowingSIGHRedirectionTo(address _to) external;
    function redirectBorrowingSIGHStreamOf(address _from, address _to) external;
    

    function claimMySIGH() external;
    function claimSIGH(address[] calldata holders ) external;    
    function accure_Borrower_SIGH(address borrower) external;

// ##########################################
// ######  SIGH RELATED VIEW FUNCTIONS ######
// ##########################################

    function getSighAccured() external view returns (uint);
    function getSighAccuredForAccount(address account) external view returns (uint);

    function getSighStreamRedirectedTo() external view returns (address);
    function getSighStreamRedirectedTo(address account) external view returns (address);

    function getSighStreamAllowances() external view returns (address);
    function getSighStreamAllowances(address account) external view returns (address);

    function getSupplierIndexes(address account) external view returns (uint);     
    function getBorrowerIndexes(address account) external view returns (uint);


}