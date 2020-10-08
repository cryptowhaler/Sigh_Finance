import { BigInt } from "@graphprotocol/graph-ts"
import { DripRateChanged, Dripped } from "../../generated/Sightroller/Sightroller"

import { SIGHReservoir } from "../../generated/schema"
// import { mantissaFactorBD, updateUserAccount_IndividualMarketStats , createSighTroller, createMarket } from '../helpers'
import { log } from '@graphprotocol/graph-ts'


export function handleDripRateChanged(event: DripRateChanged): void {
  let sighReservoir = sighReservoir.load(event.address.toHexString())
  if (sighReservoir == null) {
    sighReservoir = createsighReservoir(event.address.toHexString())
  }
  sighReservoir.dripRate = event.params.newDripRate
  sighReservoir.save()
}

export function handleDripped(event: Dripped): void {
    let sighReservoir = sighReservoir.load(event.address.toHexString())
    if (sighReservoir == null) {
      sighReservoir = createsighReservoir(event.address.toHexString())
    }
    sighReservoir.recentlyDripped = event.params.AmountDripped
    sighReservoir.ReservoirBalance = event.params.currentBalance
    sighReservoir.totalAmountDripped = event.params.totalAmountDripped
    sighReservoir.save()
  }


function createsighReservoir(addressID: string): SIGHReservoir {
    let sigh_Reservoir = new SIGHReservoir(addressID)
    sigh_Reservoir.dripRate = new BigInt(0)
    sigh_Reservoir.recentlyDripped = new BigInt(0)
    sigh_Reservoir.totalAmountDripped = new BigInt(0)
    sigh_Reservoir.ReservoirBalance = new BigInt(0)
    sigh_Reservoir.save()
    return sigh_Reservoir
}
  