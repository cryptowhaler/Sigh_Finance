pragma solidity ^0.5.0;

// import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";
import "../../openzeppelin-upgradeability/InitializableAdminUpgradeabilityProxy.sol";
import "../../configuration/GlobalAddressesProvider.sol";
// import "../IToken.sol";
// import "../SighStream.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "../interfaces/ILendingPoolCore.sol";
import "../interfaces/ILendingPool.sol";


/**
* @title LendingPoolConfigurator contract
* @author Aave, SIGH Finance (modified by SIGH FINANCE)
* @notice Executes configuration methods on the LendingPoolCore contract. Allows to enable/disable instruments,
* and set different protocol parameters.
**/

contract LendingPoolConfigurator is VersionedInitializable  {

    // using SafeMath for uint256;
    IGlobalAddressesProvider public globalAddressesProvider;
    
    mapping (address => address) private sighStreamProxies;
// ######################
// ####### EVENTS #######
// ######################

    /**
    * @dev emitted when a instrument is initialized.
    * @param _instrument the address of the instrument
    * @param _iToken the address of the overlying iToken contract
    * @param _interestRateStrategyAddress the address of the interest rate strategy for the instrument
    **/
    event InstrumentInitialized( address indexed _instrument, address indexed _iToken, address _interestRateStrategyAddress, address sighStreamAddress, address sighStreamImplAddress );
    event InstrumentRemoved( address indexed _instrument);      // emitted when a instrument is removed.

    event BorrowingOnInstrumentSwitched(address indexed _instrument, bool switch_ );     
    event StableRateOnInstrumentSwitched(address indexed _instrument, bool isEnabled);          // emitted when stable rate borrowing is switched on a instrument
    event InstrumentActivationSwitched(address indexed _instrument, bool switch_ );           
    event InstrumentFreezeSwitched(address indexed _instrument, bool isFreezed);                      // emitted when a instrument is freezed    

    /**
    * @dev emitted when a instrument is enabled as collateral.
    * @param _instrument the address of the instrument
    * @param _ltv the loan to value of the asset when used as collateral
    * @param _liquidationThreshold the threshold at which loans using this asset as collateral will be considered undercollateralized
    * @param _liquidationBonus the bonus liquidators receive to liquidate this asset
    **/
    event InstrumentEnabledAsCollateral(  address indexed _instrument,  uint256 _ltv,  uint256 _liquidationThreshold,  uint256 _liquidationBonus );    
    event InstrumentDisabledAsCollateral(address indexed _instrument);         // emitted when a instrument is disabled as collateral


    event InstrumentCollateralParametersUpdated(address _instrument,uint256 _ltv,  uint256 _liquidationThreshold,  uint256 _liquidationBonus );     
    event InstrumentInterestRateStrategyChanged(address _instrument, address _strategy);      // emitted when a _instrument interest strategy contract is updated
    event InstrumentDecimalsUpdated(address _instrument,uint256 decimals);

    event sighStreamImplUpdated(address instrumentAddress,address newSighStreamImpl );
    event ProxyCreated(address instrument, address  sighStreamProxyAddress);
    
// #############################
// ####### PROXY RELATED #######
// #############################

    uint256 public constant CONFIGURATOR_REVISION = 0x2;

    function getRevision() internal pure returns (uint256) {
        return CONFIGURATOR_REVISION;
    }

    function initialize(IGlobalAddressesProvider _globalAddressesProvider) public initializer {
        globalAddressesProvider = _globalAddressesProvider;
    }

// ########################
// ####### MODIFIER #######
// ########################
    /**
    * @dev only the lending pool manager can call functions affected by this modifier
    **/
    modifier onlyLendingPoolManager {
        require( globalAddressesProvider.getLendingPoolManager() == msg.sender, "The caller must be a lending pool manager" );
        _;
    }

// ################################################################################################
// ####### INITIALIZE A NEW INSTRUMENT (Deploys a new IToken Contract for the INSTRUMENT) #########
// ################################################################################################

    /**
    * @dev initializes an instrument
    * @param _instrument the address of the instrument to be initialized
    * @param _interestRateStrategyAddress the address of the interest rate strategy contract for this instrument
    **/
    function initInstrument( address _instrument, address iTokenInstance,  address _interestRateStrategyAddress, address sighStreamImplAddress) external onlyLendingPoolManager {
        ERC20Detailed asset = ERC20Detailed(_instrument);

        // string memory iTokenName = string(abi.encodePacked(" Yield Farming Instrument - ", asset.name()));
        // string memory iTokenSymbol = string(abi.encodePacked("I-", asset.symbol()));
        uint8 decimals = uint8(asset.decimals());

        // Deploying IToken And Sigh Stream Contracts
        // IToken iTokenInstance = new IToken( address(globalAddressesProvider), _instrument, decimals, iTokenName, iTokenSymbol ); // DEPLOYS A NEW ITOKEN CONTRACT
        // SighStream sighStreamInstance = new SighStream();

        // creates a Proxy for the SIGH Stream Contract
        setSighStreamImplInternal(sighStreamImplAddress, _instrument, iTokenInstance );

        address sighStreamProxy = sighStreamProxies[_instrument];

        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.initInstrument( _instrument, iTokenInstance, decimals, _interestRateStrategyAddress, sighStreamProxy );

        emit InstrumentInitialized( _instrument, iTokenInstance, _interestRateStrategyAddress,  sighStreamProxy, sighStreamImplAddress  );
    }

// ###################################################################################################
// ####### FUNCTIONS WHICH INTERACT WITH LENDINGPOOLCORE CONTRACT ####################################
// ####### --> removeInstrument() : REMOVE INSTRUMENT    #####################################
// ####### --> instrumentActivationSwitch()      :      INSTRUMENT ACTIVATION SWITCH ################################
// ####### --> instrumentBorrowingSwitch()   :   BORROWING SWITCH  #################################
// ####### --> instrumentStableBorrowRateSwitch()    :     STABLE BORROW RATE SWITCH  ################
// ####### --> enableInstrumentAsCollateral()    :   COLLATERAL RELATED  ##############################
// ####### --> disableInstrumentAsCollateral()   :   COLLATERAL RELATED  ##############################
// ####### --> instrumentFreezeSwitch()     :      FREEZE INSTRUMENT SWITCH #######################################
// ####### --> setInstrumentCollateralParameters()    :   SETTING COLLATERAL VARIABLES : [LTV, Liquidation Threshold, Liquidation Bonus]  ###########################
// ####### --> setInstrumentDecimals()               :   SETTING VARIABLES  ###########################
// ####### --> setInstrumentInterestRateStrategyAddress()     : SETTING INTEREST RATE STRATEGY  #######
// ####### --> refreshLendingPoolCoreConfiguration()   :   REFRESH THE ADDRESS OF CORE  ###############
// ###################################################################################################

    // function removeInstrument( address _instrument ) external onlyLendingPoolManager {
    //     ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
    //     require(core.removeInstrument( _instrument ),"Failed to remove instrument" );
    //     emit InstrumentRemoved( _instrument );
    // }

    /**
    * @dev activates/deactivates a _instrument
    * @param _instrument the address of the _instrument
    * @param switch_  true / false to activate / deactivate
    **/
    function instrumentActivationSwitch(address _instrument, bool switch_) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.InstrumentActivationSwitch(_instrument, switch_);
        emit InstrumentActivationSwitched(_instrument, switch_);
    }

    /**
    * @dev enables borrowing on a instrument
    * @param _instrument the address of the instrument
    * @param borrowRateSwitch true if stable borrow rate needs to be enabled & false if it needs to be disabled
    **/
    function instrumentBorrowingSwitch(address _instrument, bool borrowRateSwitch) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
            core.borrowingOnInstrumentSwitch(_instrument, borrowRateSwitch );
            emit BorrowingOnInstrumentSwitched(_instrument, borrowRateSwitch);
    }

    /**
    * @dev switch stable rate borrowing on a instrument
    * @param _instrument the address of the instrument
    * @param switchStableBorrowRate true / false to enable / disable
    **/
    function instrumentStableBorrowRateSwitch(address _instrument,bool switchStableBorrowRate) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.instrumentStableBorrowRateSwitch(_instrument, switchStableBorrowRate);
        emit StableRateOnInstrumentSwitched(_instrument, switchStableBorrowRate);        
    }

    /**
    * @dev enables a instrument to be used as collateral
    * @param _instrument the address of the instrument
    * @param _baseLTVasCollateral the loan to value of the asset when used as collateral
    * @param _liquidationThreshold the threshold at which loans using this asset as collateral will be considered undercollateralized
    * @param _liquidationBonus the bonus liquidators receive to liquidate this asset
    **/
    function enableInstrumentAsCollateral( address _instrument, uint256 _baseLTVasCollateral, uint256 _liquidationThreshold, uint256 _liquidationBonus ) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.enableInstrumentAsCollateral( _instrument, _baseLTVasCollateral, _liquidationThreshold, _liquidationBonus );
        emit InstrumentEnabledAsCollateral( _instrument, _baseLTVasCollateral, _liquidationThreshold, _liquidationBonus );
    }

    /**
    * @dev disables a instrument as collateral
    * @param _instrument the address of the instrument
    **/
    function disableInstrumentAsCollateral(address _instrument) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.disableInstrumentAsCollateral(_instrument);
        emit InstrumentDisabledAsCollateral(_instrument);
    }

    /**
    * @dev freezes an _instrument. A freezed _instrument doesn't accept any new deposit, borrow or rate swap, but can accept repayments, liquidations, rate rebalances and redeems
    * @param _instrument the address of the _instrument
    **/
    function instrumentFreezeSwitch(address _instrument, bool switch_) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.InstrumentFreezeSwitch(_instrument, switch_);
        emit InstrumentFreezeSwitched(_instrument,switch_);
    }


    /**
    * @dev emitted when a _instrument loan to value is updated
    * @param _instrument the address of the _instrument
    * @param _ltv the new value for the loan to value
    **/
    function setInstrumentCollateralParameters(address _instrument, uint256 _ltv, uint256 _threshold, uint256 _bonus) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.updateInstrumentCollateralParameters(_instrument, _ltv, _threshold, _bonus);
        emit InstrumentCollateralParametersUpdated(_instrument, _ltv, _threshold, _bonus);
    }


    /**
    * @dev sets the interest rate strategy of a _instrument
    * @param _instrument the address of the _instrument
    * @param _rateStrategyAddress the new address of the interest strategy contract
    **/
    function setInstrumentInterestRateStrategyAddress(address _instrument, address _rateStrategyAddress) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.setInstrumentInterestRateStrategyAddress(_instrument, _rateStrategyAddress);
        emit InstrumentInterestRateStrategyChanged(_instrument, _rateStrategyAddress);
    }
    
    function setInstrumentDecimals(address _instrument, uint decimals) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.setInstrumentDecimals(_instrument, decimals);
        emit InstrumentDecimalsUpdated(_instrument, decimals);
    }
    

    // refreshes the lending pool core configuration to update the cached address
    function refreshLendingPoolCoreConfiguration() external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        core.refreshConfiguration();
    }

