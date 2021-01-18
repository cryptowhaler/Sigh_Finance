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

    uint256 public totalBorrowFeePercent;           // Borrow Fee
    uint256 public totalDepositFeePercent;          // Deposit Fee
    uint256 public platformFeePercent;              // Platform Fee (% of the Borrow Fee / Deposit Fee)

    uint256 public totalFlashLoanFeePercent;        // Flash Loan Fee 

    mapping (uint256 => uint256) private boostersTotalFuelRemaining;    // boosterID => Fuel Remaining (Remaining Volume on which discount will be given) Mapping
    mapping (uint256 => uint256) private boostersTotalFuelUsed;    // boosterID => Fuel Used (Volume used by the booster) Mapping

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

        if ( boostersTotalFuelRemaining[boosterId] > 0 ) {
            uint priceUSD = priceOracle.getAssetPrice(instrument);
            uint priceDecimals = priceOracle.getAssetPriceDecimals(instrument);
            require(priceUSD > 0, "Oracle returned invalid price");

            uint value = totalFee.mul_(priceUSD * 10**8);              // Adjusted by 8 decimals
            value = value.div_(10**priceDecimals);                     // Corrected by Price Decimals

            boostersTotalFuelRemaining[boosterId] = boostersTotalFuelRemaining[boosterId] >= value ? boostersTotalFuelRemaining[boosterId].sub_(value) : 0 ;
            boostersTotalFuelUsed[boosterId] = boostersTotalFuelUsed[boosterId].add_(value);
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

        if ( boostersTotalFuelRemaining[boosterId] > 0 ) {
            uint priceUSD = priceOracle.getAssetPrice(instrument);
            uint priceDecimals = priceOracle.getAssetPriceDecimals(instrument);
            require(priceUSD > 0, "Oracle returned invalid price");

            uint value = totalFee.mul_(priceUSD * 10**8);              // Adjusted by 8 decimals
            value = value.div_(10**priceDecimals);                     // Corrected by Price Decimals

            boostersTotalFuelRemaining[boosterId] = boostersTotalFuelRemaining[boosterId] >= value ? boostersTotalFuelRemaining[boosterId].sub_(value) : 0 ;
            boostersTotalFuelUsed[boosterId] = boostersTotalFuelUsed[boosterId].add_(value);
            return (0,0,0);
        }

        (uint platformFeeDiscount, uint sighPayDiscount) = SIGHNFTBoosters.getDiscountRatiosForBooster(boosterId);
        platformFee = platformFee.sub_( platformFee.div_(platformFeeDiscount) ) ;
        sighPay = sighPay.sub_( sighPay.div_(sighPayDiscount) ) ;

        return (platformFee,sighPay) ;
    }

// #################################
// ####### ADMIN FUNCTIONS  ########
// #################################

    function updateTotalDepositFeePercent(uint _depositFeePercent) external onlySighFinanceConfigurator {
        totalDepositFeePercent = _depositFeePercent;
    }

    function updateTotalBorrowFeePercent(uint totalBorrowFeePercent_) external onlySighFinanceConfigurator {
        totalBorrowFeePercent = totalBorrowFeePercent_;
    }

    function updateTotalFlashLoanFeePercent(uint totalFlashLoanFeePercent_ ) external onlySighFinanceConfigurator {
        totalFlashLoanFeePercent = totalFlashLoanFeePercent_;
    }

    function updatePlatformFeePercent(uint _platformFeePercent) external onlySighFinanceConfigurator {
        platformFeePercent = _platformFeePercent;
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



}
