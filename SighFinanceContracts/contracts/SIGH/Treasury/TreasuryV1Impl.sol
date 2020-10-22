pragma solidity ^0.5.16;

// interfaces
import "./IForwarder.sol";
import "../openzeppelin/EIP20Interface.sol";
import "./TreasuryCore.sol";
import "./TreasuryStorage.sol";
import "./TreasuryInterface.sol";
import "./EIP20InterfaceSIGH.sol";
/**
 * @title SighFinance's Treasury Contract
 * @author SighFinance
 */
contract Treasury TreasuryV1Storage   {
    
    uint public maxTransferAmount;
    uint public coolDownPeriod = 2; // 5 min
    uint public prevTransferBlock;
    
    bool public is_SIGH_BurnAllowed;
    uint public totalBurntSIGH = 0;
    uint public lastBurnBlockNumber;

    uint public lastDripBlockNumber; 

    event tokenBeingDistributedChanged(address prevToken, address newToken, uint blockNumber);
    event DripAllowedChanged(bool prevDripAllowed , bool newDripAllowed, uint blockNumber); 
    event DripSpeedChanged(uint prevDripSpeed , uint curDripSpeed,  uint blockNumber ); 
    event AmountDripped(address tokenBeingDripped, uint currentBalance , uint AmountDripped, uint totalAmountDripped ); 

    event maxTransferAmountUpdated(uint prevmaxTransferAmount, uint newmaxTransferAmount);
    event SIGHTransferred(address indexed TargetAddress, uint amountTransferred, uint totalAmountTransferred, uint blockNumber);

    event TokensBought( address indexed token_Address, uint prev_balance, uint new_balance );
    event TokensSold( address indexed token_Address, uint prev_balance, uint new_balance );
    event TokenSwapTransactionData( bytes data );

    event SIGHBurnAllowedChanged(bool prevBurnAllowed , bool newBurnAllowed, uint blockNumber); 
    event SIGH_Burned(address sigh_Address, uint amount, uint totalSIGHBurned, uint remaining_balance, uint blockNumber);
    event SIGHBurnSpeedChanged(uint prevSpeed, uint newSpeed, uint blockNumber);

    /**
      * @notice Constructor
      * @param sigh_token_ The SIGH Token Address
      * @param sightroller_Address_ The Sightroller Contract Address 
    */    
    constructor (address sigh_token_, address sightroller_Address_ ) public {
        admin = msg.sender;
        sigh_token = EIP20Interface(sigh_token_);
        sightroller_address = sightroller_Address_;
    }
    
    // Testing
    function updateSighTrollerAddress(address newSightroller) public returns (bool) {
        require(msg.sender == admin,'Only Admin can change sightroller_address');
        sightroller_address = newSightroller;
    }


// ##############################################################################################################################
// ###########   TREASURY CAN DISTRIBUTE ANY TOKEN TO THE SIGHTROLLER AT A PER BLOCK BASIS                           ############
// ###########   1. ChangeTokenBeingDripped() --> Change the token being dripped to the Protocol's Core Contract     ############
// ###########   2. ChangeDrippingStatus() --> Switch to ON/OFF Dripping                // ######################################
// ###########   3. changeDripSpeed() --> To change the Current Drip Speed              // ######################################
// ##############################################################################################################################

    /**
      * @notice Change the token being dripped to the Protocol's Core Contract
      * @param tokenToDrip Address of the token to be dripped
      * @return returns the address of the token that will be Dripped
    */    
    function ChangeTokenBeingDripped(address tokenToDrip ) public returns (address) {
        require(msg.sender == admin,'Only Admin can begin/stop Dripping');

        if ( isDripAllowed ) {
            drip();
        }

        EIP20Interface newToken = EIP20Interface(tokenToDrip);
        uint currentBalance = newToken.balanceOf(address(this)); 

        require(currentBalance > 0, 'The Treasury does not hold these new tokens');

        address prevToken = tokenBeingDripped;
        tokenBeingDripped = tokenToDrip;
        require(tokenBeingDripped == tokenToDrip, 'Address for the token to be Dripped not assigned properly');

        emit tokenBeingDistributedChanged(prevToken, tokenBeingDripped, block.number);
        return tokenBeingDripped;
    }

    /**
      * @notice Switch to ON/OFF Dripping
      * @param val If 0, dripping is disabled, else enabled
      * @return retursn is Dripping is allowed or not
    */    
    function ChangeDrippingStatus( uint val ) public returns (bool) {
        require(msg.sender == admin,'Only Admin can begin/stop Dripping');
        bool prevDripAllowed = isDripAllowed;

        if (isDripAllowed) {
            drip();
        }

        if (val == 0 ) {
            isDripAllowed = false;
        }
        else if (val > 0) {
            isDripAllowed = true;
            lastDripBlockNumber = block.number;
        }

        emit DripAllowedChanged(prevDripAllowed , isDripAllowed, block.number);
        return true;
    }

    /**
      * @notice To change the Current Drip Speed
      * @param DripSpeed_ New Drip Speed
      * @return returns a Boolean True is Successful 
    */    
    function changeDripSpeed (uint DripSpeed_) public returns (bool) {
        require(admin == msg.sender,"Drip rate can only be changed by the Admin");
        if (isDripAllowed) {
            drip();
        }
        uint prevDripSpeed = DripSpeed;
        DripSpeed = DripSpeed_;
        emit DripSpeedChanged(prevDripSpeed , DripSpeed, block.number);
        return true;
  }

// ################################################################################
// ###########   THE FUNCTION TO DRIP THE TOKENS TO THE CORE CONTRACT  ############
// ################################################################################

    /**
      * @notice Drips the Tokens to the SIGHtroller
      * @return returns the Dripped Amount
    */    
    function drip() public returns (uint) {
        require(isDripAllowed, 'Drip is currently not allowed.');

        EIP20Interface token_ = EIP20Interface(tokenBeingDripped); 

        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current balance of the token Being Dripped
        uint blockNumber_ = block.number;
        uint deltaDrip_ = mul(DripSpeed, blockNumber_ - lastDripBlockNumber, "dripTotal overflow");
        uint toDrip_ = min(treasuryBalance_, deltaDrip_);
        
        require(treasuryBalance_ != 0, 'The treasury currently does not have any of tokens which are being Dripped');
        require(token_.transfer(sightroller_address, toDrip_), 'The transfer did not complete.' );
        
        lastDripBlockNumber = blockNumber_; // setting the block number when the Drip is made
        uint prevTotalDrippedAmount = totalDrippedAmount[tokenBeingDripped];
        totalDrippedAmount[tokenBeingDripped] = add(prevTotalDrippedAmount,toDrip_,"Overflow");
        treasuryBalance_ = token_.balanceOf(address(this)); // get current balance

        TokenBalances[tokenBeingDripped] = treasuryBalance_;

        emit AmountDripped( tokenBeingDripped, treasuryBalance_, toDrip_ , totalDrippedAmount[tokenBeingDripped] ); 
        
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
    function transferSighTo(address target_, uint amount) public returns (bool) {
        require (msg.sender == admin, "Only Admin can transfer tokens from the Treasury");
        updatemaxTransferAmount();
        require (amount < maxTransferAmount, "The amount provided is greater than the amount allowed");

        uint blockNumber = block.number;
        uint dif = sub(blockNumber, prevTransferBlock, 'underflow');
        require(dif > coolDownPeriod, 'The cool down period is not completed');

        EIP20Interface token_ = sigh_token;

        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current balance
        require(treasuryBalance_ > amount , "The current treasury's SIGH balance is less than the amount to be transferred" );
        require(token_.transfer(target_, amount), 'The transfer did not complete.' );

        uint prevTransferAmount = SIGH_Transferred[target_];
        uint totalTransferAmount = add(prevTransferAmount,amount,"Overflow");
        SIGH_Transferred[target_] = totalTransferAmount;
        prevTransferBlock = block.number;

        uint new_sigh_balance = token_.balanceOf(address(this));
        TokenBalances[address(sigh_token)] = new_sigh_balance;

        emit SIGHTransferred( target_ , amount, totalTransferAmount,  block.number );
        return true;
    }

    function updatemaxTransferAmount() internal returns (uint) {
        EIP20Interface token_ = sigh_token;
        uint totalSupply = token_.totalSupply(); // get total Supply
        require(totalSupply > 0, 'Total Supply of SIGH tokens returned not valid');
        uint newtransferAmount = div(totalSupply,100,'updatemaxTransferAmount: Division returned error');

        uint prevmaxTransferAmount = maxTransferAmount;
        maxTransferAmount = newtransferAmount;
        emit maxTransferAmountUpdated(prevmaxTransferAmount,maxTransferAmount);
        return maxTransferAmount;
    }

// ################################################# 
// ###########   FUNCTION TO SWAP TOKENS  ##########
// ################################################# 

    function swapTokensUsingOxAPI( address to, bytes memory callDataHex, address token_bought, address token_sold ) public payable returns (bool) {
        require(msg.sender == admin, 'Only Admin can call Token Swap Function on 0x API');
        IForwarder forwarder;
        forwarder = IForwarder(to);
        
        EIP20Interface bought_token;
        bought_token = EIP20Interface(token_bought);

        EIP20Interface sold_token;
        sold_token = EIP20Interface(token_sold);

        uint prev_bought_token_amount = bought_token.balanceOf(address(this));
        uint prev_sold_token_amount = sold_token.balanceOf(address(this));


        (bool success, bytes memory _data) = address(forwarder).call.value(msg.value)(callDataHex);

        if (success) {
            uint new_bought_token_amount = bought_token.balanceOf(address(this));
            uint new_sold_token_amount = sold_token.balanceOf(address(this));
            
            TokenBalances[token_bought] = new_bought_token_amount;
            TokenBalances[token_sold] = new_sold_token_amount;

            emit TokensBought( token_bought, prev_bought_token_amount, new_bought_token_amount);
            emit TokensSold( token_sold, prev_sold_token_amount, new_sold_token_amount );   
            emit TokenSwapTransactionData( _data );
            return true;         
        }

        return false;
    }

// ################################################# 
// ###########   BURN SIGH TOKENS  ##########
// ################################################# 


    function changeSIGHBurnAllowed(uint isAllowed) public returns (bool) {
        require (msg.sender == admin,'Only Admin can decide is SIGH Burn is currently allowed or not.');

        bool prevStatus = is_SIGH_BurnAllowed;
        
        if (isAllowed == 0) {
            is_SIGH_BurnAllowed = false;
            updateSIGHBurnSpeedInternal(0);
        }
        else {
            is_SIGH_BurnAllowed = true;
        }
        emit SIGHBurnAllowedChanged(prevStatus, is_SIGH_BurnAllowed, block.number);
    }
        
    function updateSIGHBurnSpeed(uint newBurnSpeed) public {
        require (msg.sender == admin,'Only Admin can update SIGH Burn Speed');
        require (is_SIGH_BurnAllowed,'SIGH Burn is currently not allowed by the Treasury.');
        updateSIGHBurnSpeedInternal(newBurnSpeed);
    }

    function updateSIGHBurnSpeedInternal(uint newBurnSpeed) internal {
        if ( SIGHBurnSpeed > 0 ) {
            burnSIGHTokens();
        } 
        uint prevBurnSpeed = SIGHBurnSpeed;
        SIGHBurnSpeed = newBurnSpeed;
        lastBurnBlockNumber = block.number;
        
        require (SIGHBurnSpeed == newBurnSpeed, 'New SIGH Burn Speed not initialized properly');
        emit SIGHBurnSpeedChanged(prevBurnSpeed, SIGHBurnSpeed, block.number);
    }

    function burnSIGHTokens() public returns (bool) {
        require (is_SIGH_BurnAllowed,'SIGH Burn is currently not allowed by the Treasury.');
        
        address sighTokenAddress = address(sigh_token);
        EIP20InterfaceSIGH token_ = EIP20InterfaceSIGH(sighTokenAddress);


        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current balance of SIGH
        uint blockNumber_ = block.number;
        uint deltaBurn_ = mul(SIGHBurnSpeed, blockNumber_ - lastBurnBlockNumber, "BurnTotal overflow");
        uint toBurn_ = min(treasuryBalance_, deltaBurn_);
        
        require(treasuryBalance_ != 0, 'The treasury currently does not have any SIGH tokens.');
        require(token_.burn(toBurn_), 'The burn did not complete.' );
        
        lastBurnBlockNumber = blockNumber_;                         // setting the block number when the Burn is made
        uint prevTotalBurntAmount = totalBurntSIGH ;
        totalBurntSIGH = add(prevTotalBurntAmount,toBurn_,"Overflow");
        treasuryBalance_ = token_.balanceOf(address(this)); // get current balance

        TokenBalances[address(sigh_token)] = treasuryBalance_;

        emit SIGH_Burned( address(sigh_token), toBurn_, totalBurntSIGH,  treasuryBalance_, lastBurnBlockNumber ); 

        return true;
    }


// ########################################
// ###########   VIEW FUNCTIONS  ##########
// ########################################

    function getSIGHBalance() external view returns (uint) {
        EIP20Interface token_ = sigh_token;
        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current SIGH balance
        return treasuryBalance_;
    }

    function getTokenBalance(address token_address) external view returns (uint) {
        return TokenBalances[token_address];
    }

    function getAmountTransferred(address target) external view returns (uint) {
        return SIGH_Transferred[target];
    }

    function getDripSpeed() external view returns (uint) {
        if (isDripAllowed) {
            return DripSpeed;
        }
        return 0;
    }

    function getBurnSpeed() external view returns (uint) {
        if (is_SIGH_BurnAllowed) {
            return SIGHBurnSpeed;
        }
        return 0;
    }
    
    function getTokenBeingDripped() external view returns (address) {
        if (isDripAllowed) {
            return tokenBeingDripped;
        }
        return address(0);
    }
    

    function getTotalDrippedAmount(address token) external view returns (uint) {
        return totalDrippedAmount[token];
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