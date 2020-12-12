import { Address, BigInt,BigDecimal, log, ByteArray } from "@graphprotocol/graph-ts"
import { PendingSIGHFinanceManagerUpdated,SIGHFinanceManagerUpdated, PendingLendingPoolManagerUpdated,LendingPoolManagerUpdated, LendingPoolConfiguratorUpdated, LendingPoolUpdated,
    LendingPoolCoreUpdated, LendingPoolParametersProviderUpdated,LendingPoolLiquidationManagerUpdated, LendingPoolDataProviderUpdated, LendingRateOracleUpdated, FeeProviderUpdated, 
    SIGHFinanceConfiguratorUpdated, SIGHAddressUpdated, SIGHSpeedControllerUpdated, SIGHMechanismHandlerImplUpdated, 
    SIGHTreasuryImplUpdated, SIGHStakingImplUpdated, PriceOracleUpdated, SIGHFinanceFeeCollectorUpdated, ProxyCreated
    } from "../../generated/AddressesProvider/AddressesProvider"
import { AddressesProvider } from "../../generated/schema"

// Pending SIGH Finance Manager
export function handlePendingSIGHFinanceManagerUpdated(event: PendingSIGHFinanceManagerUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.pending_SIGH_Finance_Manager = event.params._pendingSighFinanceManager;
    globalAddressesState.save()
}

// SIGH Finance Manager
export function handleSIGHFinanceManagerUpdated(event: SIGHFinanceManagerUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.SIGH_Finance_Manager = event.params._sighFinanceManager;
    globalAddressesState.save()
}

// Pending Lending Pool Manager 
export function handlePendingLendingPoolManagerUpdated(event: PendingLendingPoolManagerUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.Pending_Lending_Pool_Manager = event.params._pendingLendingPoolManager;
    globalAddressesState.save()
}

// Lending Pool Manager 
export function handleLendingPoolManagerUpdated(event: LendingPoolManagerUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.Lending_Pool_Manager = event.params._lendingPoolManager;
    globalAddressesState.save()
}


// Lending Pool Configurator IMPL.
export function handleLendingPoolConfiguratorUpdated(event: LendingPoolConfiguratorUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.Lending_Pool_Configurator_Impl = event.params.newAddress;
    globalAddressesState.save()
}

// Lending Pool IMPL.
export function handleLendingPoolUpdated(event: LendingPoolUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.Lending_Pool_Impl = event.params.newAddress;
    globalAddressesState.save()
}

// Lending Pool Core IMPL.
export function handleLendingPoolCoreUpdated(event: LendingPoolCoreUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.Lending_Pool_Core_Impl = event.params.newAddress;
    globalAddressesState.save()
}


// Lending Pool Paramters Provider IMPL.
export function handleLendingPoolParametersProviderUpdated(event: LendingPoolParametersProviderUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.Lending_Pool_Paramters_Provider_Impl = event.params.newAddress;
    globalAddressesState.save()
}

// Lending Pool Liquidation Manager IMPL.
export function handleLendingPoolLiquidationManagerUpdated(event: LendingPoolLiquidationManagerUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.Lending_Pool_Liquidation_Manager = event.params.newAddress;
    globalAddressesState.save()
}

// Lending Pool Data Provider IMPL.
export function handleLendingPoolDataProviderUpdated(event: LendingPoolDataProviderUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.Lending_Pool_Data_Provider_Impl = event.params.newAddress;
    globalAddressesState.save()
}

// Lending Rate Oracle
export function handleLendingRateOracleUpdated(event: LendingRateOracleUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.Lending_Rate_Oracle = event.params.newAddress;
    globalAddressesState.save()
}

// Fee Provider IMPL.
export function handleFeeProviderUpdated(event: FeeProviderUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.Fee_Provider_Impl = event.params.newAddress;
    globalAddressesState.save()
}


// SIGH  Finance Configurator IMPL.
export function handleSIGHFinanceConfiguratorUpdated(event: SIGHFinanceConfiguratorUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.SIGH_Finance_Configurator_Impl = event.params.sighFinanceConfigAddress;
    globalAddressesState.save()
}

// SIGH Address
export function handleSIGHAddressUpdated(event: SIGHAddressUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.SIGH_Instrument = event.params.sighAddress;
    globalAddressesState.save()
}

// SIGH Speed Controller
export function handleSIGHSpeedControllerUpdated(event: SIGHSpeedControllerUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.SIGH_Speed_Controller = event.params.speedControllerAddress;
    globalAddressesState.save()
}

// SIGH Mechanism Handler IMPL.
export function handleSIGHMechanismHandlerImplUpdated(event: SIGHMechanismHandlerImplUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.SIGH_Mechanism_Handler_Impl = event.params.newAddress;
    globalAddressesState.save()
}

// SIGH Treasury IMPL.
export function handleSIGHTreasuryImplUpdated(event: SIGHTreasuryImplUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.SIGH_Treasury_Impl = event.params.newAddress;
    globalAddressesState.save()
}

// SIGH Staking
export function handleSIGHStakingImplUpdated(event: SIGHStakingImplUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.SIGH_Staking = event.params.SIGHStakingAddress;
    globalAddressesState.save()
}

