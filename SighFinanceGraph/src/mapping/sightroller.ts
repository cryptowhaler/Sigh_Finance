import { BigInt } from "@graphprotocol/graph-ts"
import {
  DistributedBorrowerGsigh,
  DistributedSupplierGsigh,
  GsighSpeedUpdated,
  MarketEntered,
  MarketExited,
  MarketGsighed,
  MarketListed,
  NewCloseFactor,
  NewCollateralFactor,
  NewGsighRate,
  NewLiquidationIncentive,
  NewMaxAssets,
  NewPauseGuardian,
  NewPriceOracle
} from "../../generated/Sightroller/Sightroller"

import { Sightroller, Market } from "../../generated/schema"
import { mantissaFactorBD, updateCommonCTokenStats } from '../helpers'

// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING

export function handleNewCloseFactor(event: NewCloseFactor): void {
  let sightroller = Sightroller.load('1')
  sightroller.closeFactor = event.params.newCloseFactorMantissa
  sightroller.save()
}

export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  let sightroller = Sightroller.load('1')
  sightroller.liquidationIncentive = event.params.newLiquidationIncentiveMantissa
  sightroller.save()
}

export function handleNewMaxAssets(event: NewMaxAssets): void {
  let sightroller = Sightroller.load('1')
  sightroller.maxAssets = event.params.newMaxAssets
  sightroller.save()
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = new Sightroller('1')
  }
  sightroller.priceOracle = event.params.newPriceOracle
  sightroller.save()
}

export function handleNewPauseGuardian(event: NewPauseGuardian): void {
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = new Sightroller('1')
  }
  sightroller.pauseGuardian = event.params.newPauseGuardian
  sightroller.save()  
}

export function handleNewGsighRate(event: NewGsighRate): void {
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = new Sightroller('1')
  }
  sightroller.gsighRate = event.params.newGsighRate
  sightroller.save()
}























// AccountCToken (user + a particular market related)
export function handleMarketExited(event: MarketExited): void {
  let market = Market.load(event.params.cToken.toHexString())
  let accountID = event.params.account.toHex()
  let cTokenStats = updateCommonCTokenStats(
    market.id,
    market.symbol,
    accountID,
    event.transaction.hash,
    event.block.timestamp.toI32(),
    event.block.number.toI32(),
  )
  cTokenStats.enteredMarket = false
  cTokenStats.save()
}



// AccountCToken (user + a particular market related)
export function handleMarketEntered(event: MarketEntered): void {
  let market = Market.load(event.params.cToken.toHexString())
  let accountID = event.params.account.toHex()
  let cTokenStats = updateCommonCTokenStats(
    market.id,
    market.symbol,
    accountID,
    event.transaction.hash,
    event.block.timestamp.toI32(),
    event.block.number.toI32(),
  )
  cTokenStats.enteredMarket = true
  cTokenStats.save()
}

// AccountCToken (user + a particular market related)
export function handleDistributedBorrowerGsigh(event: DistributedBorrowerGsigh): void {}

// AccountCToken (user + a particular market related)
export function handleDistributedSupplierGsigh(event: DistributedSupplierGsigh): void {}










// for market
export function handleGsighSpeedUpdated(event: GsighSpeedUpdated): void {}

// for market
export function handleMarketGsighed(event: MarketGsighed): void {}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let market = Market.load(event.params.cToken.toHexString())
  market.collateralFactor = event.params.newCollateralFactorMantissa.toBigDecimal().div(mantissaFactorBD)
  market.save()
}


// Market gets listed
export function handleMarketListed(event: MarketListed): void {}





























/* eslint-disable prefer-const */ // to satisfy AS compiler

// For each division by 10, add one to exponent to truncate one significant figure
import { Address, BigDecimal, BigInt, log } from '@graphprotocol/graph-ts/index'
import { Market, Comptroller } from '../types/schema'
// PriceOracle is valid from Comptroller deployment until block 8498421
import { PriceOracle } from '../types/cREP/PriceOracle'
// PriceOracle2 is valid from 8498422 until present block (until another proxy upgrade)
import { PriceOracle2 } from '../types/cREP/PriceOracle2'
import { ERC20 } from '../types/cREP/ERC20'
import { CToken } from '../types/cREP/CToken'

import {exponentToBigDecimal,mantissaFactor,mantissaFactorBD,cTokenDecimalsBD,zeroBD,} from '../helpers'

let cUSDCAddress = '0x39aa39c021dfbae8fac545936693ac917d5e7563'
let cETHAddress = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5'
let daiAddress = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'

// Used for all cERC20 contracts
function getTokenPrice(blockNumber: i32,eventAddress: Address,underlyingAddress: Address,underlyingDecimals: i32,): BigDecimal {
  let comptroller = Comptroller.load('1')
  let oracleAddress = comptroller.priceOracle as Address
  let underlyingPrice: BigDecimal
  let mantissaDecimalFactor = 18 - underlyingDecimals + 18
  let bdFactor = exponentToBigDecimal(mantissaDecimalFactor)
  let oracle2 = PriceOracle2.bind(oracleAddress)
  underlyingPrice = oracle2.getUnderlyingPrice(eventAddress).toBigDecimal().div(bdFactor)
  return underlyingPrice
}


