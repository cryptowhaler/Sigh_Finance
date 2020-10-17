pragma solidity ^0.5.16;

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

    CToken[] public allMarkets;

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
    
    
    function _addMarketInternal(address newMarket) internal {
        uint check = 0;
        for (uint i = 0; i < allMarkets.length; i ++) {
            if (allMarkets[i] == CToken(newMarket) ) {
                check = 1;
                break;
            }
        }
        if (check == 0) {
            allMarkets.push(CToken(newMarket));
        }
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
    
    // ###########################################################################################
    // ################ REFRESH SIGH DISTRIBUTION SPEEDS FOR MARKETS (EVERY HOUR) ################
    // ###########################################################################################

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

    event refreshingSighSpeeds_1( address market ,  uint previousPrice , uint currentPrice , uint marketLosses , uint totalSupply, uint totalLosses   );
    event refreshingSighSpeeds_2( address market, uint marketLosses , uint totalLosses, uint newSpeed   );



    function refreshSIGHSpeedsInternal() internal {
        CToken[] memory allMarkets_ = allMarkets;

        // ###### accure the indexes ######
        for (uint i = 0; i < allMarkets_.length; i++) {
            CToken currentMarket = allMarkets_[i];
            updateSIGHSupplyIndex(address(currentMarket));
            Exp memory borrowIndex = Exp({mantissa: currentMarket.borrowIndex()});            
            updateSIGHBorrowIndex(address(currentMarket),borrowIndex);
        }

        // ###### Updates the Clock ######
        uint224 prevClock = curClock;  

        if (curClock == 23) {
            curClock = 0;               // Global clock Updated
        }
        else {
            uint224 newClock = uint224(add_(curClock,1,"curClock : Addition Failed"));
            curClock = newClock;        // Global clock Updated
        }
        
        emit ClockUpdated(prevClock,curClock,now);
        

        // ###### Calculate the total Loss made by the protocol over the 24 hrs ######
        Exp memory totalLosses = Exp({mantissa: 0});
        Exp[] memory marketLosses = new Exp[](allMarkets_.length); 


        // ######    Calculates the marketLosses[i] by subtracting the current          ######
        // ###### price from the stored price for the current clock (24 hr old price)   ######
        // ######         Adds the loss of the current Market to total loss             ######
        // ######         It updates the stored Price for the current CLock             ######
        for (uint i = 0; i < allMarkets_.length; i++) {
            CToken cToken = allMarkets_[i];

            // ######    Calculates the marketLosses[i] by subtracting the current          ######
            // ###### price from the stored price for the current clock (24 hr old price)   ######
            Exp memory previousPrice = Exp({ mantissa: sighPriceCycles[address(cToken)].recordedPriceSnapshot[curClock] });
            Exp memory currentPrice = Exp({ mantissa: oracle.getUnderlyingPriceRefresh( cToken ) });
            uint totalSupply;
            
            require ( currentPrice.mantissa > 0, "refreshSIGHSpeedsInternal : Oracle returned Invalid Price" );

            if ( sighedMarkets[address(cToken)].isSIGHed && sighPriceCycles[address(cToken)].initializationCounter == 24 && greaterThanExp( previousPrice , currentPrice ) ) {  // i.e the price has decreased
                (MathError error, Exp memory lossPerUnderlying) = subExp( previousPrice , currentPrice );
                totalSupply = cToken.totalSupply();
                ( error, marketLosses[i] ) = mulScalar( lossPerUnderlying, totalSupply );
            }
            else {
                 marketLosses[i] = Exp({mantissa: 0});
            }

            //  ###### Adds the loss of the current Market to total loss ######
            //  ###### Adds the loss of the current Market to total loss ######            
            Exp memory prevTotalLosses = Exp({ mantissa : totalLosses.mantissa });
            MathError error;
            (error, totalLosses) = addExp(prevTotalLosses, marketLosses[i]);  // Total loss made by the platform
            uint curMarketLoss = marketLosses[i].mantissa;
            emit refreshingSighSpeeds_1( address(cToken) , previousPrice.mantissa , currentPrice.mantissa ,curMarketLoss , totalSupply,  totalLosses.mantissa );

            //  ###### It updates the stored Price for the current CLock ######
            //  ###### It updates the stored Price for the current CLock ######            
            sighPriceCycles[address(cToken)].recordedPriceSnapshot[curClock] =  safe224(uint224(currentPrice.mantissa), 'Assigning current price failed. Price overflows uint224.' );
            if (sighPriceCycles[address(cToken)].initializationCounter < 24 ) {
                uint prevCounter = sighPriceCycles[address(cToken)].initializationCounter;
                sighPriceCycles[address(cToken)].initializationCounter = uint32(add_(prevCounter,1,'Price Counter addition failed.'));
            }
            
            uint blockNumber = getBlockNumber();   
            
            emit PriceSnapped(address(cToken), previousPrice.mantissa, currentPrice.mantissa , blockNumber );
            emit PriceSnappedCheck(address(cToken), previousPrice.mantissa, sighPriceCycles[address(cToken)].recordedPriceSnapshot[curClock] , blockNumber );
        }

        // ###### Drips the SIGH from the SIGH Speed Controller ######
        SighSpeedController sigh_SpeedController = SighSpeedController(getSighSpeedController());
        if ( sigh_SpeedController.isThisProtocolSupported(address(this)) && sigh_SpeedController.isDripAllowed() ) {
            sigh_SpeedController.drip();
        }

        // ###### Updates the Speed for the Supported Markets ######
        // ###### Updates the Speed for the Supported Markets ######        
        for (uint i=0 ; i < allMarkets_.length ; i++) {
            CToken cToken = allMarkets[i];
            uint prevSpeedSupplier =  SIGH_Speeds_Suppliers[address(cToken)];
            uint prevSpeedBorrower =  SIGH_Speeds_Borrowers[address(cToken)];

            Exp memory lossRatio;
            if (totalLosses.mantissa > 0) {
                MathError error;
                (error, lossRatio) = divExp(marketLosses[i], totalLosses);
            } 
            else {
                lossRatio = Exp({mantissa: 0});
            }
            uint newSpeed = totalLosses.mantissa > 0 ? mul_(SIGHSpeed, lossRatio) : 0;

            Exp memory supplierSpeedRatio = Exp({ mantissa : SIGH_Speeds_Supplier_Ratio_Mantissa[address(cToken)] });
            uint supplierNewSpeed = mul_(newSpeed, supplierSpeedRatio );
            uint borrowerNewSpeed = sub_(newSpeed, supplierNewSpeed, 'Borrower New Speed: Underflow' );

            SIGH_Speeds_Suppliers[address(cToken)] = supplierNewSpeed;  
            SIGH_Speeds_Borrowers[address(cToken)] = borrowerNewSpeed;  

            emit refreshingSighSpeeds_2( address(cToken) ,  marketLosses[i].mantissa , totalLosses.mantissa , newSpeed );
            emit SuppliersSIGHSpeedUpdated(cToken, prevSpeedSupplier, SIGH_Speeds_Suppliers[address(cToken)]);
            emit BorrowersSIGHSpeedUpdated(cToken, prevSpeedBorrower, SIGH_Speeds_Borrowers[address(cToken)]);
        }
    }


    // ################################################################## 
    // ################ UPDATE SIGH DISTRIBUTION INDEXES ################
    // ##################################################################

    event updateSIGHSupplyIndex_test1(address market,uint speed,uint currentIndex,  uint prevBlock, uint curBlock, uint deltaBlocks );
    event updateSIGHSupplyIndex_test2(address market,uint supplyTokens, uint sigh_Accrued, uint ratio, uint index );
    event updateSIGHSupplyIndex_test3(address market,uint previndex, uint newIndex, uint blockNum );

    /**
     * @notice Accrue SIGH to the market by updating the supply index
     * @param cToken The market whose supply index to update
     */
    function updateSIGHSupplyIndex(address currentMarket) public {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin/Sightroller can update SIGH Supply Index"); 
        
        SIGHMarketState storage supplyState = sighMarketSupplyState[currentMarket];
        uint supplySpeed = SIGH_Speeds_Suppliers[currentMarket];
        uint blockNumber = getBlockNumber();
        uint prevIndex = supplyState.index;
        uint deltaBlocks = sub_(blockNumber, uint( supplyState.block_ ), 'updateSIGHSupplyIndex : Block Subtraction Underflow');
        emit updateSIGHSupplyIndex_test1(currentMarket, supplySpeed, supplyState.index, supplyState.block_, blockNumber, deltaBlocks );
        
        if (deltaBlocks > 0 && supplySpeed > 0) {
            uint sigh_Accrued = mul_(deltaBlocks, supplySpeed);
            uint supplyTokens = CToken(currentMarket).totalSupply();
            Double memory ratio = supplyTokens > 0 ? fraction(sigh_Accrued, supplyTokens) : Double({mantissa: 0});
            Double memory newIndex = add_(Double({mantissa: supplyState.index}), ratio);
            emit updateSIGHSupplyIndex_test2( currentMarket, supplyTokens, sigh_Accrued, ratio.mantissa , newIndex.mantissa );
            sighMarketSupplyState[currentMarket] = SIGHMarketState({ index: safe224(newIndex.mantissa, "new index exceeds 224 bits"), block_: safe32(blockNumber, "block number exceeds 32 bits")});
        } 
        else if (deltaBlocks > 0) {
            supplyState.block_ = safe32(blockNumber, "block number exceeds 32 bits");
        }
        
        SIGHMarketState memory newSupplyState = sighMarketSupplyState[currentMarket];
        emit updateSIGHSupplyIndex_test3( currentMarket, prevIndex, newSupplyState.index, newSupplyState.block_  );
    }
    



    event updateSIGHBorrowIndex_test1(address market,uint speed,uint currentIndex,  uint prevBlock, uint curBlock, uint deltaBlocks );
    event updateSIGHBorrowIndex_test2(address market,uint borrowAmount, uint sigh_Accrued, uint ratio, uint index );
    event updateSIGHBorrowIndex_test3(address market,uint previndex, uint newIndex, uint blockNum );

    /**
     * @notice Accrue SIGH to the market by updating the borrow index
     * @param cToken The market whose borrow index to update
     */
    function updateSIGHBorrowIndex(address currentMarket) public {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin/Sightroller can update SIGH Supply Index"); 
        
        
        CToken currentMarketContract = CToken(currentMarket);
        Exp memory marketBorrowIndex = Exp({mantissa: currentMarketContract.borrowIndex()});
        
        SIGHMarketState storage borrowState = sighMarketBorrowState[currentMarket];
        uint borrowSpeed = SIGH_Speeds_Borrowers[currentMarket];
        uint blockNumber = getBlockNumber();
        uint prevIndex = borrowState.index;
        uint deltaBlocks = sub_(blockNumber, uint(borrowState.block_));
        emit updateSIGHBorrowIndex_test1(currentMarket, borrowSpeed, borrowState.index, borrowState.block_, blockNumber, deltaBlocks );
        
        if (deltaBlocks > 0 && borrowSpeed > 0) {
            uint sigh_Accrued = mul_(deltaBlocks, borrowSpeed);
            uint totalBorrows = CToken(currentMarket).totalBorrows();
            uint borrowAmount = div_(totalBorrows, marketBorrowIndex);
            Double memory ratio = borrowAmount > 0 ? fraction(sigh_Accrued, borrowAmount) : Double({mantissa: 0});
            Double memory newIndex = add_(Double({mantissa: borrowState.index}), ratio);
            emit updateSIGHBorrowIndex_test2( currentMarket, borrowAmount, sigh_Accrued, ratio.mantissa , newIndex.mantissa );
            sighMarketBorrowState[currentMarket] = SIGHMarketState({ index: safe224(newIndex.mantissa, "new index exceeds 224 bits"),  block_: safe32(blockNumber, "block number exceeds 32 bits")});
        } 
        else if (deltaBlocks > 0) {
            borrowState.block_ = safe32(blockNumber, "block number exceeds 32 bits");
        }
        
        SIGHMarketState memory newBorrowState = sighMarketBorrowState[cToken];
        emit updateSIGHBorrowIndex_test3( currentMarket, prevIndex, newBorrowState.index, newBorrowState.block_  );
    }


    // #########################################################################################
    // ################ DISTRIBUTE ACCURED SIGH AMONG THE NETWORK PARTICIPANTS  ################
    // #########################################################################################

    event distributeSupplier_SIGH_test3(address market,uint supplyIndex, uint supplierIndex );
    event distributeSupplier_SIGH_test4(address market, uint deltaIndex ,uint supplierTokens, uint supplierDelta , uint supplierAccrued);

    /**
     * @notice Calculate SIGH accrued by a supplier and possibly transfer it to them
     * @param cToken The market in which the supplier is interacting
     * @param supplier The address of the supplier to distribute SIGH to
     */
    function distributeSupplier_SIGH(address currentMarket, address supplier, bool distributeAll) public {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin/Sightroller can update SIGH Supply Index"); 
        
        SIGHMarketState storage supplyState = sighMarketSupplyState[currentMarket];
        Double memory supplyIndex = Double({mantissa: supplyState.index});
        Double memory supplierIndex = Double({mantissa: SIGHSupplierIndex[currentMarket][supplier]});
        SIGHSupplierIndex[currentMarket][supplier] = supplyIndex.mantissa;     // UPDATED

        if (supplierIndex.mantissa == 0 && supplyIndex.mantissa > 0) {
            supplierIndex.mantissa = sighInitialIndex;
        }

        emit distributeSupplier_SIGH_test3(currentMarket, supplyIndex.mantissa, supplierIndex.mantissa );

        Double memory deltaIndex = sub_(supplyIndex, supplierIndex);    // , 'Distribute Supplier SIGH : supplyIndex Subtraction Underflow'
        uint supplierTokens = CToken(currentMarket).balanceOf(supplier);
        uint supplierDelta = mul_(supplierTokens, deltaIndex);
        uint supplierAccrued = add_(SIGH_Accrued[supplier], supplierDelta);
        emit distributeSupplier_SIGH_test4(currentMarket, deltaIndex.mantissa , supplierTokens, supplierDelta , supplierAccrued);
        SIGH_Accrued[supplier] = transfer_Sigh(supplier, supplierAccrued, distributeAll ? 0 : SIGH_ClaimThreshold);
        emit DistributedSupplier_SIGH(CToken(currentMarket), supplier, supplierDelta, supplyIndex.mantissa);
    }

    event distributeBorrower_SIGH_test3(address market,uint borrowIndex, uint borrowerIndex );
    event distributeBorrower_SIGH_test4(address market, uint deltaIndex ,uint borrowBalance, uint borrowerDelta , uint borrowerAccrued);

    /**
     * @notice Calculate SIGH accrued by a borrower and possibly transfer it to them
     * @dev Borrowers will not begin to accrue until after the first interaction with the protocol.
     * @param cToken The market in which the borrower is interacting
     * @param borrower The address of the borrower to distribute Gsigh to
     */
    function distributeBorrower_SIGH(address currentMarket, address borrower, bool distributeAll) public {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin/Sightroller can update SIGH Supply Index"); 
        
        SIGHMarketState storage borrowState = sighMarketBorrowState[currentMarket];
        Double memory borrowIndex = Double({mantissa: borrowState.index});
        Double memory borrowerIndex = Double({mantissa: SIGHBorrowerIndex[currentMarket][borrower]});
        SIGHBorrowerIndex[currentMarket][borrower] = borrowIndex.mantissa; // Updated

        if (borrowerIndex.mantissa == 0 && borrowIndex.mantissa > 0) {
            borrowerIndex.mantissa = sighInitialIndex;
        }
        
        CToken currentMarketContract = CToken(currentMarket);
        Exp memory marketBorrowIndex = Exp({mantissa: currentMarketContract.borrowIndex()});
        
        emit distributeBorrower_SIGH_test3(currentMarket, borrowIndex.mantissa, borrowerIndex.mantissa );

        if (borrowerIndex.mantissa > 0) {
            Double memory deltaIndex = sub_(borrowIndex, borrowerIndex);   // , 'Distribute Borrower SIGH : borrowIndex Subtraction Underflow'
            uint borrowBalance = CToken(currentMarket).borrowBalanceStored(borrower);
            uint borrowerAmount = div_(borrowBalance, marketBorrowIndex);
            uint borrowerDelta = mul_(borrowerAmount, deltaIndex);
            uint borrowerAccrued = add_(SIGH_Accrued[borrower], borrowerDelta);
            emit distributeBorrower_SIGH_test4(currentMarket, deltaIndex.mantissa , borrowerAmount, borrowerDelta , borrowerAccrued);
            SIGH_Accrued[borrower] = transfer_Sigh(borrower, borrowerAccrued, distributeAll ? 0 : SIGH_ClaimThreshold);
            emit distributeBorrower_SIGH_test4(currentMarket, deltaIndex.mantissa, borrowBalance, borrowerDelta, borrowerAccrued);
        }
    }









    function getBlockNumber() public view returns (uint32) {
        return uint32(block.number);
    }











}
