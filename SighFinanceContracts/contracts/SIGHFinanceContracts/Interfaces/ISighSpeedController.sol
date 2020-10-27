pragma solidity ^0.5.16;

/**
 * @title Sigh Speed Controller Contract
 * @notice Distributes a token to a different contract at a fixed rate.
 * @dev This contract must be poked via the `drip()` function every so often.
 * @author SighFinance
 */

interface ISighSpeedController {

// #############################################################################################
// ###########   SIGH DISTRIBUTION : INITIALIZED DRIPPING (Can be called only once)   ##########
// #############################################################################################

  function setAddressProvider(address _addressesProvider) external returns bool;
  function beginDripping () external returns (bool);

// ############################################################################################################
// ###########   SIGH DISTRIBUTION : ADDING / REMOVING NEW PROTOCOL WHICH WILL RECEIVE SIGH TOKENS   ##########
// ############################################################################################################

  function supportNewProtocol( address newProtocolAddress, uint sighSpeed ) external returns (bool);
  function removeSupportedProtocol(address protocolAddress_ ) external returns (bool);        //   ######### WE DO NOT DRIP WHEN REMOVING A PROTOCOL  ######### 
  function changeProtocolSIGHSpeed (address targetAddress, uint newSpeed_) external returns (bool) ;

// #####################################################################
// ###########   SIGH DISTRIBUTION FUNCTION - DRIP FUNCTION   ##########
// #####################################################################

  function drip() external returns (uint);


// ########################################################
// ###########   FUNCTIONS TO CHANGE THE ADMIN   ##########
// ########################################################

//  function changeAdmin(address newAdmin) external returns (bool);
//  function acceptAdmin() external returns (bool);
 

// ###############################################################
// ###########   EXTERNAL VIEW functions TO GET STATE   ##########
// ###############################################################

  function getSIGHBalance() external view returns (uint);
  function getSighAddress() external view returns (address);
  function getSupportedProtocols() external view returns (address[]);  
  function isThisProtocolSupported(address protocolAddress) external view returns (bool);
  function getTotalAmountDistributedToProtocol(address protocolAddress) external view returns (uint);
  function getRecentAmountDistributedToProtocol(address protocolAddress) external view returns (uint);
  function getSIGHSpeedForProtocol(address protocolAddress) external view returns (uint);
  function totalProtocolsSupported() external view returns (uint);


}
