pragma solidity ^0.5.0;

/**
 * @title  ERC20 Itokens (modified by SIGH Finance)
 *
 * @dev Implementation of the interest bearing token for the protocol.
 * @author Aave, SIGH Finance (modified by SIGH Finance)
 */
interface ITokenInterface {

    // ######### ERC20 FUNCTIONS  #########
    function transfer(address recipient, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function name() external view returns (string memory);
    function symbol() external view returns (string memory);
    function decimals() external view returns (uint8);    
    function totalSupply() external view returns (uint256);
    function balanceOf(address who) external view returns (uint256);    

    // #########  ITOKEN FUNCTIONS  #########
    // function isTransferAllowed(address _user, uint256 _amount) public view returns (bool);
    function mintOnDeposit(address _account, uint256 _amount) external;
    function redeem(uint256 _amount) external;
    function burnOnLiquidation(address _account, uint256 _value) external;
    function transferOnLiquidation(address _from, address _to, uint256 _value) external;


// ###########################################################################
// ######  REDIRECTING INTEREST STREAMS: FUNCTIONALITY ########################################
// ######  1. redirectInterestStream() : User himself redirects his interest stream.
// ######  2. allowInterestRedirectionTo() : User gives the permission of redirecting the interest stream to another account
// ######  3. redirectInterestStreamOf() : When account given the permission to redirect interest stream (by the user) redirects the stream.
// ###########################################################################

    function redirectInterestStream(address _to) external;
    function allowInterestRedirectionTo(address _to) external;
    function redirectInterestStreamOf(address _from, address _to) external;

    // #########  VIEW FUNCTIONS  #########
    // function balanceOf(address _user) public view returns(uint256);
    function principalBalanceOf(address _user) external view returns(uint256);
    // function totalSupply() public view returns(uint256);
    function getUserIndex(address _user) external view returns(uint256);
    function getInterestRedirectionAddress(address _user) external view returns(address);
    function getRedirectedBalance(address _user) external view returns(uint256);
}