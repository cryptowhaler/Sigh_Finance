pragma solidity ^0.5.16;

contract TreasuryInterfaceV1 {

    function getSIGHBalance() external view returns (uint);

    function getTokenBalance(address token_address) external view returns (uint) ;

    function getAmountTransferred(address target) external view returns (uint);

    function getDripSpeed() external view returns (uint) ;

    function getTotalDrippedAmount(address token) external view returns (uint);
    
    function drip() public returns (uint);            

}