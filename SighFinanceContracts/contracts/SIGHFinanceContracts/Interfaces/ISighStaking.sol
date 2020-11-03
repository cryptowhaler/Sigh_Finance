pragma solidity ^0.5.16;

/**
 * @title Sigh Staking Contract
 * @notice Distributes rewards (Fee + % of Interest collected from Lending Protocol ) to SIGH Stakers
 * @author SIGH Finance
 */


interface SighStaking {

// ############################################
// ##############  STAKE SIGH   ###############
// ############################################

    function stake_SIGH(uint amount) external returns (bool);

    function updateStakedBalanceForStreaming(address staker, uint amount) external returns (bool) ;
 
// ##############################################
// ##############  UNSTAKE SIGH   ###############
// ##############################################

    function unstake_SIGH(uint amount) external returns (bool);


// ################################################################################
// ##############  FUNCTION RELATED TO INSTRUMENT TRANSFER   ###############
// ################################################################################

    function claimAllAccumulatedInstrumentsForUsers( address[] stakingAddresses ) external;
    function claimAllAccumulatedInstruments() external ;
    function claimAccumulatedInstrument(address instrumentToBeClaimed) external;

// ##################################################### 
// ##############  TOKEN SWAP FUNCTION   ###############
// ##################################################### 

    function swapTokensUsingOxAPI( address allowanceTarget, address payable to, bytes memory callDataHex, address token_bought, address token_sold, uint sellAmount ) external payable returns (bool);

// ########################################################################################## 
// ##############  CONFIGURATION FUNCTIONS (SIGH FINANCE CONFIGURATOR ONLY)   ###############
// ##########################################################################################

    function supportNewInstrumentForDistribution(address newInstrument, uint speed)  returns (bool) ;
    function setDistributionSpeed(address instrumentAddress , uint newSpeed)  returns (bool) ;
    function updateMaxSighThatCanBeStaked(uint amount)   returns (bool) ;

// ################################################## 
// ##############  PUBLIC FUNCTIONS   ###############
// ################################################## 

    function updateBalance(address instrument) public returns (uint) ;

// ################################################## 
// ##############  VIEW FUNCTIONS   ###############
// ################################################## 

    function getInstrumentsSupported() external view returns (address[]);
    function isInstrumentSupported(address instrument) external view returns (bool);
    function getDistributionSpeed(address instrument) external view returns (uint);
    function getInstrumentState(address instrumentAddress) external view returns(string memory, uint, uint,uint,uint ) ;

    function getStakedBalanceForStaker(address account) external view returns (uint);
    function getStakersAccumulatedInstrumentAmount(address account, address instrument)  external view returns (uint) ;

    function getTotalStakedSIGH()  external view returns (uint);
    function getTotalStakers()  external view returns (uint);
    function maxSighThatCanBeStaked()  external view returns (uint);



























}