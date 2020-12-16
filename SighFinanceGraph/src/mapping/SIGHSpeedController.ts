import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts"
import { DistributionInitialized, NewProtocolSupported, ProtocolRemoved, DistributionSpeedChanged, Dripped } from "../../generated/SIGHSpeedController/SIGHSpeedController"
import { SIGHSpeedControllerState, SpeedControllerSupportedProtocols } from "../../generated/schema"
import { SIGHSpeedController } from '../../generated/SIGHSpeedController/SIGHSpeedController'



export function handleDistributionInitialized(event: DistributionInitialized): void {
  log.info("in handleDistributionInitialized-1,",[])
  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  if (Sigh_SpeedController == null) {
    Sigh_SpeedController = createSigh_SpeedController(event.address.toHexString())
    Sigh_SpeedController.address = event.address as Address 
  }
  log.info("in handleDistributionInitialized-2,{}",[event.address.toHexString()])
  Sigh_SpeedController.isDripAllowed = true
  Sigh_SpeedController.initializationBlockNumber = event.params.blockNumber
  log.info("in handleDistributionInitialized-3: {},",[Sigh_SpeedController.initializationBlockNumber.toString()])

  Sigh_SpeedController.save()
  log.info("in handleDistributionInitialized-4,",[])

  // UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
}



export function handleNewProtocolSupported(event: NewProtocolSupported): void {
  log.info("in handleNewProtocolSupported-1, {}",[])
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()
  log.info("in handleNewProtocolSupported-2, {}",[decimalAdj.toString()])

  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  if (Sigh_SpeedController == null) {
    Sigh_SpeedController = createSigh_SpeedController(event.address.toHexString())
    Sigh_SpeedController.address = event.address as Address 
  }
  log.info("in handleNewProtocolSupported-3, {}",[])
  Sigh_SpeedController.supportNewProtocolTxHistory.push( event.transaction.hash )
  Sigh_SpeedController.totalProtocolsSupported = Sigh_SpeedController.totalProtocolsSupported.plus(BigInt.fromI32(1))

  let supportedProtocolID = event.params.protocolAddress.toHexString()
  let supportedProtocolState = SpeedControllerSupportedProtocols.load(supportedProtocolID)
  if (supportedProtocolState == null ) {
    supportedProtocolState = createSupportedProtocolState(supportedProtocolID)
    supportedProtocolState.speedController = event.address.toHexString()
  }
  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.minus( supportedProtocolState.sighSpeed )
  log.info("in handleNewProtocolSupported-4, {}",[])

  supportedProtocolState.isSupported = true
  supportedProtocolState.address = event.params.protocolAddress
  supportedProtocolState.sighSpeed = event.params.sighSpeed.toBigDecimal().div(decimalAdj)
  supportedProtocolState.totalDistributedAmount = event.params.totalDrippedAmount.toBigDecimal().div(decimalAdj)

  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.plus( supportedProtocolState.sighSpeed )

  supportedProtocolState.save()
  Sigh_SpeedController.save()

  // UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
}



export function handleProtocolRemoved(event: ProtocolRemoved): void {
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  Sigh_SpeedController.removeProtocolTxHistory.push( event.transaction.hash )
  Sigh_SpeedController.totalProtocolsSupported = Sigh_SpeedController.totalProtocolsSupported.minus(BigInt.fromI32(1))

  let supportedProtocolID = event.params.protocolAddress.toHexString()
  let supportedProtocolState = SpeedControllerSupportedProtocols.load(supportedProtocolID)

  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.minus( supportedProtocolState.sighSpeed )

  supportedProtocolState.isSupported = false
  supportedProtocolState.sighSpeed = BigDecimal.fromString('0')
  supportedProtocolState.totalDistributedAmount = event.params.totalDrippedToProtocol.toBigDecimal().div(decimalAdj)

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
  supportedProtocolState.updateDripSpeedTxHistory.push( event.transaction.hash )

  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.plus( supportedProtocolState.sighSpeed )

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
  supportedProtocolState.dripTxHistory.push( event.transaction.hash )

  supportedProtocolState.save()
  Sigh_SpeedController.save()
  UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
}




function UpdateSIGHBalance( ID: string ) : void {
  log.info("in UpdateSIGHBalance-1, {}",[])

  // Getting SIGH Balance
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()
  let Sigh_SpeedController = SIGHSpeedControllerState.load(ID)
  log.info("in UpdateSIGHBalance-2, {}",[Sigh_SpeedController.address.toHexString()])
  let contractAddress = Sigh_SpeedController.address as Address
  let _SighSpeedControllerContract = SIGHSpeedController.bind(contractAddress)
  log.info("in UpdateSIGHBalance-3, {}",[])
  Sigh_SpeedController.currentSIGHbalance = _SighSpeedControllerContract.getSIGHBalance().toBigDecimal().div(decimalAdj)  
  log.info("in UpdateSIGHBalance-4, {}",[Sigh_SpeedController.currentSIGHbalance.toString()])

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