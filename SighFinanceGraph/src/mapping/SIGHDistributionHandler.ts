import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentAdded, InstrumentRemoved, InstrumentSIGHStateUpdated, SIGHSpeedUpdated, StakingSpeedUpdated, SpeedUpperCheckSwitched
 , minimumBlocksForSpeedRefreshUpdated , PriceSnapped, SIGHBorrowIndexUpdated, AccuredSIGHTransferredToTheUser,
 MaxSIGHSpeedCalculated, refreshingSighSpeeds , SIGHSupplyIndexUpdated } from "../../generated/Sigh_Distribution_Handler/SIGHDistributionHandler"
import { Instrument } from "../../generated/schema"
import { createInstrument,updatePrice } from "./LendingPoolConfigurator"
import { PriceOracleGetter } from '../../generated/Lending_Pool_Configurator/PriceOracleGetter'


// FINAL v0. To be Tested : WEI ONLY
export function handleSIGHSupplyIndexUpdated(event: SIGHSupplyIndexUpdated): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = BigInt.fromI32(10).pow(instrumentState.decimals.toI32() as u8).toBigDecimal()

    // Instrument's current Compounded Liquidity Balance
    instrumentState.totalCompoundedLiquidityWEI = event.params.totalCompoundedSupply
    instrumentState.totalCompoundedLiquidity = instrumentState.totalCompoundedLiquidityWEI.toBigDecimal().div(decimalAdj) 

    // Instrument's life-time $SIGH Accured as part of "Liquidity $SIGH Stream"
    instrumentState.totalLiquiditySIGHAccuredWEI = instrumentState.totalLiquiditySIGHAccuredWEI.plus( event.params.sighAccured )
    instrumentState.totalLiquiditySIGHAccured = instrumentState.totalLiquiditySIGHAccuredWEI.toBigDecimal().div( BigInt.fromI32(10).pow(18 as u8).toBigDecimal() )

    // Instrument's current $SIGH Accuredas part of "Liquidity $SIGH Stream" , which is being distributed among the Liquidity Providers
    instrumentState.currentLiquiditySIGHAccuredWEI = instrumentState.currentLiquiditySIGHAccuredWEI.plus( event.params.sighAccured )
    instrumentState.currentLiquiditySIGHAccured = instrumentState.currentLiquiditySIGHAccuredWEI.toBigDecimal().div( BigInt.fromI32(10).pow(18 as u8).toBigDecimal() )

    instrumentState.SIGH_Supply_Index = event.params.newIndexMantissa   // INDEX is used for distributing $SIGH on a per token unit basis
    instrumentState.SIGH_Supply_Index_lastUpdatedBlock = event.block.number    // Block Number when it was last updated

    instrumentState.save()
}

// FINAL v0. To be Tested : WEI ONLY
export function handleSIGHBorrowIndexUpdated(event: SIGHBorrowIndexUpdated): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    let decimalAdj = BigInt.fromI32(10).pow(instrumentState.decimals.toI32() as u8).toBigDecimal()

    // Instrument's current Compounded STABLE Borrow Balance
    instrumentState.totalCompoundedStableBorrowsWEI = event.params.totalCompoundedStableBorrows 
    instrumentState.totalCompoundedStableBorrows = instrumentState.totalCompoundedStableBorrowsWEI.toBigDecimal().div( decimalAdj )

    // Instrument's current Compounded VARIABLE Borrow Balance
    instrumentState.totalCompoundedVariableBorrowsWEI = event.params.totalCompoundedVariableBorrows
    instrumentState.totalCompoundedVariableBorrows = instrumentState.totalCompoundedVariableBorrowsWEI.toBigDecimal().div( decimalAdj )

    // Instrument's life-time $SIGH Accured as part of  "Borrowing $SIGH Stream"
    instrumentState.totalBorrowingSIGHAccuredWEI = instrumentState.totalBorrowingSIGHAccuredWEI.plus( event.params.sighAccured )
    instrumentState.totalBorrowingSIGHAccured = instrumentState.totalBorrowingSIGHAccuredWEI.toBigDecimal().div( BigInt.fromI32(10).pow(18 as u8).toBigDecimal() )

    // Instrument's current $SIGH Accured  as part of  "Borrowing $SIGH Stream", which is being distributed among the Instrument Borrowers
    instrumentState.currentBorrowingSIGHAccuredWEI = instrumentState.currentBorrowingSIGHAccuredWEI.plus( event.params.sighAccured )
    instrumentState.currentBorrowingSIGHAccured = instrumentState.currentBorrowingSIGHAccuredWEI.toBigDecimal().div( BigInt.fromI32(10).pow(18 as u8).toBigDecimal() )

    instrumentState.SIGH_Borrow_Index = event.params.newIndexMantissa      // INDEX is used for distributing $SIGH on a per token unit basis
    instrumentState.SIGH_Borrow_Index_lastUpdatedBlock = event.block.number     // Block Number when it was last updated
    
    instrumentState.save()
}




