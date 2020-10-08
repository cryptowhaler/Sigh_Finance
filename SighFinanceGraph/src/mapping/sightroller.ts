import { BigInt } from "@graphprotocol/graph-ts"
import {
  // DistributedBorrowerGsigh,
  // DistributedSupplierGsigh,
  // GsighSpeedUpdated,
  MarketEntered,
  MarketExited,
  // MarketGsighed,
  MarketListed,
  NewCloseFactor,
  NewCollateralFactor,
  // NewGsighRate,
  NewLiquidationIncentive,
  NewMaxAssets,
  NewPauseGuardian,
  NewPriceOracle,
  NewSIGHRate,
  SIGHSpeedUpdated,
  PriceSnapped
} from "../../generated/Sightroller/Sightroller"

import { Sightroller, Market } from "../../generated/schema"
import { mantissaFactorBD, updateUserAccount_IndividualMarketStats , createSighTroller, createMarket } from '../helpers'
import { log } from '@graphprotocol/graph-ts'

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
    sightroller = createSighTroller()
  }
  sightroller.closeFactor = event.params.newCloseFactorMantissa
  sightroller.save()
}

export function handleNewLiquidationIncentive(event: NewLiquidationIncentive): void {
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = createSighTroller()
  }
  sightroller.liquidationIncentive = event.params.newLiquidationIncentiveMantissa
  sightroller.save()
}

export function handleNewMaxAssets(event: NewMaxAssets): void {
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = createSighTroller()
  }
  sightroller.maxAssets = event.params.newMaxAssets
  sightroller.save()
}

export function handleNewPriceOracle(event: NewPriceOracle): void {
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = createSighTroller()
  }
  sightroller.priceOracle = event.params.newPriceOracle
  sightroller.save()
}

export function handleNewPauseGuardian(event: NewPauseGuardian): void {
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = createSighTroller()
  }
  sightroller.pauseGuardian = event.params.newPauseGuardian
  sightroller.save()  
}

// export function handleNewGsighRate(event: NewGsighRate): void {
//   let sightroller = Sightroller.load('1')
//   if (sightroller == null) {
//     sightroller = createSighTroller()
//   }
//   sightroller.gsighRate = event.params.newGsighRate
//   sightroller.save()
// }

export function handleNewSIGHRate(event: NewSIGHRate): void {
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = createSighTroller()
  }
  sightroller.sighRate = event.params.newSIGHRate
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

// export function handleDistributedBorrowerGsigh(event: DistributedBorrowerGsigh): void {}

// export function handleDistributedSupplierGsigh(event: DistributedSupplierGsigh): void {}


// for Market
// for Market
// for Market
// for Market
// for Market
// for Market

export function handleSIGHSpeedUpdated(event: SIGHSpeedUpdated): void {
  let market = Market.load(event.params.cToken.toHexString())
  if (market == null) {
    market = createMarket(event.params.cToken.toHexString())
  }
  let prevSpeed = market.sighSpeed
  let prevBlockNumber = market.blockNumberWhenSpeedWasUpdated
  let curBlockNumber = event.block.number.toI32()
  let diffInBlockNumbers = curBlockNumber - prevBlockNumber
  let sighAccured = BigInt.fromI32(diffInBlockNumbers) * prevSpeed

  market.sighSpeed = event.params.newSpeed;       // Speed updated
  log.info('handleSIGHSpeedUpdated - market.sighSpeed : {}',[market.sighSpeed.toString()] )
  market.blockNumberWhenSpeedWasUpdated = curBlockNumber;   // Block number updated

  market.sighAccuredInCurrentCycle = market.sighAccuredInCurrentCycle + sighAccured  // Sigh Accured Added
  market.save()
}

export function handlePriceSnapped(event: PriceSnapped): void {
  let market = Market.load(event.params.cToken.toHexString())
  if (market == null) {
    market = createMarket(event.params.cToken.toHexString())
  }
  log.info('handlePriceSnapped - event.params.currentPrice : {}',[event.params.currentPrice.toString()] )
  market.savePriceSnapshot = event.params.currentPrice;
  log.info('handlePriceSnapped - market.savePriceSnapshot : {}',[market.savePriceSnapshot.toString()] )
  market.sighAccuredInCurrentCycle = BigInt.fromI32(0);
  market.save()
}


// export function handleMarketGsighed(event: MarketGsighed): void {}

export function handleNewCollateralFactor(event: NewCollateralFactor): void {
  let market = Market.load(event.params.cToken.toHexString())
  market.collateralFactor = event.params.newCollateralFactorMantissa.toBigDecimal().div(mantissaFactorBD)
  market.save()
}

// export function handleMarketListed(event: MarketListed): void {}






