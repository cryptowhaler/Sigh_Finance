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

    uint256 public originationFeePercentage;        // percentage of the fee to be calculated on the loan amount
    uint256 public depositFeePercentage;

// ###############################
// ###### PROXY RELATED ##########
// ###############################

    uint256 constant public FEE_PROVIDER_REVISION = 0x2;

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
    }

// ############################################################################################################################
// ###### EXTERNAL VIEW FUNCTIONS #############################################################################################
// ###### 1. calculateLoanOriginationFee() : calculates the origination fee for every loan executed on the platform. ##########
// ###### 2. getLoanOriginationFeePercentage() : returns the origination fee percentage #######################################
// ############################################################################################################################

    /**
    * @dev calculates the origination fee for every loan executed on the platform.
    * @param _user can be used in the future to apply discount to the origination fee based on the
    * _user account (eg. stake AAVE tokens in the lending pool, or deposit > 1M USD etc..)
    * @param _amount the amount of the loan
    **/
    function calculateLoanOriginationFee(address _user, uint256 _amount) external view returns (uint256) {
        return _amount.wadMul(originationFeePercentage);
    }

    function calculateDepositFee(address _user, uint256 _amount) external view returns (uint256) {
        return _amount.wadMul(depositFeePercentage);
    }

    /**
    * @dev returns the origination fee percentage
    **/
    function getLoanOriginationFeePercentage() external view returns (uint256) {
        return originationFeePercentage;
    }

}