export function handleInstrumentAdded(event: InstrumentAdded): void {
    log.info('handleInstrumentAdded: 1st ',[])
    let instrumentId = event.params.instrumentAddress_.toHexString()    
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        log.info('handleInstrumentAdded: createInstrument ',[])
        instrumentState = createInstrument(instrumentId)
    }
    log.info('handleInstrumentAdded: instrumentId {} ',[instrumentId])
    log.info('handleInstrumentAdded: instrumentId  {} ',[instrumentId.toString()])
    instrumentState.isListedWithSIGH_Mechanism = true
    instrumentState.isSIGHMechanismActivated = false
    log.info('handleInstrumentAdded: 3st ',[])
    instrumentState.SIGH_Supply_Index = BigInt.fromI32(10).pow(36 as u8)  
    instrumentState.SIGH_Supply_Index_lastUpdatedBlock = event.block.number
    log.info('handleInstrumentAdded: 4st ',[])
    instrumentState.SIGH_Borrow_Index = BigInt.fromI32(10).pow(36 as u8)  
    instrumentState.SIGH_Borrow_Index_lastUpdatedBlock =  event.block.number
    log.info('handleInstrumentAdded: 5st ',[])

    instrumentState.present_SIGH_Side = 'inactive'
    instrumentState.present_maxVolatilityLimitSuppliers = BigInt.fromI32(10).pow(18 as u8) 
    instrumentState.present_maxVolatilityLimitSuppliersPercent = instrumentState.present_maxVolatilityLimitSuppliers.toBigDecimal().div( BigInt.fromI32(10).pow(16 as u8).toBigDecimal() )  
    instrumentState.present_maxVolatilityLimitBorrowers = BigInt.fromI32(10).pow(18 as u8)
    instrumentState.present_maxVolatilityLimitBorrowersPercent = instrumentState.present_maxVolatilityLimitBorrowers.toBigDecimal().div( BigInt.fromI32(10).pow(16 as u8).toBigDecimal() )  

    instrumentState.save()
}

export function handleInstrumentRemoved(event: InstrumentRemoved): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.isListedWithSIGH_Mechanism = false
    instrumentState.isSIGHMechanismActivated = false
    instrumentState.save()
}

export function handleInstrumentSIGHStateUpdated(event: InstrumentSIGHStateUpdated): void {
    let instrumentId = event.params.instrument_.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.isSIGHMechanismActivated = event.params.isSIGHMechanismActivated
    instrumentState.present_maxVolatilityLimitSuppliers = event.params.maxVolatilityLimitSuppliers
    instrumentState.present_maxVolatilityLimitSuppliersPercent = instrumentState.present_maxVolatilityLimitSuppliers.toBigDecimal().div( BigInt.fromI32(10).pow(16 as u8).toBigDecimal() )  
    instrumentState.present_maxVolatilityLimitBorrowers = event.params.maxVolatilityLimitBorrowers
    instrumentState.present_maxVolatilityLimitBorrowersPercent = instrumentState.present_maxVolatilityLimitBorrowers.toBigDecimal().div( BigInt.fromI32(10).pow(16 as u8).toBigDecimal() )  
    instrumentState.save()
}


export function handleStakingSpeedUpdated(event: StakingSpeedUpdated): void {
    let instrumentId = event.params.instrumentAddress_.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.present_SIGH_Staking_Speed_WEI = event.params.new_staking_Speed
    instrumentState.present_SIGH_Staking_Speed = instrumentState.present_SIGH_Staking_Speed_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
    instrumentState.save()
}



