pragma solidity ^0.5.0;

/**
@title I_InstrumentInterestRateStrategyInterface interface
@notice Interface for the calculation of the interest rates.
*/

interface I_InstrumentInterestRateStrategy {

    /**
    * @dev returns the base variable borrow rate, in rays
    */

    function getBaseVariableBorrowRate() external view returns (uint256);
    /**
    * @dev calculates the liquidity, stable, and variable rates depending on the current utilization rate and the base parameters
    *
    */
    function calculateInterestRates( address _instrument, uint256 _utilizationRate, uint256 _totalBorrowsStable, uint256 _totalBorrowsVariable, uint256 _averageStableBorrowRate) external view
    returns (uint256 liquidityRate, uint256 stableBorrowRate, uint256 variableBorrowRate);
}
