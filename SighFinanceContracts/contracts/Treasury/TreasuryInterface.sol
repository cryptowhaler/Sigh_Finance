pragma solidity ^0.5.16;

contract TreasuryInterface {

    function getCurrentSIGHBalance() external view returns (uint);

    function dripToSightroller() external view returns (uint);

}