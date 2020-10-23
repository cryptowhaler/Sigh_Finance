pragma solidity ^0.5.16;

// import "../ProtocolContracts/IToken.sol";
import "../ProtocolContracts/interfaces/ITokenInterface.sol";


interface PriceOracle {

    /**
      * @notice Get the underlying price of a cToken asset
      * @param iToken The iToken to get the underlying price of
      * @return The underlying asset price mantissa (scaled by 1e18).
      *  Zero means the price is unavailable.
      */
    function getUnderlyingPrice(ITokenInterface iToken) external view returns (uint);

    function getUnderlyingPriceRefresh(ITokenInterface iToken) external returns (uint);
    
}
