pragma solidity ^0.5.0;

/**
 * @title  $SIGH STREAMS
 *
 * @dev Implementation of the $SIGH Liquidity & Borrowing Streams for ITokens.
 * @author SIGH Finance 
 */
interface ISighStream {


    // LIQUIDITY $SIGH STREAM - CALLED FROM ITOKEN CONTRACT
    function redirectLiquiditySIGHStream(address from, address _to) external;
    function allowLiquiditySIGHRedirectionTo(address from, address _to) external;
    function redirectLiquiditySIGHStreamOf(address user, address _from, address _to) external;

    function updateRedirectedBalanceOfLiquiditySIGHStreamRedirectionAddress( address _user, uint256 _balanceToAdd, uint256 _balanceToRemove ) external;
    function accureLiquiditySighStream( address supplier, uint unaccountedBalanceIncrease , uint256 currentCompoundedBalance )  external ;

    // BORROWING $SIGH STREAM - CALLED FROM ITOKEN CONTRACT
    function redirectBorrowingSIGHStream(address user, address _to) external ;
    function allowBorrowingSIGHRedirectionTo(address user, address _to) external ;
    function redirectBorrowingSIGHStreamOf(address user, address _from, address _to) external;    

    function updateRedirectedBalanceOfBorrowingSIGHStreamRedirectionAddress( address _user, uint256 _balanceToAdd, uint256 _balanceToRemove ) external;
    function accure_SIGH_For_BorrowingStream( address user) external ;

    // FUNCTION TO CLAIM CURRENTLY ACCURED $SIGH
    function claimMySIGH(address user) external;

    // VIEW FUNCTIONS
    function getSighAccured(address account) external view returns (uint);
    function getSIGHStreamsRedirectedTo(address user) external view returns (address liquiditySIGHStreamRedirectionAddress,address BorrowingSIGHStreamRedirectionAddress );    
    function getSIGHStreamsAllowances(address user) external view returns (address liquiditySIGHStreamRedirectionAllowance,address BorrowingSIGHStreamRedirectionAllowance );
    function getSIGHStreamsIndexes(address user) external view returns (uint liquiditySIGHStreamIndex, uint borrowingSIGHStreamIndex) ;
    function getSIGHStreamsRedirectedBalances(address user) external view returns (uint liquiditySIGHStreamRedirectedBalance, uint borrowingSIGHStreamRedirectedBalance );

}