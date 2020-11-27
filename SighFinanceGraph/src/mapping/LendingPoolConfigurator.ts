import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentInitialized,InstrumentRemoved, BorrowingEnabledOnInstrument, BorrowingDisabledOnInstrument
    ,InstrumentEnabledAsCollateral, InstrumentDisabledAsCollateral, StableRateOnInstrumentSwitched,
     InstrumentActivated, InstrumentDeactivated, InstrumentFreezeSwitched,
    InstrumentLiquidationThresholdChanged, InstrumentLiquidationBonusChanged, InstrumentInterestRateStrategyChanged,
    InstrumentBaseLtvChanged} from "../../generated/Lending_Pool_Configurator/LendingPoolConfigurator"
import { Instrument } from "../../generated/schema"
import { ERC20Detailed } from '../../generated/Lending_Pool_Configurator/ERC20Detailed'
import { PriceOracleGetter } from '../../generated/Lending_Pool_Configurator/PriceOracleGetter'



export function handleInstrumentInitialized(event: InstrumentInitialized): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.instrumentAddress = event.params._instrument
    instrumentState.iTokenAddress = event.params._iToken
    instrumentState.interestRateStrategyAddress = event.params._interestRateStrategyAddress
    instrumentState.isActive = true
    instrumentState.isFreezed = false

    let underlyingInstrumentContract = ERC20Detailed.bind(Address.fromString(event.params._instrument.toHexString()))
    instrumentState.underlyingInstrumentName = underlyingInstrumentContract.name()
    instrumentState.underlyingInstrumentSymbol =  underlyingInstrumentContract.symbol()
    instrumentState.decimals = BigInt.fromI32(underlyingInstrumentContract.decimals())

    let iTokenContract = ERC20Detailed.bind(Address.fromString(event.params._iToken.toHexString()))
    instrumentState.name = iTokenContract.name()
    instrumentState.symbol =  iTokenContract.symbol()

    instrumentState.supplyIndex = BigInt.fromI32(10).pow(new BigInt(27) as u8)                  // RAY = 1e27 (initialized in CoreLibrary's init() )
    instrumentState.variableBorrowIndex = BigInt.fromI32(10).pow(new BigInt(27)  as u8)         // RAY = 1e27 (initialized in CoreLibrary's init() )

    // $SIGH PARAMETERS
    instrumentState.isSIGHMechanismActivated = false;

    instrumentState.SIGH_Supply_Index = BigInt.fromI32(10).pow(new BigInt(36) as u8)  
    instrumentState.SIGH_Supply_Index_lastUpdatedBlock = event.block.number;

    instrumentState.SIGH_Borrow_Index = BigInt.fromI32(10).pow(new BigInt(36) as u8)  
    instrumentState.SIGH_Borrow_Index_lastUpdatedBlock = event.block.number;

    instrumentState.present_24HrWindow_InstrumentOpeningPriceETH = BigDecimal.fromString('0')
    instrumentState.present_24HrWindow_InstrumentOpeningPriceUSD = BigDecimal.fromString('0')
    instrumentState.present_24HrWindow_InstrumentClosingPriceETH = BigDecimal.fromString('0')
    instrumentState.present_24HrWindow_InstrumentClosingPriceUSD = BigDecimal.fromString('0')

    instrumentState.present_24HrWindow_DeltaBlocks = new BigInt(0)
    instrumentState.present_24HrVolatility_ETH = BigDecimal.fromString('0')
    instrumentState.present_24HrVolatility_USD = BigDecimal.fromString('0')
    instrumentState.present_percentTotalVolatility =  BigDecimal.fromString('0')
    instrumentState.present_TotalVolatility_ETH =  BigDecimal.fromString('0')
    instrumentState.present_TotalVolatility_USD =  BigDecimal.fromString('0')

    instrumentState.present_SIGH_Distribution_Side = 'inactive'

    instrumentState.present_24HrWindow_SIGH_OpeningPrice_ETH =  BigDecimal.fromString('0')
    instrumentState.present_24HrWindow_SIGH_OpeningPrice_USD =  BigDecimal.fromString('0')

    instrumentState.present_SIGH_Suppliers_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Suppliers_Speed =  BigDecimal.fromString('0')
    instrumentState.present_SIGH_Borrowers_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Borrowers_Speed =  BigDecimal.fromString('0')
    instrumentState.present_SIGH_Staking_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Staking_Speed =   BigDecimal.fromString('0')


    instrumentState.present_SIGH_DistributionValuePerBlock_ETH = BigDecimal.fromString('0')
    instrumentState.present_SIGH_DistributionValuePerBlock_USD = BigDecimal.fromString('0')

    instrumentState.present_VolatilityAddressedPerBlock = BigDecimal.fromString('0')

    instrumentState.save()
}

