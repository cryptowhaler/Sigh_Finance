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

    struct GsighMarketState {
        /// @notice The market's last updated GsighBorrowIndex or GsighSupplyIndex
        uint224 index;

        /// @notice The block number the index was last updated at
        uint32 block;
    }

    /// @notice A list of all markets
    CToken[] public allMarkets;

    /// @notice The rate at which the flywheel distributes Gsigh, per block
    uint public gsighRate;

    /// @notice The portion of gsighRate that each market currently receives
    mapping(address => uint) public gsighSpeeds;

    /// @notice The Gsigh market supply state for each market
    mapping(address => GsighMarketState) public gsighSupplyState;

    /// @notice The Gsigh market borrow state for each market
    mapping(address => GsighMarketState) public gsighBorrowState;

    /// @notice The Gsigh borrow index for each market for each supplier as of the last time they accrued Gsigh
    mapping(address => mapping(address => uint)) public gsighSupplierIndex;

    /// @notice The Gsigh borrow index for each market for each borrower as of the last time they accrued Gsigh
    mapping(address => mapping(address => uint)) public gsighBorrowerIndex;

    /// @notice The Gsigh accrued but not yet transferred to each user
    mapping(address => uint) public gsighAccrued;
}


contract SightrollerV4Storage is SightrollerV3Storage {

    struct SIGHMarketState {
        /// @notice The market's last updated SIGHIndex 
        uint224 index;

        uint224 recordedPriceSnapshot;

        /// @notice The block number the index was last updated at
        uint32 block;
    }



    /// @notice The rate at which the flywheel distributes SIGH, per block
    uint public SIGHRate;

    /// @notice The portion of SIGHRate that each market currently receives
    mapping(address => uint) public SIGH_Speeds;

    /// @notice The SIGH market supply state for each market
    mapping(address => SIGHMarketState) public sigh_Market_State;

    // /// @notice The SIGH market supply state for each market
    // mapping(address => SIGHMarketState) public sighMarketBorrowState;

    /// @notice The Gsigh borrow index for each market for each supplier as of the last time they accrued Gsigh
    mapping(address => mapping(address => uint)) public SIGHSupplierIndex;

    // / @notice The Gsigh borrow index for each market for each borrower as of the last time they accrued Gsigh
    // mapping(address => mapping(address => uint)) public SIGHBorrowerIndex;

    /// @notice The Gsigh accrued but not yet transferred to each user
    mapping(address => uint) public SIGH_Accrued;

    // treasuryRateMantissa

    // uint256 public treasury_SIGH;

    // uint256 public treasury_SIGH_Ratio;

    address public gelatoAddress;

}
