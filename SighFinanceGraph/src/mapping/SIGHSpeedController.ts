import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts"
import { DistributionInitialized, NewProtocolSupported, ProtocolRemoved, DistributionSpeedChanged, Dripped } from "../../generated/SIGHSpeedController/SIGHSpeedController"
import { SIGHSpeedControllerState, SpeedControllerSupportedProtocols, SIGH_Instrument } from "../../generated/schema"
import { SIGHSpeedController } from '../../generated/SIGHSpeedController/SIGHSpeedController'



export function handleDistributionInitialized(event: DistributionInitialized): void {
  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  if (Sigh_SpeedController == null) {
    Sigh_SpeedController = createSigh_SpeedController(event.address.toHexString())
    Sigh_SpeedController.address = event.address as Address 
  }
  Sigh_SpeedController.isDripAllowed = true
  Sigh_SpeedController.initializationBlockNumber = event.params.blockNumber
  Sigh_SpeedController.save()

  UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
}



export function handleNewProtocolSupported(event: NewProtocolSupported): void {
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  if (Sigh_SpeedController == null) {
    Sigh_SpeedController = createSigh_SpeedController(event.address.toHexString())
    Sigh_SpeedController.address = event.address as Address 
  }

  // support protocol Tx Hash
  let supportNewProtocolTxHistoryHashes = Sigh_SpeedController.supportNewProtocolTxHistory
  supportNewProtocolTxHistoryHashes.push( event.transaction.hash.toHexString() )
  Sigh_SpeedController.supportNewProtocolTxHistory = supportNewProtocolTxHistoryHashes

  log.info("in handleNewProtocolSupported : {}",[event.transaction.hash.toHexString()])
  Sigh_SpeedController.totalProtocolsSupported = Sigh_SpeedController.totalProtocolsSupported.plus(BigInt.fromI32(1))

  let supportedProtocolID = event.params.protocolAddress.toHexString()
  let supportedProtocolState = SpeedControllerSupportedProtocols.load(supportedProtocolID)
  if (supportedProtocolState == null ) {
    supportedProtocolState = createSupportedProtocolState(supportedProtocolID)
    supportedProtocolState.speedController = event.address.toHexString()
    if ( supportedProtocolID == '0xce0281e5f7d490aeb44296a4fc08c907cf2de0bc' ) {
      supportedProtocolState.name = 'SIGH Treasury'
    }
    if ( supportedProtocolID == '0xfeb7cf0eba9a65dc2977a85fac38566c5bb9a679' ) {
      supportedProtocolState.name = 'SIGH Volatility Harvests'
    }
  }
  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.minus( supportedProtocolState.sighSpeed )

  supportedProtocolState.isSupported = true
  supportedProtocolState.address = event.params.protocolAddress
  supportedProtocolState.sighSpeed = event.params.sighSpeed.toBigDecimal().div(decimalAdj)
  supportedProtocolState.totalDistributedAmount = event.params.totalDrippedAmount.toBigDecimal().div(decimalAdj)

  if (supportedProtocolState.name == 'SIGH Treasury') {
    let sighInstrument = SIGH_Instrument.load('0x043906ab5a1ba7a5c52ff2ef839d2b0c2a19ceba')
    sighInstrument.sighTreasuryDistributionSpeed = supportedProtocolState.sighSpeed
    sighInstrument.save()
  }
  if (supportedProtocolState.name == 'SIGH Volatility Harvests') {
    let sighInstrument = SIGH_Instrument.load('0x043906ab5a1ba7a5c52ff2ef839d2b0c2a19ceba')
    sighInstrument.sighVolatilityHarvestsDistributionSpeed = supportedProtocolState.sighSpeed
    sighInstrument.save()
  }

  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.plus( supportedProtocolState.sighSpeed )

  supportedProtocolState.save()
  Sigh_SpeedController.save()

  UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
}



export function handleProtocolRemoved(event: ProtocolRemoved): void {
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())

  // remove protocol Tx Hash
  let removeProtocolTxHistoryHashes = Sigh_SpeedController.removeProtocolTxHistory
  removeProtocolTxHistoryHashes.push( event.transaction.hash.toHexString() )
  Sigh_SpeedController.removeProtocolTxHistory = removeProtocolTxHistoryHashes

  Sigh_SpeedController.totalProtocolsSupported = Sigh_SpeedController.totalProtocolsSupported.minus(BigInt.fromI32(1))

  let supportedProtocolID = event.params.protocolAddress.toHexString()
  let supportedProtocolState = SpeedControllerSupportedProtocols.load(supportedProtocolID)

  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.minus( supportedProtocolState.sighSpeed )

  supportedProtocolState.isSupported = false
  supportedProtocolState.sighSpeed = BigDecimal.fromString('0')
  supportedProtocolState.totalDistributedAmount = event.params.totalDrippedToProtocol.toBigDecimal().div(decimalAdj)

  if (supportedProtocolState.name == 'SIGH Treasury') {
    let sighInstrument = SIGH_Instrument.load('0x043906ab5a1ba7a5c52ff2ef839d2b0c2a19ceba')
    sighInstrument.sighTreasuryDistributionSpeed = supportedProtocolState.sighSpeed
    sighInstrument.save()
  }
  if (supportedProtocolState.name == 'SIGH Volatility Harvests') {
    let sighInstrument = SIGH_Instrument.load('0x043906ab5a1ba7a5c52ff2ef839d2b0c2a19ceba')
    sighInstrument.sighVolatilityHarvestsDistributionSpeed = supportedProtocolState.sighSpeed
    sighInstrument.save()
  }

  supportedProtocolState.save()
  Sigh_SpeedController.save()
  UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
}


