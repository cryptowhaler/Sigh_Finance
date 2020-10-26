pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol"; 
import "../Math/Exponential.sol";

import "../../Configuration/GlobalAddressesProvider.sol";
import "./PriceOracle.sol";            

// import "../ProtocolContracts/interfaces/ITokenInterface.sol";
import "../../ProtocolContracts/lendingpool/LendingPoolCore.sol";      // REPLACE WITH AN INTER

contract SIGHDistributionHandler is Exponential, VersionedInitializable {
    
// ######## CONTRACT ADDRESSES ########
    GlobalAddressesProvider public addressesProvider;
    PriceOracle public oracle;
    address public Sigh_Address;

// ######## PARAMETERS ########
    uint public constant SIGH_ClaimThreshold = 0.001e18;        ///  The threshold above which the flywheel transfers SIGH, in wei
    uint224 public constant sighInitialIndex = 1e36;            ///  The initial SIGH index for a market

    bool public isSpeedUpperCheckAllowed = false;
    Exp private upperCheckProfitPercentage = Exp({ mantissa : 0 });  

    IERC20[] public all_Instruments;    // LIST OF INSTRUMENTS 

// ######## INDIVIDUAL INSTRUMENT ########

    struct SIGHInstrument {
        bool isListed;
        address iTokenAddress;
        uint256 decimals;
        bool isCoverDipsMechanismActivated;
        uint256 supplyindex;
        uint256 supplylastupdatedblock;
        uint256 borrowindex;
        uint256 borrowlastupdatedblock;
    }

    mapping (address => SIGHInstrument) financial_instruments;    // FINANCIAL INSTRUMENTS
    
// ######## 24 HOUR PRICE HISTORY FOR EACH INSTRUMENT AND THE BLOCK NUMBER WHEN THEY WERE TAKEN ########

    struct InstrumentPriceCycle {
        uint256[24] recordedPriceSnapshot;
        uint32 initializationCounter;
    }

    mapping(address => InstrumentPriceCycle) public instrumentPriceCycles;    
    uint256[24] public blockNumbersForPriceSnapshots_;
    uint224 public curClock;

// ######## SIGH DISTRIBUTION SPEED FOR EACH INSTRUMENT ########

    uint public SIGHSpeed;

    struct Instrument_Sigh_Speed {
        uint256 suppliers_Speed;
        uint256 borrowers_Speed;
        uint256 speeds_Ratio_Mantissa;
        uint256 staking_Speed;
    }

    mapping(address => Instrument_Sigh_Speed) public Instrument_Sigh_Speeds;
    uint256 public deltaBlocksForSpeed = 1; // 60 * 60 
    uint256 public prevSpeedRefreshBlock;









    mapping(address => mapping(address => uint)) public SIGHSupplierIndex;
    mapping(address => mapping(address => uint)) public SIGHBorrowerIndex;

    mapping(address => uint) public SIGH_Accrued;               /// @notice The SIGH accrued but not yet transferred to each user



    event MarketAdded (address instrumentAddress_, address iTokenAddress, uint blockNumber); 
    event InstrumentSIGHed(address instrumentAddress_, address iTokenAddress, bool isCoverDripsMechanismActivated);    /// @notice Emitted when market isCoverDripsMechanismActivated status is changed

    event NewSIGHSpeed(uint oldSIGHSpeed, uint newSIGHSpeed, uint blockNumber_);     /// @notice Emitted when SIGH rate is changed
    event StakingSpeedUpdated(address instrumentAddress_, address iTokenAddress, uint prevStakingSpeed, uint new_staking_Speed, uint blockNumber );
    event SuppliersSIGHSpeedUpdated(address instrument, address iToken, uint prevSpeed, uint newSpeed, uint blockNumber);  /// @notice Emitted when a new SIGH speed is calculated for an Instrument
    event BorrowersSIGHSpeedUpdated(address instrument, address iToken, uint prevSpeed, uint newSpeed, uint blockNumber);  /// @notice Emitted when a new SIGH speed is calculated for an Instrument
    event SpeedUpperCheckSwitched(bool previsSpeedUpperCheckAllowed, bool isSpeedUpperCheckAllowed );

    event ClockUpdated( uint224 prevClock, uint224 curClock, uint timestamp, uint blockNumber );
    event PriceSnapped(address instrument, address iToken, uint prevPrice, uint currentPrice, uint currentClock);   /// @notice Emitted when Price snapshot is taken

    event Instrument_Sigh_Speed_Supplier_Ratio_Mantissa_Updated(address iToken, uint prevRatio, uint newRatio);

    /// @notice Emitted when SIGH is distributed to a supplier
    event DistributedSupplier_SIGH(ITokenInterface iToken, address supplier, uint sighDelta, uint sighSupplyIndex);

    /// @notice Emitted when SIGH is distributed to a borrower
    event DistributedBorrower_SIGH(ITokenInterface iToken, address borrower, uint sighDelta, uint sighBorrowIndex);

    /// @notice Emitted when SIGH is transferred to a User
    event SIGH_Transferred(address userAddress, uint amountTransferred );

    


    event PriceSnappedCheck(address iToken, uint prevPrice, uint currentPrice,uint32 currentCounter, uint blockNumber);


// #######################################################
// ##############        MODIFIERS          ##############
// #######################################################
        
    //only LendingPoolCore can use functions affected by this modifier
    modifier onlyLendingPoolCore {
        require(addressesProvider.getLendingPoolCore() == msg.sender, "The caller must be the Lending pool Core contract");
        _;
    }   
    
    //only SIGH Distribution Manager can use functions affected by this modifier
    modifier onlySighFinanceConfigurator {
        require(addressesProvider.getSIGHFinanceConfigurator() == msg.sender, "The caller must be the SIGH Finanace Configurator Contract");
        _;
    }

    // This function can only be called by the Instrument's IToken Contract
    modifier onlyITokenContract(address instrument) {
           SIGHInstrument currentInstrument = financial_instruments(instrument);
           require( currentInstrument.isListed, "This instrument is not supported by SIGH Distribution Handler");
           require( msg.sender == currentInstrument.iTokenAddress, "This function can only be called by the Instrument's IToken Contract");
        _;
    }
        
// ############################################################
// ##############        PROXY RELATED          ###############
// ############################################################

    event SIGHDistributionHandlerInitialized(address addressesProvider, address Sigh_Address, address priceOracle);

    uint256 constant private SIGH_DISTRIBUTION_REVISION = 0x1;

    function getRevision() internal pure returns(uint256) {
        return SIGH_DISTRIBUTION_REVISION;
    }
    
    function initialize( address addressesProvider_) public initializer {
        addressesProvider = GlobalAddressesProvider(addressesProvider_); 
        Sigh_Address = addressesProvider.getSIGHAddress();
        oracle = PriceOracle( addressesProvider.getPriceOracle() );
        emit SIGHDistributionHandlerInitialized( address(addressesProvider), Sigh_Address, oracle );
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

        all_Instruments.push(IERC20(_instrument)); // ADD THE MARKET TO THE LIST OF SUPPORTED MARKETS

        // INITIALIZE INNSTRUMENT DATA
        financial_instruments[_instrument] = SIGHInstrument( {  isListed: true, 
                                                                iTokenAddress: _iTokenAddress,
                                                                decimals: _decimals, 
                                                                isCoverDipsMechanismActivated: false, 
                                                                supplyindex: safe224(sighInitialIndex,"sighInitialIndex exceeds 224 bits"), 
                                                                supplylastupdatedblock: getBlockNumber(), 
                                                                borrowindex : safe224(sighInitialIndex,"sighInitialIndex exceeds 224 bits"), 
                                                                borrowlastupdatedblock : getBlockNumber()
                                                                } )
        // INITITALIZE INSTRUMENT SPEEDS
        Instrument_Sigh_Speeds[_instrument] = Instrument_Sigh_Speed( { suppliers_Speed: uint(0),
                                                                       borrowers_Speed: uint(0),
                                                                       speeds_Ratio_Mantissa: uint(1e18),
                                                                       staking_Speed: uint(0)
                                                                    } );

        // INITIALIZE PRICECYCLES
        if ( instrumentPriceCycles[_instrument].initializationCounter == 0 ) {
            uint224[24] memory emptyPrices;
            instrumentPriceCycles[_instrument] = InstrumentPriceCycle({ recordedPriceSnapshot : emptyPrices, initializationCounter: 0 }) ;
        }   

        emit MarketAdded(_instrument, _decimals,  _iTokenAddress block.number); 
        return true;
    }

    /**
    * @dev Instrument to be convered under the SIGH DIstribution Mechanism - Decided by the SIGH Finance Manager who 
    * can call this function through the Sigh Finance Configurator
    * @param instrument_ the instrument object
    **/
    function Instrument_SIGHed(address instrument_) external onlySighFinanceConfigurator returns (bool) {
        require(financial_instruments[instrument_].isListed ,"Instrument not supported.");
        require(!financial_instruments[instrument_].isCoverDipsMechanismActivated, "Instrument already covered under SIGH Distribution Mechanism");
        
        financial_instruments[instrument_].isCoverDipsMechanismActivated = true;
        // refreshSIGHSpeeds(); 
        emit InstrumentSIGHed( instrument_, true, getBlockNumber());
        return true;
    }

    /**
    * @dev Instrument to be removed from SIGH DIstribution Mechanism - Decided by the SIGH Finance Manager who 
    * can call this function through the Sigh Finance Configurator
    * @param instrument_ the instrument object
    **/
    function Instrument_UNSIGHed(address instrument_) external onlySighFinanceConfigurator returns (bool) {
        require(financial_instruments[instrument_].isListed ,"Instrument not supported.");
        require(financial_instruments[instrument_].isCoverDipsMechanismActivated, "Instrument already not supported by the SIGH Distribution Mechanism");

        // Recorded Price snapshots initialized to 0. 
        uint224[24] memory emptyPrices;
        instrumentPriceCycles[instrument_] = InstrumentPriceCycle({ recordedPriceSnapshot : emptyPrices, initializationCounter: 0 }) ;

        financial_instruments[instrument_].isCoverDipsMechanismActivated = false;
        // refreshSIGHSpeeds();
        emit InstrumentSIGHed( instrument_, false, getBlockNumber());
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
    function updateSIGHSpeed(uint SIGHSpeed_) external onlySighFinanceConfigurator returns (bool) {
        uint oldSpeed = SIGHSpeed;
        SIGHSpeed = SIGHSpeed_;
        refreshSIGHSpeeds();
        emit NewSIGHSpeed(oldSpeed, SIGHSpeed, getBlockNumber());         
        return true;
    }

    /**
     * @notice Sets the distribution ratio for an Instrument among Suppliers / Borrowers - Decided by the LendingPool Manager who 
     * can call this function through the lendingPool Configurator (through LendingPool Core)
     * @param instrument_ The instrument
     * @param supplierRatio The % (in 1e18) of SIGH to be given to the suppliers, and rest to the borrowers
     */
    function updateSIGHSpeedRatioForAnInstrument(address instrument_, uint supplierRatio) external onlyLendingPoolCore returns (bool) {
        require(financial_instruments[instrument_].isListed ,"Instrument not supported.");
        require( supplierRatio > 0.5e18, 'The new Supplier Ratio must be greater than 0.5e18 (50%) ');
        require( supplierRatio <= 1e18, 'The new Supplier Ratio must be less than 1e18 (100%)');

        uint prevRatio = Instrument_Sigh_Speeds[instrument_].speeds_Ratio_Mantissa ;
        Instrument_Sigh_Speeds[instrument_].speeds_Ratio_Mantissa = supplierRatio;
        emit Instrument_Sigh_Speed_Supplier_Ratio_Mantissa_Updated( instrument_, prevRatio , Instrument_Sigh_Speeds[marketAddress].speeds_Ratio_Mantissa, getBlockNumber() );
        
        refreshSIGHSpeeds();
        return true;
    }
    
    /**
     * @notice Sets the staking speed for an Instrument - Decided by the SIGH Finance Manager who 
     * can call this function through the Sigh Finance Configurator
     * @param instrument_ The instrument
     * @param newStakingSpeed The additional SIGH staking speed assigned to the Instrument
     */
    function updateStakingSpeedForAnInstrument(address instrument_, uint newStakingSpeed) external onlySighFinanceConfigurator returns (bool) {
        require(financial_instruments[instrument_].isListed ,"Instrument not supported.");
        
        uint prevStakingSpeed = Instrument_Sigh_Speeds[instrument_].staking_Speed;
        Instrument_Sigh_Speeds[instrument_].staking_Speed = newStakingSpeed;
        // refreshSIGHSpeeds();

        emit StakingSpeedUpdated(instrument_, prevStakingSpeed, Instrument_Sigh_Speeds[marketAddress].staking_Speed, getBlockNumber() );
        return true;
        
    }

    /**
     * @notice Activates / Deactivates the upper check and sets the profit percentage for an Instrument - Decided by the SIGH Finance Manager who 
     * can call this function through the Sigh Finance Configurator
     * @param isActivated Boolean deciding if the upper check on SIGH speed (loss driven) activated or not
     * @param profitPercentage The additional profit based SIGH distribution over and above the covered losses
     */    
    function SpeedUpperCheckSwitch( bool isActivated, uint profitPercentage ) external onlySighFinanceConfigurator returns (bool) {
        require( profitPercentage > 0.01e18, 'The new Profit Percentage must be greater than 0.01e18 (1%) ');
        require( profitPercentage <= 1e18, 'The new Supplier Ratio must be less than 1e18 (100%)');
    
        upperCheckProfitPercentage = Exp({ mantissa : profitPercentage });           
        
        if (!isActivated) {
            isSpeedUpperCheckAllowed = false;
        }

        isSpeedUpperCheckAllowed = true;
        emit SpeedUpperCheckSwitched(isSpeedUpperCheckAllowed, upperCheckProfitPercentage.mantissa, getBlockNumber() );
    }

    /**
     * @notice Updates the minimum blocks to be mined before speed can be refreshed again  - Decided by the SIGH Finance Manager who 
     * can call this function through the Sigh Finance Configurator
     * @param deltaBlocksLimit The new Minimum blocks limit
     */   
    function updateDeltaBlocksForSpeedRefresh(uint deltaBlocksLimit) external onlySighFinanceConfigurator returns (bool) {
        uint prevdeltaBlocksForSpeed = deltaBlocksForSpeed;
        deltaBlocksForSpeed = deltaBlocksLimit;
        emit minimumBlocksForSpeedRefreshUpdated( prevdeltaBlocksForSpeed,deltaBlocksForSpeed, getBlockNumber()  );
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
            prevSpeedRefreshBlock = blockNumber;
            return true;
        }
        return false;
    }

    event refreshingSighSpeeds_1( address market,uint instrumentLosses , uint totalLosses   );
    event refreshingSighSpeeds_2( address market,uint newSpeed, uint stakingSpeed, uint newSpeedFinal   );

    event maxSpeedCheck(uint SIGH);
    event blockNumberForSnapshotUpdated(uint224 curClock,uint prevBlockNumberForSnapshot,uint blockNumbersForPriceSnapshots, uint deltaBlocks_,uint blocknumber );    
    event MaxSpeedUsedWhenRefreshingPriceSnapshots(uint SIGHSpeed, uint maxSpeed,uint SIGH_Price,uint totalLosses_  );
        
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
        ITokenInterface[] memory all_Instruments_ = all_Instruments;
        uint blockNumber = getBlockNumber();   
        
        require(updatedInstrumentIndexesInternal(), "Updating Instrument Indexes Failed");       //  accure the indexes 

        //  Blocks passed since PriceSnapshot taken 24 hours back. blockNumbersForPriceSnapshots_ updated for Current Clock 
        uint prevBlockNumberForSnapshot = blockNumbersForPriceSnapshots_[curClock];
        uint deltaBlocks_ = sub_(blockNumber , prevBlockNumberForSnapshot, "DeltaBlocks resulted in Underflow");       // Delta Blocks over past 24 hours
        blockNumbersForPriceSnapshots_[curClock] = uint224(blockNumber);                                               // Block Number for the priceSnapshot Updated
        emit blockNumberForSnapshotUpdated(curClock, prevBlockNumberForSnapshot, blockNumbersForPriceSnapshots_[curClock], deltaBlocks_, blockNumber );
        
        Exp memory totalLosses = Exp({mantissa: 0});                            // TOTAL LOSSES (Over past 24 hours)
        Exp[] memory instrumentLosses = new Exp[](all_Instruments_.length);     // LOSSES MADE BY EACH INSTRUMENT
        

        // DELTA BLOCKS = CURRENT BLOCK - 24HRS_OLD_STORED_BLOCK_NUMBER

        // TOTAL LIQUIDITY FOR AN INSTRUMENT = CURRENT BALANCE OF LENDINGPOOLCORE + TOTALBORROWS (taken from lendingPoolCore)
        // LOSS PER INSTRUMENT = PREVIOUS PRICE (STORED) - CURRENT PRICE (TAKEN FROM ORACLE)
        // TOTAL LOSSES OF AN INSTRUMENT = LOSS PER INSTRUMENT * TOTAL LIQUIDITY
        // INSTRUMENT LOSSES (PER BLOCK AVERAGE) = TOTAL LOSSES OF AN INSTRUMENT / DELTA BLOCKS 
        // TOTAL LOSSES (PER BLOCK AVERAGE) = TOTAL LOSSES + INSTRUMENT LOSSES (PER BLOCK AVERAGE) 
        // Price Snapshot for current clock replaces the pervious price snapshot
        for (uint i = 0; i < all_Instruments_.length; i++) {

            IERC20 _currentInstrument = all_Instruments_[i];       // Current Instrument
            
            if ( !financial_instruments[address(_currentInstrument)].isCoverDipsMechanismActivated  ) {     // if LOSS MINIMIZNG MECHANISM IS NOT ACTIVATED FOR THIS INSTRUMENT
                instrumentLosses[i] = Exp({mantissa: 0});   
            }
            else {

                LendingPoolCore lendngPoolCoreContract = LendingPoolCore( addressesProvider.getLendingPoolCore() );
                uint totalUnderlyingLiquidity = lendngPoolCoreContract.getInstrumentTotalLiquidity( _currentInstrument ); // Total Liquidity in the lending protocol for current instrument

                Exp memory totalLossesOver24hours = Exp({mantissa: 0});
                Exp memory previousPrice = Exp({ mantissa: instrumentPriceCycles[address(_currentInstrument)].recordedPriceSnapshot[curClock] });   // 24hr old price snapshot
                Exp memory currentPrice = Exp({ mantissa: oracle.getAssetPrice( _currentInstrument ) });                                            // current price from the oracle
                
                require ( currentPrice.mantissa > 0, "refreshSIGHSpeedsInternal : Oracle returned Invalid Price" );
    
                if ( instrumentPriceCycles[address(_currentInstrument)].initializationCounter == 24 && greaterThanExp( previousPrice , currentPrice ) ) {  // i.e the price has decreased
                    (MathError error, Exp memory lossPerInstrument) = subExp( previousPrice , currentPrice );
                    ( error, totalLossesOver24hours ) = mulScalar( lossPerInstrument, totalUnderlyingLiquidity );
                    instrumentLosses[i] = div_( totalLossesOver24hours, deltaBlocks_ );                     // instrumentLosses[i] on an average per Block Basis over past 24 hours
                }
                else {
                     instrumentLosses[i] = Exp({mantissa: 0});
                }
    
                MathError error;
                Exp memory prevTotalLosses = Exp({ mantissa : totalLosses.mantissa });
                (error, totalLosses) = addExp(prevTotalLosses, instrumentLosses[i]);            //  Total loss (per block average) += instrumnet loss (per block loss) 
                uint curMarketLoss = instrumentLosses[i].mantissa;
                emit refreshingSighSpeeds_1( address(_currentInstrument) , curMarketLoss, totalLosses.mantissa );
    
                uint32 prevCounter;
                instrumentPriceCycles[address(_currentInstrument)].recordedPriceSnapshot[curClock] =  safe224(uint224(currentPrice.mantissa), 'Assigning current price failed. Price overflows uint224.' );
    
                //    Newly Sighed Instrument needs to reach 24 (priceSnapshots need to be taken) before it can be assigned a Sigh Speed based on LOSSES   
                if (instrumentPriceCycles[address(_currentInstrument)].initializationCounter < 24 ) {
                    prevCounter = instrumentPriceCycles[address(_currentInstrument)].initializationCounter;
                    instrumentPriceCycles[address(_currentInstrument)].initializationCounter = uint32(add_(prevCounter,uint32(1),'Price Counter addition failed.'));
                }
                
                emit PriceSnapped(address(_currentInstrument), previousPrice.mantissa, currentPrice.mantissa );
                emit PriceSnappedCheck(address(_currentInstrument), previousPrice.mantissa, instrumentPriceCycles[address(_currentInstrument)].recordedPriceSnapshot[curClock] ,  instrumentPriceCycles[address(_currentInstrument)].initializationCounter, blockNumber );
            }
        }
        
        uint maxSpeed = SIGHSpeed;
        if (isSpeedUpperCheckAllowed) {                     // SIGH SPEED BASED ON UPPER CHECK AND ADDITIONAL PROFIT POTENTIAL
            maxSpeed = calculateMaxSighSpeedInternal( totalLosses.mantissa ); 
        }

        // ###### Updates the Speed (loss driven) for the Supported Markets ######
        for (uint i=0 ; i < all_Instruments_.length ; i++) {

            IERC20 _currentInstrument = all_Instruments_[i];       // Current Instrument
            
            uint prevSpeedSupplier =  Instrument_Sigh_Speeds[address(_currentInstrument)].suppliers_Speed ;
            uint prevSpeedBorrower =  Instrument_Sigh_Speeds[address(_currentInstrument)].borrowers_Speed ;
            uint stakingSpeed = Instrument_Sigh_Speeds[address(_currentInstrument)].staking_Speed ;

            Exp memory lossRatio;
            if (totalLosses.mantissa > 0) {
                MathError error;
                (error, lossRatio) = divExp(instrumentLosses[i], totalLosses);
            } 
            else {
                lossRatio = Exp({mantissa: 0});
            }
            
            uint newSpeed_ = totalLosses.mantissa > 0 ? mul_(maxSpeed, lossRatio) : 0;
            uint newSpeedFinal = newSpeed_;
            
            // ADDING STAKING SPEED TO THE SPEED CALCULATED FROM THE LOSSES[i]/TOTAL_LOSSES 
            if (stakingSpeed > 0) {
                uint newSpeedWithStakingRewrds = add_(newSpeed_,stakingSpeed,'Speed Addition Overflow');
                newSpeedFinal = newSpeedWithStakingRewrds;
            }
            
            // New Supplier Speed = NewSpeed (i.e Speed from the losses + staking speed for the market) * supplierSpeedRatio
            // New Borrower Speed = NewSpeed (i.e Speed from the losses + staking speed for the market) - New Supplier Speed 
            Exp memory supplierSpeedRatio = Exp({ mantissa : Instrument_Sigh_Speeds[address(_currentInstrument)].speeds_Ratio_Mantissa });
            uint supplierNewSpeed = mul_(newSpeedFinal, supplierSpeedRatio );
            uint borrowerNewSpeed = sub_(newSpeedFinal, supplierNewSpeed, 'Borrower New Speed: Underflow' );

            Instrument_Sigh_Speeds[address(_currentInstrument)].suppliers_Speed = supplierNewSpeed;  
            Instrument_Sigh_Speeds[address(_currentInstrument)].borrowers_Speed = borrowerNewSpeed;  

            emit refreshingSighSpeeds_2( address(_currentInstrument) ,newSpeed_, stakingSpeed,  newSpeedFinal  );
            emit SuppliersSIGHSpeedUpdated(_currentInstrument, prevSpeedSupplier, Instrument_Sigh_Speeds[address(_currentInstrument)].suppliers_Speed   );
            emit BorrowersSIGHSpeedUpdated(_currentInstrument, prevSpeedBorrower, Instrument_Sigh_Speeds[address(_currentInstrument)].borrowers_Speed   );
        }

        uint224 prevClock = curClock;  
        require(updateCurrentClockInternal(), "Updating CLock Failed");                         // Updates the Clock    
    }

    //  Updates the Supply & Borrow Indexes for all the Supported Instruments
    function updatedInstrumentIndexesInternal() internal returns (bool) {
        for (uint i = 0; i < all_Instruments_.length; i++) {
            ITokenInterface currentInstrument = all_Instruments_[i];
            updateSIGHSupplyIndex(address(currentInstrument));
            updateSIGHBorrowIndex(address(currentInstrument));
        }
        return true;
    }

    // returns the currently maximum possible SIGH Distribution speed. Called only when upper check is activated
    function calculateMaxSighSpeedInternal( uint totalLossesPerBlockAverage ) internal returns (uint) {
            uint sigh_speed_used = SIGHSpeed;
            uint current_Sigh_Price = oracle.getAssetPrice( Sigh_Address );   
            uint max_valueDistributionLimit = mul_(current_Sigh_Price,sigh_speed_used);   // MAX Value that can be distributed per block

            if ( current_Sigh_Price == 0 || max_valueDistributionLimit <=  totalLossesPerBlockAverage ) {
                return sigh_speed_used;
            }
            else {
                uint profitPotentialPerBlock = mul_(totalLossesPerBlockAverage, upperCheckProfitPercentage ); // (a * b)/1e18 [b is in Exp Scale]
                lossesPlusProfitPotentialPerBlock = add_( totalLossesPerBlockAverage,profitPotentialPerBlock,"Potential losses addition gave overflow" );
                if ( max_valueDistributionLimit <=  lossesPlusProfitPotentialPerBlock ) {
                    return sigh_speed_used;
                }
                else {
                    sigh_speed_used = div_( lossesPlusProfitPotentialPerBlock, current_Sigh_Price, "Max Speed division gave error" );
                    return sigh_speed_used;
                }
            }
        emit MaxSpeedUsedWhenRefreshingPriceSnapshots(SIGHSpeed, sigh_speed_used, current_Sigh_Price, totalLossesPerBlockAverage, max_valueDistributionLimit  );
    }

    // Updates the Current CLock (global variable tracking the current hour )
    function updateCurrentClockInternal() internal returns (bool) {
        if (curClock == 23) {
            curClock = 0;               // Global clock Updated
        }
        else {
            uint224 newClock = uint224(add_(curClock,1,"curClock : Addition Failed"));
            curClock = newClock;        // Global clock Updated
        }
        emit ClockUpdated(prevClock,curClock,getBlockNumber() );
    }


    // #####################################################################################################################################
    // ################ UPDATE SIGH DISTRIBUTION INDEXES ###################################################################################
    // ################ 1. updateSIGHSupplyIndex() : Called by LendingPoolCore              ################################################
    // ################ --> updateSIGHSupplyIndexInternal() Internal function with actual implementation  ################################## 
    // ################ 2. updateSIGHBorrowIndex() : Called by LendingPoolCore ############################################################# 
    // ################ --> updateSIGHBorrowIndexInternal() : Internal function with actual implementation ##################################
    // #####################################################################################################################################

    event updateSIGHSupplyIndex_test1(address market,uint speed,uint currentIndex,  uint prevBlock, uint curBlock, uint deltaBlocks );
    event updateSIGHSupplyIndex_test2(address market,uint supplyTokens, uint sigh_Accrued, uint ratio, uint index );
    event updateSIGHSupplyIndex_test3(address market,uint previndex, uint newIndex, uint blockNum );

    /**
     * @notice Accrue SIGH to the Instrument by updating the supply index
     * @param currentInstrument The Instrument whose supply index to update
     */
    function updateSIGHSupplyIndex(address currentInstrument) external onlyLendingPoolCore returns (bool) {    
        require(financial_instruments[currentInstrument].isListed ,"Instrument not supported.");
        
        uint newIndex;
        uint updatedBlockNumber;
        require(updateSIGHSupplyIndexInternal( currentInstrument ), "Updating Sigh Supply Indexes operation failed" );
        return true;
    }

    function updateSIGHSupplyIndexInternal(address currentInstrument) internal returns (bool) {

        SIGHInstrument storage instrumentState = financial_instruments[currentInstrument];

        uint supplySpeed = Instrument_Sigh_Speeds[currentInstrument].suppliers_Speed;  
        uint blockNumber = getBlockNumber();
        uint prevIndex = instrumentState.supplyindex;
        uint deltaBlocks = sub_(blockNumber, uint( instrumentState.supplylastupdatedblock ), 'updateSIGHSupplyIndex : Block Subtraction Underflow');    // Delta Blocks 
        emit updateSIGHSupplyIndex_test1(currentInstrument, supplySpeed, prevIndex, instrumentState.supplylastupdatedblock, blockNumber, deltaBlocks );
        
        if (deltaBlocks > 0 && supplySpeed > 0) {       // In case SIGH would have accured
            uint sigh_Accrued = mul_(deltaBlocks, supplySpeed);                                                                         // SIGH Accured
            uint supplyTokens = ITokenInterface(currentInstrument).totalSupply();                                       
            Double memory ratio = supplyTokens > 0 ? fraction(sigh_Accrued, supplyTokens) : Double({mantissa: 0});                      // SIGH Accured per Supplied Instrument Token
            Double memory newIndex = add_(Double({mantissa: instrumentState.supplyindex}), ratio);                                      // Updated Index
            emit updateSIGHSupplyIndex_test2( currentInstrument, supplyTokens, sigh_Accrued, ratio.mantissa , newIndex.mantissa );  

            instrumentState.supplyindex = newIndex;                 // New Index Committed to Storage 
            instrumentState.supplylastupdatedblock = blockNumber;   // Block number updated
        } 
        else if (deltaBlocks > 0) {         // When no Sigh is accured. Block number updated
            instrumentState.supplylastupdatedblock = blockNumber ;
        }

        SIGHInstrument memory newInstrumentState = financial_instruments[currentInstrument];
        emit updateSIGHSupplyIndex_test3( currentInstrument, newInstrumentState.supplyindex, newInstrumentState.supplylastupdatedblock  );
        // return ( uint256(newInstrumentState.supplyindex) , uint256(newInstrumentState.supplylastupdatedblock)  ) ;
        return true;
    }


    event updateSIGHBorrowIndex_test1(address market,uint speed,uint currentIndex,  uint prevBlock, uint curBlock, uint deltaBlocks );
    event updateSIGHBorrowIndex_test2(address market,uint borrowAmount, uint sigh_Accrued, uint ratio, uint index );
    event updateSIGHBorrowIndex_test3(address market,uint previndex, uint newIndex, uint blockNum );

    /**
     * @notice Accrue SIGH to the market by updating the borrow index
     * @param currentInstrument The market whose borrow index to update
     */
    function updateSIGHBorrowIndex(address currentInstrument) external onlyLendingPoolCore returns (bool) {     
        require(financial_instruments[currentInstrument].isListed ,"Instrument not supported.");

        uint newIndex;
        uint updatedBlockNumber;
        require( updateSIGHBorrowIndexInternal(currentInstrument), "Updating Sigh Borrow Indexes operation failed" ) ;
        return true;

    }

    function updateSIGHBorrowIndexInternal(address currentInstrument) internal returns(bool) {
        LendingPoolCore lendingPoolCoreContract = LendingPoolCore(addressesProvider.getLendingPoolCore() );
        Exp memory marketBorrowIndex = Exp({mantissa: lendingPoolCoreContract.getInstrumentVariableBorrowsCumulativeIndex( currentInstrument )});   // GETTING BORROW INDEX. TO BE VERIFIED
        
        SIGHInstrument storage instrumentState = financial_instruments[currentInstrument];

        uint borrowSpeed = Instrument_Sigh_Speeds[currentInstrument].borrowers_Speed; 
        uint blockNumber = getBlockNumber();
        uint prevIndex = instrumentState.borrowindex;
        uint deltaBlocks = sub_(blockNumber, uint(instrumentState.borrowlastupdatedblock), 'updateSIGHBorrowIndex : Block Subtraction Underflow');         // DELTA BLOCKS
        emit updateSIGHBorrowIndex_test1(currentInstrument, borrowSpeed, prevIndex, instrumentState.borrowlastupdatedblock, blockNumber, deltaBlocks );
        
        if (deltaBlocks > 0 && borrowSpeed > 0) {        // In case SIGH would have accured
            uint sigh_Accrued = mul_(deltaBlocks, borrowSpeed);                             // SIGH ACCURED = DELTA BLOCKS x SIGH SPEED (BORROWERS)
            // TO BE VALIDATED
            uint totalBorrows =  lendingPoolCoreContract.getInstrumentTotalBorrows(currentInstrument);
            uint borrowAmount = div_(totalBorrows, marketBorrowIndex);      // TO BE VALIDATED
            Double memory ratio = borrowAmount > 0 ? fraction(sigh_Accrued, borrowAmount) : Double({mantissa: 0});      // SIGH Accured per Borrowed Instrument Token
            Double memory newIndex = add_(Double({mantissa: instrumentState.borrowindex}), ratio);                      // New Index
            emit updateSIGHBorrowIndex_test2( currentInstrument, borrowAmount, sigh_Accrued, ratio.mantissa , newIndex.mantissa );

            instrumentState.borrowindex = newIndex;
            instrumentState.borrowlastupdatedblock = blockNumber;
        } 
        else if (deltaBlocks > 0) {                 // When no SIGH is accured
            instrumentState.borrowlastupdatedblock = blockNumber;
        }
        
        SIGHInstrument memory newBorrowState = financial_instruments[currentInstrument];
        emit updateSIGHBorrowIndex_test3( currentInstrument, prevIndex, newBorrowState.borrowindex, newBorrowState.borrowlastupdatedblock  );
        return true;
    }


    // #########################################################################################
    // ################ DISTRIBUTE ACCURED SIGH AMONG THE NETWORK PARTICIPANTS  ################
    // #########################################################################################

    event distributeSupplier_SIGH_test3(address market,uint supplyIndex, uint supplierIndex );
    event distributeSupplier_SIGH_test4(address market, uint deltaIndex ,uint supplierTokens, uint supplierDelta , uint supplierAccrued);

    /**
     * @notice Calculate SIGH accrued by a supplier and possibly transfer it to them
     * @param currentInstrument The market in which the supplier is interacting
     * @param supplier The address of the supplier to distribute SIGH to
     */
    function distributeSupplier_SIGH(address currentInstrument, address supplier ) public {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin/Sightroller can update SIGH Supply Index"); 
        require(instrumentPriceCycles[currentInstrument].isListed ,"Market not supported.");

        SIGHInstrumentState storage supplyState = sighMarketSupplyState[currentInstrument];
        Double memory supplyIndex = Double({mantissa: supplyState.index});
        Double memory supplierIndex = Double({mantissa: SIGHSupplierIndex[currentInstrument][supplier]});
        SIGHSupplierIndex[currentInstrument][supplier] = supplyIndex.mantissa;     // UPDATED

        if (supplierIndex.mantissa == 0 && supplyIndex.mantissa > 0) {
            supplierIndex.mantissa = sighInitialIndex;
        }

        emit distributeSupplier_SIGH_test3(currentInstrument, supplyIndex.mantissa, supplierIndex.mantissa );

        Double memory deltaIndex = sub_(supplyIndex, supplierIndex);    // , 'Distribute Supplier SIGH : supplyIndex Subtraction Underflow'
        uint supplierTokens = ITokenInterface(currentInstrument).balanceOf(supplier);
        uint supplierDelta = mul_(supplierTokens, deltaIndex);
        uint supplierAccrued = add_(SIGH_Accrued[supplier], supplierDelta);
        emit distributeSupplier_SIGH_test4(currentInstrument, deltaIndex.mantissa , supplierTokens, supplierDelta , supplierAccrued);
        SIGH_Accrued[supplier] = transfer_Sigh(supplier, supplierAccrued, SIGH_ClaimThreshold);
        uint sigh_accured_by_supplier = SIGH_Accrued[supplier];         
        emit DistributedSupplier_SIGH(ITokenInterface(currentInstrument), supplier, supplierDelta, sigh_accured_by_supplier);
    }

    event distributeBorrower_SIGH_test3(address market,uint borrowIndex, uint borrowerIndex );
    event distributeBorrower_SIGH_test4(address market, uint deltaIndex ,uint borrowBalance, uint borrowerDelta , uint borrowerAccrued);

    /**
     * @notice Calculate SIGH accrued by a borrower and possibly transfer it to them
     * @dev Borrowers will not begin to accrue until after the first interaction with the protocol.
     * @param currentInstrument The market in which the borrower is interacting
     * @param borrower The address of the borrower to distribute Gsigh to
     */
    function distributeBorrower_SIGH(address currentInstrument, address borrower) public {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin/Sightroller can update SIGH Supply Index"); 
        require(instrumentPriceCycles[currentInstrument].isListed ,"Market not supported.");

        SIGHInstrumentState storage borrowState = sighMarketBorrowState[currentInstrument];
        Double memory borrowIndex = Double({mantissa: borrowState.index});
        Double memory borrowerIndex = Double({mantissa: SIGHBorrowerIndex[currentInstrument][borrower]});
        SIGHBorrowerIndex[currentInstrument][borrower] = borrowIndex.mantissa; // Updated

        if (borrowerIndex.mantissa == 0 && borrowIndex.mantissa > 0) {
            borrowerIndex.mantissa = sighInitialIndex;
        }

        LendingPoolCore lendingPoolCoreContract = LendingPoolCore(addressesProvider.getLendingPoolCore() );

        Exp memory marketBorrowIndex = Exp({mantissa: lendingPoolCoreContract.getInstrumentVariableBorrowsCumulativeIndex( currentInstrument )});
        
        emit distributeBorrower_SIGH_test3(currentInstrument, borrowIndex.mantissa, borrowerIndex.mantissa );

        if (borrowerIndex.mantissa > 0) {
            Double memory deltaIndex = sub_(borrowIndex, borrowerIndex);   // , 'Distribute Borrower SIGH : borrowIndex Subtraction Underflow'
            uint borrowBalance;
            ( , borrowBalance , , ) = lendingPoolCoreContract.getUserBasicInstrumentData(currentInstrument, borrower);
            // uint borrowBalance = ITokenInterface(currentInstrument).borrowBalanceStored(borrower);
            uint borrowerAmount = div_(borrowBalance, marketBorrowIndex);
            uint borrowerDelta = mul_(borrowerAmount, deltaIndex);
            uint borrowerAccrued = add_(SIGH_Accrued[borrower], borrowerDelta);
            emit distributeBorrower_SIGH_test4(currentInstrument, deltaIndex.mantissa , borrowerAmount, borrowerDelta , borrowerAccrued);
            SIGH_Accrued[borrower] = transfer_Sigh(borrower, borrowerAccrued, SIGH_ClaimThreshold);
            uint sigh_accured_by_borrower = SIGH_Accrued[borrower]; 
            emit distributeBorrower_SIGH_test4(currentInstrument, deltaIndex.mantissa, borrowerAmount, borrowerDelta, sigh_accured_by_borrower);
        }
    }

    // #########################################################################################
    // ################### MARKET PARTICIPANTS CAN CLAIM THEIR ACCURED SIGH  ###################
    // #########################################################################################

    function claimSIGH(address[] memory holders, bool borrowers, bool suppliers ) public {
        
        for (uint i = 0; i < all_Instruments.length; i++) {  
            ITokenInterface currentInstrument = all_Instruments[i];

            if (borrowers == true) {
                updateSIGHBorrowIndex(address(currentInstrument));
                for (uint j = 0; j < holders.length; j++) {
                    distributeBorrower_SIGH(address(currentInstrument), holders[j] );
                }
            }

            if (suppliers == true) {
                updateSIGHSupplyIndex(address(currentInstrument));
                for (uint j = 0; j < holders.length; j++) {
                    distributeSupplier_SIGH(address(currentInstrument), holders[j] );
                }
            }
            
            for (uint j = 0; j < holders.length; j++) {
                SIGH_Accrued[holders[i]] = transfer_Sigh(holders[i] , SIGH_Accrued[ holders[i] ] , 0 );
            }
        }
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
    function transferSighTotheUser(address instrument, address user, uint sigh_Amount) external onlyITokenContract(instrument) returns (uint) {
        IERC20 sigh = IERC20(Sigh_Address);
        uint sigh_not_transferred;
        if ( sigh.balanceOf(address(this)) > sigh_Amount ) {   // NO SIGH TRANSFERRED IF CONTRACT LACKS REQUIRED SIGH AMOUNT
            require(sigh.transfer( user, sigh_Amount ), "Failed to transfer accured SIGH to the user." );
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

    function getInstrumentSupplyIndex(address instrument_) external view returns (uint) {
        require(financial_instruments[instrument_].isListed,"The provided instrument address is not supported");
        return financial_instruments[instrument_].supplyindex;
    }

    function getInstrumentBorrowIndex(address instrument_) external view returns (uint) {
        require(financial_instruments[instrument_].isListed,"The provided instrument address is not supported");
        return financial_instruments[instrument_].borrowIndex;
    }

    // SIGHTROLLER - GETTER AND SETTER
    function setSightrollerAddress(address newSightroller) public returns (bool) {
        require(msg.sender == admin, "only admin can set SIGHTROLLER");
        sightrollerAddress = newSightroller;
        return true;
    }

    // SIGH - GETTER AND SETTER
    function setSighAddress(address Sigh_Address__) public returns (address) {
        require(msg.sender == admin, "only admin can set Sigh_Address");
        Sigh_Address = Sigh_Address__;
        return Sigh_Address;
    }
    
    // ORACLE - SETTER
    function setOracle(address newOracle) public returns (bool) {
        require(msg.sender == admin, "only admin can set oracle");
        oracle = PriceOracle(newOracle);
        return true;
    }
    
    function getSIGHBalance() public view returns (uint) {
        IERC20 sigh = IERC20(Sigh_Address);
        uint sigh_Remaining = sigh.balanceOf(address(this));
        return sigh_Remaining;
    }
    
    function setMinimumDeltaBlocksForSpeed(uint224 newMinimumDeltaBlocks) public {
        require(msg.sender == admin, "only admin can set oracle");
        deltaBlocksForSpeed = newMinimumDeltaBlocks;
    }

    function getBlockNumber() public view returns (uint32) {
        return uint32(block.number);
    }
    
    function checkPriceSnapshots(address market_, uint clock) public view returns (uint224) {
        return instrumentPriceCycles[market_].recordedPriceSnapshot[clock];
    }
    
    function checkinitializationCounter(address market_) public view returns (uint224) {
        return instrumentPriceCycles[market_].initializationCounter;
    }
    

}
