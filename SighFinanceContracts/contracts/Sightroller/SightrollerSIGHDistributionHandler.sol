pragma solidity ^0.5.16;

import "../Tokens/CToken.sol";
import "../Math/Exponential.sol";
import "../PriceOracle.sol";
import "../SpeedController/SighSpeedController.sol";
import "../openzeppelin/EIP20Interface.sol";


contract SightrollerSIGHDistributionHandler is Exponential {
    
    address admin;
    address public sightrollerAddress;
    PriceOracle public oracle;
    address public Sigh_Address;
    address public SighSpeedControllerAddress;

    CToken[] public allMarkets;

    mapping (address => bool) sighedMarkets;    // Markets which receive SIGH 
    
    struct SIGHMarketState {
        uint224 index;              /// @notice The market's last updated SIGHIndex 
        uint32 block_;              /// @notice The block number the index was last updated at
    }
    
    struct SIGH_PriceCycles {
        uint224[24] recordedPriceSnapshot;
        uint32 initializationCounter;
    }

    uint public SIGHSpeed;

    uint224 public constant deltaTimeforSpeed = 1; // 60 * 60 
    uint256 public prevSpeedRefreshTime;
    uint224 public curClock;

    mapping(address => uint) public SIGH_Speeds_Supplier_Ratio_Mantissa;
    mapping(address => uint) public SIGH_Speeds_Suppliers;
    mapping(address => uint) public SIGH_Speeds_Borrowers;

    mapping(address => SIGHMarketState) public sighMarketSupplyState;
    mapping(address => SIGHMarketState) public sighMarketBorrowState;

    mapping(address => SIGH_PriceCycles) public sighPriceCycles;

    mapping(address => mapping(address => uint)) public SIGHSupplierIndex;
    mapping(address => mapping(address => uint)) public SIGHBorrowerIndex;

    mapping(address => uint) public SIGH_Accrued;           /// @notice The SIGH accrued but not yet transferred to each user

    uint public constant SIGH_ClaimThreshold = 0.001e18;        /// @notice The threshold above which the flywheel transfers Gsigh, in wei
    uint224 public constant sighInitialIndex = 1e36;            /// @notice The initial SIGH index for a market

    /// @notice Emitted when market isSIGHed status is changed
    event MarketSIGHed(address marketAddress, bool isSIGHed);

    /// @notice Emitted when SIGH rate is changed
    event NewSIGHSpeed(uint oldSIGHSpeed, uint newSIGHSpeed, uint blockNumber_);

    event SIGH_Speeds_Supplier_Ratio_Mantissa_Updated(address cToken, uint prevRatio, uint newRatio);

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
    event PriceSnapped(address cToken, uint prevPrice, uint currentPrice, uint32 Prevcounter, uint blockNumber);

    event PriceSnappedCheck(address cToken, uint prevPrice, uint currentPrice,uint32 currentCounter, uint blockNumber);


    event ClockUpdated( uint224 prevClock, uint224 curClock, uint timestamp );
        
        
    constructor() public {
        admin = msg.sender;
    }
    
    
// ###############################################################################################
// ##############        ADD / DROP A MARKET FROM THOSE THAT RECEIVE SIGH           ##############
// ###############################################################################################
    event checkIndexes(address market, uint224 index, uint32 blockNumber);

    function addSIGHMarket(address marketAddress_) public returns (bool) {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin/Sightroller can add SIGH market");
        require(!sighedMarkets[marketAddress_], "Market already supports SIGH");
        
        _addMarketInternal(marketAddress_);
        
        if ( sighMarketSupplyState[marketAddress_].index == 0 && sighMarketSupplyState[marketAddress_].block_ == 0 ) {
            sighMarketSupplyState[marketAddress_] = SIGHMarketState({ index: safe224(sighInitialIndex,"sighInitialIndex exceeds 224 bits"), block_: safe32(getBlockNumber(), "block number exceeds 32 bits") });
            emit checkIndexes(marketAddress_,sighMarketSupplyState[marketAddress_].index, sighMarketSupplyState[marketAddress_].block_);
        }
        
        if ( sighMarketBorrowState[marketAddress_].index == 0 && sighMarketBorrowState[marketAddress_].block_ == 0 ) {
            sighMarketBorrowState[marketAddress_] = SIGHMarketState({ index: safe224(sighInitialIndex,"sighInitialIndex exceeds 224 bits"), block_: safe32(getBlockNumber(), "block number exceeds 32 bits") });
            emit checkIndexes(marketAddress_,sighMarketBorrowState[marketAddress_].index, sighMarketBorrowState[marketAddress_].block_);
        }
        
        if ( sighPriceCycles[marketAddress_].initializationCounter == 0 ) {
            uint224[24] memory emptyPrices;
            sighPriceCycles[marketAddress_] = SIGH_PriceCycles({ recordedPriceSnapshot : emptyPrices, initializationCounter: 0 }) ;
        }   
        
        SIGH_Speeds_Supplier_Ratio_Mantissa[marketAddress_] = 1e18;
        sighedMarkets[marketAddress_] = true;
        refreshSIGHSpeeds(); 
        emit MarketSIGHed( marketAddress_, true);
        
        return true;
    }

    function dropSIGHMarket(address marketAddress_) public returns (bool) {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin/Sightroller can drop SIGH market");
        require(sighedMarkets[marketAddress_], "Market does not support SIGH");

        // Recorded Price snapshots initialized to 0. 
        uint224[24] memory emptyPrices;
        sighPriceCycles[marketAddress_] = SIGH_PriceCycles({ recordedPriceSnapshot : emptyPrices, initializationCounter: 0 }) ;
        sighedMarkets[marketAddress_] = false;
        
        refreshSIGHSpeeds();
        emit MarketSIGHed( marketAddress_, false);
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

// ###############################################################################################
// ##############        GLOBAL SIGH SPEED AND SIGH SPEED RATIO FOR A MARKET          ##############
// ###############################################################################################

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
        require( supplierRatio > 0.5e18, 'The new Supplier Ratio must be greater than 0.5e18');
        require( supplierRatio <= 1e18, 'The new Supplier Ratio must be less than 1e18');

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
            return true;
        }
        return false;
    }

    event refreshingSighSpeeds_1( address market ,  uint previousPrice , uint currentPrice , uint marketLosses , uint totalSupply, uint totalLosses   );
    event refreshingSighSpeeds_2( address market, uint marketLosses , uint totalLosses, uint newSpeed   );



    function refreshSIGHSpeedsInternal() internal {
        CToken[] memory allMarkets_ = allMarkets;

        // ###### accure the indexes ######
        for (uint i = 0; i < allMarkets_.length; i++) {
            CToken currentMarket = allMarkets_[i];
            updateSIGHSupplyIndex(address(currentMarket));
            updateSIGHBorrowIndex(address(currentMarket));
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
            uint totalSupply = cToken.totalSupply();
            
            require ( currentPrice.mantissa > 0, "refreshSIGHSpeedsInternal : Oracle returned Invalid Price" );

            if ( sighedMarkets[address(cToken)] && sighPriceCycles[address(cToken)].initializationCounter == 24 && greaterThanExp( previousPrice , currentPrice ) ) {  // i.e the price has decreased
                (MathError error, Exp memory lossPerUnderlying) = subExp( previousPrice , currentPrice );
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
            uint32 prevCounter;
            sighPriceCycles[address(cToken)].recordedPriceSnapshot[curClock] =  safe224(uint224(currentPrice.mantissa), 'Assigning current price failed. Price overflows uint224.' );
            if (sighPriceCycles[address(cToken)].initializationCounter < 24 ) {
                prevCounter = sighPriceCycles[address(cToken)].initializationCounter;
                sighPriceCycles[address(cToken)].initializationCounter = uint32(add_(prevCounter,uint32(1),'Price Counter addition failed.'));
            }
            
            uint blockNumber = getBlockNumber();   
            
            emit PriceSnapped(address(cToken), previousPrice.mantissa, currentPrice.mantissa ,uint32(prevCounter), blockNumber );
            emit PriceSnappedCheck(address(cToken), previousPrice.mantissa, sighPriceCycles[address(cToken)].recordedPriceSnapshot[curClock] , sighPriceCycles[address(cToken)].initializationCounter,  blockNumber );
        }


        // ###### Updates the Speed for the Supported Markets ######
        // ###### Updates the Speed for the Supported Markets ######        
        for (uint i=0 ; i < allMarkets_.length ; i++) {
            CToken current_market = allMarkets[i];
            uint prevSpeedSupplier =  SIGH_Speeds_Suppliers[address(current_market)];
            uint prevSpeedBorrower =  SIGH_Speeds_Borrowers[address(current_market)];

            Exp memory lossRatio;
            if (totalLosses.mantissa > 0) {
                MathError error;
                (error, lossRatio) = divExp(marketLosses[i], totalLosses);
            } 
            else {
                lossRatio = Exp({mantissa: 0});
            }
            uint newSpeed = totalLosses.mantissa > 0 ? mul_(SIGHSpeed, lossRatio) : 0;

            Exp memory supplierSpeedRatio = Exp({ mantissa : SIGH_Speeds_Supplier_Ratio_Mantissa[address(current_market)] });
            uint supplierNewSpeed = mul_(newSpeed, supplierSpeedRatio );
            uint borrowerNewSpeed = sub_(newSpeed, supplierNewSpeed, 'Borrower New Speed: Underflow' );

            SIGH_Speeds_Suppliers[address(current_market)] = supplierNewSpeed;  
            SIGH_Speeds_Borrowers[address(current_market)] = borrowerNewSpeed;  

            emit refreshingSighSpeeds_2( address(current_market) ,  marketLosses[i].mantissa , totalLosses.mantissa , newSpeed );
            emit SuppliersSIGHSpeedUpdated(current_market, prevSpeedSupplier, SIGH_Speeds_Suppliers[address(current_market)]);
            emit BorrowersSIGHSpeedUpdated(current_market, prevSpeedBorrower, SIGH_Speeds_Borrowers[address(current_market)]);
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
     * @param currentMarket The market whose supply index to update
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
     * @param currentMarket The market whose borrow index to update
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
        
        SIGHMarketState memory newBorrowState = sighMarketBorrowState[currentMarket];
        emit updateSIGHBorrowIndex_test3( currentMarket, prevIndex, newBorrowState.index, newBorrowState.block_  );

    }


    // #########################################################################################
    // ################ DISTRIBUTE ACCURED SIGH AMONG THE NETWORK PARTICIPANTS  ################
    // #########################################################################################

    event distributeSupplier_SIGH_test3(address market,uint supplyIndex, uint supplierIndex );
    event distributeSupplier_SIGH_test4(address market, uint deltaIndex ,uint supplierTokens, uint supplierDelta , uint supplierAccrued);

    /**
     * @notice Calculate SIGH accrued by a supplier and possibly transfer it to them
     * @param currentMarket The market in which the supplier is interacting
     * @param supplier The address of the supplier to distribute SIGH to
     * @param distributeAll All SIGH Distributed if it is true
     */
    function distributeSupplier_SIGH(address currentMarket, address supplier, bool distributeAll) public {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin/Sightroller can update SIGH Supply Index"); 

        // ###### Drips the SIGH from the SIGH Speed Controller ######
        SighSpeedController sigh_SpeedController = SighSpeedController(getSighSpeedController());
        if ( sigh_SpeedController.isThisProtocolSupported(address(this)) && sigh_SpeedController.isDripAllowed() ) {
            sigh_SpeedController.drip();
        }

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
     * @param currentMarket The market in which the borrower is interacting
     * @param borrower The address of the borrower to distribute Gsigh to
     * @param distributeAll All SIGH Distributed if it is true
     */
    function distributeBorrower_SIGH(address currentMarket, address borrower, bool distributeAll) public {
        require(msg.sender == sightrollerAddress || msg.sender == admin, "only admin/Sightroller can update SIGH Supply Index"); 

        // ###### Drips the SIGH from the SIGH Speed Controller ######
        SighSpeedController sigh_SpeedController = SighSpeedController(getSighSpeedController());
        if ( sigh_SpeedController.isThisProtocolSupported(address(this)) && sigh_SpeedController.isDripAllowed() ) {
            sigh_SpeedController.drip();
        }
        
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

    // #########################################################################################
    // ################### MARKET PARTICIPANTS CAN CLAIM THEIR ACCURED SIGH  ###################
    // #########################################################################################

    function claimSIGH(address[] memory holders, bool borrowers, bool suppliers ) public {
        
        for (uint i = 0; i < allMarkets.length; i++) {  
            CToken currentMarket = allMarkets[i];

            if (borrowers == true) {
                updateSIGHBorrowIndex(address(currentMarket));
                for (uint j = 0; j < holders.length; j++) {
                    distributeBorrower_SIGH(address(currentMarket), holders[j], true);
                }
            }

            if (suppliers == true) {
                updateSIGHSupplyIndex(address(currentMarket));
                for (uint j = 0; j < holders.length; j++) {
                    distributeSupplier_SIGH(address(currentMarket), holders[j], true);
                }
            }
        }
    }

    // #########################################################################################
    // ################### TRANSFERS THE SIGH TO THE MARKET PARTICIPANT  ###################
    // #########################################################################################

    /**
     * @notice Transfer SIGH to the user, if they are above the threshold
     * @dev Note: If there is not enough SIGH, we do not perform the transfer all.
     * @param user The address of the user to transfer SIGH to
     * @param userAccrued The amount of SIGH to (possibly) transfer
     * @param threshold The minimum amount of SIGH to (possibly) transfer
     * @return The amount of SIGH which was NOT transferred to the user
     */
    function transfer_Sigh(address user, uint userAccrued, uint threshold) internal returns (uint) {
        if (userAccrued >= threshold && userAccrued > 0) {
            EIP20Interface sigh = EIP20Interface(getSighAddress());
            uint sigh_Remaining = sigh.balanceOf(address(this));
            if (userAccrued <= sigh_Remaining) {
                sigh.transfer(user, userAccrued);
                emit SIGH_Transferred(user, userAccrued);
                return 0;
            }
        }
        return userAccrued;
    }

    // #########################################################
    // ################### GENERAL FUNCTIONS ###################
    // #########################################################

    // SIGHTROLLER - GETTER AND SETTER
    function setSightrollerAddress(address newSightroller) public returns (bool) {
        require(msg.sender == admin, "only admin can set SIGHTROLLER");
        sightrollerAddress = newSightroller;
        return true;
    }

    function getSightrollerAddress() public view returns (address) {
        return sightrollerAddress;
    }    

    // SIGH - GETTER AND SETTER
    function setSighAddress(address Sigh_Address__) public returns (address) {
        require(msg.sender == admin, "only admin can set Sigh_Address");
        Sigh_Address = Sigh_Address__;
        return Sigh_Address;
    }
    
    function getSighAddress() public view returns (address) {
        return Sigh_Address;
    }    

    // SIGH SPEED CONTROLLER - GETTER AND SETTER
    function setSighSpeedController(address SighSpeedController__) public returns (address) {
        require(msg.sender == admin, "only admin can set Sigh_Address");
        SighSpeedControllerAddress = SighSpeedController__;
        return SighSpeedControllerAddress;
    }    

    function getSighSpeedController() public view returns (address) {
        return SighSpeedControllerAddress;
    }
    
    // ORACLE - SETTER
    function setOracle(address newOracle) public returns (bool) {
        require(msg.sender == admin, "only admin can set oracle");
        oracle = PriceOracle(newOracle);
        return true;
    }
    
    function getSIGHBalance() public view returns (uint) {
        EIP20Interface sigh = EIP20Interface(getSighAddress());
        uint sigh_Remaining = sigh.balanceOf(address(this));
        return sigh_Remaining;
    }


    function getBlockNumber() public view returns (uint32) {
        return uint32(block.number);
    }
    
    function checkPriceSnapshots(address market_, uint clock) public view returns (uint224) {
        return sighPriceCycles[market_].recordedPriceSnapshot[clock];
    }
    
    function checkinitializationCounter(address market_) public view returns (uint224) {
        return sighPriceCycles[market_].initializationCounter;
    }
    

}
