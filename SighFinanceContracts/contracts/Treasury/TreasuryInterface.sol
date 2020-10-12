pragma solidity ^0.5.16;

contract TreasuryInterfaceV1 {

    function getSIGHBalance() external view returns (uint);

    function getTokenBalance(string calldata symbol) external view returns (uint) ;

    function getAmountTransferred(address target) external view returns (uint);

    function getDripRate() external view returns (uint) ;

    function getTotalDrippedAmount() external view returns (uint);
    
    function drip() public returns (uint);            

}