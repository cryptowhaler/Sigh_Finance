import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentUpdated } from "../../generated/LendingPoolCore/LendingPoolCore"
import { Instrument } from "../../generated/schema"

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

    instrumentState.timeStamp = event.params._timestamp
    instrumentState.save()
}