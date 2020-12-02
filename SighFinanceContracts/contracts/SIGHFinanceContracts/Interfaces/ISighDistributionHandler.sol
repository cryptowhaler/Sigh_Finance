pragma solidity ^0.5.16;

/**
 * @title Sigh Distribution Handler Contract
 * @notice Handles the SIGH Loss Minimizing Mechanism for the Lending Protocol
 * @dev Accures SIGH for the supported markets based on losses made every 24 hours, along with Staking speeds. This accuring speed is updated every hour
 * @author SIGH Finance
 */

interface ISighDistributionHandler {

    function refreshConfig() external;
    
    function addInstrument( address _instrument, address _iTokenAddress, address _sighStreamAddress, uint256 _decimals ) external returns (bool);   // onlyLendingPoolCore
    function removeInstrument( address _instrument ) external returns (bool);   // 

    function Instrument_SIGH_StateUpdated(address instrument_, uint _maxVolatilityLimitSuppliers,uint _maxVolatilityLimitBorrowers, bool _isSIGHMechanismActivated  ) external returns (bool); // onlySighFinanceConfigurator

    function updateSIGHSpeed(uint SIGHSpeed_) external returns (bool);                                                      // onlySighFinanceConfigurator
    function updateStakingSpeedForAnInstrument(address instrument_, uint newStakingSpeed) external returns (bool);          // onlySighFinanceConfigurator
    function updateSIGHSpeedUpperCheck( bool isActivated, uint maxVolatilityProtocolLimit_ ) external returns (bool);                      // onlySighFinanceConfigurator
    function updateDeltaBlocksForSpeedRefresh(uint deltaBlocksLimit) external returns (bool);                               // onlySighFinanceConfigurator

    function refreshSIGHSpeeds() external returns (bool);

    function updateSIGHSupplyIndex(address currentInstrument) external  returns (bool);                                      // onlyLendingPoolCore
    function updateSIGHBorrowIndex(address currentInstrument) external  returns (bool);                                      // onlyLendingPoolCore

    function transferSighTotheUser(address instrument, address user, uint sigh_Amount ) external  returns (uint);             // onlyITokenContract(instrument)

    // ###### VIEW FUNCTIONS ######
    function getSIGHBalance() external view returns (uint);
    function getAllInstrumentsSupported() external view returns (address[] memory );
    
    function getInstrumentData (address instrument_) external view returns (string memory name, address iTokenAddress, uint decimals, bool isSIGHMechanismActivated,uint256 supplyindex, uint256 borrowindex  );

    function getInstrumentSpeeds(address instrument) external view returns (uint8 side, uint suppliers_speed, uint borrowers_speed, uint staking_speed );    
    function getInstrumentVolatilityStates(address instrument) external view returns ( uint8 side, uint _24HrVolatilityLimitAmount, uint percentTotalVolatilityLimitAmount, uint _total24HrVolatility, uint percentTotalVolatility  );    
    function getInstrumentSighLimits(address instrument) external view returns ( uint _maxVolatilityLimitSuppliers , uint _maxVolatilityLimitBorrowers  );    

    function getAllPriceSnapshots(address instrument_ ) external view returns (uint256[24] memory);    
    function getBlockNumbersForPriceSnapshots() external view returns (uint256[24] memory);    
    
    function getSIGHSpeed() external view returns (uint);
    function getSIGHSpeedUsed() external view returns (uint);
    
    function isInstrumentSupported (address instrument_) external view returns (bool);
    function totalInstrumentsSupported() external view returns (uint);

    function getInstrumentSupplyIndex(address instrument_) external view returns (uint);
    function getInstrumentBorrowIndex(address instrument_) external view returns (uint);

    function getMaxVolatilityProtocolLimit () external view returns (uint);
    function checkPriceSnapshots(address instrument_, uint clock) external view returns (uint256);
    function checkinitializationCounter(address instrument_) external view returns (uint32);

    function getDeltaBlocksForSpeed() external view returns (uint);
    function getPrevSpeedRefreshBlock() external view returns (uint);
    function getBlocksRemainingToNextSpeedRefresh() external view returns (uint);
}

