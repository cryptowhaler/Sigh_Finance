import { Address, BigInt,BigDecimal } from "@graphprotocol/graph-ts"
import { SIGHMinted,SIGHBurned, ReservoirChanged,NewCycle,NewEra} from "../../generated/SIGH/SIGH"
import { SIGH } from "../../generated/schema"
import { createSIGH, } from '../helpers'
import { log } from '@graphprotocol/graph-ts'


type SIGH @entity {
  "ID is contract address"
  id: ID!
  symbol: Bytes!
  decimals: BigInt!
  Reservoir: Bytes!
  totalSupply: BigInt!
  currentInflation: BigDecimal!
  RecentSIGHMinted: BigInt!
  blockNumberWhenCoinsMinted: BigInt!
  Recentminter: Bytes!
  currentCycle: BigInt!
  currentEra: BigInt!
  totalBurntSIGH: BigInt!
  recentlyBurntSIGH: BigInt!
}

export function handleCoinsMinted(event: SIGHMinted): void {
  let sighID = event.address.toHexString()
  let sigh_contract = SIGH.load(sighID)
  if (sigh_contract == null) {
    sigh_contract = createSIGH(sighID)
  }
       
  sigh_contract.currentCycle = event.params.cycle
  sigh_contract.currentEra = event.params.Era
  sigh_contract.Recentminter = event.params.minter

  let newSIGHMinted = event.params.amountMinted
  let prevTotalSupply = sigh_contract.totalSupply 
  let newTotalSupply = event.params.current_supply

  let inflation = new BigDecimal(1)
  if (prevTotalSupply == 0) {
    inflation = new BigDecimal(1)
  }
  else {
    inflation = newSIGHMinted.toBigDecimal().div(prevTotalSupply)
  }

  sigh_contract.currentInflation = event.params.block_number
  sigh_contract.RecentSIGHMinted = newSIGHMinted
  sigh_contract.totalSupply = newTotalSupply
  sigh_contract.blockNumberWhenCoinsMinted = event.params.block_number
  

  sigh_contract.save()
}

export function handleSIGHBurned(event: SIGHBurned): void {
  let sighID = event.address.toHexString()
  let sigh_contract = SIGH.load(sighID)

  sigh_contract.recentlyBurntSIGH = event.params.amount
  sigh_contract.totalBurntSIGH = event.params.totalBurnedAmount
  sigh_contract.totalSupply = event.params.currentSupply

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

export function handleNewCycle(event: NewCycle): void {
  let sighID = event.address.toHexString()
  let sigh_contract = SIGH.load(sighID)

  if (sigh_contract == null) {
    sigh_contract = createSIGH(sighID)
  }

  sigh_contract.currentCycle = event.params.newCycle
  sigh_contract.save()
}

export function handleNewEra(event: NewEra): void {
  let sighID = event.address.toHexString()
  let sigh_contract = SIGH.load(sighID)

  if (sigh_contract == null) {
    sigh_contract = createSIGH(sighID)
  }

  sigh_contract.currentEra = event.params.newEra
  sigh_contract.save()
}




// ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

export function createSIGH(addressID: string): SIGH {
  let sigh_token_contract = new SIGH(addressID)
  sigh_token_contract.symbol = 'SIGH'
  sigh_token_contract.decimals = new BigInt(18)
  sigh_token_contract.Reservoir = Address.fromString('0x0000000000000000000000000000000000000000',)
  sigh_token_contract.totalSupply = new BigInt(0)
  sigh_token_contract.currentInflation = new BigDecimal(1.0)
  sigh_token_contract.RecentSIGHMinted = new BigInt(0)
  sigh_token_contract.blockNumberWhenCoinsMinted = new BigInt(0)
  sigh_token_contract.Recentminter = Address.fromString('0x0000000000000000000000000000000000000000',)
  sigh_token_contract.currentCycle = new BigInt(0)
  sigh_token_contract.currentEra = new BigInt(0)
  sigh_token_contract.totalBurntSIGH = new BigInt(0)
  sigh_token_contract.recentlyBurntSIGH = new BigInt(0)

  sigh_token_contract.save()
  return sigh_token_contract as SIGH
}