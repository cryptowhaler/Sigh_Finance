pragma solidity ^0.5.0;

import "../../openzeppelin-upgradeability/VersionedInitializable.sol";
import {IGlobalAddressesProvider} from '../../Configuration/IGlobalAddressesProvider.sol';
import "../interfaces/IFeeProvider.sol";
import "../libraries/math/PercentageMath.sol";
import "../libraries/math/Exponential.sol";

import "../interfaces/IPriceOracleGetter.sol";

/**
* @title FeeProvider contract
* @notice Implements calculation for the fees applied by the protocol
* @author Aave, SIGH Finance
**/
contract FeeProvider is IFeeProvider, VersionedInitializable {

    using PercentageMath for uint256;
    using Exponential for uint256;

    IGlobalAddressesProvider private globalAddressesProvider;
    IPriceOracleGetter private priceOracle ;
    ISIGHNFTBoosters private SIGHNFTBoosters;

    uint256 public totalFlashLoanFeePercent;        // Flash Loan Fee 
    uint256 public totalBorrowFeePercent;           // Borrow Fee
    uint256 public totalDepositFeePercent;          // Deposit Fee
    uint256 public platformFeePercent;              // Platform Fee (% of the Borrow Fee / Deposit Fee)

    address private tokenAccepted; 

    mapping (string => uint) initialFuelAmount;  // Initial Fuel the boosters of a particular category have


    struct optionType{
        uint256 fee;                // Fee Charged for this option
        uint256 multiplier;         // Fuel multiplier (fuel top up = fee * multiplier). It is adjusted by 2 decimal places.
                                    // Eq, multiplier = 120, means fuelTopUp = fee * 120/100 = 1.2 * Fee
    }

    mapping (string => mapping (uint => optionType) ) private fuelTopUpOptions; // BoosterType => ( optionNo => optionType )

    struct booster{
        bool inititated;                // To check if this booster has ever been used or not
        uint256 totalFuelRemaining;     // Current Amount of fuel available
        uint256 totalFuelUsed;          // Total Fuel used
    }

    mapping (uint256 => booster) private boosterFuelInfo;    // boosterID => Fuel Remaining (Remaining Volume on which discount will be given) Mapping


    event depositFeePercentUpdated(uint _depositFeePercent);
    event borrowFeePercentUpdated(uint totalBorrowFeePercent_);
    event flashLoanFeePercentUpdated(uint totalFlashLoanFeePercent_);
    event platformFeePercentUpdated(uint _platformFeePercent);

    event initalFuelForABoosterCategoryUpdated(string categoryName,uint initialFuel);
    event topUpOptionUpdated(string category, uint optionNo,uint _fee, uint _multiplier);
    event tokenForPaymentUpdated(address prevToken,address tokenAccepted);
    event tokensTransferred(address token, address destination, uint amount,uint newBalance );

    event _boosterTopUp( uint boosterID,string category,uint optionNo,uint amount,uint topUp,uint totalFuelRemaining);


    //only SIGH Distribution Manager can use functions affected by this modifier
    modifier onlySighFinanceConfigurator {
        require(globalAddressesProvider.getSIGHFinanceConfigurator() == msg.sender, "The caller must be the SIGH Finanace Configurator");
        _;
    }

// ###############################
// ###### PROXY RELATED ##########
// ###############################

    uint256 constant public FEE_PROVIDER_REVISION = 0x1;

    function getRevision() internal pure returns(uint256) {
        return FEE_PROVIDER_REVISION;
    }
    /**
    * @dev initializes the FeeProvider after it's added to the proxy
    * @param _addressesProvider the address of the GlobalAddressesProvider
    */
    function initialize(address _addressesProvider) public initializer {
        globalAddressesProvider = IGlobalAddressesProvider(_addressesProvider);
        depositFeePercent = 50;           // deposit fee = 0.5%
        totalFlashLoanFeePercent = 5;     // Flash loan fee = 0.05%
        originationFeePercentage = 0.0005 * 1e18;           // borrow fee is set as default as 500 basis points of the loan amount (0.05%)
    }

    function refreshConfiguration() external onlySighFinanceConfigurator {
        priceOracle = globalAddressesProvider.getPriceOracle();
        SIGHNFTBoosters = globalAddressesProvider.getSIGHNFTBoosters();
    }

// ############################################################################################################################
// ###### EXTERNAL FUNCTIONS TO CALCULATE THE FEE #############################################################################################
// ###### 1. calculateDepositFee() ##########
// ###### 2. calculateFlashLoanFee() #######################################
// ###### 1. calculateBorrowFee() ##########
// ############################################################################################################################

    function calculateDepositFee(address _user,address instrument, uint256 _amount, uint boosterId) external onlyLendingPool returns (uint256 ,uint256 ,uint256 ) {

        totalFee = _amount.percentMul(totalDepositFeePercent);       // totalDepositFeePercent = 50 represents 0.5%
        platformFee = totalFee.percentMul(platformFeePercent);       // platformFeePercent = 5000 represents 50%
        sighPay = totalFee.sub_(platformFee);                        

        if (boosterId == 0) {
            return (totalFee,platformFee,sighPay);
        }

        require( _user == SIGHNFTBoosters.ownerOf(boosterId), "Deposit() caller doesn't have the mentioned SIGH Booster needed to claim the discount. Please check the BoosterID that you provided again." );

        if ( !boosterFuelInfo[boosterId].inititated ) {
            string memory category = SIGHNFTBoosters.getBoosterCategory(boosterID);
            boosterFuelInfo[boosterId].totalFuelRemaining = initialFuelAmount[category];
            boosterFuelInfo[boosterId].inititated = true;
        }

        if ( boosterFuelInfo[boosterId].totalFuelRemaining > 0 ) {
            uint priceUSD = priceOracle.getAssetPrice(instrument);
            uint priceDecimals = priceOracle.getAssetPriceDecimals(instrument);
            require(priceUSD > 0, "Oracle returned invalid price");

            uint value = totalFee.mul_(priceUSD * 10**8);              // Adjusted by 8 decimals
            value = value.div_(10**priceDecimals);                     // Corrected by Price Decimals

            boosterFuelInfo[boosterId].totalFuelRemaining = boosterFuelInfo[boosterId].totalFuelRemaining >= value ? boosterFuelInfo[boosterId].totalFuelRemaining.sub_(value) : 0 ;
            boosterFuelInfo[boosterId].totalFuelUsed = boosterFuelInfo[boosterId].totalFuelUsed.add_(value);
            return (0,0,0);
        }

        (uint platformFeeDiscount, uint sighPayDiscount) = SIGHNFTBoosters.getDiscountRatiosForBooster(boosterId);
        platformFee = platformFee.sub_( platformFee.div_(platformFeeDiscount) ) ;
        sighPay = sighPay.sub_( sighPay.div_(sighPayDiscount) ) ;
        totalFee = platformFee.add_(sighPay);

        return (totalFee, platformFee,sighPay) ;
    }


    function calculateFlashLoanFee(address _user, uint256 _amount, uint boosterId) external onlyLendingPool returns (uint256 flashLoanFee) {
        flashLoanFee = _amount.percentMul(totalFlashLoanFeePercent);       // totalFlashLoanFeePercent = 5 represents 0.05%

        if (boosterId == 0) {
            return flashLoanFee;
        }

        require( _user == SIGHNFTBoosters.ownerOf(boosterId), "FlashLoan() caller doesn't have the mentioned SIGH Booster needed to claim the discount on Fee. Please check the BoosterID that you provided again." );

        ( , uint sighPayDiscount) = SIGHNFTBoosters.getDiscountRatiosForBooster(boosterId);
        flashLoanFee = flashLoanFee.sub_( flashLoanFee.div_(sighPayDiscount) ) ;

    }

    function calculateBorrowFee(address _user, address instrument, uint256 _amount, uint boosterId) external onlyLendingPool returns (uint256 platformFee, uint256 reserveFee) { 
        totalFee = _amount.percentMul(totalBorrowFeePercent);       // totalDepositFeePercent = 50 represents 0.5%
        platformFee = totalFee.percentMul(platformFeePercent);       // platformFeePercent = 5000 represents 50%
        sighPay = totalFee.sub_(platformFee);                        

        if (boosterId == 0) {
            return (totalFee,platformFee,sighPay);
        }

        require( _user == SIGHNFTBoosters.ownerOf(boosterId), "User against which borrow is being initiated doesn't have the mentioned SIGH Booster needed to claim the discount. Please check the BoosterID that you provided again." );

        if ( !boosterFuelInfo[boosterId].inititated ) {
            string memory category = SIGHNFTBoosters.getBoosterCategory(boosterID);
            boosterFuelInfo[boosterId].totalFuelRemaining = initialFuelAmount[category];
            boosterFuelInfo[boosterId].inititated = true;
        }

        if (  boosterFuelInfo[boosterId].totalFuelRemaining > 0 ) {
            uint priceUSD = priceOracle.getAssetPrice(instrument);
            uint priceDecimals = priceOracle.getAssetPriceDecimals(instrument);
            require(priceUSD > 0, "Oracle returned invalid price");

            uint value = totalFee.mul_(priceUSD * 10**8);              // Adjusted by 8 decimals
            value = value.div_(10**priceDecimals);                     // Corrected by Price Decimals

            boosterFuelInfo[boosterId].totalFuelRemaining =  boosterFuelInfo[boosterId].totalFuelRemaining >= value ?  boosterFuelInfo[boosterId].totalFuelRemaining.sub_(value) : 0 ;
            boosterFuelInfo[boosterId].totalFuelUsed = boosterFuelInfo[boosterId].totalFuelUsed.add_(value);
            return (0,0,0);
        }

        (uint platformFeeDiscount, uint sighPayDiscount) = SIGHNFTBoosters.getDiscountRatiosForBooster(boosterId);
        platformFee = platformFee.sub_( platformFee.div_(platformFeeDiscount) ) ;
        sighPay = sighPay.sub_( sighPay.div_(sighPayDiscount) ) ;

        return (platformFee,sighPay) ;
    }

// #################################
// ####### FUNCTIONS TO INCREASE FUEL LIMIT  ########
// #################################

    function fuelTopUp(uint optionNo, uint boosterID) external {
        require( SIGHNFTBoosters.isValidBooster(boosterId) , "Not a Valid Booster" );
        string memory category = SIGHNFTBoosters.getBoosterCategory(boosterID);

        optionType selectedOption = fuelTopUpOptions[category][optionNo];
        uint amount = selectedOption.fee;
        require(amount > 0,"Option selected not valid");

        uint8 decimals = IERC20(tokenAccepted).decimals();
        amount = amount.mul_(10**decimals);

        uint256 prevBalance = IERC20(tokenAccepted).balanceOf(address(this));
        IERC20(tokenAccepted).transferFrom(msg.sender,address(this),amount);
        uint256 newBalance = IERC20(tokenAccepted).balanceOf(address(this));
        require( newBalance == prevBalance.add(amount),"ERC20 transfer failure");

        uint _multiplier = selectedOption.multiplier;
        uint topUp = amount.mul_(_multiplier);
        topUp = topUp.div_(100);                    // topUp = fee * multiplier, where multipler = 120 represents 1.2
        
        boosterFuelInfo[boosterID].totalFuelRemaining = boosterFuelInfo[boosterID].totalFuelRemaining.add(topUp);
        emit _boosterTopUp( boosterID, category, optionNo, amount, topUp, boosterFuelInfo[boosterID].totalFuelRemaining);
    }



// #################################
// ####### ADMIN FUNCTIONS  ########
// #################################

    function updateTotalDepositFeePercent(uint _depositFeePercent) external onlySighFinanceConfigurator {
        totalDepositFeePercent = _depositFeePercent;
        emit depositFeePercentUpdated(_depositFeePercent);
    }

    function updateTotalBorrowFeePercent(uint totalBorrowFeePercent_) external onlySighFinanceConfigurator {
        totalBorrowFeePercent = totalBorrowFeePercent_;
        emit borrowFeePercentUpdated(totalBorrowFeePercent_);
    }

    function updateTotalFlashLoanFeePercent(uint totalFlashLoanFeePercent_ ) external onlySighFinanceConfigurator {
        totalFlashLoanFeePercent = totalFlashLoanFeePercent_;
        emit flashLoanFeePercentUpdated(totalFlashLoanFeePercent_);
    }

    function updatePlatformFeePercent(uint _platformFeePercent) external onlySighFinanceConfigurator {
        platformFeePercent = _platformFeePercent;
        emit platformFeePercentUpdated(_platformFeePercent);
    }

    function UpdateABoosterCategoryFuelAmount(string categoryName, uint initialFuel ) external onlySighFinanceConfigurator {
        require(initialFuel > 0, 'Initial Fuel cannot be 0'); 
        require(SIGHNFTBoosters.isCategorySupported(categoryName),'Category not present');
        initialFuelAmount[categoryName] = initialFuel;

        emit initalFuelForABoosterCategoryUpdated(categoryName,initialFuel);
    }

    function updateATopUpOption(string category, uint optionNo, uint _fee, uint _multiplier) external onlySighFinanceConfigurator { 
        optionType newType = optionType({ fee: _fee, multiplier: _multiplier  });
        fuelTopUpOptions[category][optionNo] = newType;
        emit topUpOptionUpdated(category, optionNo, _fee, _multiplier);
    }

    function updateTokenAccepted(address _token) external onlySighFinanceConfigurator {
        require(_token != address(0),'Not a valid address');
        address prevToken = tokenAccepted;
        tokenAccepted = _token;
        emit tokenForPaymentUpdated(prevToken, tokenAccepted);
    }

    function transferFunds(address token, address destination, uint amount) external onlySighFinanceConfigurator {
        require(_token != address(0),'Not a valid token address');
        require(destination != address(0),'Not a valid  destination address');
        require(amount > 0,'Amount needs to be greater than 0');

        uint256 prevBalance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(destination,amount);
        uint256 newBalance = IERC20(token).balanceOf(address(this));
        require( newBalance == prevBalance.sub(amount),"ERC20 transfer failure");

        emit tokensTransferred(token, destination, amount, newBalance );
    }

// ###############################
// ####### EXTERNAL VIEW  ########
// ###############################

    function getBorrowFeePercentage() external view returns (uint256) {
        return totalBorrowFeePercent;
    }

    function getDepositFeePercentage() external view returns (uint256) {
        return totalDepositFeePercent;
    }

    function getFlashLoanFeePercentage() external view returns (uint256) {
        return totalFlashLoanFeePercent;
    }

    function getFuelAvailable(uint boosterID) external view returns (uint256) {
        return boostersTotalFuelRemaining[boosterID];
    }

    function getFuelUsed(uint boosterID) external view returns (uint256) {
        return boostersTotalFuelUsed[boosterID];
    }

    function getOptionDetails(string category, uint optionNo) external view returns (uint fee, uint multiplier) {
        return (fuelTopUpOptions[category][optionNo].fee, fuelTopUpOptions[category][optionNo].multiplier);
    }

}
