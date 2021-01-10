// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.5.16;
pragma experimental ABIEncoderV2;

import {IERC20} from '../interfaces/IERC20.sol';
import {StakedToken} from './StakedToken.sol';

/**
 * @title Staked SIGH
 * @notice StakedToken with AAVE token as staked token
 * @author Aave
 **/
contract StakedSIGH is StakedToken {
  string internal constant NAME = 'Staked SIGH';
  string internal constant SYMBOL = 'stk_SIGH';
  uint8 internal constant DECIMALS = 18;
  
  constructor( IERC20 stakedToken, IERC20 rewardToken, uint256 cooldownSeconds, uint256 unstakeWindow, address rewardsVault, address emissionManager, uint128 distributionDuration) public StakedToken(
    stakedToken,
    rewardToken,
    cooldownSeconds,
    unstakeWindow,
    rewardsVault,
    emissionManager,
    distributionDuration,
    NAME,
    SYMBOL,
    DECIMALS) {
        
    }
}