/* eslint-disable prefer-const */ // to satisfy AS compiler

// For each division by 10, add one to exponent to truncate one significant figure
import {Address, BigDecimal, Bytes, BigInt, log } from '@graphprotocol/graph-ts/index'
import { log } from '@graphprotocol/graph-ts'
import { UserAccount_IndividualMarketStats, Account, Sightroller, Market, SIGH } from '../generated/schema'
import { PriceOracle } from '../generated/POLY/PriceOracle'
import { cToken } from '../generated/POLY/cToken'
import { cERC20 } from '../generated/POLY/cERC20'
import { EIP20Interface } from '../generated/LINK/EIP20Interface'

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
  log.info('updateMarket: marketID : {}',[marketID] )
  let market = Market.load(marketID)

  if (market == null) {
    log.info('updateMarket: creating market : {}',[marketID] )
    market = createMarket(marketID)
  }

  log.info('updateMarket: Ater creating market : {}',[marketID] )

  // Update Market if it has not been updated this block
  if (market.accrualBlockNumber != blockNumber) {
    let contractAddress = Address.fromString(market.id)
    let contract = cERC20.bind(contractAddress)
    log.info('updateMarket: contractAddress : {}',[contractAddress.toHex()] )

    let tokenPrice = getTokenPrice(blockNumber, contractAddress, market.underlyingAddress as Address, market.underlyingDecimals,)
    market.underlyingPrice = tokenPrice.truncate(market.underlyingDecimals)
    market.underlyingPriceUSD = tokenPrice.truncate(market.underlyingDecimals)
    log.info('updateMarket: market.underlyingPrice : {}', [market.underlyingPrice.toString()] )
    log.info('updateMarket: market.underlyingPriceUSD : {}', [market.underlyingPriceUSD.toString()] )


    market.accrualBlockNumber = contract.accrualBlockNumber().toI32()
    market.blockTimestamp = blockTimestamp
    market.totalSupply = contract.totalSupply().toBigDecimal().div(cTokenDecimalsBD)
    log.info('updateMarket: market.totalSupply : {}', [market.totalSupply.toString()] )

    /* Exchange rate explanation
       How to calculate for tokens with different decimals
        - Must div by tokenDecimals, 10^market.underlyingDecimals
        - Must multiply by ctokenDecimals, 10^8
        - Must div by mantissa, 10^18
     */
    log.info('updateMarket: market.exchangeRate (before) : {}', [market.exchangeRate.toString()] )
    market.exchangeRate = contract.exchangeRateStored().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).times(cTokenDecimalsBD).div(mantissaFactorBD).truncate(mantissaFactor)
    log.info('updateMarket: market.exchangeRate (after) : {}', [market.exchangeRate.toString()] )

    log.info('updateMarket: market.borrowIndex (before) : {}', [market.borrowIndex.toString()] )
    market.borrowIndex = contract.borrowIndex().toBigDecimal().div(mantissaFactorBD).truncate(mantissaFactor)
    log.info('updateMarket: market.borrowIndex (after) : {}', [market.borrowIndex.toString()] )

    log.info('updateMarket: market.reserves (before) : {}', [market.reserves.toString()] )
    market.reserves = contract.totalReserves().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).truncate(market.underlyingDecimals)
    log.info('updateMarket: market.reserves (after) : {}', [market.reserves.toString()] )

    log.info('updateMarket: market.totalBorrows (before) : {}', [market.totalBorrows.toString()] )
    market.totalBorrows = contract.totalBorrows().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).truncate(market.underlyingDecimals)
    log.info('updateMarket: market.totalBorrows (after) : {}', [market.totalBorrows.toString()] )

    log.info('updateMarket: market.cash (before) : {}', [market.cash.toString()] )
    market.cash = contract.getCash().toBigDecimal().div(exponentToBigDecimal(market.underlyingDecimals)).truncate(market.underlyingDecimals)
    log.info('updateMarket: market.cash (after) : {}', [market.cash.toString()] )

    // Must convert to BigDecimal, and remove 10^18 that is used for Exp in Compound Solidity
    log.info('updateMarket: market.supplyRate (after) : {}', [market.supplyRate.toString()] )
    market.supplyRate = contract.borrowRatePerBlock().toBigDecimal().times(BigDecimal.fromString('2102400')).div(mantissaFactorBD).truncate(mantissaFactor)
    log.info('updateMarket: market.supplyRate (after) : {}', [market.supplyRate.toString()] )

    let supplyRatePerBlock = contract.try_supplyRatePerBlock()
    if (supplyRatePerBlock.reverted) {
      log.info('***CALL FAILED*** : cERC20 supplyRatePerBlock() reverted', [])
      market.borrowRate = zeroBD
      log.info('updateMarket: market.borrowRate (after) : {}', [market.borrowRate.toString()] )
    } 
    else {
      log.info('updateMarket: market.borrowRate (before) : {}', [market.borrowRate.toString()] )      
      market.borrowRate = supplyRatePerBlock.value.toBigDecimal().times(BigDecimal.fromString('2102400')).div(mantissaFactorBD).truncate(mantissaFactor)
      log.info('updateMarket: market.borrowRate (after) : {}', [market.borrowRate.toString()] )
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
  let contract = cERC20.bind(Address.fromString(marketAddress))

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
    let underlyingContract = EIP20Interface.bind(market.underlyingAddress as Address)
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
  market.reserveFactor = contract.reserveFactorMantissa()
  market.underlyingPriceUSD = zeroBD
  market.borrowRate = zeroBD
  market.collateralFactor = zeroBD
  market.exchangeRate = contract.exchangeRateStored().toBigDecimal()
  market.interestRateModelAddress = Address.fromString('0x0000000000000000000000000000000000000000',)
  market.numberOfBorrowers = 0
  market.numberOfSuppliers = 0
  market.supplyRate = zeroBD
  market.underlyingPrice = zeroBD
  market.accrualBlockNumber = 0
  market.blockTimestamp = 0
  market.borrowIndex = zeroBD

  market.gsighSpeed = BigInt.fromI32(0)
  market.totalGsighDistributedToSuppliers = BigInt.fromI32(0)
  market.totalGsighDistributedToBorrowers = BigInt.fromI32(0)
  market.pendingAdmin = contract.pendingAdmin() as Address
  market.admin = contract.admin() as Address
  market.sightroller = contract.sightroller() as Address

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
  log.info('getTokenPrice : getTokenPrice market : {}',['underlyingDecimals'] )
  let sightroller = Sightroller.load('1')
  if (sightroller == null) {
    sightroller = createSighTroller()
  }
  log.info('getTokenPrice : sightroller id : {}',[sightroller.id] )
  let oracleAddress = sightroller.priceOracle as Address
  log.info('getTokenPrice : oracleAddress market : {}',[oracleAddress.toHexString()] )
  let underlyingPrice: BigDecimal
  let mantissaDecimalFactor = 18 - underlyingDecimals + 18
  let bdFactor = exponentToBigDecimal(mantissaDecimalFactor)
  log.info('getTokenPrice : before binding : {}',[oracleAddress.toHexString()] )  
  let oracle = PriceOracle.bind(oracleAddress)
  log.info('getTokenPrice : after binding (Market Delegator Address) : {}',[eventAddress.toHexString()] )    
  underlyingPrice = oracle.getUnderlyingPrice(eventAddress).toBigDecimal().div(bdFactor)
  log.info('getTokenPrice :  after binding (Market underlying price from Oracle) : {}',[underlyingPrice.toString()] )    
  return underlyingPrice
}



