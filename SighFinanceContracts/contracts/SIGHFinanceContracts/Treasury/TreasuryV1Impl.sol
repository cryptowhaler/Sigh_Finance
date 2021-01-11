pragma solidity ^0.5.16;

/**
 * @title Sigh Treasury Contract Interface
 * @notice The Treasury Contract for SIGH Finance
 * @dev Used to Swap Tokens, burns SIGH Tokens, and can ERC20 token can be distributed to a target address on a per block basis
 * @author SIGH Finance
 */
import "openzeppelin-solidity/contracts/utils/ReentrancyGuard.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol"; 
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";

import "./EIP20InterfaceSIGH.sol";
import "../../configuration/GlobalAddressesProvider.sol";

// import "./IForwarder.sol";
// import "../openzeppelin/EIP20Interface.sol";

contract Treasury is ReentrancyGuard, VersionedInitializable   {

    // OTHER CONTRACTS INTERACTED WITH
    IERC20 private sigh_Instrument;    
    GlobalAddressesProvider private addressesProvider;
    
    // STATE OF THE INSTRUMENTS HELD IN THE TREASURY
    struct instrumentState {
        bool initialized;
        uint balance;
        uint totalAmountDripped;
        uint totalAmountTransferred;
    }

    mapping (address => instrumentState) instrumentStates;
    address[] private allInstruments;

    // TREASURY's DRIPPING STATE PARAMETERS
    struct dripState {
        bool isDripAllowed;    
        address targetAddressForDripping;
        address instrumentBeingDripped;
        uint DripSpeed;
        uint lastDripBlockNumber; 
    }
    
    dripState private treasuryDripState;

    // TREASURY's SIGH BURN STATE PARAMETERS
    struct burnState {
        bool is_SIGH_BurnAllowed;
        uint SIGHBurnSpeed;
        uint totalBurntSIGH;
        uint lastBurnBlockNumber;
    }
    
    burnState private sighBurnState;

    // SIGH TRANSFER RELATED FUNCTIONS

    uint private maxSIGHTransferLimit;                  // MAX SIGH that can be traded/transferred during a period
    uint private totalSighTradedAndTransferred;         // SIGH that has been traded/transferred during the current period
    uint public constant periodLength = 6500;              // Period Length
    uint private periodInitializationBlock;            
    


    event InstrumentInitialized( address instrument, uint balance, uint totalAmountDripped, uint totalAmountTransferred  );

    event InstrumentDistributionInitialized(bool isDripAllowed, address targetAddressForDripping, address instrumentBeingDripped,  uint dripSpeed, uint initializationBlockNumber);
    event InstrumentDistributionReset(bool isDripAllowed, address targetAddressForDripping, address instrumentBeingDripped,  uint dripSpeed, uint blockNumber); 
    event instrumentBeingDistributedChanged(address newInstrumentToBeDripped, uint dripSpeed, uint blockNumber);
    event DripSpeedChanged(uint prevDripSpeed , uint curDripSpeed,  uint blockNumber ); 
    event AmountDripped(address targetAddress, address instrumentBeingDripped, uint AmountDripped , uint currentBalance, uint totalAmountDripped ); 

    event maxTransferAmountUpdated(uint prevmaxTransferLimit, uint newmaxTransferLimit, uint sighBalance);
    event SIGHTransferred(address indexed TargetAddress, uint amountTransferred, uint blockNumber);

    event TokensBought( address instrument_address,   uint amountBought, uint new_balance );
    event TokensSold( address instrument_address,  uint amountSold, uint new_balance );
    event TokenSwapTransactionData( bytes data );

    event SIGHBurnAllowedSwitched(bool newBurnAllowed, uint blockNumber); 
    event SIGH_Burned(address sigh_Address, uint amount, uint totalSIGHBurned, uint remaining_balance, uint blockNumber);
    event SIGHBurnSpeedChanged(uint prevSpeed, uint newSpeed, uint blockNumber);

// ########################
// ####### MODIFIER #######
// ########################

    /**
    * @dev only the SIGH Finance Manager can call functions affected by this modifier
    **/
    modifier onlySIGHFinanceManager {
        require( addressesProvider.getSIGHFinanceManager() == msg.sender, "The caller must be the SIGH Mechanism Manager" );
        _;
    }

    //only SIGH Finance Configurator can use functions affected by this modifier
    modifier onlySighFinanceConfigurator {
        require(addressesProvider.getSIGHFinanceConfigurator() == msg.sender, "The caller must be the SIGH Finanace Configurator Contract");
        _;
    }

// ###############################################################################################
// ##############        PROXY RELATED          ##################################################
// ###############################################################################################


    event SIGHTreasuryInitialized(address msgSender, address addressesProvider, address SIGH, address sighVolatilityHarvester);

    uint256 constant private DATA_PROVIDER_REVISION = 0x5;

    function getRevision() internal pure returns(uint256) {
        return DATA_PROVIDER_REVISION;
    }
    
    
    function initialize( GlobalAddressesProvider addressesProvider_) public initializer {
        addressesProvider = addressesProvider_; 
        refreshConfigInternal();        
    }
    
    function refreshConfig() external onlySighFinanceConfigurator() returns (bool) {
        require(refreshConfigInternal(),"Something went wrong"); 
        return true;
    }

    function refreshConfigInternal() internal returns (bool) {
        sigh_Instrument = IERC20(addressesProvider.getSIGHAddress());           // SIGH TOKEN
        return true;
    }

// ################################################################################################################ 
// ###########   BURN SIGH TOKENS  ################################################################################
// ###########   1. switchSIGHBurnAllowed() : Activates / Deactivates SIGH Burn (onlySighFinanceConfigurator) #####
// ###########   2. updateSIGHBurnSpeed() : Updates the SIGH Burn Speed (onlySighFinanceConfigurator) #############
// ###########   3. burnSIGHTokens() : Public Function. Allows anyone to burn SIGH Tokens. ########################
// ################################################################################################################

    function switchSIGHBurnAllowed() external onlySighFinanceConfigurator returns (bool) {
        require( instrumentStates[address(sigh_Instrument)].initialized, "SIGH Instrument is not initialized yet" );        
        
        if (sighBurnState.is_SIGH_BurnAllowed) {
            burnSIGHTokens();
            sighBurnState.is_SIGH_BurnAllowed = false;          // STATE UPDATE : is_SIGH_BurnAllowed switched
            updateSIGHBurnSpeedInternal(0);
        }
        else {
            sighBurnState.is_SIGH_BurnAllowed = true;           // STATE UPDATE : is_SIGH_BurnAllowed switched
            sighBurnState.lastBurnBlockNumber = block.number;  // STATE UPDATE : block number updated            
        }
        emit SIGHBurnAllowedSwitched(sighBurnState.is_SIGH_BurnAllowed, block.number);
        return true;
    }
        
    function updateSIGHBurnSpeed(uint newBurnSpeed) external onlySighFinanceConfigurator returns (bool) {
        require( instrumentStates[address(sigh_Instrument)].initialized, "SIGH Instrument is not initialized yet" );        
        require(updateSIGHBurnSpeedInternal(newBurnSpeed),"Sigh Burn speed was not updated properly");
        return true;
    }

    function burnSIGHTokens() public nonReentrant returns (uint) {
        if (  !sighBurnState.is_SIGH_BurnAllowed || sighBurnState.SIGHBurnSpeed == 0 || (sighBurnState.lastBurnBlockNumber == block.number) )  {
            return uint(0);
        }
        
        EIP20InterfaceSIGH token_ = EIP20InterfaceSIGH(address(sigh_Instrument));
        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current balance of SIGH
        uint blockNumber_ = block.number;
        
        uint deltaBlocks = sub(blockNumber_,sighBurnState.lastBurnBlockNumber,"Block Numbers Substraction gave error");
        uint deltaBurn_ = mul(sighBurnState.SIGHBurnSpeed, deltaBlocks, "BurnTotal overflow");
        uint toBurn_ = min(treasuryBalance_, deltaBurn_);
        
        require(treasuryBalance_ != 0, 'The treasury currently does not have any SIGH tokens.');
        require(token_.burn(toBurn_), 'The SIGH burn was not successful' );
        
        sighBurnState.lastBurnBlockNumber = blockNumber_;                         // STATE UPDATE : Block number when SIGH was last burnt updated
        uint prevTotalBurntAmount = sighBurnState.totalBurntSIGH ;
        sighBurnState.totalBurntSIGH = add(prevTotalBurntAmount,toBurn_,"Total Sigh Burnt Overflow");   // STATE UPDATE : Total SIGH burnt updated
        instrumentStates[address(sigh_Instrument)].balance = token_.balanceOf(address(this));           // STATE UPDATE : SIGH BALANCE UPDATED

        emit SIGH_Burned( address(sigh_Instrument), toBurn_, sighBurnState.totalBurntSIGH,  instrumentStates[address(sigh_Instrument)].balance , sighBurnState.lastBurnBlockNumber ); 

        return toBurn_;
    }

    // INTERNAL FUNCTION

    function updateSIGHBurnSpeedInternal(uint newBurnSpeed) internal returns (bool) {
        if ( sighBurnState.SIGHBurnSpeed > 0 ) {
            burnSIGHTokens();
        } 
        uint prevBurnSpeed = sighBurnState.SIGHBurnSpeed;
        sighBurnState.SIGHBurnSpeed = newBurnSpeed;
        sighBurnState.lastBurnBlockNumber = block.number;
        
        require (sighBurnState.SIGHBurnSpeed == newBurnSpeed, 'New SIGH Burn Speed not initialized properly');
        emit SIGHBurnSpeedChanged(prevBurnSpeed, sighBurnState.SIGHBurnSpeed, block.number);
        return true;
    }

// #########################################################################################################################################################
// ###########   _______TREASURY CAN DISTRIBUTE ANY TOKEN TO ANY ADDRESS AT A PER BLOCK BASIS_______ #######################################################
// ###########   1. initializeInstrumentDistribution() --> To initiate an Instrument distribution Session. (onlySighFinanceConfigurator)   #################
// ###########   2. changeInstrumentBeingDripped() --> Change the instrument being distributed (onlySighFinanceConfigurator)  ##############################
// ###########   3. updateDripSpeed() --> To update the current Dripping Speed (onlySighFinanceConfigurator) ###############################################
// ###########   4. resetInstrumentDistribution() --> Reset instrument distribution to start a new session (onlySighFinanceConfigurator)  ##################
// #########################################################################################################################################################

    function initializeInstrumentDistribution (address targetAddress, address instrumentToBeDistributed, uint distributionSpeed) external onlySighFinanceConfigurator returns (bool) {
        require(!treasuryDripState.isDripAllowed,"Instrument distribution needs to be reset before it can be initialized Again");
        require( instrumentStates[address(instrumentToBeDistributed)].initialized, "Instrument to be distributed is not initialized yet" );        
        
        treasuryDripState.targetAddressForDripping = targetAddress;                           // STATE UPDATE : Sets the address to which these instruments will be distributed
        require(changeInstrumentBeingDrippedInternal(instrumentToBeDistributed),"Instrument to be distributed not assigned properly");    // Sets the instrument which will be distributed
        require(updateDripSpeedInternal(distributionSpeed),"Distribution Speed not initialized properly.");                         // Sets the distribution Speed

        treasuryDripState.isDripAllowed = true;                                               // STATE UPDATE : INITIATES DISTRIBUTION
        treasuryDripState.lastDripBlockNumber = block.number;                                 // STATE UPDATE : Distribution commences from current block
        
        emit InstrumentDistributionInitialized(treasuryDripState.isDripAllowed, treasuryDripState.targetAddressForDripping, treasuryDripState.instrumentBeingDripped, treasuryDripState.DripSpeed, treasuryDripState.lastDripBlockNumber);
        return true;
    }

    /**
      * @notice Change the token being dripped to the Target Address
      * @param instrumentToDrip Address of the token to be dripped
      * @return returns the address of the token that will be Dripped
    */    
    function changeInstrumentBeingDripped(address instrumentToDrip ) external onlySighFinanceConfigurator returns (bool) {
        require( instrumentStates[address(instrumentToDrip)].initialized, "Instrument to be distributed is not initialized yet" );        
        if ( treasuryDripState.isDripAllowed ) {  // First Distribute the remaining amount
            drip();
        }
        require(changeInstrumentBeingDrippedInternal(instrumentToDrip),"Instrument to be distributed not assigned properly");
        return true;
    }

    function updateDripSpeed (uint DripSpeed_) external onlySighFinanceConfigurator returns (bool) {
        if (treasuryDripState.isDripAllowed) {
            drip();
        }
        require(updateDripSpeedInternal(DripSpeed_),"Distribution Speed not initialized properly.");
        return true;
  }

    /**
      * @notice Switch to Reset (OFF) Dripping
      * @return return is Dripping is allowed or not
    */    
    function resetInstrumentDistribution() external onlySighFinanceConfigurator returns (bool) {
        if (!treasuryDripState.isDripAllowed) {
            return true;
        }
        drip();
        
        treasuryDripState.isDripAllowed = false;                                // STATE UPDATE : DRIPPING FUNCTIONALITY BEING RESET
        treasuryDripState.targetAddressForDripping = address(0);                // STATE UPDATE : DRIPPING FUNCTIONALITY BEING RESET
        treasuryDripState.instrumentBeingDripped = address(0);                  // STATE UPDATE : DRIPPING FUNCTIONALITY BEING RESET
        treasuryDripState.DripSpeed = uint(0);                                  // STATE UPDATE : DRIPPING FUNCTIONALITY BEING RESET

        emit InstrumentDistributionReset(treasuryDripState.isDripAllowed , treasuryDripState.targetAddressForDripping, treasuryDripState.instrumentBeingDripped,  treasuryDripState.DripSpeed, block.number);
        return true;
    }

   function updateDripSpeedInternal( uint dripSpeed_ ) internal returns (bool) {
        uint prevDripSpeed = treasuryDripState.DripSpeed;
        treasuryDripState.DripSpeed = dripSpeed_;                                           // STATE UPDATE : DRIPPING SPEED UPDATED
        emit DripSpeedChanged(prevDripSpeed , treasuryDripState.DripSpeed, block.number);
        return true;
   }    
   
    function changeInstrumentBeingDrippedInternal(address instrumentToDrip) internal returns (bool) {
        IERC20 newToken = IERC20(instrumentToDrip);
        uint currentBalance = newToken.balanceOf(address(this)); 
        require(currentBalance > 0, 'The Treasury does not hold these new instruments');

        treasuryDripState.instrumentBeingDripped = instrumentToDrip;                    // STATE UPDATE : INSTRUMENT BEING DRIPPED UPDATED
        require(treasuryDripState.instrumentBeingDripped == instrumentToDrip, 'Address for the instrument to be Dripped not assigned properly');

        emit instrumentBeingDistributedChanged(treasuryDripState.instrumentBeingDripped, treasuryDripState.DripSpeed,  block.number);
        return true;
    }  

// ################################################################################
// ###########   THE FUNCTION TO DRIP THE TOKENS TO THE TARGET ADDRESS  ###########
// ################################################################################

    /**
      * @notice Drips the Tokens to the target Address
      * @return returns the Dripped Amount
    */    
    function drip() nonReentrant public returns (uint) {
        if ( !treasuryDripState.isDripAllowed || (treasuryDripState.DripSpeed == 0)  || (treasuryDripState.targetAddressForDripping == address(0)) || (treasuryDripState.lastDripBlockNumber == block.number)  ) {
            return uint(0);
        }

        IERC20 token_ = IERC20(treasuryDripState.instrumentBeingDripped); 
        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current balance of the token Being Dripped
        uint blockNumber_ = block.number;
        uint deltaBlocks = sub(blockNumber_,treasuryDripState.lastDripBlockNumber,"Blocks Substraction overrflow");
        uint deltaDrip_ = mul(treasuryDripState.DripSpeed, deltaBlocks, "dripTotal overflow");
        uint toDrip_ = min(treasuryBalance_, deltaDrip_);
        
        require(treasuryBalance_ != 0, 'The treasury currently does not have any of tokens which are being Dripped');
        require(token_.transfer(treasuryDripState.targetAddressForDripping, toDrip_), 'The Instrument transfer did not complete.' );      // ONLY INSTRUMENTS WHICH IMPLEMENT STANDARD ERC20 CAN BE DISTRIBUTED BY THE TREASURY
        
        treasuryDripState.lastDripBlockNumber = blockNumber_;                                                                               // STATE UPDATE : setting the block number when the Drip is made
        uint prevTotalDrippedAmount = instrumentStates[treasuryDripState.instrumentBeingDripped].totalAmountDripped;
        instrumentStates[treasuryDripState.instrumentBeingDripped].totalAmountDripped = add(prevTotalDrippedAmount,toDrip_,"Overflow");     // STATE UPDATE : Total amount dripped for the instrument updated
        treasuryBalance_ = token_.balanceOf(address(this)); // get current balance

        instrumentStates[treasuryDripState.instrumentBeingDripped].balance = treasuryBalance_;                                              // STATE UPDATE: Update the instrument balance
        emit AmountDripped( treasuryDripState.targetAddressForDripping, treasuryDripState.instrumentBeingDripped, toDrip_, treasuryBalance_, instrumentStates[treasuryDripState.instrumentBeingDripped].totalAmountDripped ); 
        return toDrip_;
    }




// ##################################################################################################
// ###########   initializeInstrumentState() : INITIALIZING INSTRUMENTS #############################
// ###########   updateInstrumentBalance() : updates the stored balance                  ############
// ###########   swapTokensUsingOxAPI() : THE HEDGE FUND MECHANISM AND THE SIGH TRANSFER ############
// ###########   transferSighTo() : FUNCTION TO TRANSFER SIGH TOKENS     ############################
// ##################################################################################################

    function initializeInstrumentState(address instrument) external onlySighFinanceConfigurator returns (bool) {
        require( !instrumentStates[instrument].initialized,"The provided instrument has already been initialized" );

        IERC20 instrumentContract = IERC20(instrument);

        // STATE UPDATE : NEW INSTRUMENT INITIALIZED
        instrumentStates[instrument] = instrumentState({ initialized: true, balance: instrumentContract.balanceOf(address(this)), totalAmountDripped: uint(0), totalAmountTransferred: uint(0) });
        allInstruments.push(instrument);        // STATE UPDATE : INSTRUMENT ADDED TO THE LIST
        
        emit InstrumentInitialized( instrument, instrumentStates[instrument].balance, instrumentStates[instrument].totalAmountDripped, instrumentStates[instrument].totalAmountTransferred  );
        return true;
    }
    
    // rechecks the balance and updates the stored balance for the instrument
    function updateInstrumentBalance(address instrument_address) external nonReentrant returns (uint) {
        require(instrumentStates[instrument_address].initialized,"This instrument is current not initialized");
        IERC20 token_ = IERC20(instrument_address);
        instrumentStates[instrument_address].balance = token_.balanceOf(address(this));
        return instrumentStates[instrument_address].balance;
    }


    // 
    function swapTokensUsingOxAPI( address allowanceTarget, address payable to, bytes calldata callDataHex, address token_bought, address token_sold, uint sellAmount ) external nonReentrant payable onlySIGHFinanceManager returns (bool) {
        require(instrumentStates[token_bought].initialized,"Instrument to be purchased has not been initialized yet.");
        require(instrumentStates[token_sold].initialized,"Instrument to be sold has not been initialized yet.");

        IERC20 bought_token = IERC20(token_bought);
        uint bought_token_prev_balance = bought_token.balanceOf(address(this));  // Current Bought Tokens Balance

        IERC20 sold_token = IERC20(token_sold);
        uint sold_token_prev_balance = sold_token.balanceOf(address(this));      // Current Tokens to be Sold Balance

        require(sold_token.approve(allowanceTarget, uint256(sellAmount)));                   // Allow the allowanceTarget address to spend an the needed amount
        (bool success, bytes memory _data) = to.call.value(msg.value)(callDataHex);          // Calling the encoded swap() function. ETH passed to cover for fee
    
        require(success, 'TOKEN SWAP FAILED');
        
        if (success) {
            uint new_bought_token_balance = bought_token.balanceOf(address(this));       // New Bought Tokens Balance
            uint new_sold_token_balance = sold_token.balanceOf(address(this));           // New Tokens to be Sold Balance
            
            instrumentStates[token_bought].balance = new_bought_token_balance;   // STATE UPDATE : Balance Updated for instruments bought
            instrumentStates[token_sold].balance = new_sold_token_balance;       // STATE UPDATE : Balance Updated for instruments sold

            uint deltaTokensBought = sub(new_bought_token_balance,bought_token_prev_balance,"New Token Balance for tokens that are being Bought is lower than its initial balance");
            uint deltaTokensSold = sub(sold_token_prev_balance,new_sold_token_balance,"New Token Balance for tokens that are being Sold is higher than its initial balance");
            
            emit TokensBought( token_bought ,  deltaTokensBought,  new_bought_token_balance);
            emit TokensSold( token_sold, deltaTokensSold, new_sold_token_balance );   
            emit TokenSwapTransactionData( _data );
            return true;         
        }

        return false;
    }

    /**
      * @notice Transfers the SIGH Tokens to the Target Address
      * @param target_ Address to which the amount is to be transferred
      * @param amount The Amount to be transferred
      * @return returns the Dripped Amount
    */    
    function transferSighTo(address target_, uint amount) external nonReentrant onlySighFinanceConfigurator returns (uint) {
        require(instrumentStates[address(sigh_Instrument)].initialized,"SIGH Instrument has not been initialized yet.");
        uint currentTradeSize = updatemaxTransferAmount(amount);
        
        require(sigh_Instrument.transfer(target_, currentTradeSize), 'The transfer did not complete.' );        // TRANSFERRING SIGH
        
        uint prevTransferAmount = instrumentStates[address(sigh_Instrument)].totalAmountTransferred;
        instrumentStates[address(sigh_Instrument)].totalAmountTransferred = add(prevTransferAmount,currentTradeSize,"Error when updating total SIGH Transferred");   // STATE UPDATE : totalAmountTransferred
        instrumentStates[address(sigh_Instrument)].balance = sigh_Instrument.balanceOf(address(this));                                                               // STATE UPDATE : SIGH balance updated

        emit SIGHTransferred( target_ , currentTradeSize,  block.number );
        return currentTradeSize;
    }
    
    // A CERTAIN NUMBER OF BLOCKS NEED TO PASS BETWEEN TRANSFER SIGH FUNCTION EXECUTION
    function updatemaxTransferAmount(uint sigh_amount) internal returns (uint)  {

        uint blockNumber = block.number;
        uint dif = sub(blockNumber, periodInitializationBlock, 'underflow');
        
        if ( dif > periodLength )   {
            uint currentBalance = sigh_Instrument.balanceOf(address(this)); // get current SIGH Balance of Treasury
            uint prevmaxTransferLimit = maxSIGHTransferLimit;
            maxSIGHTransferLimit = div(currentBalance,25,'updatemaxTransferAmount: Division returned error');  // STATE UPDATE : MAXIMUM SIGH THAT CAN BE TRANSFERRED UPDATED (4% in a day is the max)
            periodInitializationBlock = block.number;                                                                  // STATE UPDATE: Block number when this period begins is stored
            emit maxTransferAmountUpdated(prevmaxTransferLimit, maxSIGHTransferLimit, currentBalance);

            totalSighTradedAndTransferred = min(sigh_amount,maxSIGHTransferLimit );
            return totalSighTradedAndTransferred;
        }     
        else {
            uint maxTradeSize = sub(maxSIGHTransferLimit,totalSighTradedAndTransferred,"Error when subtracting current amount of sigh trade/transferred from max sigh transfer limit " );
            uint currentTradeSize = min( maxTradeSize, sigh_amount);
            totalSighTradedAndTransferred = add(totalSighTradedAndTransferred,currentTradeSize,"Error when updating total Sigh amount traded / transferred during the current period " );
            return currentTradeSize;
        }
    }


// ########################################
// ###########   VIEW FUNCTIONS  ##########
// ########################################

    // INSTRUMENT STATE RELATED VIEW FUNCTIONS
    
    function getInstrumentState(address instrument) external view returns ( bool initialized, uint balance, uint totalAmountDripped, uint totalAmountTransferred) {
        IERC20 instrumentContract = IERC20(instrument);
        uint balance_ = instrumentContract.balanceOf(address(this)); // get current balance of INSTRUMENT
        return (instrumentStates[instrument].initialized , balance_ , instrumentStates[instrument].totalAmountDripped , instrumentStates[instrument].totalAmountTransferred  );
    }

    function getAllInstruments() external view returns (address[] memory) {
        return allInstruments;        
    }

    function totalInstruments() external view returns (uint) {
        return allInstruments.length;
    }

    function getInstrumentBalance(address instrument_address) external view returns (uint) {
        return instrumentStates[instrument_address].balance;
    }
    
    function getTotalDrippedAmount(address instrument_address) external view returns (uint) {
        return instrumentStates[instrument_address].totalAmountDripped;
    }

    function getTotalTransferredAmount(address instrument_address) external view returns (uint) {
        return instrumentStates[instrument_address].totalAmountTransferred;
    }

    function getSIGHBalance() external view returns (uint) {
        IERC20 token_ = sigh_Instrument;
        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current SIGH balance
        return treasuryBalance_;
    }


    // INSTRUMENT DISTRIBUTION (PER BLOCK DRIPPING) RELATED VIEW FUNCTIONS

    function getDistributionState() external view returns( bool isAllowed, address targetAddress, address instrumentBeingDistributed, uint speed ) {
        return (treasuryDripState.isDripAllowed , treasuryDripState.targetAddressForDripping , treasuryDripState.instrumentBeingDripped , treasuryDripState.DripSpeed  );
    }

    function isDistributionAllowed() external view returns (bool) {
        return treasuryDripState.isDripAllowed;
    }

    function getTargetAddressForDistribution() external view returns (address) {
        return treasuryDripState.targetAddressForDripping;
    }

    function getinstrumentBeingDripped() external view returns (address) {
        if (treasuryDripState.isDripAllowed) {
            return treasuryDripState.instrumentBeingDripped;
        }
        return address(0);
    }

    function getDistributionSpeed() external view returns (uint) {
        if (treasuryDripState.isDripAllowed) {
            return treasuryDripState.DripSpeed;
        }
        return 0;
    }

    // SIGH BURN RELATED VIEW FUNCTIONS

    function getSIGHBurnState() external view returns ( bool isAllowed, uint burnSpeed, uint totalSighBurnt, uint sighBalance) {
        return (sighBurnState.is_SIGH_BurnAllowed ,sighBurnState.SIGHBurnSpeed ,sighBurnState.totalBurntSIGH, sigh_Instrument.balanceOf(address(this)) );
    }

    function getSIGHBurnSpeed() external view returns (uint) {
        if (sighBurnState.is_SIGH_BurnAllowed) {
            return sighBurnState.SIGHBurnSpeed;
        }
        return 0;
    }

    function getTotalBurntSigh() external view returns (uint) {
        return sighBurnState.totalBurntSIGH;
    }
    
    // SIGH TRANSFER LIMIT RELATED functions
    
    function getCurrentSIGHTransferState() external view returns (uint maxSIGHSpentLimit, uint totalSighTransferredAndTraded ) {
        return (maxSIGHTransferLimit, totalSighTradedAndTransferred);
    }
    
    function blocksRemainingForNextPeriod() external view returns (uint) {
        uint dif = sub(block.number, periodInitializationBlock,"Error during subtraction" );
        if (dif >= periodLength ) {
            return uint(0);
        }
        uint deltaAns = sub(periodLength, dif,"Error during final Subtraction" );
        return deltaAns;
    }
    

// ####################################################
// ###########   Internal helper functions  ##########
// ####################################################


  /* Internal helper functions for safe math */

    function add(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
        uint c = a + b;
        require(c >= a, errorMessage);
        return c;
    }

    function sub(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
        require(b <= a, errorMessage);
        uint c = a - b;
        return c;
    }

    function mul(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
        if (a == 0) {
        return 0;
        }
        uint c = a * b;
        require(c / a == b, errorMessage);
        return c;
    }

    function min(uint a, uint b) internal pure returns (uint) {
        if (a <= b) {
        return a;
        } else {
        return b;
        }
    }

    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }


}