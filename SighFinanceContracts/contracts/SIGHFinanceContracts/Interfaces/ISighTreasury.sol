pragma solidity ^0.5.16;

/**
 * @title Sigh Treasury Contract Interface
 * @notice The Treasury Contract for SIGH Finance
 * @dev Used to Swap Tokens, burns SIGH Tokens, and can ERC20 token can be distributed to a target address on a per block basis
 * @author SIGH Finance
 */

interface ISighTreasury {

    function refreshConfig() external returns (bool);


// ################################################################################################################ 
// ###########   BURN SIGH TOKENS  ################################################################################
// ###########   1. changeSIGHBurnAllowed() : Activates / Deactivates SIGH Burn (onlySighFinanceConfigurator) #####
// ###########   2. updateSIGHBurnSpeed() : Updates the SIGH Burn Speed (onlySighFinanceConfigurator) #############
// ###########   3. burnSIGHTokens() : Public Function. Allows anyone to burn SIGH Tokens. ########################
// ################################################################################################################


    function changeSIGHBurnAllowed(uint isAllowed) external returns (bool);
    function updateSIGHBurnSpeed(uint newBurnSpeed) external returns (bool);
    function burnSIGHTokens() external returns (uint);


// #########################################################################################################################################################
// ###########   _______TREASURY CAN DISTRIBUTE ANY TOKEN TO ANY ADDRESS AT A PER BLOCK BASIS_______ #######################################################
// ###########   1. initializeInstrumentDistribution() --> To initiate an Instrument distribution Session. (onlySighFinanceConfigurator)   #################
// ###########   2. changeInstrumentBeingDripped() --> Change the instrument being distributed (onlySighFinanceConfigurator)  ##############################
// ###########   3. updateDripSpeed() --> To update the current Dripping Speed (onlySighFinanceConfigurator) ###############################################
// ###########   4. resetInstrumentDistribution() --> Reset instrument distribution to start a new session (onlySighFinanceConfigurator)  ##################
// #########################################################################################################################################################

    function initializeInstrumentDistribution (address targetAddress, address instrumentToBeDistributed, uint distributionSpeed) external returns (bool);
    function changeInstrumentBeingDripped(address instrumentToDrip ) external returns (bool);
    function updateDripSpeed (uint DripSpeed_) external returns (bool);
    function resetInstrumentDistribution() external returns (bool);

// ################################################################################
// ###########   THE FUNCTION TO DRIP THE TOKENS TO THE TARGET ADDRESS  ###########
// ################################################################################

    function drip() external returns (uint);

// ##################################################################################################
// ###########   initializeInstrumentState() : INITIALIZING INSTRUMENTS #############################
// ###########   updateInstrumentBalance() : updates the stored balance                  ############
// ###########   swapTokensUsingOxAPI() : THE HEDGE FUND MECHANISM AND THE SIGH TRANSFER ############
// ###########   transferSighTo() : FUNCTION TO TRANSFER SIGH TOKENS     ############################
// ##################################################################################################

    function initializeInstrumentState(address instrument) external returns (bool);
    function updateInstrumentBalance(address instrument_address) external returns (uint);       // rechecks the balance and updates the stored balances array
    function swapTokensUsingOxAPI( address allowanceTarget, address payable to, bytes calldata callDataHex, address token_bought, address token_sold, uint sellAmount ) external payable returns (bool);
    function transferSighTo(address target_, uint amount) external returns (uint);

// ########################################
// ###########   VIEW FUNCTIONS  ##########
// ########################################
    
    function getInstrumentState(address instrument) external view returns ( bool initialized, string memory name, uint balance, uint totalAmountDripped, uint totalAmountTransferred);
    function getAllInstruments() external view returns (address[] memory);
    function totalInstruments() external view returns (uint);
    function getInstrumentBalance(address instrument_address) external view returns (uint);
    function getTotalDrippedAmount(address token) external view returns (uint);
    function getTotalTransferredAmount(address instrument_address) external view returns (uint);
    function getSIGHBalance() external view returns (uint);
    
    function getDistributionState() external view returns( bool isAllowed, address targetAddress, address instrumentBeingDistributed, uint speed );
    function isDistributionAllowed() external view returns (bool);
    function getTargetAddressForDistribution() external view returns (address);
    function getinstrumentBeingDripped() external view returns (address) ;
    function getDistributionSpeed() external view returns (uint);

    function getBurnState() external view returns ( bool isAllowed, uint burnSpeed, uint totalSighBurnt, uint sighBalance);
    function getBurnSpeed() external view returns (uint) ;
    function getTotalBurntSigh() external view returns (uint);

    function getCurrentSIGHTransferState() external view returns (uint maxSIGHSpentLimit, uint totalSighTransferredAndTraded );
    function blocksRemainingForNextPeriod() external view returns (uint);
}
    // function getAmountTransferred(address target) external view returns (uint) {
    //     return SIGH_Transferred[target];
    // }

    
