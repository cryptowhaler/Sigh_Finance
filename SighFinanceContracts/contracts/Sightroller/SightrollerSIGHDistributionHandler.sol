import "../Tokens/CToken.sol";
import "../ErrorReporter.sol";
import "../Math/Exponential.sol";
import "../PriceOracle.sol";
import "../SpeedController/SighSpeedController.sol";
import "../Sigh.sol";


contract SightrollerSIGHDistributionHandler {
    
    address admin;
    address public sightrollerAddress;
    PriceOracle public oracle;
    address public Sigh_Address;
    address public SighSpeedControllerAddress;

    mapping (address => bool) sighedMarkets;    // Markets which receive SIGH 
    
    struct SIGHMarketState {
        /// @notice The market's last updated SIGHIndex 
        uint224 index;

        /// @notice The block number the index was last updated at
        uint32 block_;
    }
    
    struct SIGH_PriceCycles {
        uint224[24] recordedPriceSnapshot;
        uint32 initializationCounter;
    }

    uint224 public curClock;

    uint256 public prevSpeedRefreshTime;

    uint224 public constant deltaTimeforSpeed = 420; // 60 * 60 

    uint public SIGHSpeed;

    mapping(address => uint) public SIGH_Speeds_Supplier_Ratio_Mantissa;

    mapping(address => uint) public SIGH_Speeds_Suppliers;
    mapping(address => uint) public SIGH_Speeds_Borrowers;

    mapping(address => SIGHMarketState) public sighMarketSupplyState;
    mapping(address => SIGHMarketState) public sighMarketBorrowState;

    mapping(address => SIGH_PriceCycles) public sighPriceCycles;

    mapping(address => mapping(address => uint)) public SIGHSupplierIndex;
    mapping(address => mapping(address => uint)) public SIGHBorrowerIndex;

    /// @notice The SIGH accrued but not yet transferred to each user
    mapping(address => uint) public SIGH_Accrued;

    /// @notice The threshold above which the flywheel transfers Gsigh, in wei
    uint public constant SIGH_ClaimThreshold = 0.001e18;

    /// @notice The initial SIGH index for a market
    uint224 public constant sighInitialIndex = 1e36;

    /// @notice Emitted when SIGH rate is changed
    event NewSIGHSpeed(uint oldSIGHSpeed, uint newSIGHSpeed, uint blockNumber_);

    /// @notice Emitted when a new SIGH speed is calculated for a market
    event SuppliersSIGHSpeedUpdated(CToken cToken, uint prevSpeed, uint newSpeed);

    /// @notice Emitted when a new SIGH speed is calculated for a market
    event BorrowersSIGHSpeedUpdated(CToken cToken, uint prevSpeed, uint newSpeed);


    /// @notice Emitted when SIGH is distributed to a supplier
    event DistributedSupplier_SIGH(CToken cToken, address supplier, uint sighDelta, uint sighSupplyIndex);

    /// @notice Emitted when SIGH is distributed to a borrower
    event DistributedBorrower_SIGH(CToken cToken, address borrower, uint sighDelta, uint sighBorrowIndex);

    /// @notice Emitted when SIGH is transferred to a User
    event SIGH_Transferred(address userAddress, uint amountTransferred );

    /// @notice Emitted when Price snapshot is taken
    event PriceSnapped(address cToken, uint prevPrice, uint currentPrice, uint blockNumber);

    event PriceSnappedCheck(address cToken, uint prevPrice, uint currentPrice, uint blockNumber);

    event SIGH_Speeds_Supplier_Ratio_Mantissa_Updated(address cToken, uint prevRatio, uint newRatio);

    event ClockUpdated( uint224 prevClock, uint224 curClock, uint timestamp );
        
        
    constructor() public {
        admin = msg.sender;
    }
    
    function setSightrollerAddress(address newSightroller) public returns (bool) {
        require(msg.sender == admin, "only admin can set SIGHTROLLER");
        sightrollerAddress = newSightroller;
        return true;
    }
    
    function setOracle(address newOracle) public returns (bool) {
        require(msg.sender == admin, "only admin can set oracle");
        oracle = newOracle;
        return true;
    }
    
    function setSigh_Address(address newSigh_Address) public returns (bool) {
        require(msg.sender == admin, "only admin can set Sigh_Address");
        Sigh_Address = newSigh_Address;
        return true;
    }
    
    function setSighSpeedControllerAddress(address newSighSpeedControllerAddress) public returns (bool) {
        require(msg.sender == admin, "only admin can set SighSpeedControllerAddress");
        SighSpeedControllerAddress = newSighSpeedControllerAddress;
        return true;
    }
    
    /*** SIGH Distribution Admin ***/
    /*** SIGH Distribution Admin ***/
    /*** SIGH Distribution Admin ***/
    /*** SIGH Distribution Admin ***/

    function addSIGHMarket(address marketAddress_) public returns (bool) {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin can add SIGH market");
        require(!sighedMarkets[marketAddress_], "Market already supports SIGH");
        
        if ( sighMarketSupplyState[marketAddress_].index == 0 && sighMarketSupplyState[marketAddress_].block_ == 0 ) {
            sighMarketSupplyState[marketAddress_] = SIGHMarketState({ index: sighInitialIndex, block_: safe32(getBlockNumber(), "block number exceeds 32 bits") });
        }
        
        if ( sighMarketBorrowState[marketAddress_].index == 0 && sighMarketBorrowState[marketAddress_].block_ == 0 ) {
            sighMarketBorrowState[marketAddress_] = SIGHMarketState({ index: sighInitialIndex, block_: safe32(getBlockNumber(), "block number exceeds 32 bits") });
        }
        
        if ( sighPriceCycles[marketAddress_].initializationCounter == 0 ) {
            uint224[24] memory emptyPrices;
            sighPriceCycles[marketAddress_] = SIGH_PriceCycles({ recordedPriceSnapshot : emptyPrices, initializationCounter: 0 }) ;
        }   
        
        SIGH_Speeds_Supplier_Ratio_Mantissa[marketAddress_] = 1e18;
        sighedMarkets[marketAddress_] = true;
        refreshSIGHSpeeds(); // TO BE IMPLEMENTED
        
        return true;
    }

    function dropSIGHMarket(address marketAddress_) public returns (bool) {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin can drop SIGH market");
        require(sighedMarkets[marketAddress_], "Market does not support SIGH");

        // Recorded Price snapshots initialized to 0. 
        uint224[24] memory emptyPrices;
        sighPriceCycles[marketAddress_] = SIGH_PriceCycles({ recordedPriceSnapshot : emptyPrices, initializationCounter: 0 }) ;
        sighedMarkets[marketAddress_] = false;
        
        refreshSIGHSpeeds();
        return true;
    }

    /**
     * @notice Set the amount of SIGH distributed per block
     * @param SIGHSpeed_ The amount of SIGH wei per block to distribute
     */
    function updateSIGHSpeed(uint SIGHSpeed_) public returns (bool) {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin/Sightroller can change SIGH rate"); 

        uint oldSpeed = SIGHSpeed;
        SIGHSpeed = SIGHSpeed_;
        emit NewSIGHSpeed(oldSpeed, SIGHSpeed_,getBlockNumber());

        refreshSIGHSpeeds(); 
        return true;
    }

    function updateSIGHSpeedRatioForAMarket(address marketAddress, uint supplierRatio) public returns (bool) {
        require(msg.sender == admin, 'Only Admin can change the SIGH Speed Distribution Ratio for a Market');

        uint prevRatio = SIGH_Speeds_Supplier_Ratio_Mantissa[marketAddress];
        SIGH_Speeds_Supplier_Ratio_Mantissa[marketAddress] = supplierRatio;
        emit SIGH_Speeds_Supplier_Ratio_Mantissa_Updated( marketAddress, prevRatio , SIGH_Speeds_Supplier_Ratio_Mantissa[marketAddress] );
        
        refreshSIGHSpeeds();
        return true;
    }
    
    // ###############################################################################
    // ################ REFRESH SIGH DISTRIBUTION SPEEDS (EVERY HOUR) ################
    // ###############################################################################

    /**
     * @notice Recalculate and update SIGH speeds for all SIGH markets
     */
    function refreshSIGHSpeeds() public returns (bool) {
        uint256 timeElapsedSinceLastRefresh = sub_(now , prevSpeedRefreshTime, "RefreshSIGHSpeeds : Subtraction underflow"); 

        if ( timeElapsedSinceLastRefresh >= deltaTimeforSpeed) {
            refreshSIGHSpeedsInternal();
            prevSpeedRefreshTime = now;
        }
        return true;
    }













    function getBlockNumber() public view returns (uint32) {
        return uint32(block.number);
    }











}
