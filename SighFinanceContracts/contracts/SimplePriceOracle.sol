pragma solidity ^0.5.16;

import "./PriceOracle.sol";
import "./Tokens/CErc20.sol";

import "./AggregatorV3Interface.sol";

contract SimplePriceOracle is PriceOracle {

    AggregatorV3Interface internal LINK_ETH = AggregatorV3Interface(0x3Af8C569ab77af5230596Acf0E8c2F9351d24C38);
    AggregatorV3Interface internal LINK_USD = AggregatorV3Interface(0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0);

    mapping(address => uint) prices;

    event PricePosted(address asset, uint previousPriceMantissa, uint requestedPriceMantissa, uint newPriceMantissa);

    function getUnderlyingPrice(CToken cToken) public view returns (uint) {
        if (compareStrings(cToken.symbol(), "link")) {
            (uint80 roundID, int price,uint startedAt, uint timeStamp, uint80 answeredInRound) = LINK_USD.latestRoundData();
            return price;
        } 
        else {
            (uint80 roundID, int price,uint startedAt, uint timeStamp, uint80 answeredInRound) = LINK_ETH.latestRoundData();
            return price;
        }
    }

    
    function setUnderlyingPrice(CToken cToken, uint underlyingPriceMantissa) public {
        address asset = address(CErc20(address(cToken)).underlying());               // getting the address of the underlying ERC20 token 
        uint previousPriceMantissa = prices[asset];
        prices[asset] = underlyingPriceMantissa;
        emit PricePosted(asset, previousPriceMantissa, underlyingPriceMantissa, prices[asset]);

    }

    function setDirectPrice(address asset, uint price) public {
        prices[asset] = price;
    }

    // v1 price oracle interface for use as backing of proxy
    function assetPrices(address asset) external view returns (uint) {
        return prices[asset];
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }
}
