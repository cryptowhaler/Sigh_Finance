/* eslint-disable prefer-const */ // to satisfy AS compiler

// For each division by 10, add one to exponent to truncate one significant figure
import {Address, BigDecimal, Bytes, BigInt, log } from '@graphprotocol/graph-ts/index'
import { UserAccount_IndividualMarketStats, Account, Sightroller, Market } from '../generated/schema'
import { PriceOracle } from '../abis/PriceOracle.json'
import { ERC20 } from '../abis/cERC20.json'
import { CToken } from '../abis/cToken.json'

let cUSDCAddress = '0x39aa39c021dfbae8fac545936693ac917d5e7563'
let cETHAddress = '0x4ddc2d193948926d02f9b1fe9e1daa0718270ed5'
let daiAddress = '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359'


export function exponentToBigDecimal(decimals: i32): BigDecimal {
  let bd = BigDecimal.fromString('1')
  for (let i = 0; i < decimals; i++) {
    bd = bd.times(BigDecimal.fromString('10'))
  }
  return bd
}

export let mantissaFactor = 18
export let cTokenDecimals = 8
export let mantissaFactorBD: BigDecimal = exponentToBigDecimal(18)
export let cTokenDecimalsBD: BigDecimal = exponentToBigDecimal(8)
export let zeroBD = BigDecimal.fromString('0')

// Updating User - Market Relationship Account
// Updating User - Market Relationship Account
// Updating User - Market Relationship Account
// Updating User - Market Relationship Account
export function updateUserAccount_IndividualMarketStats(marketID: string,marketSymbol: string,accountID: string,txHash: Bytes,timestamp: i32,blockNumber: i32,): UserAccount_IndividualMarketStats {
  let UserAccountIndividualMarketID = marketID.concat('-').concat(accountID)    // MarketID (address) concatenated with accountID (address) is the ID of the
  let AccountIndividualMarketStats = UserAccount_IndividualMarketStats.load(UserAccountIndividualMarketID)
  if (AccountIndividualMarketStats == null) {
    AccountIndividualMarketStats = createAccountIndividualMarketStats(UserAccountIndividualMarketID, marketSymbol, accountID, marketID)
  }
  // adding transaction hash to transactionHashes: [Bytes!]!
  let txHashes = AccountIndividualMarketStats.transactionHashes
  txHashes.push(txHash)
  AccountIndividualMarketStats.transactionHashes = txHashes
  // adding transaction time to transactionTimes: [Int!]!
  let txTimes = AccountIndividualMarketStats.transactionTimes
  txTimes.push(timestamp)
  AccountIndividualMarketStats.transactionTimes = txTimes
  // "Block number this asset was updated at in the contract"
  AccountIndividualMarketStats.accrualBlockNumber = blockNumber
  return AccountIndividualMarketStats as UserAccount_IndividualMarketStats
}

// Creating User - Market Relationship Account
// Creating User - Market Relationship Account
// Creating User - Market Relationship Account
// Creating User - Market Relationship Account
export function createAccountIndividualMarketStats(cTokenStatsID: string, symbol: string,account: string,marketID: string,): UserAccount_IndividualMarketStats {
  let AccountIndividualMarketStats = new UserAccount_IndividualMarketStats(cTokenStatsID)
  AccountIndividualMarketStats.symbol = symbol
  AccountIndividualMarketStats.market = marketID
  AccountIndividualMarketStats.account = account
  AccountIndividualMarketStats.transactionHashes = []
  AccountIndividualMarketStats.transactionTimes = []
  AccountIndividualMarketStats.accrualBlockNumber = 0
  AccountIndividualMarketStats.cTokenBalance = zeroBD
  AccountIndividualMarketStats.totalUnderlyingSupplied = zeroBD
  AccountIndividualMarketStats.totalUnderlyingRedeemed = zeroBD
  AccountIndividualMarketStats.accountBorrowIndex = zeroBD
  AccountIndividualMarketStats.totalUnderlyingBorrowed = zeroBD
  AccountIndividualMarketStats.totalUnderlyingRepaid = zeroBD
  AccountIndividualMarketStats.storedBorrowBalance = zeroBD
  AccountIndividualMarketStats.enteredMarket = false
  return AccountIndividualMarketStats
}

