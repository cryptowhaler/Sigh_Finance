pragma solidity ^0.5.16;

import "./Math/ABDKMath.sol";
import "./openzeppelin/Context.sol";
import "./openzeppelin/IERC20.sol";
import "./openzeppelin/SafeMath.sol";
import "./openzeppelin/Address.sol";

contract SIGH is Context, IERC20 {

    using SafeMath for uint256;    // Time based calculations
    using ABDKMath64x64 for int128;
    using Address for address;

    address private _owner;

    mapping (address => uint256) private balances;
    mapping (address => mapping (address => uint256)) private _allowances;

    uint256 private constant INITIAL_SUPPLY = 5 * 10**6 * 10**18; // 5 Million (with 18 decimals)
    uint256 private CURRENT_SUPPLY = INITIAL_SUPPLY ;
    bool private mintingActivated = false;

    address private SighTroller;
    address private prevSighTroller;


    uint256 private constant CYCLE_SECONDS = 86400;  // 24*60*60 (i.e seconds in 1 day )
    uint256 private constant FINAL_CYCLE = 3711; // 10 years (3650 days) + 60 days
    uint256 private Current_Cycle; 
    uint256 private Current_Era;
    uint256 private currentDivisibilityFactor;
    uint256 private previousMintTimeStamp;
    uint256 private recentlyMintedAmount;
    address private recentMinter;

    mapping ( uint256 => uint256 ) private mintHistory;

    struct Era {
        uint256 startCycle;
        uint256 endCycle;
        uint256 divisibilityFactor;
        int128 cyclicAddition;
        uint256 finalSupply;
    }

    Era[11] private _eras;
    uint256 private _startTime;

    string private _name;
    string private _symbol;
    uint8 private _decimals;

    event coinsMinted(uint256 cycle, uint256 Era, address minter, uint256 amountMinted, uint256 current_supply, uint256 block_number, uint timestamp);
    event SighTrollerChanged(address prevSighTroller, address newSighTroller, uint256 blockNumber);



    // constructing  
    constructor (address _sighTroller) public {
        _name = 'SIGH FINANCE';
        _symbol = 'SIGH';
        _decimals = 18;
        SighTroller = _sighTroller;
        _owner = _msgSender();
        balances[_msgSender()] = INITIAL_SUPPLY;
        recentMinter = _owner;
        recentlyMintedAmount = INITIAL_SUPPLY;
        mintHistory[0] = INITIAL_SUPPLY;
        previousMintTimeStamp = now;
        emit coinsMinted(Current_Cycle,Current_Era,_msgSender(),INITIAL_SUPPLY,CURRENT_SUPPLY,block.number, now);
    }

    function initMinting() public returns (bool) {
        require(_msgSender() == _owner,"Mining can only be initialized by the owner." );
        _initEras();
        _startTime = now;
        mintingActivated = true;
    }

    function _initEras() private {
        _eras[0] = Era(1, 60, 100, 184467440737095516, 18166966985640902);        // 60 days
        _eras[1] = Era(61, 425, 200, 92233720368547758, 112174713264391144);       // 1 year
        _eras[2] = Era(426, 790, 400, 46116860184273879, 279057783081840914);      // 1 year
        _eras[3] = Era(791, 1155, 800, 23058430092136939, 440268139544969912);       // 1 year
        _eras[4] = Era(1156, 1520, 1600, 11529215046068469, 553044069474490613);     // 1 year
        _eras[5] = Era(1521, 1885, 3200, 5764607523034234, 619853011328525904);      // 1 year   
        _eras[6] = Era(1886, 2250, 6400, 2882303761517117, 656228575376038043);       // 1 year
        _eras[7] = Era(2251, 2615, 12800, 1441151880758558, 675209948612919169);        // 1 year
        _eras[8] = Era(2616, 2980, 25600, 720575940379279, 684905732173838476);        // 1 year
        _eras[9] = Era(2981, 3345, 51200, 360287970189639, 689805758238227141);        // 1 year
        _eras[10] = Era(3346, 3710, 102400, 180143985094819, 692268913795056564);       // 1 year
    }

    function name() public view returns (string memory) {
        return _name;
    }

    function symbol() public view returns (string memory) {
        return _symbol;
    }

    function decimals() public view returns (uint8) {
        return _decimals;
    }

    function start_Time() external view returns(uint256) {
        return _startTime;
    }

    function isMintingActivated() external view returns(bool) {
        return mintingActivated;
    }

    // function sendAirdrop(address[] calldata recipients, uint256 airdropAmt) external {
    //     for (uint256 i = 0; i < recipients.length; i++) {
    //         transfer(recipients[i], airdropAmt);
    //     }
    // }

    function totalSupply() public view  returns (uint256) {
        return CURRENT_SUPPLY;
    }

    function balanceOf(address account) public view  returns (uint256) {
        return balances[account];
    }

    function transfer(address recipient, uint256 amount) public  returns (bool) {
        _transfer(_msgSender(), recipient, amount);
        return true;
    }

    function allowance(address owner, address spender) public view  returns (uint256) {
        return _allowances[owner][spender];
    }

    // Approve for allowance
    function approve(address spender, uint256 amount) public  returns (bool) {
        _approve(_msgSender(), spender, amount);
        return true;
    }

    function transferFrom(address sender, address recipient, uint256 amount) public  returns (bool) {
        _transfer(sender, recipient, amount);
        _approve(sender, _msgSender(), _allowances[sender][_msgSender()].sub(amount, "ERC20: transfer amount exceeds allowance"));
        return true;
    }

    function increaseAllowance(address spender, uint256 addedValue) public returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].add(addedValue));
        return true;
    }

    function decreaseAllowance(address spender, uint256 subtractedValue) public returns (bool) {
        _approve(_msgSender(), spender, _allowances[_msgSender()][spender].sub(subtractedValue, "ERC20: decreased allowance below zero"));
        return true;
    }

    function _approve(address owner, address spender, uint256 amount) private {
        require(owner != address(0), "ERC20: approve from the zero address");
        require(spender != address(0), "ERC20: approve to the zero address");

        _allowances[owner][spender] = amount;
        emit Approval(owner, spender, amount);
    }

    function _transfer(address sender, address recipient, uint256 amount) private {
        require(sender != address(0), "ERC20: transfer from the zero address");
        require(recipient != address(0), "ERC20: transfer to the zero address");

        if (isMintingPossible()) {
             mintNewCoins();
        }

        balances[sender] = balances[sender].sub(amount);
        balances[recipient] = balances[recipient].add(amount);
        emit Transfer(sender, recipient, amount);
    }

    // checks if minting can be done right now
    function isMintingPossible() private view returns (bool) {
        require(mintingActivated, "Minting has not been activated by the owner yet.");
        require(Current_Cycle < 3711, "All Eras have been Completed. No new Minting possible." );
        require(_getElapsedSeconds(previousMintTimeStamp,now) > CYCLE_SECONDS, "A day has not elapsed since previous mint." );
        return true;
    }

    // FUNCTION TO MINT NEW COINS - CAN BE CALLED BY ANYONE ONCE THE MINTING IS ACTIVATED
    function mintCoins() external returns (bool) {

        if ( !isMintingPossible() ) {
            return false;
        }

        return mintNewCoins();
    }

    // 
    function mintNewCoins() private returns (bool) {

        uint256 cycle = _getCycle(_startTime,now);
        require( cycle > Current_Cycle,"Minting has been completed for this Cycle." );
        Current_Cycle = cycle;  // CURRENT CYCLE IS UPDATED 

        // IF THE ERA HAS CHANGED
        if ( Current_Era < _CalculateCurrentEra() ) {
            Current_Era += 1; // ERA IS UPDATED
        }

        require( Current_Era <= 10, "All the Eras have been Completed. No new Minting possible." );

        uint256 newCoins = CURRENT_SUPPLY.div(_eras[Current_Era].divisibilityFactor);  // Calculate the number of new tokens to be minted.
        CURRENT_SUPPLY += newCoins;
        balances[_msgSender()] += 500 * 10**18;         // 500 coins given to caller for calling the mint successfully
        balances[SighTroller] += newCoins - (500 * 10**18);     //newly minted coins provided to SighTroller
        recentMinter = _msgSender();
        recentlyMintedAmount = newCoins;
        mintHistory[Current_Cycle] = newCoins;
        previousMintTimeStamp = now;        
        emit coinsMinted(Current_Cycle,Current_Era,_msgSender(),newCoins,CURRENT_SUPPLY,block.number, now);

        return true;        
    }

    function changeSighTroller(address newSighTroller) public returns (bool) {
        require(_msgSender() == _owner, "Only the Admin can change SighTroller");
        prevSighTroller = SighTroller;
        SighTroller = newSighTroller;
        emit SighTrollerChanged(prevSighTroller, SighTroller, block.number );
        return true;
    }


    function _getSupply() public view returns(uint256) {
        return CURRENT_SUPPLY;
    }

    // Returns the current ERA
   function getCurrentEra() public view returns (uint256) {
        return Current_Era;
    }

    // Returns the current Cycle
   function getCurrentCycle() public view returns (uint256) {
        return Current_Cycle;
    }

    function getRecentMinter() public view returns (address) {
        return recentMinter;
    }

    function getRecentyMintedAmount() public view returns (uint256) {
        return recentlyMintedAmount;
    }

    // function getMintHistory() public view returns ( mapping (uint128 => uint256) ) {
    //     return mintHistory;
    // }


    // gives the day number since start
    function _getCycle(uint256 startTime, uint256 currentTime) private pure returns(uint256) {
        uint256 secondsElapsed = _getElapsedSeconds(startTime, currentTime);
        uint256 cycle = (secondsElapsed - (secondsElapsed % CYCLE_SECONDS)) / CYCLE_SECONDS + 1; // secondsElapsed % CYCLE_SECONDS gives remainder seconds which are subtracted. 
        // (secondsElapsed - (secondsElapsed % CYCLE_SECONDS)) is divided by CYCLE_SECONDS which gives number of days elapsed (from 0) and 1 is added to it 

        // if cycle is greater than 3711, i.e all eras completed
        if (cycle >= FINAL_CYCLE) 
            return FINAL_CYCLE;

        return cycle;
    }

    // subtracts startTime from currentTime
    function _getElapsedSeconds(uint256 startTime, uint256 currentTime) private pure returns(uint256) {
        return currentTime.sub(startTime);
    }

    function _CalculateCurrentEra() private view returns (uint256) {

        if (Current_Cycle <= 60 && Current_Cycle >= 0 ) {
            return uint256(0);
        }

        uint256 C_Era = (Current_Cycle - 60) / 365;

        if (C_Era <= 9 ) {
            return uint256(C_Era + 1);
        }

        return uint256(11);
    }





}









