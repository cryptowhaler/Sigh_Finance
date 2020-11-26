import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { Deposit, RedeemUnderlying, Borrow, Repay, Swap, InstrumentUsedAsCollateralEnabled
 , InstrumentUsedAsCollateralDisabled , RebalanceStableBorrowRate, 
 FlashLoan, OriginationFeeLiquidated , LiquidationCall } from "../../generated/LendingPool/LendingPool"
import { Instrument } from "../../generated/schema"



// ADDS To lifeTimeDeposits, totalLiquidity, availableLiquidity
export function handleDeposit(event: Deposit): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = new BigInt(10).pow(instrumentState.decimals)

    instrumentState.lifeTimeDeposits_WEI = instrumentState.lifeTimeDeposits.plus(event.params._amount)
    instrumentState.lifeTimeDeposits = instrumentState.lifeTimeDeposits_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    instrumentState.totalLiquidity_WEI = instrumentState.totalLiquidity_WEI.plus(event.params._amount)
    instrumentState.totalLiquidity = instrumentState.totalLiquidity_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    instrumentState.availableLiquidity_WEI = instrumentState.availableLiquidity_WEI.plus(event.params._amount)
    instrumentState.availableLiquidity = instrumentState.availableLiquidity_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    instrumentState.timeStamp = event.params._timestamp
    instrumentState.save()
}



// SUBTRACTS From totalLiquidity, availableLiquidity
export function handleRedeemUnderlying(event: RedeemUnderlying): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = new BigInt(10).pow(instrumentState.decimals)

    instrumentState.totalLiquidity_WEI = instrumentState.totalLiquidity_WEI.minus(event.params._amount)
    instrumentState.totalLiquidity = instrumentState.totalLiquidity_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    instrumentState.availableLiquidity_WEI = instrumentState.availableLiquidity_WEI.minus(event.params._amount)
    instrumentState.availableLiquidity = instrumentState.availableLiquidity_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    instrumentState.timeStamp = event.params._timestamp
    instrumentState.save()    
}



// ADDED To lifeTimeBorrows, totalBorrows, borrowFee, lifetimeBorrowInterestAccured, totalStableBorrows || totalVariableBorrows
// SUBTRACTED FROM availableLiquidity, 
export function handleBorrow(event: Borrow): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = new BigInt(10).pow(instrumentState.decimals)

    instrumentState.lifeTimeBorrows_WEI = instrumentState.lifeTimeBorrows_WEI.plus(event.params._amount)
    instrumentState.lifeTimeBorrows = instrumentState.lifeTimeBorrows_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    instrumentState.availableLiquidity_WEI = instrumentState.availableLiquidity_WEI.minus(event.params._amount)
    instrumentState.availableLiquidity = instrumentState.availableLiquidity_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    instrumentState.totalBorrows_WEI = instrumentState.totalBorrows_WEI.plus(event.params._amount)
    instrumentState.totalBorrows = instrumentState.totalBorrows_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    instrumentState.borrowFee_WEI = instrumentState.BorrowFee_WEI.plus(event.params._originationFee)
    instrumentState.borrowFee = instrumentState.BorrowFee_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    // event.params._amount._borrowRateMode --> Interest Rate Mode, i.e Stable / Variable
    // event.params._amount._borrowRate --> Rate at which User is entering this Borrow
    // event.params._amount._originationFee --> Fee Paid by user for this Borrow
    // event.params._amount._borrowBalanceIncrease --> Increase in BorrowBalance of the user due to accuring Interest
    
    instrumentState.lifetimeBorrowInterestAccured_WEI = instrumentState.lifetimeBorrowInterestAccured_WEI.plus(event.params._borrowBalanceIncrease)
    instrumentState.lifetimeBorrowInterestAccured = instrumentState.lifetimeBorrowInterestAccured_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())


    if (event.params._borrowRateMode == 0) {
        instrumentState.totalStableBorrows_WEI = instrumentState.totalStableBorrows_WEI.plus(event.params._amount)
        instrumentState.totalStableBorrows = instrumentState.totalStableBorrows_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())    
    }
    else {
        instrumentState.totalVariableBorrows_WEI = instrumentState.totalStableBorrows_WEI.plus(event.params._amount)
        instrumentState.totalVariableBorrows = instrumentState.totalStableBorrows_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())    
    }

    instrumentState.timeStamp = event.params._timestamp
    instrumentState.save()    
}



export function handleRepay(event: Repay): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = new BigInt(10).pow(instrumentState.decimals)

    instrumentState.availableLiquidity_WEI = instrumentState.availableLiquidity_WEI.minus( event.params._amountMinusFees + event.params._fees )
    instrumentState.availableLiquidity = instrumentState.availableLiquidity_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    instrumentState.totalBorrows_WEI = instrumentState.totalBorrows_WEI.minus( event.params._amountMinusFees)
    instrumentState.totalBorrows = instrumentState.totalBorrows_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    // event.params._amount._amountMinusFees --> Amount Repaid, subtracting Fee
    // event.params._amount._fees --> Fee (Origination Fee)
    // event.params._amount._borrowBalanceIncrease --> Increase in BorrowBalance of the user due to accuring Interest


    event Repay( uint256 _amountMinusFees, uint256 _fees, uint256 _borrowBalanceIncrease, uint256 _timestamp);

    instrumentState.timeStamp = event.params._timestamp
    instrumentState.save()    
}

export function handleSwap(event: Swap): void {
}

export function handleInstrumentUsedAsCollateralEnabled(event: InstrumentUsedAsCollateralEnabled): void {
}

export function handleInstrumentUsedAsCollateralDisabled(event: InstrumentUsedAsCollateralDisabled): void {
}

export function handleRebalanceStableBorrowRate(event: RebalanceStableBorrowRate): void {
}

export function handleFlashLoan(event: FlashLoan): void {
}

export function handleOriginationFeeLiquidated(event: OriginationFeeLiquidated): void {
}

export function handleLiquidationCall(event: LiquidationCall): void {
}

