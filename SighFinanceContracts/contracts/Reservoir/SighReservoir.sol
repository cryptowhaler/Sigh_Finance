pragma solidity ^0.5.16;

/**
 * @title Sigh Reservoir Contract
 * @notice Distributes a token to a different contract at a fixed rate.
 * @dev This contract must be poked via the `drip()` function every so often.
 * @author SighFinance
 */

import "../openzeppelin/EIP20Interface.sol";
 
contract SighReservoir {

  uint public dripRate;

  /// @notice Reference to token to drip (immutable)
  EIP20Interface public token;

  address public sightroller;
  address public admin;
  address public treasury;

  bool public isDripAllowed = false;  

  uint public lastDripBlockNumber;    
  uint public totalDrippedAmount; 
  uint public recentlyDrippedAmount;

  uint public totalAmountTransferredToTreasury;

  event DripRateChanged(uint prevDripRate , uint newDripRate );  
  
  event Dripped(uint currentBalance , uint AmountDripped, uint totalAmountDripped ); 

  event SIGH_TransferredToTreasury(uint amountTransferred, uint currentBalance, uint blockNumber);

  /**
    * @notice Constructs a Reservoir
    * @param token_ The token to drip
    */
  constructor(EIP20Interface token_, address treasury_) public {
    admin = msg.sender;
    token = token_;
    treasury = treasury_;

  }

  function beginDripping (uint dripRate_, address sightroller_ ) public returns (bool) {
    require(admin == msg.sender,"Dripping can only be initialized by the Admin");
    require(!isDripAllowed,"Dripping can only be initialized once");
    isDripAllowed = true;
    sightroller = sightroller_;
    lastDripBlockNumber = block.number;
    require(sightroller == sightroller_,"Sightroller address could not be properly initialized");
    require(changeDripRate(dripRate_),"Drip Rate could not be initialized properly");
    return true;
  }

  function changeDripRate (uint dripRate_) public returns (bool) {
    require(admin == msg.sender,"Drip rate can only be changed by the Admin");
    drip();
    uint prevDripRate = dripRate;
    dripRate = dripRate_;
    emit DripRateChanged(prevDripRate , dripRate);
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
    require(token_.transfer(sightroller, toDrip_), 'The transfer did not complete.' );
    
    lastDripBlockNumber = blockNumber_; // setting the block number when the Drip is made
    uint prevDrippedAmount = totalDrippedAmount;
    totalDrippedAmount = add(prevDrippedAmount,toDrip_,"Overflow");
    reservoirBalance_ = token_.balanceOf(address(this)); // TODO: Verify this is a static call
    recentlyDrippedAmount = toDrip_;

    emit Dripped( reservoirBalance_, recentlyDrippedAmount , totalDrippedAmount ); 
    
    return toDrip_;
  } 

  function transferToTreasury(uint amount) public returns (uint) {
    require(msg.sender == admin,'Only admin can transfer the amount');

    if (isDripAllowed) {
      dripInternal();
    }
    
    EIP20Interface token_ = token;   
    uint balance = token_.balanceOf(address(this));

    require(balance > amount, 'The Reservoir balance is less than the amount to be transferred');
    require(token_.transfer(treasury, amount),'SIGH Token transfer failed');

    uint prevTreasuryAmount = totalAmountTransferredToTreasury;
    totalAmountTransferredToTreasury = add(prevTreasuryAmount, amount,"Overflow");

    balance = token_.balanceOf(address(this));

    emit SIGH_TransferredToTreasury(amount, balance, block.number);

  }

  function getSighAddress() external view returns (address) {
    return address(token);
  }

  function getsightrollerAddress() external view returns (address) {
    return address(sightroller);
  }

  function getTreasuryAddress() external view returns (address) {
    return address(treasury);
  }

  function getTotalAmountTransferredToTreasury() external view returns (uint) {
    return totalAmountTransferredToTreasury;
  }

  function getSIGHBalance() external view returns (uint) {
    EIP20Interface token_ = token;   
    uint balance = token_.balanceOf(address(this));
    return balance;
  }

  // function () external payable {}

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
