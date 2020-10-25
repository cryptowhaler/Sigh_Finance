pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";

import "../../configuration/GlobalAddressesProvider.sol";
import "./LendingPoolCore.sol";
import "../IToken.sol";

/**
* @title FlowMechanismConfigurator contract
* @author SIGH Finance
* @notice Executes configuration methods on the LendingPoolCore contract, SIGHDistributionHandler and the SighStaking Contract
* to efficiently regulate the distribution economics
**/

contract FlowMechanismConfigurator is VersionedInitializable {

    using SafeMath for uint256;
    GlobalAddressesProvider public poolAddressesProvider;

// ######################
// ####### EVENTS #######
// ######################

    /**
    * @dev emitted when a instrument is initialized.
    * @param _instrument the address of the instrument
    * @param _iToken the address of the overlying iToken contract
    * @param _interestRateStrategyAddress the address of the interest rate strategy for the instrument
    **/
    event InstrumentInitialized( address indexed _instrument, address indexed _iToken, address _interestRateStrategyAddress );
    event InstrumentRemoved( address indexed _instrument);      // emitted when a instrument is removed.


// #############################
// ####### PROXY RELATED #######
// #############################

    uint256 public constant CONFIGURATOR_REVISION = 0x1;

    function getRevision() internal pure returns (uint256) {
        return CONFIGURATOR_REVISION;
    }

    function initialize(GlobalAddressesProvider _poolAddressesProvider) public initializer {
        poolAddressesProvider = _poolAddressesProvider;
    }

// ########################
// ####### MODIFIER #######
// ########################
    /**
    * @dev only the lending pool manager can call functions affected by this modifier
    **/
    modifier onlySIGHMechanismManager {
        require( poolAddressesProvider.getSIGHMechanismManager() == msg.sender, "The caller must be the SIGH Mechanism Manager" );
        _;
    }

// ################################################################################################
// ####### INITIALIZE A NEW INSTRUMENT (Deploys a new IToken Contract for the INSTRUMENT) #########
// ################################################################################################

    /**
    * @dev initializes an instrument
    * @param _instrument the address of the instrument to be initialized
    * @param _underlyingAssetDecimals the decimals of the instrument underlying asset
    * @param _interestRateStrategyAddress the address of the interest rate strategy contract for this instrument
    **/
    function initInstrument( address _instrument, uint8 _underlyingAssetDecimals, address _interestRateStrategyAddress ) external onlyLendingPoolManager {
        ERC20Detailed asset = ERC20Detailed(_instrument);

        string memory iTokenName = string(abi.encodePacked("SIGH's supported Instrument - ", asset.name()));
        string memory iTokenSymbol = string(abi.encodePacked("i", asset.symbol()));

        initInstrumentWithData(  _instrument,  iTokenName,  iTokenSymbol,  _underlyingAssetDecimals,  _interestRateStrategyAddress );
    }


}
