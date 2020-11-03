pragma solidity ^0.5.0;

/************
@title ILendingPoolParametersProvider interface
@notice Interface for the SIGH Finance's Lending Protocol arameters Provider.
*/

interface ILendingPoolParametersProvider {

    //returns the maximum stable rate borrow size, in percentage of the available liquidity.
    function getMaxStableRateBorrowSizePercent() external pure returns (uint256);
    
    // returns the delta between the current stable rate and the user stable rate at  which the borrow position of the user will be rebalanced (scaled down)    
    function getRebalanceDownRateDelta() external pure returns (uint256);

    // returns the fee applied to a flashloan and the portion to redirect to the protocol, in basis points.
    function getFlashLoanFeesInBips() external pure returns (uint256, uint256);

}
