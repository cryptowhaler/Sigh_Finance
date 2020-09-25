import { coinsMinted,ReservoirChanged} from "../../generated/SIGH/SIGH"
import { SIGH } from "../../generated/schema"
import { createSIGH, } from '../helpers'
import { log } from '@graphprotocol/graph-ts'

export function handleCoinsMinted(event: coinsMinted): void {
  let sighID = event.address.toHexString()
  let sigh_contract = SIGH.load(sighID)

  if (sigh_contract == null) {
    sigh_contract = createSIGH(sighID)
  }
       
  sigh_contract.currentCycle = event.params.cycle
  sigh_contract.currentEra = event.params.Era
  sigh_contract.Recentminter = event.params.minter
  sigh_contract.RecentCoinsMinted = event.params.amountMinted
  sigh_contract.totalSupply = event.params.current_supply
  sigh_contract.blockNumberWhenCoinsMinted = event.params.block_number
  sigh_contract.save()
}

export function handleReservoirChanged(event: ReservoirChanged): void {
  let sighID = event.address.toHexString()
  let sigh_contract = SIGH.load(sighID)

  if (sigh_contract == null) {
    sigh_contract = createSIGH(sighID)
  }

  sigh_contract.Reservoir = event.params.newReservoir
  sigh_contract.save()
}


