pragma solidity 0.6.12;

import {SafeMath} from '../../dependencies/openzeppelin/contracts/SafeMath.sol';
import {IERC20} from '../../dependencies/openzeppelin/contracts/IERC20.sol';
import {SafeERC20} from '../../dependencies/openzeppelin/contracts/SafeERC20.sol';

import {IFlashLoanReceiver} from '../interfaces/IFlashLoanReceiver.sol';
import "../../../configuration/IGlobalAddressesProvider.sol";
import {ILendingPool} from '../../interfaces/ILendingPool.sol';



abstract contract FlashLoanReceiverBase is IFlashLoanReceiver {
  using SafeERC20 for IERC20;
  using SafeMath for uint256;

  IGlobalAddressesProvider public immutable override ADDRESSES_PROVIDER;
  ILendingPool public immutable override LENDING_POOL;

  constructor(IGlobalAddressesProvider provider) public {
    ADDRESSES_PROVIDER = provider;
    LENDING_POOL = ILendingPool(provider.getLendingPool());
  }
}