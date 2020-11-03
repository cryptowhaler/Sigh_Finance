pragma solidity ^0.5.6;

/**
@title GlobalAddressesProvider interface
@notice provides the interface to fetch the LendingPoolCore address
 */

interface IGlobalAddressesProvider  {
    
// ########################################################################################                                                   
// #########  PROTOCOL MANAGERS ( LendingPool Manager and SighFinance Manager ) ###########                                              
// ########################################################################################

    function getLendingPoolManager() public view returns (address);
    function getPendingLendingPoolManager() public view returns (address);

    function setPendingLendingPoolManager(address _pendinglendingPoolManager) public;    
    function acceptLendingPoolManager() public;    

    function getSIGHFinanceManager() public view returns (address);
    function getPendingSIGHFinanceManager() public view returns (address);

    function setPendingSIGHFinanceManager(address _PendingSIGHFinanceManager) public;    
    function acceptSIGHFinanceManager() public;    

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

    function getLendingPoolConfigurator() public view returns (address);
    function setLendingPoolConfiguratorImpl(address _configurator) public;

    function getLendingPoolCore() public view returns (address payable);
    function setLendingPoolCoreImpl(address _lendingPoolCore) public;

    function getLendingPool() public view returns (address);
    function setLendingPoolImpl(address _pool) public;

    function getLendingPoolDataProvider() public view returns (address);
    function setLendingPoolDataProviderImpl(address _provider) public;

    function getLendingPoolParametersProvider() public view returns (address);
    function setLendingPoolParametersProviderImpl(address _parametersProvider) public;

    function getFeeProvider() public view returns (address);
    function setFeeProviderImpl(address _feeProvider) public;

    function getLendingPoolLiquidationManager() public view returns (address);
    function setLendingPoolLiquidationManager(address _manager) public;

    function getLendingRateOracle() public view returns (address);
    function setLendingRateOracle(address _lendingRateOracle) public;

// ####################################################################################
// ####___________ SIGH FINANCE RELATED CONTRACTS _____________########################
// ########## 1. SIGH (Initialized only once) #########################################
// ########## 2. SIGH Finance Configurator (Upgradagble) ################################
// ########## 3. SIGH Treasury (Upgradagble) ###########################################
// ########## 4. SIGH Mechanism Handler (Upgradagble) ###################################
// ########## 5. SIGH Staking (Upgradagble) ###################################
// ####################################################################################

    function getSIGHAddress() public view returns (address);
    function setSIGHAddress(address sighAddress) public;    

    function getSIGHFinanceConfigurator() public view returns (address);
    function setSIGHFinanceConfiguratorImpl(address sighAddress) public;    

    function getSIGHTreasury() public view returns (address);                                 //  ADDED FOR SIGH FINANCE 
    function setSIGHTreasuryImpl(address _SIGHTreasury) public;                                   //  ADDED FOR SIGH FINANCE 

    function getSIGHMechanismHandler() public view returns (address);                      //  ADDED FOR SIGH FINANCE 
    function setSIGHMechanismHandlerImpl(address _SIGHDistributionHandler) public;             //  ADDED FOR SIGH FINANCE 

    function getSIGHStaking() public view returns (address);                      //  ADDED FOR SIGH FINANCE 
    function setSIGHStakingImpl(address _SIGHDistributionHandler) public;             //  ADDED FOR SIGH FINANCE 

// #######################################################
// ####___________ PRICE ORACLE CONTRACT _____________####
// #######################################################

    function getPriceOracle() public view returns (address);
    function setPriceOracle(address _priceOracle) public;




}