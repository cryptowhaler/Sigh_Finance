import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentInitialized,InstrumentRemoved, BorrowingOnInstrumentSwitched,InstrumentEnabledAsCollateral, InstrumentDisabledAsCollateral, StableRateOnInstrumentSwitched,
    InstrumentActivationSwitched, InstrumentFreezeSwitched,InstrumentCollateralParametersUpdated, InstrumentInterestRateStrategyChanged, InstrumentDecimalsUpdated, sighStreamImplUpdated
    } from "../../generated/Lending_Pool_Configurator/LendingPoolConfigurator"
import { Instrument } from "../../generated/schema"
import { ERC20Detailed } from '../../generated/Lending_Pool_Configurator/ERC20Detailed'
import { PriceOracleGetter } from '../../generated/Lending_Pool_Configurator/PriceOracleGetter'

// STORES THE SIGH STREAM IMPL ADDRESS (IMPLEMENTATION ADDRESS)
export function handleSighStreamImplUpdated(event: sighStreamImplUpdated): void {
    let instrumentId = event.params.instrumentAddress.toHexString()
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
    instrumentState.sighStreamStorageAddress = event.params.sighStreamAddress
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

// export function handleInstrumentDecimalsUpdated(event: InstrumentDecimalsUpdated): void {
//     log.info('LENDINGPOOLCONFIGURATOR : handleInstrumentInterestRateStrategyChanged',[])                            
//     let instrumentId = event.params._instrument.toHexString()
//     let instrumentState = Instrument.load(instrumentId)
//     instrumentState.interestRateStrategyAddress = event.params._strategy 
//     instrumentState.save()
//     updatePrice(instrumentId)
// }



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

    instrumentState.present_SIGH_Side = 'inactive'
    instrumentState.present_SIGH_Suppliers_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Suppliers_Speed =  BigDecimal.fromString('0')
    instrumentState.present_SIGH_Borrowers_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Borrowers_Speed =   BigDecimal.fromString('0')
    instrumentState.present_SIGH_Staking_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Staking_Speed =   BigDecimal.fromString('0')
    
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
    
    // CURRENT AVAILABLE LIQUIDITY PRESENT IN THE POOL FOR BORROWING
    instrument_state.availableLiquidityETH = instrument_state.availableLiquidity.times(instrument_state.priceETH)
    instrument_state.availableLiquidityUSD = instrument_state.availableLiquidity.times(instrument_state.priceUSD)

    // BORROW FEE DUE 
    instrument_state.borrowFeeDueETH = instrument_state.borrowFeeDue.times(instrument_state.priceETH)
    instrument_state.borrowFeeDueUSD = instrument_state.borrowFeeDue.times(instrument_state.priceUSD)

    // BORROW FEE EARNED     
    instrument_state.borrowFeeEarnedETH = instrument_state.borrowFeeEarned.times(instrument_state.priceETH)
    instrument_state.borrowFeeEarnedUSD = instrument_state.borrowFeeEarned.times(instrument_state.priceUSD)

    // CURRENT TOTAL LIQUIDITY PRESENT IN THE POOL
    instrument_state.totalCompoundedLiquidityETH = instrument_state.totalCompoundedLiquidity.times(instrument_state.priceETH)
    instrument_state.totalCompoundedLiquidityUSD = instrument_state.totalCompoundedLiquidity.times(instrument_state.priceUSD)


    // CURRENT TOTAL PRINCIPAL AMOUNT BORROWED
    instrument_state.totalCompoundedStableBorrowsETH = instrument_state.totalCompoundedStableBorrows.times(instrument_state.priceETH)
    instrument_state.totalCompoundedStableBorrowsUSD = instrument_state.totalCompoundedStableBorrows.times(instrument_state.priceUSD)

    // CURRENT TOTAL PRINCIPAL AMOUNT BORROWED AT STABLE INTEREST RATE
    instrument_state.totalCompoundedVariableBorrowsETH = instrument_state.totalCompoundedVariableBorrows.times(instrument_state.priceETH)
    instrument_state.totalCompoundedVariableBorrowsUSD = instrument_state.totalCompoundedVariableBorrows.times(instrument_state.priceUSD)

    // CURRENT TOTAL PRINCIPAL AMOUNT BORROWED AT VARIABLE INTEREST RATE
    instrument_state.totalBorrowingEarningsETH = instrument_state.totalBorrowingEarnings.times(instrument_state.priceETH)
    instrument_state.totalBorrowingEarningsUSD = instrument_state.totalBorrowingEarnings.times(instrument_state.priceUSD)


    // LIFE-TIME DEPOSITS MADE IN THE LENDING PROTOCOL
    instrument_state.lifeTimeDepositsETH = instrument_state.lifeTimeDeposits.times(instrument_state.priceUSD)
    instrument_state.lifeTimeDepositsUSD = instrument_state.lifeTimeDeposits.times(instrument_state.priceUSD)

    // LIFE-TIME BORROWS TAKEN FROM THE LENDING PROTOCOL
    instrument_state.lifeTimeBorrowsETH = instrument_state.lifeTimeBorrows.times(instrument_state.priceUSD)
    instrument_state.lifeTimeBorrowsUSD = instrument_state.lifeTimeBorrows.times(instrument_state.priceUSD)


    // LIFE-TIME "STABLE" BORROWS TAKEN FROM THE LENDING PROTOCOL
    instrument_state.lifeTimeStableBorrowsETH = instrument_state.lifeTimeStableBorrows.times(instrument_state.priceUSD)
    instrument_state.lifeTimeStableBorrowsUSD = instrument_state.lifeTimeStableBorrows.times(instrument_state.priceUSD)

    // LIFE-TIME "VARIABLE" BORROWS TAKEN FROM THE LENDING PROTOCOL
    instrument_state.lifeTimeVariableBorrowsETH = instrument_state.lifeTimeVariableBorrows.times(instrument_state.priceUSD)
    instrument_state.lifeTimeVariableBorrowsUSD = instrument_state.lifeTimeVariableBorrows.times(instrument_state.priceUSD)

    // LIFE-TIME BORROW AMOUNT RE-PAID BACK TO THE LENDING PROTOCOL
    instrument_state.lifeTimeBorrowsRepaidETH = instrument_state.lifeTimeBorrowsRepaid.times(instrument_state.priceUSD)
    instrument_state.lifeTimeBorrowsRepaidUSD = instrument_state.lifeTimeBorrowsRepaid.times(instrument_state.priceUSD)







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
    instrument_state_initialized.sighStreamStorageAddress = Address.fromString('0x0000000000000000000000000000000000000000')
    instrument_state_initialized.sighStreamImplAddress = Address.fromString('0x0000000000000000000000000000000000000000')

    instrument_state_initialized.oracle = Address.fromString('0xd378300a022215B41A08625aA849F9682fDda54d',) 

    instrument_state_initialized.priceETH = BigDecimal.fromString('0')
    instrument_state_initialized.priceUSD = BigDecimal.fromString('0')

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

    instrument_state_initialized.availableLiquidity_WEI = new BigInt(0)
    instrument_state_initialized.availableLiquidity = BigDecimal.fromString('0')
    instrument_state_initialized.availableLiquidityETH = BigDecimal.fromString('0')
    instrument_state_initialized.availableLiquidityUSD = BigDecimal.fromString('0')

    instrument_state_initialized.borrowFeeDue_WEI = new BigInt(0)
    instrument_state_initialized.borrowFeeDue = BigDecimal.fromString('0')
    instrument_state_initialized.borrowFeeDueETH = BigDecimal.fromString('0')
    instrument_state_initialized.borrowFeeDueUSD = BigDecimal.fromString('0')

    instrument_state_initialized.borrowFeeEarned_WEI = new BigInt(0)
    instrument_state_initialized.borrowFeeEarned = BigDecimal.fromString('0')
    instrument_state_initialized.borrowFeeEarnedETH = BigDecimal.fromString('0')
    instrument_state_initialized.borrowFeeEarnedUSD = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedLiquidityWEI =  new BigInt(0)
    instrument_state_initialized.totalCompoundedLiquidity = BigDecimal.fromString('0')
    instrument_state_initialized.totalCompoundedLiquidityETH = BigDecimal.fromString('0')
    instrument_state_initialized.totalCompoundedLiquidityUSD = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedStableBorrowsWEI =  new BigInt(0)
    instrument_state_initialized.totalCompoundedStableBorrows = BigDecimal.fromString('0')
    instrument_state_initialized.totalCompoundedStableBorrowsETH = BigDecimal.fromString('0')
    instrument_state_initialized.totalCompoundedStableBorrowsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedVariableBorrowsWEI =  new BigInt(0)
    instrument_state_initialized.totalCompoundedVariableBorrows = BigDecimal.fromString('0')
    instrument_state_initialized.totalCompoundedVariableBorrowsETH = BigDecimal.fromString('0')
    instrument_state_initialized.totalCompoundedVariableBorrowsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.totalBorrowingEarnings_WEI = new BigInt(0)
    instrument_state_initialized.totalBorrowingEarnings = BigDecimal.fromString('0')
    instrument_state_initialized.totalBorrowingEarningsETH = BigDecimal.fromString('0')
    instrument_state_initialized.totalBorrowingEarningsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.stableBorrowInterestRate = new BigInt(0)
    instrument_state_initialized.stableBorrowInterestPercent = BigDecimal.fromString('0')

    instrument_state_initialized.variableBorrowInterestRate = new BigInt(0)
    instrument_state_initialized.variableBorrowInterestPercent = BigDecimal.fromString('0')
    instrument_state_initialized.variableBorrowIndex = new BigInt(0)
 
    instrument_state_initialized.utilizationRate = BigDecimal.fromString('0')
    instrument_state_initialized.utilizationRatePercent= BigDecimal.fromString('0')

    instrument_state_initialized.supplyInterestRate = new BigInt(0)
    instrument_state_initialized.supplyInterestRatePercent = BigDecimal.fromString('0')
    instrument_state_initialized.supplyIndex = new BigInt(0)

    instrument_state_initialized.lifeTimeDeposits_WEI = new BigInt(0)
    instrument_state_initialized.lifeTimeDeposits = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeDepositsETH = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeDepositsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.lifeTimeBorrows_WEI = new BigInt(0)
    instrument_state_initialized.lifeTimeBorrows = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeBorrowsETH = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeBorrowsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.lifeTimeStableBorrows_WEI = new BigInt(0)
    instrument_state_initialized.lifeTimeStableBorrows = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeStableBorrowsETH = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeStableBorrowsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.lifeTimeVariableBorrows_WEI = new BigInt(0)
    instrument_state_initialized.lifeTimeVariableBorrows = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeVariableBorrowsETH = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeVariableBorrowsUSD = BigDecimal.fromString('0')

    instrument_state_initialized.lifeTimeBorrowsRepaid_WEI = new BigInt(0)
    instrument_state_initialized.lifeTimeBorrowsRepaid = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeBorrowsRepaidETH = BigDecimal.fromString('0')
    instrument_state_initialized.lifeTimeBorrowsRepaidUSD = BigDecimal.fromString('0')

    instrument_state_initialized.totalLiquiditySIGHAccuredWEI = new BigInt(0)
    instrument_state_initialized.totalLiquiditySIGHAccured = BigDecimal.fromString('0')

    instrument_state_initialized.currentLiquiditySIGHAccuredWEI = new BigInt(0)
    instrument_state_initialized.currentLiquiditySIGHAccured = BigDecimal.fromString('0')

    instrument_state_initialized.totalBorrowingSIGHAccuredWEI = new BigInt(0)
    instrument_state_initialized.totalBorrowingSIGHAccured = BigDecimal.fromString('0')

    instrument_state_initialized.currentBorrowingSIGHAccuredWEI = new BigInt(0)
    instrument_state_initialized.currentBorrowingSIGHAccured = BigDecimal.fromString('0')


    // SIGH DISTRIBUTION RELATED
    // SIGH DISTRIBUTION RELATED
    // SIGH DISTRIBUTION RELATED
    // SIGH DISTRIBUTION RELATED


    instrument_state_initialized.isListedWithSIGH_Mechanism = false
    instrument_state_initialized.isSIGHMechanismActivated = false

    instrument_state_initialized.SIGH_Supply_Index = new BigInt(0)
    instrument_state_initialized.SIGH_Supply_Index_lastUpdatedBlock = new BigInt(0)

    instrument_state_initialized.SIGH_Borrow_Index = new BigInt(0)
    instrument_state_initialized.SIGH_Borrow_Index_lastUpdatedBlock = new BigInt(0)

    instrument_state_initialized.fromBlockNumber = new BigInt(0)
    instrument_state_initialized.toBlockNumber = new BigInt(0)

    instrument_state_initialized.present_SIGH_Side = null
    instrument_state_initialized.present_DeltaBlocks = new BigInt(0)
    instrument_state_initialized.present_Clock = new BigInt(0)

    instrument_state_initialized.present_maxVolatilityLimitSuppliers = new BigInt(0)
    instrument_state_initialized.present_maxVolatilityLimitSuppliersPercent = BigDecimal.fromString('0')
    instrument_state_initialized.present_maxVolatilityLimitBorrowers = new BigInt(0)
    instrument_state_initialized.present_maxVolatilityLimitBorrowersPercent = BigDecimal.fromString('0')

    instrument_state_initialized.present_percentTotalVolatility = BigDecimal.fromString('0')
    instrument_state_initialized.present_total24HrVolatilityETH = new BigInt(0)
    instrument_state_initialized.present_total24HrVolatilityUSD = BigDecimal.fromString('0')

    instrument_state_initialized.present_percentTotalVolatilityLimitAmount = BigDecimal.fromString('0')
    instrument_state_initialized.present_24HrVolatilityLimitAmountETH = new BigInt(0)
    instrument_state_initialized.present_24HrVolatilityLimitAmountUSD = BigDecimal.fromString('0')

    instrument_state_initialized.present_SIGH_Suppliers_Speed_WEI =  new BigInt(0)
    instrument_state_initialized.present_SIGH_Suppliers_Speed = BigDecimal.fromString('0')
    instrument_state_initialized.present_SIGH_Borrowers_Speed_WEI =  new BigInt(0)
    instrument_state_initialized.present_SIGH_Borrowers_Speed = BigDecimal.fromString('0')
    instrument_state_initialized.present_SIGH_Staking_Speed_WEI =  new BigInt(0)
    instrument_state_initialized.present_SIGH_Staking_Speed = BigDecimal.fromString('0')

    instrument_state_initialized.present_PrevPrice_ETH = BigDecimal.fromString('0')
    instrument_state_initialized.present_PrevPrice_USD = BigDecimal.fromString('0')

    instrument_state_initialized.present_OpeningPrice_ETH = BigDecimal.fromString('0')
    instrument_state_initialized.present_OpeningPrice_USD = BigDecimal.fromString('0')

    instrument_state_initialized.timeStamp =  new BigInt(0)
   
    instrument_state_initialized.save()
    return instrument_state_initialized as Instrument
  }