// Creating SIGH  
// Creating SIGH
// Creating SIGH
// Creating SIGH
export function createSIGH(addressID: string): SIGH {
  let sigh_token_contract = new SIGH(addressID)
  sigh_token_contract.currentCycle = new BigInt(0)
  sigh_token_contract.currentEra = new BigInt(0)
  sigh_token_contract.Recentminter = Address.fromString('0x0000000000000000000000000000000000000000',)
  sigh_token_contract.RecentCoinsMinted = new BigInt(0)
  sigh_token_contract.totalSupply = new BigInt(0)
  sigh_token_contract.blockNumberWhenCoinsMinted = new BigInt(0)
  sigh_token_contract.Reservoir = Address.fromString('0x0000000000000000000000000000000000000000',)
  sigh_token_contract.save()
  return sigh_token_contract
}

// Creating SIGHTROLLER
// Creating SIGHTROLLER
// Creating SIGHTROLLER
// Creating SIGHTROLLER
export function createSighTroller(): Sightroller {
  let Sightroller_contract = new Sightroller('1')
  Sightroller_contract.priceOracle = Address.fromString('0xc4cdDAc0206EB3000a2D4E47470546B6b4ede744',)
  Sightroller_contract.closeFactor = new BigInt(0)
  Sightroller_contract.liquidationIncentive = new BigInt(0)
  Sightroller_contract.maxAssets = new BigInt(0)
  Sightroller_contract.pauseGuardian = Address.fromString('0xf5376e847EFa1Ea889bfCb03706F414daDE0E82c',)
  Sightroller_contract.gsighRate = new BigInt(0)
  Sightroller_contract.save()
  return Sightroller_contract
}



