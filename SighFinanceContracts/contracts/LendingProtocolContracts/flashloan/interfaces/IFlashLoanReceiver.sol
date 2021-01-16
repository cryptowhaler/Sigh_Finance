pragma solidity 0.6.12;

import "../../../configuration/IGlobalAddressesProvider.sol";
import {ILendingPool} from '../../interfaces/ILendingPool.sol';

/**
 * @title IFlashLoanReceiver interface
 * @notice Interface for the SIGH fee IFlashLoanReceiver.r.
 * @author Aave
 * @dev implement this interface to develop a flashloan-compatible flashLoanReceiver contract
 **/
interface IFlashLoanReceiver {

  function executeOperation( address[] calldata assets, uint256[] calldata amounts, uint256[] calldata premiums, address initiator, bytes calldata params ) external returns (bool);

  function ADDRESSES_PROVIDER() external view returns (IGlobalAddressesProvider);

  function LENDING_POOL() external view returns (ILendingPool);
}