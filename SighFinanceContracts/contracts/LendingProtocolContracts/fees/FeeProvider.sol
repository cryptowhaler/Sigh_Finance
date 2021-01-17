pragma solidity ^0.5.0;

import "../../openzeppelin-upgradeability/VersionedInitializable.sol";
import "../interfaces/IFeeProvider.sol";
import "../libraries/WadRayMath.sol";


/**
* @title FeeProvider contract
* @notice Implements calculation for the fees applied by the protocol
* @author Aave, SIGH Finance
**/
contract FeeProvider is IFeeProvider, VersionedInitializable {

    using WadRayMath for uint256;

    ISIGHNFTBoosters private SIGHNFTBoosters;

    uint256 public originationFeePercentage;        // percentage of the fee to be calculated on the loan amount
    uint256 public depositFeePercentage;

    mapping (uint256 => uint256) private boostersTotalFuelRemaining;    // boosterID => Fuel Remaining (Remaining Volume on which discount will be given) Mapping
    mapping (uint256 => uint256) private boostersTotalFuelUsed;    // boosterID => Fuel Used (Volume used by the booster) Mapping

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
        originationFeePercentage = 0.0005 * 1e18;           // borrow fee is set as default as 500 basis points of the loan amount (0.05%)
        depositFeePercentage = 0.0005 * 1e18;           // deposit fee is set as default as 500 basis points of the deposit amount (0.05%)
        SIGHNFTBoosters = SIGHNFTBoosters;
    }

// ############################################################################################################################
// ###### EXTERNAL VIEW FUNCTIONS #############################################################################################
// ###### 1. calculateLoanOriginationFee() : calculates the origination fee for every loan executed on the platform. ##########
// ###### 2. getLoanOriginationFeePercentage() : returns the origination fee percentage #######################################
// ############################################################################################################################

    function calculateDepositFee(address _user,address instrument, uint256 _amount, uint boosterId) external view returns (uint256,uint256,uint256) {
        if (boosterId > 0) {
            require( _user == SIGHNFTBoosters.ownerOf(boosterId), "Deposit() caller doesn't have the mentioned SIGH Booster needed to claim the discount. Please check the BoosterID that you provided again." );
        }



        getDiscountMultiplierForBooster



        return _amount.wadMul(depositFeePercentage);
    }


    /**
    * @dev calculates the origination fee for every loan executed on the platform.
    * @param _user can be used in the future to apply discount to the origination fee based on the
    * _user account (eg. stake AAVE tokens in the lending pool, or deposit > 1M USD etc..)
    * @param _amount the amount of the loan
    **/
    function calculateLoanOriginationFee(address _user, uint256 _amount) external view returns (uint256) {
        return _amount.wadMul(originationFeePercentage);
    }


    /**
    * @dev returns the origination fee percentage
    **/
    function getLoanOriginationFeePercentage() external view returns (uint256) {
        return originationFeePercentage;
    }

}
