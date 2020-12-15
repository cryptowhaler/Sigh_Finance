import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentUpdated, SIGH_PAY_Amount_Transferred } from "../../generated/Lending_Pool_Core/LendingPoolCore"
import { Instrument, StakingContract, StakingRewards } from "../../generated/schema"
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

    // INSTRUMENT PARAMTERS : SIGH PAY
    instrumentState.sighPayTransferredWEI = instrumentState.sighPayTransferredWEI.plus( event.params._sighPayAccured )
    instrumentState.sighPayTransferred = instrumentState.sighPayTransferredWEI.toBigDecimal().div(decimalAdj)
    instrumentState.sighPayPaidIndex = event.params.lastSIGHPayPaidIndex
    instrumentState.sighPayCumulativeIndex = event.params.lastSIGHPayCumulativeIndex

    // INSTRUMENT BALANCES : LENDING POOL
    instrumentState.availableLiquidity_WEI = instrumentState.availableLiquidity_WEI.minus(event.params._sighPayAccured)
    instrumentState.availableLiquidity = instrumentState.availableLiquidity_WEI.toBigDecimal().div(decimalAdj)
    instrumentState.totalCompoundedLiquidityWEI = instrumentState.totalCompoundedLiquidityWEI.minus(event.params._sighPayAccured)
    instrumentState.totalCompoundedLiquidity = instrumentState.totalCompoundedLiquidityWEI.toBigDecimal().div(decimalAdj)     

    // STAKING REWARD ENTITY : MAPPED WITH STAKING CONTRACT
    let StakingReward = StakingRewards.load(instrumentId)
    if (StakingReward == null) { 
        StakingReward = createStakingReward(instrumentId)
        StakingReward.name = instrumentState.underlyingInstrumentName
        StakingReward.symbol = instrumentState.underlyingInstrumentSymbol
        StakingReward.oracle = instrumentState.oracle
        StakingReward.decimals = instrumentState.decimals
    }

    // STAKING REWARD ENTITY PARAMETERS 
    StakingReward.lifeTimeBalance = StakingReward.lifeTimeBalance.plus( event.params._sighPayAccured.toBigDecimal().div(decimalAdj) )
    StakingReward.currentBalance = StakingReward.currentBalance.plus( event.params._sighPayAccured.toBigDecimal().div(decimalAdj) )
    StakingReward.lendingPool_SIGHPayInterestRatePercent = instrumentState.sighPayInterestRatePercent
    StakingReward.lendingPool_lastSIGHPayPaidIndex = instrumentState.sighPayPaidIndex
    StakingReward.lendingPool_lastSIGHPayCumulativeIndex = instrumentState.sighPayCumulativeIndex

    // GETTING INSTRUMENT PRICE IN ETH
    let oracleAddress = instrumentState.oracle as Address
    let oracleContract = PriceOracleGetter.bind( oracleAddress )  
    let instrumentAddress = instrumentState.instrumentAddress as Address
    let priceInETH = oracleContract.getAssetPrice( instrumentAddress ).toBigDecimal() 
    StakingReward.priceETH = priceInETH.div( BigInt.fromI32(10).pow( instrumentState.priceDecimals.toI32() as u8).toBigDecimal() ) 

    StakingReward.lifeTimeBalanceETH = StakingReward.lifeTimeBalance.times(StakingReward.priceETH)
    StakingReward.currentBalanceETH = StakingReward.currentBalance.times(StakingReward.priceETH)
    StakingReward.distributedBalanceETH = StakingReward.distributedBalance.times(StakingReward.priceETH)

    // GETTING ETH PRICE IN USD
    let ETH_PriceInUSD = oracleContract.getAssetPrice(Address.fromString('0xBFa39B812Cab46cf930fd50e0Cd868A06bFe60e0')).toBigDecimal()
    let ETH_PriceInUSDDecimals = oracleContract.getAssetPriceDecimals(Address.fromString('0xBFa39B812Cab46cf930fd50e0Cd868A06bFe60e0'))
    let ETHPriceInUSD = ETH_PriceInUSD.div(  BigInt.fromI32(10).pow(ETH_PriceInUSDDecimals as u8).toBigDecimal() )

    StakingReward.priceUSD = StakingReward.priceETH.times(ETHPriceInUSD)
    StakingReward.lifeTimeBalanceUSD = StakingReward.lifeTimeBalanceETH.times(ETHPriceInUSD)
    StakingReward.currentBalanceUSD = StakingReward.currentBalanceETH.times(ETHPriceInUSD)
    StakingReward.distributedBalanceUSD = StakingReward.distributedBalanceETH.times(ETHPriceInUSD)
    
    // STAKING CONTRACT
    let stakingContractID = event.params.stakingContract.toHexString()
    let stakingContract = StakingContract.load(stakingContractID)
    if (stakingContract == null) { 
        stakingContract = createStakingContract(stakingContractID)
    }

    stakingContract.save()
    
    StakingReward.stakingContract = stakingContractID

    StakingReward.save()
    instrumentState.save()

 }




 // ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

export function createStakingReward(ID: string): StakingRewards {
    let staking_reward = new StakingRewards(ID)
    staking_reward.name = null
    staking_reward.symbol = null
    staking_reward.decimals = BigInt.fromI32(0)
    staking_reward.oracle =  Address.fromString('0x667Dc203721D94Ea30055E25477c89732aC1C030',) 
    staking_reward.priceETH = BigDecimal.fromString('0')
    staking_reward.priceUSD = BigDecimal.fromString('0')

    staking_reward.stakingContract = '0x0000000000000000000000000000000000000000'

    staking_reward.lifeTimeBalance = BigDecimal.fromString('0')
    staking_reward.lifeTimeBalanceETH = BigDecimal.fromString('0')
    staking_reward.lifeTimeBalanceUSD = BigDecimal.fromString('0')

    staking_reward.currentBalance = BigDecimal.fromString('0')
    staking_reward.currentBalanceETH = BigDecimal.fromString('0')
    staking_reward.currentBalanceUSD = BigDecimal.fromString('0')

    staking_reward.distributedBalance = BigDecimal.fromString('0')
    staking_reward.distributedBalanceETH = BigDecimal.fromString('0')
    staking_reward.distributedBalanceUSD = BigDecimal.fromString('0')

    staking_reward.lendingPool_SIGHPayInterestRatePercent = BigDecimal.fromString('0')
    staking_reward.lendingPool_lastSIGHPayPaidIndex = BigInt.fromI32(0)
    staking_reward.lendingPool_lastSIGHPayCumulativeIndex = BigInt.fromI32(0)

    staking_reward.save()
    return staking_reward as StakingRewards

}

export function createStakingContract(ID: string): StakingContract {
    let staking_contract = new StakingContract(ID)
    staking_contract.save()
    return staking_contract as StakingContract
}
