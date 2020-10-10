pragma solidity ^0.5.16;

// interfaces
import "@0x/contracts-exchange-forwarder/contracts/src/interfaces/IForwarder.sol";
import "../openzeppelin/EIP20Interface.sol";
import "./TreasuryCore.sol";

/**
 * @title SighFinance's Treasury Contract
 * @author SighFinance
 */t
contract Treasury is TreasuryInterfaceV1,TreasuryV1Storage   {
    
    bool isDripAllowed = false;
    uint public lastDripBlockNumber; 
    uint public recentlyDrippedAmount;
    uint public totalDrippedAmount;

    /// @notice Emitted when an amount is dripped to the Sightroller
    event AmountDripped(uint currentBalance , uint AmountDripped, uint totalAmountDripped ); 

    event DripRateChanged(uint prevDripRate , uint curDripRate,  uint blockNumber ); 

    event DripAllowedChanged(bool prevDripAllowed , bool newDripAllowed, uint blockNumber); 

    event SIGHTransferred(address indexed TargetAddress, uint amountTransferred, uint totalAmountTransferred, uint blockNumber);

    event TokensBought( address indexed symbol, uint prev_balance, uint new_balance );

    event TokensSold( address indexed symbol, uint prev_balance, uint new_balance );

    event TokenSwapTransactionData( bytes data );

    /**
      * @notice Constructor
      * @param sigh_token_ The SIGH Token Address
      * @param sightroller_Address_ The Sightroller Contract Address 
    */    
    constructor (EIP20Interface sigh_token_, address sightroller_Address_ ) public {
        admin = msg.sender;
        sigh_token = sigh_token_;
        sightroller_address = sightroller_Address_;
    }

    /**
      * @notice Switch to ON/OFF Dripping
      * @param val O to Stop Dripping. Any other value to inititate Dripping.
      * @return returns a Boolean True is Successful 
    */    
  function ChangeIsDripAllowed(uint val) public returns (bool) {
    require(msg.sender == admin,'Only Admin can begin/stop Dripping');
    bool prevDripAllowed = isDripAllowed;
    if (val == 0) {
        drip();
        isDripAllowed = false;
    }
    else {
        isDripAllowed = true;
        lastDripBlockNumber = block.number;
    }
    emit DripAllowedChanged(prevDripAllowed, isDripAllowed, block.number );
    return true;      
  }

    /**
      * @notice To change the Current Drip Rate
      * @param dripRate_ New Drip Rate
      * @return returns a Boolean True is Successful 
    */    
    function changeDripRate (uint dripRate_) public returns (bool) {
        require(admin == msg.sender,"Drip rate can only be changed by the Admin");
        if (isDripAllowed) {
        drip();
        }
        uint prevDripRate = dripRate;
        dripRate = dripRate_;
        emit DripRateChanged(prevDripRate , dripRate, block.number);
        return true;
  }


    /**
      * @notice Drips the SIGH Tokens to the SIGHtroller
      * @return returns the Dripped Amount
    */    
    function drip() public returns (uint) {
        require(isDripAllowed, 'Drip is currently not allowed.');

        EIP20Interface token_ = sigh_token;

        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current SIGH balance
        uint blockNumber_ = block.number;
        uint deltaDrip_ = mul(dripRate, blockNumber_ - lastDripBlockNumber, "dripTotal overflow");
        uint toDrip_ = min(treasuryBalance_, deltaDrip_);
        
        require(treasuryBalance_ != 0, 'The treasury currently does not have any SIGH tokens' );
        require(token_.transfer(sightroller_address, toDrip_), 'The transfer did not complete.' );
        
        lastDripBlockNumber = blockNumber_; // setting the block number when the Drip is made
        recentlyDrippedAmount = toDrip_;
        uint prevTotalDrippedAmount = totalDrippedAmount;
        totalDrippedAmount = add(prevTotalDrippedAmount,toDrip_,"Overflow");
        treasuryBalance_ = token_.balanceOf(address(this)); // get current balance

        emit AmountDripped( treasuryBalance_, recentlyDrippedAmount , totalDrippedAmount ); 
        
        return toDrip_;
    }


    /**
      * @notice Transfers the SIGH Tokens to the Target Address
      * @param target_ Address to which the amount is to be transferred
      * @param amount The Amount to be transferred
      * @return returns the Dripped Amount
    */    
    function transferSighTo(address target_, uint amount) public returns (bool) {
        require (msg.sender == admin, "Only Admin can transfer tokens from the Treasury");

        EIP20Interface token_ = sigh_token;

        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current balance
        require(treasuryBalance_ > amount , "The current treasury's SIGH balance is less than the amount to be transferred" );
        require(sigh_token.transfer(target_, amount), 'The transfer did not complete.' );

        uint prevTransferAmount = SIGH_Transferred[target_];
        uint totalTransferAmount = add(prevTransferAmount,amount,"Overflow");
        SIGH_Transferred[target_] = totalTransferAmount;

        emit SIGHTransferred( target_ , amount, totalTransferAmount,  block.number );
        return true;
    }

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
            string bought_symbol = bought_token.symbol();
            string sold_symbol = sold_token.symbol();

            TokenBalances[bought_symbol] = new_bought_token_amount;
            TokenBalances[sold_symbol] = new_sold_token_amount;

            emit TokensBought( bought_symbol, prev_bought_token_amount, new_bought_token_amount );
            emit TokensSold( sold_symbol, prev_sold_token_amount, new_sold_token_amount );   
            emit TokenSwapTransactionData( _data );
            return true;         
        }

        return false;
    }

    function getSIGHBalance() external view returns (uint) {
        EIP20Interface token_ = sigh_token;
        uint treasuryBalance_ = token_.balanceOf(address(this)); // get current SIGH balance
        return treasuryBalance_;
    }

    function getTokenBalance(string symbol) external view returns (uint) {
        return TokenBalances[symbol];
    }

    function getAmountTransferred(address target) external view returns (uint) {
        return SIGH_Transferred[target];
    }

    function getDripRate() external view returns (uint) {
        if (isDripAllowed) {
            return dripRate;
        }
        return 0;
    }

    function getTotalDrippedAmount external view returns (uint) {
        return totalDrippedAmount;
    }

      // TreasuryCore is the storage Implementation (Function calls get redirected here from there)
  // When new Functionality contract is being initiated (Treasury Impl Contract is updated), we use this function
  // It is used to make the new implementation to be accepted by calling a function from TreasuryCore.
    function _become(TreasuryCore treasuryCoreAddress) public {
        require(msg.sender == treasuryCoreAddress.admin(), "only unitroller admin can change brains");
        require(treasuryCoreAddress._acceptImplementation() == 0, "change not authorized");
    }


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
}