export function createMarket(marketAddress: string): Market {
  let market: Market
  let contract = CToken.bind(Address.fromString(marketAddress))

  // It is CETH, which has a slightly different interface
  if (marketAddress == cETHAddress) {
    market = new Market(marketAddress)
    market.underlyingAddress = Address.fromString('0x0000000000000000000000000000000000000000',)
    market.underlyingDecimals = 18
    market.underlyingPrice = BigDecimal.fromString('1')
    market.underlyingName = 'Ether'
    market.underlyingSymbol = 'ETH'
  } 
  // For the remaining ERC20 Tokens
  else {
    market = new Market(marketAddress)
    market.underlyingAddress = contract.underlying()
    let underlyingContract = ERC20.bind(market.underlyingAddress as Address)
    market.underlyingDecimals = underlyingContract.decimals()
    if (market.underlyingAddress.toHexString() != daiAddress) {
      market.underlyingName = underlyingContract.name()
      market.underlyingSymbol = underlyingContract.symbol()
    } else {
      market.underlyingName = 'Dai Stablecoin v1.0 (DAI)'
      market.underlyingSymbol = 'DAI'
    }
    if (marketAddress == cUSDCAddress) {
      market.underlyingPriceUSD = BigDecimal.fromString('1')
    }
  }

  market.borrowRate = zeroBD
  market.cash = zeroBD
  market.collateralFactor = zeroBD
  market.exchangeRate = zeroBD
  market.interestRateModelAddress = Address.fromString(
    '0x0000000000000000000000000000000000000000',
  )
  market.name = contract.name()
  market.numberOfBorrowers = 0
  market.numberOfSuppliers = 0
  market.reserves = zeroBD
  market.supplyRate = zeroBD
  market.symbol = contract.symbol()
  market.totalBorrows = zeroBD
  market.totalSupply = zeroBD
  market.underlyingPrice = zeroBD

  market.accrualBlockNumber = 0
  market.blockTimestamp = 0
  market.borrowIndex = zeroBD
  market.reserveFactor = BigInt.fromI32(0)
  market.underlyingPriceUSD = zeroBD

  return market
}



// 
export function updateMarket(marketAddress: Address,blockNumber: i32,blockTimestamp: i32,): Market {
  let marketID = marketAddress.toHexString()
  let market = Market.load(marketID)

  if (market == null) {
    market = createMarket(marketID)
  }

  // Update Market if it has not been updated this block
  if (market.accrualBlockNumber != blockNumber) {
    let contractAddress = Address.fromString(market.id)
    let contract = CToken.bind(contractAddress)

    // if cETH, we only update USD price
    if (market.id == cETHAddress) {
      market.underlyingPriceUSD = market.underlyingPrice.truncate(market.underlyingDecimals)
    } 
    else {
      let tokenPriceEth = getTokenPrice(blockNumber,contractAddress,market.underlyingAddress as Address, market.underlyingDecimals,)
      market.underlyingPrice = tokenPriceEth.truncate(market.underlyingDecimals)
      // if USDC, we only update ETH price
      if (market.id != cUSDCAddress) {
        market.underlyingPriceUSD = market.underlyingPrice.truncate(market.underlyingDecimals)
      }
    }

    market.accrualBlockNumber = contract.accrualBlockNumber().toI32()
    market.blockTimestamp = blockTimestamp
    market.totalSupply = contract.totalSupply().toBigDecimal() d.div(cTokenDecimalsBD)

    /* Exchange rate explanation
       In Practice
        - If you call the cDAI contract on etherscan it comes back (2.0 * 10^26)
        - If you call the cUSDC contract on etherscan it comes back (2.0 * 10^14)
        - The real value is ~0.02. So cDAI is off by 10^28, and cUSDC 10^16
       How to calculate for tokens with different decimals
        - Must div by tokenDecimals, 10^market.underlyingDecimals
        - Must multiply by ctokenDecimals, 10^8
        - Must div by mantissa, 10^18
     */
    market.exchangeRate = contract.exchangeRateStored().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).times(cTokenDecimalsBD).div(mantissaFactorBD).truncate(mantissaFactor)
    market.borrowIndex = contract.borrowIndex().toBigDecimal().div(mantissaFactorBD).truncate(mantissaFactor)

    market.reserves = contract.totalReserves().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).truncate(market.underlyingDecimals)
    market.totalBorrows = contract.totalBorrows().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).truncate(market.underlyingDecimals)
    market.cash = contract.getCash().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).truncate(market.underlyingDecimals)

    // Must convert to BigDecimal, and remove 10^18 that is used for Exp in Compound Solidity
    market.supplyRate = contract.borrowRatePerBlock().toBigDecimal().times(BigDecimal.fromString('2102400')).div(mantissaFactorBD).truncate(mantissaFactor)

    let supplyRatePerBlock = contract.try_supplyRatePerBlock()
    if (supplyRatePerBlock.reverted) {
      log.info('***CALL FAILED*** : cERC20 supplyRatePerBlock() reverted', [])
      market.borrowRate = zeroBD
    } else {
      market.borrowRate = supplyRatePerBlock.value.toBigDecimal().times(BigDecimal.fromString('2102400')).div(mantissaFactorBD).truncate(mantissaFactor)
    }
    market.save()
  }
  return market as Market
}