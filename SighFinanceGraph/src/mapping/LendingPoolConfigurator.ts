import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentInitialized,InstrumentRemoved, BorrowingOnInstrumentSwitched,InstrumentEnabledAsCollateral, InstrumentDisabledAsCollateral, StableRateOnInstrumentSwitched,
    InstrumentActivationSwitched, InstrumentFreezeSwitched,InstrumentCollateralParametersUpdated, InstrumentInterestRateStrategyChanged, InstrumentDecimalsUpdated, sighStreamImplUpdated
    } from "../../generated/Lending_Pool_Configurator/LendingPoolConfigurator"
import { Instrument } from "../../generated/schema"
import { ERC20Detailed } from '../../generated/Lending_Pool_Configurator/ERC20Detailed'
import { PriceOracleGetter } from '../../generated/Lending_Pool_Configurator/PriceOracleGetter'

// STORES THE SIGH STREAM IMPL ADDRESS (IMPLEMENTATION ADDRESS)
export function handleSighStreamImplUpdated(event: sighStreamImplUpdated): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.sighStreamImplAddress = event.params.newSighStreamImpl;
    instrumentState.save()
}

// Works as Expected : Instrument's price Oracle should be initialized before initializing instrument itself
export function handleInstrumentInitialized(event: InstrumentInitialized): void {
    log.info('LENDINGPOOLCONFIGURATOR : handleInstrumentInitialized',[])
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    // log.info('handleInstrumentInitialized : msg 1',[])
    instrumentState.instrumentAddress = event.params._instrument
    instrumentState.iTokenAddress = event.params._iToken
    instrumentState.interestRateStrategyAddress = event.params._interestRateStrategyAddress
    instrumentState.sighStreamStorageAddress = event.params.sighStreamProxyAddress
    instrumentState.sighStreamImplAddress = event.params.sighStreamImplAddress

    instrumentState.isActive = true
    instrumentState.isFreezed = false

    // log.info('handleInstrumentInitialized : msg 2',[])
    let instrumentContract = ERC20Detailed.bind(Address.fromString(instrumentId))
    instrumentState.underlyingInstrumentName = instrumentContract.name()
    instrumentState.underlyingInstrumentSymbol = instrumentContract.symbol()
    instrumentState.decimals = BigInt.fromI32( instrumentContract.decimals() ) 

    // log.info('handleInstrumentInitialized : msg 3',[])
    let iTokenContract = ERC20Detailed.bind(event.params._iToken)
    instrumentState.name = iTokenContract.name()
    instrumentState.symbol =  iTokenContract.symbol()
    // log.info('handleInstrumentInitialized : msg 4',[])

    instrumentState.supplyIndex = BigInt.fromI32(10).pow(27 as u8)                  // RAY = 1e27 (initialized in CoreLibrary's init() )
    instrumentState.variableBorrowIndex = BigInt.fromI32(10).pow(27  as u8)         // RAY = 1e27 (initialized in CoreLibrary's init() )

    instrumentState.save()
    updatePrice(instrumentId)    
}



// WORKS AS EXPECTED
export function handleInstrumentEnabledAsCollateral(event: InstrumentEnabledAsCollateral): void {
    log.info('LENDINGPOOLCONFIGURATOR : handleInstrumentEnabledAsCollateral',[])
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.usageAsCollateralEnabled = true
    instrumentState.baseLTVasCollateral = event.params._ltv 
    instrumentState.liquidationThreshold = event.params._liquidationThreshold 
    instrumentState.liquidationBonus = event.params._liquidationBonus 

    instrumentState.save()
    updatePrice(instrumentId)    
}

export function handleInstrumentDisabledAsCollateral(event: InstrumentDisabledAsCollateral): void {
    log.info('LENDINGPOOLCONFIGURATOR : handleInstrumentDisabledAsCollateral',[])
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.usageAsCollateralEnabled = false
    instrumentState.save()
    updatePrice(instrumentId)    
}


// WORKS AS EXPECTED
export function handleBorrowingOnInstrumentSwitched(event: BorrowingOnInstrumentSwitched): void {
    log.info('LENDINGPOOLCONFIGURATOR : BorrowingOnInstrumentSwitched',[])
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.borrowingEnabled = event.params.switch_
    instrumentState.save()
    updatePrice(instrumentId)    
}



export function handleStableRateOnInstrumentSwitched(event: StableRateOnInstrumentSwitched): void {
    log.info('LENDINGPOOLCONFIGURATOR : handleStableRateOnInstrumentSwitched',[])    
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.isStableBorrowRateEnabled = event.params.isEnabled 
    instrumentState.save()
    updatePrice(instrumentId)    
}