export function handleBorrowingEnabledOnInstrument(event: BorrowingEnabledOnInstrument): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.borrowingEnabled = true;

    instrumentState.save();
}

export function handleBorrowingDisabledOnInstrument(event: BorrowingDisabledOnInstrument): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.borrowingEnabled = false;

    instrumentState.save();
}

export function handleInstrumentEnabledAsCollateral(event: InstrumentEnabledAsCollateral): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.usageAsCollateralEnabled = true;
    instrumentState.baseLTVasCollateral = event.params._ltv ;
    instrumentState.liquidationThreshold = event.params._liquidationThreshold ;
    instrumentState.liquidationBonus = event.params._liquidationBonus ;

    instrumentState.save();
}

export function handleInstrumentDisabledAsCollateral(event: InstrumentDisabledAsCollateral): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.usageAsCollateralEnabled = false;
    instrumentState.save();
}


export function handleStableRateOnInstrumentSwitched(event: StableRateOnInstrumentSwitched): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.isStableBorrowRateEnabled = event.params.isEnabled ;
    instrumentState.save();
}




export function handleInstrumentActivated(event: InstrumentActivated): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.isActive = true ;
    instrumentState.save();
}


export function handleInstrumentDeactivated(event: InstrumentDeactivated): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.isActive = false ;
    instrumentState.save();
}

export function handleInstrumentFreezeSwitched(event: InstrumentFreezeSwitched): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.isFreezed = event.params.isFreezed ;
    instrumentState.save();
}

export function handleInstrumentLiquidationThresholdChanged(event: InstrumentLiquidationThresholdChanged): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.liquidationThreshold = event.params._threshold ;
    instrumentState.save();
}


export function handleInstrumentLiquidationBonusChanged(event: InstrumentLiquidationBonusChanged): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.liquidationBonus = event.params._bonus ;
    instrumentState.save();
}


export function handleInstrumentInterestRateStrategyChanged(event: InstrumentInterestRateStrategyChanged): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.interestRateStrategyAddress = event.params._strategy ;
    instrumentState.save();
}


export function handleInstrumentBaseLtvChanged(event: InstrumentBaseLtvChanged): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }
    instrumentState.baseLTVasCollateral = event.params._ltv ;
    instrumentState.save();
}



export function handleInstrumentRemoved(event: InstrumentRemoved): void {
    let instrumentId = event.params._instrument.toHexString()
    let instrumentState = Instrument.load(instrumentId)
    if (instrumentState == null) {
        instrumentState = createInstrument(instrumentId)
    }

    instrumentState.isActive = false;
    instrumentState.borrowingEnabled = false;
    instrumentState.usageAsCollateralEnabled = false;
    instrumentState.interestRateStrategyAddress = Address.fromString('0x0000000000000000000000000000000000000000',)
    instrumentState.iTokenAddress = Address.fromString('0x0000000000000000000000000000000000000000',)
    instrumentState.supplyIndex = new BigInt(0)
    instrumentState.variableBorrowIndex = new BigInt(0)
    instrumentState.baseLTVasCollateral = new BigInt(0)
    instrumentState.liquidationThreshold = new BigInt(0)
    instrumentState.liquidationBonus = new BigInt(0)

    instrumentState.isSIGHMechanismActivated = false
    instrumentState.SIGH_Supply_Index =  new BigInt(0)
    instrumentState.SIGH_Borrow_Index =  new BigInt(0)

    instrumentState.present_SIGH_Distribution_Side = 'inactive'
    instrumentState.present_SIGH_Suppliers_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Suppliers_Speed =  BigDecimal.fromString('0')
    instrumentState.present_SIGH_Borrowers_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Borrowers_Speed =   BigDecimal.fromString('0')
    instrumentState.present_SIGH_Staking_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Staking_Speed =   BigDecimal.fromString('0')
    instrumentState.present_SIGH_DistributionValuePerBlock_ETH =   BigDecimal.fromString('0')
    instrumentState.present_SIGH_DistributionValuePerBlock_USD =   BigDecimal.fromString('0')
    instrumentState.present_VolatilityAddressedPerBlock =   BigDecimal.fromString('0')
    
    instrumentState.save()
}
















