// SPDX-License-Identifier: agpl-3.0
pragma solidity 0.6.12;

library DataTypes {
  struct InstrumentData {
    
    ReserveConfigurationMap configuration;      //stores the reserve configuration
    
    uint128 liquidityIndex;                     //the liquidity index. Expressed in ray
    
    uint128 variableBorrowIndex;                //variable borrow index. Expressed in ray
    
    uint128 currentLiquidityRate;               //the current supply rate. Expressed in ray
    
    uint128 currentVariableBorrowRate;          //the current variable borrow rate. Expressed in ray
    
    uint128 currentStableBorrowRate;            //the current stable borrow rate. Expressed in ray
    uint40 lastUpdateTimestamp;
    
    address aTokenAddress;                      //tokens addresses
    address stableDebtTokenAddress;
    address variableDebtTokenAddress;       
    
    address interestRateStrategyAddress;        //address of the interest rate strategy
    
    uint8 id;                                   //the id of the reserve. Represents the position in the list of the active reserves
  }

  struct ReserveConfigurationMap {
    //bit 0-15: LTV
    //bit 16-31: Liq. threshold
    //bit 32-47: Liq. bonus
    //bit 48-55: Decimals
    //bit 56: Reserve is active
    //bit 57: reserve is frozen
    //bit 58: borrowing is enabled
    //bit 59: stable rate borrowing enabled
    //bit 60-63: reserved
    //bit 64-79: reserve factor
    uint256 data;
  }

  struct UserConfigurationMap {
    uint256 data;
  }

  enum InterestRateMode {NONE, STABLE, VARIABLE}
}