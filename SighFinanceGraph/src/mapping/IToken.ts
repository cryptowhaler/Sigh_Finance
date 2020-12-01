

import { Instrument } from "../../generated/schema"


export function handleSighAccured(event: SighAccured): void {
    let instrumentId = event.params.underlyingInstrumentAddress
    let instrumentState = Instrument.load(instrumentId)

    // Subtracting the $SIGH accured by the User from the $SIGH Amount that has been accured by the Instrument (Liquidity / Borrowing Streams)
    if (event.params.isLiquidityStream) {
        instrumentState.currentLiquiditySIGHAccuredWEI = instrumentState.currentLiquiditySIGHAccuredWEI.minus( event.params.recentSIGHAccured )
    }
    else 
    {
        instrumentState.currentBorrowingSIGHAccuredWEI = instrumentState.currentBorrowingSIGHAccuredWEI.minus( event.params.recentSIGHAccured )
    }

    instrumentState.save()
}

export function handleMintOnDeposit(event: MintOnDeposit): void {
    //    event MintOnDeposit(address indexed _from, uint256 _value, uint256 _fromBalanceIncrease, uint256 _fromIndex);
}