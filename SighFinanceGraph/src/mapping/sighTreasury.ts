import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts"
import { InstrumentInitialized, InstrumentDistributionInitialized, InstrumentDistributionReset, 
  instrumentBeingDistributedChanged, DripSpeedChanged,AmountDripped,maxTransferAmountUpdated,
  SIGHTransferred, TokensBought, TokensSold, SIGHBurnAllowedSwitched, SIGH_Burned, SIGHBurnSpeedChanged } from "../../generated/SIGHTreasury/SIGHTreasury"

  import { SIGHTreasuryState,TreasurySupportedInstruments, SIGH_Instrument } from "../../generated/schema"
  import { SIGHTreasury } from '../../generated/SIGHTreasury/SIGHTreasury'
  import { ERC20Detailed } from '../../generated/SIGHTreasury/ERC20Detailed'



// NEW 'INSTRUMENT' BEING INITIALIZED BY THE TREASURY
  export function handleInstrumentInitialized(event: InstrumentInitialized): void {
    let SighTreasury = SIGHTreasuryState.load(event.address.toHexString())
    log.info('handleInstrumentInitialized-1 : ',[])
    if (SighTreasury == null) {
      SighTreasury = createSighTreasury(event.address.toHexString())
      SighTreasury.address = event.address
    }
    log.info('handleInstrumentInitialized-2 : ',[])

    // Storing Tx Hash
    let prevHashes = SighTreasury.instrumentInitializedTxHashes
    prevHashes.push( event.transaction.hash )
    SighTreasury.instrumentInitializedTxHashes = prevHashes
    log.info('handleInstrumentInitialized-3 : ',[])
    SighTreasury.save()

    let supportedInstrument = TreasurySupportedInstruments.load( event.params.instrument.toHexString() )
    if (supportedInstrument == null) {
      supportedInstrument = createTreasurySupportedInstruments(event.params.instrument.toHexString())
      supportedInstrument.address = event.params.instrument
      supportedInstrument.sighTreasury = event.address.toHexString()

      let instrumentContract = ERC20Detailed.bind(  event.params.instrument )
      supportedInstrument.name = instrumentContract.name()

      supportedInstrument.symbol = instrumentContract.symbol()
      supportedInstrument.decimals = BigInt.fromI32(instrumentContract.decimals())
    }
    log.info('handleInstrumentInitialized - 4 : ',[])
    let decimalAdj = BigInt.fromI32(10).pow(supportedInstrument.decimals.toI32() as u8).toBigDecimal()

    supportedInstrument.isInitialized = true;
    supportedInstrument.balanceInTreasury = event.params.balance.toBigDecimal().div( decimalAdj ) ;
    supportedInstrument.totalAmountDripped = event.params.totalAmountDripped.toBigDecimal().div( decimalAdj ) ;
    supportedInstrument.totalAmountTransferred = event.params.totalAmountTransferred.toBigDecimal().div( decimalAdj ) ;
    log.info('handleInstrumentInitialized-5 : ',[])

    supportedInstrument.save()
    UpdateSIGHBalance(event.address.toHexString())
  }