//   // refreshes the lending pool configuration to update the cached address
    function refreshLendingPoolConfiguration() external onlyLendingPoolManager {
        ILendingPool lendingPool = ILendingPool(globalAddressesProvider.getLendingPool());
        lendingPool.refreshConfig();
    }

//   // Changes SIGH Stream Contract For an Instrument
    function updateSIGHStreamForInstrument(  address newSighStreamImpl, address instrumentAddress, address iTokenAddress) external onlyLendingPoolManager {
        ILendingPoolCore core = ILendingPoolCore(globalAddressesProvider.getLendingPoolCore());
        require(core.getInstrumentITokenAddress(instrumentAddress) == iTokenAddress,"Wrong instrument - IToken addresses provided");
        updateSighStreamImplInternal(newSighStreamImpl,instrumentAddress,iTokenAddress);
        emit sighStreamImplUpdated(instrumentAddress,newSighStreamImpl );
    }

    function getSighStreamAddress(address instrumentAddress) external returns (address sighStreamProxyAddress) {
        return sighStreamProxies[instrumentAddress];
    }

// ############################################# 
// ######  FUNCTION TO UPGRADE THE PROXY #######  
// #############################################  

    function setSighStreamImplInternal( address _sighStreamAddress, address instrumentAddress, address iTokenAddress ) internal {

        bytes memory params = abi.encodeWithSignature("initialize(address,address,address)", address(globalAddressesProvider),instrumentAddress,iTokenAddress );            // initialize function is called in the new implementation contract
        InitializableAdminUpgradeabilityProxy proxy = new InitializableAdminUpgradeabilityProxy();
        proxy.initialize(_sighStreamAddress, address(this), params); 
        sighStreamProxies[instrumentAddress] = address(proxy);
        emit ProxyCreated(instrumentAddress, address(proxy));
    }    

    function updateSighStreamImplInternal(address _sighStreamAddress, address instrumentAddress, address iTokenAddress ) internal {
        // Proxy Contract Address
        address payable proxyAddress = address(uint160(sighStreamProxies[instrumentAddress] ));
        InitializableAdminUpgradeabilityProxy proxy = InitializableAdminUpgradeabilityProxy(proxyAddress);
        bytes memory params = abi.encodeWithSignature("initialize(address,address,address)", address(globalAddressesProvider),instrumentAddress,iTokenAddress );            // initialize function is called in the new implementation contract
        proxy.upgradeToAndCall(_sighStreamAddress, params);
    }    


}
