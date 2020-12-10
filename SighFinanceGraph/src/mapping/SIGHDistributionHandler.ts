import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentAdded, InstrumentRemoved, InstrumentSIGHStateUpdated, SIGHSpeedUpdated, StakingSpeedUpdated, CryptoMarketSentimentUpdated
 , minimumBlocksForSpeedRefreshUpdated , PriceSnapped, SIGHBorrowIndexUpdated, AccuredSIGHTransferredToTheUser, InstrumentVolatilityCalculated,
 MaxSIGHSpeedCalculated, refreshingSighSpeeds , SIGHSupplyIndexUpdated } from "../../generated/Sigh_Distribution_Handler/SIGHDistributionHandler"
import { SIGH_Instrument, Instrument,SIGH_Distribution_SnapShot } from "../../generated/schema"
import { createInstrument,updatePrice } from "./LendingPoolConfigurator"
import { PriceOracleGetter } from '../../generated/Lending_Pool_Configurator/PriceOracleGetter'
import { SIGHDistributionHandler } from '../../generated/Sigh_Distribution_Handler/SIGHDistributionHandler'


// FINAL v0. To be Tested : WEI ONLY
export function handleSIGHSupplyIndexUpdated(event: SIGHSupplyIndexUpdated): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    let decimalAdj = BigInt.fromI32(10).pow(instrumentState.decimals.toI32() as u8).toBigDecimal()

    // Instrument's current Compounded Liquidity Balance
    instrumentState.totalCompoundedLiquidityWEI = event.params.totalCompoundedSupply
    instrumentState.totalCompoundedLiquidity = instrumentState.totalCompoundedLiquidityWEI.toBigDecimal().div(decimalAdj) 

    // Instrument's life-time $SIGH Accured as part of "Liquidity $SIGH Stream"
    instrumentState.totalLiquiditySIGHAccuredWEI = instrumentState.totalLiquiditySIGHAccuredWEI.plus( event.params.sighAccured )
    instrumentState.totalLiquiditySIGHAccured = instrumentState.totalLiquiditySIGHAccuredWEI.toBigDecimal().div( BigInt.fromI32(10).pow(18 as u8).toBigDecimal() )

    // Instrument's current $SIGH Accuredas part of "Liquidity $SIGH Stream" , which is being distributed among the Liquidity Providers
    instrumentState.currentLiquiditySIGHAccuredWEI = instrumentState.currentLiquiditySIGHAccuredWEI.plus( event.params.sighAccured )
    instrumentState.currentLiquiditySIGHAccured = instrumentState.currentLiquiditySIGHAccuredWEI.toBigDecimal().div( BigInt.fromI32(10).pow(18 as u8).toBigDecimal() )

    instrumentState.SIGH_Supply_Index = event.params.newIndexMantissa   // INDEX is used for distributing $SIGH on a per token unit basis
    instrumentState.SIGH_Supply_Index_lastUpdatedBlock = event.block.number    // Block Number when it was last updated

    instrumentState.save()
    updatePrice(instrumentId)

}

// FINAL v0. To be Tested : WEI ONLY
export function handleSIGHBorrowIndexUpdated(event: SIGHBorrowIndexUpdated): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    let decimalAdj = BigInt.fromI32(10).pow(instrumentState.decimals.toI32() as u8).toBigDecimal()

    // Instrument's current Compounded STABLE Borrow Balance
    instrumentState.totalCompoundedStableBorrowsWEI = event.params.totalCompoundedStableBorrows 
    instrumentState.totalCompoundedStableBorrows = instrumentState.totalCompoundedStableBorrowsWEI.toBigDecimal().div( decimalAdj )

    // Instrument's current Compounded VARIABLE Borrow Balance
    instrumentState.totalCompoundedVariableBorrowsWEI = event.params.totalCompoundedVariableBorrows
    instrumentState.totalCompoundedVariableBorrows = instrumentState.totalCompoundedVariableBorrowsWEI.toBigDecimal().div( decimalAdj )

    instrumentState.totalCompoundedBorrowsWEI = instrumentState.totalCompoundedStableBorrowsWEI.plus(instrumentState.totalCompoundedVariableBorrowsWEI)
    instrumentState.totalCompoundedBorrows = instrumentState.totalCompoundedBorrowsWEI.toBigDecimal().div( decimalAdj )

    // Instrument's life-time $SIGH Accured as part of  "Borrowing $SIGH Stream"
    instrumentState.totalBorrowingSIGHAccuredWEI = instrumentState.totalBorrowingSIGHAccuredWEI.plus( event.params.sighAccured )
    instrumentState.totalBorrowingSIGHAccured = instrumentState.totalBorrowingSIGHAccuredWEI.toBigDecimal().div( BigInt.fromI32(10).pow(18 as u8).toBigDecimal() )

    // Instrument's current $SIGH Accured  as part of  "Borrowing $SIGH Stream", which is being distributed among the Instrument Borrowers
    instrumentState.currentBorrowingSIGHAccuredWEI = instrumentState.currentBorrowingSIGHAccuredWEI.plus( event.params.sighAccured )
    instrumentState.currentBorrowingSIGHAccured = instrumentState.currentBorrowingSIGHAccuredWEI.toBigDecimal().div( BigInt.fromI32(10).pow(18 as u8).toBigDecimal() )

    instrumentState.SIGH_Borrow_Index = event.params.newIndexMantissa      // INDEX is used for distributing $SIGH on a per token unit basis
    instrumentState.SIGH_Borrow_Index_lastUpdatedBlock = event.block.number     // Block Number when it was last updated
    
    instrumentState.save()
    updatePrice(instrumentId)

}




export function handleInstrumentAdded(event: InstrumentAdded): void {
    log.info('handleInstrumentAdded: 1st ',[])
    let instrumentId = event.params.instrumentAddress_.toHexString()    
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        log.info('handleInstrumentAdded: createInstrument ',[])
        instrumentState = createInstrument(instrumentId)
        instrumentState.creationBlockNumber = event.block.number        
    }
    log.info('handleInstrumentAdded: instrumentId {} ',[instrumentId])
    log.info('handleInstrumentAdded: instrumentId  {} ',[instrumentId.toString()])
    instrumentState.isListedWithSIGH_Mechanism = true
    instrumentState.isSIGHMechanismActivated = false
    // log.info('handleInstrumentAdded: 3st ',[])
    instrumentState.SIGH_Supply_Index = BigInt.fromI32(10).pow(36 as u8)  
    instrumentState.SIGH_Supply_Index_lastUpdatedBlock = event.block.number
    // log.info('handleInstrumentAdded: 4st ',[])
    instrumentState.SIGH_Borrow_Index = BigInt.fromI32(10).pow(36 as u8)  
    instrumentState.SIGH_Borrow_Index_lastUpdatedBlock =  event.block.number
    // log.info('handleInstrumentAdded: 5st ',[])

    instrumentState.present_SIGH_Side = 'In-Active'
    instrumentState.bearSentimentPercent = BigInt.fromI32(100).toBigDecimal()
    instrumentState.bullSentimentPercent = BigInt.fromI32(100).toBigDecimal()

    instrumentState.save()
}