// NEW 'INSTRUMENT DISTRIBUTION' BEING INITIALIZED BY THE TREASURY
  export function handleInstrumentDistributionInitialized(event: InstrumentDistributionInitialized): void {
    let SighTreasury = SIGHTreasuryState.load(event.address.toHexString())
    if (SighTreasury == null) {
      SighTreasury = createSighTreasury(event.address.toHexString())
      SighTreasury.address = event.address
    }

    // Storing Tx Hash
    let prevHashes = SighTreasury.instrumentDistributionInitializedTxHashes
    prevHashes.push( event.transaction.hash )
    SighTreasury.instrumentDistributionInitializedTxHashes = prevHashes

    SighTreasury.isDripAllowed = event.params.isDripAllowed

    let supportedInstrument = TreasurySupportedInstruments.load( event.params.instrumentBeingDripped.toHexString() )
    let decimalAdj = BigInt.fromI32(10).pow(supportedInstrument.decimals.toI32() as u8).toBigDecimal()

    SighTreasury.targetAddressForDripping = event.params.targetAddressForDripping
    SighTreasury.instrumentBeingDrippedAddress = event.params.instrumentBeingDripped
    SighTreasury.instrumentBeingDrippedSymbol = supportedInstrument.symbol
    SighTreasury.DripSpeed = event.params.dripSpeed.toBigDecimal().div( decimalAdj ) ;

    supportedInstrument.isBeingDripped = true;
    supportedInstrument.DripSpeed = SighTreasury.DripSpeed;

    supportedInstrument.save()
    SighTreasury.save()
    UpdateSIGHBalance(event.address.toHexString())
  }




  // 'INSTRUMENT DISTRIBUTION' BEING RESET BY THE TREASURY
  export function handleInstrumentDistributionReset(event: InstrumentDistributionReset): void {
    let SighTreasury = SIGHTreasuryState.load(event.address.toHexString())

    // Storing Tx Hash
    let prevHashes = SighTreasury.instrumentDistributionResetTxHashes
    prevHashes.push( event.transaction.hash )
    SighTreasury.instrumentDistributionResetTxHashes = prevHashes

    SighTreasury.isDripAllowed = event.params.isDripAllowed
    let supportedInstrument = TreasurySupportedInstruments.load( SighTreasury.instrumentBeingDrippedAddress.toHexString() )

    SighTreasury.targetAddressForDripping = event.params.targetAddressForDripping
    SighTreasury.instrumentBeingDrippedAddress = event.params.instrumentBeingDripped
    SighTreasury.instrumentBeingDrippedSymbol = null
    SighTreasury.DripSpeed = event.params.dripSpeed.toBigDecimal();

    supportedInstrument.isBeingDripped = event.params.isDripAllowed;
    supportedInstrument.DripSpeed = SighTreasury.DripSpeed;

    supportedInstrument.save()
    SighTreasury.save()
    UpdateSIGHBalance(event.address.toHexString())
  }




  // INSTRUMENT BEING DISTRIBUTED CHANGED BY THE TREASURY
  export function handleinstrumentBeingDistributedChanged(event: instrumentBeingDistributedChanged): void {
    let SighTreasury = SIGHTreasuryState.load(event.address.toHexString())

    // Storing Tx Hash
    let prevHashes = SighTreasury.instrumentForDistributionChangedTxHashes
    prevHashes.push( event.transaction.hash )
    SighTreasury.instrumentForDistributionChangedTxHashes = prevHashes
    
    if ( SighTreasury.instrumentBeingDrippedAddress.toHexString() != '0x0000000000000000000000000000000000000000' ) {
      let prevSupportedInstrument = TreasurySupportedInstruments.load( SighTreasury.instrumentBeingDrippedAddress.toHexString() )
      prevSupportedInstrument.isBeingDripped = false
      prevSupportedInstrument.DripSpeed = BigDecimal.fromString('0')
      prevSupportedInstrument.save()  
    }

    let supportedInstrument = TreasurySupportedInstruments.load( event.params.newInstrumentToBeDripped.toHexString() )
    let decimalAdj = BigInt.fromI32(10).pow(supportedInstrument.decimals.toI32() as u8).toBigDecimal()

    SighTreasury.instrumentBeingDrippedAddress = event.params.newInstrumentToBeDripped
    SighTreasury.instrumentBeingDrippedSymbol = supportedInstrument.symbol
    SighTreasury.DripSpeed = event.params.dripSpeed.toBigDecimal().div( decimalAdj ) ;

    supportedInstrument.isBeingDripped = true;
    supportedInstrument.DripSpeed = SighTreasury.DripSpeed;

    supportedInstrument.save()
    SighTreasury.save()
    UpdateSIGHBalance(event.address.toHexString())
  }



  // DISTRIBUTION SPEED CHANGED BY THE TREASURY
  export function handleDripSpeedChanged(event: DripSpeedChanged): void {
    let SighTreasury = SIGHTreasuryState.load(event.address.toHexString())

    // Storing Tx Hash
    let prevHashes = SighTreasury.instrumentDistributionSpeedChangedTxHashes
    prevHashes.push( event.transaction.hash )
    SighTreasury.instrumentDistributionSpeedChangedTxHashes = prevHashes

    let supportedInstrument = TreasurySupportedInstruments.load( SighTreasury.instrumentBeingDrippedAddress.toHexString() )
    let decimalAdj = BigInt.fromI32(10).pow(supportedInstrument.decimals.toI32() as u8).toBigDecimal()

    SighTreasury.DripSpeed = event.params.curDripSpeed.toBigDecimal().div( decimalAdj ) ;
    supportedInstrument.DripSpeed = SighTreasury.DripSpeed

    supportedInstrument.save()
    SighTreasury.save()
    UpdateSIGHBalance(event.address.toHexString())
  }



  // INSTRUMENT DISTRIBUTED BY THE TREASURY
  export function handleAmountDripped(event: AmountDripped): void {
    let supportedInstrument = TreasurySupportedInstruments.load( event.params.instrumentBeingDripped.toHexString() )

    // Storing Tx Hash
    let prevHashes = supportedInstrument.instrumentDrippedTxHashes
    prevHashes.push( event.transaction.hash )
    supportedInstrument.instrumentDrippedTxHashes = prevHashes

    let decimalAdj = BigInt.fromI32(10).pow(supportedInstrument.decimals.toI32() as u8).toBigDecimal()
    supportedInstrument.balanceInTreasury = event.params.currentBalance.toBigDecimal().div( decimalAdj )
    supportedInstrument.totalAmountDripped = event.params.totalAmountDripped.toBigDecimal().div( decimalAdj )

    supportedInstrument.save()
    UpdateSIGHBalance(event.address.toHexString())
  }



  // INSTRUMENT BOUGHT BY THE TREASURY
  export function handleTokensBought(event: TokensBought): void {
    let supportedInstrument = TreasurySupportedInstruments.load( event.params.instrument_address.toHexString() )

    // Storing Tx Hash
    let prevHashes = supportedInstrument.instrumentBoughtTxHashes
    prevHashes.push( event.transaction.hash )
    supportedInstrument.instrumentBoughtTxHashes = prevHashes

    let decimalAdj = BigInt.fromI32(10).pow(supportedInstrument.decimals.toI32() as u8).toBigDecimal()
    supportedInstrument.balanceInTreasury = event.params.new_balance.toBigDecimal().div( decimalAdj )
    supportedInstrument.save()
  }




  // INSTRUMENT SOLD BY THE TREASURY
  export function handleTokensSold(event: TokensSold): void {
    let supportedInstrument = TreasurySupportedInstruments.load( event.params.instrument_address.toHexString() )

    // Storing Tx Hash
    let prevHashes = supportedInstrument.instrumentSoldTxHashes
    prevHashes.push( event.transaction.hash )
    supportedInstrument.instrumentSoldTxHashes = prevHashes

    let decimalAdj = BigInt.fromI32(10).pow(supportedInstrument.decimals.toI32() as u8).toBigDecimal()
    supportedInstrument.balanceInTreasury = event.params.new_balance.toBigDecimal().div( decimalAdj )
    supportedInstrument.save()
  }


