import { Address, BigInt } from "@graphprotocol/graph-ts"
import { DistributionInitialized, ProtocolDistributionSpeedChanged, TreasuryDistributionSpeedChanged, DrippedToProtocol, DrippedToTreasury } from "../../generated/Sightroller/Sightroller"

import { SIGHReservoir } from "../../generated/schema"
// import { mantissaFactorBD, updateUserAccount_IndividualMarketStats , createSighTroller, createMarket } from '../helpers'
import { log } from '@graphprotocol/graph-ts'

export function handleDistributionInitialized(event: DistributionInitialized): void {
  let sighReservoir = SIGHReservoir.load(event.address.toHexString())
  if (sighReservoir == null) {
    sighReservoir = createsighReservoir(event.address.toHexString())
  }
  sighReservoir.ProtocolAddress = event.params.protocolAddress
  sighReservoir.TreasuryAddress = event.params.treasuryAddress
  sighReservoir.save()
}

export function handleProtocolDistributionSpeedChanged(event: ProtocolDistributionSpeedChanged): void {
  let sighReservoir = SIGHReservoir.load(event.address.toHexString())
  if (sighReservoir == null) {
    sighReservoir = createsighReservoir(event.address.toHexString())
  }
  sighReservoir.ProtocolDistributionSpeed = event.params.newSpeed
  sighReservoir.save()
}

export function handleTreasuryDistributionSpeedChanged(event: TreasuryDistributionSpeedChanged): void {
  let sighReservoir = SIGHReservoir.load(event.address.toHexString())
  if (sighReservoir == null) {
    sighReservoir = createsighReservoir(event.address.toHexString())
  }
  sighReservoir.TreasuryDistributionSpeed = event.params.newSpeed
  sighReservoir.save()
}

export function handleDrippedToProtocol(event: DrippedToProtocol): void {
    let sighReservoir = SIGHReservoir.load(event.address.toHexString())
    if (sighReservoir == null) {
      sighReservoir = createsighReservoir(event.address.toHexString())
    }
    sighReservoir.ReservoirBalance = event.params.currentBalance
    sighReservoir.recentlyDrippedToProtocol = event.params.AmountDripped
    sighReservoir.totalAmountDrippedToProtocol = event.params.totalAmountDripped

    sighReservoir.totalAmountDripped = sighReservoir.totalAmountDripped.plus(sighReservoir.totalAmountDrippedToProtocol);
    sighReservoir.save()
  }

  export function handleDrippedToTreasury(event: DrippedToTreasury): void {
    let sighReservoir = SIGHReservoir.load(event.address.toHexString())
    if (sighReservoir == null) {
      sighReservoir = createsighReservoir(event.address.toHexString())
    }
    sighReservoir.ReservoirBalance = event.params.currentBalance
    sighReservoir.recentlyDrippedToTreasury = event.params.AmountDripped
    sighReservoir.totalAmountDrippedToTreasury = event.params.totalAmountDripped

    sighReservoir.totalAmountDripped = sighReservoir.totalAmountDripped.plus(sighReservoir.totalAmountDrippedToTreasury);
    sighReservoir.save()
  }  

function createsighReservoir(addressID: string): SIGHReservoir {
    let sigh_Reservoir = new SIGHReservoir(addressID)

    sigh_Reservoir.ProtocolAddress = Address.fromString('0x0000000000000000000000000000000000000000',)
    sigh_Reservoir.TreasuryAddress = Address.fromString('0x0000000000000000000000000000000000000000',)

    sigh_Reservoir.ProtocolDistributionSpeed = new BigInt(0)
    sigh_Reservoir.TreasuryDistributionSpeed = new BigInt(0)    
    
    sigh_Reservoir.ReservoirBalance = new BigInt(0)
    
    sigh_Reservoir.recentlyDrippedToProtocol = new BigInt(0)
    sigh_Reservoir.totalAmountDrippedToProtocol = new BigInt(0)
    
    sigh_Reservoir.recentlyDrippedToTreasury = new BigInt(0)
    sigh_Reservoir.totalAmountDrippedToTreasury = new BigInt(0)

    sigh_Reservoir.totalAmountDripped = new BigInt(0)
    
    sigh_Reservoir.save()
    return sigh_Reservoir
}
  