export function handlePriceSnapped(event: PriceSnapped): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    instrumentState.present_PrevPrice_ETH = event.params.prevPrice.toBigDecimal().div(  (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
    instrumentState.present_OpeningPrice_ETH = event.params.currentPrice.toBigDecimal().div(  (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
    instrumentState.present_DeltaBlocks = event.params.deltaBlocks
    instrumentState.present_Clock = event.params.currentClock

    let oracleAddress = instrumentState.oracle as Address
    let oracleContract = PriceOracleGetter.bind( oracleAddress )
    // GETTING ETH PRICE IN USD
    let ETH_PriceInUSD = oracleContract.getAssetPrice(Address.fromString('0x1b563766d835b49C5A7D9f5a0893d28e35746818')).toBigDecimal()
    let ETH_PriceInUSDDecimals = oracleContract.getAssetPriceDecimals(Address.fromString('0x1b563766d835b49C5A7D9f5a0893d28e35746818'))
    let ETHPriceInUSD = ETH_PriceInUSD.div(  BigInt.fromI32(10).pow(ETH_PriceInUSDDecimals as u8).toBigDecimal() )
  
    instrumentState.present_PrevPrice_USD = instrumentState.present_PrevPrice_ETH.times(ETHPriceInUSD)
    instrumentState.present_OpeningPrice_USD = instrumentState.present_OpeningPrice_ETH.times(ETHPriceInUSD)
    instrumentState.save()
}



export function handleInstrumentVolatilityCalculated(event: InstrumentVolatilityCalculated): void { 
    let instrumentId = event.params._Instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    instrumentState.present_total24HrVolatilityETH = event.params._total24HrVolatility.toBigDecimal().div(  (BigInt.fromI32(10).pow(18 as u8).toBigDecimal())  )
    instrumentState.present_24HrVolatilityLimitAmountETH = event.params._24HrVolatilityLimitAmount.toBigDecimal().div(  (BigInt.fromI32(10).pow(18 as u8).toBigDecimal())  )

    let oracleAddress = instrumentState.oracle as Address
    let oracleContract = PriceOracleGetter.bind( oracleAddress )
    // GETTING ETH PRICE IN USD
    let ETH_PriceInUSD = oracleContract.getAssetPrice(Address.fromString('0x1b563766d835b49C5A7D9f5a0893d28e35746818')).toBigDecimal()
    let ETH_PriceInUSDDecimals = oracleContract.getAssetPriceDecimals(Address.fromString('0x1b563766d835b49C5A7D9f5a0893d28e35746818'))
    let ETHPriceInUSD = ETH_PriceInUSD.div(  BigInt.fromI32(10).pow(ETH_PriceInUSDDecimals as u8).toBigDecimal() )

    instrumentState.present_total24HrVolatilityETH = instrumentState.present_total24HrVolatilityETH.times(ETHPriceInUSD) 
    instrumentState.present_24HrVolatilityLimitAmountETH = instrumentState.present_total24HrVolatilityETH.times(ETHPriceInUSD) 
    instrumentState.save()
}



export function handleRefreshingSighSpeeds(event: refreshingSighSpeeds): void {
    let instrumentId = event.params._Instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    if ( BigInt.fromI32(event.params.side)  == new BigInt(0) ) {
        instrumentState.present_SIGH_Side = 'inActive'
    }
    
    if ( BigInt.fromI32(event.params.side)  == new BigInt(1) ) {
    instrumentState.present_SIGH_Side = 'Suppliers'
    }

    if ( BigInt.fromI32(event.params.side)  == new BigInt(2) ) {
        instrumentState.present_SIGH_Side = 'Borrowers'
    }
    
    instrumentState.present_SIGH_Suppliers_Speed_WEI = event.params.supplierSpeed
    instrumentState.present_SIGH_Suppliers_Speed = instrumentState.present_SIGH_Suppliers_Speed_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
    instrumentState.present_SIGH_Borrowers_Speed_WEI = event.params.borrowerSpeed
    instrumentState.present_SIGH_Borrowers_Speed = instrumentState.present_SIGH_Borrowers_Speed_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )

    instrumentState.present_percentTotalVolatility = event.params._percentTotalVolatility.toBigDecimal().div(BigDecimal.fromString('10000'))
    instrumentState.present_percentTotalVolatilityLimitAmount = event.params._percentTotalVolatilityLimitAmount.toBigDecimal().div(BigDecimal.fromString('10000'))

    instrumentState.save()
}



export function handleAccuredSIGHTransferredToTheUser(event: AccuredSIGHTransferredToTheUser): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (!event.params.isLiquidityStream) {
        instrumentState.currentBorrowingSIGHAccuredWEI = instrumentState.currentBorrowingSIGHAccuredWEI.minus(event.params.sigh_Amount)
    }
    else {
        instrumentState.currentLiquiditySIGHAccuredWEI = instrumentState.currentLiquiditySIGHAccuredWEI.minus(event.params.sigh_Amount)
    }
    instrumentState.save()
}



export function handleSIGHSpeedUpdated(event: SIGHSpeedUpdated): void {
}

export function handleSpeedUpperCheckSwitched(event: SpeedUpperCheckSwitched): void {
}

export function handleMinimumBlocksForSpeedRefreshUpdated(event: minimumBlocksForSpeedRefreshUpdated): void {
}

export function handleMaxSIGHSpeedCalculated(event: MaxSIGHSpeedCalculated): void {
}
