pragma solidity ^0.5.16;

/**
 * @title Sigh Reservoir Contract
 * @notice Distributes a token to a different contract at a fixed rate.
 * @dev This contract must be poked via the `drip()` function every so often.
 * @author SighFinance
 */

import "../openzeppelin/EIP20Interface.sol";
 
contract SighReservoir {

  /// @notice The block number when the Reservoir started (immutable)
  // uint public dripStart;

  /// @notice Tokens per block that to drip to target (immutable)
  uint public dripRate;

  /// @notice Reference to token to drip (immutable)
  EIP20Interface public token;

  /// @notice Target to receive dripped tokens (immutable)
  address public target;

  uint public lastDripBlockNumber;    

  uint public totalDrippedAmount; // Dripped Amount till now

  uint public recentlyDrippedAmount;  // Amount recently Dripped

  address public admin;

  bool public isDripAllowed = false;  

  /**
    * @notice Constructs a Reservoir
    * @param token_ The token to drip
    */
  constructor(EIP20Interface token_) public {
    admin = msg.sender;
    token = token_;
    totalDrippedAmount = 0;
    recentlyDrippedAmount = 0;

  }

  function beginDripping (uint dripRate_, address target_ ) public returns (bool) {
    require(admin == msg.sender,"Dripping can only be initialized by the Admin");
    require(!isDripAllowed,"Dripping can only be initialized once");
    isDripAllowed = true;
    target = target_;
    require(target == target_,"Target address could not be properly initialized");
    require(changeDripRate(dripRate_),"Drip Rate could not be initialized properly");
    return true;
  }

  function changeDripRate (uint dripRate_) public returns (bool) {
    require(admin == msg.sender,"Drip rate can only be changed by the Admin");
    drip();
    dripRate = dripRate_;
    return true;
  }

  /**
    * @notice Drips the maximum amount of tokens to match the drip rate since inception
    * @dev Note: this will only drip up to the amount of tokens available.
    * @return The amount of tokens dripped in this call
    */
  function drip() public returns (uint) {
    require(isDripAllowed,'Dripping has not been initialized by the Admin');    
    uint drippedAmount = dripInternal();
    return drippedAmount;
  }

  function dripInternal() internal returns (uint) {
    EIP20Interface token_ = token;
    uint reservoirBalance_ = token_.balanceOf(address(this)); // TODO: Verify this is a static call
    uint blockNumber_ = block.number;
    uint deltaDrip_ = mul(dripRate, blockNumber_ - lastDripBlockNumber, "dripTotal overflow");
    uint toDrip_ = min(reservoirBalance_, deltaDrip_);
    require(reservoirBalance_ != 0, 'The reservoir currently does not have any SIGH tokens' );
    require(token_.transfer(target, toDrip_), 'The transfer did not complete.' );
    lastDripBlockNumber = blockNumber_; // setting the block number when the Drip is made
    uint prevDrippedAmount = totalDrippedAmount;
    recentlyDrippedAmount = toDrip_;
    totalDrippedAmount = add(prevDrippedAmount,toDrip_,"Overflow");
    return toDrip_;
  } 

  function getSighAddress() external view returns (address) {
    return address(token);
  }

  function getTargetAddress() external view returns (address) {
    return address(target);
  }

  function () external payable {}

  /* Internal helper functions for safe math */

  function add(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
    uint c = a + b;
    require(c >= a, errorMessage);
    return c;
  }

  function sub(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
    require(b <= a, errorMessage);
    uint c = a - b;
    return c;
  }

  function mul(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
    if (a == 0) {
      return 0;
    }
    uint c = a * b;
    require(c / a == b, errorMessage);
    return c;
  }

  function min(uint a, uint b) internal pure returns (uint) {
    if (a <= b) {
      return a;
    } else {
      return b;
    }
  }
}

import "../openzeppelin/EIP20Interface.sol";
