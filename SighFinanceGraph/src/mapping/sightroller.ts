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
import { mantissaFactorBD, updateUserAccount_IndividualMarketStats } from '../helpers'

// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING
// SIGHTROLLER GLOBAL VARIABLES HANDLING

export function handleNewCloseFactor(event: NewCloseFactor): void {
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = new Sightroller('1')
  }
  sightroller.closeFactor = event.params.newCloseFactorMantissa
  sightroller.save()
}

export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = new Sightroller('1')
  }
  sightroller.liquidationIncentive = event.params.newLiquidationIncentiveMantissa
  sightroller.save()
}

export function handleNewMaxAssets(event: NewMaxAssets): void {
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = new Sightroller('1')
  }
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

// UserAccount_IndividualMarketStats (user + a particular market related)
// UserAccount_IndividualMarketStats (user + a particular market related)
// UserAccount_IndividualMarketStats (user + a particular market related)
// UserAccount_IndividualMarketStats (user + a particular market related)
// UserAccount_IndividualMarketStats (user + a particular market related)

export function handleMarketEntered(event: MarketEntered): void {
  let market = Market.load(event.params.cToken.toHexString())  // Market address
  let accountID = event.params.account.toHex()      // Account address 
  let cTokenStats = updateUserAccount_IndividualMarketStats(market.id,market.symbol,accountID,event.transaction.hash,event.block.timestamp.toI32(),event.block.number.toI32(),)
  cTokenStats.enteredMarket = true
  cTokenStats.save()
}

export function handleMarketExited(event: MarketExited): void {
  let market = Market.load(event.params.cToken.toHexString())
  let accountID = event.params.account.toHex()
  let cTokenStats = updateUserAccount_IndividualMarketStats(market.id,market.symbol,accountID,event.transaction.hash,event.block.timestamp.toI32(),event.block.number.toI32(),)
  cTokenStats.enteredMarket = false
  cTokenStats.save()
}

export function handleDistributedBorrowerGsigh(event: DistributedBorrowerGsigh): void {}

export function handleDistributedSupplierGsigh(event: DistributedSupplierGsigh): void {}


// for Market
// for Market
// for Market
// for Market
// for Market
// for Market

export function handleGsighSpeedUpdated(event: GsighSpeedUpdated): void {}

export function handleMarketGsighed(event: MarketGsighed): void {}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let market = Market.load(event.params.cToken.toHexString())
  market.collateralFactor = event.params.newCollateralFactorMantissa.toBigDecimal().div(mantissaFactorBD)
  market.save()
}

export function handleMarketListed(event: MarketListed): void {}