export function handleInstrumentActivationSwitched(event: InstrumentActivationSwitched): void {
    log.info('LENDINGPOOLCONFIGURATOR : InstrumentActivationSwitched',[])    
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.isActive = event.params.switch_ 
    instrumentState.save()
    updatePrice(instrumentId)    
}


export function handleInstrumentFreezeSwitched(event: InstrumentFreezeSwitched): void {
    log.info('LENDINGPOOLCONFIGURATOR : handleInstrumentFreezeSwitched',[])                
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.isFreezed = event.params.isFreezed 
    instrumentState.save()
    updatePrice(instrumentId)
}

export function handleInstrumentCollateralParametersUpdated(event: InstrumentCollateralParametersUpdated): void {
    log.info('LENDINGPOOLCONFIGURATOR : InstrumentCollateralParametersUpdated',[])                    
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.baseLTVasCollateral = event.params._ltv 
    instrumentState.liquidationThreshold = event.params._liquidationThreshold 
    instrumentState.liquidationBonus = event.params._liquidationBonus 
    instrumentState.save()
    updatePrice(instrumentId)
}

export function handleInstrumentInterestRateStrategyChanged(event: InstrumentInterestRateStrategyChanged): void {
    log.info('LENDINGPOOLCONFIGURATOR : handleInstrumentInterestRateStrategyChanged',[])                            
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.interestRateStrategyAddress = event.params._strategy 
    instrumentState.save()
    updatePrice(instrumentId)
}

export function handleInstrumentDecimalsUpdated(event: InstrumentDecimalsUpdated): void {
    log.info('LENDINGPOOLCONFIGURATOR : handleInstrumentInterestRateStrategyChanged',[])                            
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.interestRateStrategyAddress = event.params._strategy 
    instrumentState.save()
    updatePrice(instrumentId)
}



export function handleInstrumentRemoved(event: InstrumentRemoved): void {
    log.info('LENDINGPOOLCONFIGURATOR : handleInstrumentRemoved',[])                                
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    instrumentState.isActive = false
    instrumentState.borrowingEnabled = false
    instrumentState.usageAsCollateralEnabled = false
    instrumentState.interestRateStrategyAddress = Address.fromString('0x0000000000000000000000000000000000000000',)
    instrumentState.iTokenAddress = Address.fromString('0x0000000000000000000000000000000000000000',)
    instrumentState.supplyIndex = new BigInt(0)
    instrumentState.variableBorrowIndex = new BigInt(0)
    instrumentState.baseLTVasCollateral = new BigInt(0)
    instrumentState.liquidationThreshold = new BigInt(0)
    instrumentState.liquidationBonus = new BigInt(0)

    instrumentState.isSIGHMechanismActivated = false
    instrumentState.SIGH_Supply_Index =  new BigInt(0)
    instrumentState.SIGH_Borrow_Index =  new BigInt(0)

    instrumentState.present_SIGH_Distribution_Side = 'inactive'
    instrumentState.present_SIGH_Suppliers_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Suppliers_Speed =  BigDecimal.fromString('0')
    instrumentState.present_SIGH_Borrowers_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Borrowers_Speed =   BigDecimal.fromString('0')
    instrumentState.present_SIGH_Staking_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Staking_Speed =   BigDecimal.fromString('0')
    instrumentState.present_SIGH_DistributionValuePerBlock_ETH =   BigDecimal.fromString('0')
    instrumentState.present_SIGH_DistributionValuePerBlock_USD =   BigDecimal.fromString('0')
    instrumentState.present_VolatilityAddressedPerBlock =   BigDecimal.fromString('0')
    
    instrumentState.save()

    updatePrice(instrumentId)
}










