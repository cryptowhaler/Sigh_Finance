pragma solidity ^0.5.0;

/**
 * @title Sigh Staking Contract
 * @notice Distributes rewards (Fee + % of Interest collected from Lending Protocol ) to SIGH Stakers
 * @author SIGH Finance
 */


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

import "../Math/Exponential.sol";

import "../../openzeppelin-upgradeability/VersionedInitializable.sol";
import "../../configuration/GlobalAddressesProvider.sol";


contract SighStaking is VersionedInitializable, Exponential  {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 public sigh_Instrument;
    GlobalAddressesProvider public addressesProvider;

     struct instrumentState {
        string name;
        uint256 index;
        uint rewardDistributionSpeed;
        uint totalAmountRewarded;
        uint lastUpdatedBlock;
        uint balance;
    }

    mapping (address => instrumentState) private instrumentStates;
    address[] private instrumentsRewarded;                             // Array of all the instruments that heve been rewarded
    uint private instrumentInitialIndex = 1e36;

    struct stakingBalance {
        bool alreadyAStaker;
        uint stakedBalance;
        mapping (address => uint) instrumentIndex;
        mapping (address => uint)  instrumentAccumulated;
    }

    mapping (address => stakingBalance) private stakingBalances;
    uint private totalStakedSigh;
    uint private numberOfStakers;
    uint private maxSighThatCanBeStaked = uint(-1);

    uint256 private constant IMPLEMENTATION_REVISION = 0x4;

    event SighStaked( address staker,uint amount, uint prevStakedBalance, uint staker_stakedBalance ,uint prevTotalStakedBalance, uint totalStakedSigh, uint numberOfStakers, uint blocknumber   );
    event SighUnstaked( address staker, uint amount, uint prevStakedBalance, uint staker_stakedBalance, uint prevTotalStakedBalance, uint totalStakedSigh, uint numberOfStakers, uint blocknumber   );

    event StreamingSighStaked( address staker, uint amount, uint prevBalance, uint staker_stakedBalance,uint totalStakedSigh, uint block_number   );

    event updatedInstrumnetBeingDistributedIndex( address instrument_Rewarded, string instrument_name, uint instrument_DistributionSpeed, uint instrument_index, uint instrument_totalAmountRewarded,  uint instrument_lastUpdatedBlock );
    event updateStakerIndexUpdated( address staker, uint instrumentIndex, uint stakerIndex, uint deltaIndexes, uint newInstrumentAccumulated, uint staker_instrumentIndex_instrumentRewarded, uint staker_instrumentAccumulated_instrumentBeingRewarded, uint block_number );    
    event instrumentTransferred( address staker, address instrumentToBeClaimed, string instrument_name, uint amountToBeTransferred, uint block_number );
    event TokensBought( address token_bought, uint prev_bought_token_amount, uint tokenBoughtAmount, uint new_bought_token_amount);
    event TokensSold( address token_sold, uint prev_sold_token_amount, uint tokenSoldAmount, uint new_sold_token_amount );   
    event TokenSwapTransactionData( bytes _data );

    event NewInstrumentForDistributionAdded( address newInstrument, string instrument_name, uint instrument_index, uint instrument_DistributionSpeed, uint instrument_totalAmountRewarded, uint instrument_balance,  uint instrument_lastUpdatedBlock  );
    event maxSighThatCanBeStakedUpdated( uint prevLimit, uint maxSighThatCanBeStaked, uint block_number);
    event DistributionSpeedUpdated( address instrumentAddress, string instrument_name, uint prevSpeed , uint instrument_DistributionSpeed, uint block_number );

// ########################################### 
// ##############  MODIFIERS   ###############
// ########################################### 

    modifier onlySIGHFinanceManager {
        require( addressesProvider.getSIGHFinanceManager() == msg.sender, "The caller must be the SIGH Finance Manager" );
        _;
    }
    //only SIGH Distribution Manager can use functions affected by this modifier
    modifier onlySighFinanceConfigurator {
        require(addressesProvider.getSIGHFinanceConfigurator() == msg.sender, "The caller must be the SIGH Finanace Configurator Contract");
        _;
    }

    modifier onlySighDistributionHandler {
        require(addressesProvider.getSIGHMechanismHandler() == msg.sender, "The caller must be the SIGH Distribution Handler Contract");
        _;
    }
    

// ########################################################
// ##############  INITIALIZING THE STATE   ###############
// ########################################################

    /// @notice Gets the revision number of the contract
    /// @return The revision numeric reference
    function getRevision() internal pure returns (uint256) {
        return IMPLEMENTATION_REVISION;
    }


    /// @notice Called by the proxy when setting this contract as implementation
    function initialize(  GlobalAddressesProvider addressesProvider_ ) public initializer {
        addressesProvider = addressesProvider_;
        sigh_Instrument = IERC20( addressesProvider.getSIGHAddress() );
    }


// ############################################
// ##############  STAKE SIGH   ###############
// ############################################

    function stake_SIGH(uint amount) external returns (bool) {
        require(amount > 0,"SIGH to be Staked cannot be zero.");

        updateRewardIndexInternal();                              // UPDATES INSTRUMENT INDEX
        if (stakingBalances[msg.sender].alreadyAStaker) {
            updateUserIndexInternal(msg.sender);                  // UPDATES USER INDEX
        }
        else {
            initializeStakerStateInternal(msg.sender);            // INITIALIZES USER INDEXES
        }
        

        // uint prevBalance = sigh_Instrument.balanceOf(address(this));
        require(sigh_Instrument.transferFrom( msg.sender, address(this), amount ),"SIGH could not be transferred to the Staking Contract" );
        // uint newBalance = sigh_Instrument.balanceOf(address(this));

        // uint diff = sub_( newBalance, prevBalance, "New Sigh balance is less than the previous balance." );
        // require(diff == amount,"Amount to be staked and the amount transferred do not match");

        uint prevStakedBalance = stakingBalances[msg.sender].stakedBalance ;                  
        stakingBalances[msg.sender].stakedBalance = add_(prevStakedBalance, amount, "New Staking balance overflow");    // "STAKED BALANCE" UPDATED [ADDITION] (STATE UPDATE)

        uint prevTotalStakedBalance = totalStakedSigh ;                  
        totalStakedSigh = add_(prevTotalStakedBalance, amount);                                                         // "TOTAL STAKED SIGH" [ADDITION] (STATE UPDATE)
        
        require(totalStakedSigh < maxSighThatCanBeStaked,"Maximum SIGH that can be staked limit reached" );

        emit SighStaked( msg.sender, amount, prevStakedBalance, stakingBalances[msg.sender].stakedBalance , prevTotalStakedBalance,  totalStakedSigh, numberOfStakers,  block.number   );
        return true;
    }

    function updateStakedBalanceForStreaming(address staker, uint amount) onlySighDistributionHandler external returns (bool) {

        updateRewardIndexInternal();                             // UPDATES INSTRUMENT INDEX
        if (stakingBalances[staker].alreadyAStaker) {
            updateUserIndexInternal(staker);                     // UPDATES USER INDEX
        }
        else {
            initializeStakerStateInternal(staker);            // INITIALIZES USER INDEXES
        }

        uint prevBalance = stakingBalances[staker].stakedBalance;
        stakingBalances[staker].stakedBalance = add_(prevBalance, amount,"New Staked Balance addition error");

        uint prevTotalStakedBalance = totalStakedSigh ;                  
        totalStakedSigh = add_(prevTotalStakedBalance, amount);                                                         // "TOTAL STAKED SIGH" [ADDITION] (STATE UPDATE)

        emit StreamingSighStaked( staker, amount, prevBalance, stakingBalances[staker].stakedBalance, totalStakedSigh,  block.number   );
        return true;
    }

// ##############################################
// ##############  UNSTAKE SIGH   ###############
// ##############################################

    function unstake_SIGH(uint amount) external returns (bool) {
        require(amount > 0,"SIGH to be Un-Staked cannot be zero.");
        require(stakingBalances[msg.sender].alreadyAStaker,"User doesn't have any Staked amount");

        updateRewardIndexInternal();                                     // UPDATES INSTRUMENT INDEX
        updateUserIndexInternal(msg.sender);                             // UPDATES USER INDEX

        if ( amount > stakingBalances[msg.sender].stakedBalance ) {      // Unstake the complete amount
            amount = stakingBalances[msg.sender].stakedBalance;
        }

//         uint prevBalance = sigh_Instrument.balanceOf(address(this));
        require(sigh_Instrument.transfer( msg.sender, amount ),"SIGH could not be transferred to the User" );
//         uint newBalance = sigh_Instrument.balanceOf(address(this));

        // uint diff = sub_( prevBalance, newBalance, "New Sigh balance is greater than the previous balance." );
        // require(diff == amount,"Amount to be un-staked and the amount transferred do not match");

        uint prevStakedBalance = stakingBalances[msg.sender].stakedBalance;                  
        stakingBalances[msg.sender].stakedBalance = sub_(prevStakedBalance, amount, "New Staking balance underflow");    // "STAKED BALANCE" UPDATED [SUBTRACTION] (STATE UPDATE)

        uint prevTotalStakedBalance = totalStakedSigh ;                  
        totalStakedSigh = sub_(prevTotalStakedBalance, amount,"Total Staked Sigh Subtraction underflow");                // "TOTAL STAKED SIGH" [ADDITION] (STATE UPDATE)


        if (stakingBalances[msg.sender].stakedBalance == 0) {
            stakingBalances[msg.sender].alreadyAStaker = false;
            transferAllAccumulatedRewardsInternal(msg.sender);
            numberOfStakers = sub_(numberOfStakers, uint(1));
        }

        emit SighUnstaked( msg.sender, amount, prevStakedBalance, stakingBalances[msg.sender].stakedBalance, prevTotalStakedBalance, totalStakedSigh, numberOfStakers, block.number   );
        return true;
    }



// #######################################################################################################
// ##############  INTERNAL FUNCTIONS TO UPDATE INSTRUMENT DISTRIBUTION AND USER INDEXES   ###############
// #######################################################################################################

    function updateRewardIndexInternal() internal {

        uint blockNumber = block.number;

        for (uint i =0 ; i<instrumentsRewarded.length ; i++ ) {

            instrumentState storage currentRewardInstrument = instrumentStates[ instrumentsRewarded[i] ];
            uint deltaBlocks = sub_(blockNumber, uint( currentRewardInstrument.lastUpdatedBlock ), 'updateRewardIndex : Block Subtraction Underflow');    // Delta Blocks 

            if (deltaBlocks > 0 && currentRewardInstrument.rewardDistributionSpeed > 0 && totalStakedSigh > 0) {    
                uint reward_Accrued = mul_(deltaBlocks, currentRewardInstrument.rewardDistributionSpeed);                         // Total reward accured over delta blocks
                Double memory ratio = fraction(reward_Accrued, totalStakedSigh);                                                 // Reward accured per Staked SIGH token
                Double memory newIndex = add_(Double({mantissa: currentRewardInstrument.index}), ratio);                         // Updated Index

                currentRewardInstrument.index = newIndex.mantissa;                                                    // STATE UPDATE - INSTRUMENT BEING DISTRIBUTED "INDEX" UPDATED
                currentRewardInstrument.lastUpdatedBlock = blockNumber;                                               // STATE UPDATE - INSTRUMENT BEING DISTRIBUTED "BLOCK NUMBER" UPDATED
                uint prevTotalAmountRewarded = currentRewardInstrument.totalAmountRewarded;
                currentRewardInstrument.totalAmountRewarded = add_(prevTotalAmountRewarded, reward_Accrued);          // STATE UPDATE - INSTRUMENT BEING DISTRIBUTED "TOTAL AMOUNT REWARDED" UPDATED
            } 
            else if ( deltaBlocks > 0 ) {         // When no reward is accured. Block number updated
                currentRewardInstrument.lastUpdatedBlock = blockNumber ;                                             // STATE UPDATE - INSTRUMENT BEING DISTRIBUTED "BLOCK NUMBER" UPDATED
            }

            emit updatedInstrumnetBeingDistributedIndex( instrumentsRewarded[i], instrumentStates[instrumentsRewarded[i]].name, instrumentStates[instrumentsRewarded[i]].rewardDistributionSpeed, instrumentStates[instrumentsRewarded[i]].index, instrumentStates[instrumentsRewarded[i]].totalAmountRewarded, instrumentStates[instrumentsRewarded[i]].lastUpdatedBlock );
        }
    }

    function updateUserIndexInternal(address staker) internal {

        for (uint i =0 ; i<instrumentsRewarded.length ; i++ ) { 

            uint instrumentIndex = instrumentStates[instrumentsRewarded[i]].index;
            uint stakerIndex = stakingBalances[staker].instrumentIndex[instrumentsRewarded[i]];
            stakingBalances[staker].instrumentIndex[instrumentsRewarded[i]] = instrumentIndex;                                                  // STATE UPDATE - STAKER's INDEX UPDATED  

            uint deltaIndexes = sub_(instrumentIndex, stakerIndex);
            uint newInstrumentAccumulated = mul_(deltaIndexes, stakingBalances[staker].stakedBalance ); 

            uint prevInstrumentAccumulated   = stakingBalances[staker].instrumentAccumulated[instrumentsRewarded[i]];
            stakingBalances[staker].instrumentAccumulated[instrumentsRewarded[i]] = add_(prevInstrumentAccumulated, newInstrumentAccumulated);   // STATE UPDATE - STAKER's "INSTRUMENT ACCUMULATED AMOUNT" UPDATED  

            emit updateStakerIndexUpdated( staker, instrumentIndex, stakerIndex, deltaIndexes, newInstrumentAccumulated, stakingBalances[staker].instrumentIndex[instrumentsRewarded[i]], stakingBalances[staker].instrumentAccumulated[instrumentsRewarded[i]], block.number );    
        }
    }

    function initializeStakerStateInternal(address staker) internal {
        for (uint i=0; i < instrumentsRewarded.length ; i++) {
            stakingBalances[staker].instrumentIndex[ instrumentsRewarded[i] ] = instrumentStates[ instrumentsRewarded[i] ].index;
        }
        stakingBalances[staker].alreadyAStaker = true;
        numberOfStakers = add_(numberOfStakers, uint(1));
    }

// ################################################################################
// ##############  FUNCTION RELATED TO INSTRUMENT TRANSFER   ###############
// ################################################################################

    function claimAllAccumulatedInstrumentsForUsers( address[] calldata stakingAddresses ) external {
        for (uint i=0;i<stakingAddresses.length;i++) {
            transferAllAccumulatedRewardsInternal(stakingAddresses[i]);
        }
    }

    function claimAllAccumulatedInstruments() external {
        transferAllAccumulatedRewardsInternal(msg.sender);
    }

    function claimAccumulatedInstrument(address instrumentToBeClaimed) external {
        transferAccumulatedRewardsInternal(msg.sender, instrumentToBeClaimed);
    }

    function transferAllAccumulatedRewardsInternal(address staker ) internal {
        for (uint i =0 ; i<instrumentsRewarded.length ; i++ ) { 
            transferAccumulatedRewardsInternal(staker, instrumentsRewarded[i] );
        }        
    }

    function transferAccumulatedRewardsInternal(address staker, address instrumentToBeClaimed) internal {
        IERC20 instrumentAccumulated_ = IERC20(instrumentToBeClaimed);       
        uint amountToBeTransferred =  stakingBalances[staker].instrumentAccumulated[instrumentToBeClaimed];  
        if (amountToBeTransferred > 0 && instrumentAccumulated_.balanceOf(address(this)) >= amountToBeTransferred ) {
            require(instrumentAccumulated_.transfer(staker, amountToBeTransferred ),"Instrument Accumulated failed to be transferred to the User");
            stakingBalances[staker].instrumentAccumulated[instrumentToBeClaimed] = uint(0);                                      // STATE UPDATE (USER"s ACCUMULATED INSTRUMENT UPDATED)
            instrumentStates[instrumentToBeClaimed].balance = instrumentAccumulated_.balanceOf(address(this));                       // STATE UPDATE (BALANCE OF THE INSTRUMENT UPDATED)
            emit instrumentTransferred( staker, instrumentToBeClaimed, instrumentStates[instrumentToBeClaimed].name, amountToBeTransferred, block.number );
        }
    }

// ##################################################### 
// ##############  TOKEN SWAP FUNCTION   ###############
// ##################################################### 

    function swapTokensUsingOxAPI( address allowanceTarget, address payable to, bytes calldata callDataHex, address token_bought, address token_sold, uint sellAmount ) external payable onlySIGHFinanceManager returns (bool) {
        require( token_sold != address(sigh_Instrument),"Staked SIGH Instrument cannot be sold by the staking contract");
        require( token_bought != address(sigh_Instrument),"Staked SIGH Instrument cannot be bought by the staking contract");

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
            
            uint amountSold = sub_(prev_sold_token_amount, new_sold_token_amount, "Amount Sold underflow");
            require( amountSold ==  sellAmount,"The sell amount mentioned and the actual amount transferred do not match" );

            uint tokenBoughtAmount = sub_(new_bought_token_amount,prev_bought_token_amount,"New Token Balance for tokens that are being Bought is lower than its initial balance");

            emit TokensBought( token_bought, prev_bought_token_amount, tokenBoughtAmount,  new_bought_token_amount);
            emit TokensSold( token_sold, prev_sold_token_amount, amountSold, new_sold_token_amount );   
            emit TokenSwapTransactionData( _data );
            return true;         
        }

        return false;
    }

