pragma solidity ^0.5.0;

/**
* @title IFlashLoanReceiver interface
* @notice Interface for the SIGH fee IFlashLoanReceiver.
* @author Aave, SIGH Finance
* @dev implement this interface to develop a flashloan-compatible flashLoanReceiver contract
**/
interface IFlashLoanReceiver {

    function executeOperation(address _instrument, uint256 _amount, uint256 _fee, bytes calldata _params) external;
}