// Updating the Market
// Updating the Market
// Updating the Market
// Updating the Market
// Updating the Market
export function updateMarket(marketAddress: Address,blockNumber: i32,blockTimestamp: i32,): Market {
  let marketID = marketAddress.toHexString()
  let market = Market.load(marketID)

  if (market == null) {
    market = createMarket(marketID)
  }

  // Update Market if it has not been updated this block
  if (market.accrualBlockNumber != blockNumber) {
    let contractAddress = Address.fromString(market.id)
    let contract = CToken.bind(contractAddress)

    // if cETH, we only update USD price
    if (market.id == cETHAddress) {
      market.underlyingPriceUSD = market.underlyingPrice.truncate(market.underlyingDecimals)
    } 
    else {
      let tokenPriceEth = getTokenPrice(blockNumber,contractAddress,market.underlyingAddress as Address, market.underlyingDecimals,)
      market.underlyingPrice = tokenPriceEth.truncate(market.underlyingDecimals)
    }

    market.accrualBlockNumber = contract.accrualBlockNumber().toI32()
    market.blockTimestamp = blockTimestamp
    market.totalSupply = contract.totalSupply().toBigDecimal().div(cTokenDecimalsBD)

    /* Exchange rate explanation
       How to calculate for tokens with different decimals
        - Must div by tokenDecimals, 10^market.underlyingDecimals
        - Must multiply by ctokenDecimals, 10^8
        - Must div by mantissa, 10^18
     */
    market.exchangeRate = contract.exchangeRateStored().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).times(cTokenDecimalsBD).div(mantissaFactorBD).truncate(mantissaFactor)
    market.borrowIndex = contract.borrowIndex().toBigDecimal().div(mantissaFactorBD).truncate(mantissaFactor)
    market.reserves = contract.totalReserves().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).truncate(market.underlyingDecimals)
    market.totalBorrows = contract.totalBorrows().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).truncate(market.underlyingDecimals)
    market.cash = contract.getCash().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).truncate(market.underlyingDecimals)

    // Must convert to BigDecimal, and remove 10^18 that is used for Exp in Compound Solidity
    market.supplyRate = contract.borrowRatePerBlock().toBigDecimal().times(BigDecimal.fromString('2102400')).div(mantissaFactorBD).truncate(mantissaFactor)

    let supplyRatePerBlock = contract.try_supplyRatePerBlock()
    if (supplyRatePerBlock.reverted) {
      log.info('***CALL FAILED*** : cERC20 supplyRatePerBlock() reverted', [])
      market.borrowRate = zeroBD
    } 
    else {
      market.borrowRate = supplyRatePerBlock.value.toBigDecimal().times(BigDecimal.fromString('2102400')).div(mantissaFactorBD).truncate(mantissaFactor)
    }
    market.save()
  }
  return market as Market
}


// CREATING A MARKET
// CREATING A MARKET
// CREATING A MARKET
// CREATING A MARKET
// CREATING A MARKET
export function createMarket(marketAddress: string): Market {
  let market: Market
  let contract = CToken.bind(Address.fromString(marketAddress))

  // It is CETH, which has a slightly different interface
  if (marketAddress == cETHAddress) {
    market = new Market(marketAddress)
    market.underlyingAddress = Address.fromString('0x0000000000000000000000000000000000000000',)
    market.underlyingDecimals = 18
    market.underlyingPrice = BigDecimal.fromString('1')
    market.underlyingName = 'Ether'
    market.underlyingSymbol = 'ETH'
  } 
  // For the remaining ERC20 Tokens
  else {
    market = new Market(marketAddress)    
    market.underlyingAddress = contract.underlying()
    let underlyingContract = ERC20.bind(market.underlyingAddress as Address)
    market.underlyingDecimals = underlyingContract.decimals()  
    market.underlyingName = underlyingContract.name()
    market.underlyingSymbol = underlyingContract.symbol()
    } 

  market.name = contract.name()
  market.symbol = contract.symbol()
  market.cash = zeroBD
  market.reserves = zeroBD
  market.totalBorrows = zeroBD
  market.totalSupply = zeroBD
  market.reserveFactor = BigInt.fromI32(0)
  market.underlyingPriceUSD = zeroBD
  market.borrowRate = zeroBD
  market.collateralFactor = zeroBD
  market.exchangeRate = zeroBD
  market.interestRateModelAddress = Address.fromString('0x0000000000000000000000000000000000000000',)
  market.numberOfBorrowers = 0
  market.numberOfSuppliers = 0
  market.supplyRate = zeroBD
  market.underlyingPrice = zeroBD
  market.accrualBlockNumber = 0
  market.blockTimestamp = 0
  market.borrowIndex = zeroBD

  return market
}


// Creating A user's Account 
// Creating A user's Account 
// Creating A user's Account 
// Creating A user's Account 
export function createUserAccount(accountID: string): Account {
  let account = new Account(accountID)
  account.countLiquidated = 0
  account.countLiquidator = 0
  account.hasBorrowed = false
  account.save()
  return account
}


// Used for all cERC20 contracts to get token Price
// Used for all cERC20 contracts to get token Price
// Used for all cERC20 contracts to get token Price
// Used for all cERC20 contracts to get token Price
function getTokenPrice(blockNumber: i32, eventAddress: Address, underlyingAddress: Address, underlyingDecimals: i32,): BigDecimal {
  let sightroller = Sightroller.load('1')
  let oracleAddress = sightroller.priceOracle as Address
  let underlyingPrice: BigDecimal
  let mantissaDecimalFactor = 18 - underlyingDecimals + 18
  let bdFactor = exponentToBigDecimal(mantissaDecimalFactor)
  let oracle = PriceOracle.bind(oracleAddress)
  underlyingPrice = oracle.getUnderlyingPrice(eventAddress).toBigDecimal().div(bdFactor)
  return underlyingPrice
}