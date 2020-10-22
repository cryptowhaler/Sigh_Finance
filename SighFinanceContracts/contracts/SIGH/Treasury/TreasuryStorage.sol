pragma solidity ^0.5.16;

// import "../openzeppelin/EIP20Interface.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol"; 

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
    address public treasuryImplementation;

    /**
    * @notice Pending brains of Treasury
    */
    address public pendingTreasuryImplementation;
}





contract TreasuryV1Storage {

    address public admin;

    address public pendingAdmin;

    /// @notice Reference to token to burn / trade (immutable)
    IERC20 public sigh_token;

    /// @notice Target to receive dripped tokens (immutable)
    address public sightroller_address;

    address public tokenBeingDripped; 
    uint DripSpeed;
    bool isDripAllowed = false;
    
    uint SIGHBurnSpeed;
    

    mapping(address => uint) SIGH_Transferred;
    mapping (address => uint) TokenBalances;
    mapping (address => uint)  totalDrippedAmount;  // Stores the total amount of each token dripped

}