pragma solidity ^0.5.16;

/**
 * @title Sigh Treasury Contract Interface
 * @notice The Treasury Contract for SIGH Finance
 * @dev Used to Swap Tokens, burns SIGH Tokens, and can ERC20 token can be distributed to a target address on a per block basis
 * @author SIGH Finance
 */

// interfaces
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol"; 
import "../../openzeppelin-upgradeability/VersionedInitializable.sol";

import "./EIP20InterfaceSIGH.sol";
import "../../configuration/GlobalAddressesProvider.sol";
import "../../LendingProtocolContracts/interfaces/IPriceOracleGetter.sol";

// import "./IForwarder.sol";
// import "../openzeppelin/EIP20Interface.sol";

contract Treasury is VersionedInitializable   {

    IERC20 private sigh_Instrument;    
    GlobalAddressesProvider public addressesProvider;
    IPriceOracleGetter public oracle;

    mapping (address => uint) InstrumentBalances;
    mapping (address => uint)  totalDrippedAmount;  // Stores the total amount of each instrument dripped
 
    bool isDripAllowed = false;    
    address private instrumentBeingDripped;
    address private targetAddressForDripping;
    uint private DripSpeed;
    uint public lastDripBlockNumber; 

    uint public maxTransferAmount;
    uint public coolDownPeriod = 2; // 5 min
    uint public prevTransferBlock;
    
    bool public is_SIGH_BurnAllowed;
    uint private SIGHBurnSpeed;
    uint private totalBurntSIGH = 0;
    uint public lastBurnBlockNumber;



    event instrumentBeingDistributedChanged(address prevInstrument, address newToken, uint blockNumber);
    event DripAllowedChanged(bool prevDripAllowed , bool newDripAllowed, uint blockNumber); 
    event DripSpeedChanged(uint prevDripSpeed , uint curDripSpeed,  uint blockNumber ); 
    event AmountDripped(address targetAddress, address instrumentBeingDripped, uint currentBalance , uint AmountDripped, uint totalAmountDripped ); 

    event maxTransferAmountUpdated(uint prevmaxTransferAmount, uint newmaxTransferAmount);
    event SIGHTransferred(address indexed TargetAddress, uint amountTransferred, uint blockNumber);

    event TokensBought( address indexed instrument_address, uint prev_balance, uint amount, uint new_balance );
    event TokensSold( address indexed instrument_address, uint prev_balance, uint amount, uint new_balance );
    event TokenSwapTransactionData( bytes data );

    event SIGHBurnAllowedChanged(bool prevBurnAllowed , bool newBurnAllowed, uint blockNumber); 
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


    event SIGHTreasuryInitialized(address msgSender, address addressesProvider, address SIGH, address sighDistributionHandler);

    uint256 constant private DATA_PROVIDER_REVISION = 0x1;

    function getRevision() internal pure returns(uint256) {
        return DATA_PROVIDER_REVISION;
    }
    
    
    function initialize( address addressesProvider_) public initializer {
        addressesProvider = GlobalAddressesProvider(addressesProvider_); 
        refreshConfigInternal();        
    }
    
    function refreshConfig() external onlySighFinanceConfigurator() {
        refreshConfigInternal(); 
    }

    function refreshConfigInternal() internal {
        sigh_Instrument = IERC20(addressesProvider.getSIGHAddress());           // SIGH TOKEN
        oracle = IPriceOracleGetter( addressesProvider.getPriceOracle() );     // PRICE ORACLE
        // lendingPoolCore = addressesProvider.getLendingPoolCore();       // 
    }

// ######################################################################################################
// ###########   THE HEDGE FUND MECHANISM - Only Sigh Finance Manager can call this function ############
// ######################################################################################################
    // 
    function swapTokensUsingOxAPI( address allowanceTarget, address payable to, bytes calldata callDataHex, address token_bought, address token_sold, uint sellAmount ) external payable onlySIGHFinanceManager returns (bool) {

        IERC20 bought_token;
        bought_token = IERC20(token_bought);

        IERC20 sold_token;
        sold_token = IERC20(token_sold);

        uint prev_bought_token_amount = bought_token.balanceOf(address(this));  // Current Bought Tokens Balance
        uint prev_sold_token_amount = sold_token.balanceOf(address(this));      // Current Tokens to be Sold Balance

        require(sold_token.approve(allowanceTarget, uint256(sellAmount)));                   // Allow the allowanceTarget address to spend an the needed amount
        (bool success, bytes memory _data) = to.call.value(msg.value)(callDataHex);          // Calling the encoded swap() function. ETH passed to cover for fee
    
        require(success, 'TOKEN SWAP FAILED');
        
        if (success) {
            uint new_bought_token_amount = bought_token.balanceOf(address(this));       // New Bought Tokens Balance
            uint new_sold_token_amount = sold_token.balanceOf(address(this));           // New Tokens to be Sold Balance
            
            InstrumentBalances[token_bought] = new_bought_token_amount;
            InstrumentBalances[token_sold] = new_sold_token_amount;

            uint tokenBoughtAmount = sub(new_bought_token_amount,prev_bought_token_amount,"New Token Balance for tokens that are being Bought is lower than its initial balance");
            uint tokenSoldAmount = sub(prev_sold_token_amount,new_sold_token_amount,"New Token Balance for tokens that are being Sold is higher than its initial balance");

            emit TokensBought( token_bought, prev_bought_token_amount, tokenBoughtAmount,  new_bought_token_amount);
            emit TokensSold( token_sold, prev_sold_token_amount, tokenSoldAmount, new_sold_token_amount );   
            emit TokenSwapTransactionData( _data );
            return true;         
        }

        return false;
    }

// ################################################################################################################ 
// ###########   BURN SIGH TOKENS  ################################################################################
// ###########   1. changeSIGHBurnAllowed() : Activates / Deactivates SIGH Burn (onlySighFinanceConfigurator) #####
// ###########   2. updateSIGHBurnSpeed() : Updates the SIGH Burn Speed (onlySighFinanceConfigurator) #############
// ###########   3. burnSIGHTokens() : Public Function. Allows anyone to burn SIGH Tokens. ########################
// ################################################################################################################


    function changeSIGHBurnAllowed(uint isAllowed) external onlySighFinanceConfigurator returns (bool) {
        bool prevStatus = is_SIGH_BurnAllowed;
        if (isAllowed == 0) {
            is_SIGH_BurnAllowed = false;
            updateSIGHBurnSpeedInternal(0);
        }
        else {
            is_SIGH_BurnAllowed = true;
        }
        emit SIGHBurnAllowedChanged(prevStatus, is_SIGH_BurnAllowed, block.number);
        return is_SIGH_BurnAllowed;
    }
        
    function updateSIGHBurnSpeed(uint newBurnSpeed) external onlySighFinanceConfigurator {
        require(updateSIGHBurnSpeedInternal(newBurnSpeed),"Sigh Burn speed was not updated properly");
    }

    function updateSIGHBurnSpeedInternal(uint newBurnSpeed) internal returns (bool) {
        if ( SIGHBurnSpeed > 0 ) {
            burnSIGHTokens();
        } 
        uint prevBurnSpeed = SIGHBurnSpeed;
        SIGHBurnSpeed = newBurnSpeed;
        lastBurnBlockNumber = block.number;
        
        require (SIGHBurnSpeed == newBurnSpeed, 'New SIGH Burn Speed not initialized properly');
        emit SIGHBurnSpeedChanged(prevBurnSpeed, SIGHBurnSpeed, block.number);
        return true;
    }

    function burnSIGHTokens() public returns (uint) {
        if (!is_SIGH_BurnAllowed ||SIGHBurnSpeed ==0)  {
            return uint(0);
        }
        
        address sighTokenAddress = address(sigh_Instrument);
        EIP20InterfaceSIGH token_ = EIP20InterfaceSIGH(sighTokenAddress);

        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current balance of SIGH
        uint blockNumber_ = block.number;
        uint deltaBlocks = sub(blockNumber_,lastBurnBlockNumber,"Block Numbers Substraction gave error");
        uint deltaBurn_ = mul(SIGHBurnSpeed, deltaBlocks, "BurnTotal overflow");
        uint toBurn_ = min(treasuryBalance_, deltaBurn_);
        
        require(treasuryBalance_ != 0, 'The treasury currently does not have any SIGH tokens.');
        require(token_.burn(toBurn_), 'The SIGH burn was not successful' );
        
        lastBurnBlockNumber = blockNumber_;                         // setting the block number when the Burn is made
        uint prevTotalBurntAmount = totalBurntSIGH ;
        totalBurntSIGH = add(prevTotalBurntAmount,toBurn_,"Total Sigh Burnt Overflow");
        treasuryBalance_ = token_.balanceOf(address(this)); // get current balance

        InstrumentBalances[address(sigh_Instrument)] = treasuryBalance_;

        emit SIGH_Burned( address(sigh_Instrument), toBurn_, totalBurntSIGH,  treasuryBalance_, lastBurnBlockNumber ); 

        return toBurn_;
    }


// #########################################################################################################################################################
// ###########   _______TREASURY CAN DISTRIBUTE ANY TOKEN TO ANY ADDRESS AT A PER BLOCK BASIS_______ #######################################################
// ###########   1. initializeInstrumentDistribution() --> To initiate an Instrument distribution Session. (onlySighFinanceConfigurator)   #################
// ###########   2. changeInstrumentBeingDripped() --> Change the instrument being distributed (onlySighFinanceConfigurator)  ##############################
// ###########   3. updateDripSpeed() --> To update the current Dripping Speed (onlySighFinanceConfigurator) ###############################################
// ###########   4. resetInstrumentDistribution() --> Reset instrument distribution to start a new session (onlySighFinanceConfigurator)  ##################
// #########################################################################################################################################################

    function initializeInstrumentDistribution (address targetAddress, address instrumentToBeDistributed, uint distributionSpeed) external onlySighFinanceConfigurator returns (bool) {
        require(!isDripAllowed,"Instrument distribution needs to be reset before it can be initialized Again");

        targetAddressForDripping = targetAddress;                           // Sets the address to which these instruments will be distributed
        require(changeInstrumentBeingDrippedInternal(instrumentToBeDistributed),"Instrument to be distributed not assigned properly");    // Sets the instrument which will be distributed
        require(updateDripSpeedInternal(distributionSpeed),"Distribution Speed not initialized properly.");                         // Sets the distribution Speed

        isDripAllowed = true;                                               // INITIATES DISTRIBUTION
        lastDripBlockNumber = block.number;                                 // Distribution commences from current block
        return true;
    }

    /**
      * @notice Change the token being dripped to the Target Address
      * @param instrumentToDrip Address of the token to be dripped
      * @return returns the address of the token that will be Dripped
    */    
    function changeInstrumentBeingDripped(address instrumentToDrip ) external onlySighFinanceConfigurator returns (bool) {
        if ( isDripAllowed ) {  // First Distribute the remaining amount
            drip();
        }
        require(changeInstrumentBeingDrippedInternal(instrumentToDrip),"Instrument to be distributed not assigned properly");

    }

    function changeInstrumentBeingDrippedInternal(address instrumentToDrip) internal returns (bool) {
        IERC20 newToken = IERC20(instrumentToDrip);
        uint currentBalance = newToken.balanceOf(address(this)); 
        require(currentBalance > 0, 'The Treasury does not hold these new instruments');

        address prevInstrument = instrumentBeingDripped;
        instrumentBeingDripped = instrumentToDrip;
        require(instrumentBeingDripped == instrumentToDrip, 'Address for the instrument to be Dripped not assigned properly');

        emit instrumentBeingDistributedChanged(prevInstrument, instrumentBeingDripped, block.number);
        return true;
    }

    /**
      * @notice To change the Current Drip Speed
      * @param DripSpeed_ New Drip Speed
      * @return returns a Boolean True is Successful 
    */    
    function updateDripSpeed (uint DripSpeed_) external onlySighFinanceConfigurator returns (bool) {
        if (isDripAllowed) {
            drip();
        }
        require(updateDripSpeedInternal(DripSpeed_),"Distribution Speed not initialized properly.");
        return true;
  }

   function updateDripSpeedInternal( uint DripSpeed_ ) internal returns (bool) {
        uint prevDripSpeed = DripSpeed;
        DripSpeed = DripSpeed_;
        emit DripSpeedChanged(prevDripSpeed , DripSpeed, block.number);
        return true;
   }

    /**
      * @notice Switch to Reset (OFF) Dripping
      * @return return is Dripping is allowed or not
    */    
    function resetInstrumentDistribution() external onlySighFinanceConfigurator returns (bool) {
        if (!isDripAllowed) {
            return true;
        }
        drip();
        isDripAllowed = false;
        DripSpeed = uint(0);
        instrumentBeingDripped = address(0);
        targetAddressForDripping = address(0);
        emit DripAllowedChanged(true , isDripAllowed, block.number);
        return true;
    }

// ################################################################################
// ###########   THE FUNCTION TO DRIP THE TOKENS TO THE TARGET ADDRESS  ###########
// ################################################################################

    /**
      * @notice Drips the Tokens to the SIGHDistributionHandler
      * @return returns the Dripped Amount
    */    
    function drip() public returns (uint) {
        require(isDripAllowed, 'Instrument distribution is currently not initialized.');
        require(targetAddressForDripping != address(0),"The target address is not valid");
        require(DripSpeed > 0,"The distribution speed is set to zero");

        IERC20 token_ = IERC20(instrumentBeingDripped); 
        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current balance of the token Being Dripped
        uint blockNumber_ = block.number;
        uint deltaBlocks = sub(blockNumber_,lastDripBlockNumber,"Blocks Substraction overrflow");
        uint deltaDrip_ = mul(DripSpeed, deltaBlocks, "dripTotal overflow");
        uint toDrip_ = min(treasuryBalance_, deltaDrip_);
        
        require(treasuryBalance_ != 0, 'The treasury currently does not have any of tokens which are being Dripped');
        require(token_.transfer(targetAddressForDripping, toDrip_), 'The Instrument transfer did not complete.' );
        
        lastDripBlockNumber = blockNumber_;                         // setting the block number when the Drip is made
        uint prevTotalDrippedAmount = totalDrippedAmount[instrumentBeingDripped];
        totalDrippedAmount[instrumentBeingDripped] = add(prevTotalDrippedAmount,toDrip_,"Overflow");   
        treasuryBalance_ = token_.balanceOf(address(this)); // get current balance

        InstrumentBalances[instrumentBeingDripped] = treasuryBalance_;   // Update the instrument balance
        emit AmountDripped( targetAddressForDripping, instrumentBeingDripped, toDrip_, treasuryBalance_, totalDrippedAmount[instrumentBeingDripped] ); 
        return toDrip_;
    }

// ##########################################################
// ###########   FUNCTION TO TRANSFER SIGH TOKENS  ##########
// ##########################################################

    /**
      * @notice Transfers the SIGH Tokens to the Target Address
      * @param target_ Address to which the amount is to be transferred
      * @param amount The Amount to be transferred
      * @return returns the Dripped Amount
    */    
    function transferSighTo(address target_, uint amount) external onlySighFinanceConfigurator returns (bool) {
        updatemaxTransferAmount();
        require (amount < maxTransferAmount, "The amount provided is greater than the amount allowed");

        uint blockNumber = block.number;
        uint dif = sub(blockNumber, prevTransferBlock, 'underflow');
        require(dif > coolDownPeriod, 'The cool down period is not yet completed');

        IERC20 token_ = sigh_Instrument;

        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current balance
        require(treasuryBalance_ > amount , "The current treasury's SIGH balance is less than the amount to be transferred" );
        require(token_.transfer(target_, amount), 'The transfer did not complete.' );

        // uint prevTransferAmount = SIGH_Transferred[target_];
        // uint totalTransferAmount = add(prevTransferAmount,amount,"Overflow");
        // SIGH_Transferred[target_] = totalTransferAmount;
        prevTransferBlock = block.number;
        uint new_sigh_balance = token_.balanceOf(address(this));
        InstrumentBalances[address(sigh_Instrument)] = new_sigh_balance;

        emit SIGHTransferred( target_ , amount,  block.number );
        return true;
    }
    
    // Maximum of 0.1% of total supply can be transferred from the treasury in a day
    function updatemaxTransferAmount() internal returns (uint) {
        IERC20 token_ = sigh_Instrument;
        uint totalSupply = token_.totalSupply(); // get total Supply
        require(totalSupply > 0, 'Total Supply of SIGH tokens returned not valid');
        uint newtransferAmount = div(totalSupply,1000,'updatemaxTransferAmount: Division returned error');

        uint prevmaxTransferAmount = maxTransferAmount;
        maxTransferAmount = newtransferAmount;
        emit maxTransferAmountUpdated(prevmaxTransferAmount,maxTransferAmount);
        return maxTransferAmount;
    }



// ########################################
// ###########   VIEW FUNCTIONS  ##########
// ########################################

    // rechecks the balance and updates the stored balances array
    function updateInstrumentBalance(address instrument_address) external returns (uint) {
        IERC20 token_ = IERC20(instrument_address);
        uint balance = token_.balanceOf(address(this));
        if (balance == 0) {
            return 0;
        }
        InstrumentBalances[instrument_address] = balance;
        return InstrumentBalances[instrument_address];
    }

    function getSIGHBalance() external view returns (uint) {
        IERC20 token_ = sigh_Instrument;
        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current SIGH balance
        return treasuryBalance_;
    }

    function getInstrumentBalance(address instrument_address) external view returns (uint) {
        return InstrumentBalances[instrument_address];
    }

    function isDistributionAllowed() external view returns (bool) {
        return isDripAllowed;
    }

    function getTargetAddressForDistribution() external view returns (address) {
        return targetAddressForDripping;
    }

    function getinstrumentBeingDripped() external view returns (address) {
        if (isDripAllowed) {
            return instrumentBeingDripped;
        }
        return address(0);
    }
    
    function getTotalDrippedAmount(address token) external view returns (uint) {
        return totalDrippedAmount[token];
    }

    function getDistributionSpeed() external view returns (uint) {
        if (isDripAllowed) {
            return DripSpeed;
        }
        return 0;
    }


    // function getAmountTransferred(address target) external view returns (uint) {
    //     return SIGH_Transferred[target];
    // }


    function getBurnSpeed() external view returns (uint) {
        if (is_SIGH_BurnAllowed) {
            return SIGHBurnSpeed;
        }
        return 0;
    }

    function getTotalBurntSigh() external view returns (uint) {
        return totalBurntSIGH;
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