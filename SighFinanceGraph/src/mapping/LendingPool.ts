import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { Deposit, RedeemUnderlying, Borrow, Repay, Swap, InstrumentUsedAsCollateralEnabled
 , InstrumentUsedAsCollateralDisabled , RebalanceStableBorrowRate, 
 FlashLoan, OriginationFeeLiquidated , LiquidationCall } from "../../generated/Lending_Pool/LendingPool"
import { Instrument } from "../../generated/schema"
import {updatePrice } from "./LendingPoolConfigurator"

// event Deposit( address indexed _instrument, address indexed _user, uint256 _amount, uint16 indexed _referral, uint256 _timestamp);
// ADDS To lifeTimeDeposits, totalLiquidity, availableLiquidity
export function handleDeposit(event: Deposit): void {
    log.info('LENDING-POOL : handleDeposit',[])                                
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = BigInt.fromI32(10).pow(instrumentState.decimals.toI32() as u8).toBigDecimal()
    log.info('LENDING-POOL : handleDeposit : decimalAdj - {}',[decimalAdj.toString()])                                

    instrumentState.lifeTimeDeposits_WEI = instrumentState.lifeTimeDeposits_WEI.plus(event.params._amount)
    instrumentState.lifeTimeDeposits = instrumentState.lifeTimeDeposits_WEI.toBigDecimal().div(decimalAdj)

    instrumentState.availableLiquidity_WEI = instrumentState.availableLiquidity_WEI.plus(event.params._amount)
    instrumentState.availableLiquidity = instrumentState.availableLiquidity_WEI.toBigDecimal().div(decimalAdj)

    instrumentState.save()

    updatePrice(instrumentId)
}


// event RedeemUnderlying(address indexed _instrument, address indexed _user, uint256 _amount, uint256 _timestamp);
// SUBTRACTS From totalLiquidity, availableLiquidity
export function handleRedeemUnderlying(event: RedeemUnderlying): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = BigInt.fromI32(10).pow(instrumentState.decimals.toI32() as u8).toBigDecimal()

    instrumentState.availableLiquidity_WEI = instrumentState.availableLiquidity_WEI.minus(event.params._amount)
    instrumentState.availableLiquidity = instrumentState.availableLiquidity_WEI.toBigDecimal().div(decimalAdj)

    instrumentState.save()    
    updatePrice(instrumentId)
}


// event Borrow(uint256 _amount, uint256 _borrowRateMode, uint256 _borrowRate, uint256 _originationFee, uint256 _borrowBalanceIncrease, uint16 indexed _referral, uint256 _timestamp);
// ADDED To lifeTimeBorrows, totalBorrows, borrowFee, lifetimeBorrowInterestAccured, totalStableBorrows || totalVariableBorrows
// SUBTRACTED FROM availableLiquidity, 
export function handleBorrow(event: Borrow): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = BigInt.fromI32(10).pow(instrumentState.decimals.toI32() as u8).toBigDecimal()

    // LIFE-TIME BORROWS
    instrumentState.lifeTimeBorrows_WEI = instrumentState.lifeTimeBorrows_WEI.plus(event.params._amount)
    instrumentState.lifeTimeBorrows = instrumentState.lifeTimeBorrows_WEI.toBigDecimal().div(decimalAdj)

    // AVAILABLE LIQUIDITY
    instrumentState.availableLiquidity_WEI = instrumentState.availableLiquidity_WEI.minus(event.params._amount)
    instrumentState.availableLiquidity = instrumentState.availableLiquidity_WEI.toBigDecimal().div(decimalAdj)

    // BORROW FEE (Currently DUE)
    instrumentState.borrowFeeDue_WEI = instrumentState.borrowFeeDue_WEI.plus(event.params._originationFee)
    instrumentState.borrowFeeDue = instrumentState.borrowFeeDue_WEI.toBigDecimal().div(decimalAdj)

    if (event.params._borrowRateMode == new BigInt(0) ) {
        // TOTAL PRINCIPAL (STABLE) BORROWS
        instrumentState.lifeTimeStableBorrows_WEI = instrumentState.lifeTimeStableBorrows_WEI.plus(event.params._amount)
        instrumentState.lifeTimeStableBorrows = instrumentState.lifeTimeStableBorrows_WEI.toBigDecimal().div(decimalAdj)    
    }
    else {
        // TOTAL PRINCIPAL (VARIABLE) BORROWS
        instrumentState.lifeTimeVariableBorrows_WEI = instrumentState.lifeTimeVariableBorrows_WEI.plus(event.params._amount)
        instrumentState.lifeTimeVariableBorrows = instrumentState.lifeTimeVariableBorrows_WEI.toBigDecimal().div(decimalAdj)    
    }

    // TOTAL EARNINGS FROM BORROWING
    instrumentState.totalBorrowingEarnings_WEI = instrumentState.totalBorrowingEarnings_WEI.plus(event.params._borrowBalanceIncrease)
    instrumentState.totalBorrowingEarnings = instrumentState.totalBorrowingEarnings_WEI.toBigDecimal().div(decimalAdj) 

    instrumentState.save()    
    updatePrice(instrumentId)
}


// event Repay( address indexed _instrument, address indexed _user, address indexed _repayer, uint256 _amountMinusFees, uint256 _fees, uint256 _borrowBalanceIncrease, uint256 _timestamp);
export function handleRepay(event: Repay): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = BigInt.fromI32(10).pow(instrumentState.decimals.toI32() as u8).toBigDecimal()

    // AVAILABLE LIQUIDITY
    instrumentState.availableLiquidity_WEI = instrumentState.availableLiquidity_WEI.plus(event.params._amountMinusFees)
    instrumentState.availableLiquidity = instrumentState.availableLiquidity_WEI.toBigDecimal().div(decimalAdj)

    // BORROW FEE (Currently DUE)
    instrumentState.borrowFeeDue_WEI = instrumentState.borrowFeeDue_WEI.minus(event.params._fees)
    instrumentState.borrowFeeDue = instrumentState.borrowFeeDue_WEI.toBigDecimal().div(decimalAdj)

    // BORROW FEE (Earned)
    instrumentState.borrowFeeEarned_WEI = instrumentState.borrowFeeEarned_WEI.plus(event.params._fees)
    instrumentState.borrowFeeEarned = instrumentState.borrowFeeEarned_WEI.toBigDecimal().div(decimalAdj)

    // TOTAL BORROW AMOUNT RE-PAID
    instrumentState.lifeTimeBorrowsRepaid_WEI = instrumentState.lifeTimeBorrowsRepaid_WEI.plus(event.params._amountMinusFees)
    instrumentState.lifeTimeBorrowsRepaid = instrumentState.lifeTimeBorrowsRepaid_WEI.toBigDecimal().div(decimalAdj)

    // TOTAL EARNINGS FROM BORROWING
    instrumentState.totalBorrowingEarnings_WEI = instrumentState.totalBorrowingEarnings_WEI.plus(event.params._borrowBalanceIncrease)
    instrumentState.totalBorrowingEarnings = instrumentState.totalBorrowingEarnings_WEI.toBigDecimal().div(decimalAdj) 


    instrumentState.save()   
    updatePrice(instrumentId) 
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

