pragma solidity 0.6.12;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/IERC20.sol";

import "../interfaces/ISIGHNFTBoosters.sol";
import "../dependencies/StringUtils.sol";

contract SIGHBoostersSale is Ownable {

    using StringUtils for string;
    using SafeMath for uint256;

    ISIGHNFTBoosters private _SIGH_NFT_BoostersContract;    // SIGH Finance NFT Boosters Contract
    address private _BoosterVault;

    IERC20 private tokenAcceptedAsPayment;         // Address of token accepted as payment

    struct boosterList {
        uint256 totalAvailable;             // No. of Boosters of a particular type currently available for sale
        uint256[] boosterIdsList;          // List of BoosterIds for the boosters of a particular type currently available for sale
        uint256 salePrice;                  // Sale price for a particular type of Booster
        uint256 totalBoostersSold;           // Boosters sold
    }

    mapping (string => boosterList) private listOfBoosters;   // (Booster Type => boosterList struct)
    mapping (uint256 => bool) private boosterIdsForSale;      // Booster Ids that have been included for sale
    mapping (string => bool) private boosterTypes;            // Booster Type => Yes/No

    constructor(address _SIGHNFTBoostersContract) public {
        require(_SIGHNFTBoostersContract != address(0),'SIGH Finance : Invalid _SIGHNFTBoostersContract address');
        _SIGH_NFT_BoostersContract = ISIGHNFTBoosters(_SIGHNFTBoostersContract);
    }

    // #################################
    // ######## ADMIN FUNCTIONS ########
    // #################################

    function addBoostersForSale(string memory _BoosterType, string[] memory boosterids, uint256 _price ) external onlyOwner {
        require( _SIGH_NFT_BoostersContract.isValidBoosterType(_Boostertype),"SIGH Finance : Not a valid Booster Type");

        if (!boosterTypes[_BoosterType]) {
            boosterTypes[_BoosterType] = true;
            listOfBoosters[_BoosterType] = boosterList({ totalAvailable: uint256(0) , boosterIdsList: [], salePrice: uint256(_price), totalBoostersSold: uint256(0) });
        }
        
        for (uint i; i < boosterids.length(); i++ ) {
            require( !boosterIdsForSale[boosterids[i]], "Booster already added for sale");

            ( , string memory _type) = _SIGH_NFT_BoostersContract.getBoosterInfo(boosterids[i]);
            require(_type.equal(_BoosterType),"Booster of different type");
            
            listOfBoosters[_type].boosterIdsList.push( boosterids[i] ); // ADDED the boosterID to the list of Boosters available for sale
            listOfBoosters[_type].totalAvailable = listOfBoosters[_type].totalAvailable.add(1); // Incremented total available by 1
            boosterIdsForSale[boosterids[i]] = true;
        }          
    } 

    // Updates the Sale price for '_BoosterType' type of Boosters. Only owner can call this function
    function updateSalePrice(string memory _BoosterType, uint256 _price ) external onlyOwner {
        require( _SIGH_NFT_BoostersContract.isValidBoosterType(_Boostertype),"SIGH Finance : Not a valid Booster Type");
        require( boosterTypes[_BoosterType] ,"SIGH Finance : Booster Type not initialized yet");

        listOfBoosters[_type].salePrice = _price;
    }

    // Transfers part of the collected DAI to the 'to' address . Only owner can call this function
    function updateAcceptedToken(address token) external onlyOwner {
        require( token != address(0) ,"Invalid destination address");
        tokenAcceptedAsPayment = IERC20(token);        
    }    

    // Transfers part of the collected DAI to the 'to' address . Only owner can call this function
    function transferBalance(address to, uint amount) external onlyOwner {
        require( to != address(0) ,"Invalid destination address");
        require( amount <= getCurrentBalance() ,"Invalid amount");
        tokenAcceptedAsPayment.transfer(to,amount);        
    }    

    // ##########################################
    // ######## FUNCTION TO BY A BOOSTER ########
    // ##########################################

    function buyBoosters(string memory _BoosterType, uint boostersToBuy) external {
        require(boostersToBuy >= 1,"Invalid number of boosters provided");
        require(boosterTypes[_BoosterType],"Invalid Booster Type");
        require(listOfBoosters[_BoosterType].totalAvailable >=  boostersToBuy,"Desired Number of boosters not available");

        uint amountToBePaid = boostersToBuy.mul(listOfBoosters[_BoosterType].salePrice);

        transferFunds(msg.sender,amountToBePaid);
        transferBoosters(msg.sender, _BoosterType, boostersToBuy);
    } 


    // #########################################
    // ######## EXTERNAL VIEW FUNCTIONS ########
    // #########################################

    function getBoosterSaleDetails(string memory _Boostertype) external view returns (uint256 available,uint256 price, uint256 sold) {
        require( _SIGH_NFT_BoostersContract.isValidBoosterType(_Boostertype),"SIGH Finance : Not a valid Booster Type");
        available = listOfBoosters[_Boostertype].totalAvailable;
        price = listOfBoosters[_Boostertype].salePrice;
        sold = listOfBoosters[_Boostertype].totalBoostersSold;
    }

    function getTokenAccepted() public view returns(string memory) {
        return tokenAcceptedAsPayment.symbol();
    }

    function getCurrentBalance() public view returns (uint256) { 
        return tokenAcceptedAsPayment.balanceOf(address(this));
    }

    // ####################################
    // ######## INTERNAL FUNCTIONS ########
    // ####################################

    // Transfers 'totalBoosters' number of BOOSTERS of type '_BoosterType' to the 'to' address
    function transferBoosters(address to, string memory _BoosterType, uint totalBoosters) internal {
        uint counter; 
        uint listLength = boosterTypes[_BoosterType].boosterIdsList.length();

        for (uint i; i < listLength; i++ ) {
            uint256 _boosterId = boosterTypes[_BoosterType].boosterIdsList[i];  // current BoosterID

            if (boosterIdsForSale[_boosterId]) {
                // Transfer the Booster and Verify the same
                _SIGH_NFT_BoostersContract.safeTransferFrom(_BoosterVault,to,_boosterId);
                require(to == _SIGH_NFT_BoostersContract.ownerOf(_boosterId),"Booster Transfer failed");
                
                // Remove the Booster ID from the list of Boosters available
                boosterTypes[_BoosterType].boosterIdsList[i] = boosterTypes[_BoosterType].boosterIdsList[listLength - 1];
                boosterTypes[_BoosterType].boosterIdsList[i].length--;
                
                // Update the number of boosters available & sold
                boosterTypes[_BoosterType].totalAvailable = boosterTypes[_BoosterType].totalAvailable.sub(1);
                boosterTypes[_BoosterType].totalBoostersSold = boosterTypes[_BoosterType].totalBoostersSold.add(1);

                // Mark the BoosterID as sold and update the counter
                boosterIdsForSale[_boosterId] = false;
                counter = counter.add(1);

                emit BoosterSold(to, _BoosterType, _boosterId, boosterTypes[_BoosterType].salePrice );

                if (counter == totalBoosters) {
                    break;
                }
            }
        }
    }

    // Transfers 'amount' of DAI to the contract
    function transferFunds(address from, uint amount) internal {
        uint prevBalance = tokenAcceptedAsPayment.balanceOf(address(this));
        tokenAcceptedAsPayment.transferFrom(from,address(this),amountToBePaid);
        uint newBalance = tokenAcceptedAsPayment.balanceOf(address(this));
        require(newBalance == prevBalance.add(amount),'DAI transfer failure');
    }

}