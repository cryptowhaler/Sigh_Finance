import { BigInt } from "@graphprotocol/graph-ts"
import { coinsMinted,ReservoirChanged} from "../../generated/SIGH/SIGH"
import { NewSIGHMinted,SIGHReservoirChanged } from "../../generated/schema"

export function handleCoinsMinted(event: coinsMinted): void {

  let SIGHMinted = new NewSIGHMinted(event.params.timestamp.toHex())
  SIGHMinted.currentCycle = event.params.cycle
  SIGHMinted.currentEra = event.params.Era
  SIGHMinted.minter = event.params.minter
  SIGHMinted.newCoinsMinted = event.params.amountMinted
  SIGHMinted.totalSupply = event.params.current_supply
  SIGHMinted.blockNumber = event.params.block_number
  SIGHMinted.save()
}

export function handleReservoirChanged(event: ReservoirChanged): void {
  let reservoirChanged = new SIGHReservoirChanged(event.params.blockNumber.toHex())
  reservoirChanged.PreviousReservoir = event.params.prevReservoir
  reservoirChanged.NewReservoir = event.params.newReservoir
  reservoirChanged.save()
}


