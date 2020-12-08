pragma solidity ^0.5.0;

/************
@title IFeeProvider interface
@notice Interface for the SIGH Finance's Lending Protocol fee provider.
*/

interface IFeeProvider {
    function calculateLoanOriginationFee(address _user, uint256 _amount) external view returns (uint256);
    function calculateDepositFee(address _user, uint256 _amount) external view returns (uint256);

    function getLoanOriginationFeePercentage() external view returns (uint256);
}
