pragma solidity ^0.5.0;

/**
 * @title Sigh Staking Contract
 * @notice Distributes rewards (Fee collected from Lending Protocol ) to SIGH Stakers
 * @dev 
 * @author SIGH Finance
 */


import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/SafeERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Burnable.sol";

import "../../openzeppelin-upgradeability/VersionedInitializable.sol";
import "../interfaces/IKyberNetworkProxyInterface.sol";
import "../libraries/EthAddressLib.sol";


contract SighStaking is VersionedInitializable {

    using SafeMath for uint256;
    using SafeERC20 for IERC20;

    mapping (address => uint256) private stakingBalances;
    uint private totalStakedSigh;

    event SighStaked(address staker, uint256 amount, uint256 totalStakedAmountByStaker, uint256 totalStakedSigh );

    uint256 public constant IMPLEMENTATION_REVISION = 0x1;


// ########################################################
// ##############  INITIALIZING THE STATE   ###############
// ########################################################

    /// @notice Called by the proxy when setting this contract as implementation
    function initialize(  address addressesProvider_ ) public initializer {
        addressesProvider = addressesProvider_;
    }



// ################################################################
// ##############  STAKE SIGH   ###############
// ################################################################


    function stakeSigh(uint amount) external returns (bool) {

        uint prevBalance = sigh_Instrument.balanceOf(address(this));
        require(sigh_Instrument.transferFrom( msg.sender, address(this), amount ),"SIGH could not be transferred to the Staking Contract" );
        uint newBalance = sigh_Instrument.balanceOf(address(this));

        uint diff = sub( newBalance,prevBalance,"New Sigh balance is less than the previous balance." );
        require(diff == amount,"Amount to be staked and the amount transferred do not match");

        uint prevStakedAmount = stakingBalances[msg.sender];
        stakingBalances[msg.sender] = add(prevStakedAmount,amount,"New Staking balance overflow");

        uint prevStakedSigh = totalStakedSigh;
        totalStakedSigh = add(prevStakedSigh, amount,"Total Staked Sigh overflow");

        SighStaked( msg.sender, amount, stakingBalances[msg.sender], totalStakedSigh  );
        return true;
    }

    function unstakeSigh(uint amount) external returns (bool) {
        
    }



    /// @notice Distributes a list of _tokens balances in this contract, depending on the distribution
    /// @param _tokens list of ERC20 tokens to distribute
    function distribute(IERC20[] memory _tokens) public {

        for (uint256 i = 0; i < _tokens.length; i++) {
            address _tokenAddress = address(_tokens[i]);
            uint256 _balanceToDistribute = (_tokenAddress != EthAddressLib.ethAddress()) ? _tokens[i].balanceOf(address(this)) : address(this).balance;
            if (_balanceToDistribute <= 0) {
                continue;
            }

            Distribution memory _distribution = distribution;
            for (uint256 j = 0; j < _distribution.receivers.length; j++) {

                uint256 _amount = _balanceToDistribute.mul(_distribution.percentages[j]).div(DISTRIBUTION_BASE);

                if (_distribution.receivers[j] != address(0)) {
                    if (_tokenAddress != EthAddressLib.ethAddress()) {
                        _tokens[i].safeTransfer(_distribution.receivers[j], _amount);
                    } 
                    else {
                        (bool _success,) = _distribution.receivers[j].call.value(_amount)("");
                        require(_success, "Reverted ETH transfer");
                    }
                    emit Distributed(_distribution.receivers[j], _distribution.percentages[j], _amount);
                } 
                else {
                    uint256 _amountToBurn = _amount;
                    if (_tokenAddress != tokenToBurn) {             // If the token to burn is already tokenToBurn, we don't trade, burning directly
                        _amountToBurn = internalTrade(_tokenAddress, _amount);
                    }
                    internalBurn(_amountToBurn);
                }
            }
        }
    }


// ###################################################
// ##############  INTERNAL FUNCTIONS  ###############
// ###################################################


    /// @notice Gets the revision number of the contract
    /// @return The revision numeric reference
    function getRevision() internal pure returns (uint256) {
        return IMPLEMENTATION_REVISION;
    }

    /// @notice Internal trade function
    /// @param _from The token to trade from
    /// @param _amount The amount to trade
    function internalTrade(address _from, uint256 _amount) internal returns(uint256) {
        address _kyberFromRef = (_from == EthAddressLib.ethAddress()) ? KYBER_ETH_MOCK_ADDRESS : _from;
        uint256 _value = (_from == EthAddressLib.ethAddress()) ? _amount    :    0;
            
            // IERC20(_kyberFromRef),                              // _from token (or ETH mock address)            
            // _amount,                                            // amount of the _from token to trade            
            // IERC20(tokenToBurn),                                // _to token (or ETH mock address)            
            // address(this),                                      // address which will receive the _to token amount traded            
            // MAX_UINT,                                           // max amount to receive, no limit, using the max uint            
            // MIN_CONVERSION_RATE,                                // conversion rate, use 1 for market price
            // 0x0000000000000000000000000000000000000000,         // Related with a referral program, not needed
            // ""                                                  // Related with filtering of reserves by permisionless or not. Not needed

        uint256 _amountReceived = kyberProxy.tradeWithHint.value(_value)( IERC20(_kyberFromRef), _amount,  IERC20(tokenToBurn),  address(this),  MAX_UINT,  MIN_CONVERSION_RATE, 0x0000000000000000000000000000000000000000, "" );
        emit Trade(_kyberFromRef, _amount, _amountReceived);
        return _amountReceived;
    }

    /// @notice Internal function to send _amount of tokenToBurn to the 0x0 address
    /// @param _amount The amount to burn
    function internalBurn(uint256 _amount) internal {
        require(IERC20(tokenToBurn).transfer(recipientBurn, _amount), "INTERNAL_BURN. Reverted transfer to recipientBurn address");
        emit Burn(_amount);
    }



// #######################################
// ##############  RANDOM  ###############
// #######################################



    /// @notice Returns the receivers and percentages of the contract Distribution
    /// @return receivers array of addresses and percentages array on uints
    function getDistribution() public view returns(address[] memory receivers, uint256[] memory percentages) {
        receivers = distribution.receivers;
        percentages = distribution.percentages;
    }

    /// @notice In order to receive ETH transfers
    function() external payable {}

}