export function handleDistributionSpeedChanged(event: DistributionSpeedChanged): void {
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  let supportedProtocolID = event.params.protocolAddress.toHexString()
  let supportedProtocolState = SpeedControllerSupportedProtocols.load(supportedProtocolID)
  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.minus( supportedProtocolState.sighSpeed )

  supportedProtocolState.sighSpeed = event.params.newSpeed.toBigDecimal().div(decimalAdj)

  let updateDripSpeedTxHistoryHashes = supportedProtocolState.updateDripSpeedTxHistory
  updateDripSpeedTxHistoryHashes.push( event.transaction.hash.toHexString() )
  supportedProtocolState.updateDripSpeedTxHistory = updateDripSpeedTxHistoryHashes

  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.plus( supportedProtocolState.sighSpeed )

  if (supportedProtocolState.name == 'SIGH Treasury') {
    let sighInstrument = SIGH_Instrument.load('0x043906ab5a1ba7a5c52ff2ef839d2b0c2a19ceba')
    sighInstrument.sighTreasuryDistributionSpeed = supportedProtocolState.sighSpeed
    sighInstrument.save()
  }
  if (supportedProtocolState.name == 'SIGH Volatility Harvests') {
    let sighInstrument = SIGH_Instrument.load('0x043906ab5a1ba7a5c52ff2ef839d2b0c2a19ceba')
    sighInstrument.sighVolatilityHarvestsDistributionSpeed = supportedProtocolState.sighSpeed
    sighInstrument.save()
  }

  supportedProtocolState.save()
  Sigh_SpeedController.save()
  UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
}


export function handleDripped(event: Dripped): void {
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  let supportedProtocolID = event.params.protocolAddress.toHexString()
  let supportedProtocolState = SpeedControllerSupportedProtocols.load(supportedProtocolID)

  supportedProtocolState.totalDistributedAmount = event.params.totalAmountDripped.toBigDecimal().div(decimalAdj)

  let dripTxHistoryHashes = supportedProtocolState.dripTxHistory
  dripTxHistoryHashes.push( event.transaction.hash.toHexString() )
  supportedProtocolState.dripTxHistory = dripTxHistoryHashes

  supportedProtocolState.save()
  Sigh_SpeedController.save()
  UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
}




function UpdateSIGHBalance( ID: string ) : void {
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

  let Sigh_SpeedController = SIGHSpeedControllerState.load(ID)
  let contractAddress = Sigh_SpeedController.address as Address
  let _SighSpeedControllerContract = SIGHSpeedController.bind(contractAddress)
  Sigh_SpeedController.currentSIGHbalance = _SighSpeedControllerContract.getSIGHBalance().toBigDecimal().div(decimalAdj)  
  Sigh_SpeedController.save()
}


// ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

function createSigh_SpeedController(addressID: string): SIGHSpeedControllerState {
    let Sigh_Speed_Controller = new SIGHSpeedControllerState(addressID)

    Sigh_Speed_Controller.address = Address.fromString('0x0000000000000000000000000000000000000000',)
    Sigh_Speed_Controller.isDripAllowed = false
    Sigh_Speed_Controller.initializationBlockNumber = new BigInt(0)

    Sigh_Speed_Controller.currentSIGHbalance = BigDecimal.fromString('0')    
    Sigh_Speed_Controller.totalProtocolsSupported = new BigInt(0)    
    Sigh_Speed_Controller.totalSighDripSpeed = BigDecimal.fromString('0')    
    
    Sigh_Speed_Controller.supportNewProtocolTxHistory = []    
    Sigh_Speed_Controller.removeProtocolTxHistory = []
        
    Sigh_Speed_Controller.save()
    return Sigh_Speed_Controller as SIGHSpeedControllerState
}
  

function createSupportedProtocolState(addressID: string): SpeedControllerSupportedProtocols {
  let new_SupportedProtocolState = new SpeedControllerSupportedProtocols(addressID)

  new_SupportedProtocolState.speedController = '0x0000000000000000000000000000000000000000'
  new_SupportedProtocolState.address = Address.fromString('0x0000000000000000000000000000000000000000',)
  new_SupportedProtocolState.name = null
  new_SupportedProtocolState.isSupported = false

  new_SupportedProtocolState.sighSpeed = BigDecimal.fromString('0')  
  new_SupportedProtocolState.totalDistributedAmount = BigDecimal.fromString('0')  

  new_SupportedProtocolState.updateDripSpeedTxHistory = []
  new_SupportedProtocolState.dripTxHistory = []

  new_SupportedProtocolState.save()
  return new_SupportedProtocolState as SpeedControllerSupportedProtocols
}