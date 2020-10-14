import { Address, BigInt } from "@graphprotocol/graph-ts"
import { tokenBeingDistributedChanged, DripAllowedChanged, DripSpeedChanged, AmountDripped, maxTransferAmountUpdated,TokensBought,TokensSold} from "../../generated/Sightroller/Sightroller"

import { SIGHTreasury,TokenBalancesData } from "../../generated/schema"
import { SIGHTreasuryContract } from '../generated/POLY/PriceOracle'
import { cERC20 } from '../generated/POLY/cERC20'

import { log } from '@graphprotocol/graph-ts'

// ############################################################
// ###########   STATE CHANGE OF SIGH TREASURY  ###############
// ############################################ ###############

export function handletokenBeingDistributedChanged(event: tokenBeingDistributedChanged): void {
  let SighTreasury = SIGHTreasury.load(event.address.toHexString())
  if (SighTreasury == null) {
    SighTreasury = createSighTreasury(event.address.toHexString())
  }
  SighTreasury.tokenBeingDripped = event.params.newToken
  SighTreasury.save()
}

export function handleDripAllowedChanged(event: DripAllowedChanged): void {
    let SighTreasury = SIGHTreasury.load(event.address.toHexString())
    if (SighTreasury == null) {
      SighTreasury = createSighTreasury(event.address.toHexString())
    }
    SighTreasury.isDripAllowed = event.params.newDripAllowed
    SighTreasury.save()
  }

  export function handleDripSpeedChanged(event: DripSpeedChanged): void {
    let SighTreasury = SIGHTreasury.load(event.address.toHexString())
    if (SighTreasury == null) {
      SighTreasury = createSighTreasury(event.address.toHexString())
    }
    SighTreasury.DripSpeed = event.params.curDripSpeed
    SighTreasury.save()
  }

  export function handlemaxTransferAmountUpdated(event: maxTransferAmountUpdated): void {
    let SighTreasury = SIGHTreasury.load(event.address.toHexString())
    if (SighTreasury == null) {
      SighTreasury = createSighTreasury(event.address.toHexString())
    }
    SighTreasury.maxTransferAmount = event.params.newmaxTransferAmount
    SighTreasury.save()
  }

// ############################################################
// ###########   THESE EVENTS CHANGE TOKENBALANCES   ##########
// ############################################ ###############

  export function handleAmountDripped(event: AmountDripped): void {
    let SighTreasury = SIGHTreasury.load(event.address.toHexString())
    if (SighTreasury == null) {
      SighTreasury = createSighTreasury(event.address.toHexString())
    }
    let token = event.params.tokenBeingDripped
    let newCurrentBalance = event.params.currentBalance
    let amountDripped = event.params.AmountDripped

    let token_balances = getTokenBalances(token);
    token_balances.balance = newCurrentBalance
    token_balances.totalDripped = amountDripped
    token_balances.save()

    SighTreasury.save()
  }

  export function handleTokensBought(event: TokensBought): void {
    let SighTreasury = SIGHTreasury.load(event.address.toHexString())

    let token = event.params.token_Address
    let token_balances = getTokenBalances(token)

    token_balances.balance = event.params.new_balance
    token_balances.save()
    
    SighTreasury.save()
  }

  export function handleTokensSold(event: TokensSold): void {
    let SighTreasury = SIGHTreasury.load(event.address.toHexString())

    let token = event.params.token_Address
    let token_balances = getTokenBalances(token)

    token_balances.balance = event.params.new_balance
    token_balances.save()

    SighTreasury.save()
  }
  
  

  export function getTokenBalances(tokenBalanceID : string) : TokenBalancesData {
      let cur_token_balance = TokenBalancesData.load(tokenBalanceID)
      if (cur_token_balance == null) {
        cur_token_balance = createTokenBalances(tokenBalanceID)
      }
      return cur_token_balance as TokenBalancesData
  }

// ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

function createSighTreasury(addressID: string): SIGHTreasury {
    let Sigh_Treasury = new SIGHTreasury(addressID)
    let Sigh_Treasury_contract = SIGHTreasuryContract.bind(Address.fromString(addressID))

    Sigh_Treasury.sightroller_address = Sigh_Treasury_contract.sightroller_address()
    Sigh_Treasury.sigh_token = Sigh_Treasury_contract.sigh_token()

    Sigh_Treasury.maxTransferAmount = new BigInt(0)    

    Sigh_Treasury.tokenBeingDripped = Address.fromString('0x0000000000000000000000000000000000000000',)
    Sigh_Treasury.DripSpeed = new BigInt(0)    
    Sigh_Treasury.isDripAllowed = false    
    
    Sigh_Treasury.save()
    return Sigh_Treasury as SIGHTreasury
}
  
function createTokenBalances(addressID: string) : TokenBalancesData {
    let Token_Balances = new TokenBalancesData(addressID)
    let ERC20_contract = cERC20.bind(Address.fromString(addressID))

    Token_Balances.symbol = ERC20_contract.symbol()
    Token_Balances.balance = new BigInt(0)  
    Token_Balances.totalDripped = new BigInt(0) 
    
    return Token_Balances as TokenBalancesData
}