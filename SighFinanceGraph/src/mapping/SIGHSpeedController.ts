import { Address, BigInt } from "@graphprotocol/graph-ts"
import { DistributionInitialized, ProtocolDistributionSpeedChanged, TreasuryDistributionSpeedChanged, DrippedToProtocol, DrippedToTreasury } from "../../generated/Sightroller/Sightroller"

import { SIGHSpeedController } from "../../generated/schema"
// import { mantissaFactorBD, updateUserAccount_IndividualMarketStats , createSighTroller, createMarket } from '../helpers'
import { log } from '@graphprotocol/graph-ts'

export function handleDistributionInitialized(event: DistributionInitialized): void {
  let Sigh_SpeedController = SIGHSpeedController.load(event.address.toHexString())
  if (Sigh_SpeedController == null) {
    Sigh_SpeedController = createSigh_SpeedController(event.address.toHexString())
  }
  Sigh_SpeedController.ProtocolAddress = event.params.protocolAddress
  Sigh_SpeedController.TreasuryAddress = event.params.treasuryAddress
  Sigh_SpeedController.save()
}

export function handleProtocolDistributionSpeedChanged(event: ProtocolDistributionSpeedChanged): void {
  let Sigh_SpeedController = SIGHSpeedController.load(event.address.toHexString())
  if (Sigh_SpeedController == null) {
    Sigh_SpeedController = createSigh_SpeedController(event.address.toHexString())
  }
  Sigh_SpeedController.ProtocolDistributionSpeed = event.params.newSpeed
  Sigh_SpeedController.save()
}

export function handleTreasuryDistributionSpeedChanged(event: TreasuryDistributionSpeedChanged): void {
  let Sigh_SpeedController = SIGHSpeedController.load(event.address.toHexString())
  if (Sigh_SpeedController == null) {
    Sigh_SpeedController = createSigh_SpeedController(event.address.toHexString())
  }
  Sigh_SpeedController.TreasuryDistributionSpeed = event.params.newSpeed
  Sigh_SpeedController.save()
}

export function handleDrippedToProtocol(event: DrippedToProtocol): void {
    let Sigh_SpeedController = SIGHSpeedController.load(event.address.toHexString())
    if (Sigh_SpeedController == null) {
      Sigh_SpeedController = createSigh_SpeedController(event.address.toHexString())
    }
    Sigh_SpeedController.ReservoirBalance = event.params.currentBalance
    Sigh_SpeedController.recentlyDrippedToProtocol = event.params.AmountDripped
    Sigh_SpeedController.totalAmountDrippedToProtocol = event.params.totalAmountDripped

    Sigh_SpeedController.totalAmountDripped = Sigh_SpeedController.totalAmountDripped.plus(Sigh_SpeedController.totalAmountDrippedToProtocol);
    Sigh_SpeedController.save()
  }

  export function handleDrippedToTreasury(event: DrippedToTreasury): void {
    let Sigh_SpeedController = SIGHSpeedController.load(event.address.toHexString())
    if (Sigh_SpeedController == null) {
      Sigh_SpeedController = createSigh_SpeedController(event.address.toHexString())
    }
    Sigh_SpeedController.ReservoirBalance = event.params.currentBalance
    Sigh_SpeedController.recentlyDrippedToTreasury = event.params.AmountDripped
    Sigh_SpeedController.totalAmountDrippedToTreasury = event.params.totalAmountDripped

    Sigh_SpeedController.totalAmountDripped = Sigh_SpeedController.totalAmountDripped.plus(Sigh_SpeedController.totalAmountDrippedToTreasury);
    Sigh_SpeedController.save()
  }  


// ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

function createSigh_SpeedController(addressID: string): SIGHSpeedController {
    let Sigh_Speed_Controller = new SIGHSpeedController(addressID)

    Sigh_Speed_Controller.ProtocolAddress = Address.fromString('0x0000000000000000000000000000000000000000',)
    Sigh_Speed_Controller.TreasuryAddress = Address.fromString('0x0000000000000000000000000000000000000000',)

    Sigh_Speed_Controller.ProtocolDistributionSpeed = new BigInt(0)
    Sigh_Speed_Controller.TreasuryDistributionSpeed = new BigInt(0)    
    
    Sigh_Speed_Controller.ReservoirBalance = new BigInt(0)
    
    Sigh_Speed_Controller.recentlyDrippedToProtocol = new BigInt(0)
    Sigh_Speed_Controller.totalAmountDrippedToProtocol = new BigInt(0)
    
    Sigh_Speed_Controller.recentlyDrippedToTreasury = new BigInt(0)
    Sigh_Speed_Controller.totalAmountDrippedToTreasury = new BigInt(0)

    Sigh_Speed_Controller.totalAmountDripped = new BigInt(0)
    
    Sigh_Speed_Controller.save()
    return Sigh_Speed_Controller as SIGHSpeedController
}
  