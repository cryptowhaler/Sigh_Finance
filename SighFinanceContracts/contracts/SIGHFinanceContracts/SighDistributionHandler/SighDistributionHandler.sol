pragma solidity ^0.5.16;

/**
 * @title Sigh Distribution Handler Contract
 * @notice Handles the SIGH Loss Minimizing Mechanism for the Lending Protocol
 * @dev Accures SIGH for the supported markets based on losses made every 24 hours, along with Staking speeds. This accuring speed is updated every hour
 * @author SIGH Finance
 */

import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol"; 
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol"; 
import "../Math/Exponential.sol";
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";

import "../../Configuration/GlobalAddressesProvider.sol";
import "../../LendingProtocolContracts/interfaces/IPriceOracleGetter.sol";            

import "../../LendingProtocolContracts/interfaces/ILendingPoolCore.sol";     
import "../Interfaces/ISighStaking.sol";       


contract SIGHDistributionHandler is Exponential, ReentrancyGuard, VersionedInitializable {       // 
    
// ######## CONTRACT ADDRESSES ########
    GlobalAddressesProvider public addressesProvider;
    IERC20 public Sigh_Address;
    IPriceOracleGetter public oracle;
    ILendingPoolCore public lendingPoolCore;

    uint constant sighInitialIndex = 1e36;            ///  The initial SIGH index for a market

    Exp private cryptoMarketSentiment = Exp({mantissa: 1e18 });  

    // TOTAL Protocol Volatility Values (Current Session)
    uint256 private last24HrsTotalProtocolVolatility = 0;
    uint256 private last24HrsSentimentProtocolVolatility = 0;
    uint256 private deltaBlockslast24HrSession = 0;
    
    // SIGH Speed is set by SIGH Finance Manager. SIGH Speed Used = Calculated based on "cryptoMarketSentiment" & "last24HrsSentimentProtocolVolatility"
    uint private SIGHSpeed;
    uint private SIGHSpeedUsed;

    address[] private all_Instruments;    // LIST OF INSTRUMENTS 

// ######## INDIVIDUAL INSTRUMENT STATE ########

    struct SIGHInstrument {
        bool isListed;
        string name;
        address iTokenAddress;
        address sighStreamAddress;
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

    struct Instrument_Sigh_Mechansim_State {
        uint8 side;                                         // side = enum{Suppliers,Borrowers,inactive}
        uint256 bearSentiment;                               // Volatility Limit Ratio = bearSentiment (if side == Suppliers)
        uint256 bullSentiment;                 // Volatility Limit Ratio = bearSentiment (if side == Borrowers)
        uint256 _total24HrVolatility;                        // TOTAL VOLATILITY = Total Compounded Balance * Price Difference
        uint256 _total24HrSentimentVolatility;                  // Volatility Limit Amount = TOTAL VOLATILITY * (Volatility Limit Ratio) / 1e18
        uint256 percentTotalVolatility;                      // TOTAL VOLATILITY / last24HrsTotalProtocolVolatility
        uint256 percentTotalSentimentVolatility;           // Volatility Limit Amount / last24HrsSentimentProtocolVolatility
        uint256 suppliers_Speed;
        uint256 borrowers_Speed;
        uint256 staking_Speed;
    }

    mapping(address => Instrument_Sigh_Mechansim_State) private Instrument_Sigh_Mechansim_States;
    uint256 private deltaBlocksForSpeed = 1; // 60 * 60 
    uint256 private prevSpeedRefreshBlock;


    // ####################################
    // ############## EVENTS ##############
    // ####################################

    event InstrumentAdded (address instrumentAddress_, address iTokenAddress, address sighStreamAddress,  uint decimals , uint blockNumber); 
    event InstrumentRemoved(address _instrument, uint blockNumber); 
    event InstrumentSIGHStateUpdated( address instrument_, bool isSIGHMechanismActivated, uint bearSentiment, uint bullSentiment );

    event SIGHSpeedUpdated(uint oldSIGHSpeed, uint newSIGHSpeed, uint blockNumber_);     /// Emitted when SIGH speed is changed
    event CryptoMarketSentimentUpdated( uint cryptoMarketSentiment );
    event minimumBlocksForSpeedRefreshUpdated( uint prevDeltaBlocksForSpeed,uint newDeltaBlocksForSpeed, uint blockNumber );

    event StakingSpeedUpdated(address instrumentAddress_ , uint prevStakingSpeed, uint new_staking_Speed, uint blockNumber );
    
    event PriceSnapped(address instrument, uint prevPrice, uint currentPrice, uint deltaBlocks, uint currentClock );   
    event MaxSIGHSpeedCalculated(uint _SIGHSpeed, uint _SIGHSpeedUsed, uint _totalVolatilityLimitPerBlock, uint _maxVolatilityToAddressPerBlock, uint _max_SIGHDistributionLimitDecimalsAdjusted );
    event InstrumentVolatilityCalculated(address _Instrument, uint _total24HrVolatility , uint _total24HrSentimentVolatility);
    event refreshingSighSpeeds( address _Instrument, uint8 side,  uint supplierSpeed, uint borrowerSpeed, uint _percentTotalSentimentVolatility, uint _percentTotalVolatility );
    

    event SIGHSupplyIndexUpdated(address instrument, uint totalCompoundedSupply, uint sighAccured, uint ratioMantissa, uint newIndexMantissa,  uint blockNum );
    event SIGHBorrowIndexUpdated(address instrument, uint totalCompoundedStableBorrows, uint totalCompoundedVariableBorrows, uint sighAccured, uint ratioMantissa, uint newIndexMantissa );

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
    modifier onlySighStreamContract(address instrument) {
           SIGHInstrument memory currentInstrument = financial_instruments[instrument];
           require( currentInstrument.isListed, "This instrument is not supported by SIGH Distribution Handler");
           require( msg.sender == currentInstrument.sighStreamAddress, "This function can only be called by the Instrument's SIGH Streams Handler Contract");
        _;
    }
        
// ######################################################################################
// ##############        PROXY RELATED  & ADDRESSES INITIALIZATION        ###############
// ######################################################################################

    uint256 constant private SIGH_DISTRIBUTION_REVISION = 0x1;

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
// ##############        1. addInstrument() : Adds an instrument. Called by LendingPoolCore                              ######################################################
// ##############        2. removeInstrument() : Instrument supported by Sigh Distribution. Called by Sigh Finance Configurator   #####################
// ##############        3. Instrument_SIGH_StateUpdated() : Activate / Deactivate SIGH Mechanism, update Volatility Limits for Suppliers / Borrowers ###############
// #####################################################################################################################################################

    /**
    * @dev adds an instrument - Called by LendingPool Core when an instrument is added to the Lending Protocol
    * @param _instrument the instrument object
    * @param _iTokenAddress the address of the overlying iToken contract
    * @param _decimals the number of decimals of the underlying asset
    **/
    function addInstrument( address _instrument, address _iTokenAddress, address _sighStreamAddress, uint256 _decimals ) external onlyLendingPoolCore returns (bool) {
        require(!financial_instruments[_instrument].isListed ,"Instrument already supported.");

        all_Instruments.push(_instrument); // ADD THE INSTRUMENT TO THE LIST OF SUPPORTED INSTRUMENTS
        ERC20Detailed instrumentContract = ERC20Detailed(_iTokenAddress);

        // STATE UPDATED : INITIALIZE INNSTRUMENT DATA
        financial_instruments[_instrument] = SIGHInstrument( {  isListed: true, 
                                                                name: instrumentContract.name(),
                                                                iTokenAddress: _iTokenAddress,
                                                                sighStreamAddress: _sighStreamAddress,
                                                                decimals: _decimals, 
                                                                isSIGHMechanismActivated: false, 
                                                                supplyindex: sighInitialIndex, // ,"sighInitialIndex exceeds 224 bits"), 
                                                                supplylastupdatedblock: getBlockNumber(), 
                                                                borrowindex : sighInitialIndex, //,"sighInitialIndex exceeds 224 bits"), 
                                                                borrowlastupdatedblock : getBlockNumber()
                                                                } );
        // STATE UPDATED : INITITALIZE INSTRUMENT SPEEDS
        Instrument_Sigh_Mechansim_States[_instrument] = Instrument_Sigh_Mechansim_State({ 
                                                            side: uint8(0) ,
                                                            bearSentiment : uint(1e18),
                                                            bullSentiment: uint(1e18),
                                                            suppliers_Speed: uint(0),
                                                            borrowers_Speed: uint(0),
                                                            staking_Speed: uint(0),
                                                            _total24HrVolatility: uint(0),
                                                            _total24HrSentimentVolatility: uint(0),
                                                            percentTotalVolatility: uint(0),
                                                            percentTotalSentimentVolatility: uint(0)
                                                        } );
                                                        

        // STATE UPDATED : INITIALIZE PRICECYCLES
        if ( instrumentPriceCycles[_instrument].initializationCounter == 0 ) {
            uint256[24] memory emptyPrices;
            instrumentPriceCycles[_instrument] = InstrumentPriceCycle({ recordedPriceSnapshot : emptyPrices, initializationCounter: uint32(0) }) ;
        }   

        emit InstrumentAdded(_instrument,_iTokenAddress, _sighStreamAddress,  _decimals, block.number); 
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
    * @dev Instrument to be convered under the SIGH DIstribution Mechanism and the associated Volatility Limits - Decided by the SIGH Finance Manager who 
    * can call this function through the Sigh Finance Configurator
    * @param instrument_ the instrument object
    **/
    function Instrument_SIGH_StateUpdated(address instrument_, uint _bearSentiment,uint _bullSentiment, bool _isSIGHMechanismActivated  ) external onlySighFinanceConfigurator returns (bool) {                   // 
        require(financial_instruments[instrument_].isListed ,"Instrument not supported.");
        require( _bearSentiment >= 0.01e18, 'The new Volatility Limit for Suppliers must be greater than 0.01e18 (1%)');
        require( _bearSentiment <= 10e18, 'The new Volatility Limit for Suppliers must be less than 10e18 (10x)');
        require( _bullSentiment >= 0.01e18, 'The new Volatility Limit for Borrowers must be greater than 0.01e18 (1%)');
        require( _bullSentiment <= 10e18, 'The new Volatility Limit for Borrowers must be less than 10e18 (10x)');
        refreshSIGHSpeeds(); 
        
        financial_instruments[instrument_].isSIGHMechanismActivated = _isSIGHMechanismActivated;                       // STATE UPDATED
        Instrument_Sigh_Mechansim_States[instrument_].bearSentiment = _bearSentiment;      // STATE UPDATED
        Instrument_Sigh_Mechansim_States[instrument_].bullSentiment = _bullSentiment;      // STATE UPDATED
        
        emit InstrumentSIGHStateUpdated( instrument_, financial_instruments[instrument_].isSIGHMechanismActivated, Instrument_Sigh_Mechansim_States[instrument_].bearSentiment, Instrument_Sigh_Mechansim_States[instrument_].bullSentiment );
        return true;
    }
    

// ###########################################################################################################################
// ##############        GLOBAL SIGH SPEED AND SIGH SPEED RATIO FOR A MARKET          ########################################
// ##############        1. updateSIGHSpeed() : Governed by Sigh Finance Manager          ####################################
// ##############        3. updateStakingSpeedForAnInstrument():  Decided by the SIGH Finance Manager          ###############
// ##############        5. updateDeltaBlocksForSpeedRefresh() : Decided by the SIGH Finance Manager           ###############
// ###########################################################################################################################

    /**
     * @notice Sets the amount of Global SIGH distributed per block - - Decided by the SIGH Finance Manager who 
     * can call this function through the Sigh Finance Configurator
     * @param SIGHSpeed_ The amount of SIGH wei per block to distribute
     */
    function updateSIGHSpeed(uint SIGHSpeed_) external onlySighFinanceConfigurator returns (bool) {     
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

    function updateCryptoMarketSentiment ( uint cryptoMarketSentiment_ ) external onlySighFinanceConfigurator returns (bool) {
        require( cryptoMarketSentiment_ >= 0.01e18, 'The new Volatility Limit for Borrowers must be greater than 0.01e18 (1%)');
        require( cryptoMarketSentiment_ <= 10e18, 'The new Volatility Limit for Borrowers must be less than 10e18 (10x)');
        
        cryptoMarketSentiment = Exp({mantissa: cryptoMarketSentiment_ });  
        emit CryptoMarketSentimentUpdated( cryptoMarketSentiment.mantissa );
        return true;
    }

    // #########################################################################################################
    // ################ REFRESH SIGH DISTRIBUTION SPEEDS FOR INSTRUMENTS (INITIALLY EVERY HOUR) ################
    // #########################################################################################################

    /**
     * @notice Recalculate and update SIGH speeds for all Supported SIGH markets
     */
    function refreshSIGHSpeeds() public nonReentrant returns (bool) {
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

        Exp memory totalProtocolVolatility = Exp({mantissa: 0});                            // TOTAL LOSSES (Over past 24 hours)
        Exp memory totalProtocolVolatilityLimit = Exp({mantissa: 0});                            // TOTAL LOSSES (Over past 24 hours)
        
        // Price Snapshot for current clock replaces the pervious price snapshot
        // DELTA BLOCKS = CURRENT BLOCK - 24HRS_OLD_STORED_BLOCK_NUMBER
        // LOSS PER INSTRUMENT = PREVIOUS PRICE (STORED) - CURRENT PRICE (TAKEN FROM ORACLE)
        // TOTAL VOLATILITY OF AN INSTRUMENT = LOSS PER INSTRUMENT * TOTAL COMPOUNDED LIQUIDITY
        // VOLATILITY OF AN INSTRUMENT TO BE ACCOUNTED FOR = TOTAL VOLATILITY OF AN INSTRUMENT * VOLATILITY LIMIT (DIFFERENT FOR SUPPLIERS/BORROWERS OF INSTRUMENT)
        // TOTAL PROTOCOL VOLATILITY =  + ( VOLATILITY OF AN INSTRUMENT TO BE ACCOUNTED FOR )
        for (uint i = 0; i < all_Instruments_.length; i++) {

            address _currentInstrument = all_Instruments_[i];       // Current Instrument
            
            // UPDATING PRICE SNAPSHOTS
            Exp memory previousPriceETH = Exp({ mantissa: instrumentPriceCycles[_currentInstrument].recordedPriceSnapshot[curClock] });            // 24hr old price snapshot
            Exp memory currentPriceETH = Exp({ mantissa: oracle.getAssetPrice( _currentInstrument ) });                                            // current price from the oracle
            require ( currentPriceETH.mantissa > 0, "refreshSIGHSpeedsInternal : Oracle returned Invalid Price" );
            instrumentPriceCycles[_currentInstrument].recordedPriceSnapshot[curClock] =  uint256(currentPriceETH.mantissa); //  STATE UPDATED : PRICE SNAPSHOT TAKEN        
            emit PriceSnapped(_currentInstrument, previousPriceETH.mantissa, instrumentPriceCycles[_currentInstrument].recordedPriceSnapshot[curClock], deltaBlocks_, curClock );

            if ( !financial_instruments[_currentInstrument].isSIGHMechanismActivated || instrumentPriceCycles[_currentInstrument].initializationCounter != uint32(24) ) {     // if LOSS MINIMIZNG MECHANISM IS NOT ACTIVATED FOR THIS INSTRUMENT
                // STATE UPDATE
                Instrument_Sigh_Mechansim_States[_currentInstrument].side = uint8(0);
                Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrVolatility =  uint(0);
                Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrSentimentVolatility =  uint(0);
                //    Newly Sighed Instrument needs to reach 24 (priceSnapshots need to be taken) before it can be assigned a Sigh Speed based on VOLATILITY   
                if (instrumentPriceCycles[_currentInstrument].initializationCounter < uint32(24) ) {
                    instrumentPriceCycles[_currentInstrument].initializationCounter = uint32(add_(instrumentPriceCycles[_currentInstrument].initializationCounter , uint32(1) , 'Price Counter addition failed.'));  // STATE UPDATE : INITIALIZATION COUNTER UPDATED
                }
            }
            else {
                MathError error;
                Exp memory volatility = Exp({mantissa: 0});
                Exp memory lossPerInstrument = Exp({mantissa: 0});   
                Exp memory instrumentVolatilityLimit = Exp({mantissa: 0});
                
                if ( greaterThanExp(previousPriceETH , currentPriceETH) ) {   // i.e the price has decreased so we calculate Losses accured by Suppliers of the Instrument
                    uint totalCompoundedLiquidity = IERC20(financial_instruments[_currentInstrument].iTokenAddress).totalSupply(); // Total Compounded Liquidity
                    ( error, lossPerInstrument) = subExp( previousPriceETH , currentPriceETH );       
                    ( error, volatility ) = mulScalar( lossPerInstrument, totalCompoundedLiquidity );
                    instrumentVolatilityLimit = Exp({mantissa: Instrument_Sigh_Mechansim_States[_currentInstrument].bearSentiment });
                    // STATE UPDATE
                    Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrVolatility =  adjustForDecimalsInternal(volatility.mantissa, financial_instruments[_currentInstrument].decimals , oracle.getAssetPriceDecimals(_currentInstrument) );
                    Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrSentimentVolatility =  mul_(Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrVolatility , instrumentVolatilityLimit );
                    Instrument_Sigh_Mechansim_States[_currentInstrument].side = uint8(1);
                }
                else {                                              // i.e the price has increased so we calculate Losses accured by Borrowers of the Instrument
                    uint totalVariableBorrows =  lendingPoolCore.getInstrumentCompoundedBorrowsVariable(_currentInstrument);
                    uint totalStableBorrows =  lendingPoolCore.getInstrumentCompoundedBorrowsStable(_currentInstrument);
                    uint totalCompoundedBorrows =  add_(totalVariableBorrows,totalStableBorrows,'Compounded Borrows Addition gave error'); 
                    ( error, lossPerInstrument) = subExp( currentPriceETH, previousPriceETH );       
                    ( error, volatility ) = mulScalar( lossPerInstrument, totalCompoundedBorrows );
                    instrumentVolatilityLimit = Exp({mantissa: Instrument_Sigh_Mechansim_States[_currentInstrument].bullSentiment });
                    // STATE UPDATE
                    Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrVolatility = adjustForDecimalsInternal(volatility.mantissa , financial_instruments[_currentInstrument].decimals , oracle.getAssetPriceDecimals(_currentInstrument) );
                    Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrSentimentVolatility =  mul_(Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrVolatility , instrumentVolatilityLimit );
                    Instrument_Sigh_Mechansim_States[_currentInstrument].side = uint8(2);
                }
                //  Total Protocol Volatility  += Instrument Volatility 
                totalProtocolVolatility = add_(totalProtocolVolatility, Exp({mantissa: Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrVolatility}) );            
                //  Total Protocol Volatility Limit  += Instrument Volatility Limit Amount                 
                 totalProtocolVolatilityLimit = add_(totalProtocolVolatilityLimit, Exp({mantissa: Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrSentimentVolatility})) ;            
            }
            emit InstrumentVolatilityCalculated(_currentInstrument, Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrVolatility , Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrSentimentVolatility);
        }
        
       
        last24HrsTotalProtocolVolatility = totalProtocolVolatility.mantissa;              // STATE UPDATE : Last 24 Hrs Protocol Volatility  (i.e SUM(_total24HrVolatility for Instruments))  Updated
        last24HrsSentimentProtocolVolatility = totalProtocolVolatilityLimit.mantissa;     // STATE UPDATE : Last 24 Hrs Protocol Volatility Limit (i.e SUM(_total24HrSentimentVolatility for Instruments)) Updated
        deltaBlockslast24HrSession = deltaBlocks_;                               // STATE UPDATE :
        
        // STATE UPDATE :: CALCULATING SIGH SPEED WHICH IS TO BE USED FOR CALCULATING EACH INSTRUMENT's SIGH DISTRIBUTION SPEEDS
        SIGHSpeedUsed = SIGHSpeed;

        (MathError error, Exp memory totalVolatilityLimitPerBlock) = divScalar(Exp({mantissa: last24HrsSentimentProtocolVolatility }) , deltaBlocks_);   // Total Volatility per Block
        calculateMaxSighSpeedInternal( totalVolatilityLimitPerBlock.mantissa ); 
        
        // ###### Updates the Speed (Volatility Driven) for the Supported Instruments ######
        updateSIGHDistributionSpeeds();
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
    
    // UPDATES SIGH DISTRIBUTION SPEEDS
    function updateSIGHDistributionSpeeds() internal returns (bool) {
        
        for (uint i=0 ; i < all_Instruments.length ; i++) {

            address _currentInstrument = all_Instruments[i];       // Current Instrument
            Exp memory limitVolatilityRatio =  Exp({mantissa: 0});
            Exp memory totalVolatilityRatio =  Exp({mantissa: 0});
            MathError error;
            
            if ( last24HrsSentimentProtocolVolatility > 0 && Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrSentimentVolatility > 0 ) {
                ( error, limitVolatilityRatio) = getExp(Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrSentimentVolatility, last24HrsSentimentProtocolVolatility);
                ( error, totalVolatilityRatio) = getExp(Instrument_Sigh_Mechansim_States[_currentInstrument]._total24HrVolatility, last24HrsTotalProtocolVolatility);
                // CALCULATING $SIGH SPEEDS
                if (Instrument_Sigh_Mechansim_States[_currentInstrument].side == uint8(1) ) {
                    // STATE UPDATE
                    Instrument_Sigh_Mechansim_States[_currentInstrument].suppliers_Speed = mul_(SIGHSpeedUsed, limitVolatilityRatio);                                         
                    Instrument_Sigh_Mechansim_States[_currentInstrument].borrowers_Speed = uint(0);                                                           
                } 
                else if  (Instrument_Sigh_Mechansim_States[_currentInstrument].side == uint8(2) )  {
                    // STATE UPDATE
                    Instrument_Sigh_Mechansim_States[_currentInstrument].borrowers_Speed = mul_(SIGHSpeedUsed, limitVolatilityRatio);                                       
                    Instrument_Sigh_Mechansim_States[_currentInstrument].suppliers_Speed = uint(0);                                                          
                }
            } 
            else {
                    // STATE UPDATE
                Instrument_Sigh_Mechansim_States[_currentInstrument].borrowers_Speed = uint(0);                                                               
                Instrument_Sigh_Mechansim_States[_currentInstrument].suppliers_Speed = uint(0);                                                                
            }

            Instrument_Sigh_Mechansim_States[_currentInstrument].percentTotalSentimentVolatility = mul_(10**9, limitVolatilityRatio);                                              // STATE UPDATE (LOss Ratio is instrumentVolatility/totalVolatility * 100000 )
            Instrument_Sigh_Mechansim_States[_currentInstrument].percentTotalVolatility = mul_(10**9, totalVolatilityRatio);                                              // STATE UPDATE (LOss Ratio is instrumentVolatility/totalVolatility * 100000 )
            emit refreshingSighSpeeds( _currentInstrument, Instrument_Sigh_Mechansim_States[_currentInstrument].side,  Instrument_Sigh_Mechansim_States[_currentInstrument].suppliers_Speed, Instrument_Sigh_Mechansim_States[_currentInstrument].borrowers_Speed, Instrument_Sigh_Mechansim_States[_currentInstrument].percentTotalSentimentVolatility, Instrument_Sigh_Mechansim_States[_currentInstrument].percentTotalVolatility );
        }
    }





    // returns the currently maximum possible SIGH Distribution speed. Called only when upper check is activated
    // Updated the Global "SIGHSpeedUsed" Variable & "last24HrsSentimentProtocolVolatilityAddressedPerBlock" Variable
    function calculateMaxSighSpeedInternal( uint totalVolatilityLimitPerBlock ) internal {
        uint current_Sigh_PriceETH = oracle.getAssetPrice( address(Sigh_Address) );   
        ERC20Detailed sighContract = ERC20Detailed(address(Sigh_Address));
        uint priceDecimals = oracle.getAssetPriceDecimals(address(Sigh_Address));
        uint sighDecimals =  sighContract.decimals();
        require(current_Sigh_PriceETH > 0,"Oracle returned invalid $SIGH Price!");

        // MAX Value that can be distributed per block through SIGH Distribution
        uint max_SIGHDistributionLimit = mul_( current_Sigh_PriceETH, SIGHSpeed );   
        uint max_SIGHDistributionLimitDecimalsAdjusted = adjustForDecimalsInternal( max_SIGHDistributionLimit,sighDecimals , priceDecimals  );

        // MAX Volatility that is allowed to be covered through SIGH Distribution (% of the Harvestable Volatility)
        uint maxVolatilityToAddressPerBlock = mul_(totalVolatilityLimitPerBlock, cryptoMarketSentiment ); // (a * b)/1e18 [b is in Exp Scale]


        if ( max_SIGHDistributionLimitDecimalsAdjusted >  maxVolatilityToAddressPerBlock ) {
            uint maxVolatilityToAddress_SIGHdecimalsMul = mul_( maxVolatilityToAddressPerBlock, uint(10**(sighDecimals)), "Max Volatility : SIGH Decimals multiplication gave error" );
            uint maxVolatilityToAddress_PricedecimalsMul = mul_( maxVolatilityToAddress_SIGHdecimalsMul, uint(10**(priceDecimals)), "Max Volatility : Price Decimals multiplication gave error" );
            uint maxVolatilityToAddress_DecimalsDiv = div_( maxVolatilityToAddress_PricedecimalsMul, uint(10**18), "Max Volatility : Decimals division gave error" );
            SIGHSpeedUsed = div_( maxVolatilityToAddress_DecimalsDiv, current_Sigh_PriceETH, "Max Speed division gave error" );
        }

        emit MaxSIGHSpeedCalculated(SIGHSpeed, SIGHSpeedUsed, totalVolatilityLimitPerBlock, maxVolatilityToAddressPerBlock, max_SIGHDistributionLimitDecimalsAdjusted  );
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
            Double memory ratio = totalCompoundedLiquidity > 0 ? fraction(sigh_Accrued, totalCompoundedLiquidity) : Double({mantissa: 0});    // SIGH Accured per Supplied Instrument Token
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
            emit SIGHBorrowIndexUpdated( currentInstrument, totalStableBorrows, totalVariableBorrows, sigh_Accrued, ratio.mantissa , newIndex.mantissa );

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
    function transferSighTotheUser(address instrument, address user, uint sigh_Amount ) external onlySighStreamContract(instrument) returns (uint) {   // 
        uint sigh_not_transferred = 0;
        if ( Sigh_Address.balanceOf(address(this)) > sigh_Amount ) {   // NO SIGH TRANSFERRED IF CONTRACT LACKS REQUIRED SIGH AMOUNT
            require(Sigh_Address.transfer( user, sigh_Amount ), "Failed to transfer accured SIGH to the user." );
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

    function getInstrumentSpeeds(address instrument) external view returns ( uint8 side, uint suppliers_speed, uint borrowers_speed, uint staking_speed ) {
        return ( Instrument_Sigh_Mechansim_States[instrument].side,
                 Instrument_Sigh_Mechansim_States[instrument].suppliers_Speed, 
                 Instrument_Sigh_Mechansim_States[instrument].borrowers_Speed , 
                 Instrument_Sigh_Mechansim_States[instrument].staking_Speed
                );
    }
    
    function getInstrumentVolatilityStates(address instrument) external view returns ( uint8 side, uint _total24HrSentimentVolatility, uint percentTotalSentimentVolatility, uint _total24HrVolatility, uint percentTotalVolatility  ) {
        return (Instrument_Sigh_Mechansim_States[instrument].side,
                Instrument_Sigh_Mechansim_States[instrument]._total24HrSentimentVolatility,
                Instrument_Sigh_Mechansim_States[instrument].percentTotalSentimentVolatility,
                Instrument_Sigh_Mechansim_States[instrument]._total24HrVolatility,
                Instrument_Sigh_Mechansim_States[instrument].percentTotalVolatility
                );
    }    

    function getInstrumentSighLimits(address instrument) external view returns ( uint _bearSentiment , uint _bullSentiment ) {
    return ( Instrument_Sigh_Mechansim_States[instrument].bearSentiment, Instrument_Sigh_Mechansim_States[instrument].bullSentiment );
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

    function getSIGHSpeedUsed() external view returns (uint) {
        return SIGHSpeedUsed;
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


    function getCryptoMarketSentiment () external view returns (uint) {
        return cryptoMarketSentiment.mantissa;
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

    function getLast24HrsTotalProtocolVolatility() external view returns (uint) {
        return last24HrsTotalProtocolVolatility;
    }

    function getLast24HrsTotalSentimentProtocolVolatility() external view returns (uint) {
        return last24HrsSentimentProtocolVolatility;
    }
    
    function getDeltaBlockslast24HrSession() external view returns (uint) {
        return deltaBlockslast24HrSession;
    }

    function getBlockNumber() public view returns (uint32) {
        return uint32(block.number);
    }
    
    

}