export function handleInstrumentRemoved(event: InstrumentRemoved): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.isListedWithSIGH_Mechanism = false
    instrumentState.isSIGHMechanismActivated = false
    instrumentState.save()
}

export function handleInstrumentSIGHStateUpdated(event: InstrumentSIGHStateUpdated): void {
    let instrumentId = event.params.instrument_.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.isSIGHMechanismActivated = event.params.isSIGHMechanismActivated
    let bearSentiment = event.params.bearSentiment
    instrumentState.bearSentimentPercent = bearSentiment.toBigDecimal().div( BigInt.fromI32(10).pow(16 as u8).toBigDecimal() )  
    let bullSentiment = event.params.bullSentiment
    instrumentState.bullSentimentPercent = bullSentiment.toBigDecimal().div( BigInt.fromI32(10).pow(16 as u8).toBigDecimal() )  
    instrumentState.save()
}


export function handleStakingSpeedUpdated(event: StakingSpeedUpdated): void {
    let instrumentId = event.params.instrumentAddress_.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    instrumentState.present_SIGH_Staking_Speed_WEI = event.params.new_staking_Speed
    instrumentState.present_SIGH_Staking_Speed = instrumentState.present_SIGH_Staking_Speed_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
    instrumentState.save()
}



export function handlePriceSnapped(event: PriceSnapped): void {
    let instrumentId = event.params.instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    log.info("handlePriceSnapped 1 : {} ",[instrumentState.name])

    // CALCULATING TOTAL SIGH ACCURED FOR THE SNAPSHOT THAT JUST GOT COMPLETED
    if (instrumentState.totalSIGHDistributionSnapshotsTaken > BigInt.fromI32(0) ) {
        log.info("handlePriceSnapped 2 : {} ",[instrumentState.name])
        let snapShotID = instrumentState.totalSIGHDistributionSnapshotsTaken.minus(BigInt.fromI32(1)).toString() + instrumentId 
        let prevSighDistributionSnapshot = SIGH_Distribution_SnapShot.load( snapShotID )
        log.info("handlePriceSnapped 3 : {} ",[instrumentState.name])
        if (prevSighDistributionSnapshot.distribution_Side == 'In-Active' ) {
            prevSighDistributionSnapshot.BorrowingSIGHAccuredDuringThisSnapshot = instrumentState.totalBorrowingSIGHAccured.minus(prevSighDistributionSnapshot.totalBorrowingSIGHAccuredBeforeThisSnapshot)
            prevSighDistributionSnapshot.LiquiditySIGHAccuredDuringThisSnapshot = instrumentState.totalLiquiditySIGHAccured.minus(prevSighDistributionSnapshot.totalLiquiditySIGHAccuredBeforeThisSnapshot)
        }
        if (prevSighDistributionSnapshot.distribution_Side == 'Suppliers' ) {
            prevSighDistributionSnapshot.LiquiditySIGHAccuredDuringThisSnapshot = instrumentState.totalLiquiditySIGHAccured.minus(prevSighDistributionSnapshot.totalLiquiditySIGHAccuredBeforeThisSnapshot)
        }
        if (prevSighDistributionSnapshot.distribution_Side == 'Borrowers' ) {
            prevSighDistributionSnapshot.BorrowingSIGHAccuredDuringThisSnapshot = instrumentState.totalBorrowingSIGHAccured.minus(prevSighDistributionSnapshot.totalBorrowingSIGHAccuredBeforeThisSnapshot)
        }
        log.info("handlePriceSnapped 4 : {} ",[instrumentState.name])
        log.info("handlePriceSnapped 4-1 : instrumentState.present_percentTotalSentimentVolatility {} ",[instrumentState.present_percentTotalSentimentVolatility.toString()])        
        prevSighDistributionSnapshot.instrumentLimitVolatilityAsPercentOflimitProtocolVolatility = instrumentState.present_percentTotalSentimentVolatility
        log.info("handlePriceSnapped 4-2 :  : totalVolatilityAsPercentOfTotalProtocolVolatility {}",[prevSighDistributionSnapshot.totalVolatilityAsPercentOfTotalProtocolVolatility.toString()])
        log.info("handlePriceSnapped 4-3 :  : instrumentLimitVolatilityAsPercentOflimitProtocolVolatility {} ",[prevSighDistributionSnapshot.instrumentLimitVolatilityAsPercentOflimitProtocolVolatility.toString()])
        prevSighDistributionSnapshot.toBlockNumber = event.block.number
        prevSighDistributionSnapshot.save()
    }

    // CREATING AND CALCULATING VALUES FOR THE NEW (CURRENT) 
    let snapShotID = instrumentState.totalSIGHDistributionSnapshotsTaken.toString() + instrumentId 
    log.info("handlePriceSnapped 5 : {} ",[instrumentState.name])
    log.info("SNAPSHOT ID : {} : {}",[instrumentState.name,snapShotID])
    let sighDistributionSnapshot = create_SIGH_Distribution_SnapShot( snapShotID)
    sighDistributionSnapshot.instrumentAddress = instrumentId
    instrumentState.totalSIGHDistributionSnapshotsTaken = instrumentState.totalSIGHDistributionSnapshotsTaken.plus(BigInt.fromI32(1));
    log.info("handlePriceSnapped 6 : {} ",[instrumentState.name])

    sighDistributionSnapshot.fromBlockNumber = event.block.number
    sighDistributionSnapshot.toBlockNumber = new BigInt(0)

    sighDistributionSnapshot.deltaBlocks24Hrs = event.params.deltaBlocks
    sighDistributionSnapshot.clock = event.params.currentClock

    sighDistributionSnapshot.prevPrice_ETH = event.params.prevPrice.toBigDecimal().div(  (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
    sighDistributionSnapshot.openingPrice_ETH = event.params.currentPrice.toBigDecimal().div(  (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
    log.info("handlePriceSnapped 7 : {} ",[instrumentState.name])

    sighDistributionSnapshot.totalLiquiditySIGHAccuredBeforeThisSnapshot = instrumentState.totalLiquiditySIGHAccured
    sighDistributionSnapshot.totalBorrowingSIGHAccuredBeforeThisSnapshot = instrumentState.totalBorrowingSIGHAccured

    // GETTING ETH PRICE IN USD
    let oracleAddress = instrumentState.oracle as Address
    let oracleContract = PriceOracleGetter.bind( oracleAddress)
    let ETH_PriceInUSD = oracleContract.getAssetPrice(Address.fromString('0x9803DB21B6b535923D3c69Cc1b000d4bd45CCb12')).toBigDecimal()
    let ETH_PriceInUSDDecimals = oracleContract.getAssetPriceDecimals(Address.fromString('0x9803DB21B6b535923D3c69Cc1b000d4bd45CCb12'))
    let ETHPriceInUSD = ETH_PriceInUSD.div(  BigInt.fromI32(10).pow(ETH_PriceInUSDDecimals as u8).toBigDecimal() )
    instrumentState.ETHPriceInUSD = ETHPriceInUSD

    sighDistributionSnapshot.prevPrice_USD = sighDistributionSnapshot.prevPrice_ETH.times(ETHPriceInUSD)
    sighDistributionSnapshot.openingPrice_USD = sighDistributionSnapshot.openingPrice_ETH.times(ETHPriceInUSD)

    sighDistributionSnapshot.priceDifferenceETH = sighDistributionSnapshot.openingPrice_ETH.minus(sighDistributionSnapshot.prevPrice_ETH)
    sighDistributionSnapshot.priceDifferenceUSD = sighDistributionSnapshot.priceDifferenceETH.times(ETHPriceInUSD)

    sighDistributionSnapshot.bearSentimentPercent = instrumentState.bearSentimentPercent
    sighDistributionSnapshot.bullSentimentPercent = instrumentState.bullSentimentPercent
    log.info("handlePriceSnapped 8 : {} ",[instrumentState.name])

    sighDistributionSnapshot.save()

    // Updating Parameters for Instrument for current on-going Snapshot 
    instrumentState.present_PrevPrice_ETH = sighDistributionSnapshot.prevPrice_ETH
    instrumentState.present_PrevPrice_USD = sighDistributionSnapshot.prevPrice_USD

    instrumentState.present_OpeningPrice_ETH = sighDistributionSnapshot.openingPrice_ETH
    instrumentState.present_OpeningPrice_USD = sighDistributionSnapshot.openingPrice_USD
    instrumentState.present_DeltaBlocks = sighDistributionSnapshot.deltaBlocks24Hrs
    instrumentState.save()
}



export function handleInstrumentVolatilityCalculated(event: InstrumentVolatilityCalculated): void { 
    let instrumentId = event.params._Instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    let snapShotID = instrumentState.totalSIGHDistributionSnapshotsTaken.minus(BigInt.fromI32(1)).toString() + instrumentId 
    let currentSighDistributionSnapshot = SIGH_Distribution_SnapShot.load( snapShotID ) 

    log.info("handleInstrumentVolatilityCalculated 1 : {} ",[instrumentState.name])
    //  UPDATING $SIGH DISTRIBUTION SNAPSHOT
    currentSighDistributionSnapshot.total24HrVolatilityETH = event.params._total24HrVolatility.toBigDecimal().div(  (BigInt.fromI32(10).pow(18 as u8).toBigDecimal())  )
    log.info("handleInstrumentVolatilityCalculated 2 : {} ",[instrumentState.name])
    currentSighDistributionSnapshot.total24HrVolatilityUSD = currentSighDistributionSnapshot.total24HrVolatilityETH.times(instrumentState.ETHPriceInUSD)
    log.info("handleInstrumentVolatilityCalculated 3 : {} ",[instrumentState.name])
    currentSighDistributionSnapshot.totaltotal24HrSentimentVolatilityETH = event.params._total24HrSentimentVolatility.toBigDecimal().div(  (BigInt.fromI32(10).pow(18 as u8).toBigDecimal())  )
    log.info("handleInstrumentVolatilityCalculated 4 : {} ",[instrumentState.name])
    currentSighDistributionSnapshot.totaltotal24HrSentimentVolatilityUSD = currentSighDistributionSnapshot.totaltotal24HrSentimentVolatilityETH.times(instrumentState.ETHPriceInUSD)
    log.info("handleInstrumentVolatilityCalculated 5 : {} ",[instrumentState.name])

    //  UPDATING INSTRUMENT STATE FOR ON-GOING $SIGH DISTRIBUTION SNAPSHOT    
    instrumentState.present_total24HrVolatilityETH = currentSighDistributionSnapshot.total24HrVolatilityETH
    log.info("handleInstrumentVolatilityCalculated 6 : {} ",[instrumentState.name])
    instrumentState.present_total24HrSentimentVolatilityETH = currentSighDistributionSnapshot.totaltotal24HrSentimentVolatilityETH
    log.info("handleInstrumentVolatilityCalculated 7 : {} ",[instrumentState.name])
    instrumentState.present_total24HrVolatilityUSD = instrumentState.present_total24HrVolatilityETH.times(instrumentState.ETHPriceInUSD) 
    log.info("handleInstrumentVolatilityCalculated 8 : {} ",[instrumentState.name])
    instrumentState.present_total24HrSentimentVolatilityUSD = instrumentState.present_total24HrSentimentVolatilityETH.times(instrumentState.ETHPriceInUSD) 
    log.info("handleInstrumentVolatilityCalculated 9 : {} ",[instrumentState.name])

    currentSighDistributionSnapshot.save()
    instrumentState.save()
}



export function handleRefreshingSighSpeeds(event: refreshingSighSpeeds): void {
    log.info("handleRefreshingSighSpeeds",[])
    let instrumentId = event.params._Instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)

    // SIGH INSTRUMENT PARAMTERS : 
    let sighInstrument = SIGH_Instrument.load('0x4ebc60b9d2efa92b9eb681bf5b26aeb11de23bfd')
    if (event.block.number > BigInt.fromI32(22496079) ) {
        let sighDistributionHandlerAddress = Address.fromString('0x3FB401042D520c49E753cC449A032C56c87f36C6') 
        let sighDistributionHandlerContract = SIGHDistributionHandler.bind(sighDistributionHandlerAddress)
        let deltaBlockslast24HrSession = sighDistributionHandlerContract.getDeltaBlockslast24HrSession()
        log.info("handleRefreshingSighSpeeds - 1 : {} ",[instrumentState.name])

        if (deltaBlockslast24HrSession > BigInt.fromI32(0) ) {
            let totalLendingProtocolVolatilityETH = sighDistributionHandlerContract.getLast24HrsTotalProtocolVolatility()
            sighInstrument.totalLendingProtocolVolatilityPerBlockETH = totalLendingProtocolVolatilityETH.div(deltaBlockslast24HrSession).divDecimal( BigInt.fromI32(10).pow(18 as u8).toBigDecimal() ) 
            sighInstrument.totalLendingProtocolVolatilityPerBlockUSD = sighInstrument.totalLendingProtocolVolatilityPerBlockETH.times(instrumentState.ETHPriceInUSD)
            log.info("handleRefreshingSighSpeeds - 2 : {} ",[instrumentState.name])
        
            if ( sighInstrument.blockNumberWhenSighVolatilityHarvestSpeedWasRefreshed < event.block.number   ) {
                sighInstrument.blockNumberWhenSighVolatilityHarvestSpeedWasRefreshed = event.block.number
        
                let limitLendingProtocolVolatilityETH = sighDistributionHandlerContract.getLast24HrsTotalProtocolVolatilityLimit()
                let sighSpeedUsed = sighDistributionHandlerContract.getSIGHSpeedUsed()
        
                log.info("handleRefreshingSighSpeeds - 3 : {} ",[instrumentState.name])
                sighInstrument.currentSighVolatilityHarvestSpeedWEI = sighSpeedUsed.toBigDecimal()
                sighInstrument.currentSighVolatilityHarvestSpeed =  sighInstrument.currentSighVolatilityHarvestSpeedWEI.div( BigInt.fromI32(10).pow(18 as u8).toBigDecimal() ) 
            
                sighInstrument.maxHarvestableProtocolVolatilityPerBlockETH = limitLendingProtocolVolatilityETH.divDecimal(deltaBlockslast24HrSession.toBigDecimal()) 
                sighInstrument.maxHarvestableProtocolVolatilityPerBlockETH = sighInstrument.maxHarvestableProtocolVolatilityPerBlockETH.div( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
                sighInstrument.percentBasedHarvestableProtocolVolatilityPerBlockETH = sighInstrument.maxHarvestableProtocolVolatilityPerBlockETH
                sighInstrument.maxHarvestSizePossibleETH = sighSpeedUsed.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) ).times(sighInstrument.priceETH)
                log.info("handleRefreshingSighSpeeds - 4 : {} ",[instrumentState.name])
        
                sighInstrument.maxHarvestableProtocolVolatilityPerBlockUSD = sighInstrument.maxHarvestableProtocolVolatilityPerBlockETH.times(instrumentState.ETHPriceInUSD)
                sighInstrument.percentBasedHarvestableProtocolVolatilityPerBlockUSD = sighInstrument.percentBasedHarvestableProtocolVolatilityPerBlockETH.times(instrumentState.ETHPriceInUSD)
                sighInstrument.maxHarvestSizePossibleUSD = sighInstrument.maxHarvestSizePossibleETH.times(instrumentState.ETHPriceInUSD)
            }
        }
    }
    log.info("handleRefreshingSighSpeeds - 5 : {} ",[instrumentState.name])
    sighInstrument.save()        

    let snapShotID = instrumentState.totalSIGHDistributionSnapshotsTaken.minus(BigInt.fromI32(1)).toString() + instrumentId 
    let currentSighDistributionSnapshot = SIGH_Distribution_SnapShot.load(snapShotID) 
    
    instrumentState.present_SIGH_Suppliers_Speed_WEI = event.params.supplierSpeed
    log.info("handleRefreshingSighSpeeds - 6 : {} ",[instrumentState.name])
    instrumentState.present_SIGH_Suppliers_Speed = instrumentState.present_SIGH_Suppliers_Speed_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
    instrumentState.present_SIGH_Borrowers_Speed_WEI = event.params.borrowerSpeed
    log.info("handleRefreshingSighSpeeds - 7 : {} ",[instrumentState.name])
    instrumentState.present_SIGH_Borrowers_Speed = instrumentState.present_SIGH_Borrowers_Speed_WEI.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
    instrumentState.present_percentTotalVolatility = event.params._percentTotalVolatility.toBigDecimal().div(BigDecimal.fromString('10000000'))
    instrumentState.present_percentTotalSentimentVolatility = event.params._percentTotalSentimentVolatility.toBigDecimal().div(BigDecimal.fromString('10000000'))
    log.info("handleRefreshingSighSpeeds - 8 : {} ",[instrumentState.name])
    log.info("present_percentTotalVolatility : {} : {}",[instrumentState.name,instrumentState.present_percentTotalVolatility.toString() ])
    log.info("present_percentTotalSentimentVolatility : {} : {} ",[instrumentState.name,instrumentState.present_percentTotalSentimentVolatility.toString() ])
    currentSighDistributionSnapshot.suppliers_Speed = instrumentState.present_SIGH_Suppliers_Speed
    currentSighDistributionSnapshot.borrowers_Speed = instrumentState.present_SIGH_Borrowers_Speed
    currentSighDistributionSnapshot.staking_Speed = instrumentState.present_SIGH_Staking_Speed
    currentSighDistributionSnapshot.totalVolatilityAsPercentOfTotalProtocolVolatility = instrumentState.present_percentTotalVolatility > BigDecimal.fromString('0') ? instrumentState.present_percentTotalVolatility : BigDecimal.fromString('0')  
    currentSighDistributionSnapshot.instrumentLimitVolatilityAsPercentOflimitProtocolVolatility = event.params._percentTotalSentimentVolatility.toBigDecimal().div(BigDecimal.fromString('10000000'))
    log.info("totalVolatilityAsPercentOfTotalProtocolVolatility : {} : {}",[instrumentState.name,currentSighDistributionSnapshot.totalVolatilityAsPercentOfTotalProtocolVolatility.toString() ])
    log.info("instrumentLimitVolatilityAsPercentOflimitProtocolVolatility : {} : {} ",[instrumentState.name,currentSighDistributionSnapshot.instrumentLimitVolatilityAsPercentOflimitProtocolVolatility.toString() ])

    if ( BigInt.fromI32(event.params.side).toString()  == '0' ) {
        instrumentState.present_SIGH_Side = 'In-Active'
        currentSighDistributionSnapshot.distribution_Side = 'In-Active'
        currentSighDistributionSnapshot.harvestSpeedPerBlock = currentSighDistributionSnapshot.staking_Speed
    }
    
    if ( BigInt.fromI32(event.params.side).toString()  == '1' ) {
        instrumentState.present_SIGH_Side = 'Suppliers'
        currentSighDistributionSnapshot.distribution_Side = 'Suppliers'
        currentSighDistributionSnapshot.harvestSpeedPerBlock = currentSighDistributionSnapshot.suppliers_Speed
    }

    if ( BigInt.fromI32(event.params.side).toString()  == '2' ) {
        instrumentState.present_SIGH_Side = 'Borrowers'
        currentSighDistributionSnapshot.distribution_Side = 'Borrowers'
        currentSighDistributionSnapshot.harvestSpeedPerBlock = currentSighDistributionSnapshot.borrowers_Speed
    }

    log.info("handleRefreshingSighSpeeds : {} : {} : {} ",[instrumentState.name.toString(),instrumentState.present_SIGH_Side.toString(), BigInt.fromI32(event.params.side).toString() ] )

    // GETTING INSTRUMENT & SIGH PRICE IN ETH
        let oracleAddress = instrumentState.oracle as Address
        let oracleContract = PriceOracleGetter.bind( oracleAddress)
        let InstrumentPriceETH = BigDecimal.fromString('1')
        if ( instrumentState.instrumentAddress as Address ==  Address.fromString('0x0000000000000000000000000000000000000000') ) {
            InstrumentPriceETH = BigDecimal.fromString('1')
        }
        else {
            InstrumentPriceETH = oracleContract.getAssetPrice( instrumentState.instrumentAddress as Address ).toBigDecimal()
            let InstrumentPriceETHDecimals = oracleContract.getAssetPriceDecimals( instrumentState.instrumentAddress as Address )
            InstrumentPriceETH = InstrumentPriceETH.div(  BigInt.fromI32(10).pow(InstrumentPriceETHDecimals as u8).toBigDecimal() )    
        }
        let SIGHPriceETH = BigDecimal.fromString('1')
        if (event.block.number > BigInt.fromI32(22482561) ) {
            // log.info('if (event.block.number > BigInt.fromI32(22482561) )',[])
            SIGHPriceETH = oracleContract.getAssetPrice(Address.fromString('0x4Ebc60b9d2efA92B9eB681BF5b26AEB11DE23BFd')).toBigDecimal()
            // log.info('if (event.block.number > BigInt.fromI32(22482561) ) ::: {}',[SIGHPriceETH.toString()])
            let SIGHPriceETHDecimals = oracleContract.getAssetPriceDecimals(Address.fromString('0x4Ebc60b9d2efA92B9eB681BF5b26AEB11DE23BFd'))
            SIGHPriceETH = SIGHPriceETH.div(  BigInt.fromI32(10).pow(SIGHPriceETHDecimals as u8).toBigDecimal() )    
        }

    log.info("handleRefreshingSighSpeeds - 10 : {} ",[instrumentState.name])
    currentSighDistributionSnapshot.harvestValuePerBlockETH = currentSighDistributionSnapshot.harvestSpeedPerBlock.times(SIGHPriceETH)
    currentSighDistributionSnapshot.harvestValuePerBlockUSD = currentSighDistributionSnapshot.harvestValuePerBlockETH.times(instrumentState.ETHPriceInUSD)

    log.info("handleRefreshingSighSpeeds - 11 : {} ",[instrumentState.name])
    currentSighDistributionSnapshot.harvestSpeedPerDay = currentSighDistributionSnapshot.harvestSpeedPerBlock.times(currentSighDistributionSnapshot.deltaBlocks24Hrs.toBigDecimal())
    currentSighDistributionSnapshot.harvestValuePerDayETH = currentSighDistributionSnapshot.harvestSpeedPerDay.times(SIGHPriceETH)
    currentSighDistributionSnapshot.harvestValuePerDayUSD = currentSighDistributionSnapshot.harvestValuePerDayETH.times(instrumentState.ETHPriceInUSD)

    log.info("handleRefreshingSighSpeeds - 12 : {} ",[instrumentState.name])
    currentSighDistributionSnapshot.harvestSpeedPerYear = currentSighDistributionSnapshot.harvestSpeedPerDay.times(BigInt.fromI32(365).toBigDecimal())
    currentSighDistributionSnapshot.harvestValuePerYearETH = currentSighDistributionSnapshot.harvestSpeedPerYear.times(SIGHPriceETH)
    currentSighDistributionSnapshot.harvestValuePerYearUSD = currentSighDistributionSnapshot.harvestValuePerYearETH.times(instrumentState.ETHPriceInUSD)

    // Calculating Harvest APY : In-Active
    if (currentSighDistributionSnapshot.distribution_Side == 'In-Active' ) {
        if ( instrumentState.availableLiquidityUSD > BigDecimal.fromString('1') || instrumentState.totalCompoundedBorrowsUSD > BigDecimal.fromString('1') ) {
            currentSighDistributionSnapshot.harvestAPY = currentSighDistributionSnapshot.harvestValuePerYearUSD.div( instrumentState.availableLiquidityUSD.plus(instrumentState.totalCompoundedBorrowsUSD) )
        }
        else {
            currentSighDistributionSnapshot.harvestAPY = BigDecimal.fromString('0')
        }
        currentSighDistributionSnapshot.suppliersHarvestAPY = currentSighDistributionSnapshot.harvestAPY
        currentSighDistributionSnapshot.borrowersHarvestAPY = currentSighDistributionSnapshot.harvestAPY    
    }
    // Calculating Harvest APY : Suppliers
    if (currentSighDistributionSnapshot.distribution_Side == 'Suppliers' ) {
        if ( instrumentState.totalCompoundedLiquidityUSD > BigDecimal.fromString('1')  ) {
            currentSighDistributionSnapshot.harvestAPY = currentSighDistributionSnapshot.harvestValuePerYearUSD.div( instrumentState.totalCompoundedLiquidityUSD )
        }
        else {
            currentSighDistributionSnapshot.harvestAPY = BigDecimal.fromString('0')
        }
        currentSighDistributionSnapshot.suppliersHarvestAPY = currentSighDistributionSnapshot.harvestAPY
        currentSighDistributionSnapshot.borrowersHarvestAPY = BigDecimal.fromString('0')
    }
    // Calculating Harvest APY : Borrowers
    if (currentSighDistributionSnapshot.distribution_Side == 'Borrowers' ) {
        if (  instrumentState.totalCompoundedBorrowsUSD > BigDecimal.fromString('1') ) {
            currentSighDistributionSnapshot.harvestAPY = currentSighDistributionSnapshot.harvestValuePerYearUSD.div( instrumentState.totalCompoundedBorrowsUSD )
        }
        else {
            currentSighDistributionSnapshot.harvestAPY = BigDecimal.fromString('0')
        }
        currentSighDistributionSnapshot.borrowersHarvestAPY  = currentSighDistributionSnapshot.harvestAPY
        currentSighDistributionSnapshot.suppliersHarvestAPY = BigDecimal.fromString('0')
    }
    log.info("handleRefreshingSighSpeeds - 13 : {} ",[instrumentState.name])

    // NOW UPDATING HARVEST ADJUSTED INSTRUMENT PRICES, AND AVERAGE HARVESTING METRICS
    instrumentState.instrumentActualPriceETH = InstrumentPriceETH

    // Calculating Harvest Adjusted Prices for Instrument in ETH : In-Active
    if (currentSighDistributionSnapshot.distribution_Side == 'In-Active') {
        instrumentState.instrumentHarvestAdjustedPriceSuppliersETH = InstrumentPriceETH.plus(currentSighDistributionSnapshot.harvestValuePerBlockETH)
        instrumentState.instrumentHarvestAdjustedPriceBorrowersETH = InstrumentPriceETH.plus(currentSighDistributionSnapshot.harvestValuePerBlockETH)
    }
    // Calculating Harvest Adjusted Prices for Instrument in ETH : Suppliers
    if (currentSighDistributionSnapshot.distribution_Side == 'Suppliers') {
        instrumentState.instrumentHarvestAdjustedPriceSuppliersETH = InstrumentPriceETH.plus(currentSighDistributionSnapshot.harvestValuePerBlockETH)
        instrumentState.instrumentHarvestAdjustedPriceBorrowersETH = InstrumentPriceETH
    }
    // Calculating Harvest Adjusted Prices for Instrument in ETH : Borrowers
    if (currentSighDistributionSnapshot.distribution_Side == 'Borrowers') {
        instrumentState.instrumentHarvestAdjustedPriceSuppliersETH = InstrumentPriceETH
        instrumentState.instrumentHarvestAdjustedPriceBorrowersETH = InstrumentPriceETH.plus(currentSighDistributionSnapshot.harvestValuePerBlockETH)
    }
    log.info("handleRefreshingSighSpeeds - 14 : {} ",[instrumentState.name])

    // Calculating Harvest Adjusted Prices for Instrument in USD
    instrumentState.instrumentActualPriceUSD = instrumentState.instrumentActualPriceETH.times(instrumentState.ETHPriceInUSD) 
    instrumentState.instrumentHarvestAdjustedPriceSuppliersUSD = instrumentState.instrumentHarvestAdjustedPriceSuppliersETH.times(instrumentState.ETHPriceInUSD)
    instrumentState.instrumentHarvestAdjustedPriceBorrowersUSD = instrumentState.instrumentHarvestAdjustedPriceBorrowersETH.times(instrumentState.ETHPriceInUSD)

    log.info("handleRefreshingSighSpeeds - 15 : {} ",[instrumentState.name])
    instrumentState.present_harvestSpeedPerBlock = currentSighDistributionSnapshot.harvestSpeedPerBlock
    instrumentState.present_harvestValuePerBlockUSD = currentSighDistributionSnapshot.harvestValuePerBlockUSD
    instrumentState.present_harvestSpeedPerDay = currentSighDistributionSnapshot.harvestSpeedPerDay
    instrumentState.present_harvestValuePerDayUSD = currentSighDistributionSnapshot.harvestValuePerDayUSD
    instrumentState.present_harvestSpeedPerYear = currentSighDistributionSnapshot.harvestSpeedPerYear
    instrumentState.present_harvestValuePerYearUSD = currentSighDistributionSnapshot.harvestValuePerYearUSD

    log.info("handleRefreshingSighSpeeds - 16 : {} ",[instrumentState.name])    
    instrumentState.present_harvestAPY = currentSighDistributionSnapshot.harvestAPY
    instrumentState.present_suppliersHarvestAPY = currentSighDistributionSnapshot.suppliersHarvestAPY
    instrumentState.present_borrowersHarvestAPY = currentSighDistributionSnapshot.borrowersHarvestAPY

    currentSighDistributionSnapshot.save()

    updateInstrumentHarvestAverages(instrumentId)
    instrumentState.save()
}



export function handleAccuredSIGHTransferredToTheUser(event: AccuredSIGHTransferredToTheUser): void {
    // let instrumentId = event.params.instrument.toHexString()
    // let instrumentState = Instrument.load(instrumentId)
    // instrumentState.save()
}



export function handleSIGHSpeedUpdated(event: SIGHSpeedUpdated): void {
    let sighInstrument = SIGH_Instrument.load('0x4ebc60b9d2efa92b9eb681bf5b26aeb11de23bfd')
    sighInstrument.maxSighVolatilityHarvestSpeedWEI =  event.params.newSIGHSpeed.toBigDecimal()
    sighInstrument.maxSighVolatilityHarvestSpeed =  sighInstrument.maxSighVolatilityHarvestSpeedWEI.div( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )

    sighInstrument.save()
}



export function handleCryptoMarketSentimentUpdated(event: CryptoMarketSentimentUpdated): void {
    let sighInstrument = SIGH_Instrument.load('0x4ebc60b9d2efa92b9eb681bf5b26aeb11de23bfd')
    sighInstrument.isUpperCheckForVolatilitySet = event.params.previsSpeedUpperCheckAllowed
    sighInstrument.cryptoMarketSentiment =  event.params.cryptoMarketSentiment.divDecimal( (BigInt.fromI32(10).pow(16 as u8).toBigDecimal()) )
    sighInstrument.save()
}


// WORKS AS EXPECTED
export function handleMinimumBlocksForSpeedRefreshUpdated(event: minimumBlocksForSpeedRefreshUpdated): void {
    let sighInstrument = SIGH_Instrument.load('0x4ebc60b9d2efa92b9eb681bf5b26aeb11de23bfd')
    sighInstrument.minimumBlocksBeforeSpeedRefresh = event.params.newDeltaBlocksForSpeed
    sighInstrument.save()
}



export function handleMaxSIGHSpeedCalculated(event: MaxSIGHSpeedCalculated): void {
    let sighInstrument = SIGH_Instrument.load('0x4ebc60b9d2efa92b9eb681bf5b26aeb11de23bfd')

    sighInstrument.blockNumberWhenSighVolatilityHarvestSpeedWasRefreshed = event.block.number

    sighInstrument.currentSighVolatilityHarvestSpeedWEI = event.params._SIGHSpeedUsed.toBigDecimal()
    sighInstrument.currentSighVolatilityHarvestSpeed =  sighInstrument.currentSighVolatilityHarvestSpeedWEI.div( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )

    sighInstrument.maxHarvestableProtocolVolatilityPerBlockETH = event.params._totalVolatilityLimitPerBlock.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
    sighInstrument.percentBasedHarvestableProtocolVolatilityPerBlockETH = event.params._totalVolatilityLimitPerBlock.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )
    sighInstrument.maxHarvestSizePossibleETH = event.params._max_SIGHDistributionLimitDecimalsAdjusted.divDecimal( (BigInt.fromI32(10).pow(18 as u8).toBigDecimal()) )

    // GETTING ETH PRICE IN USD
    let oracleAddress = Address.fromString('0x9803DB21B6b535923D3c69Cc1b000d4bd45CCb12',) 
    let oracleContract = PriceOracleGetter.bind( oracleAddress)
    let ETH_PriceInUSD = oracleContract.getAssetPrice(Address.fromString('0x9803DB21B6b535923D3c69Cc1b000d4bd45CCb12')).toBigDecimal()
    let ETH_PriceInUSDDecimals = oracleContract.getAssetPriceDecimals(Address.fromString('0x9803DB21B6b535923D3c69Cc1b000d4bd45CCb12'))
    let ETHPriceInUSD = ETH_PriceInUSD.div(  BigInt.fromI32(10).pow(ETH_PriceInUSDDecimals as u8).toBigDecimal() )

    sighInstrument.maxHarvestableProtocolVolatilityPerBlockUSD = sighInstrument.maxHarvestableProtocolVolatilityPerBlockETH.times(ETHPriceInUSD)
    sighInstrument.percentBasedHarvestableProtocolVolatilityPerBlockUSD = sighInstrument.percentBasedHarvestableProtocolVolatilityPerBlockETH.times(ETHPriceInUSD)
    sighInstrument.maxHarvestSizePossibleUSD = sighInstrument.maxHarvestSizePossibleETH.times(ETHPriceInUSD)

    sighInstrument.save()
}




// ##################################################################
// ###########   UPDATING HARVEST METRICS FOR INSTRUMENT   ##########
// ##################################################################

function updateInstrumentHarvestAverages(ID: string): void {
    let instrumentState = Instrument.load(ID)
    log.info("handleRefreshingSighSpeeds:updateInstrumentHarvestAverages - 1 : {} ",[instrumentState.name])    

    if (instrumentState.totalSIGHDistributionSnapshotsTaken == BigInt.fromI32(1) ) {
        // DAILY AVERAGES
        instrumentState.average24SnapsHarvestSpeedPerBlock = instrumentState.present_harvestSpeedPerBlock
        instrumentState.average24SnapsHarvestValuePerBlockUSD =  instrumentState.present_harvestValuePerBlockUSD

        instrumentState.average24SnapsHarvestSpeedPerDay =  instrumentState.present_harvestSpeedPerDay
        instrumentState.average24SnapsHarvestValuePerDayUSD =  instrumentState.present_harvestValuePerDayUSD

        instrumentState.average24SnapsHarvestSpeedPerYear =  instrumentState.present_harvestSpeedPerYear
        instrumentState.average24SnapsHarvestValuePerYearUSD =  instrumentState.present_harvestValuePerYearUSD

        instrumentState.average24SnapsHarvestAPY = instrumentState.present_harvestAPY
        instrumentState.average24SnapsSuppliersHarvestAPY =  instrumentState.present_suppliersHarvestAPY
        instrumentState.average24SnapsBorrowersHarvestAPY =  instrumentState.present_borrowersHarvestAPY

        // MONTHLY AVERAGES
        instrumentState.averageMonthlySnapsHarvestSpeedPerBlock = instrumentState.present_harvestSpeedPerBlock
        instrumentState.averageMonthlySnapsHarvestValuePerBlockUSD =  instrumentState.present_harvestValuePerBlockUSD

        instrumentState.averageMonthlySnapsHarvestSpeedPerDay =  instrumentState.present_harvestSpeedPerDay
        instrumentState.averageMonthlySnapsHarvestValuePerDayUSD =  instrumentState.present_harvestValuePerDayUSD

        instrumentState.averageMonthlySnapsHarvestSpeedPerYear =  instrumentState.present_harvestSpeedPerYear
        instrumentState.averageMonthlySnapsHarvestValuePerYearUSD =  instrumentState.present_harvestValuePerYearUSD

        instrumentState.averageMonthlySnapsHarvestAPY =  instrumentState.present_harvestAPY
        instrumentState.averageMonthlySnapsSuppliersHarvestAPY =  instrumentState.present_suppliersHarvestAPY
        instrumentState.averageMonthlySnapsBorrowersHarvestAPY =  instrumentState.present_borrowersHarvestAPY

    }
    else {
        log.info("handleRefreshingSighSpeeds:updateInstrumentHarvestAverages - 2 : {} ",[instrumentState.name])    
        // DAILY AVERAGES
        log.info("DAILY AVERAGES : {} : {}",[instrumentState.name,instrumentState.present_harvestSpeedPerBlock.toString()])
        instrumentState.average24SnapsHarvestSpeedPerBlock = instrumentState.average24SnapsHarvestSpeedPerBlock.times(BigInt.fromI32(23).toBigDecimal()).plus(instrumentState.present_harvestSpeedPerBlock).div(BigInt.fromI32(24).toBigDecimal())
        instrumentState.average24SnapsHarvestValuePerBlockUSD = instrumentState.average24SnapsHarvestValuePerBlockUSD.times(BigInt.fromI32(23).toBigDecimal()).plus(instrumentState.present_harvestValuePerBlockUSD).div(BigInt.fromI32(24).toBigDecimal())

        log.info("handleRefreshingSighSpeeds:updateInstrumentHarvestAverages - 3 : {} ",[instrumentState.name])    
        instrumentState.average24SnapsHarvestSpeedPerDay = instrumentState.average24SnapsHarvestSpeedPerDay.times(BigInt.fromI32(23).toBigDecimal()).plus(instrumentState.present_harvestSpeedPerDay).div(BigInt.fromI32(24).toBigDecimal())
        instrumentState.average24SnapsHarvestValuePerDayUSD = instrumentState.average24SnapsHarvestValuePerDayUSD.times(BigInt.fromI32(23).toBigDecimal()).plus(instrumentState.present_harvestValuePerDayUSD).div(BigInt.fromI32(24).toBigDecimal())

        log.info("handleRefreshingSighSpeeds:updateInstrumentHarvestAverages - 4 : {} ",[instrumentState.name])    
        instrumentState.average24SnapsHarvestSpeedPerYear = instrumentState.average24SnapsHarvestSpeedPerYear.times(BigInt.fromI32(23).toBigDecimal()).plus(instrumentState.present_harvestSpeedPerYear).div(BigInt.fromI32(24).toBigDecimal())
        instrumentState.average24SnapsHarvestValuePerYearUSD = instrumentState.average24SnapsHarvestValuePerYearUSD.times(BigInt.fromI32(23).toBigDecimal()).plus(instrumentState.present_harvestValuePerYearUSD).div(BigInt.fromI32(24).toBigDecimal())

        log.info("handleRefreshingSighSpeeds:updateInstrumentHarvestAverages - 5 : {} ",[instrumentState.name])    
        instrumentState.average24SnapsHarvestAPY = instrumentState.average24SnapsHarvestAPY.times(BigInt.fromI32(23).toBigDecimal()).plus(instrumentState.present_harvestAPY).div(BigInt.fromI32(24).toBigDecimal())
        instrumentState.average24SnapsSuppliersHarvestAPY = instrumentState.average24SnapsSuppliersHarvestAPY.times(BigInt.fromI32(23).toBigDecimal()).plus(instrumentState.present_suppliersHarvestAPY).div(BigInt.fromI32(24).toBigDecimal())
        instrumentState.average24SnapsBorrowersHarvestAPY = instrumentState.average24SnapsBorrowersHarvestAPY.times(BigInt.fromI32(23).toBigDecimal()).plus(instrumentState.present_borrowersHarvestAPY).div(BigInt.fromI32(24).toBigDecimal())

        // MONTHLY AVERAGES
        log.info("handleRefreshingSighSpeeds:updateInstrumentHarvestAverages - 6 : {} ",[instrumentState.name])    
        instrumentState.averageMonthlySnapsHarvestSpeedPerBlock = instrumentState.averageMonthlySnapsHarvestSpeedPerBlock.times(BigInt.fromI32(743).toBigDecimal()).plus(instrumentState.present_harvestSpeedPerBlock).div(BigInt.fromI32(744).toBigDecimal())
        instrumentState.averageMonthlySnapsHarvestValuePerBlockUSD = instrumentState.averageMonthlySnapsHarvestValuePerBlockUSD.times(BigInt.fromI32(743).toBigDecimal()).plus(instrumentState.present_harvestValuePerBlockUSD).div(BigInt.fromI32(744).toBigDecimal())

        log.info("handleRefreshingSighSpeeds:updateInstrumentHarvestAverages - 7 : {} ",[instrumentState.name])    
        instrumentState.averageMonthlySnapsHarvestSpeedPerDay = instrumentState.averageMonthlySnapsHarvestSpeedPerDay.times(BigInt.fromI32(743).toBigDecimal()).plus(instrumentState.present_harvestSpeedPerDay).div(BigInt.fromI32(744).toBigDecimal())
        instrumentState.averageMonthlySnapsHarvestValuePerDayUSD = instrumentState.averageMonthlySnapsHarvestValuePerDayUSD.times(BigInt.fromI32(743).toBigDecimal()).plus(instrumentState.present_harvestValuePerDayUSD).div(BigInt.fromI32(744).toBigDecimal())

        log.info("handleRefreshingSighSpeeds:updateInstrumentHarvestAverages - 8 : {} ",[instrumentState.name])    
        instrumentState.averageMonthlySnapsHarvestSpeedPerYear = instrumentState.averageMonthlySnapsHarvestSpeedPerYear.times(BigInt.fromI32(743).toBigDecimal()).plus(instrumentState.present_harvestSpeedPerYear).div(BigInt.fromI32(744).toBigDecimal())
        instrumentState.averageMonthlySnapsHarvestValuePerYearUSD = instrumentState.averageMonthlySnapsHarvestValuePerYearUSD.times(BigInt.fromI32(743).toBigDecimal()).plus(instrumentState.present_harvestValuePerYearUSD).div(BigInt.fromI32(744).toBigDecimal())

        log.info("handleRefreshingSighSpeeds:updateInstrumentHarvestAverages - 9 : {} ",[instrumentState.name])    
        instrumentState.averageMonthlySnapsHarvestAPY = instrumentState.averageMonthlySnapsHarvestAPY.times(BigInt.fromI32(743).toBigDecimal()).plus(instrumentState.present_harvestAPY).div(BigInt.fromI32(744).toBigDecimal())
        instrumentState.averageMonthlySnapsSuppliersHarvestAPY = instrumentState.averageMonthlySnapsSuppliersHarvestAPY.times(BigInt.fromI32(743).toBigDecimal()).plus(instrumentState.present_suppliersHarvestAPY).div(BigInt.fromI32(744).toBigDecimal())
        instrumentState.averageMonthlySnapsBorrowersHarvestAPY = instrumentState.averageMonthlySnapsBorrowersHarvestAPY.times(BigInt.fromI32(743).toBigDecimal()).plus(instrumentState.present_borrowersHarvestAPY).div(BigInt.fromI32(744).toBigDecimal())
    }
    instrumentState.save()
}




// ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

function create_SIGH_Distribution_SnapShot(ID: string): SIGH_Distribution_SnapShot {
    let sighDistributionSnapshotInitiailized = new SIGH_Distribution_SnapShot(ID)

    sighDistributionSnapshotInitiailized.instrumentAddress = '0x0000000000000000000000000000000000000000'
    sighDistributionSnapshotInitiailized.fromBlockNumber = new BigInt(0)
    sighDistributionSnapshotInitiailized.toBlockNumber = new BigInt(0)
    sighDistributionSnapshotInitiailized.deltaBlocks24Hrs = new BigInt(0)
    sighDistributionSnapshotInitiailized.clock = new BigInt(0)

    sighDistributionSnapshotInitiailized.prevPrice_ETH = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.prevPrice_USD = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.openingPrice_ETH = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.openingPrice_USD = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.priceDifferenceETH = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.priceDifferenceUSD = BigDecimal.fromString('0')

    sighDistributionSnapshotInitiailized.bearSentimentPercent = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.bullSentimentPercent = BigDecimal.fromString('0')

    sighDistributionSnapshotInitiailized.total24HrVolatilityETH = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.total24HrVolatilityUSD = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.totalVolatilityAsPercentOfTotalProtocolVolatility = BigDecimal.fromString('0')

    sighDistributionSnapshotInitiailized.totaltotal24HrSentimentVolatilityETH = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.totaltotal24HrSentimentVolatilityUSD = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.instrumentLimitVolatilityAsPercentOflimitProtocolVolatility = BigDecimal.fromString('0')


    sighDistributionSnapshotInitiailized.distribution_Side = null

    sighDistributionSnapshotInitiailized.suppliers_Speed = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.borrowers_Speed = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.staking_Speed = BigDecimal.fromString('0')

    sighDistributionSnapshotInitiailized.harvestSpeedPerBlock = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.harvestValuePerBlockETH = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.harvestValuePerBlockUSD = BigDecimal.fromString('0')

    sighDistributionSnapshotInitiailized.harvestSpeedPerDay = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.harvestValuePerDayETH = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.harvestValuePerDayUSD = BigDecimal.fromString('0')

    sighDistributionSnapshotInitiailized.harvestSpeedPerYear = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.harvestValuePerYearETH = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.harvestValuePerYearUSD = BigDecimal.fromString('0')

    sighDistributionSnapshotInitiailized.harvestAPY = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.suppliersHarvestAPY = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.borrowersHarvestAPY = BigDecimal.fromString('0')

    sighDistributionSnapshotInitiailized.totalBorrowingSIGHAccuredBeforeThisSnapshot = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.BorrowingSIGHAccuredDuringThisSnapshot = BigDecimal.fromString('0')

    sighDistributionSnapshotInitiailized.totalLiquiditySIGHAccuredBeforeThisSnapshot = BigDecimal.fromString('0')
    sighDistributionSnapshotInitiailized.LiquiditySIGHAccuredDuringThisSnapshot = BigDecimal.fromString('0')

    sighDistributionSnapshotInitiailized.save()
    return sighDistributionSnapshotInitiailized as SIGH_Distribution_SnapShot
}