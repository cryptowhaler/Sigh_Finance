pragma solidity ^0.5.16;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol"; 
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol"; 

import "openzeppelin-solidity/contracts/utils/Address.sol"; 
import "openzeppelin-solidity/contracts/math/SafeMath.sol"; 

contract SIGH is ERC20, ERC20Detailed('SIGH : A free distributor of future expected accumulated value of financial assets','SIGH',uint8(18) ) {

    using SafeMath for uint256;    // Time based calculations
    using Address for address;

    address private _owner;
    address private treasury; 
    address private SpeedController;

    uint256 private constant INITIAL_SUPPLY = 5 * 10**6 * 10**18; // 5 Million (with 18 decimals)
    uint256 private prize_amount = 500 * 10**18;

    uint256 private totalAmountBurnt;

    struct mintSnapshot {
        uint cycle;
        uint schedule;
        uint inflationRate;
        uint mintedAmount;
        uint mintSpeed;
        uint newTotalSupply;
        address minter;
        uint blockNumber;
    }

    mintSnapshot[] private mintSnapshots;

    uint256 public constant CYCLE_BLOCKS = 6500;  // 15 * 60 * 24 (KOVAN blocks minted per day)
    uint256 public constant FINAL_CYCLE = 1560; // 

    uint256 private Current_Cycle; 
    uint256 private Current_Schedule;
    uint256 private currentDivisibilityFactor = 100;

    bool private mintingActivated = false;
    uint256 private previousMintBlock;

    struct Schedule {
        uint256 startCycle;
        uint256 endCycle;
        uint256 divisibilityFactor;
    }

    Schedule[11] private _schedules;

    event NewSchedule(uint newSchedule, uint newDivisibilityFactor, uint blockNumber, uint timeStamp );
    event MintingInitialized(address speedController, address treasury, uint256 blockNumber);
    event SIGHMinted( address minter, uint256 cycle, uint256 Schedule, uint inflationRate, uint256 amountMinted, uint mintSpeed, uint256 current_supply, uint256 block_number);
    event SIGHBurned( uint256 burntAmount, uint256 totalBurnedAmount, uint256 currentSupply, uint blockNumber);

    // constructing  
    constructor () public {
        _owner = _msgSender();
        _mint(_owner,INITIAL_SUPPLY);
        mintSnapshot  memory currentMintSnapshot = mintSnapshot({ cycle:Current_Cycle, schedule:Current_Schedule, inflationRate: uint(0), mintedAmount:INITIAL_SUPPLY, mintSpeed:uint(0), newTotalSupply:totalSupply(), minter: msg.sender, blockNumber: block.number });
        mintSnapshots.push(currentMintSnapshot);                                                    // MINT SNAPSHOT ADDED TO THE ARRAY
        emit SIGHMinted(currentMintSnapshot.minter, currentMintSnapshot.cycle, currentMintSnapshot.schedule, currentMintSnapshot.inflationRate, currentMintSnapshot.mintedAmount, currentMintSnapshot.mintSpeed, currentMintSnapshot.newTotalSupply,currentMintSnapshot.blockNumber );
    }

    // ################################################
    // #######   FUNCTIONS TO INITIATE MINTING  #######
    // ################################################

    function initMinting(address newSpeedController, address _treasury) public returns (bool) {
        require(_msgSender() == _owner,"Mining can only be initialized by the owner." );
        require(newSpeedController != address(0), "Not a valid Speed Controller address");
        require(_treasury != address(0), "Not a valid Treasury address");
        require(!mintingActivated, "Minting can only be initialized once" );

        SpeedController = newSpeedController;
        treasury = _treasury;
        _initSchedules();
        
        emit MintingInitialized(SpeedController, treasury, block.number );
        mintingActivated = true;
    }

    function _initSchedules() private {
        _schedules[0] = Schedule(1, 96, 100 );              // Genesis Mint Schedule
        _schedules[1] = Schedule(97, 462, 200 );            // 1st Mint Schedule
        _schedules[2] = Schedule(463, 828, 400 );           // 2nd Mint Schedule
        _schedules[3] = Schedule(829, 1194, 800 );          // 3rd Mint Schedule
        _schedules[4] = Schedule(1195, 1560, 1600 );        // 4th Mint Schedule
    }

    // function _initSchedules() private {
    //     _schedules[0] = Schedule(1, 96, 100 );           // Genesis Mint Schedule
    //     _schedules[1] = Schedule(97, 462, 200 );         // 1st Mint Schedule
    //     _schedules[2] = Schedule(463, 828, 400 );        // 2nd Mint Schedule
    //     _schedules[3] = Schedule(829, 1194, 800 );       // 12nd Mint Schedule
    //     _schedules[4] = Schedule(1195, 1560, 1600 );     // 2nd Mint Schedule
    //     _schedules[5] = Schedule(1561, 1926, 3200 );     // 2nd Mint Schedule
    //     _schedules[6] = Schedule(1927, 2292, 6400 );     // 2nd Mint Schedule
    //     _schedules[7] = Schedule(2293, 2658, 12800 );    // 2nd Mint Schedule
    //     _schedules[8] = Schedule(2659, 3024, 25600 );    // 2nd Mint Schedule
    //     _schedules[9] = Schedule(3025, 3390, 51200 );    // 2nd Mint Schedule
    //     _schedules[10] = Schedule(3391, 3756, 102400 );  // 2nd Mint Schedule
    // }



    // ############################################################
    // ############   OVER-LOADING TRANSFER FUNCTON    ############
    // ############################################################

    function _transfer(address sender, address recipient, uint256 amount) internal {
        if (isMintingPossible()) {
             mintNewCoins();
        }
        super._transfer(sender, recipient, amount);
    }

    // ################################################
    // ############   MINT FUNCTONS    ############
    // ################################################

    function isMintingPossible() internal returns (bool) {
        if ( mintingActivated && Current_Cycle <= FINAL_CYCLE && _getElapsedBlocks(block.number, previousMintBlock) > CYCLE_BLOCKS ) {
            Current_Cycle = add(Current_Cycle,uint256(1),'Overflow');
            return true;
        }
        return false;
    }

    function mintCoins() external returns (bool) {
        if (isMintingPossible() ) {
            mintNewCoins();
            return true;
        }
        return false;
    }

    function mintNewCoins() internal returns (bool) {

        if ( Current_Schedule < _CalculateCurrentSchedule() ) {
            Current_Schedule = add(Current_Schedule,uint256(1),"NEW Schedule : Addition gave error");
            currentDivisibilityFactor = _schedules[Current_Schedule].divisibilityFactor;
            emit NewSchedule(Current_Schedule,currentDivisibilityFactor, block.number, now);
        }

        uint currentSupply = totalSupply();
        uint256 newCoins = currentSupply.div(currentDivisibilityFactor);                        // Calculate the number of new tokens to be minted.
        uint newmintSpeed = newCoins.div(CYCLE_BLOCKS);                                         // mint speed, i.e tokens minted per block rate for this cycle
        if (newCoins > prize_amount) {
            newCoins = newCoins.sub(prize_amount);
        }  
        else {
            prize_amount = uint(0);
        }

        _mint( msg.sender, prize_amount );                                                          // PRIZE AMOUNT AWARDED TO THE MINTER
        _mint( SpeedController, newCoins );                                                          // NEWLY MINTED SIGH TRANSFERRED TO SIGH SPEED CONTROLLER
        
        mintSnapshot  memory currentMintSnapshot = mintSnapshot({ cycle:Current_Cycle, schedule:Current_Schedule, inflationRate: currentDivisibilityFactor, mintedAmount:newCoins, mintSpeed:newmintSpeed, newTotalSupply:totalSupply(), minter: msg.sender, blockNumber: block.number });
        mintSnapshots.push(currentMintSnapshot);                                                    // MINT SNAPSHOT ADDED TO THE ARRAY
        previousMintBlock = block.number;        

        emit SIGHMinted(currentMintSnapshot.minter, currentMintSnapshot.cycle, currentMintSnapshot.schedule, currentMintSnapshot.inflationRate, currentMintSnapshot.mintedAmount, currentMintSnapshot.mintSpeed, currentMintSnapshot.newTotalSupply,currentMintSnapshot.blockNumber );
        return true;        
    }

    function _getElapsedBlocks(uint256 currentBlock , uint256 prevBlock) internal pure returns(uint256) {
        uint deltaBlocks = sub(currentBlock,prevBlock,"GetElapsedBlocks: Subtraction Underflow");
        return deltaBlocks;
    }

    function _CalculateCurrentSchedule() internal view returns (uint256) {

        if (Current_Cycle <= 96) {
            return uint256(0);
        }

        uint256 C_Schedule_sub = sub(Current_Cycle,uint256(96),'Schedule: Subtraction gave error');
        uint256 _newSchedule = div(C_Schedule_sub,uint256(365),"Schedule : Division gave error");

        if (_newSchedule < 4 ) {
            return uint256(_newSchedule.add(1) );
        }

        return uint256(5);
    }

    // ################################################
    // ############   BURN FUNCTON    #################
    // ################################################
    
    function burn(uint amount) external returns (bool) {
        require( msg.sender == treasury,"Only Treasury can burn SIGH Tokens");
        _burn(treasury, amount) ;
        totalAmountBurnt = add(totalAmountBurnt , amount, 'burn : Total Number of tokens burnt gave addition overflow');
        emit SIGHBurned( amount, totalAmountBurnt, totalSupply(), block.number );
        return true;
    }    

    // ################################################
    // ###########   MINT FUNCTONS (VIEW)   ###########
    // ################################################

    function isMintingActivated() external view returns(bool) {
        if (Current_Cycle > FINAL_CYCLE) {
            return false;
        }
        return mintingActivated;
    }

   function getCurrentSchedule() public view returns (uint256) {
        return Current_Schedule;
    }

   function getCurrentCycle() public view returns (uint256) {
        return Current_Cycle;
    }
    
    function getCurrentInflationRate() external view returns (uint256) {
        if (Current_Cycle > FINAL_CYCLE || !mintingActivated) {
            return uint(0);
        }
        return currentDivisibilityFactor;
    }
    
    function getBlocksRemainingToMint() external view returns (uint) {

        if (Current_Cycle > FINAL_CYCLE || !mintingActivated) {
            return uint(-1);
        }

        uint deltaBlocks = _getElapsedBlocks(block.number, previousMintBlock);

        if (deltaBlocks >= CYCLE_BLOCKS ) {
            return uint(0);
        }
        return CYCLE_BLOCKS.sub(deltaBlocks);
    }


    function getMintSnapshotForCycle(uint cycleNumber) public view returns (uint schedule,uint inflationRate, uint mintedAmount,uint mintSpeed, uint newTotalSupply,address minter, uint blockNumber ) {
        return ( mintSnapshots[cycleNumber].schedule,
                 mintSnapshots[cycleNumber].inflationRate,
                 mintSnapshots[cycleNumber].mintedAmount,
                 mintSnapshots[cycleNumber].mintSpeed,
                 mintSnapshots[cycleNumber].newTotalSupply,
                 mintSnapshots[cycleNumber].minter,
                 mintSnapshots[cycleNumber].blockNumber
                 );
    }
    
    function getLatestMintSnapshot() public view returns (uint cycle, uint schedule,uint inflationRate, uint mintedAmount,uint mintSpeed, uint newTotalSupply,address minter, uint blockNumber ) {
        uint len = mintSnapshots.length;
        return ( len, 
                 mintSnapshots[len - 1].schedule,
                 mintSnapshots[len - 1].inflationRate,
                 mintSnapshots[len - 1].mintedAmount,
                 mintSnapshots[len - 1].mintSpeed,
                 mintSnapshots[len - 1].newTotalSupply,
                 mintSnapshots[len - 1].minter,
                 mintSnapshots[len - 1].blockNumber
                 );
    }
    
    
    function getCurrentMintSpeed() external view returns (uint) {
        if (Current_Cycle > FINAL_CYCLE || !mintingActivated) {
            return uint(0);
        }
        uint currentSupply = totalSupply();
        uint256 newCoins = currentSupply.div(currentDivisibilityFactor);                        // Calculate the number of new tokens to be minted.
        uint newmintSpeed = newCoins.div(CYCLE_BLOCKS);                                         // mint speed, i.e tokens minted per block rate for this cycle
        return newmintSpeed;
    }

    function getTotalSighBurnt() external view returns (uint) {
        return totalAmountBurnt;
    }

   function getSpeedController() external view returns (address) {
        return SpeedController;
    }
    
   function getTreasury() external view returns (address) {
        return treasury;
    }
    
    
    // ##################################################################
    // ###########   nternal helper functions for safe math   ###########
    // ##################################################################

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

    function div(uint256 a, uint256 b) internal pure returns (uint256) {
        return div(a, b, "SafeMath: division by zero");
    }

    function div(uint256 a, uint256 b, string memory errorMessage) internal pure returns (uint256) {
        // Solidity only automatically asserts when dividing by 0
        require(b > 0, errorMessage);
        uint256 c = a / b;
        // assert(a == b * c + a % b); // There is no case in which this doesn't hold

        return c;
    }

}









