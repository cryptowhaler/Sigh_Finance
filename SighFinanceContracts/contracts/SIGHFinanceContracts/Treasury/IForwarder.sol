/*

  Copyright 2019 ZeroEx Intl.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/

pragma solidity ^0.5.9;
pragma experimental ABIEncoderV2;

import "./0xContracts/LibOrder.sol";
import "./0xContracts/LibFillResults.sol";


contract IForwarder {
    
    /// @dev Withdraws assets from this contract. The contract requires a ZRX balance in order to
    ///      function optimally, and this function allows the ZRX to be withdrawn by owner. It may also be
    ///      used to withdraw assets that were accidentally sent to this contract.
    /// @param assetData Byte array encoded for the respective asset proxy.
    /// @param amount Amount of ERC20 token to withdraw.
    function withdrawAsset(
        bytes calldata assetData,
        uint256 amount
    )
        external;

        /// @dev Approves the respective proxy for a given asset to transfer tokens on the Forwarder contract's behalf.
        ///      This is necessary because an order fee denominated in the maker asset (i.e. a percentage fee) is sent by the
        ///      Forwarder contract to the fee recipient.
        ///      This method needs to be called before forwarding orders of a maker asset that hasn't
        ///      previously been approved.
        /// @param assetData Byte array encoded for the respective asset proxy.
    function approveMakerAssetProxy(
        bytes calldata assetData
    )
        external;

    /// @dev Purchases as much of orders' makerAssets as possible by selling as much of the ETH value sent
    ///      as possible, accounting for order and forwarder fees.
    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset.
    /// @param signatures Proofs that orders have been created by makers.
    /// @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to corresponding feeRecipients.
    /// @param feeRecipients Addresses that will receive ETH when orders are filled.
    /// @return wethSpentAmount Amount of WETH spent on the given set of orders.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.
    function marketSellOrdersWithEth(
        LibOrder.Order[] memory orders,
        bytes[] memory signatures,
        uint256[] memory ethFeeAmounts,
        address payable[] memory feeRecipients
    )
        public
        payable
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
        );

    /// @dev Attempt to buy makerAssetBuyAmount of makerAsset by selling ETH provided with transaction.
    ///      The Forwarder may *fill* more than makerAssetBuyAmount of the makerAsset so that it can
    ///      pay takerFees where takerFeeAssetData == makerAssetData (i.e. percentage fees).
    ///      Any ETH not spent will be refunded to sender.
    /// @param orders Array of order specifications used containing desired makerAsset and WETH as takerAsset.
    /// @param makerAssetBuyAmount Desired amount of makerAsset to purchase.
    /// @param signatures Proofs that orders have been created by makers.
    /// @param ethFeeAmounts Amounts of ETH, denominated in Wei, that are paid to corresponding feeRecipients.
    /// @param feeRecipients Addresses that will receive ETH when orders are filled.
    /// @return wethSpentAmount Amount of WETH spent on the given set of orders.
    /// @return makerAssetAcquiredAmount Amount of maker asset acquired from the given set of orders.
    function marketBuyOrdersWithEth(
        LibOrder.Order[] memory orders,
        uint256 makerAssetBuyAmount,
        bytes[] memory signatures,
        uint256[] memory ethFeeAmounts,
        address payable[] memory feeRecipients
    )
        public
        payable
        returns (
            uint256 wethSpentAmount,
            uint256 makerAssetAcquiredAmount
        );
}
