pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";

import "../../interfaces/ILendingPoolAddressesProvider.sol";
import "../interfaces/IFlashLoanReceiver.sol";

import "../../libraries/EthAddressLib.sol";

contract FlashLoanReceiverBase is IFlashLoanReceiver {

    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    ILendingPoolAddressesProvider public addressesProvider;

    constructor(ILendingPoolAddressesProvider _provider) public {
        addressesProvider = _provider;
    }

    function () external payable {
    }

// ################################################################################################
// ####   INTERNAL FUNCTION : TRANSFERS THE LOAN AMOUNT BACK TO THE LENDINGPOOLCORE CONTRACT   ####
// ################################################################################################

    function transferFundsBackToPoolInternal(address _instrument, uint256 _amount) internal {
        address payable core = addressesProvider.getLendingPoolCore();
        transferInternal(core,_instrument, _amount);
    }

    function transferInternal(address payable _destination, address _instrument, uint256  _amount) internal {
        if(_instrument == EthAddressLib.ethAddress()) {
            _destination.call.value(_amount)("");
            return;
        }
        IERC20(_instrument).safeTransfer(_destination, _amount);
    }

// ################################################################################################
// ####   INTERNAL VIEW FUNCTION : Instrument balance of the target address   #####################
// ################################################################################################

    function getBalanceInternal(address _target, address _instrument) internal view returns(uint256) {
        if(_instrument == EthAddressLib.ethAddress()) {
            return _target.balance;
        }
        return IERC20(_instrument).balanceOf(_target);
    }
}