// ########################################################################################## 
// ##############  CONFIGURATION FUNCTIONS (SIGH FINANCE CONFIGURATOR ONLY)   ###############
// ##########################################################################################

    function supportNewInstrumentForDistribution(address newInstrument, uint speed) external onlySighFinanceConfigurator returns (bool) {
        require(instrumentStates[newInstrument].index == 0, "The provided instrument address has already been added for distribution among the stakers");
        updateRewardIndexInternal();

        instrumentsRewarded.push(newInstrument);                                                                        // STATE UPDATE - NEW INSTRUMENT ADDED TO THE LIST OF INSTRUMENTS BEING DISTRIBUTED
        IERC20 instrumentContract = IERC20(newInstrument);
        ERC20Detailed instrumentContract_ = ERC20Detailed(newInstrument);
        instrumentStates[newInstrument] = instrumentState({ name: instrumentContract_.name(), 
                                                            index: instrumentInitialIndex, 
                                                            rewardDistributionSpeed: speed, 
                                                            totalAmountRewarded: uint(0), 
                                                            lastUpdatedBlock: block.number,
                                                            balance: instrumentContract.balanceOf(address(this))
                                                        });                                                              // STATE UPDATE - NEW INSTRUMENT STATE INITIALIZED

        emit NewInstrumentForDistributionAdded( newInstrument, instrumentStates[newInstrument].name, instrumentStates[newInstrument].index, instrumentStates[newInstrument].rewardDistributionSpeed, instrumentStates[newInstrument].totalAmountRewarded, instrumentStates[newInstrument].balance, instrumentStates[newInstrument].lastUpdatedBlock  );
        return true;
    }


    function setDistributionSpeed(address instrumentAddress , uint newSpeed) external onlySighFinanceConfigurator returns (bool) {
        require(instrumentStates[instrumentAddress].index > 0, "The provided instrument address has not been added for distribution among the stakers");

        if ( instrumentStates[instrumentAddress].rewardDistributionSpeed > 0) {
            updateRewardIndexInternal();
        }
        
        uint prevSpeed = instrumentStates[instrumentAddress].rewardDistributionSpeed;
        instrumentStates[instrumentAddress].rewardDistributionSpeed = newSpeed;                 // STATE UPDATE - DISTRIBUTION SPEED UPDATED
        instrumentStates[instrumentAddress].lastUpdatedBlock = block.number;                    // STATE UPDATE - BLOCK NUMBER FOR THE INSTRUMENT STATE UPDATED
        
        emit DistributionSpeedUpdated( instrumentAddress, instrumentStates[instrumentAddress].name, prevSpeed , instrumentStates[instrumentAddress].rewardDistributionSpeed, block.number );
        return true;
    }

    function updateMaxSighThatCanBeStaked(uint amount) external onlySighFinanceConfigurator returns (bool) { 
        uint prevLimit = maxSighThatCanBeStaked;
        maxSighThatCanBeStaked = amount;
        require(maxSighThatCanBeStaked == amount, "New value not assigned properly");
        emit maxSighThatCanBeStakedUpdated(prevLimit, maxSighThatCanBeStaked, block.number);
        return true;
    }