export function updatePrice( ID: string ) : void {
    let instrument_state = Instrument.load(ID)
  
    let oracleAddress = instrument_state.oracle as Address
    let oracleContract = PriceOracleGetter.bind( oracleAddress )
    log.info('updatePrice: oracleAddress {} ',[oracleAddress.toHexString()])
  
    // GETTING INSTRUMENT PRICE IN ETH
    let instrumentAddress = instrument_state.instrumentAddress as Address
    log.info('updatePrice: instrumentAddress {} ',[instrumentAddress.toHexString()])
    let priceInETH = oracleContract.getAssetPrice( instrumentAddress ).toBigDecimal() 
    let priceInETH_Decimals = oracleContract.getAssetPriceDecimals( instrumentAddress )
    instrument_state.priceETH = priceInETH.div( BigInt.fromI32(10).pow(priceInETH_Decimals as u8).toBigDecimal() ) 
  
    // GETTING ETH PRICE IN USD
    let ETH_PriceInUSD = oracleContract.getAssetPrice(Address.fromString('0x1b563766d835b49C5A7D9f5a0893d28e35746818')).toBigDecimal()
    let ETH_PriceInUSDDecimals = oracleContract.getAssetPriceDecimals(Address.fromString('0x1b563766d835b49C5A7D9f5a0893d28e35746818'))
    let ETHPriceInUSD = ETH_PriceInUSD.div(  BigInt.fromI32(10).pow(ETH_PriceInUSDDecimals as u8).toBigDecimal() )
    instrument_state.priceUSD = instrument_state.priceETH.times(ETHPriceInUSD)
    
    // BORROW FEE DUE 
    instrument_state.borrowFeeDueETH = instrument_state.borrowFeeDue.times(instrument_state.priceETH)
    instrument_state.borrowFeeDueUSD = instrument_state.borrowFeeDue.times(instrument_state.priceUSD)

    // BORROW FEE EARNED     
    instrument_state.borrowFeeEarnedETH = instrument_state.borrowFeeEarned.times(instrument_state.priceETH)
    instrument_state.borrowFeeEarnedUSD = instrument_state.borrowFeeEarned.times(instrument_state.priceUSD)

    // CURRENT TOTAL LIQUIDITY PRESENT IN THE POOL
    instrument_state.totalLiquidityETH = instrument_state.totalLiquidity.times(instrument_state.priceETH)
    instrument_state.totalLiquidityUSD = instrument_state.totalLiquidity.times(instrument_state.priceUSD)

    // CURRENT AVAILABLE LIQUIDITY PRESENT IN THE POOL FOR BORROWING
    instrument_state.availableLiquidityETH = instrument_state.availableLiquidity.times(instrument_state.priceETH)
    instrument_state.availableLiquidityUSD = instrument_state.availableLiquidity.times(instrument_state.priceUSD)

    // CURRENT TOTAL PRINCIPAL AMOUNT BORROWED
    instrument_state.totalPrincipalBorrowsETH = instrument_state.totalPrincipalBorrows.times(instrument_state.priceETH)
    instrument_state.totalPrincipalBorrowsUSD = instrument_state.totalPrincipalBorrows.times(instrument_state.priceUSD)

    // CURRENT TOTAL PRINCIPAL AMOUNT BORROWED AT STABLE INTEREST RATE
    instrument_state.totalPrincipalStableBorrowsETH = instrument_state.totalPrincipalStableBorrows.times(instrument_state.priceETH)
    instrument_state.totalPrincipalStableBorrowsUSD = instrument_state.totalPrincipalStableBorrows.times(instrument_state.priceUSD)

    // CURRENT TOTAL PRINCIPAL AMOUNT BORROWED AT VARIABLE INTEREST RATE
    instrument_state.totalPrincipalVariableBorrowsETH = instrument_state.totalPrincipalVariableBorrows.times(instrument_state.priceETH)
    instrument_state.totalPrincipalVariableBorrowsUSD = instrument_state.totalPrincipalVariableBorrows.times(instrument_state.priceUSD)

    // CURRENT TOTAL EARNINGS OF SUPPLIERS (LIIQUIDITY PROVIDERS) THROUGH STABLE INTEREST RATES
    instrument_state.totalSupplierEarningsETH = instrument_state.totalSupplierEarnings.times(instrument_state.priceETH)
    instrument_state.totalSupplierEarningsUSD = instrument_state.totalSupplierEarnings.times(instrument_state.priceUSD)

    // LIFE-TIME DEPOSITS MADE IN THE LENDING PROTOCOL
    instrument_state.lifeTimeDepositsETH = instrument_state.lifeTimeDeposits.times(instrument_state.priceUSD)
    instrument_state.lifeTimeDepositsUSD = instrument_state.lifeTimeDeposits.times(instrument_state.priceUSD)


    instrument_state.save()
  }





// ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

