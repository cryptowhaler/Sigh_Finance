pragma solidity ^0.5.16;

import "./PriceOracle.sol";
import "./Tokens/CErc20.sol";

import "./AggregatorV3Interface.sol";

contract SimplePriceOracle is PriceOracle {

    AggregatorV3Interface internal LINK_ETH = AggregatorV3Interface(0x3Af8C569ab77af5230596Acf0E8c2F9351d24C38); //ChainLink - ETH
    AggregatorV3Interface internal SIGH_USD = AggregatorV3Interface(0x6135b13325bfC4B00278B4abC5e20bbce2D6580e); //Bitcoin - USD
    AggregatorV3Interface internal GSIGH_USD = AggregatorV3Interface(0x777A68032a88E5A84678A77Af2CD65A7b3c0775a); //DAI - USD

    AggregatorV3Interface internal BAT_USD = AggregatorV3Interface(0x8e67A0CFfbbF6A346ce87DFe06daE2dc782b3219); //BAT - USD
    // AggregatorV3Interface internal COMP_USD = AggregatorV3Interface(); //COMP - USD
    AggregatorV3Interface internal LINK_USD = AggregatorV3Interface(0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0); //ChainLink - USD
    AggregatorV3Interface internal SNX_USD = AggregatorV3Interface(0x31f93DA9823d737b7E44bdee0DF389Fe62Fd1AcD); //SNX - USD
    // AggregatorV3Interface internal UNI_USD = AggregatorV3Interface(); //DAI - USD
    AggregatorV3Interface internal WBTC_USD = AggregatorV3Interface(0x6135b13325bfC4B00278B4abC5e20bbce2D6580e); //WBTC - USD

    AggregatorV3Interface internal ZRX_USD = AggregatorV3Interface(0x5813A90f826e16dB392abd2aF7966313fc1fd5B8); //ZRX - USD

    uint[24] public pricesList;
    bool initialized = false;
    uint public currentCLock;


    

    function getUnderlyingPrice(CToken cToken) public returns (uint) {
        
        if (!initialized) {
            initializePrices();
        }
        
        uint prev = currentCLock;
        currentCLock = prev + 1;
        if (currentCLock >= 24) {
            currentCLock = 0;
        }

        return pricesList[currentCLock];
    }


    function initializePrices() internal returns (bool){
        pricesList[0] = 1000000;
        pricesList[1] = 800000;
        pricesList[2] = 700000;
        pricesList[3] = 650000;
        pricesList[4] = 900000;
        pricesList[5] = 800000;
        pricesList[6] = 500000;
        pricesList[7] = 1000000;
        pricesList[8] = 1100000;
        pricesList[9] = 1150000;
        pricesList[10] = 900000;
        pricesList[11] = 850000;
        pricesList[12] = 750000;
        pricesList[13] = 720000;
        pricesList[14] = 700000;
        pricesList[15] = 620000;
        pricesList[16] = 1000000;
        pricesList[17] = 1500000;
        pricesList[18] = 1400000;
        pricesList[19] = 1200000;
        pricesList[20] = 1100000;
        pricesList[22] = 1400000;
        pricesList[23] = 900000;
        initialized = true;
        return initialized;
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }
}





        // // Return LINK price in USD
        // if (compareStrings(cToken.symbol(), "link")) {
        //     (uint80 roundID, int price,uint startedAt, uint timeStamp, uint80 answeredInRound) = LINK_USD.latestRoundData();
        //     return uint(price);
        // } 
        // else if (compareStrings(cToken.symbol(), "S-GSIGH")) {
        //     (uint80 roundID, int price,uint startedAt, uint timeStamp, uint80 answeredInRound) = GSIGH_USD.latestRoundData();
        //     return uint(price);
        // } 
        // else if (compareStrings(cToken.symbol(), "S-SIGH")) {
        //     (uint80 roundID, int price,uint startedAt, uint timeStamp, uint80 answeredInRound) = SIGH_USD.latestRoundData();
        //     return uint(price);
        // } 
        // // Return LINK price in ETH
        // else {
        //     (uint80 roundID, int price,uint startedAt, uint timeStamp, uint80 answeredInRound) = LINK_ETH.latestRoundData();
        //     return uint(price);
        // }

