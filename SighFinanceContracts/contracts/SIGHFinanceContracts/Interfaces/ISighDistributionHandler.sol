pragma solidity ^0.5.16;

/**
 * @title Sigh Speed Controller Contract
 * @notice Distributes a token to a different contract at a fixed rate.
 * @dev This contract must be poked via the `drip()` function every so often.
 * @author SighFinance
 */

interface ISighDistributionHandler {

    function addInstrument( address _instrument, address _iTokenAddress, uint256 _decimals ) external returns (bool);

}