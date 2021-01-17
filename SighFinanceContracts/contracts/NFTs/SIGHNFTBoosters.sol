// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC721/IERC721Metadata.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Enumerable.sol";
import "@openzeppelin/contracts/introspection/ERC165.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

import "../dependencies/EnumerableSet.sol";
import "../dependencies/StringUtils.sol";


contract SIGH_NFT_Boosters is IERC721Metadata,IERC721Enumerable, Ownable {

    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    using SafeMath for uint256;
    using Address for address;
    using EnumerableSet for EnumerableSet.BoosterSet;
    using EnumerableMap for EnumerableMap.UintToAddressMap;
    using Strings for uint256;
    using StringUtils for string;

    string private name;
    string private symbol;

    // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    // which can be also obtained as `IERC721Receiver(0).onERC721Received.selector`
    bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;
    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;
    bytes4 private constant _INTERFACE_ID_ERC721_METADATA = 0x5b5e139f;
    bytes4 private constant _INTERFACE_ID_ERC721_ENUMERABLE = 0x780e9d63;


    mapping (string => bool) boosters;
    mapping (uint256 => string) private tokenBoosterCategory;

   
    mapping (address => EnumerableSet.BoosterSet) private _holderTokens;     // Mapping from holder address to their (enumerable) set of owned tokens & categories    
    EnumerableMap.UintToAddressMap private _tokenOwners;                    // Enumerable mapping from token ids to their owners & categories


    constructor(string memory name_, string memory symbol_) public  {
        name = name_;
        symbol = symbol_;

        _registerInterface(_INTERFACE_ID_ERC721);
        _registerInterface(_INTERFACE_ID_ERC721_METADATA);
        _registerInterface(_INTERFACE_ID_ERC721_ENUMERABLE);
    }


    // #################################
    // ######## ADMIN FUNCTIONS ########
    // #################################

    function createNewSIGHBooster(address _owner, string memory _type,  string memory tokenURI ) public onlyOwner returns (uint256) {
        require(boosters[_type],'Not a valid Booster Type');

        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(_owner,newItemId);

        _setTokenURI(newItemId,tokenURI);
        _setType(newItemId,_type);

        return newItemId;
    }

    function addNewBoosterType(string memory _type) public onlyOwner returns (bool) {
        require(!boosters[_type],"Booster Type already exists");
        boosters[_type] = true;
        return true;
    }

    function updateTokenURI(uint256 tokenId, string memory tokenURI )  public onlyOwner returns (bool) {
        require(_exists(tokenId), "ERC721: URI set of nonexistent token");
        _setTokenURI(tokenId,tokenURI);

     }


    function _setType(uint256 tokenId, string memory _type) internal virtual {
        require(_exists(tokenId), "ERC721: URI set of nonexistent token");
        tokenBoosterCategory[tokenId] = _type;
    }



    // ###########################################
    // ######## STANDARD ERC721 FUNCTIONS ########
    // ###########################################





    function balanceOf(address owner) external view returns (uint256 balance) {
        require(owner != address(0), "ERC721: balance query for the zero address");
        return _holderTokens[owner].length();
    }



    function ownerOf(uint256 tokenId) external view returns (address owner);


    function safeTransferFrom(address from, address to, uint256 tokenId) external;


    function transferFrom(address from, address to, uint256 tokenId) external;


    function approve(address to, uint256 tokenId) external;


    function getApproved(uint256 tokenId) external view returns (address operator);


    function setApprovalForAll(address operator, bool _approved) external;


    function isApprovedForAll(address owner, address operator) external view returns (bool);


    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;


    // #############################################################
    // ######## FUNCTIONS SPECIFIC TO SIGH FINANCE BOOSTERS ########
    // #############################################################

    // Returns the number of Boosters of a particular category owned by the owner address
    function boostersOwned(address owner, string memory _category) external view returns (bool) {
        require(owner != address(0), "ERC721: balance query for the zero address");
        require(boosters[_category], "Not a valid Booster Type");

        EnumerableSet.BoosterSet memory boostersOwned = _holderTokens[owner];

        if (boostersOwned.length() == 0) {
            return 0;
        }

        uint ans;

        for (uint32 i=1; i <= boostersOwned.length(); i++ ) {
            tupple memory _booster = boostersOwned.at(i);
            if ( _booster._type.equal(_category) ) {
                ans = ans + 1;
            }
        }

        return ans ;
    }



}