export function createInstrument(addressID: string): Instrument {
    let instrument_state_initialized = new Instrument(addressID)

    instrument_state_initialized.instrumentAddress = Address.fromString('0x0000000000000000000000000000000000000000')
    instrument_state_initialized.iTokenAddress = Address.fromString('0x0000000000000000000000000000000000000000')
    instrument_state_initialized.interestRateStrategyAddress = Address.fromString('0x0000000000000000000000000000000000000000')
    instrument_state_initialized.oracle = Address.fromString('0xdFDE2BCB133A2E6d6e6889D1b27a0c4857BED3A1',) 

    instrument_state_initialized.name = null
    instrument_state_initialized.symbol = null
    instrument_state_initialized.underlyingInstrumentName = null
    instrument_state_initialized.underlyingInstrumentSymbol = null
    instrument_state_initialized.decimals = new BigInt(0)

    instrument_state_initialized.isActive = false
    instrument_state_initialized.isFreezed = false
    instrument_state_initialized.borrowingEnabled = false
    instrument_state_initialized.usageAsCollateralEnabled = false
    instrument_state_initialized.isStableBorrowRateEnabled = false

    instrument_state_initialized.baseLTVasCollateral = new BigInt(0)
    instrument_state_initialized.liquidationThreshold = new BigInt(0)
    instrument_state_initialized.liquidationBonus = new BigInt(0)

    instrument_state_initialized.priceETH = BigDecimal.fromString('0')
    instrument_state_initialized.priceUSD = BigDecimal.fromString('0')

    instrument_state_initialized.borrowFeeDue_WEI = new BigInt(0)
    instrument_state_initialized.borrowFeeDue = BigDecimal.fromString('0')
    instrument_state_initialized.borrowFeeDueETH = BigDecimal.fromString('0')
    instrument_state_initialized.borrowFeeDueUSD = BigDecimal.fromString('0')

    instrument_state_initialized.borrowFeeEarned_WEI = new BigInt(0)
    instrument_state_initialized.borrowFeeEarned = BigDecimal.fromString('0')
    instrument_state_initialized.borrowFeeEarnedETH = BigDecimal.fromString('0')
    instrument_state_initialized.borrowFeeEarnedUSD = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedLiquidityWEI =  new BigInt(0)


    instrument_state_initialized.totalLiquidity_WEI = new BigInt(0)
    instrument_state_initialized.totalLiquidity = BigDecimal.fromString('0')
    instrument_state_initialized.totalLiquidityETH = BigDecimal.fromString('0')
    instrument_state_initialized.totalLiquidityUSD = BigDecimal.fromString('0')

    instrument_state_initialized.availableLiquidity_WEI = new BigInt(0)
    instrument_state_initialized.availableLiquidity = BigDecimal.fromString('0')
    instrument_state_initialized.availableLiquidityETH = BigDecimal.fromString('0')
    instrument_state_initialized.availableLiquidityUSD = BigDecimal.fromString('0')

    instrument_state_initialized.totalPrincipalBorrows_WEI = new BigInt(0)
    instrument_state_initialized.totalPrincipalBorrows = BigDecimal.fromString('0')
    instrument_state_initialized.totalPrincipalBorrowsETH = BigDecimal.fromString('0')
    instrument_state_initialized.totalPrincipalBorrowsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedStableBorrowsWEI =  new BigInt(0)

    instrument_state_initialized.totalPrincipalStableBorrows_WEI = new BigInt(0)
    instrument_state_initialized.totalPrincipalStableBorrows = BigDecimal.fromString('0')
    instrument_state_initialized.totalPrincipalStableBorrowsETH = BigDecimal.fromString('0')
    instrument_state_initialized.totalPrincipalStableBorrowsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedVariableBorrowsWEI =  new BigInt(0)

    instrument_state_initialized.totalPrincipalVariableBorrows_WEI = new BigInt(0)
    instrument_state_initialized.totalPrincipalVariableBorrows = BigDecimal.fromString('0')
    instrument_state_initialized.totalPrincipalVariableBorrowsETH = BigDecimal.fromString('0')
    instrument_state_initialized.totalPrincipalVariableBorrowsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedEarnings_WEI = new BigInt(0)
    instrument_state_initialized.totalCompoundedEarnings = BigDecimal.fromString('0')

    instrument_state_initialized.utilizationRate = BigDecimal.fromString('0')
    instrument_state_initialized.utilizationRatePercent= BigDecimal.fromString('0')


    instrument_state_initialized.stableBorrowInterestRate = new BigInt(0)
    instrument_state_initialized.stableBorrowInterestPercent = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedEarningsSTABLEInterest_WEI = new BigInt(0)
    instrument_state_initialized.totalCompoundedEarningsSTABLEInterest = BigDecimal.fromString('0')

    instrument_state_initialized.variableBorrowInterestRate = new BigInt(0)
    instrument_state_initialized.variableBorrowInterestPercent = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedEarningsVARIABLEInterest_WEI = new BigInt(0)
    instrument_state_initialized.totalCompoundedEarningsVARIABLEInterest = BigDecimal.fromString('0')

    instrument_state_initialized.variableBorrowIndex = new BigInt(0)
    instrument_state_initialized.supplyIndex = new BigInt(0)

    instrument_state_initialized.supplyInterestRate = new BigInt(0)
    instrument_state_initialized.supplyInterestRatePercent = BigDecimal.fromString('0')

    instrument_state_initialized.totalSupplierEarnings_WEI = new BigInt(0)
    instrument_state_initialized.totalSupplierEarnings = BigDecimal.fromString('0')
    instrument_state_initialized.totalSupplierEarningsETH = BigDecimal.fromString('0')
    instrument_state_initialized.totalSupplierEarningsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.lifeTimeDeposits_WEI = new BigInt(0)
    instrument_state_initialized.lifeTimeDeposits = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeDepositsETH = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeDepositsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.lifeTimeBorrows_WEI = new BigInt(0)
    instrument_state_initialized.lifeTimeBorrows = BigDecimal.fromString('0')

    // SIGH DISTRIBUTION RELATED

    // BOOLEAN
    instrument_state_initialized.isListedWithSIGH_Mechanism = false
    instrument_state_initialized.isSIGHMechanismActivated = false

    // LIQUIDITY $SIGH STREAM
    instrument_state_initialized.totalLiquiditySIGHAccuredWEI =    new BigInt(0)
    instrument_state_initialized.currentLiquiditySIGHAccuredWEI =    new BigInt(0)

    instrument_state_initialized.SIGH_Supply_Index =  new BigInt(0)
    instrument_state_initialized.SIGH_Supply_Index_lastUpdatedBlock =  new BigInt(0)

    // BORROWING $SIGH STREAM
    instrument_state_initialized.totalBorrowingSIGHAccuredWEI =  new BigInt(0)
    instrument_state_initialized.currentBorrowingSIGHAccuredWEI =  new BigInt(0)

    instrument_state_initialized.SIGH_Borrow_Index =  new BigInt(0)
    instrument_state_initialized.SIGH_Borrow_Index_lastUpdatedBlock =  new BigInt(0)

    instrument_state_initialized.present_24HrWindow_InstrumentOpeningPriceETH = BigDecimal.fromString('0')
    instrument_state_initialized.present_24HrWindow_InstrumentOpeningPriceUSD = BigDecimal.fromString('0')

    instrument_state_initialized.present_24HrWindow_InstrumentClosingPriceETH = BigDecimal.fromString('0')
    instrument_state_initialized.present_24HrWindow_InstrumentClosingPriceUSD = BigDecimal.fromString('0')

    instrument_state_initialized.present_24HrWindow_MaxSIGHSpeed = BigDecimal.fromString('0')
    instrument_state_initialized.present_24HrWindow_DeltaBlocks =  new BigInt(0)
    instrument_state_initialized.present_24HrVolatility_ETH = BigDecimal.fromString('0')
    instrument_state_initialized.present_24HrVolatility_USD = BigDecimal.fromString('0')
    instrument_state_initialized.present_percentTotalVolatility = BigDecimal.fromString('0')
    instrument_state_initialized.present_TotalVolatility_ETH = BigDecimal.fromString('0')
    instrument_state_initialized.present_TotalVolatility_USD = BigDecimal.fromString('0')

    instrument_state_initialized.present_SIGH_Distribution_Side = 'inactive'

    instrument_state_initialized.present_24HrWindow_SIGH_OpeningPrice_ETH = BigDecimal.fromString('0') 
    instrument_state_initialized.present_24HrWindow_SIGH_OpeningPrice_USD = BigDecimal.fromString('0') 

    instrument_state_initialized.present_SIGH_Suppliers_Speed_WEI =  new BigInt(0)
    instrument_state_initialized.present_SIGH_Suppliers_Speed = BigDecimal.fromString('0')
    instrument_state_initialized.present_SIGH_Borrowers_Speed_WEI =  new BigInt(0)
    instrument_state_initialized.present_SIGH_Borrowers_Speed = BigDecimal.fromString('0')
    instrument_state_initialized.present_SIGH_Staking_Speed_WEI =  new BigInt(0)
    instrument_state_initialized.present_SIGH_Staking_Speed = BigDecimal.fromString('0')

    instrument_state_initialized.present_SIGH_DistributionValuePerBlock_ETH = BigDecimal.fromString('0')
    instrument_state_initialized.present_SIGH_DistributionValuePerBlock_USD = BigDecimal.fromString('0')

    instrument_state_initialized.present_VolatilityAddressedPerBlock = BigDecimal.fromString('0')

    instrument_state_initialized.timeStamp =  new BigInt(0)
   
    instrument_state_initialized.save()
    return instrument_state_initialized as Instrument
  }