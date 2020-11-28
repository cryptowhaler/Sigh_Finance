pragma solidity ^0.5.0;


import "./MintableERC20.sol";


contract MockWBTC is MintableERC20 {

    uint256 public decimals = 18;
    string public symbol = "WBTCv0";
    string public name = "WBTC Coin";
}