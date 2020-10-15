pragma solidity ^0.5.16;

/**
 * @title Sigh Reservoir Contract
 * @notice Distributes a token to a different contract at a fixed rate.
 * @dev This contract must be poked via the `drip()` function every so often.
 * @author SighFinance
 */

import "../openzeppelin/EIP20Interface.sol";
 
contract SighReservoir {

  uint public protocolDistributionSpeed;

  uint public treasuryDistributionSpeed;

  /// @notice Reference to token to drip (immutable)
  EIP20Interface public token;

  address public admin;
  address public sightroller;
  address public treasury;

  bool public isDripAllowed = false;  

  uint public lastDripBlockNumber;    

  uint public totalDrippedAmount_toProtocol; 
  uint public recentlyDrippedAmount_toProtocol;

  uint public totalDrippedAmount_toTreasury; 
  uint public recentlyDrippedAmount_toTreasury;


  uint public totalAmountTransferredToTreasury;

  event DistributionInitialized(address protocolAddress, address treasuryAddress);

  event ProtocolDistributionSpeedChanged(uint prevSpeed , uint newSpeed );  
  event TreasuryDistributionSpeedChanged(uint prevSpeed , uint newSpeed );  

  event DrippedToProtocol(uint currentBalance , uint AmountDripped, uint totalAmountDripped ); 
  event DrippedToTreasury(uint currentBalance , uint AmountDripped, uint totalAmountDripped ); 

  /**
    * @notice Constructs a Reservoir
    * @param token_ The token to drip
    */
  constructor(EIP20Interface token_ ) public {
    admin = msg.sender;
    token = token_;
  }

// #############################################################################################
// ###########   SIGH DISTRIBUTION : INITIALIZED DRIPPING (Can be called only once)   ##########
// #############################################################################################

  function beginDripping (uint protocolDistributionSpeed_, uint treasuryDistributionSpeed_, address sightroller_ ,  address treasury_) public returns (bool) {
    require(admin == msg.sender,"Dripping can only be initialized by the Admin");
    require(!isDripAllowed,"Dripping can only be initialized once");

    isDripAllowed = true;
    sightroller = sightroller_;
    treasury = treasury_;
    lastDripBlockNumber = block.number;

    require(treasury == treasury_,"SIGH Treasury address could not be properly initialized");
    require(sightroller == sightroller_,"Sightroller address could not be properly initialized");
    require(changeProtocolDistributionSpeed(protocolDistributionSpeed_),"Protocol Drip Rate could not be initialized properly");
    require(changeTreasuryDistributionSpeed(treasuryDistributionSpeed_),"Treasury Drip Rate could not be initialized properly");

    emit DistributionInitialized(sightroller , treasury );
    return true;
  }

// ######################################################################################
// ###########   SIGH DISTRIBUTION : FUNCTIONS TO UPDATE DISTRIBUTION SPEEDS   ##########
// ######################################################################################

  function changeProtocolDistributionSpeed (uint newSpeed_) public returns (bool) {
    require(admin == msg.sender,"Drip rate can only be changed by the Admin");
    drip();
    uint prevSpeed = protocolDistributionSpeed;
    protocolDistributionSpeed = newSpeed_;
    emit ProtocolDistributionSpeedChanged(prevSpeed , protocolDistributionSpeed);
    return true;
  }

  function changeTreasuryDistributionSpeed (uint newSpeed_) public returns (bool) {
    require(admin == msg.sender,"Drip rate can only be changed by the Admin");
    drip();
    uint prevSpeed = treasuryDistributionSpeed;
    treasuryDistributionSpeed = newSpeed_;
    emit TreasuryDistributionSpeedChanged(prevSpeed , treasuryDistributionSpeed);
    return true;
  }

// #####################################################################
// ###########   SIGH DISTRIBUTION FUNCTION - DRIP FUNCTION   ##########
// #####################################################################

  /**
    * @notice Drips the maximum amount of tokens to match the drip rate since inception
    * @dev Note: this will only drip up to the amount of tokens available.
    * @return The amount of tokens dripped in this call
    */
  function drip() public returns (uint) {
    require(isDripAllowed,'Dripping has not been initialized by the Admin');    
    uint drippedAmount_toProtocol = dripToProtocol();
    uint drippedAmount_toTreasury = dripToTreasury();
    lastDripBlockNumber = block.number; 
    uint totalDrippedAmount = add(drippedAmount_toProtocol,drippedAmount_toTreasury, 'Total Drip Amount : Addition Overflow');
    return totalDrippedAmount;
  }

  function dripToProtocol() internal returns (uint) {

    if (protocolDistributionSpeed == 0) {
      return 0;
    }

    EIP20Interface token_ = token;
    
    uint reservoirBalance_ = token_.balanceOf(address(this)); // TODO: Verify this is a static call
    uint blockNumber_ = block.number;
    uint deltaDrip_ = mul(protocolDistributionSpeed, blockNumber_ - lastDripBlockNumber, "dripTotal overflow");
    uint toDrip_ = min(reservoirBalance_, deltaDrip_);

    require(reservoirBalance_ != 0, 'Protocol Transfer: The reservoir currently does not have any SIGH tokens' );
    require(token_.transfer(sightroller, toDrip_), 'Protocol Transfer: The transfer did not complete.' );
    
    // lastDripBlockNumber = blockNumber_; // setting the block number when the Drip is made
    uint prevDrippedAmount = totalDrippedAmount_toProtocol;
    totalDrippedAmount_toProtocol = add(prevDrippedAmount,toDrip_,"Overflow");
    reservoirBalance_ = token_.balanceOf(address(this)); // TODO: Verify this is a static call

    emit DrippedToProtocol( reservoirBalance_, toDrip_ , totalDrippedAmount_toProtocol ); 
    
    return toDrip_;
  } 

  function dripToTreasury() internal returns (uint) {

    if (treasuryDistributionSpeed == 0) {
      return 0;
    }

    EIP20Interface token_ = token;

    uint reservoirBalance_ = token_.balanceOf(address(this)); // TODO: Verify this is a static call
    uint blockNumber_ = block.number;
    uint deltaDrip_ = mul(treasuryDistributionSpeed, blockNumber_ - lastDripBlockNumber, "dripTotal overflow");
    uint toDrip_ = min(reservoirBalance_, deltaDrip_);

    require(reservoirBalance_ != 0, 'Protocol Transfer: The reservoir currently does not have any SIGH tokens' );
    require(token_.transfer(treasury, toDrip_), 'Protocol Transfer: The transfer did not complete.' );
    
    // lastDripBlockNumber = blockNumber_; // setting the block number when the Drip is made
    uint prevDrippedAmount = totalDrippedAmount_toTreasury;
    totalDrippedAmount_toTreasury = add(prevDrippedAmount,toDrip_,"Overflow");
    reservoirBalance_ = token_.balanceOf(address(this)); // TODO: Verify this is a static call

    emit DrippedToTreasury( reservoirBalance_, toDrip_ , totalDrippedAmount_toTreasury ); 
    
    return toDrip_;
  } 

// ###############################################################
// ###########   EXTERNAL VIEW functions TO GET STATE   ##########
// ###############################################################

  function getSIGHBalance() external view returns (uint) {
    EIP20Interface token_ = token;   
    uint balance = token_.balanceOf(address(this));
    return balance;
  }

  function getSighAddress() external view returns (address) {
    return address(token);
  }

  function getSightrollerAddress() external view returns (address) {
    return address(sightroller);
  }

  function getTreasuryAddress() external view returns (address) {
    return address(treasury);
  }

  function getTotalAmountDistributedToSightroller() external view returns (uint) {
    return totalDrippedAmount_toProtocol;
  }

  function getTotalAmountDistributedToTreasury() external view returns (uint) {
    return totalDrippedAmount_toTreasury;
  }

// ###############################################################
// ########### Internal helper functions for safe math ###########
// ###############################################################

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
