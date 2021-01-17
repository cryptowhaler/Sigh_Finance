pragma solidity 0.6.12;

import {UserConfiguration} from '../libraries/configuration/UserConfiguration.sol';
import {ReserveConfiguration} from '../libraries/configuration/ReserveConfiguration.sol';
import {ReserveLogic} from '../libraries/logic/ReserveLogic.sol';
import {IGlobalAddressesProvider} from '../../interfaces/IGlobalAddressesProvider.sol';
import {DataTypes} from '../libraries/types/DataTypes.sol';

contract LendingPoolStorage {

    using ReserveLogic for DataTypes.InstrumentData;
    using ReserveConfiguration for DataTypes.InstrumentConfigurationMap;
    using UserConfiguration for DataTypes.UserConfigurationMap;

    IGlobalAddressesProvider internal _addressesProvider;

    mapping(address => DataTypes.InstrumentData) internal _instruments;
    mapping(address => DataTypes.UserConfigurationMap) internal _usersConfig;

    
    mapping(uint256 => address) internal _instrumentsList;      // the list of the available instruments, structured as a mapping for gas savings reasons

    uint256 internal _instrumentsCount;

    bool internal _paused;
}