pragma solidity ^0.5.16;

import "../Tokens/CToken.sol";
import "../PriceOracle.sol";


contract UnitrollerAdminStorage {
    /**
    * @notice Administrator for this contract
    */
    address public admin;

    /**
    * @notice Pending administrator for this contract
    */
    address public pendingAdmin;

    /**
    * @notice Active brains of Unitroller
    */
    address public sightrollerImplementation;

    /**
    * @notice Pending brains of Unitroller
    */
    address public pendingSightrollerImplementation;
}





contract SightrollerV1Storage is UnitrollerAdminStorage {

    /**
     * @notice Oracle which gives the price of any given asset
     */
    PriceOracle public oracle;

    /**
     * @notice Multiplier used to calculate the maximum repayAmount when liquidating a borrow
     */
    uint public closeFactorMantissa;

    /**
     * @notice Multiplier representing the discount on collateral that a liquidator receives
     */
    uint public liquidationIncentiveMantissa;

    /**
     * @notice Max number of assets a single account can participate in (borrow or use as collateral)
     */
    uint public maxAssets;

    /**
     * @notice Per-account mapping of "assets you are in", capped by maxAssets
     */
    mapping(address => CToken[]) public accountAssets;

}





contract SightrollerV2Storage is SightrollerV1Storage {

    struct Market {
        /// @notice Whether or not this market is listed
        bool isListed;

        /**
         * @notice Multiplier representing the most one can borrow against their collateral in this market.
         *  For instance, 0.9 to allow borrowing 90% of collateral value.
         *  Must be between 0 and 1, and stored as a mantissa.
         */
        uint collateralFactorMantissa;

        /// @notice Per-market mapping of "accounts in this asset"
        mapping(address => bool) accountMembership;

        /// @notice Whether or not this market receives SIGH
        bool isSIGHed;

    }

    /**
     * @notice Official mapping of cTokens -> Market metadata
     * @dev Used e.g. to determine if a market is supported
     */
    mapping(address => Market) public markets;


    /**
     * @notice The Pause Guardian can pause certain actions as a safety mechanism.
     *  Actions which allow users to remove their own assets cannot be paused.
     *  Liquidation / seizing / transfer can only be paused globally, not by market.
     */
    address public pauseGuardian;
    bool public _mintGuardianPaused;
    bool public _borrowGuardianPaused;
    bool public transferGuardianPaused;
    bool public seizeGuardianPaused;
    mapping(address => bool) public mintGuardianPaused;
    mapping(address => bool) public borrowGuardianPaused;
}







contract SightrollerV3Storage is SightrollerV2Storage {

    /// @notice A list of all markets
    CToken[] public allMarkets;


}


contract SightrollerV4Storage is SightrollerV3Storage {
    
    address public Sigh_Address;
    address public SighSpeedControllerAddress;

    struct SIGHMarketState {
        /// @notice The market's last updated SIGHIndex 
        uint224 index;

        uint224[24] recordedPriceSnapshot;

        /// @notice The block number the index was last updated at
        uint32 block_;
    }

    uint224 public curClock;

    uint256 public prevSpeedRefreshTime;

    uint224 public constant deltaTimeforSpeed = 3600; // 60 * 60 

    /// @notice The rate at which the flywheel distributes SIGH, per block
    uint public SIGHSpeed;

    mapping(address => uint) public SIGH_Speeds_Supplier_Ratio_Mantissa;

    /// @notice The portion of SIGHSpeed that suppliers of each market currently receives
    mapping(address => uint) public SIGH_Speeds_Suppliers;

    /// @notice The portion of SIGHSpeed that borrowers of each market currently receives
    mapping(address => uint) public SIGH_Speeds_Borrowers;

    /// @notice The SIGH market supply state for each market
    mapping(address => SIGHMarketState) public sigh_Market_State;

    /// @notice The SIGH market supply state for each market
    mapping(address => SIGHMarketState) public sighMarketBorrowState;

    /// @notice The SIGH borrow index for each market for each supplier as of the last time they accrued Gsigh
    mapping(address => mapping(address => uint)) public SIGHSupplierIndex;

    // @notice The SIGH borrow index for each market for each borrower as of the last time they accrued Gsigh
    mapping(address => mapping(address => uint)) public SIGHBorrowerIndex;

    /// @notice The Gsigh accrued but not yet transferred to each user
    mapping(address => uint) public SIGH_Accrued;

}
