pragma solidity ^0.5.0;

/**
 * @title Sigh Staking Contract
 * @notice Distributes rewards (Fee collected from Lending Protocol ) to SIGH Stakers
 * @author SIGH Finance
 */


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "../Math/Exponential.sol";

import "../../openzeppelin-upgradeability/VersionedInitializable.sol";
import "../interfaces/IKyberNetworkProxyInterface.sol";
import "../libraries/EthAddressLib.sol";


contract SighStaking is VersionedInitializable {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    IERC20 private sigh_Instrument;

     struct instrumentState {
        string name;
        uint256 index;
        uint totalAmountRewarded;
        uint lastUpdatedBlock;

    }

    mapping (address => instrumentState) private instrumentStates;
    address[] private instrumentsRewarded;                             // Array of all the instruments that heve been rewarded
    address private instrumentBeingRewarded;                         // Instrument currently being distributed among the stakers
    uint private rewardDistributionSpeed;                             // Distribution speed (per block) of the instrument being rewarded

    struct stakingBalance {
        bool alreadyAStaker;
        uint stakedBalance;
        mapping (address => uint) instrumentIndex;
        mapping (address => uint)  instrumentAccumulated;
    }

    uint private totalStakedSigh;
    uint private numberOfStakers;

    uint256 public constant IMPLEMENTATION_REVISION = 0x1;

// ########################################### 
// ##############  MODIFIERS   ###############
// ########################################### 

    modifier onlySIGHFinanceManager {
        require( globalAddressesProvider.getSIGHFinanceManager() == msg.sender, "The caller must be the SIGH Finance Manager" );
        _;
    }
    //only SIGH Distribution Manager can use functions affected by this modifier
    modifier onlySighFinanceConfigurator {
        require(addressesProvider.getSIGHFinanceConfigurator() == msg.sender, "The caller must be the SIGH Finanace Configurator Contract");
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
    function initialize(  address addressesProvider_ ) public initializer {
        addressesProvider = addressesProvider_;
    }


// ############################################
// ##############  STAKE SIGH   ###############
// ############################################

    function stake_SIGH(uint amount) external returns (bool) {
        require(amount > 0,"SIGH to be Staked cannot be zero.");

        updateRewardIndexInternal();                    // UPDATES INSTRUMENT INDEX
        if (stakingBalances[msg.sender].alreadyAStaker) {
            updateUserIndexInternal();                  // UPDATES USER INDEX
        }

        uint prevBalance = sigh_Instrument.balanceOf(address(this));
        require(sigh_Instrument.transferFrom( msg.sender, address(this), amount ),"SIGH could not be transferred to the Staking Contract" );
        uint newBalance = sigh_Instrument.balanceOf(address(this));

        uint diff = sub_( newBalance, prevBalance, "New Sigh balance is less than the previous balance." );
        require(diff == amount,"Amount to be staked and the amount transferred do not match");

        uint prevStakedBalance = stakingBalances[msg.sender].stakedBalance ;                  
        stakingBalances[msg.sender].stakedBalance = add_(prevStakedBalance, amount, "New Staking balance overflow");    // "STAKED BALANCE" UPDATED [ADDITION] (STATE UPDATE)

        uint prevTotalStakedBalance = totalStakedSigh ;                  
        totalStakedSigh = add_(prevTotalStakedBalance, amount);                                                         // "TOTAL STAKED SIGH" [ADDITION] (STATE UPDATE)


        if ( !stakingBalances[msg.sender].alreadyAStaker ) {                                                            // USER STAKING FOR THE FIRST TIME
            stakingBalances[msg.sender].alreadyAStaker = true;
            stakingBalances[msg.sender].index = instrumentStates[instrumentBeingRewarded].index;
            numberOfStakers = add_(numberOfStakers,uint(1));
        }

        SighStaked( msg.sender, amount, stakingBalances[msg.sender].index, stakingBalances[msg.sender].stakedBalance, stakingBalances[msg.sender].instrumentAccumulated, , block.number   );
        return true;
    }

// ##############################################
// ##############  UNSTAKE SIGH   ###############
// ##############################################

    function unstake_SIGH(uint amount) external returns (bool) {
        require(amount > 0,"SIGH to be Un-Staked cannot be zero.");
        require(stakingBalances[msg.sender].alreadyAStaker,"User doesn't have any Staked amount");

        updateRewardIndexInternal();          // UPDATES INSTRUMENT INDEX
        updateUserIndexInternal();             // UPDATES USER INDEX

        if ( amount > stakingBalances[msg.sender].stakedBalance ) {     // Unstake the complete amount
            amount = stakingBalances[msg.sender].stakedBalance;
        }

        uint prevBalance = sigh_Instrument.balanceOf(address(this));
        require(sigh_Instrument.transfer( msg.sender, amount ),"SIGH could not be transferred to the User" );
        uint newBalance = sigh_Instrument.balanceOf(address(this));

        uint diff = sub( prevBalance, newBalance, "New Sigh balance is greater than the previous balance." );
        require(diff == amount,"Amount to be un-staked and the amount transferred do not match");

        uint prevStakedBalance = stakingBalances[msg.sender].stakedBalance;                  
        stakingBalances[msg.sender].stakedBalance = sub_(prevStakedBalance, amount, "New Staking balance underflow");    // "STAKED BALANCE" UPDATED [SUBTRACTION] (STATE UPDATE)

        if (stakingBalances[msg.sender].stakedBalance == 0) {
            stakingBalances[msg.sender].alreadyAStaker = false;
            transferAccumulatedRewardsInternal(msg.sender);
            stakingBalances[msg.sender].index = uint(0);
            numberOfStakers = sub_(numberOfStakers, uint(1));
        }

        SighUnstaked( msg.sender, amount, stakingBalances[msg.sender].index, stakingBalances[msg.sender].stakedBalance, stakingBalances[msg.sender].instrumentAccumulated, , block.number   );
        return true;
    }

// #######################################################################################################
// ##############  INTERNAL FUNCTIONS TO UPDATE INSTRUMENT DISTRIBUTION AND USER INDEXES   ###############
// #######################################################################################################

    function updateRewardIndexInternal() internal {

        instrumentState storage currentRewardInstrument = instrumentStates[instrumentBeingRewarded];

        uint blockNumber = block.number;
        uint deltaBlocks = sub_(blockNumber, uint( currentRewardInstrument.lastUpdatedBlock ), 'updateRewardIndex : Block Subtraction Underflow');    // Delta Blocks 
        
        if (deltaBlocks > 0 && rewardDistributionSpeed > 0 && totalStakedSigh > 0) {    
            uint reward_Accrued = mul_(deltaBlocks, rewardDistributionSpeed);                                                // Total reward accured over delta blocks
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

        emit updatedInstrumnetBeingDistributedIndex( instrumentBeingRewarded, instrumentStates[instrumentBeingRewarded].name, instrumentStates[instrumentBeingRewarded].index, instrumentStates[instrumentBeingRewarded].totalAmountRewarded, instrumentStates[instrumentBeingRewarded].lastUpdatedBlock );
    }



    function updateUserIndexInternal(address staker) internal {

        uint instrumentIndex = instrumentStates[instrumentBeingRewarded].index;
        uint stakerIndex = stakingBalances[staker].index;
        stakingBalances[staker].index = instrumentIndex;                                                             // STATE UPDATE - STAKER's INDEX UPDATED  

        uint deltaIndexes = sub_(instrumentIndex, stakerIndex);
        uint newInstrumentAccumulated = mul_(deltaIndexes, stakingBalances[staker].stakedBalance ); 

        uint prevInstrumentAccumulated   = stakingBalances[staker].instrumentAccumulated[instrumentBeingRewarded];
        stakingBalances[staker].instrumentAccumulated[instrumentBeingRewarded] = add_(prevInstrumentAccumulated, newInstrumentAccumulated);   // STATE UPDATE - STAKER's "INSTRUMENT ACCUMULATED AMOUNT" UPDATED  

        emit updateStakerIndexUpdated( staker, instrumentIndex, stakerIndex, deltaIndexes, newInstrumentAccumulated, stakingBalances[staker].instrumentAccumulated[instrumentBeingRewarded], block.number );    
    }

// ################################################################################
// ##############  FUNCTION RELATED TO REWARD INSTRUMENT TRANSFER   ###############
// ################################################################################

    function claimAccumulatedInstrument(address instrumentToBeClaimed) external {
        transferAccumulatedRewardsInternal(msg.sender, instrumentToBeClaimed);
    }


    function transferAccumulatedRewardsInternal(address staker, address instrumentToBeClaimed) internal {
        IERC20 instrumentAccumulated = IERC20(instrumentToBeClaimed);       
        uint amountToBeTransferred =  stakingBalances[msg.sender].instrumentAccumulated[instrumentToBeClaimed];   
        require(instrumentAccumulated.transfer(staker, stakingBalances[msg.sender].instrumentAccumulated[instrumentToBeClaimed]),"Instrument Accumulated failed to be transferred to the User");
        stakingBalances[msg.sender].instrumentAccumulated[instrumentToBeClaimed] = uint(0);
        emit instrumentTransferred( staker, instrumentToBeClaimed, instrumentStates[instrumentToBeClaimed].name, amountToBeTransferred, block.number );
    }


// ######################################################### 
// ##############  CONFIGURATION FUNCTIONS   ###############
// ######################################################### 

function setDistributionSpeed(uint newSpeed) onlySighFinanceConfigurator returns (bool) {

}



































}