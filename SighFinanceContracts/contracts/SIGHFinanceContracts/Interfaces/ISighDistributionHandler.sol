pragma solidity ^0.5.16;

/**
 * @title Sigh Speed Controller Contract
 * @notice Distributes a token to a different contract at a fixed rate.
 * @dev This contract must be poked via the `drip()` function every so often.
 * @author SighFinance
 */

interface ISighDistributionHandler {

    function addInstrument( address _instrument, address _iTokenAddress, uint256 _decimals ) external returns (bool);   // onlyLendingPoolCore
    function Instrument_SIGHed(address instrument_) external  returns (bool);                                           // onlySighFinanceConfigurator
    function Instrument_UNSIGHed(address instrument_) external returns (bool);                                          //onlySighFinanceConfigurator

    function updateSIGHSpeed(uint SIGHSpeed_) external returns (bool);                                                      // onlySighFinanceConfigurator
    function updateStakingSpeedForAnInstrument(address instrument_, uint newStakingSpeed) external returns (bool);          // onlySighFinanceConfigurator
    function SpeedUpperCheckSwitch( bool isActivated, uint profitPercentage ) external returns (bool);                      // onlySighFinanceConfigurator
    function updateDeltaBlocksForSpeedRefresh(uint deltaBlocksLimit) external returns (bool);                               // onlySighFinanceConfigurator
    function updateSIGHSpeedRatioForAnInstrument(address instrument_, uint supplierRatio) external returns (bool);          // onlyLendingPoolConfigurator

    function refreshSIGHSpeeds() public returns (bool);

    function updateSIGHSupplyIndex(address currentInstrument) external  returns (bool);                                      // onlyLendingPoolCore
    function updateSIGHBorrowIndex(address currentInstrument) external  returns (bool);                                      // onlyLendingPoolCore
    function transferSighTotheUser(address instrument, address user, uint sigh_Amount) external  returns (uint);             // onlyITokenContract(instrument)

    // ###### VIEW FUNCTIONS ######
    function isInstrumentSupported (address instrument_) external view returns (bool);
    function totalInstrumentsSupported() external view returns (uint);

    function getInstrumentSupplyIndex(address instrument_) external view returns (uint);
    function getInstrumentBorrowIndex(address instrument_) external view returns (uint);
    function getInstrumentData (address instrument_) external view returns (address, uint256,bool,uint256,uint256,uint256,uint256  );

    function getupperCheckProfitPercentage () external view returns (uint);
    function checkPriceSnapshots(address instrument_, uint clock) external view returns (uint256);
    function checkinitializationCounter(address instrument_) external view returns (uint32);

    function getSIGHSpeed() external view returns (uint);
    function getInstrumentSupplierSIGHSpeed(address instrument_) external view returns (uint);
    function getInstrumentBorrowerSIGHSpeed(address instrument_) external view returns (uint);
    function getInstrumentStakingSIGHSpeed(address instrument_) external view returns (uint);
    function getInstrumentSpeedRatio(address instrument_) external view returns (uint);

    function getDeltaBlocksForSpeed() external view returns (uint);
    function getPrevSpeedRefreshBlock() external view returns (uint);
    function getBlocksRemainingToNextSpeedRefresh() external view returns (uint);
}