// ############################################
// ###########   CREATING ENTITIES   ##########
// ############################################ 

export function createInstrument(addressID: string): Instrument {
    let instrument_state_initialized = new Instrument(addressID)

    instrument_state_initialized.oracle = Address.fromString('0x0000000000000000000000000000000000000000',) 
    instrument_state_initialized.borrowingEnabled = false
    instrument_state_initialized.usageAsCollateralEnabled = false
    instrument_state_initialized.isStableBorrowRateEnabled = false
    instrument_state_initialized.isSIGHMechanismActivated = false

    instrument_state_initialized.baseLTVasCollateral = new BigInt(0)
    instrument_state_initialized.liquidationThreshold = new BigInt(0)
    instrument_state_initialized.liquidationBonus = new BigInt(0)

    let oracleContract = PriceOracleGetter.bind( Address.fromString('0x0000000000000000000000000000000000000000') )
    instrument_state_initialized.priceETH_WEI = oracleContract.getAssetPrice(Address.fromString(addressID))
    instrument_state_initialized.priceETHDecimals = BigInt.fromI32( oracleContract.getAssetPriceDecimals(Address.fromString(addressID)) )

    instrument_state_initialized.borrowFeeDue_WEI = new BigInt(0)
    instrument_state_initialized.borrowFeeDue = BigDecimal.fromString('0')

    instrument_state_initialized.borrowFeeEarned_WEI = new BigInt(0)
    instrument_state_initialized.borrowFeeEarned = BigDecimal.fromString('0')

    instrument_state_initialized.totalLiquidity_WEI = new BigInt(0)
    instrument_state_initialized.totalLiquidity = BigDecimal.fromString('0')

    instrument_state_initialized.availableLiquidity_WEI = new BigInt(0)
    instrument_state_initialized.availableLiquidity = BigDecimal.fromString('0')

    instrument_state_initialized.totalPrincipalBorrows_WEI = new BigInt(0)
    instrument_state_initialized.totalPrincipalBorrows = BigDecimal.fromString('0')

    instrument_state_initialized.totalPrincipalStableBorrows_WEI = new BigInt(0)
    instrument_state_initialized.totalPrincipalStableBorrows = BigDecimal.fromString('0')

    instrument_state_initialized.totalPrincipalVariableBorrows_WEI = new BigInt(0)
    instrument_state_initialized.totalPrincipalVariableBorrows = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedEarnings_WEI = new BigInt(0)
    instrument_state_initialized.totalCompoundedEarnings = BigDecimal.fromString('0')

    instrument_state_initialized.stableBorrowInterestRate = new BigInt(0)
    instrument_state_initialized.stableBorrowInterestPercent = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedEarningsSTABLEInterest_WEI = new BigInt(0)
    instrument_state_initialized.totalCompoundedEarningsSTABLEInterest = BigDecimal.fromString('0')

    instrument_state_initialized.variableBorrowInterestRate = new BigInt(0)
    instrument_state_initialized.variableBorrowInterestPercent = BigDecimal.fromString('0')

    instrument_state_initialized.totalCompoundedEarningsVARIABLEInterest_WEI = new BigInt(0)
    instrument_state_initialized.totalCompoundedEarningsVARIABLEInterest = BigDecimal.fromString('0')

    instrument_state_initialized.variableBorrowIndex = new BigInt(0)
    instrument_state_initialized.supplyIndex = new BigInt(0)

    instrument_state_initialized.supplyInterestRate = new BigInt(0)
    instrument_state_initialized.supplyInterestRatePercent = BigDecimal.fromString('0')

    instrument_state_initialized.totalSupplierEarnings_WEI = new BigInt(0)
    instrument_state_initialized.totalSupplierEarnings = BigDecimal.fromString('0')

    instrument_state_initialized.lifeTimeDeposits_WEI = new BigInt(0)
    instrument_state_initialized.lifeTimeDeposits = BigDecimal.fromString('0')

    instrument_state_initialized.lifeTimeBorrows_WEI = new BigInt(0)
    instrument_state_initialized.lifeTimeBorrows = BigDecimal.fromString('0')


    instrument_state_initialized.save()
    return instrument_state_initialized as Instrument
  }