pragma solidity ^0.5.0;

/************
@title IPriceOracle interface
@notice Interface for the price oracle.*/
interface IPriceOracle {

// ##################################
// ######### VIEW FUNCTIONS #########
// ##################################

    function getAssetPrice(address _asset) external view returns (uint256);
    function getAssetPriceDecimals (address _asset) external view returns(uint8);
    function getSourceOfAsset(address _asset) external view returns(address);
    function getFallbackOracle() external view returns(address);

// #######################################################
// ######### CALLED BY LENDING POOL CONFIGURATOR #########
// #######################################################

    function supportNewAsset(address asset_, address source_) external;

    function setAssetSources(address[] calldata _assets, address[] calldata _sources) external;
    function setFallbackOracle(address _fallbackOracle) external;    

}
        