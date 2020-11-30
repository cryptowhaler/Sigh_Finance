pragma solidity ^0.5.16;

/**
 * @title Sigh Distribution Handler Contract
 * @notice Handles the SIGH Loss Minimizing Mechanism for the Lending Protocol
 * @dev Accures SIGH for the supported markets based on losses made every 24 hours, along with Staking speeds. This accuring speed is updated every hour
 * @author SIGH Finance
 */
 
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol"; 
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol"; 
import "../Math/Exponential.sol";
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";

import "../../Configuration/GlobalAddressesProvider.sol";
import "../../LendingProtocolContracts/interfaces/IPriceOracleGetter.sol";            

import "../../LendingProtocolContracts/interfaces/ILendingPoolCore.sol";     
import "../Interfaces/ISighStaking.sol";       


contract SIGHDistributionHandler is Exponential, VersionedInitializable {       // 
    
// ######## CONTRACT ADDRESSES ########
    GlobalAddressesProvider public addressesProvider;
    IERC20 public Sigh_Address;
    IPriceOracleGetter public oracle;
    ILendingPoolCore public lendingPoolCore;

// ######## PARAMETERS ########
    uint constant SIGH_ClaimThreshold = 1e18;        ///  The threshold above which the flywheel transfers SIGH, in wei
    uint constant sighInitialIndex = 1e36;            ///  The initial SIGH index for a market

    bool private isSpeedUpperCheckAllowed = false;
    Exp private upperCheckProfitPercentage = Exp({ mantissa : 0 });  

    address[] private all_Instruments;    // LIST OF INSTRUMENTS 

// ######## INDIVIDUAL INSTRUMENT STATE ########

    struct SIGHInstrument {
        bool isListed;
        string name;
        address iTokenAddress;
        uint256 decimals;
        bool isSIGHMechanismActivated;
        uint supplyindex;
        uint256 supplylastupdatedblock;
        uint borrowindex;
        uint256 borrowlastupdatedblock;
    }

    mapping (address => SIGHInstrument) private financial_instruments;    // FINANCIAL INSTRUMENTS
    
// ######## 24 HOUR PRICE HISTORY FOR EACH INSTRUMENT AND THE BLOCK NUMBER WHEN THEY WERE TAKEN ########

    struct InstrumentPriceCycle {
        uint256[24] recordedPriceSnapshot;
        uint32 initializationCounter;
    }

    mapping(address => InstrumentPriceCycle) private instrumentPriceCycles;    
    uint256[24] private blockNumbersForPriceSnapshots_;
    uint224 private curClock;

// ######## SIGH DISTRIBUTION SPEED FOR EACH INSTRUMENT ########

    uint private SIGHSpeed;

    struct Instrument_Sigh_Mechansim_State {
        uint256 suppliers_Speed;
        uint256 borrowers_Speed;
        uint256 staking_Speed;
        uint256 _24HrVolatility;
        string side;
        uint256 percentTotalVolatility;
    }

    mapping(address => Instrument_Sigh_Mechansim_State) private Instrument_Sigh_Mechansim_States;
    uint256 private deltaBlocksForSpeed = 1; // 60 * 60 
    uint256 private prevSpeedRefreshBlock;


    // ####################################
    // ############## EVENTS ##############
    // ####################################

    event InstrumentAdded (address instrumentAddress_, address iTokenAddress,  uint decimals , uint blockNumber); 
    event InstrumentRemoved(address _instrument, uint blockNumber); 

    event SIGHSpeedUpdated(uint oldSIGHSpeed, uint newSIGHSpeed, uint blockNumber_);     /// Emitted when SIGH speed is changed
    event SpeedUpperCheckSwitched(bool previsSpeedUpperCheckAllowed, uint upperCheckProfitPercentage, uint blockNumber );
    event minimumBlocksForSpeedRefreshUpdated( uint prevDeltaBlocksForSpeed,uint newDeltaBlocksForSpeed, uint blockNumber );

    event InstrumentSIGHed(address instrumentAddress_, bool isSighed, uint blockNumber);    /// Emitted when market isSIGHMechanismActivated status is changed
    event StakingSpeedUpdated(address instrumentAddress_ , uint prevStakingSpeed, uint new_staking_Speed, uint blockNumber );
    
    event PriceSnapped(address instrument, uint prevPrice, uint currentPrice, uint deltaBlocks, uint currentClock, uint blockNumber);   /// @notice Emitted when Price snapshot is taken
    event MaxSIGHSpeedCalculated(uint _SIGHSpeed, uint current_Sigh_Price, uint totalVolatilityPerBlockAverage, uint deltaBlocks, uint maxVolatilityToAddress, uint max_valueDistributionLimitDecimalsAdjusted, uint sigh_speed_used );
    event refreshingSighSpeeds( address _Instrument,uint maxSpeed, string side, uint supplierSpeed, uint borrowerSpeed, uint _24HrVolatility, uint percentTotalVolatility, uint totalLosses );
    

    event SIGHSupplyIndexUpdated(address instrument, uint totalCompoundedSupply, uint sighAccured, uint ratioMantissa, uint newIndexMantissa,  uint blockNum );
    event SIGHBorrowIndexUpdated(address instrument, uint totalBorrows, uint sighAccured, uint ratioMantissa, uint newIndexMantissa,  uint blockNum );

    event AccuredSIGHTransferredToTheUser(address instrument, address user, uint sigh_Amount );

// #######################################################
// ##############        MODIFIERS          ##############
// #######################################################
        
    //only LendingPoolCore can use functions affected by this modifier
    modifier onlyLendingPoolCore {
        require(address(lendingPoolCore) == msg.sender, "The caller must be the Lending pool Core contract");
        _;
    }   
    
    //only SIGH Distribution Manager can use functions affected by this modifier
    modifier onlySighFinanceConfigurator {
        require(addressesProvider.getSIGHFinanceConfigurator() == msg.sender, "The caller must be the SIGH Finanace Configurator Contract");
        _;
    }

    // This function can only be called by the Instrument's IToken Contract
    modifier onlyITokenContract(address instrument) {
           SIGHInstrument memory currentInstrument = financial_instruments[instrument];
           require( currentInstrument.isListed, "This instrument is not supported by SIGH Distribution Handler");
           require( msg.sender == currentInstrument.iTokenAddress, "This function can only be called by the Instrument's IToken Contract");
        _;
    }
        
// ######################################################################################
// ##############        PROXY RELATED  & ADDRESSES INITIALIZATION        ###############
// ######################################################################################

    uint256 constant private SIGH_DISTRIBUTION_REVISION = 0x11;

    function getRevision() internal pure returns(uint256) {
        return SIGH_DISTRIBUTION_REVISION;
    }
    
    function initialize( GlobalAddressesProvider addressesProvider_) public initializer {   // 
        addressesProvider = addressesProvider_;
        refreshConfigInternal(); 
    }

    function refreshConfig() external onlySighFinanceConfigurator {        // ()
        refreshConfigInternal(); 
    }

    function refreshConfigInternal() internal {
        Sigh_Address = IERC20(addressesProvider.getSIGHAddress());
        oracle = IPriceOracleGetter( addressesProvider.getPriceOracle() );
        lendingPoolCore = ILendingPoolCore(addressesProvider.getLendingPoolCore());
    }
    
    
// #####################################################################################################################################################
// ##############        ADDING INSTRUMENTS AND ENABLING / DISABLING SIGH's LOSS MINIMIZING DISTRIBUTION MECHANISM       ###############################
// ##############        1. addInstrument() : Adds an instrument. Called by LendingPoolCore       ######################################################
// ##############        2. Instrument_SIGHed() : Instrument supported by Sigh Distribution. Called by Sigh Finance Configurator   #####################
// ##############        3. Instrument_UNSIGHed() : Instrument to be removed from Sigh Distribution. Called by Sigh Finance Configurator ###############
// #####################################################################################################################################################

    /**
    * @dev adds an instrument - Called by LendingPool Core when an instrument is added to the Lending Protocol
    * @param _instrument the instrument object
    * @param _iTokenAddress the address of the overlying iToken contract
    * @param _decimals the number of decimals of the underlying asset
    **/
    function addInstrument( address _instrument, address _iTokenAddress, uint256 _decimals ) external onlyLendingPoolCore returns (bool) {
        require(!financial_instruments[_instrument].isListed ,"Instrument already supported.");

        all_Instruments.push(_instrument); // ADD THE INSTRUMENT TO THE LIST OF SUPPORTED INSTRUMENTS
        ERC20Detailed instrumentContract = ERC20Detailed(_iTokenAddress);

        // STATE UPDATED : INITIALIZE INNSTRUMENT DATA
        financial_instruments[_instrument] = SIGHInstrument( {  isListed: true, 
                                                                name: instrumentContract.name(),
                                                                iTokenAddress: _iTokenAddress,
                                                                decimals: _decimals, 
                                                                isSIGHMechanismActivated: false, 
                                                                supplyindex: sighInitialIndex, // ,"sighInitialIndex exceeds 224 bits"), 
                                                                supplylastupdatedblock: getBlockNumber(), 
                                                                borrowindex : sighInitialIndex, //,"sighInitialIndex exceeds 224 bits"), 
                                                                borrowlastupdatedblock : getBlockNumber()
                                                                } );
        // STATE UPDATED : INITITALIZE INSTRUMENT SPEEDS
        Instrument_Sigh_Mechansim_States[_instrument] = Instrument_Sigh_Mechansim_State({ 
                                                                       suppliers_Speed: uint(0),
                                                                       borrowers_Speed: uint(0),
                                                                       staking_Speed: uint(0),
                                                                       _24HrVolatility: uint(0),
                                                                       side: 'inactive' ,
                                                                       percentTotalVolatility: uint(0)
                                                                    } );

        // STATE UPDATED : INITIALIZE PRICECYCLES
        if ( instrumentPriceCycles[_instrument].initializationCounter == 0 ) {
            uint256[24] memory emptyPrices;
            instrumentPriceCycles[_instrument] = InstrumentPriceCycle({ recordedPriceSnapshot : emptyPrices, initializationCounter: uint32(0) }) ;
        }   

        emit InstrumentAdded(_instrument,_iTokenAddress,  _decimals, block.number); 
        return true;
    }

    /**
    * @dev removes an instrument - Called by LendingPool Core when an instrument is removed from the Lending Protocol
    * @param _instrument the instrument object
    **/
    function removeInstrument( address _instrument ) external onlyLendingPoolCore returns (bool) {   // 
        require(financial_instruments[_instrument].isListed ,"Instrument already supported.");
        require(updatedInstrumentIndexesInternal(), "Updating Instrument Indexes Failed");       //  accure the indexes 

        uint index = 0;
        uint length_ = all_Instruments.length;
        for (uint i = 0 ; i < length_ ; i++) {
            if (all_Instruments[i] == _instrument) {
                index = i;
                break;
            }
        }
        all_Instruments[index] = all_Instruments[length_ - 1];
        all_Instruments.length--;
        uint newLen = length_ - 1;
        require(all_Instruments.length == newLen,"Instrument not properly removed from the list of instruments supported");
        
        delete financial_instruments[_instrument];
        delete Instrument_Sigh_Mechansim_States[_instrument];
        delete instrumentPriceCycles[_instrument];

        emit InstrumentRemoved(_instrument, block.number); 
        return true;
    }



    /**
    * @dev Instrument to be convered under the SIGH DIstribution Mechanism - Decided by the SIGH Finance Manager who 
    * can call this function through the Sigh Finance Configurator
    * @param instrument_ the instrument object
    **/
    function Instrument_SIGHed(address instrument_) external onlySighFinanceConfigurator returns (bool) {                   // 
        require(financial_instruments[instrument_].isListed ,"Instrument not supported.");
        require(!financial_instruments[instrument_].isSIGHMechanismActivated, "Instrument already covered under SIGH Distribution Mechanism");
        refreshSIGHSpeeds(); 
        
        financial_instruments[instrument_].isSIGHMechanismActivated = true;     // STATE UPDATED
        emit InstrumentSIGHed( instrument_, financial_instruments[instrument_].isSIGHMechanismActivated, getBlockNumber());
        return true;
    }

    /**
    * @dev Instrument to be removed from SIGH DIstribution Mechanism - Decided by the SIGH Finance Manager who 
    * can call this function through the Sigh Finance Configurator
    * @param instrument_ the instrument object
    **/
    function Instrument_UNSIGHed(address instrument_) external onlySighFinanceConfigurator returns (bool) {         // 
        require(financial_instruments[instrument_].isListed ,"Instrument not supported.");
        require(financial_instruments[instrument_].isSIGHMechanismActivated, "Instrument already not supported by the SIGH Distribution Mechanism");
        refreshSIGHSpeeds();

        // Recorded Price snapshots initialized to 0. 
        uint256[24] memory emptyPrices;
        instrumentPriceCycles[instrument_].recordedPriceSnapshot = emptyPrices; //InstrumentPriceCycle({ recordedPriceSnapshot : emptyPrices, initializationCounter: 0 }) ;   // STATE UPDATED
        instrumentPriceCycles[instrument_].initializationCounter = uint32(0); //InstrumentPriceCycle({ recordedPriceSnapshot : emptyPrices, initializationCounter: 0 }) ;     // STATE UPDATED

        financial_instruments[instrument_].isSIGHMechanismActivated = false;              // STATE UPDATED
        emit InstrumentSIGHed( instrument_, financial_instruments[instrument_].isSIGHMechanismActivated, getBlockNumber());
        return true;
    }
    

// ###########################################################################################################################
// ##############        GLOBAL SIGH SPEED AND SIGH SPEED RATIO FOR A MARKET          ########################################
// ##############        1. updateSIGHSpeed() : Governed by Sigh Finance Manager          ####################################
// ##############        2. updateSIGHSpeedRatioForAnInstrument(): Decided by the LendingPool Manager          ###############
// ##############        3. updateStakingSpeedForAnInstrument():  Decided by the SIGH Finance Manager          ###############
// ##############        4. SpeedUpperCheckSwitch():  Decided by the SIGH Finance Manager   ##################################
// ##############        5. updateDeltaBlocksForSpeedRefresh() : Decided by the SIGH Finance Manager           ###############
// ###########################################################################################################################

    /**
     * @notice Sets the amount of Global SIGH distributed per block - - Decided by the SIGH Finance Manager who 
     * can call this function through the Sigh Finance Configurator
     * @param SIGHSpeed_ The amount of SIGH wei per block to distribute
     */
    function updateSIGHSpeed(uint SIGHSpeed_) external onlySighFinanceConfigurator returns (bool) {             //
        refreshSIGHSpeeds();
        uint oldSpeed = SIGHSpeed;
        SIGHSpeed = SIGHSpeed_;                                 // STATE UPDATED
        emit SIGHSpeedUpdated(oldSpeed, SIGHSpeed, getBlockNumber());         
        return true;
    }
    
    /**
     * @notice Sets the staking speed for an Instrument - Decided by the SIGH Finance Manager who 
     * can call this function through the Sigh Finance Configurator
     * @param instrument_ The instrument
     * @param newStakingSpeed The additional SIGH staking speed assigned to the Instrument
     */
    function updateStakingSpeedForAnInstrument(address instrument_, uint newStakingSpeed) external onlySighFinanceConfigurator returns (bool) {     // 
        require(financial_instruments[instrument_].isListed ,"Instrument not supported.");
        
        uint prevStakingSpeed = Instrument_Sigh_Mechansim_States[instrument_].staking_Speed;
        Instrument_Sigh_Mechansim_States[instrument_].staking_Speed = newStakingSpeed;                    // STATE UPDATED

        emit StakingSpeedUpdated(instrument_, prevStakingSpeed, Instrument_Sigh_Mechansim_States[instrument_].staking_Speed, getBlockNumber() );
        return true;
        
    }

    /**
     * @notice Activates / Deactivates the upper check and sets the profit percentage for an Instrument - Decided by the SIGH Finance Manager who 
     * can call this function through the Sigh Finance Configurator
     * @param isActivated Boolean deciding if the upper check on SIGH speed (loss driven) activated or not
     * @param profitPercentage The additional profit based SIGH distribution over and above the covered losses
     */    
    function SpeedUpperCheckSwitch( bool isActivated, uint profitPercentage ) external onlySighFinanceConfigurator returns (bool) {     // 
        require( profitPercentage > 0.01e18, 'The new Profit Percentage must be greater than 0.01e18 (1%) ');
        require( profitPercentage <= 10e18, 'The new Supplier Ratio must be less than 10e18 (10x)');
        refreshSIGHSpeeds();
    
        
        if (!isActivated) {
            isSpeedUpperCheckAllowed = false;                                           // STATE UPDATED
            upperCheckProfitPercentage = Exp({ mantissa : 0 });              // STATE UPDATED
        }
        else {
            isSpeedUpperCheckAllowed = true;                                                // STATE UPDATED
            upperCheckProfitPercentage = Exp({ mantissa : profitPercentage });              // STATE UPDATED
        }

        emit SpeedUpperCheckSwitched(isSpeedUpperCheckAllowed, upperCheckProfitPercentage.mantissa, getBlockNumber() );
        return true;
    }

    /**
     * @notice Updates the minimum blocks to be mined before speed can be refreshed again  - Decided by the SIGH Finance Manager who 
     * can call this function through the Sigh Finance Configurator
     * @param deltaBlocksLimit The new Minimum blocks limit
     */   
    function updateDeltaBlocksForSpeedRefresh(uint deltaBlocksLimit) external onlySighFinanceConfigurator returns (bool) {      // 
        refreshSIGHSpeeds();
        uint prevdeltaBlocksForSpeed = deltaBlocksForSpeed;
        deltaBlocksForSpeed = deltaBlocksLimit;                                         // STATE UPDATED
        emit minimumBlocksForSpeedRefreshUpdated( prevdeltaBlocksForSpeed,deltaBlocksForSpeed, getBlockNumber()  );
        return true;
    }


    // #########################################################################################################
    // ################ REFRESH SIGH DISTRIBUTION SPEEDS FOR INSTRUMENTS (INITIALLY EVERY HOUR) ################
    // #########################################################################################################

    /**
     * @notice Recalculate and update SIGH speeds for all Supported SIGH markets
     */
    function refreshSIGHSpeeds() public returns (bool) {
        uint blockNumber = block.number;
        uint256 blocksElapsedSinceLastRefresh = sub_(blockNumber , prevSpeedRefreshBlock, "Refresh SIGH Speeds : Subtraction underflow for blocks"); 

        if ( blocksElapsedSinceLastRefresh >= deltaBlocksForSpeed) {
            refreshSIGHSpeedsInternal();
            prevSpeedRefreshBlock = blockNumber;                                        // STATE UPDATED
            return true;
        }
        return false;
    }



    /**
     * @notice Recalculate and update SIGH speeds for all Supported SIGH markets
     * 1. Instrument indexes for all instruments updated
     * 2. Delta blocks (past 24 hours) calculated and current block number (for price snapshot) updated
     * 3. 1st loop over all instruments --> Average loss (per block) for each of the supported instruments
     *    along with the total lending protocol's loss (per block) calculated and stored price snapshot is updated
     * 4. The Sigh speed that will be used for speed refersh calculated (provided if is needed to be done) 
     * 5. 1st loop over all instruments -->  Sigh Distribution speed (Loss driven speed + staking speed) calculated for 
     *    each instrument
     * 5.1 Current Clock updated
     */    
    function refreshSIGHSpeedsInternal() internal {
        address[] memory all_Instruments_ = all_Instruments;
        uint deltaBlocks_ = sub_(block.number , blockNumbersForPriceSnapshots_[curClock], "DeltaBlocks resulted in Underflow");       // Delta Blocks over past 24 hours
        blockNumbersForPriceSnapshots_[curClock] = block.number;                                                                    // STATE UPDATE : Block Number for the priceSnapshot Updated

        require(updatedInstrumentIndexesInternal(), "Updating Instrument Indexes Failed");       //  accure the indexes 

        Exp[] memory supplierLosses = new Exp[](all_Instruments_.length);     // LOSSES MADE BY EACH INSTRUMENT SUPPLIERS
        Exp[] memory borrowerLosses = new Exp[](all_Instruments_.length);     // LOSSES MADE BY EACH INSTRUMENT BORROWERS
        Exp memory totalLosses = Exp({mantissa: 0});                            // TOTAL LOSSES (Over past 24 hours)
        

        // DELTA BLOCKS = CURRENT BLOCK - 24HRS_OLD_STORED_BLOCK_NUMBER
        // TOTAL LIQUIDITY FOR AN INSTRUMENT = CURRENT BALANCE OF LENDINGPOOLCORE + TOTALBORROWS (taken from lendingPoolCore)
        // LOSS PER INSTRUMENT = PREVIOUS PRICE (STORED) - CURRENT PRICE (TAKEN FROM ORACLE)
        // TOTAL LOSSES OF AN INSTRUMENT = LOSS PER INSTRUMENT * TOTAL LIQUIDITY
        // INSTRUMENT LOSSES (PER BLOCK AVERAGE) = TOTAL LOSSES OF AN INSTRUMENT / DELTA BLOCKS 
        // TOTAL LOSSES (PER BLOCK AVERAGE) = TOTAL LOSSES + INSTRUMENT LOSSES (PER BLOCK AVERAGE) 
        // Price Snapshot for current clock replaces the pervious price snapshot
        for (uint i = 0; i < all_Instruments_.length; i++) {

            address _currentInstrument = all_Instruments_[i];       // Current Instrument
            
            Exp memory previousPrice = Exp({ mantissa: instrumentPriceCycles[_currentInstrument].recordedPriceSnapshot[curClock] });            // 24hr old price snapshot
            Exp memory currentPrice = Exp({ mantissa: oracle.getAssetPrice( _currentInstrument ) });                                            // current price from the oracle
            require ( currentPrice.mantissa > 0, "refreshSIGHSpeedsInternal : Oracle returned Invalid Price" );
            instrumentPriceCycles[_currentInstrument].recordedPriceSnapshot[curClock] =  uint256(currentPrice.mantissa); //  STATE UPDATED : PRICE SNAPSHOT TAKEN        
            emit PriceSnapped(_currentInstrument, previousPrice.mantissa, instrumentPriceCycles[_currentInstrument].recordedPriceSnapshot[curClock], deltaBlocks_, curClock, block.number );

            if ( !financial_instruments[_currentInstrument].isSIGHMechanismActivated || instrumentPriceCycles[_currentInstrument].initializationCounter != uint32(24) ) {     // if LOSS MINIMIZNG MECHANISM IS NOT ACTIVATED FOR THIS INSTRUMENT
                supplierLosses[i] = Exp({mantissa: 0});
                borrowerLosses[i] = Exp({mantissa: 0});
                Instrument_Sigh_Mechansim_States[_currentInstrument].side = 'inactive';
                //    Newly Sighed Instrument needs to reach 24 (priceSnapshots need to be taken) before it can be assigned a Sigh Speed based on LOSSES   
                if (instrumentPriceCycles[_currentInstrument].initializationCounter < uint32(24) ) {
                    instrumentPriceCycles[_currentInstrument].initializationCounter = uint32(add_(instrumentPriceCycles[_currentInstrument].initializationCounter , uint32(1) , 'Price Counter addition failed.'));  // STATE UPDATE : INITIALIZATION COUNTER UPDATED
                }
            }
            else {
                if ( greaterThanExp(previousPrice , currentPrice) ) {   // i.e the price has decreased so we calculate Losses accured by Suppliers of the Instrument
                    uint totalUnderlyingLiquidity = lendingPoolCore.getInstrumentTotalLiquidity( _currentInstrument ); // Total amount supplied 
                    (MathError error, Exp memory lossPerInstrument) = subExp( previousPrice , currentPrice );       
                    ( MathError error2, Exp memory supplierLoss ) = mulScalar( lossPerInstrument, totalUnderlyingLiquidity );
                    supplierLosses[i].mantissa = adjustForDecimalsInternal(supplierLoss.mantissa, financial_instruments[_currentInstrument].decimals , oracle.getAssetPriceDecimals(_currentInstrument) );
                    borrowerLosses[i] = Exp({mantissa: 0});
                    ( error, totalLosses) = addExp(totalLosses, supplierLosses[i]);            //  Total loss  += supplier loss
                    Instrument_Sigh_Mechansim_States[_currentInstrument]._24HrVolatility =  supplierLosses[i].mantissa;
                    Instrument_Sigh_Mechansim_States[_currentInstrument].side = 'Supplier';
                }
                else {                                              // i.e the price has increased so we calculate Losses accured by Borrowers of the Instrument
                    uint totalBorrows = lendingPoolCore.getInstrumentTotalBorrows( _currentInstrument ); // Total amount supplied 
                    (MathError error, Exp memory lossPerInstrument) = subExp( currentPrice, previousPrice );       
                    ( MathError error2, Exp memory borrowerLoss ) = mulScalar( lossPerInstrument, totalBorrows );
                    borrowerLosses[i].mantissa = adjustForDecimalsInternal(borrowerLoss.mantissa , financial_instruments[_currentInstrument].decimals , oracle.getAssetPriceDecimals(_currentInstrument) );
                    supplierLosses[i] = Exp({mantissa: 0});
                    ( error, totalLosses) = addExp(totalLosses, borrowerLosses[i]);            //  Total loss  += borrower loss
                    Instrument_Sigh_Mechansim_States[_currentInstrument]._24HrVolatility =  borrowerLosses[i].mantissa;
                    Instrument_Sigh_Mechansim_States[_currentInstrument].side = 'Borrower';
                }
            }
        }
        
        uint maxSpeed = SIGHSpeed;
        if (isSpeedUpperCheckAllowed) {                     // SIGH SPEED BASED ON UPPER CHECK AND ADDITIONAL PROFIT POTENTIAL
            (MathError error, Exp memory totalLossPerBlock) = divScalar(totalLosses,deltaBlocks_);   // Total Loss per Block
            maxSpeed = calculateMaxSighSpeedInternal( totalLossPerBlock.mantissa, deltaBlocks_ ); 
        }

        // ###### Updates the Speed (loss driven) for the Supported Markets ######
        for (uint i=0 ; i < all_Instruments_.length ; i++) {

            address _currentInstrument = all_Instruments_[i];       // Current Instrument

            Exp memory lossRatio;
            MathError error;
            if (totalLosses.mantissa > 0) {
                if (supplierLosses[i].mantissa > 0 ) {
                    ( error, lossRatio) = divExp(supplierLosses[i], totalLosses);
                    Instrument_Sigh_Mechansim_States[_currentInstrument].suppliers_Speed = mul_(maxSpeed, lossRatio);                                         // STATE UPDATE
                    Instrument_Sigh_Mechansim_States[_currentInstrument].borrowers_Speed = uint(0);                                                           // STATE UPDATE
                } 
                else {
                    ( error, lossRatio) = divExp(borrowerLosses[i], totalLosses);
                    Instrument_Sigh_Mechansim_States[_currentInstrument].borrowers_Speed = mul_(maxSpeed, lossRatio);                                         // STATE UPDATE
                    Instrument_Sigh_Mechansim_States[_currentInstrument].suppliers_Speed = uint(0);                                                           // STATE UPDATE
                }
            } 
            else {
                Instrument_Sigh_Mechansim_States[_currentInstrument].borrowers_Speed = uint(0);                                                               // STATE UPDATE
                Instrument_Sigh_Mechansim_States[_currentInstrument].suppliers_Speed = uint(0);                                                               // STATE UPDATE
            }
            Instrument_Sigh_Mechansim_States[_currentInstrument].percentTotalVolatility = mul_(1000000, lossRatio);                                              // STATE UPDATE (LOss Ratio is instrumentVolatility/totalVolatility * 100000 )

            emit refreshingSighSpeeds( _currentInstrument ,maxSpeed, Instrument_Sigh_Mechansim_States[_currentInstrument].side,  Instrument_Sigh_Mechansim_States[_currentInstrument].suppliers_Speed, Instrument_Sigh_Mechansim_States[_currentInstrument].borrowers_Speed, Instrument_Sigh_Mechansim_States[_currentInstrument]._24HrVolatility, Instrument_Sigh_Mechansim_States[_currentInstrument].percentTotalVolatility, totalLosses.mantissa);
        }

        require(updateCurrentClockInternal(), "Updating CLock Failed");                         // Updates the Clock    
    }



    //  Updates the Supply & Borrow Indexes for all the Supported Instruments
    function updatedInstrumentIndexesInternal() internal returns (bool) {
        for (uint i = 0; i < all_Instruments.length; i++) {
            address currentInstrument = all_Instruments[i];
            updateSIGHSupplyIndexInternal(currentInstrument);
            updateSIGHBorrowIndexInternal(currentInstrument);
        }
        return true;
    }

    // returns the currently maximum possible SIGH Distribution speed. Called only when upper check is activated
    function calculateMaxSighSpeedInternal( uint totalLossesPerBlockAverage, uint deltaBlocks ) internal returns (uint) {
        uint sigh_speed_used = SIGHSpeed;
        uint current_Sigh_Price = oracle.getAssetPrice( address(Sigh_Address) );   
        ERC20Detailed sighContract = ERC20Detailed(address(Sigh_Address));
        uint priceDecimals = oracle.getAssetPriceDecimals(address(Sigh_Address));
        uint sighDecimals =  sighContract.decimals();

        // MAX Value that can be distributed per block through SIGH Distribution
        uint max_valueDistributionLimit = mul_( current_Sigh_Price, SIGHSpeed );   
        uint max_valueDistributionLimitDecimalsAdjusted = adjustForDecimalsInternal( max_valueDistributionLimit,sighDecimals , priceDecimals  );

        // MAX Volatility that is allowed to be covered through SIGH Distribution
        uint maxVolatilityToAddress = mul_(totalLossesPerBlockAverage, upperCheckProfitPercentage ); // (a * b)/1e18 [b is in Exp Scale]

        if ( max_valueDistributionLimitDecimalsAdjusted >  maxVolatilityToAddress ) {
            uint maxVolatilityToAddress_SIGHdecimalsMul = mul_( maxVolatilityToAddress, uint(10**(sighDecimals)), "Max Volatility : SIGH Decimals multiplication gave error" );
            uint maxVolatilityToAddress_PricedecimalsMul = mul_( maxVolatilityToAddress_SIGHdecimalsMul, uint(10**(priceDecimals)), "Max Volatility : Price Decimals multiplication gave error" );
            uint maxVolatilityToAddress_DecimalsDiv = div_( maxVolatilityToAddress_PricedecimalsMul, uint(10**18), "Max Volatility : Decimals division gave error" );
            sigh_speed_used = div_( maxVolatilityToAddress_DecimalsDiv, current_Sigh_Price, "Max Speed division gave error" );
        }
        emit MaxSIGHSpeedCalculated(SIGHSpeed, current_Sigh_Price, totalLossesPerBlockAverage, deltaBlocks, maxVolatilityToAddress, max_valueDistributionLimitDecimalsAdjusted, sigh_speed_used  );
        return sigh_speed_used;
    }

    // Updates the Current CLock (global variable tracking the current hour )
    function updateCurrentClockInternal() internal returns (bool) {
        curClock = curClock == 23 ? 0 : uint224(add_(curClock,1,"curClock : Addition Failed"));
        return true;
    }
    
    function adjustForDecimalsInternal(uint _amount, uint instrumentDecimals, uint priceDecimals) internal pure returns (uint) {
        require(instrumentDecimals > 0, "Instrument Decimals cannot be Zero");
        require(priceDecimals > 0, "Oracle returned invalid price Decimals");
        uint adjused_Amount = mul_(_amount,uint(10**18),'Loss Amount multiplication Adjustment overflow');
        uint instrumentDecimalsCorrected = div_( adjused_Amount,uint(10**instrumentDecimals),'Instrument Decimals correction underflow');
        uint priceDecimalsCorrected = div_( instrumentDecimalsCorrected,uint(10**priceDecimals),'Price Decimals correction underflow');
        return priceDecimalsCorrected;
    }


    // #####################################################################################################################################
    // ################ UPDATE SIGH DISTRIBUTION INDEXES (Called from LendingPoolCore) #####################################################
    // ################ 1. updateSIGHSupplyIndex() : Called by LendingPoolCore              ################################################
    // ################ --> updateSIGHSupplyIndexInternal() Internal function with actual implementation  ################################## 
    // ################ 2. updateSIGHBorrowIndex() : Called by LendingPoolCore ############################################################# 
    // ################ --> updateSIGHBorrowIndexInternal() : Internal function with actual implementation #################################
    // #####################################################################################################################################


    /**
     * @notice Accrue SIGH to the Instrument by updating the supply index
     * @param currentInstrument The Instrument whose supply index to update
     */
    function updateSIGHSupplyIndex(address currentInstrument) external onlyLendingPoolCore returns (bool) { //     // Called on each Deposit, Redeem and Liquidation (collateral)
        require(financial_instruments[currentInstrument].isListed ,"Instrument not supported.");
        require(updateSIGHSupplyIndexInternal( currentInstrument ), "Updating Sigh Supply Indexes operation failed" );
        return true;
    }

    function updateSIGHSupplyIndexInternal(address currentInstrument) internal returns (bool) {
        uint blockNumber = getBlockNumber();

        if ( financial_instruments[currentInstrument].supplylastupdatedblock == blockNumber ) {    // NO NEED TO ACCUR AGAIN
            return true;
        }

        SIGHInstrument storage instrumentState = financial_instruments[currentInstrument];
        uint supplySpeed = add_(Instrument_Sigh_Mechansim_States[currentInstrument].suppliers_Speed, Instrument_Sigh_Mechansim_States[currentInstrument].staking_Speed,"Supplier speed addition with staking speed overflow" );
        uint deltaBlocks = sub_(blockNumber, uint( instrumentState.supplylastupdatedblock ), 'updateSIGHSupplyIndex : Block Subtraction Underflow');    // Delta Blocks 
        
        // WE UPDATE INDEX ONLY IF $SIGH IS ACCURING
        if (deltaBlocks > 0 && supplySpeed > 0) {       // In case SIGH would have accured
            uint sigh_Accrued = mul_(deltaBlocks, supplySpeed);                                                                         // SIGH Accured
            uint totalCompoundedLiquidity = IERC20(financial_instruments[currentInstrument].iTokenAddress).totalSupply();                           // Total amount supplied 
            Double memory ratio = totalUnderlyingLiquidity > 0 ? fraction(sigh_Accrued, totalCompoundedLiquidity) : Double({mantissa: 0});    // SIGH Accured per Supplied Instrument Token
            Double memory newIndex = add_(Double({mantissa: instrumentState.supplyindex}), ratio);                                      // Updated Index
            emit SIGHSupplyIndexUpdated( currentInstrument, totalCompoundedLiquidity, sigh_Accrued, ratio.mantissa , newIndex.mantissa, blockNumber );  

            instrumentState.supplyindex = newIndex.mantissa;       // STATE UPDATE: New Index Committed to Storage 
        } 
        
        instrumentState.supplylastupdatedblock = blockNumber ;     // STATE UPDATE: Block number updated        
        return true;
    }



    /**
     * @notice Accrue SIGH to the market by updating the borrow index
     * @param currentInstrument The market whose borrow index to update
     */
    function updateSIGHBorrowIndex(address currentInstrument) external  onlyLendingPoolCore returns (bool) {  //     // Called during Borrow, repay, SwapRate, Rebalance, Liquidation
        require(financial_instruments[currentInstrument].isListed ,"Instrument not supported.");
        require( updateSIGHBorrowIndexInternal(currentInstrument), "Updating Sigh Borrow Indexes operation failed" ) ;
        return true;
    }

    function updateSIGHBorrowIndexInternal(address currentInstrument) internal returns(bool) {
        uint blockNumber = getBlockNumber();

        if ( financial_instruments[currentInstrument].borrowlastupdatedblock == blockNumber ) {    // NO NEED TO ACCUR AGAIN
            return true;
        }

        SIGHInstrument storage instrumentState = financial_instruments[currentInstrument];
        uint borrowSpeed = add_(Instrument_Sigh_Mechansim_States[currentInstrument].borrowers_Speed, Instrument_Sigh_Mechansim_States[currentInstrument].staking_Speed, "Supplier speed addition with staking speed overflow" );
        uint deltaBlocks = sub_(blockNumber, uint(instrumentState.borrowlastupdatedblock), 'updateSIGHBorrowIndex : Block Subtraction Underflow');         // DELTA BLOCKS
        
        uint totalVariableBorrows =  lendingPoolCore.getInstrumentCompoundedBorrowsVariable(currentInstrument);
        uint totalStableBorrows =  lendingPoolCore.getInstrumentCompoundedBorrowsStable(currentInstrument);
        uint totalCompoundedBorrows =  add_(totalVariableBorrows,totalStableBorrows,'Compounded Borrows Addition gave error'); 
        
        if (deltaBlocks > 0 && borrowSpeed > 0) {       // In case SIGH would have accured
            uint sigh_Accrued = mul_(deltaBlocks, borrowSpeed);                             // SIGH ACCURED = DELTA BLOCKS x SIGH SPEED (BORROWERS)
            Double memory ratio = totalCompoundedBorrows > 0 ? fraction(sigh_Accrued, totalCompoundedBorrows) : Double({mantissa: 0});      // SIGH Accured per Borrowed Instrument Token
            Double memory newIndex = add_(Double({mantissa: instrumentState.borrowindex}), ratio);                      // New Index
            emit SIGHBorrowIndexUpdated( currentInstrument, totalCompoundedBorrows, sigh_Accrued, ratio.mantissa , newIndex.mantissa, blockNumber );

            instrumentState.borrowindex = newIndex.mantissa ;  // STATE UPDATE: New Index Committed to Storage 
        } 

        instrumentState.borrowlastupdatedblock = blockNumber;   // STATE UPDATE: Block number updated        
        return true;
    }

    // #########################################################################################
    // ################### TRANSFERS THE SIGH TO THE MARKET PARTICIPANT  ###################
    // #########################################################################################

    /**
     * @notice Transfer SIGH to the user. Called by the corresponding IToken Contract of the instrument
     * @dev Note: If there is not enough SIGH, we do not perform the transfer call.
     * @param instrument The instrument for which the SIGH has been accured
     * @param user The address of the user to transfer SIGH to
     * @param sigh_Amount The amount of SIGH to (possibly) transfer
     * @return The amount of SIGH which was NOT transferred to the user
     */
    function transferSighTotheUser(address instrument, address user, address sighAccuredTo, uint sigh_Amount) external  returns (uint) {   // onlyITokenContract(instrument)
        uint sigh_not_transferred = 0;
        if ( Sigh_Address.balanceOf(address(this)) > sigh_Amount ) {   // NO SIGH TRANSFERRED IF CONTRACT LACKS REQUIRED SIGH AMOUNT
            require(Sigh_Address.transfer( sighAccuredTo, sigh_Amount ), "Failed to transfer accured SIGH to the user." );
            if (sighAccuredTo == addressesProvider.getSIGHStaking() ) {                          // When SIGH is directly being streamed to the Staking Contract
                ISighStaking stakingContract = ISighStaking(addressesProvider.getSIGHStaking());
                require(stakingContract.updateStakedBalanceForStreaming(user,sigh_Amount ),"Failed to update Staked balance");       // UPDATES STAKED BALANCE (STREAMING SIGH FUNCTIONALITY) 
            }
            emit AccuredSIGHTransferredToTheUser( instrument, user, sigh_Amount );
        }
        else {
            sigh_not_transferred = sigh_Amount;
        }
        return sigh_not_transferred;
    }

    // #########################################################
    // ################### GENERAL PARAMETER FUNCTIONS ###################
    // #########################################################

    function getSIGHBalance() public view returns (uint) {
        uint sigh_Remaining = Sigh_Address.balanceOf(address(this));
        return sigh_Remaining;
    }

    function getAllInstrumentsSupported() external view returns (address[] memory ) {
        return all_Instruments; 
    }
    
    function getInstrumentData (address instrument_) external view returns (string memory name, address iTokenAddress, uint decimals, bool isSIGHMechanismActivated,uint256 supplyindex, uint256 borrowindex  ) {
        return ( financial_instruments[instrument_].name,
                 financial_instruments[instrument_].iTokenAddress,    
                 financial_instruments[instrument_].decimals,    
                 financial_instruments[instrument_].isSIGHMechanismActivated,
                 financial_instruments[instrument_].supplyindex,
                 financial_instruments[instrument_].borrowindex
                ); 
    }

    function getInstrumentSighMechansimStates(address instrument) external view returns (uint suppliers_speed, uint borrowers_speed, uint staking_speed, uint _24HrVolatility, string memory side, uint percentTotalVolatility ) {
        return (Instrument_Sigh_Mechansim_States[instrument].suppliers_Speed, 
                Instrument_Sigh_Mechansim_States[instrument].borrowers_Speed , 
                Instrument_Sigh_Mechansim_States[instrument].staking_Speed,
                Instrument_Sigh_Mechansim_States[instrument]._24HrVolatility,
                Instrument_Sigh_Mechansim_States[instrument].side,
                Instrument_Sigh_Mechansim_States[instrument].percentTotalVolatility
                );
    }

    function getAllPriceSnapshots(address instrument_ ) external view returns (uint256[24] memory) {
        return instrumentPriceCycles[instrument_].recordedPriceSnapshot;
    }
    
    function getBlockNumbersForPriceSnapshots() external view returns (uint256[24] memory) {
        return blockNumbersForPriceSnapshots_;
    }

    function getSIGHSpeed() external view returns (uint) {
        return SIGHSpeed;
    }

    function isInstrumentSupported (address instrument_) external view returns (bool) {
        return financial_instruments[instrument_].isListed;
    } 

    function totalInstrumentsSupported() external view returns (uint) {
        return uint(all_Instruments.length); 
    }    

    function getInstrumentSupplyIndex(address instrument_) external view returns (uint) {
        if (financial_instruments[instrument_].isListed) { //"The provided instrument address is not supported");
            return financial_instruments[instrument_].supplyindex;
        }
        return uint(0);
    }

    function getInstrumentBorrowIndex(address instrument_) external view returns (uint) {
        if (financial_instruments[instrument_].isListed) { //,"The provided instrument address is not supported");
            return financial_instruments[instrument_].borrowindex;
        }
        return uint(0);
    }


    function getupperCheckProfitPercentage () external view returns (uint) {
        return upperCheckProfitPercentage.mantissa;
    } 

    function checkPriceSnapshots(address instrument_, uint clock) external view returns (uint256) {
        return instrumentPriceCycles[instrument_].recordedPriceSnapshot[clock];
    }
    
    function checkinitializationCounter(address instrument_) external view returns (uint32) {
        return instrumentPriceCycles[instrument_].initializationCounter;
    }

    function getDeltaBlocksForSpeed() external view returns (uint) {
        return deltaBlocksForSpeed;
    }  

    function getPrevSpeedRefreshBlock() external view returns (uint) {
        return prevSpeedRefreshBlock;
    }  

    function getBlocksRemainingToNextSpeedRefresh() external view returns (uint) {
        uint blocksElapsed = sub_(block.number,prevSpeedRefreshBlock); 
        if ( deltaBlocksForSpeed > blocksElapsed) {
            return sub_(deltaBlocksForSpeed,blocksElapsed);
        }
        return uint(0);
    }
    
    function getBlockNumber() public view returns (uint32) {
        return uint32(block.number);
    }
    
    

}
