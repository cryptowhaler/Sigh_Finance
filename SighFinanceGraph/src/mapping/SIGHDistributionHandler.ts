import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentAdded, InstrumentRemoved, InstrumentSIGHed, SIGHSpeedUpdated, StakingSpeedUpdated, SpeedUpperCheckSwitched
 , minimumBlocksForSpeedRefreshUpdated , PriceSnapped, SIGHBorrowIndexUpdated, AccuredSIGHTransferredToTheUser,
 MaxSIGHSpeedCalculated, refreshingSighSpeeds , SIGHSupplyIndexUpdated } from "../../generated/Sigh_Distribution_Handler/SIGHDistributionHandler"
import { Instrument } from "../../generated/schema"


export function handleInstrumentAdded(event: InstrumentAdded): void {
    let instrumentId = event.params.instrumentAddress_.toHexString()
    let instrumentState = Instrument.load(instrumentId)
}

export function handleInstrumentRemoved(event: InstrumentRemoved): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
}

export function handleInstrumentSIGHed(event: InstrumentSIGHed): void {
    let instrumentId = event.params.instrumentAddress_.toHexString()
    let instrumentState = Instrument.load(instrumentId)
}

export function handleSIGHSpeedUpdated(event: SIGHSpeedUpdated): void {
}

export function handleStakingSpeedUpdated(event: StakingSpeedUpdated): void {
    let instrumentId = event.params.instrumentAddress_.toHexString()
    let instrumentState = Instrument.load(instrumentId)
}

export function handleSpeedUpperCheckSwitched(event: SpeedUpperCheckSwitched): void {
    // let instrumentId = event.params._instrument.toHexString()
    // let instrumentState = Instrument.load(instrumentId)
}

export function handleMinimumBlocksForSpeedRefreshUpdated(event: minimumBlocksForSpeedRefreshUpdated): void {
    // let instrumentId = event.params._instrument.toHexString()
    // let instrumentState = Instrument.load(instrumentId)
}

export function handlePriceSnapped(event: PriceSnapped): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
}

export function handleMaxSIGHSpeedCalculated(event: MaxSIGHSpeedCalculated): void {
    // let instrumentId = event.params._instrument.toHexString()
    // let instrumentState = Instrument.load(instrumentId)
}

export function handleRefreshingSighSpeeds(event: refreshingSighSpeeds): void {
    let instrumentId = event.params._Instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
}

export function handleSIGHSupplyIndexUpdated(event: SIGHSupplyIndexUpdated): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
}

export function handleSIGHBorrowIndexUpdated(event: SIGHBorrowIndexUpdated): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
}

export function handleAccuredSIGHTransferredToTheUser(event: AccuredSIGHTransferredToTheUser): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
}

