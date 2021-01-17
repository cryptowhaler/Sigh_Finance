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
    using EnumerableMap for EnumerableMap.UintToNFTMap;
    using Strings for uint256;
    using StringUtils for string;

    // Equals to `bytes4(keccak256("onERC721Received(address,address,uint256,bytes)"))`
    // which can be also obtained as `IERC721Receiver(0).onERC721Received.selector`
    bytes4 private constant _ERC721_RECEIVED = 0x150b7a02;
    bytes4 private constant _INTERFACE_ID_ERC721 = 0x80ac58cd;
    bytes4 private constant _INTERFACE_ID_ERC721_METADATA = 0x5b5e139f;
    bytes4 private constant _INTERFACE_ID_ERC721_ENUMERABLE = 0x780e9d63;

    string private name;
    string private symbol;
    mapping (uint256 => string) private _BoostURIs;

    mapping (string => bool) boosters;      // Different type of Boosters supported by 
    mapping (uint256 => string) private tokenBoosterCategory;
    
    mapping (address => mapping (address => bool)) private _operatorApprovals;    // Mapping from owner to operator approvals



   
    mapping (address => EnumerableSet.BoosterSet) private farmersWithBoosts;     // Mapping from holder address to their (enumerable) set of owned tokens & categories    
    EnumerableMap.UintToNFTMap private boostersData;                    // Enumerable mapping from token ids to their owners & categories


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

        _safeMint(_owner, newItemId, _type);
        _setBoostURI(newItemId,tokenURI);
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
        _setBoostURI(tokenId,tokenURI);

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
        return farmersWithBoosts[owner].length();
    }

    //  See {IERC721Enumerable-tokenOfOwnerByIndex}.
    function tokenOfOwnerByIndex(address owner, uint256 index) public view override returns (uint256) {
        return farmersWithBoosts[owner].at(index);
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

        EnumerableSet.BoosterSet memory boostersOwned = farmersWithBoosts[owner];

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










    // #####################################
    // ######## INTERNAL FUNCTIONS  ########
    // #####################################

    /**
     * @dev Same as {xref-ERC721-_safeMint-address-uint256-}[`_safeMint`], with an additional `data` parameter which is forwarded in {IERC721Receiver-onERC721Received} to contract recipients.
     */
    function _safeMint(address to, uint256 tokenId, string _typeOfBoost, bytes memory _data) internal {
        _mint(to, tokenId, _typeOfBoost);
        require(_checkOnERC721Received(address(0), to, tokenId, _data), "ERC721: transfer to non ERC721Receiver implementer");
    }


    /**
     * @dev Mints `tokenId` and transfers it to `to`.
     * WARNING: Usage of this method is discouraged, use {_safeMint} whenever possible
     */
    function _mint(address to, uint256 tokenId, string _typeOfBoost) internal  {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        ownedBooster newBooster = ownedBooster({ tokenId: tokenId, _type: _typeOfBoost });
        boosterInfo newBoosterInfo = boosterInfo({ owner: to, _type: _typeOfBoost });

        farmersWithBoosts[to].add(newBooster);
        boostersData.set(tokenId, newBoosterInfo);

        emit Transfer(address(0), to, tokenId);
    }

    /**
     * @dev Returns whether `tokenId` exists.
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return boostersData.contains(tokenId);
    }


    /**
     * @dev Sets `_tokenURI` as the tokenURI of `tokenId`.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     */
    function _setBoostURI(uint256 tokenId, string memory _tokenURI) internal  {
        require(_exists(tokenId), "URI set of nonexistent SIGH Boost");
        _BoostURIs[tokenId] = _tokenURI;
    }

    /**
     * @dev Internal function to invoke {IERC721Receiver-onERC721Received} on a target address.
     * The call is not executed if the target address is not a contract.
     *
     * @param from address representing the previous owner of the given token ID
     * @param to target address that will receive the tokens
     * @param tokenId uint256 ID of the token to be transferred
     * @param _data bytes optional data to send along with the call
     * @return bool whether the call correctly returned the expected magic value
     */
    function _checkOnERC721Received(address from, address to, uint256 tokenId, bytes memory _data) private returns (bool) {
        if (!to.isContract()) {
            return true;
        }
        bytes memory returndata = to.functionCall(abi.encodeWithSelector( IERC721Receiver(to).onERC721Received.selector, _msgSender(), from, tokenId, _data ), "ERC721: transfer to non ERC721Receiver implementer");
        bytes4 retval = abi.decode(returndata, (bytes4));
        return (retval == _ERC721_RECEIVED);
    }

    /**
     * @dev Hook that is called before any token transfer.
    */
    function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual { }
    










}