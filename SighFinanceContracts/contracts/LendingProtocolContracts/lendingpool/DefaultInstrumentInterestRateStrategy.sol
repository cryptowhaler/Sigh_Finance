pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../libraries/WadRayMath.sol";

import "../../configuration/GlobalAddressesProvider.sol";
import "../interfaces/I_InstrumentInterestRateStrategy.sol";
import "../interfaces/ILendingRateOracle.sol";



/**
* @title DefaultInstrumentInterestRateStrategy contract
* @notice implements the calculation of the interest rates depending on the Instrument parameters.
* @dev if there is need to update the calculation of the interest rates for a specific Instrument,
* a new version of this contract will be deployed.
* @author Aave, SIGH Finance
**/
contract DefaultInstrumentInterestRateStrategy is I_InstrumentInterestRateStrategy {

    using WadRayMath for uint256;
    using SafeMath for uint256;

    GlobalAddressesProvider public addressesProvider;

    // this constant represents the utilization rate at which the pool aims to obtain most competitive borrow rates expressed in ray
    uint256 public constant OPTIMAL_UTILIZATION_RATE = 0.8 * 1e27;

    // this constant represents the excess utilization rate above the optimal. It's always equal to 1-optimal utilization rate. 
    // Added as a constant here for gas optimizations expressed in ray
    uint256 public constant EXCESS_UTILIZATION_RATE = 0.2 * 1e27;

    uint256 public baseVariableBorrowRate;          //base variable borrow rate when Utilization rate = 0. Expressed in ray
    uint256 public variableRateSlope1;              //slope of the variable interest curve when utilization rate > 0 and <= OPTIMAL_UTILIZATION_RATE. Expressed in ray
    uint256 public variableRateSlope2;              //slope of the variable interest curve when utilization rate > OPTIMAL_UTILIZATION_RATE. Expressed in ray
    uint256 public stableRateSlope1;                //slope of the stable interest curve when utilization rate > 0 and <= OPTIMAL_UTILIZATION_RATE. Expressed in ray
    uint256 public stableRateSlope2;                //slope of the stable interest curve when utilization rate > OPTIMAL_UTILIZATION_RATE. Expressed in ray
    // address public instrument;

    /**
    * @dev only the lending pool manager can call functions affected by this modifier
    **/
    modifier onlyLendingPoolManager {
        require( addressesProvider.getLendingPoolManager() == msg.sender, "The caller must be the lending pool manager" );
        _;
    }


    constructor( GlobalAddressesProvider _provider, uint256 _baseVariableBorrowRate, uint256 _variableRateSlope1,uint256 _variableRateSlope2, uint256 _stableRateSlope1, uint256 _stableRateSlope2 ) public {
        addressesProvider = _provider;
        baseVariableBorrowRate = _baseVariableBorrowRate;
        variableRateSlope1 = _variableRateSlope1;
        variableRateSlope2 = _variableRateSlope2;
        stableRateSlope1 = _stableRateSlope1;
        stableRateSlope2 = _stableRateSlope2;
        // instrument = _instrument;
    }

    // ######################################################
    // ####### VIEW FUNCTIONS TO GET CONSTANTS   ############
    // ################################################ #####

    function getBaseVariableBorrowRate() external view returns (uint256) {
        return baseVariableBorrowRate;
    }
    
    function setBaseVariableBorrowRate(uint256 newBorrowRate) external onlyLendingPoolManager {
        baseVariableBorrowRate = newBorrowRate;
    }

    function getVariableRateSlope1() external view returns (uint256) {
        return variableRateSlope1;
    }

    function setVariableRateSlope1(uint256 newVariableRateSlope1) external onlyLendingPoolManager {
        variableRateSlope1 = newVariableRateSlope1;
    }

    function getVariableRateSlope2() external view returns (uint256) {
        return variableRateSlope2;
    }
    
    function setVariableRateSlope2(uint256 newVariableRateSlope2) external onlyLendingPoolManager {
        variableRateSlope2 = newVariableRateSlope2;
    }

    function getStableRateSlope1() external view returns (uint256) {
        return stableRateSlope1;
    }

    function setStableRateSlope1(uint256 newstableRateSlope1) external onlyLendingPoolManager {
        stableRateSlope1 = newstableRateSlope1;
    }
    
    function getStableRateSlope2() external view returns (uint256) {
        return stableRateSlope2;
    }

    function setStableRateSlope2(uint256 newstableRateSlope2) external onlyLendingPoolManager {
        stableRateSlope2 = newstableRateSlope2;
    }

    // ##################################################################################################################
    // ####### THE MAIN INTEREST RATE FUNCTIONS (VIEW)   ################################################################
    // ####### 1. calculateInterestRates() : Returns LiquidityRate, StableBorrowRate, VariableBorrowRate   ##############
    // ##################################################################################################################


    /**
    * @dev calculates the interest rates depending on the available liquidity and the total borrowed.
    * @param _instrument the address of the instrument
    * @param _availableLiquidity the liquidity available in the instrument
    * @param _totalBorrowsStable the total borrowed from the instrument a stable rate
    * @param _totalBorrowsVariable the total borrowed from the instrument at a variable rate
    * @param _averageStableBorrowRate the weighted average of all the stable rate borrows
    * @return the liquidity rate, stable borrow rate and variable borrow rate calculated from the input parameters
    **/
    function calculateInterestRates(  address _instrument,  uint256 _availableLiquidity,  uint256 _totalBorrowsStable,  uint256 _totalBorrowsVariable,  uint256 _averageStableBorrowRate ) external view
        returns ( uint256 currentLiquidityRate, uint256 currentStableBorrowRate, uint256 currentVariableBorrowRate ) {
        uint256 totalBorrows = _totalBorrowsStable.add(_totalBorrowsVariable); // TOTAL BORROWS = STABLE BORROWS + VARIABLE BORROWS
        uint256 utilizationRate = (totalBorrows == 0 && _availableLiquidity == 0) ? 0 : totalBorrows.rayDiv(_availableLiquidity.add(totalBorrows));   // UTILIZATION RATE = TOTAL BORROWS / (AVAILABLE LIQUIDITY + TOTAL BORROWS)

        currentStableBorrowRate = ILendingRateOracle( addressesProvider.getLendingRateOracle() ).getMarketBorrowRate(_instrument);

        if (utilizationRate > OPTIMAL_UTILIZATION_RATE) {
            uint256 excessUtilizationRateRatio = utilizationRate.sub(OPTIMAL_UTILIZATION_RATE).rayDiv(EXCESS_UTILIZATION_RATE);
            currentStableBorrowRate = currentStableBorrowRate.add(stableRateSlope1).add( stableRateSlope2.rayMul(excessUtilizationRateRatio) );
            currentVariableBorrowRate = baseVariableBorrowRate.add(variableRateSlope1).add( variableRateSlope2.rayMul(excessUtilizationRateRatio) );
        } 
        else {
            currentStableBorrowRate = currentStableBorrowRate.add( stableRateSlope1.rayMul( utilizationRate.rayDiv( OPTIMAL_UTILIZATION_RATE ) ) );
            currentVariableBorrowRate = baseVariableBorrowRate.add( utilizationRate.rayDiv(OPTIMAL_UTILIZATION_RATE).rayMul(variableRateSlope1) );
        }

        currentLiquidityRate = getOverallBorrowRateInternal( _totalBorrowsStable, _totalBorrowsVariable, currentVariableBorrowRate, _averageStableBorrowRate ).rayMul(utilizationRate);
    }

// ###################################
// ####### INTERNAL FUNCTION #######
// #################################
    /**
    * @dev calculates the overall borrow rate as the weighted average between the total variable borrows and total stable borrows.
    * @param _totalBorrowsStable the total borrowed from the instrument a stable rate
    * @param _totalBorrowsVariable the total borrowed from the instrument at a variable rate
    * @param _currentVariableBorrowRate the current variable borrow rate
    * @param _currentAverageStableBorrowRate the weighted average of all the stable rate borrows
    * @return the weighted averaged borrow rate
    **/
    function getOverallBorrowRateInternal( uint256 _totalBorrowsStable, uint256 _totalBorrowsVariable, uint256 _currentVariableBorrowRate, uint256 _currentAverageStableBorrowRate ) internal pure returns (uint256) {
        uint256 totalBorrows = _totalBorrowsStable.add(_totalBorrowsVariable);

        if (totalBorrows == 0) 
            return 0;

        uint256 weightedVariableRate = _totalBorrowsVariable.wadToRay().rayMul( _currentVariableBorrowRate );
        uint256 weightedStableRate = _totalBorrowsStable.wadToRay().rayMul( _currentAverageStableBorrowRate );
        uint256 overallBorrowRate = weightedVariableRate.add(weightedStableRate).rayDiv( totalBorrows.wadToRay() );

        return overallBorrowRate;
    }
}
