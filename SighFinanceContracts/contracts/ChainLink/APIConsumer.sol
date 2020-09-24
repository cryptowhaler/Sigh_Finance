// pragma solidity ^0.5.16;

// import "@chainlink/contracts/ChainlinkClient.sol";

// contract APIConsumer is ChainlinkClient {

//     uint256 public ethereumPrice;
//     address private oracle;
//     bytes32 private jobId;
//     uint256 private fee;

//     /**
//    * Network : Kovan
//    * Oracle : ChainLink - 
//    * Job ID : Chainlink - 
//    * Fee : 0.1 LINK
//       */

//     constructor () public {
//         setPublicChainlinkToken();  // gives the chainlink contract
//         oracle = ;
//         jobId = ;
//         fee = 0.1 * 10 **18; // 0.1 LINK
//     }

//     // Create a Chainlink request to retrieve API response, fund the target price 
//     // data, then multiply by 100 (to remove decimal places)
//     function requestEthereumPrice() public returns (bytes requestId) {

//         Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);

//         // URL to perform the get request on
//         request.add("get","http://   ");
//         // path to fund desired data in the API response. Eq - {"USD":243.43}
//         request.add("path","USD");
//         // multiply the result with 100 to remove decimals
//         request.addInt("times",100);
//         // Send the request - basically outputs an event for the chainlink node to read off
//         // 1. Smart contract will post some data
//         // 2. there's a chainlink node looking for that particular data
//         // 3. when it finds the data, it makes an API call and does processing off-chain,
//         // and when it is done, it calls a fulfill function (i.e it makes a transaction)
//         // and posts it back on chain in an external transaction
//         return sendChainlinkRequestTo(oracle,request,fee);
//     }

//     // recordChainlinkFulfillment makes sure that only the corresponding oracle can fulfill
//     function fulfill (bytes _requestId, uint256 _price) public recordChainlinkFulfillment(_requestId) {
//         ethereumPrice = _price;
//     }
// }
//     // Nodes (identified by Oracle ID) have different Jobs
//     // Each job has certain adapters which define what to do when you get the data


// //  typical ERC20 tokens don't allow for transfer / execution of a smart contract in a single transaction.
// //  However, ERC677 does. So when the request is made, the payload of that request is actually send along with  
// //  the token transfer.
// // So the node operators know exactly how much they will be paid for that request and can respond immediately
// // knowing that they will be paid for their work
// // 
// //     
// // 
// // 

    



    


