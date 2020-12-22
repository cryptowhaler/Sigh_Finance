pragma solidity ^0.5.0;
pragma experimental ABIEncoderV2;

import "../../configuration/IGlobalAddressesProvider.sol";
import "../interfaces/IStdReference.sol";
import "../interfaces/IPriceOracleGetter.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol"; 

/// @title ChainlinkProxyPriceProvider
/// @author Aave, SIGH Finance
/// @notice Proxy smart contract to get the price of an asset from a price source, with Chainlink Aggregator smart contracts as primary option
/// - If the returned price by a Chainlink aggregator is <= 0, the call is forwarded to a fallbackOracle

contract ChainlinkProxyPriceProvider is IPriceOracleGetter {

    IGlobalAddressesProvider public globalAddressesProvider;

    mapping(address => IStdReference) private assetsSources;
    IStdReference private fallbackOracle;

    event AssetSourceUpdated(address indexed asset, address indexed source);
    event FallbackOracleUpdated(address indexed fallbackOracle);

    modifier onlyLendingPoolManager {
        require(msg.sender == globalAddressesProvider.getLendingPoolManager(),"New Source / fallback oracle can only be set by the LendingPool Manager.");
        _;
    }

// #######################
// ##### CONSTRUCTOR #####
// #######################

    constructor( address globalAddressesProvider_ ) public {
        globalAddressesProvider = IGlobalAddressesProvider(globalAddressesProvider_);
    }

// ####################################
// ##### SET THE PRICEFEED SOURCE #####
// ####################################
    
    function supportNewAsset(address asset_, address source_) onlyLendingPoolManager public  {  // 
        address[] memory assets = new address[](1);
        address[] memory sources = new address[](1) ;
        assets[0] = asset_;
        sources[0] = source_;
        internalSetAssetsSources(assets,sources);
    }

    /// @notice External function called by the Aave governance to set or replace sources of assets
    /// @param _assets The addresses of the assets
    /// @param _sources The address of the source of each asset
    function setAssetSources(address[] calldata _assets, address[] calldata _sources) external onlyLendingPoolManager {
        internalSetAssetsSources(_assets, _sources);
    }

    /// @notice Sets the fallbackOracle
    /// - Callable only by the Aave governance
    /// @param _fallbackOracle The address of the fallbackOracle
    function setFallbackOracle(address _fallbackOracle) onlyLendingPoolManager external  {  // 
        internalSetFallbackOracle(_fallbackOracle);
    }

// ##############################
// ##### INTERNAL FUNCTIONS #####
// ##############################

    /// @notice Internal function to set the sources for each asset
    /// @param _assets The addresses of the assets
    /// @param _sources The address of the source of each asset
    function internalSetAssetsSources(address[] memory _assets, address[] memory _sources) internal {
        require(_assets.length == _sources.length, "INCONSISTENT_PARAMS_LENGTH");
        for (uint256 i = 0; i < _assets.length; i++) {
            assetsSources[_assets[i]] = IStdReference(_sources[i]);
            emit AssetSourceUpdated(_assets[i], _sources[i]);
        }
    }

    /// @notice Internal function to set the fallbackOracle
    /// @param _fallbackOracle The address of the fallbackOracle
    function internalSetFallbackOracle(address _fallbackOracle) internal {
        fallbackOracle = IStdReference(_fallbackOracle);
        emit FallbackOracleUpdated(_fallbackOracle);
    }

// ##########################
// ##### VIEW FUNCTIONS #####
// ##########################

    /// @notice Gets an asset price by address
    /// @param _asset The asset address
    function getAssetPrice(address _asset) public view returns(uint256) {
        IStdReference source = assetsSources[_asset];

        if (address(source) != address(0)) {                // If there is no registered source for the asset, call the fallbackOracle
            ERC20Detailed contract_ = ERC20Detailed(_asset);
            string memory tokenSymbol = contract_.symbol();
            if ( keccak256(abi.encodePacked(tokenSymbol))  == keccak256(abi.encodePacked('SIGH')) ) {
                tokenSymbol = 'DOT';
            }
            IStdReference.ReferenceData memory data = IStdReference(source).getReferenceData(tokenSymbol,'USD');
            return uint256(data.rate);
        }
    }
    
    function getAssetPriceDecimals (address _asset) external view returns(uint8) {
        return uint8(18);
    }

    /// @notice Gets a list of prices from a list of assets addresses
    /// @param _assets The list of assets addresses
    function getAssetsPrices(address[] calldata _assets) external view returns(uint256[] memory) {
        uint256[] memory prices = new uint256[](_assets.length);
        for (uint256 i = 0; i < _assets.length; i++) {
            prices[i] = getAssetPrice(_assets[i]);
        }
        return prices;
    }

    /// @notice Gets the address of the source for an asset address
    /// @param _asset The address of the asset
    /// @return address The address of the source
    function getSourceOfAsset(address _asset) external view returns(address) {
        return address(assetsSources[_asset]);
    }

    /// @notice Gets the address of the fallback oracle
    /// @return address The addres of the fallback oracle
    function getFallbackOracle() external view returns(address) {
        return address(fallbackOracle);
    }
}