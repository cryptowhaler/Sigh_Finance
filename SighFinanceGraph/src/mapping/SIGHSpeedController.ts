import { Address, BigDecimal, BigInt, log } from "@graphprotocol/graph-ts"
import { DistributionInitialized, NewProtocolSupported, ProtocolRemoved, DistributionSpeedChanged, Dripped } from "../../generated/SIGH_Speed_Controller/SIGHSpeedController"
import { SIGHSpeedControllerState, SpeedControllerSupportedProtocols } from "../../generated/schema"
import { PriceOracleGetter } from '../../generated/SIGH/PriceOracleGetter'
import { SIGHSpeedController } from '../../generated/SIGH_Speed_Controller/SIGHSpeedController'



export function handleDistributionInitialized(event: DistributionInitialized): void {
  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  if (Sigh_SpeedController == null) {
    Sigh_SpeedController = createSigh_SpeedController(event.address.toHexString())
    Sigh_SpeedController.address = event.address.toHexString() as Address 
  }
  Sigh_SpeedController.isDripAllowed = true
  Sigh_SpeedController.initializationBlockNumber = event.params.blockNumber

  UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
  Sigh_SpeedController.save()
}



export function handleNewProtocolSupported(event: NewProtocolSupported): void {
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  if (Sigh_SpeedController == null) {
    Sigh_SpeedController = createSigh_SpeedController(event.address.toHexString())
    Sigh_SpeedController.address = event.address.toHexString() as Address 
  }
  Sigh_SpeedController.supportNewProtocolTxHistory.push( event.transaction.hash.toHex() )
  Sigh_SpeedController.totalProtocolsSupported = Sigh_SpeedController.totalProtocolsSupported.plus(BigInt.fromI32(1))

  let supportedProtocolID = event.params.protocolAddress.toHexString()
  let supportedProtocolState = SpeedControllerSupportedProtocols.load(supportedProtocolID)
  if (supportedProtocolState == null ) {
    supportedProtocolState = createSupportedProtocolState(supportedProtocolID)
  }
  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.minus( supportedProtocolState.sighSpeed )

  supportedProtocolState.isSupported = true
  supportedProtocolState.address = event.params.protocolAddress
  supportedProtocolState.sighSpeed = event.params.sighSpeed.toBigDecimal().div(decimalAdj)
  supportedProtocolState.totalDistributedAmount = event.params.totalDrippedAmount.toBigDecimal().div(decimalAdj)

  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.plus( supportedProtocolState.sighSpeed )

  UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
  supportedProtocolState.save()
  Sigh_SpeedController.save()
}



export function handleProtocolRemoved(event: ProtocolRemoved): void {
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  Sigh_SpeedController.removeProtocolTxHistory.push( event.transaction.hash.toHex() )
  Sigh_SpeedController.totalProtocolsSupported = Sigh_SpeedController.totalProtocolsSupported.minus(BigInt.fromI32(1))

  let supportedProtocolID = event.params.protocolAddress.toHexString()
  let supportedProtocolState = SpeedControllerSupportedProtocols.load(supportedProtocolID)

  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.minus( supportedProtocolState.sighSpeed )

  supportedProtocolState.isSupported = false
  supportedProtocolState.sighSpeed = BigDecimal.fromString('0')
  supportedProtocolState.totalDistributedAmount = event.params.totalDrippedToProtocol.toBigDecimal().div(decimalAdj)

  UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
  supportedProtocolState.save()
  Sigh_SpeedController.save()
}


export function handleDistributionSpeedChanged(event: DistributionSpeedChanged): void {
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  let supportedProtocolID = event.params.protocolAddress.toHexString()
  let supportedProtocolState = SpeedControllerSupportedProtocols.load(supportedProtocolID)
  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.minus( supportedProtocolState.sighSpeed )

  supportedProtocolState.sighSpeed = event.params.newSpeed.toBigDecimal().div(decimalAdj)
  supportedProtocolState.updateDripSpeedTxHistory.push( event.transaction.hash.toHex() )

  Sigh_SpeedController.totalSighDripSpeed = Sigh_SpeedController.totalSighDripSpeed.plus( supportedProtocolState.sighSpeed )

  UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
  supportedProtocolState.save()
  Sigh_SpeedController.save()
}


export function handleDripped(event: Dripped): void {
  let decimalAdj = BigInt.fromI32(10).pow(18 as u8).toBigDecimal()

  let Sigh_SpeedController = SIGHSpeedControllerState.load(event.address.toHexString())
  let supportedProtocolID = event.params.protocolAddress.toHexString()
  let supportedProtocolState = SpeedControllerSupportedProtocols.load(supportedProtocolID)

  supportedProtocolState.totalDistributedAmount = event.params.totalAmountDripped.toBigDecimal().div(decimalAdj)
  supportedProtocolState.dripTxHistory.push( event.transaction.hash.toHex() )

  UpdateSIGHBalance(event.address.toHexString())  // Updates current SIGH Balance (for SIGH Speed Controller)
  supportedProtocolState.save()
  Sigh_SpeedController.save()
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
    Sigh_Speed_Controller.currentSIGHbalanceETH = BigDecimal.fromString('0')    
    Sigh_Speed_Controller.currentSIGHbalanceUSD = BigDecimal.fromString('0')    

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
  new_SupportedProtocolState.sighSpeedETH = BigDecimal.fromString('0')  
  new_SupportedProtocolState.sighSpeedUSD = BigDecimal.fromString('0')  

  new_SupportedProtocolState.totalDistributedAmount = BigDecimal.fromString('0')  
  new_SupportedProtocolState.totalDistributedAmountETH = BigDecimal.fromString('0')  
  new_SupportedProtocolState.totalDistributedAmountUSD = BigDecimal.fromString('0')  

  new_SupportedProtocolState.updateDripSpeedTxHistory = []
  new_SupportedProtocolState.dripTxHistory = []

  new_SupportedProtocolState.save()
  return new_SupportedProtocolState as SpeedControllerSupportedProtocols
}