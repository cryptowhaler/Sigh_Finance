pragma solidity ^0.5.0;

import "./interfaces/ILendingRateOracle.sol";
import "../Configuration/IGlobalAddressesProvider.sol";


contract LendingRateOracle is ILendingRateOracle {
    
    IGlobalAddressesProvider private globalAddressesProvider;
    mapping(address => uint256) borrowRates;
    mapping(address => uint256) liquidityRates;
    
    modifier onlyLendingPoolManager {
        require(msg.sender == globalAddressesProvider.getLendingPoolManager(),"Only Lending Pool Manager can call this function"); 
        _;
    }
        
    constructor(address _globalAddressesProvider) public {
        globalAddressesProvider = IGlobalAddressesProvider(_globalAddressesProvider);
    }

    function getMarketBorrowRate(address _asset) external view returns(uint256) {
        return borrowRates[_asset];
    }

    function setMarketBorrowRate(address _asset, uint256 _rate) onlyLendingPoolManager external {
        borrowRates[_asset] = _rate;
    }

    function getMarketLiquidityRate(address _asset) external view returns(uint256) {
        return liquidityRates[_asset];
    }

    function setMarketLiquidityRate(address _asset, uint256 _rate) onlyLendingPoolManager external {
        liquidityRates[_asset] = _rate;
    }
}