// MAX SIGH AMOUNT THAT CAN BE TRANSFERRED IS UPDATED
export function handlemaxTransferAmountUpdated(event: maxTransferAmountUpdated): void {
  let SighTreasury = SIGHTreasuryState.load(event.address.toHexString())

  let supportedInstrument = TreasurySupportedInstruments.load('0x043906ab5a1ba7a5c52ff2ef839d2b0c2a19ceba')
  let decimalAdj = BigInt.fromI32(10).pow(supportedInstrument.decimals.toI32() as u8).toBigDecimal()

  SighTreasury.sighMaxTransferLimit = event.params.newmaxTransferLimit.toBigDecimal().div( decimalAdj )
  supportedInstrument.balanceInTreasury = event.params.sighBalance.toBigDecimal().div( decimalAdj )

  SighTreasury.save()
  supportedInstrument.save()
}



  // SIGH TRANSFERRED
  export function handleSIGHTransferred(event: SIGHTransferred): void {
    let SighTreasury = SIGHTreasuryState.load(event.address.toHexString())

    // Storing Tx Hash
    let prevHashes = SighTreasury.sighTransferredTxHashes
    prevHashes.push( event.transaction.hash )
    SighTreasury.sighTransferredTxHashes = prevHashes
    
    let supportedInstrument = TreasurySupportedInstruments.load('0x043906ab5a1ba7a5c52ff2ef839d2b0c2a19ceba')
    let decimalAdj = BigInt.fromI32(10).pow(supportedInstrument.decimals.toI32() as u8).toBigDecimal()
    supportedInstrument.totalAmountTransferred = supportedInstrument.totalAmountTransferred.plus( event.params.amountTransferred.toBigDecimal().div(decimalAdj) ) 

    SighTreasury.save()
    supportedInstrument.save()

    UpdateSIGHBalance(event.address.toHexString())
  }



  export function handleSIGHBurnAllowedSwitched(event: SIGHBurnAllowedSwitched): void {
    let SighTreasury = SIGHTreasuryState.load(event.address.toHexString())
    if (SighTreasury == null) {
      SighTreasury = createSighTreasury(event.address.toHexString())
      SighTreasury.address = event.address
    }
    // Storing Tx Hash
    let prevHashes = SighTreasury.sighBurnAllowedSwitchedTxHashes
    prevHashes.push( event.transaction.hash )
    SighTreasury.sighBurnAllowedSwitchedTxHashes = prevHashes

    SighTreasury.isSIGHBurnAllowed = event.params.newBurnAllowed
    SighTreasury.save()

    if (!SighTreasury.isSIGHBurnAllowed) {
      let sighInstrument = SIGH_Instrument.load('0x043906ab5a1ba7a5c52ff2ef839d2b0c2a19ceba')
      sighInstrument.currentBurnSpeed_WEI = BigInt.fromI32(0)
      sighInstrument.currentBurnSpeed = sighInstrument.currentBurnSpeed_WEI.toBigDecimal()
      sighInstrument.save()  
    }

    UpdateSIGHBalance(event.address.toHexString())
  }

  export function handleSIGHBurnSpeedChanged(event: SIGHBurnSpeedChanged): void {
    let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

    let SighTreasury = SIGHTreasuryState.load(event.address.toHexString())
    if (SighTreasury == null) {
      SighTreasury = createSighTreasury(event.address.toHexString())
      SighTreasury.address = event.address
    }

    // Storing Tx Hash
    let prevHashes = SighTreasury.sighBurnSpeedChangedTxHashes
    prevHashes.push( event.transaction.hash )
    SighTreasury.sighBurnSpeedChangedTxHashes = prevHashes

    SighTreasury.SIGHBurnSpeed = event.params.newSpeed.toBigDecimal().div(decimalAdj)
    SighTreasury.save()

    let sighInstrument = SIGH_Instrument.load('0x043906ab5a1ba7a5c52ff2ef839d2b0c2a19ceba')
    sighInstrument.currentBurnSpeed_WEI = event.params.newSpeed
    sighInstrument.currentBurnSpeed = SighTreasury.SIGHBurnSpeed
    sighInstrument.save()

    UpdateSIGHBalance(event.address.toHexString())
  }

  export function handleSIGH_Burned(event: SIGH_Burned): void {
    let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

    let SighTreasury = SIGHTreasuryState.load(event.address.toHexString())
    if (SighTreasury == null) {
      SighTreasury = createSighTreasury(event.address.toHexString())
      SighTreasury.address = event.address
    }

    // Storing Tx Hash
    let prevHashes = SighTreasury.sighBurnedTxHashes
    prevHashes.push( event.transaction.hash )
    SighTreasury.sighBurnedTxHashes = prevHashes

    SighTreasury.totalBurntSIGH = event.params.totalSIGHBurned.toBigDecimal().div(decimalAdj)
    SighTreasury.save()

    UpdateSIGHBalance(event.address.toHexString())
  }



  function UpdateSIGHBalance( ID: string ) : void {
    log.info('UpdateSIGHBalance-1 : ',[])
    let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()
  
    let SighTreasury_ = SIGHTreasuryState.load(ID)
    let contractAddress = SighTreasury_.address as Address
    let _TreasuryContract = SIGHTreasury.bind(contractAddress)
    log.info('UpdateSIGHBalance-2 : {} ',[contractAddress.toHexString()])
    SighTreasury_.sighBalance = _TreasuryContract.getSIGHBalance().toBigDecimal().div(decimalAdj)  
    log.info('UpdateSIGHBalance-3 : {} ',[SighTreasury_.sighBalance.toString()])

    let supportedInstrument = TreasurySupportedInstruments.load('0x043906ab5a1ba7a5c52ff2ef839d2b0c2a19ceba')
    supportedInstrument.balanceInTreasury = SighTreasury_.sighBalance

    SighTreasury_.save()
  }



// ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

function createSighTreasury(addressID: string): SIGHTreasuryState {
    let Sigh_Treasury = new SIGHTreasuryState(addressID)

    Sigh_Treasury.address = Address.fromString('0x0000000000000000000000000000000000000000',)
    Sigh_Treasury.sighBalance =  BigDecimal.fromString('0')  

    Sigh_Treasury.sighMaxTransferLimit = BigDecimal.fromString('0')  

    Sigh_Treasury.isSIGHBurnAllowed = false
    Sigh_Treasury.SIGHBurnSpeed = BigDecimal.fromString('0')  
    Sigh_Treasury.totalBurntSIGH = BigDecimal.fromString('0')  

    Sigh_Treasury.isDripAllowed = false
    Sigh_Treasury.targetAddressForDripping = Address.fromString('0x0000000000000000000000000000000000000000',)
    Sigh_Treasury.instrumentBeingDrippedAddress = Address.fromString('0x0000000000000000000000000000000000000000',)
    Sigh_Treasury.instrumentBeingDrippedSymbol = null
    Sigh_Treasury.DripSpeed = BigDecimal.fromString('0')  

    Sigh_Treasury.TVLLockedETH = BigDecimal.fromString('0')  
    Sigh_Treasury.TVLLockedUSD = BigDecimal.fromString('0')  

    Sigh_Treasury.instrumentInitializedTxHashes = []
    Sigh_Treasury.instrumentDistributionInitializedTxHashes = []
    Sigh_Treasury.instrumentDistributionResetTxHashes = []
    Sigh_Treasury.instrumentForDistributionChangedTxHashes = []
    Sigh_Treasury.instrumentDistributionSpeedChangedTxHashes = []

    Sigh_Treasury.sighTransferredTxHashes = []

    Sigh_Treasury.sighBurnAllowedSwitchedTxHashes = []
    Sigh_Treasury.sighBurnSpeedChangedTxHashes = []
    Sigh_Treasury.sighBurnedTxHashes = []

    Sigh_Treasury.save()
    return Sigh_Treasury as SIGHTreasuryState
}
  


function createTreasurySupportedInstruments(addressID: string) : TreasurySupportedInstruments {
  let newInstrument = new TreasurySupportedInstruments(addressID);
  newInstrument.address = Address.fromString('0x0000000000000000000000000000000000000000',)

  newInstrument.name = null
  newInstrument.symbol = null
  newInstrument.decimals = BigInt.fromI32(0)

  newInstrument.isBeingDripped = false
  newInstrument.DripSpeed = BigDecimal.fromString('0')  

  newInstrument.isInitialized = false
  newInstrument.balanceInTreasury = BigDecimal.fromString('0')  
  newInstrument.totalAmountDripped = BigDecimal.fromString('0')  
  newInstrument.totalAmountTransferred = BigDecimal.fromString('0')  

  newInstrument.instrumentDrippedTxHashes = []
  newInstrument.instrumentBoughtTxHashes = []
  newInstrument.instrumentSoldTxHashes = [] 

  return newInstrument as TreasurySupportedInstruments
}