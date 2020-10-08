pragma solidity ^0.5.16;


contract TreasuryStorage {
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
    address public pendingTreasuryImplementation;

    /**
    * @notice Sightroller Address 
    */
    address public sightroller;

    /**
    * @notice Sightroller Address 
    */
    address public pendingSightroller;
}