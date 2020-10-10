pragma solidity ^0.5.16;


contract TreasuryCoreStorage {
    /**
    * @notice Administrator for this contract
    */
    address public admin;

    /**
    * @notice Pending administrator for this contract
    */
    address public pendingAdmin;

    /**
    * @notice Active brains of Treasury
    */
    address public TreasuryImplementation;

    /**
    * @notice Pending brains of Treasury
    */
    address public pendingTreasuryImplementation;1
}





contract TreasuryV1Storage is TreasuryCoreStorage {

    /// @notice Reference to token to drip (immutable)
    EIP20Interface public sigh_token;

    /// @notice Target to receive dripped tokens (immutable)
    address public sightroller_address;

    uint dripRate;

    mapping(address => uint) SIGH_Transferred;

    mapping (string => uint) TokenBalances;
}