// ################################################## 
// ##############  PUBLIC FUNCTIONS   ###############
// ################################################## 

    function updateBalance(address instrument) public returns (uint) {
        require( instrument != address(sigh_Instrument),"Staked SIGH Instrument's balance cannot be updated as it may lead to ambiguities in calculations");
        
        IERC20 instrumentContract = IERC20(instrument);
        uint current_balance = instrumentContract.balanceOf(address(this));

        if (instrumentStates[instrument].index > 0 ) {
            instrumentStates[instrument].balance = current_balance;
        }

        return current_balance;
    }

// ################################################## 
// ##############  VIEW FUNCTIONS   ###############
// ################################################## 

    function getInstrumentsSupported() external view returns (address[] memory) {
        return instrumentsRewarded;
    }

    function isInstrumentSupported(address instrument) external view returns (bool) {
        if (instrumentStates[instrument].index > 0 ) {
            return true;
        }
        return false;
    }

    function getDistributionSpeed(address instrument) external view returns (uint) { 
        if (instrumentStates[instrument].index > 0 ) {
            return instrumentStates[instrument].rewardDistributionSpeed;
        }
        return uint(0); 
    }

    function getInstrumentState(address instrumentAddress) external view returns(string memory name, uint index, uint rewardDistributionSpeed,uint totalAmountRewarded, uint balance, uint lastUpdatedBlock) {
        // if (instrumentStates[instrumentAddress].index > 0 ) { 
            return ( instrumentStates[instrumentAddress].name, 
                    instrumentStates[instrumentAddress].index, 
                    instrumentStates[instrumentAddress].rewardDistributionSpeed,
                    instrumentStates[instrumentAddress].totalAmountRewarded, 
                    instrumentStates[instrumentAddress].balance, 
                    instrumentStates[instrumentAddress].lastUpdatedBlock 
                    );
        // }
        // string memory name = '';
        // return ( name, )
    }
    
    function getInstrumentBalance(address instrument) external view returns (uint) {
        IERC20 instrumentContract = IERC20(instrument);
        uint current_balance = instrumentContract.balanceOf(address(this));
        return current_balance;
    }

    function getStakedBalanceForStaker(address account) external view returns (uint) {
        return stakingBalances[account].stakedBalance;
    }

    function getStakersAccumulatedInstrumentAmount(address account, address instrument)  external view returns (uint) {
        return stakingBalances[account].instrumentAccumulated[instrument];    
    }

    function getTotalStakedSIGH()  external view returns (uint) { 
        return totalStakedSigh;
    }

    function getTotalStakers()  external view returns (uint) { 
        return numberOfStakers;
    }

    function getmaxSighThatCanBeStaked()  external view returns (uint) { 
        return maxSighThatCanBeStaked;
    }

}