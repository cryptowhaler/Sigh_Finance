pragma solidity ^0.5.16;
pragma experimental ABIEncoderV2;

import "../Tokens/CErc20.sol";
import "../Tokens/CToken.sol";
import "../openzeppelin/EIP20Interface.sol";
import "../Governance/GovernorAlpha.sol";
import "../Governance/GSigh.sol";
import "../PriceOracle.sol";

interface SighLensInterface {
    function markets(address) external view returns (bool, uint);
    function oracle() external view returns (PriceOracle);
    function getAccountLiquidity(address) external view returns (uint, uint, uint);
    function getAssetsIn(address) external view returns (CToken[] memory);
    function claimGSigh(address) external;
    function GSighAccrued(address) external view returns (uint);
}

contract SighLens {

    struct CTokenMetadata {
        address cToken;
        uint exchangeRateCurrent;
        uint supplyRatePerBlock;
        uint borrowRatePerBlock;
        uint reserveFactorMantissa;
        uint totalBorrows;
        uint totalReserves;
        uint totalSupply;
        uint totalCash;
        bool isListed;
        uint collateralFactorMantissa;
        address underlyingAssetAddress;
        uint cTokenDecimals;
        uint underlyingDecimals;
    }

    // return all the data for a cToken (Market)
    function cTokenMetadata(CToken cToken) public returns (CTokenMetadata memory) {
        uint exchangeRateCurrent = cToken.exchangeRateCurrent();
        SighLensInterface sightroller = SighLensInterface(address(cToken.sightroller()));
        (bool isListed, uint collateralFactorMantissa) = sightroller.markets(address(cToken));
        address underlyingAssetAddress;
        uint underlyingDecimals;


        // getting the address of the CToken
        if (compareStrings(cToken.symbol(), "cETH")) {
            underlyingAssetAddress = address(0);
            underlyingDecimals = 18;
        } 
        else {
            CErc20 cErc20 = CErc20(address(cToken));
            underlyingAssetAddress = cErc20.underlying();
            underlyingDecimals = EIP20Interface(cErc20.underlying()).decimals();
        }

        return CTokenMetadata({
            cToken: address(cToken),
            exchangeRateCurrent: exchangeRateCurrent,
            supplyRatePerBlock: cToken.supplyRatePerBlock(),
            borrowRatePerBlock: cToken.borrowRatePerBlock(),
            reserveFactorMantissa: cToken.reserveFactorMantissa(),
            totalBorrows: cToken.totalBorrows(),
            totalReserves: cToken.totalReserves(),
            totalSupply: cToken.totalSupply(),
            totalCash: cToken.getCash(),
            isListed: isListed,
            collateralFactorMantissa: collateralFactorMantissa,
            underlyingAssetAddress: underlyingAssetAddress,
            cTokenDecimals: cToken.decimals(),
            underlyingDecimals: underlyingDecimals
        });
    }

    // "Calldata" is a special data location that contains the function arguments, only available for external function call parameters).
    // "Calldata" is only valid for parameters of external contract functions and is required for this type of parameter. 
    // "Calldata" is a non-modifiable, non-persistent area where function arguments are stored, and behaves mostly like memory.
    // --> it reuturns a list of ctoken metadata for a list of cTokens 
    function cTokenMetadataAll(CToken[] calldata cTokens) external returns (CTokenMetadata[] memory) {
        uint cTokenCount = cTokens.length;
        CTokenMetadata[] memory res = new CTokenMetadata[](cTokenCount);
        for (uint i = 0; i < cTokenCount; i++) {
            res[i] = cTokenMetadata(cTokens[i]);
        }
        return res;
    }





    struct CTokenBalances {
        address cToken;
        uint balanceOf;
        uint borrowBalanceCurrent;
        uint balanceOfUnderlying;
        uint tokenBalance;
        uint tokenAllowance;
    }

    // returns balance information for a cToken for an account
    function cTokenBalances(CToken cToken, address payable account) public returns (CTokenBalances memory) {
        uint balanceOf = cToken.balanceOf(account);
        uint borrowBalanceCurrent = cToken.borrowBalanceCurrent(account);
        uint balanceOfUnderlying = cToken.balanceOfUnderlying(account);
        uint tokenBalance;
        uint tokenAllowance;

        if (compareStrings(cToken.symbol(), "cETH")) {
            tokenBalance = account.balance;
            tokenAllowance = account.balance;
        } 
        else {
            CErc20 cErc20 = CErc20(address(cToken));
            EIP20Interface underlying = EIP20Interface(cErc20.underlying());
            tokenBalance = underlying.balanceOf(account);
            tokenAllowance = underlying.allowance(account, address(cToken));
        }

        return CTokenBalances({
            cToken: address(cToken),
            balanceOf: balanceOf,
            borrowBalanceCurrent: borrowBalanceCurrent,
            balanceOfUnderlying: balanceOfUnderlying,
            tokenBalance: tokenBalance,
            tokenAllowance: tokenAllowance
        });
    }

    // "Calldata" is a special data location that contains the function arguments, only available for external function call parameters).
    // "Calldata" is only valid for parameters of external contract functions and is required for this type of parameter. 
    // "Calldata" is a non-modifiable, non-persistent area where function arguments are stored, and behaves mostly like memory.
    // --> returns balance information for a list of cToken markets for an account
    function cTokenBalancesAll(CToken[] calldata cTokens, address payable account) external returns (CTokenBalances[] memory) {
        uint cTokenCount = cTokens.length;
        CTokenBalances[] memory res = new CTokenBalances[](cTokenCount);
        for (uint i = 0; i < cTokenCount; i++) {
            res[i] = cTokenBalances(cTokens[i], account);
        }
        return res;
    }






    struct CTokenUnderlyingPrice {
        address cToken;
        uint underlyingPrice;
    }

    function cTokenUnderlyingPrice(CToken cToken) public view returns (CTokenUnderlyingPrice memory) {
        SighLensInterface sightroller = SighLensInterface(address(cToken.sightroller()));
        PriceOracle priceOracle = sightroller.oracle();

        return CTokenUnderlyingPrice({
            cToken: address(cToken),
            underlyingPrice: priceOracle.getUnderlyingPrice(cToken)
        });
    }

    function cTokenUnderlyingPriceAll(CToken[] calldata cTokens) external returns (CTokenUnderlyingPrice[] memory) {
        uint cTokenCount = cTokens.length;
        CTokenUnderlyingPrice[] memory res = new CTokenUnderlyingPrice[](cTokenCount);
        for (uint i = 0; i < cTokenCount; i++) {
            res[i] = cTokenUnderlyingPrice(cTokens[i]);
        }
        return res;
    }





    struct AccountLimits {
        CToken[] markets;
        uint liquidity;
        uint shortfall;
    }

    function getAccountLimits(SighLensInterface sightroller, address account) public view returns (AccountLimits memory) {
        (uint errorCode, uint liquidity, uint shortfall) = sightroller.getAccountLiquidity(account);
        require(errorCode == 0);

        return AccountLimits({
            markets: sightroller.getAssetsIn(account),
            liquidity: liquidity,
            shortfall: shortfall
        });
    }




    struct GovReceipt {
        uint proposalId;
        bool hasVoted;
        bool support;
        uint96 votes;
    }

    function getGovReceipts(GovernorAlpha governor, address voter, uint[] memory proposalIds) public view returns (GovReceipt[] memory) {
        uint proposalCount = proposalIds.length;
        GovReceipt[] memory res = new GovReceipt[](proposalCount);
        for (uint i = 0; i < proposalCount; i++) {
            GovernorAlpha.Receipt memory receipt = governor.getReceipt(proposalIds[i], voter);
            res[i] = GovReceipt({
                proposalId: proposalIds[i],
                hasVoted: receipt.hasVoted,
                support: receipt.support,
                votes: receipt.votes
            });
        }
        return res;
    }




    struct GovProposal {
        uint proposalId;
        address proposer;
        uint eta;
        address[] targets;
        uint[] values;
        string[] signatures;
        bytes[] calldatas;
        uint startBlock;
        uint endBlock;
        uint forVotes;
        uint againstVotes;
        bool canceled;
        bool executed;
    }

    function setProposal(GovProposal memory res, GovernorAlpha governor, uint proposalId) internal view {
        (
            ,
            address proposer,
            uint eta,
            uint startBlock,
            uint endBlock,
            uint forVotes,
            uint againstVotes,
            bool canceled,
            bool executed
        ) = governor.proposals(proposalId);
        res.proposalId = proposalId;
        res.proposer = proposer;
        res.eta = eta;
        res.startBlock = startBlock;
        res.endBlock = endBlock;
        res.forVotes = forVotes;
        res.againstVotes = againstVotes;
        res.canceled = canceled;
        res.executed = executed;
    }

    function getGovProposals(GovernorAlpha governor, uint[] calldata proposalIds) external view returns (GovProposal[] memory) {
        GovProposal[] memory res = new GovProposal[](proposalIds.length);
        for (uint i = 0; i < proposalIds.length; i++) {
            (
                address[] memory targets,
                uint[] memory values,
                string[] memory signatures,
                bytes[] memory calldatas
            ) = governor.getActions(proposalIds[i]);
            res[i] = GovProposal({
                proposalId: 0,
                proposer: address(0),
                eta: 0,
                targets: targets,
                values: values,
                signatures: signatures,
                calldatas: calldatas,
                startBlock: 0,
                endBlock: 0,
                forVotes: 0,
                againstVotes: 0,
                canceled: false,
                executed: false
            });
            setProposal(res[i], governor, proposalIds[i]);
        }
        return res;
    }





    struct GSighBalanceMetadata {
        uint balance;
        uint votes;
        address delegate;
    }

    function getGSighBalanceMetadata(GSigh gsigh, address account) external view returns (GSighBalanceMetadata memory) {
        return GSighBalanceMetadata({
            balance: gsigh.balanceOf(account),
            votes: uint256(gsigh.getCurrentVotes(account)),
            delegate: gsigh.delegates(account)
        });
    }

    struct GSighBalanceMetadataExt {
        uint balance;
        uint votes;
        address delegate;
        uint allocated;
    }

    function getGSighBalanceMetadataExt(GSigh gsigh, SighLensInterface sightroller, address account) external returns (GSighBalanceMetadataExt memory) {
        uint balance = gsigh.balanceOf(account);
        sightroller.claimGSigh(account);
        uint newBalance = gsigh.balanceOf(account);
        uint accrued = sightroller.GSighAccrued(account);
        uint total = add(accrued, newBalance, "sum GSigh total");
        uint allocated = sub(total, balance, "sub allocated");

        return GSighBalanceMetadataExt({
            balance: balance,
            votes: uint256(gsigh.getCurrentVotes(account)),
            delegate: gsigh.delegates(account),
            allocated: allocated
        });
    }





    struct GSighVotes {
        uint blockNumber;
        uint votes;
    }

    function getGSighVotes(GSigh gsigh, address account, uint32[] calldata blockNumbers) external view returns (GSighVotes[] memory) {
        GSighVotes[] memory res = new GSighVotes[](blockNumbers.length);
        for (uint i = 0; i < blockNumbers.length; i++) {
            res[i] = GSighVotes({
                blockNumber: uint256(blockNumbers[i]),
                votes: uint256(gsigh.getPriorVotes(account, blockNumbers[i]))
            });
        }
        return res;
    }

    function compareStrings(string memory a, string memory b) internal pure returns (bool) {
        return (keccak256(abi.encodePacked((a))) == keccak256(abi.encodePacked((b))));
    }

    function add(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
        uint c = a + b;
        require(c >= a, errorMessage);
        return c;
    }

    function sub(uint a, uint b, string memory errorMessage) internal pure returns (uint) {
        require(b <= a, errorMessage);
        uint c = a - b;
        return c;
    }
}
