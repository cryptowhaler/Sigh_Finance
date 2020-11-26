import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { Deposit, RedeemUnderlying, Borrow, Repay, Swap, InstrumentUsedAsCollateralEnabled
 , InstrumentUsedAsCollateralDisabled , RebalanceStableBorrowRate, 
 FlashLoan, OriginationFeeLiquidated , LiquidationCall } from "../../generated/LendingPool/LendingPool"
import { Instrument } from "../../generated/schema"


// event Deposit( address indexed _instrument, address indexed _user, uint256 _amount, uint16 indexed _referral, uint256 _timestamp);
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


// event RedeemUnderlying(address indexed _instrument, address indexed _user, uint256 _amount, uint256 _timestamp);
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


// event Borrow(uint256 _amount, uint256 _borrowRateMode, uint256 _borrowRate, uint256 _originationFee, uint256 _borrowBalanceIncrease, uint16 indexed _referral, uint256 _timestamp);
// ADDED To lifeTimeBorrows, totalBorrows, borrowFee, lifetimeBorrowInterestAccured, totalStableBorrows || totalVariableBorrows
// SUBTRACTED FROM availableLiquidity, 
export function handleBorrow(event: Borrow): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = new BigInt(10).pow(instrumentState.decimals)

    // LIFE-TIME BORROWS
    instrumentState.lifeTimeBorrows_WEI = instrumentState.lifeTimeBorrows_WEI.plus(event.params._amount)
    instrumentState.lifeTimeBorrows = instrumentState.lifeTimeBorrows_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    // AVAILABLE LIQUIDITY
    instrumentState.availableLiquidity_WEI = instrumentState.availableLiquidity_WEI.minus(event.params._amount)
    instrumentState.availableLiquidity = instrumentState.availableLiquidity_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    // TOTAL PRINCIPAL BORROWS
    instrumentState.totalPrincipalBorrows_WEI = instrumentState.totalPrincipalBorrows_WEI.plus(event.params._amount)
    instrumentState.totalPrincipalBorrows = instrumentState.totalPrincipalBorrows_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    // BORROW FEE (Currently DUE)
    instrumentState.borrowFeeDue_WEI = instrumentState.borrowFeeDue_WEI.plus(event.params._originationFee)
    instrumentState.borrowFeeDue = instrumentState.borrowFeeDue_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    if (event.params._borrowRateMode == 0) {
        // TOTAL PRINCIPAL (STABLE) BORROWS
        instrumentState.totalPrincipalStableBorrows_WEI = instrumentState.totalPrincipalStableBorrows_WEI.plus(event.params._amount)
        instrumentState.totalPrincipalStableBorrows = instrumentState.totalPrincipalStableBorrows_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())    

        // COMPOUNDED EARNINGS : STABLE BORROWS
        instrumentState.totalCompoundedEarningsSTABLEInterest_WEI = instrumentState.totalCompoundedEarningsSTABLEInterest_WEI.plus(event.params._borrowBalanceIncrease)
        instrumentState.totalCompoundedEarningsSTABLEInterest = instrumentState.totalCompoundedEarningsSTABLEInterest_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())    

       //  STABLE BORROW INTEREST RATE
       instrumentState.stableBorrowInterestRate = event.params._borrowRate
        instrumentState.stableBorrowInterestPercent = 0 // instrumentState.stableBorrowInterestRate.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())    

    }
    else {
        // TOTAL PRINCIPAL (VARIABLE) BORROWS
        instrumentState.totalPrincipalVariableBorrows_WEI = instrumentState.totalPrincipalVariableBorrows_WEI.plus(event.params._amount)
        instrumentState.totalVariableBorrows = instrumentState.totalPrincipalVariableBorrows_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())    

        // COMPOUNDED EARNINGS : VARIABLE BORROWS
        instrumentState.totalCompoundedEarningsVARIABLEInterest_WEI = instrumentState.totalCompoundedEarningsVARIABLEInterest_WEI.plus(event.params._borrowBalanceIncrease)
        instrumentState.totalCompoundedEarningsVARIABLEInterest = instrumentState.totalCompoundedEarningsVARIABLEInterest_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())    

       //  VARIABLE BORROW INTEREST RATE
        instrumentState.variableBorrowInterestRate = event.params._borrowRate
        instrumentState.variableBorrowInterestPercent = 0 // instrumentState.stableBorrowInterestRate.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())    
    }

    // instrumentState.totalPrincipalBorrows_WEI = instrumentState.totalPrincipalStableBorrows_WEI.plus(instrumentState.totalPrincipalVariableBorrows_WEI)
    // instrumentState.totalPrincipalBorrows = instrumentState.totalPrincipalStableBorrows.plus(instrumentState.totalVariableBorrows)

    // TOTAL COMPOUNDED EARNINGS 
    instrumentState.totalCompoundedEarnings_WEI = instrumentState.totalCompoundedEarningsVARIABLEInterest_WEI.plus(instrumentState.totalCompoundedEarningsSTABLEInterest_WEI)
    instrumentState.totalCompoundedEarnings = instrumentState.totalCompoundedEarningsVARIABLEInterest.plus(instrumentState.totalCompoundedEarningsSTABLEInterest)

    instrumentState.timeStamp = event.params._timestamp
    instrumentState.save()    
}


// event Repay( address indexed _instrument, address indexed _user, address indexed _repayer, uint256 _amountMinusFees, uint256 _fees, uint256 _borrowBalanceIncrease, uint256 _timestamp);
export function handleRepay(event: Repay): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = new BigInt(10).pow(instrumentState.decimals)

    // AVAILABLE LIQUIDITY
    instrumentState.availableLiquidity_WEI = instrumentState.availableLiquidity_WEI.plus(event.params._amountMinusFees)
    instrumentState.availableLiquidity = instrumentState.availableLiquidity_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    // TOTAL PRINCIPAL BORROWS
    instrumentState.totalPrincipalBorrows_WEI = instrumentState.totalPrincipalBorrows_WEI.minus(event.params._amountMinusFees)
    instrumentState.totalPrincipalBorrows = instrumentState.totalPrincipalBorrows_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

    // BORROW FEE (Earned)
    instrumentState.borrowFeeEarned_WEI = instrumentState.borrowFeeEarned_WEI.plus(event.params._fees)
    instrumentState.borrowFeeEarned = instrumentState.borrowFeeEarned_WEI.toBigDecimal().divDecimal(decimalAdj.toBigDecimal())

        // _borrowBalanceIncrease



    // event.params._amount._amountMinusFees --> Amount Repaid, subtracting Fee
    // event.params._amount._fees --> Fee (Origination Fee)
    // event.params._amount._borrowBalanceIncrease --> Increase in BorrowBalance of the user due to accuring Interest

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

