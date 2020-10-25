pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/utils/Address.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";

import "../../configuration/GlobalAddressesProvider.sol";
import "../lendingpool/LendingPoolCore.sol";
import "../libraries/EthAddressLib.sol";


/**
* @title WalletBalanceProvider contract
* @author Aave, SIGH Finance, influenced by https://github.com/wbobeirne/eth-balance-checker/blob/master/contracts/BalanceChecker.sol
* @notice Implements a logic of getting multiple tokens balance for one user address
* @dev NOTE: THIS CONTRACT IS NOT USED WITHIN THE SIGH FINANCE PROTOCOL. It's an accessory contract used to reduce the number of calls towards the blockchain from the Aave backend.
**/
contract WalletBalanceProvider {

    using Address for address;

    GlobalAddressesProvider provider;

    constructor(GlobalAddressesProvider _provider) public {
        provider = _provider;
    }

    /**
    @dev Fallback function, don't accept any ETH
    **/
    function() external payable {
        revert("WalletBalanceProvider does not accept payments");
    }

    /**
    @dev Check the token balance of a wallet in a token contract
    Returns the balance of the token for user. Avoids possible errors:
      - return 0 on non-contract address
    **/
    function balanceOf(address _user, address _token) public view returns (uint256) {
        // check if token is actually a contract
        if (_token.isContract()) {
            return IERC20(_token).balanceOf(_user);
        } else {
            return 0;
        }
    }


    /**
    @dev provides balances of user wallet for all instruments available on the pool
    */
    function getUserWalletBalances(address _user) public view returns (address[] memory, uint256[] memory) {

        LendingPoolCore core = LendingPoolCore(provider.getLendingPoolCore());

        address[] memory instruments = core.getInstruments();

        uint256[] memory balances = new uint256[](instruments.length);

        for (uint256 j = 0; j < instruments.length; j++) {
            if(!core.getInstrumentIsActive(instruments[j])){
                balances[j] = 0;
                continue;
            }
            if (instruments[j] != EthAddressLib.ethAddress()) {
                balances[j] = balanceOf(_user, instruments[j]);
            } else {
                balances[j] = _user.balance; // ETH balance
            }
        }

        return (instruments, balances);
    }
}