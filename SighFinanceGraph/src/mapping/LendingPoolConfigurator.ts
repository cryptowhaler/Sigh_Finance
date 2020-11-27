import { Address, BigInt,BigDecimal, log } from "@graphprotocol/graph-ts"
import { InstrumentInitialized,InstrumentRemoved, BorrowingEnabledOnInstrument, BorrowingDisabledOnInstrument
    ,InstrumentEnabledAsCollateral, InstrumentDisabledAsCollateral, StableRateOnInstrumentSwitched,
     InstrumentActivated, InstrumentDeactivated, InstrumentFreezeSwitched,
    InstrumentLiquidationThresholdChanged, InstrumentLiquidationBonusChanged, InstrumentInterestRateStrategyChanged,
    InstrumentBaseLtvChanged} from "../../generated/LendingPoolConfigurator/LendingPoolConfigurator"
import { Instrument } from "../../generated/schema"
import { ERC20Detailed } from '../../abis/ERC20Detailed'
import { PriceOracleGetter } from '../../abis/PriceOracleGetter'



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
    instrumentState.decimals = underlyingInstrumentContract.decimals()

    let iTokenContract = ERC20Detailed.bind(Address.fromString(event.params._iToken.toHexString()))
    instrumentState.name = iTokenContract.name()
    instrumentState.symbol =  iTokenContract.symbol()

    instrumentState.supplyIndex = 1e27                  // RAY = 1e27 (initialized in CoreLibrary's init() )
    instrumentState.variableBorrowIndex = 1e27          // RAY = 1e27 (initialized in CoreLibrary's init() )

    // $SIGH PARAMETERS
    instrumentState.isSIGHMechanismActivated = false;

    instrumentState.SIGH_Supply_Index = 1e36;
    instrumentState.SIGH_Supply_Index_lastUpdatedBlock = event.block.number;

    instrumentState.SIGH_Borrow_Index = 1e36;
    instrumentState.SIGH_Borrow_Index_lastUpdatedBlock = event.block.number;

    instrumentState.present_24HrWindow_InstrumentOpeningPriceETH = new BigDecimal(0)
    instrumentState.present_24HrWindow_InstrumentOpeningPriceUSD = new BigDecimal(0)
    instrumentState.present_24HrWindow_InstrumentClosingPriceETH = new BigDecimal(0)
    instrumentState.present_24HrWindow_InstrumentClosingPriceUSD = new BigDecimal(0)

    instrumentState.present_24HrWindow_DeltaBlocks = new BigInt(0)
    instrumentState.present_24HrVolatility_ETH = new BigDecimal(0)
    instrumentState.present_24HrVolatility_USD = new BigDecimal(0)
    instrumentState.present_percentTotalVolatility =  new BigDecimal(0)
    instrumentState.present_TotalVolatility_ETH =  new BigDecimal(0)
    instrumentState.present_TotalVolatility_USD =  new BigDecimal(0)

    instrumentState.present_SIGH_Distribution_Side = 'inactive'

    instrumentState.present_24HrWindow_SIGH_OpeningPrice_ETH =  new BigDecimal(0)
    instrumentState.present_24HrWindow_SIGH_OpeningPrice_USD =  new BigDecimal(0)

    instrumentState.present_SIGH_Suppliers_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Suppliers_Speed =  new BigDecimal(0)
    instrumentState.present_SIGH_Borrowers_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Borrowers_Speed =  new BigDecimal(0)
    instrumentState.present_SIGH_Staking_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Staking_Speed =   new BigDecimal(0)


    instrumentState.present_SIGH_DistributionValuePerBlock_ETH = new BigDecimal(0)
    instrumentState.present_SIGH_DistributionValuePerBlock_USD = new BigDecimal(0)

    instrumentState.present_VolatilityAddressedPerBlock = new BigDecimal(0)

    instrumentState.timeStamp = event.params._timestamp
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
    instrumentState.isFreezed = event.params.switch_ ;
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
    instrumentState.present_SIGH_Suppliers_Speed =  new BigDecimal(0)
    instrumentState.present_SIGH_Borrowers_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Borrowers_Speed =   new BigDecimal(0)
    instrumentState.present_SIGH_Staking_Speed_WEI =  new BigInt(0)
    instrumentState.present_SIGH_Staking_Speed =   new BigDecimal(0)
    instrumentState.present_SIGH_DistributionValuePerBlock_ETH =   new BigDecimal(0)
    instrumentState.present_SIGH_DistributionValuePerBlock_USD =   new BigDecimal(0)
    instrumentState.present_VolatilityAddressedPerBlock =   new BigDecimal(0)
    
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
    instrument_state_initialized.priceETH_WEI = oracleContract.getAssetPrice(Address.fromHexString(addressID))
    instrument_state_initialized.priceETHDecimals = oracleContract.getAssetPriceDecimals(Address.fromHexString(addressID))

    instrument_state_initialized.borrowFeeDue_WEI = new BigInt(0)
    instrument_state_initialized.borrowFeeDue = new BigDecimal(0)

    instrument_state_initialized.borrowFeeEarned_WEI = new BigInt(0)
    instrument_state_initialized.borrowFeeEarned = new BigDecimal(0)

    instrument_state_initialized.totalLiquidity_WEI = new BigInt(0)
    instrument_state_initialized.totalLiquidity = new BigDecimal(0)

    instrument_state_initialized.availableLiquidity_WEI = new BigInt(0)
    instrument_state_initialized.availableLiquidity = new BigDecimal(0)

    instrument_state_initialized.totalPrincipalBorrows_WEI = new BigInt(0)
    instrument_state_initialized.totalPrincipalBorrows = new BigDecimal(0)

    instrument_state_initialized.totalPrincipalStableBorrows_WEI = new BigInt(0)
    instrument_state_initialized.totalPrincipalStableBorrows = new BigDecimal(0)

    instrument_state_initialized.totalPrincipalVariableBorrows_WEI = new BigInt(0)
    instrument_state_initialized.totalPrincipalVariableBorrows = new BigDecimal(0)

    instrument_state_initialized.totalCompoundedEarnings_WEI = new BigInt(0)
    instrument_state_initialized.totalCompoundedEarnings = new BigDecimal(0)

    instrument_state_initialized.stableBorrowInterestRate = new BigInt(0)
    instrument_state_initialized.stableBorrowInterestPercent = new BigDecimal(0)

    instrument_state_initialized.totalCompoundedEarningsSTABLEInterest_WEI = new BigInt(0)
    instrument_state_initialized.totalCompoundedEarningsSTABLEInterest = new BigDecimal(0)

    instrument_state_initialized.variableBorrowInterestRate = new BigInt(0)
    instrument_state_initialized.variableBorrowInterestPercent = new BigDecimal(0)

    instrument_state_initialized.totalCompoundedEarningsVARIABLEInterest_WEI = new BigInt(0)
    instrument_state_initialized.totalCompoundedEarningsVARIABLEInterest = new BigDecimal(0)

    instrument_state_initialized.variableBorrowIndex = new BigInt(0)
    instrument_state_initialized.supplyIndex = new BigDecimal(0)

    instrument_state_initialized.supplyInterestRate = new BigInt(0)
    instrument_state_initialized.supplyInterestRatePercent = new BigDecimal(0)

    instrument_state_initialized.totalSupplierEarnings_WEI = new BigInt(0)
    instrument_state_initialized.totalSupplierEarnings = new BigDecimal(0)

    instrument_state_initialized.lifeTimeDeposits_WEI = new BigInt(0)
    instrument_state_initialized.lifeTimeDeposits = new BigDecimal(0)

    instrument_state_initialized.lifeTimeBorrows_WEI = new BigInt(0)
    instrument_state_initialized.lifeTimeBorrows = new BigDecimal(0)


    instrument_state_initialized.save()
    return instrument_state_initialized as Instrument
  }