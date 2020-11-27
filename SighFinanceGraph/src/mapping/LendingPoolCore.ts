import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentUpdated } from "../../generated/Lending_Pool_Core/LendingPoolCore"
import { Instrument } from "../../generated/schema"
import { ERC20Detailed } from '../../generated/Lending_Pool_Core/ERC20Detailed'
import { PriceOracleGetter } from '../../generated/Lending_Pool_Core/PriceOracleGetter'

export function handleInstrumentUpdated(event: InstrumentUpdated): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    
    // From Interest Rate Strategy Contract calculateInterestRates() function
    instrumentState.supplyInterestRate = event.params.liquidityRate  
    // instrumentState.supplyInterestRatePercent = 
    instrumentState.stableBorrowInterestRate = event.params.stableBorrowRate  
    // instrumentState.stableBorrowInterestPercent = 
    instrumentState.variableBorrowInterestRate = event.params.variableBorrowRate  
    // instrumentState.variableBorrowInterestPercent = 

    // Indexes tracking Interest Accumulation
    instrumentState.supplyIndex = event.params.liquidityIndex
    instrumentState.variableBorrowIndex = event.params.variableBorrowIndex

    instrumentState.save()
}