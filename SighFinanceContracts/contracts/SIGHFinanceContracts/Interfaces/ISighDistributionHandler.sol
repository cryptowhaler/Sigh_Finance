pragma solidity ^0.5.16;

/**
 * @title Sigh Distribution Handler Contract
 * @notice Handles the SIGH Loss Minimizing Mechanism for the Lending Protocol
 * @dev Accures SIGH for the supported markets based on losses made every 24 hours, along with Staking speeds. This accuring speed is updated every hour
 * @author SIGH Finance
 */

interface ISighDistributionHandler {

    function refreshConfig() external;
    
    function addInstrument( address _instrument, address _iTokenAddress, uint256 _decimals ) external returns (bool);   // onlyLendingPoolCore
    function Instrument_SIGHed(address instrument_) external  returns (bool);                                           // onlySighFinanceConfigurator
    function Instrument_UNSIGHed(address instrument_) external returns (bool);                                          //onlySighFinanceConfigurator

    function updateSIGHSpeed(uint SIGHSpeed_) external returns (bool);                                                      // onlySighFinanceConfigurator
    function updateStakingSpeedForAnInstrument(address instrument_, uint newStakingSpeed) external returns (bool);          // onlySighFinanceConfigurator
    function SpeedUpperCheckSwitch( bool isActivated, uint profitPercentage ) external returns (bool);                      // onlySighFinanceConfigurator
    function updateDeltaBlocksForSpeedRefresh(uint deltaBlocksLimit) external returns (bool);                               // onlySighFinanceConfigurator
    function updateSIGHSpeedRatioForAnInstrument(address instrument_, uint supplierRatio) external returns (bool);          // onlyLendingPoolConfigurator

    function refreshSIGHSpeeds() external returns (bool);

    function updateSIGHSupplyIndex(address currentInstrument) external  returns (bool);                                      // onlyLendingPoolCore
    function updateSIGHBorrowIndex(address currentInstrument) external  returns (bool);                                      // onlyLendingPoolCore

    function transferSighTotheUser(address instrument, address user, address sighAccuredTo, uint sigh_Amount) external  returns (uint);             // onlyITokenContract(instrument)

    // ###### VIEW FUNCTIONS ######
    function getSIGHBalance() external view returns (uint);
    function getAllInstrumentsSupported() external view returns (address[] memory );
    function getInstrumentData (address instrument_) external view returns (string memory name, address iTokenAddress, uint decimals, bool isSIGHMechanismActivated,uint256 supplyindex, uint256 borrowindex  );
    function getInstrumentSighMechansimStates(address instrument) external view returns (uint suppliers_speed, uint borrowers_speed, uint staking_speed, uint _24HrVolatility, string memory side, uint percentTotalVolatility);    
    function getAllPriceSnapshots(address instrument_ ) external view returns (uint256[24] memory);    
    function getBlockNumbersForPriceSnapshots() external view returns (uint256[24] memory);    
    
    function getSIGHSpeed() external view returns (uint);
    function isInstrumentSupported (address instrument_) external view returns (bool);
    function totalInstrumentsSupported() external view returns (uint);

    function getInstrumentSupplyIndex(address instrument_) external view returns (uint);
    function getInstrumentBorrowIndex(address instrument_) external view returns (uint);

    function getupperCheckProfitPercentage () external view returns (uint);
    function checkPriceSnapshots(address instrument_, uint clock) external view returns (uint256);
    function checkinitializationCounter(address instrument_) external view returns (uint32);

    function getInstrumentSupplierSIGHSpeed(address instrument_) external view returns (uint);
    function getInstrumentBorrowerSIGHSpeed(address instrument_) external view returns (uint);
    function getInstrumentStakingSIGHSpeed(address instrument_) external view returns (uint);

    function getDeltaBlocksForSpeed() external view returns (uint);
    function getPrevSpeedRefreshBlock() external view returns (uint);
    function getBlocksRemainingToNextSpeedRefresh() external view returns (uint);
}