// Price Oracle
export function handlePriceOracleUpdated(event: PriceOracleUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.Price_Oracle = event.params.newAddress;
    globalAddressesState.save()
}

// SIGH Finance Fee Collector
export function handleSIGHFinanceFeeCollectorUpdated(event: SIGHFinanceFeeCollectorUpdated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }
    globalAddressesState.SIGH_Finance_Fee_Collector = event.params.newAddress;
    globalAddressesState.save()
}

// Proxy Creation
export function handleProxyCreated(event: ProxyCreated): void { 
    let globalAddressID = event.address.toHexString()
    let globalAddressesState = AddressesProvider.load(globalAddressID)
    if (globalAddressesState == null) {
        globalAddressesState = createAddressesProvider(globalAddressID)
    }

    let name = event.params.id.toString()
    if (name == 'LENDING_POOL_CONFIGURATOR')  {
        globalAddressesState.Lending_Pool_Configurator_Storage = event.params.newAddress;
    }
    if (name == 'SIGH_FINANCE_CONFIGURATOR')  {
        globalAddressesState.SIGH_Finance_Configurator_Storage = event.params.newAddress;
    }
    if (name == 'LENDING_POOL_CORE')  {
        globalAddressesState.Lending_Pool_Core_Storage = event.params.newAddress;
    }
    if (name == 'LENDING_POOL')  {
        globalAddressesState.Lending_Pool_Storage = event.params.newAddress;
    }
    if (name == 'PARAMETERS_PROVIDER')  {
        globalAddressesState.Lending_Pool_Paramters_Provider_Storage = event.params.newAddress;
    }
    if (name == 'DATA_PROVIDER')  {
        globalAddressesState.Lending_Pool_Data_Provider_Storage = event.params.newAddress;
    }
    if (name == 'FEE_PROVIDER')  {
        globalAddressesState.Fee_Provider_Storage = event.params.newAddress;
    }
    if (name == 'SIGH_MECHANISM_HANDLER')  {
        globalAddressesState.SIGH_Mechanism_Handler_Storage = event.params.newAddress;
    }
    if (name == 'SIGH_TREASURY')  {
        globalAddressesState.SIGH_Treasury_Storage = event.params.newAddress;
    }
    globalAddressesState.save()
}



// ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

export function createAddressesProvider(ID: string): AddressesProvider {

    let AddressesProvider_initialized = new AddressesProvider(ID)

    AddressesProvider_initialized.pending_SIGH_Finance_Manager = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.SIGH_Finance_Manager = Address.fromString('0x0000000000000000000000000000000000000000') 
    
    AddressesProvider_initialized.Pending_Lending_Pool_Manager = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.Lending_Pool_Manager = Address.fromString('0x0000000000000000000000000000000000000000') 
    
    AddressesProvider_initialized.Price_Oracle = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.SIGH_Finance_Fee_Collector = Address.fromString('0x0000000000000000000000000000000000000000') 
    
    AddressesProvider_initialized.Lending_Pool_Configurator_Storage = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.Lending_Pool_Configurator_Impl = Address.fromString('0x0000000000000000000000000000000000000000') 
    
    AddressesProvider_initialized.Lending_Pool_Storage = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.Lending_Pool_Impl = Address.fromString('0x0000000000000000000000000000000000000000') 
    
    AddressesProvider_initialized.Lending_Pool_Core_Storage = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.Lending_Pool_Core_Impl = Address.fromString('0x0000000000000000000000000000000000000000') 
    
    AddressesProvider_initialized.Lending_Pool_Paramters_Provider_Storage = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.Lending_Pool_Paramters_Provider_Impl = Address.fromString('0x0000000000000000000000000000000000000000') 
    
    AddressesProvider_initialized.Lending_Pool_Data_Provider_Storage = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.Lending_Pool_Data_Provider_Impl = Address.fromString('0x0000000000000000000000000000000000000000') 
    
    AddressesProvider_initialized.Lending_Pool_Liquidation_Manager = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.Lending_Rate_Oracle = Address.fromString('0x0000000000000000000000000000000000000000') 
    
    AddressesProvider_initialized.Fee_Provider_Storage = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.Fee_Provider_Impl = Address.fromString('0x0000000000000000000000000000000000000000') 
    
    AddressesProvider_initialized.SIGH_Instrument = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.SIGH_Speed_Controller = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.SIGH_Staking = Address.fromString('0x0000000000000000000000000000000000000000') 
    
    AddressesProvider_initialized.SIGH_Finance_Configurator_Storage = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.SIGH_Finance_Configurator_Impl = Address.fromString('0x0000000000000000000000000000000000000000') 

    AddressesProvider_initialized.SIGH_Mechanism_Handler_Storage = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.SIGH_Mechanism_Handler_Impl = Address.fromString('0x0000000000000000000000000000000000000000') 

    AddressesProvider_initialized.SIGH_Treasury_Storage = Address.fromString('0x0000000000000000000000000000000000000000') 
    AddressesProvider_initialized.SIGH_Treasury_Impl = Address.fromString('0x0000000000000000000000000000000000000000') 

    AddressesProvider_initialized.save()
    return AddressesProvider_initialized as AddressesProvider
}