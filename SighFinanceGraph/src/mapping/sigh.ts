import {  Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { MintingInitialized, SIGHMinted,SIGHBurned,NewSchedule, Transfer} from "../../generated/SIGH/SIGH"
import { SIGH_Instrument, MintSnapshot } from "../../generated/schema"
import { SIGH } from '../../generated/SIGH/SIGH'
import { ERC20Detailed } from '../../generated/SIGH/ERC20Detailed'
import { PriceOracleGetter } from '../../generated/SIGH/PriceOracleGetter'



export function handleSIGHMinted(event: SIGHMinted): void {
  log.info('handleSIGHMinted : 1st',[])
  let sighID = event.address.toHexString()
  let sigh_state = SIGH_Instrument.load(sighID)

  if (sigh_state == null) {
    sigh_state = createSIGH(sighID)
  }
  log.info('handleSIGHMinted : 2 - sigh_state.address : {}',[sigh_state.address.toHexString()])

  sigh_state.address = Address.fromString(sighID)

  log.info('handleSIGHMinted : 3 - sigh_state.address : {}',[sigh_state.address.toHexString()])

  sigh_state.currentCycle = event.params.cycle
  let contract = SIGH.bind(Address.fromString(event.address.toHexString()))
  sigh_state.currentSchedule = contract.getCurrentSchedule()
  if ( contract.getCurrentInflationRate().toBigDecimal() > BigDecimal.fromString('1') ) {
    log.info('Inside the if condition',[])
    sigh_state.currentInflation = BigDecimal.fromString('1').div(contract.getCurrentInflationRate().toBigDecimal())
  } 
  sigh_state.currentMintSpeed_WEI = contract.getCurrentMintSpeed()
  sigh_state.currentMintSpeed =  sigh_state.currentMintSpeed_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )

  let mint_snapshot = new MintSnapshot(event.params.cycle.toHexString())
  mint_snapshot.instrument_sigh = sighID
  mint_snapshot.minter = event.params.minter
  mint_snapshot.schedule = event.params.Schedule
  if ( event.params.inflationRate.toBigDecimal() > BigDecimal.fromString('1') ) {
    log.info('Inside the if condition - 2',[])
    mint_snapshot.inflationRate = BigInt.fromI32(1).toBigDecimal().div( event.params.inflationRate.toBigDecimal() )
  } 
  else {
    mint_snapshot.inflationRate = BigDecimal.fromString('0')
  }
  mint_snapshot.mintedAmount_WEI = event.params.amountMinted
  mint_snapshot.mintedAmount  = mint_snapshot.mintedAmount_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
  mint_snapshot.totalSupply_WEI = event.params.current_supply
  mint_snapshot.totalSupply  = mint_snapshot.totalSupply_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
  mint_snapshot.mintSpeed_WEI = event.params.mintSpeed
  mint_snapshot.mintSpeed  = mint_snapshot.mintSpeed_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
  mint_snapshot.burnSpeed_WEI = sigh_state.currentBurnSpeed_WEI
  mint_snapshot.burnSpeed  = sigh_state.currentBurnSpeed
  mint_snapshot.totalSighBurnt_WEI = sigh_state.totalSIGHBurnt_WEI
  mint_snapshot.totalSighBurnt  = sigh_state.totalSIGHBurnt 
  mint_snapshot.blockNumber = event.params.block_number
  mint_snapshot.save();

  sigh_state.totalSupply_WEI = mint_snapshot.totalSupply_WEI
  sigh_state.totalSupply  = mint_snapshot.totalSupply

  sigh_state.save()

  if (event.block.number >  BigInt.fromI32(22307212) ) {
    updateSIGHPrice(sighID)
  }
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

  if (event.block.number >  BigInt.fromI32(22307212) ) {
    updateSIGHPrice(sighID)
  }
}




 
export function handleSIGHBurned(event: SIGHBurned): void {
  let sighID = event.address.toHexString()
  let sigh_state = SIGH_Instrument.load(sighID)
  sigh_state.recentSIGHBurnt_WEI = event.params.burntAmount
  sigh_state.recentSIGHBurnt = sigh_state.recentSIGHBurnt_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )

  sigh_state.totalSIGHBurnt_WEI = event.params.totalBurnedAmount
  sigh_state.totalSIGHBurnt = sigh_state.totalSIGHBurnt_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )

  sigh_state.totalSupply_WEI = event.params.currentSupply
  sigh_state.totalSupply = sigh_state.totalSupply_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )

  let contract = SIGH.bind(Address.fromString(event.address.toHexString()))

  sigh_state.currentMintSpeed_WEI = contract.getCurrentMintSpeed()
  sigh_state.currentMintSpeed =  sigh_state.currentMintSpeed_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
  sigh_state.save()

  if (event.block.number >  BigInt.fromI32(22307212) ) {
    updateSIGHPrice(sighID)
  }
}



