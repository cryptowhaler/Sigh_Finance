pragma solidity ^0.5.6;

import "./IGlobalAddressesProvider.sol";
import "./AddressStorage.sol";
import "../openzeppelin-upgradeability/InitializableAdminUpgradeabilityProxy.sol";

/**
* @title GlobalAddressesProvider contract (Taken from Aave, Modified by SIGH Finance)
* @notice Is the main registry of the protocol. All the different components of the protocol are accessible
* through the addresses provider.
* @author Aave, SIGH Finance
**/


contract GlobalAddressesProvider is IGlobalAddressesProvider, AddressStorage {

    bool isSighInitialized = false;     // ADDED BY SIGH FINANCE

    //events
    event PendingSIGHFinanceManagerUpdated( address _pendingSighFinanceManager );           
    event SIGHFinanceManagerUpdated( _sighFinanceManager );    
    event PendingLendingPoolManagerUpdated( address _pendingLendingPoolManager );
    event LendingPoolManagerUpdated( address _lendingPoolManager );   

    event LendingPoolConfiguratorUpdated(address indexed newAddress);
    event LendingPoolUpdated(address indexed newAddress);
    event LendingPoolCoreUpdated(address indexed newAddress);
    event LendingPoolParametersProviderUpdated(address indexed newAddress);
    event LendingPoolLiquidationManagerUpdated(address indexed newAddress);
    event LendingPoolDataProviderUpdated(address indexed newAddress);
    event LendingRateOracleUpdated(address indexed newAddress);
    event FeeProviderUpdated(address indexed newAddress);

    event SIGHFinanceConfiguratorUpdated(address indexed sighFinanceConfigAddress)       // ADDED BY SIGH FINANCE
    event SIGHAddressUpdated(address indexed sighAddress);                               // ADDED BY SIGH FINANCE
    event SIGHMechanismHandlerImplUpdated(address indexed newAddress);                   // ADDED BY SIGH FINANCE
    event SIGHTreasuryImplUpdated(address indexed newAddress);                           // ADDED BY SIGH FINANCE
    event SIGHStakingImplUpdated(address indexed SIGHStakingAddress);                    // ADDED BY SIGH FINANCE

    event EthereumAddressUpdated(address indexed newAddress);
    event PriceOracleUpdated(address indexed newAddress);
    event TokenDistributorUpdated(address indexed newAddress);

    event ProxyCreated(bytes32 id, address indexed newAddress);

    bytes32 private constant LENDING_POOL_MANAGER = "LENDING_POOL_MANAGER";                         // MULTISIG ACCOUNT WHICH CONTROLS THE UPDATES TO THE LENDINGPOOL 
    bytes32 private constant PENDING_LENDING_POOL_MANAGER = "PENDING_LENDING_POOL_MANAGER";         // MULTISIG ACCOUNT WHICH CONTROLS THE UPDATES TO THE LENDINGPOOL (CHANGING MECHANISM)
    bytes32 private constant SIGH_FINANCE_MANAGER = "SIGH_FINANCE_MANAGER";                         // MULTISIG ACCOUNT WHICH CONTROLS THE UPDATES TO THE SIGH FINANCE 
    bytes32 private constant PENDING_SIGH_FINANCE_MANAGER = "PENDING_SIGH_FINANCE_MANAGER";         // MULTISIG ACCOUNT WHICH CONTROLS THE UPDATES TO THE SIGH FINANCE (CHANGING MECHANISM)

    bytes32 private constant LENDING_POOL_CONFIGURATOR = "LENDING_POOL_CONFIGURATOR";       // CONTROLLED BY LENDINGPOOL MANAGER. MAKES STATE CHANGES RELATED TO LENDING PROTOCOL
    bytes32 private constant SIGH_FINANCE_CONFIGURATOR = "SIGH_FINANCE_CONFIGURATOR";       // CONTROLLED BY SIGHFINANCE MANAGER. MAKES STATE CHANGES RELATED TO SIGH FINANCE

    bytes32 private constant LENDING_POOL_CORE = "LENDING_POOL_CORE";
    bytes32 private constant LENDING_POOL = "LENDING_POOL";
    bytes32 private constant LENDING_POOL_LIQUIDATION_MANAGER = "LIQUIDATION_MANAGER";
    bytes32 private constant LENDING_POOL_PARAMETERS_PROVIDER = "PARAMETERS_PROVIDER";
    bytes32 private constant LENDING_POOL_FLASHLOAN_PROVIDER = "FLASHLOAN_PROVIDER";
    bytes32 private constant DATA_PROVIDER = "DATA_PROVIDER";
    bytes32 private constant LENDING_RATE_ORACLE = "LENDING_RATE_ORACLE";
    bytes32 private constant FEE_PROVIDER = "FEE_PROVIDER";
    bytes32 private constant WALLET_BALANCE_PROVIDER = "WALLET_BALANCE_PROVIDER";

    bytes32 private constant SIGH = "SIGH";                                             // ADDED BY SIGH FINANCE
    bytes32 private constant SIGH_MECHANISM_HANDLER = "SIGH_MECHANISM_HANDLER";         // ADDED BY SIGH FINANCE
    bytes32 private constant SIGH_TREASURY = "SIGH_TREASURY";                           // ADDED BY SIGH FINANCE
    bytes32 private constant SIGH_STAKING = "SIGH_STAKING";                             // ADDED BY SIGH FINANCE

    bytes32 private constant PRICE_ORACLE = "PRICE_ORACLE";
    bytes32 private constant ETHEREUM_ADDRESS = "ETHEREUM_ADDRESS";

    bytes32 private constant TOKEN_DISTRIBUTOR = "TOKEN_DISTRIBUTOR";

// ################################                                                  
// ######  CONSTRUCTOR ############                                                
// ################################                                                     

    constructor(address SIGHFinanceManagerAddress, address LendingPoolManagerAddress) public {
        _setAddress(SIGH_FINANCE_MANAGER, SIGHFinanceManagerAddress);
        _setAddress(LENDING_POOL_MANAGER, LendingPoolManagerAddress);
    }

// ################################                                                  
// #########  MODIFIERS ###########                                              
// ################################  

    modifier onlySIGHFinanceManager {
        address sighFinanceManager =  getAddress(SIGH_FINANCE_MANAGER);
        require( sighFinanceManager == msg.sender, "The caller must be the SIGH FINANCE Manager" );
        _;
    }  

    modifier onlyLendingPoolManager {
        address LendingPoolManager =  getAddress(LENDING_POOL_MANAGER);
        require( LendingPoolManager == msg.sender, "The caller must be the Lending Protocol Manager" );
        _;
    } 

// ########################################################################################                                                   
// #########  PROTOCOL MANAGERS ( LendingPool Manager and SighFinance Manager ) ###########                                              
// ########################################################################################

    function getLendingPoolManager() public view returns (address) {                            // ADDED BY SIGH FINANCE
        return getAddress(LENDING_POOL_MANAGER);
    }

    function getPendingLendingPoolManager() public view returns (address) {                     // ADDED BY SIGH FINANCE
        return getAddress(PENDING_LENDING_POOL_MANAGER);
    }

    function setPendingLendingPoolManager(address _pendinglendingPoolManager) public onlyLendingPoolManager {                   // ADDED BY SIGH FINANCE
        _setAddress(PENDING_LENDING_POOL_MANAGER, _pendinglendingPoolManager);
        emit PendingLendingPoolManagerUpdated(_pendinglendingPoolManager);
    }

    function acceptLendingPoolManager() public {                                                                                 // ADDED BY SIGH FINANCE
        address pendingLendingPoolManager = getAddress(PENDING_LENDING_POOL_MANAGER);
        require(msg.sender == pendingLendingPoolManager, "Only the Pending Lending Pool Manager can call this function to be accepted to become the Lending Pool Manager");
        _setAddress(LENDING_POOL_MANAGER, pendingLendingPoolManager);
        _setAddress(PENDING_LENDING_POOL_MANAGER, address(0));
        emit PendingLendingPoolManagerUpdated( getAddress(PENDING_LENDING_POOL_MANAGER) );
        emit LendingPoolManagerUpdated( getAddress(LENDING_POOL_MANAGER) );
    }

    function getSIGHFinanceManager() public view returns (address) {                               // ADDED BY SIGH FINANCE
        return getAddress(SIGH_FINANCE_MANAGER);
    }

    function getPendingSIGHFinanceManager() public view returns (address) {                        // ADDED BY SIGH FINANCE
        return getAddress(PENDING_SIGH_FINANCE_MANAGER);
    }

    function setPendingSIGHFinanceManager(address _PendingSIGHFinanceManager) public onlySIGHFinanceManager {     // ADDED BY SIGH FINANCE
        _setAddress(PENDING_SIGH_FINANCE_MANAGER, _PendingSIGHFinanceManager);
        emit PendingSIGHFinanceManagerUpdated(_PendingSIGHFinanceManager);
    }

    function acceptSIGHFinanceManager() public {                                                                   // ADDED BY SIGH FINANCE
        address _PendingSIGHFinanceManager = getAddress(PENDING_SIGH_FINANCE_MANAGER);
        require(msg.sender == _PendingSIGHFinanceManager, "Only the Pending SIGH Finance Manager can call this function to be accepted to become the SIGH Finance Manager");
        _setAddress(SIGH_FINANCE_MANAGER, _PendingSIGHFinanceManager);
        _setAddress(PENDING_SIGH_FINANCE_MANAGER, address(0));
        emit PendingSIGHFinanceManagerUpdated( getAddress(PENDING_SIGH_FINANCE_MANAGER) );
        emit SIGHFinanceManagerUpdated( getAddress(SIGH_FINANCE_MANAGER) );
    }


// #########################################################################
// ####___________ LENDING POOL PROTOCOL CONTRACTS _____________############
// ########## 1. LendingPoolConfigurator (Upgradagble) #####################
// ########## 2. LendingPoolCore (Upgradagble) #############################
// ########## 3. LendingPool (Upgradagble) #################################
// ########## 4. LendingPoolDataProvider (Upgradagble) #####################
// ########## 5. LendingPoolParametersProvider (Upgradagble) ###############
// ########## 6. FeeProvider (Upgradagble) #################################
// ########## 7. LendingPoolLiquidationManager (Directly Changed) ##########
// ########## 8. LendingRateOracle (Directly Changed) ######################
// #########################################################################


// ############################################
// ######  LendingPoolConfigurator proxy ######
// ############################################

    /**
    * @dev returns the address of the LendingPoolConfigurator proxy
    * @return the lending pool configurator proxy address
    **/
    function getLendingPoolConfigurator() public view returns (address) {
        return getAddress(LENDING_POOL_CONFIGURATOR);
    }
     
    /**
    * @dev updates the implementation of the lending pool configurator
    * @param _configurator the new lending pool configurator implementation
    **/
    function setLendingPoolConfiguratorImpl(address _configurator) public onlyLendingPoolManager {
        updateImplInternal(LENDING_POOL_CONFIGURATOR, _configurator);
        emit LendingPoolConfiguratorUpdated(_configurator);
    }

// ####################################
// ######  LendingPoolCore proxy ######
// ####################################

    /**
    * @dev returns the address of the LendingPoolCore proxy
    * @return the lending pool core proxy address
     */
    function getLendingPoolCore() public view returns (address payable) {
        address payable core = address(uint160(getAddress(LENDING_POOL_CORE)));
        return core;
    }

    /**
    * @dev updates the implementation of the lending pool core
    * @param _lendingPoolCore the new lending pool core implementation
    **/
    function setLendingPoolCoreImpl(address _lendingPoolCore) public onlyLendingPoolManager {
        updateImplInternal(LENDING_POOL_CORE, _lendingPoolCore);
        emit LendingPoolCoreUpdated(_lendingPoolCore);
    }

// ################################
// ######  LendingPool proxy ######
// ################################
    /**
    * @dev returns the address of the LendingPool proxy
    * @return the lending pool proxy address
    **/
    function getLendingPool() public view returns (address) {
        return getAddress(LENDING_POOL);
    }


    /**
    * @dev updates the implementation of the lending pool
    * @param _pool the new lending pool implementation
    **/
    function setLendingPoolImpl(address _pool) public onlyLendingPoolManager {
        updateImplInternal(LENDING_POOL, _pool);
        emit LendingPoolUpdated(_pool);
    }


// ############################################
// ######  LendingPoolDataProvider proxy ######
// ############################################

    /**
    * @dev returns the address of the LendingPoolDataProvider proxy
    * @return the lending pool data provider proxy address
     */
    function getLendingPoolDataProvider() public view returns (address) {
        return getAddress(DATA_PROVIDER);
    }

    /**
    * @dev updates the implementation of the lending pool data provider
    * @param _provider the new lending pool data provider implementation
    **/
    function setLendingPoolDataProviderImpl(address _provider) public onlyLendingPoolManager {
        updateImplInternal(DATA_PROVIDER, _provider);
        emit LendingPoolDataProviderUpdated(_provider);
    }

// ##################################################
// ######  LendingPoolParametersProvider proxy ######
// ##################################################
    /**
    * @dev returns the address of the LendingPoolParametersProvider proxy
    * @return the address of the Lending pool parameters provider proxy
    **/
    function getLendingPoolParametersProvider() public view returns (address) {
        return getAddress(LENDING_POOL_PARAMETERS_PROVIDER);
    }

    /**
    * @dev updates the implementation of the lending pool parameters provider
    * @param _parametersProvider the new lending pool parameters provider implementation
    **/
    function setLendingPoolParametersProviderImpl(address _parametersProvider) public onlyLendingPoolManager {
        updateImplInternal(LENDING_POOL_PARAMETERS_PROVIDER, _parametersProvider);
        emit LendingPoolParametersProviderUpdated(_parametersProvider);
    }

// ###################################
// ######  getFeeProvider proxy ######
// ###################################
    /**
    * @dev returns the address of the FeeProvider proxy
    * @return the address of the Fee provider proxy
    **/
    function getFeeProvider() public view returns (address) {
        return getAddress(FEE_PROVIDER);
    }

    /**
    * @dev updates the implementation of the FeeProvider proxy
    * @param _feeProvider the new lending pool fee provider implementation
    **/
    function setFeeProviderImpl(address _feeProvider) public onlyLendingPoolManager {
        updateImplInternal(FEE_PROVIDER, _feeProvider);
        emit FeeProviderUpdated(_feeProvider);
    }

// ##################################################
// ######  LendingPoolLiquidationManager ######
// ##################################################
    /**
    * @dev returns the address of the LendingPoolLiquidationManager. Since the manager is used
    * through delegateCall within the LendingPool contract, the proxy contract pattern does not work properly hence
    * the addresses are changed directly.
    * @return the address of the Lending pool liquidation manager
    **/

    function getLendingPoolLiquidationManager() public view returns (address) {
        return getAddress(LENDING_POOL_LIQUIDATION_MANAGER);
    }

    /**
    * @dev updates the address of the Lending pool liquidation manager
    * @param _manager the new lending pool liquidation manager address
    **/
    function setLendingPoolLiquidationManager(address _manager) public onlyLendingPoolManager {
        _setAddress(LENDING_POOL_LIQUIDATION_MANAGER, _manager);
        emit LendingPoolLiquidationManagerUpdated(_manager);
    }

// ##################################################
// ######  LendingRateOracle ##################
// ##################################################

    function getLendingRateOracle() public view returns (address) {
        return getAddress(LENDING_RATE_ORACLE);
    }

    function setLendingRateOracle(address _lendingRateOracle) public onlyLendingPoolManager {
        _setAddress(LENDING_RATE_ORACLE, _lendingRateOracle);
        emit LendingRateOracleUpdated(_lendingRateOracle);
    }




// ####################################################################################
// ####___________ SIGH FINANCE RELATED CONTRACTS _____________########################
// ########## 1. SIGH (Initialized only once) #########################################
// ########## 2. SIGHFinanceConfigurator (Upgradagble) ################################
// ########## 2. SIGHTreasury (Upgradagble) ###########################################
// ########## 3. SIGHMechanismHandler (Upgradagble) ###################################
// ########## 3. SIGHMechanismHandler (Upgradagble) ###################################
// ####################################################################################

// ################################                                                     // ADDED BY SIGH FINANCE
// ######  SIGH ADDRESS ###########                                                     // ADDED BY SIGH FINANCE
// ################################                                                     // ADDED BY SIGH FINANCE

    function getSIGHAddress() public view returns (address) {
        return getAddress(SIGH);
    }

    function setSIGHAddress(address sighAddress) public onlySIGHFinanceManager {     // LATER CHANGE TO MAKE IT INITIALIZABLE ONLY ONCE
        // require (!isSighInitialized, "SIGH Instrument address can only be initialized once.");
        isSighInitialized  = true;
        _setAddress(SIGH, sighAddress);
        emit SIGHAddressUpdated(sighAddress);
    }

// ############################################
// ######  SIGHFinanceConfigurator proxy ######
// ############################################

    /**
    * @dev returns the address of the SIGHFinanceConfigurator proxy
    * @return the SIGH Finance configurator proxy address
    **/
    function getSIGHFinanceConfigurator() public view returns (address) {
        return getAddress(SIGH_FINANCE_CONFIGURATOR);
    }
     
    /**
    * @dev updates the implementation of the lending pool configurator
    * @param _configurator the new lending pool configurator implementation
    **/
    function setSIGHFinanceConfiguratorImpl(address _configurator) public onlySIGHFinanceManager {
        updateImplInternal(SIGH_FINANCE_CONFIGURATOR, _configurator);
        emit SIGHFinanceConfiguratorUpdated(_configurator);
    }


// #################################  ADDED BY SIGH FINANCE 
// ######  SIGHTreasury proxy ######  ADDED BY SIGH FINANCE
// #################################  ADDED BY SIGH FINANCE 

    function getSIGHTreasury() public view returns (address) {
        return getAddress(SIGH_TREASURY);
    }

    /**
    * @dev updates the address of the SIGH Treasury Contract
    * @param _SIGHTreasury the new SIGH Treasury Contract address
    **/
    function setSIGHTreasuryImpl(address _SIGHTreasury) public onlySIGHFinanceManager {   
        updateImplInternal(SIGH_TREASURY, _SIGHTreasury);
        emit SIGHTreasuryImplUpdated(_SIGHTreasury);
    }

// #############################################  ADDED BY SIGH FINANCE 
// ######  SIGHMechanismHandler proxy #######     ADDED BY SIGH FINANCE
// #############################################  ADDED BY SIGH FINANCE 

    function getSIGHMechanismHandler() public view returns (address) {
        return getAddress(SIGH_MECHANISM_HANDLER);
    }

    /**
    * @dev updates the address of the SIGH Distribution Handler Contract (Manages the SIGH Speeds)
    * @param _SIGHMechanismHandler the new SIGH Distribution Handler (Impl) Address
    **/
    function setSIGHMechanismHandlerImpl(address _SIGHMechanismHandler) public onlySIGHFinanceManager  {   
        updateImplInternal(SIGH_MECHANISM_HANDLER, _SIGHMechanismHandler);
        emit SIGHMechanismHandlerImplUpdated(_SIGHMechanismHandler);
    }

// #############################################  ADDED BY SIGH FINANCE 
// ######  SIGHStaking proxy ###################  ADDED BY SIGH FINANCE
// #############################################  ADDED BY SIGH FINANCE 

    function getSIGHStaking() public view returns (address) {
        return getAddress(SIGH_STAKING);
    }

    /**
    * @dev updates the address of the SIGH Distribution Handler Contract (Manages the SIGH Speeds)
    * @param _SIGHStaking the new lending pool liquidation manager address
    **/
    function setSIGHStakingImpl(address _SIGHStaking) public onlySIGHFinanceManager  { 
        updateImplInternal(SIGH_STAKING, _SIGHStaking);
        emit SIGHStakingImplUpdated(_SIGHStaking);
    }

// ###################################################################################   
// ######  THESE CONTRACTS ARE NOT USING PROXY SO ADDRESS ARE DIRECTLY UPDATED #######  
// ###################################################################################

    /**
    * @dev the functions below are storing specific addresses that are outside the context of the protocol
    * hence the upgradable proxy pattern is not used
    **/

    function getPriceOracle() public view returns (address) {
        return getAddress(PRICE_ORACLE);
    }

    function setPriceOracle(address _priceOracle) public onlyLendingPoolManager {
        _setAddress(PRICE_ORACLE, _priceOracle);
        emit PriceOracleUpdated(_priceOracle);
    }
        

// ############################################# 
// ######  FUNCTION TO UPGRADE THE PROXY #######  
// #############################################  

    /**
    * @dev internal function to update the implementation of a specific component of the protocol
    * @param _id the id of the contract to be updated
    * @param _newAddress the address of the new implementation
    **/
    function updateImplInternal(bytes32 _id, address _newAddress) internal {
        address payable proxyAddress = address(uint160(getAddress(_id)));

        InitializableAdminUpgradeabilityProxy proxy = InitializableAdminUpgradeabilityProxy(proxyAddress);
        bytes memory params = abi.encodeWithSignature("initialize(address)", address(this));            // initialize function is called in the new implementation contract

        if (proxyAddress == address(0)) {
            proxy = new InitializableAdminUpgradeabilityProxy();
            proxy.initialize(_newAddress, address(this), params);
            _setAddress(_id, address(proxy));
            emit ProxyCreated(_id, address(proxy));
        } else {
            proxy.upgradeToAndCall(_newAddress, params);
        }

    }
}
