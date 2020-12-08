import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentUpdated, SIGH_PAY_Amount_Transferred } from "../../generated/Lending_Pool_Core/LendingPoolCore"
import { Instrument } from "../../generated/schema"
import { ERC20Detailed } from '../../generated/Lending_Pool_Core/ERC20Detailed'
import { PriceOracleGetter } from '../../generated/Lending_Pool_Core/PriceOracleGetter'
import {updatePrice } from "./LendingPoolConfigurator"


export function handleInstrumentUpdated(event: InstrumentUpdated): void {
    log.info('handleInstrumentUpdated() in Core',[])
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    
    // From Interest Rate Strategy Contract calculateInterestRates() function
    instrumentState.supplyInterestRate = event.params.liquidityRate  
    instrumentState.supplyInterestRatePercent =  instrumentState.supplyInterestRate.toBigDecimal().div( BigInt.fromI32(10).pow(25 as u8).toBigDecimal() )

    instrumentState.stableBorrowInterestRate = event.params.stableBorrowRate  
    instrumentState.stableBorrowInterestPercent = instrumentState.stableBorrowInterestRate.toBigDecimal().div( BigInt.fromI32(10).pow(25 as u8).toBigDecimal() )

    instrumentState.variableBorrowInterestRate = event.params.variableBorrowRate  
    instrumentState.variableBorrowInterestPercent =  instrumentState.variableBorrowInterestRate.toBigDecimal().div( BigInt.fromI32(10).pow(25 as u8).toBigDecimal() )

    instrumentState.sighPayInterestRate = event.params.newSighPayRate  
    instrumentState.sighPayInterestRatePercent =  instrumentState.sighPayInterestRate.toBigDecimal().div( BigInt.fromI32(10).pow(25 as u8).toBigDecimal() )

    if ( instrumentState.totalCompoundedBorrows > BigDecimal.fromString('0') ) {
        instrumentState.utilizationRate = instrumentState.totalCompoundedBorrows.times( BigInt.fromI32(10).pow(25 as u8).toBigDecimal() ).div(instrumentState.availableLiquidity.plus(instrumentState.totalCompoundedBorrows))
        instrumentState.utilizationRatePercent = instrumentState.utilizationRate.div( BigInt.fromI32(10).pow(23 as u8).toBigDecimal() )
    }

    // Indexes tracking Interest Accumulation
    instrumentState.supplyIndex = event.params.liquidityIndex
    instrumentState.variableBorrowIndex = event.params.variableBorrowIndex
    instrumentState.sighPayCumulativeIndex = event.params.sighPayIndex

    instrumentState.save()
    // updatePrice(instrumentId)
}

export function handleSIGH_Pay_Amount_Transferred(event: SIGH_PAY_Amount_Transferred): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = BigInt.fromI32(10).pow(instrumentState.decimals.toI32() as u8).toBigDecimal()

    instrumentState.sighPayTransferredWEI   = instrumentState.sighPayTransferredWEI.plus(event.params._sighPayAccured)
    instrumentState.sighPayTransferred = instrumentState.sighPayTransferredWEI.toBigDecimal().div(decimalAdj)

    instrumentState.sighPayCumulativeIndex = event.params.lastSIGHPayCumulativeIndex
    instrumentState.sighPayPaidIndex = event.params.lastSIGHPayPaidIndex

    instrumentState.save()
    updatePrice(instrumentId)
 }
