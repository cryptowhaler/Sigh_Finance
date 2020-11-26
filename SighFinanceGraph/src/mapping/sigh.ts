import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { MintingInitialized, SIGHMinted,SIGHBurned,NewSchedule} from "../../generated/SIGH/SIGH"
import { SIGH_Instrument, MintSnapshot } from "../../generated/schema"
import { SIGH } from '../generated/SIGH'


export function handleSIGHMinted(event: SIGHMinted): void {
  let sighID = event.address.toHexString()
  let sigh_state = SIGH.load(sighID)

  if (sigh_state == null) {
    sigh_state = createSIGH(sighID)
  }

  sigh_state.currentCycle = event.params.cycle
  let contract = SIGH.bind(Address.fromString(event.address.toHexString()))
  sigh_state.currentSchedule = contract.getCurrentSchedule()
  sigh_state.currentInflation = new BigDecimal(1).div(contract.getCurrentInflationRate())
  sigh_state.currentMintSpeed = contract.getCurrentMintSpeed()
  sigh_state.currentMintSpeedETH =  sigh_state.currentMintSpeed.div(1000000000000000000)

  let mint_snapshot = new MintSnapshot(event.params.cycle.toHexString())
  mint_snapshot.minter = event.params.minter
  mint_snapshot.schedule = event.params.Schedule
  mint_snapshot.inflationRate = new BigDecimal(1).div(event.params.inflationRate)
  mint_snapshot.mintedAmount = event.params.amountMinted
  mint_snapshot.mintedAmountETH = mint_snapshot.mintedAmount.div(1000000000000000000)
  mint_snapshot.totalSupply = event.params.current_supply
  mint_snapshot.totalSupplyETH = mint_snapshot.totalSupply.div(1000000000000000000)
  mint_snapshot.mintSpeed = event.params.mintSpeed
  mint_snapshot.mintSpeedETH = mint_snapshot.mintSpeed.div(1000000000000000000)
  mint_snapshot.burnSpeed = sigh_state.currentBurnSpeed
  mint_snapshot.burnSpeedETH = sigh_state.currentBurnSpeedETH
  mint_snapshot.totalSighBurnt = sigh_state.totalSIGHBurnt
  mint_snapshot.totalSighBurntETH = sigh_state.totalSIGHBurntETH
  mint_snapshot.blockNumber = event.params.block_number
  mint_snapshot.save();

  sigh_state.totalSupply = mint_snapshot.totalSupply
  sigh_state.totalSupplyETH = mint_snapshot.totalSupplyETH

  sigh_state.mintSnapshots.push(mint_snapshot)       
  sigh_state.save()
}





export function handleMintingInitialized(event: MintingInitialized): void {
  let sighID = event.address.toHexString()
  let sigh_state = SIGH_Instrument.load(sighID)
  if (sigh_state == null) {
    sigh_state = createSIGH(sighID)
  }
       
  sigh_state.treasury = event.params.treasury
  sigh_state.speedController = event.params.speedController
  sigh_state.save()
}




 
export function handleSIGHBurned(event: SIGHBurned): void {
  let sighID = event.address.toHexString()
  let sigh_state = SIGH.load(sighID)

  sigh_state.recentSIGHBurnt = event.params.burntAmount
  sigh_state.totalSIGHBurntETH = sigh_state.recentSIGHBurnt.toBigDecimal().div(1000000000000000000)

  sigh_state.totalSIGHBurnt = event.params.totalBurnedAmount
  sigh_state.totalSIGHBurntETH = sigh_state.totalSIGHBurnt.toBigDecimal().div(1000000000000000000)

  sigh_state.totalSupply = event.params.currentSupply
  sigh_state.totalSupplyETH = sigh_state.totalSupply.toBigDecimal().div(1000000000000000000)

  let contract = SIGH.bind(Address.fromString(event.address.toHexString()))

  sigh_state.currentMintSpeed = contract.getCurrentMintSpeed()
  sigh_state.currentMintSpeedETH =  sigh_state.currentMintSpeed.toBigDecimal().div(1000000000000000000)
  sigh_state.save()
}



export function handleNewSchedule(event: NewSchedule): void {
  let sighID = event.address.toHexString()
  let sigh_state = SIGH.load(sighID)

  sigh_state.currentSchedule = event.params.newSchedule
  
  let contract = SIGH.bind(Address.fromString(event.address.toHexString()))
  sigh_state.currentMintSpeed = contract.getCurrentMintSpeed()
  sigh_state.currentMintSpeedETH =  sigh_state.currentMintSpeed.toBigDecimal().div(1000000000000000000)

  sigh_state.save()
}




// ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

export function createSIGH(addressID: string): SIGH_Instrument {
  let sigh_token_contract = new SIGH_Instrument(addressID)
  sigh_token_contract.symbol = 'SIGH'
  sigh_token_contract.decimals = new BigInt(18)
  sigh_token_contract.treasury = Address.fromString('0x0000000000000000000000000000000000000000',)
  sigh_token_contract.speedController = Address.fromString('0x0000000000000000000000000000000000000000',)

  sigh_token_contract.totalSupply = new BigInt(0)
  sigh_token_contract.totalSupplyETH = new BigDecimal(0)
  sigh_token_contract.totalSIGHBurnt = new BigInt(0)
  sigh_token_contract.totalSIGHBurntETH = new BigDecimal(0)

  sigh_token_contract.currentCycle = new BigInt(0)
  sigh_token_contract.currentSchedule = new BigInt(0)
  sigh_token_contract.currentInflation = new BigDecimal(0)

  sigh_token_contract.currentMintSpeed = new BigInt(0)
  sigh_token_contract.currentMintSpeedETH = new BigDecimal(0)
  sigh_token_contract.currentBurnSpeed = new BigInt(0)
  sigh_token_contract.currentBurnSpeedETH = new BigDecimal(0)

  sigh_token_contract.save()
  return sigh_token_contract as SIGH_Instrument
}