export function handleNewSchedule(event: NewSchedule): void {
  let sighID = event.address.toHexString()
  let sigh_state = SIGH_Instrument.load(sighID)

  sigh_state.currentSchedule = event.params.newSchedule

  let contract = SIGH.bind(Address.fromString(event.address.toHexString()))
  sigh_state.currentMintSpeed_WEI = contract.getCurrentMintSpeed()
  sigh_state.currentMintSpeed =  sigh_state.currentMintSpeed_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )

  sigh_state.save()

  if (event.block.number >  BigInt.fromI32(22307212) ) {
    updateSIGHPrice(sighID)
  }
}


export function handleTransfer(event: Transfer): void {
  log.info('handleTransfer : 1st',[])
  let sighID = event.address.toHexString()
  let sigh_state = SIGH_Instrument.load(sighID)

  if (sigh_state == null) {
    sigh_state = createSIGH(sighID)
  }
  sigh_state.address = Address.fromString(sighID)
  sigh_state.save()

  if (event.block.number >  BigInt.fromI32(22307212) ) {
    updateSIGHPrice(sighID)
  }
}


function updateSIGHPrice( ID: string ) : void {
  let sigh_state = SIGH_Instrument.load(ID)

  let oracleAddress = sigh_state.oracle as Address
  let oracleContract = PriceOracleGetter.bind( oracleAddress )

  // GETTING $SIGH PRICE IN ETH
  let sighAddress = sigh_state.address as Address
  let priceInETH = oracleContract.getAssetPrice( sighAddress ).toBigDecimal() 
  let priceInETH_Decimals = oracleContract.getAssetPriceDecimals( sighAddress )
  sigh_state.priceETH = priceInETH.div( BigInt.fromI32(10).pow(priceInETH_Decimals as u8).toBigDecimal() ) 

  // GETTING ETH PRICE IN USD
  let ETH_PriceInUSD = oracleContract.getAssetPrice(Address.fromString('0x514b7b5E0703a373D686Eb5429C117EBe925EdE6')).toBigDecimal()
  let ETH_PriceInUSDDecimals = oracleContract.getAssetPriceDecimals(Address.fromString('0x514b7b5E0703a373D686Eb5429C117EBe925EdE6'))
  let ETHPriceInUSD = ETH_PriceInUSD.div(  BigInt.fromI32(10).pow(ETH_PriceInUSDDecimals as u8).toBigDecimal() )
  sigh_state.priceUSD = sigh_state.priceETH.times(ETHPriceInUSD)

  sigh_state.save()
}



// ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

export function createSIGH(addressID: string): SIGH_Instrument {
  let sigh_token_contract = new SIGH_Instrument(addressID)
  log.info('createSIGH : 1st',[])
  sigh_token_contract.address = Address.fromString('0x0000000000000000000000000000000000000000',)
  sigh_token_contract.symbol = 'SIGH'
  sigh_token_contract.decimals = BigInt.fromI32(18)
  sigh_token_contract.treasury = Address.fromString('0x0000000000000000000000000000000000000000',)
  sigh_token_contract.speedController = Address.fromString('0x0000000000000000000000000000000000000000',)

  sigh_token_contract.totalSupply_WEI = new BigInt(0)
  sigh_token_contract.totalSupply = BigDecimal.fromString('0')

  sigh_token_contract.recentSIGHBurnt_WEI = new BigInt(0)
  sigh_token_contract.recentSIGHBurnt = BigDecimal.fromString('0')

  sigh_token_contract.totalSIGHBurnt_WEI = new BigInt(0)
  sigh_token_contract.totalSIGHBurnt = BigDecimal.fromString('0')

  sigh_token_contract.currentCycle = new BigInt(0)
  sigh_token_contract.currentSchedule = new BigInt(0)
  sigh_token_contract.currentInflation = BigDecimal.fromString('0')

  sigh_token_contract.currentMintSpeed_WEI = new BigInt(0)
  sigh_token_contract.currentMintSpeed = BigDecimal.fromString('0')
  sigh_token_contract.currentBurnSpeed_WEI = new BigInt(0)
  sigh_token_contract.currentBurnSpeed = BigDecimal.fromString('0')

  sigh_token_contract.priceETH = BigDecimal.fromString('0')
  sigh_token_contract.priceUSD = BigDecimal.fromString('0')

  sigh_token_contract.oracle = Address.fromString('0xC8A6BCb348De7844BDd83632CEd39aDa8Fd8155b',) 

  sigh_token_contract.save()
  return sigh_token_contract as SIGH_Instrument
}