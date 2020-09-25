pragma solidity ^0.5.16;

import "./PriceOracle.sol";
import "./Tokens/CErc20.sol";

import "./AggregatorV3Interface.sol";

contract SimplePriceOracle is PriceOracle {

    AggregatorV3Interface internal LINK_ETH = AggregatorV3Interface(0x3Af8C569ab77af5230596Acf0E8c2F9351d24C38); //ChainLink - ETH
    AggregatorV3Interface internal LINK_USD = AggregatorV3Interface(0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0); //ChainLink - USD
    AggregatorV3Interface internal SIGH_USD = AggregatorV3Interface(0x6135b13325bfC4B00278B4abC5e20bbce2D6580e); //Bitcoin - USD
    AggregatorV3Interface internal GSIGH_USD = AggregatorV3Interface(0x777A68032a88E5A84678A77Af2CD65A7b3c0775a); //DAI - USD


    function getUnderlyingPrice(CToken cToken) public view returns (uint) {

        // Return LINK price in USD
        if (compareStrings(cToken.symbol(), "link")) {
            (uint80 roundID, int price,uint startedAt, uint timeStamp, uint80 answeredInRound) = LINK_USD.latestRoundData();
            return uint(price);
        } 
        else if (compareStrings(cToken.symbol(), "S-GSIGH")) {
            (uint80 roundID, int price,uint startedAt, uint timeStamp, uint80 answeredInRound) = GSIGH_USD.latestRoundData();
            return uint(price);
        } 
        else if (compareStrings(cToken.symbol(), "S-SIGH")) {
            (uint80 roundID, int price,uint startedAt, uint timeStamp, uint80 answeredInRound) = SIGH_USD.latestRoundData();
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
