pragma solidity ^0.5.16;

import "../../contracts/InterestRateModels/InterestRateModel.sol";

/**
  * @title An Interest Rate Model for tests that can be instructed to return a failure instead of doing a calculation
  * @author Compound
  */
contract InterestRateModelHarness is InterestRateModel {
    uint public constant opaqueBorrowFailureCode = 20;
    bool public failBorrowRate;
    uint public borrowRate;

    constructor(uint borrowRate_) public {
        borrowRate = borrowRate_;
    }

    function setFailBorrowRate(bool failBorrowRate_) public {
        failBorrowRate = failBorrowRate_;
    }

    function setBorrowRate(uint borrowRate_) public {
        borrowRate = borrowRate_;
    }

    function getBorrowRate(uint _cash, uint _borrows, uint_instruments) public view returns (uint) {
        _cash;     // unused
        _borrows;  // unused
       _instruments; // unused
        require(!failBorrowRate, "INTEREST_RATE_MODEL_ERROR");
        return borrowRate;
    }

    function getSupplyRate(uint _cash, uint _borrows, uint_instruments, uint _reserveFactor) external view returns (uint) {
        _cash;     // unused
        _borrows;  // unused
       _instruments; // unused
        return borrowRate * (1 - _reserveFactor);
    }
}