import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentUpdated } from "../../generated/Lending_Pool_Core/LendingPoolCore"
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

    // Indexes tracking Interest Accumulation
    instrumentState.supplyIndex = event.params.liquidityIndex
    instrumentState.variableBorrowIndex = event.params.variableBorrowIndex

    instrumentState.save()
    updatePrice(instrumentId)
}