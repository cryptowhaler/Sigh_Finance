pragma solidity ^0.5.16;

import "./PriceOracle.sol";
import "./Tokens/CErc20.sol";

import "./AggregatorV3Interface.sol";

contract SimplePriceOracle is PriceOracle {

    AggregatorV3Interface internal LINK_ETH = AggregatorV3Interface(0x3Af8C569ab77af5230596Acf0E8c2F9351d24C38);
    AggregatorV3Interface internal LINK_USD = AggregatorV3Interface(0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0);


    function getUnderlyingPrice(CToken cToken) public view returns (uint) {

        // Return LINK price in USD
        if (compareStrings(cToken.symbol(), "link")) {
            (uint80 roundID, int price,uint startedAt, uint timeStamp, uint80 answeredInRound) = LINK_USD.latestRoundData();
            return uint(price);
        } 
        // Return LINK price in ETH
        else {
            (uint80 roundID, int price,uint startedAt, uint timeStamp, uint80 answeredInRound) = LINK_ETH.latestRoundData();
            return uint(price);
        }
    }


    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }
}
