// SPDX-License-Identifier: MIT

pragma solidity ^0.6.0;

/**
 * @dev Library for managing https://en.wikipedia.org/wiki/Set_(abstract_data_type)[sets] of primitive types.
 * @author modified by _astromartian to meet the requirements of SIGH Finance's Booster NFTs
 * Sets have the following properties:
 * - Elements are added, removed, and checked for existence in constant time (O(1)).
 * - Elements are enumerated in O(n). No guarantees are made on the ordering.
 *
 * ```
 * contract Example {
 *     
 *     using EnumerableSet for EnumerableSet.AddressSet;        // Add the library methods
 *     EnumerableSet.BoosterSet private mySet;                  // Declare a set state variable
 * }
 * ```
 *
 * As of v3.0.0, only sets of type `address` (`AddressSet`) and `uint256` (`UintSet`) are supported.
 */
library EnumerableSet {
    // To implement this library for multiple types with as little code
    // repetition as possible, we write it in terms of a generic Set type with bytes32 values.
    // The Set implementation uses private functions, and user-facing
    // implementations (such as AddressSet) are just wrappers around the underlying Set.
    // This means that we can only create new EnumerableSets for types that fit in bytes32.

    struct tupple {
        uint tokenId;
        string _type;
    }

    struct Set {
        tupple[] _values;   // Tupple containing tokenId and category

        // Position of the value in the `values` array, plus 1 because index 0 means a value is not in the set.
        // Mapping from tokenId to index
        mapping (uint256 => uint256) _indexes;
    }

    /**
     * @dev Add a value to a set. O(1).
     * Returns true if the value was added to the set, that is if it was not already present.
     */
    function _add(Set storage set, tupple newNFT) private returns (bool) {
        if (!_contains(set, newNFT)) {
            set._values.push(newNFT);             
            set._indexes[newNFT.tokenId] = set._values.length;  // The value is stored at length-1, but we add 1 to all indexes and use 0 as a sentinel value
            return true;
        } 
        else {
            return false;
        }
    }

    /**
     * @dev Removes a value from a set. O(1).
     * Returns true if the value was removed from the set, that is if it was present.
     */
    function _remove(Set storage set, tupple _NFT) private returns (bool) {        
        uint256 valueIndex = set._indexes[_NFT.tokenId];  // We read and store the value's index to prevent multiple reads from the same storage slot

        if (valueIndex != 0) { // Equivalent to contains(set, value)
            // To delete an element from the _values array in O(1), we swap the element to delete with the last one in
            // the array, and then remove the last element (sometimes called as 'swap and pop').
            // This modifies the order of the array, as noted in {at}.

            uint256 toDeleteIndex = valueIndex - 1;
            uint256 lastIndex = set._values.length - 1;

            // When the value to delete is the last one, the swap operation is unnecessary. However, since this occurs
            // so rarely, we still do the swap anyway to avoid the gas cost of adding an 'if' statement.

            tupple memory lastvalue = set._values[lastIndex];
            
            set._values[toDeleteIndex] = lastvalue;                 //   Move the last value to the index where the value to delete is
            set._indexes[lastvalue.tokenId] = toDeleteIndex + 1;    //   Update the index for the moved value. All indexes are 1 - based

            set._values.pop();              // Delete the slot where the moved value was stored
            delete set._indexes[_NFT.tokenId];     // Delete the index for the deleted slot

            return true;
        } 
        else {
            return false;
        }
    }

    /**
     * @dev Returns true if the value is in the set. O(1). Checks performed based on the tokenID 
     */
    function _contains(Set storage set, tupple _NFT) private view returns (bool) {
        return set._indexes[_NFT.tokenId] != 0;
    }

    /**
     * @dev Returns the number of values on the set. O(1).
     */
    function _length(Set storage set) private view returns (uint256) {
        return set._values.length;
    }

   /**
    * @dev Returns the value stored at position `index` in the set. O(1).
    * Note that there are no guarantees on the ordering of values inside the array, and it may change when more values are added or removed.
    * Requirements:
    * - `index` must be strictly less than {length}.
    */
    function _at(Set storage set, uint256 index) private view returns (tupple) {
        require(set._values.length > index, "EnumerableSet: index out of bounds");
        return set._values[index];
    }


    // ###########################################
    // ######## BoosterSet FUNCTIONS ########
    // ###########################################

    // BoosterSet
    struct BoosterSet {
        Set _inner;
    }

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function add(BoosterSet storage set, tupple _newNFT) internal returns (bool) {
        return _add(set._inner, _newNFT );
    }

    /**
     * @dev Removes a value from a set. O(1).
     *
     * Returns true if the value was removed from the set, that is if it was
     * present.
     */
    function remove(BoosterSet storage set, tupple _NFT) internal returns (bool) {
        return _remove(set._inner, _NFT );
    }

    /**
     * @dev Returns true if the value is in the set. O(1).
     */
    function contains(BoosterSet storage set, tupple _NFT) internal view returns (bool) {
        return _contains(set._inner, _NFT );
    }

    /**
     * @dev Returns the number of values on the set. O(1).
     */
    function length(BoosterSet storage set) internal view returns (uint256) {
        return _length(set._inner);
    }

   /**
    * @dev Returns the value stored at position `index` in the set. O(1).
    * Note that there are no guarantees on the ordering of values inside the array, and it may change when more values are added or removed.
    *
    * Requirements:
    * - `index` must be strictly less than {length}.
    */
    function at(BoosterSet storage set, uint256 index) internal view returns (tupple) {
        return _at(set._inner, index) ;
    }
}
