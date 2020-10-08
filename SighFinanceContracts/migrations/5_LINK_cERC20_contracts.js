const CErc20Delegate_ = artifacts.require("CErc20Delegate");            //   The implementation cERC20 Contract
const CErc20Delegator_ = artifacts.require("CErc20Delegator");            //   The storage cERC20 Contract
const CErc20Immutable_ = artifacts.require("CErc20Immutable");            //   The storage cERC20 Contract
const BigNumber = require('bignumber.js');

// const CEther_ = artifacts.require("CEther");            //   The storage + implementation cERC20 Contract
// const Maximillion_ = artifacts.require("Maximillion");            //   The storage + implementation cERC20 Contract



module.exports = function(deployer) {
  deployer.then(async () => {

    // ******** ERC20 MARKET CONTRACTS ( Based on Delegate & Delegator Schema) **************
    // await deployer.deploy(CErc20Delegate_); // the cERC20 implementation contract

    let unitroller = '0xD1541249De91AddfDAC9125d44c67b418E5b31F3';
    let whitePaperInterestRateModel = '0x4eC0B0b77163b1aC1A273BC104D33F16A65E926F';
    let cERC20_implementation = '0x2AC4a472C46dac081ac7918F97CB18ada9edD166'; //await CErc20Delegate_.deployed();
    console.log(cERC20_implementation.address);

    // let Link_TokenAddress = '0xa36085f69e2889c224210f603d836748e7dc0088';
    let initialExchangeRateMantissa = new BigNumber( 1000000000000000000 );
    let admin = '0xf5376e847EFa1Ea889bfCb03706F414daDE0E82c';

  //   constructor(address underlying_,
  //     SightrollerInterface sightroller_,
  //     InterestRateModel interestRateModel_,
  //     uint initialExchangeRateMantissa_,
  //     string memory name_,
  //     string memory symbol_,
  //     uint8 decimals_,
  //     address payable admin_,
  //     address implementation_
  //  )


    // await deployer.deploy(CErc20Delegator_,     Link_TokenAddress, unitroller, whitePaperInterestRateModel, initialExchangeRateMantissa , 'S-LINK', 'S-LINK', 18, admin, cERC20_implementation.address ); // the cERC20 implementation contract

    // let BUSD_TokenAddress = '0xB92E37F0Ca3EcdD20fBc1549C40eE39b108f112a';
    // await deployer.deploy(CErc20Delegator_,     BUSD_TokenAddress, unitroller, whitePaperInterestRateModel, initialExchangeRateMantissa , 'S-BUSD', 'S-BUSD', 18, admin, cERC20_implementation.address ); // the cERC20 implementation contract

    // let BAT_TokenAddress = '0x3bE2e81bE9C43dC8f14a5E74d7461775B16915B7';
    // await deployer.deploy(CErc20Delegator_,     BAT_TokenAddress, unitroller, whitePaperInterestRateModel, initialExchangeRateMantissa , 'S-BAT', 'S-BAT', 18, admin, cERC20_implementation ); // the cERC20 implementation contract

    // let COMP_TokenAddress = '0xb2243deaab8361A52Fe224Ec2165543BFAeCAE52';
    // await deployer.deploy(CErc20Delegator_,     COMP_TokenAddress, unitroller, whitePaperInterestRateModel, initialExchangeRateMantissa , 'S-COMP', 'S-COMP', 18, admin, cERC20_implementation ); // the cERC20 implementation contract

    // let Link_TokenAddress = '0x31b27D63Af32E89A141521Fbc31c317dafA90437';
    // await deployer.deploy(CErc20Delegator_,     Link_TokenAddress, unitroller, whitePaperInterestRateModel, initialExchangeRateMantissa , 'S-LINK-01', 'S-LINK-01', 18, admin, cERC20_implementation ); // the cERC20 implementation contract

    // let SNX_TokenAddress = '0xd8d3572c33d73cFb222ca25995dB3bcdf61608fD';
    // await deployer.deploy(CErc20Delegator_,     SNX_TokenAddress, unitroller, whitePaperInterestRateModel, initialExchangeRateMantissa , 'S-SNX', 'S-SNX', 18, admin, cERC20_implementation ); // the cERC20 implementation contract

    // let UNI_TokenAddress = '0x7B862B2a10fc4BA8431DdE09cf567a38bf34E020';
    // await deployer.deploy(CErc20Delegator_,     UNI_TokenAddress, unitroller, whitePaperInterestRateModel, initialExchangeRateMantissa , 'S-UNI', 'S-UNI', 18, admin, cERC20_implementation ); // the cERC20 implementation contract

    // let WBTC_TokenAddress = '0xFf539FE2A238906267de540936944F04E068Ee22';
    // await deployer.deploy(CErc20Delegator_,     WBTC_TokenAddress, unitroller, whitePaperInterestRateModel, initialExchangeRateMantissa , 'S-WBTC', 'S-WBTC', 18, admin, cERC20_implementation ); // the cERC20 implementation contract

    // let YFI_TokenAddress = '0x0af1F7bAad88FDF3e22528951BB4dC7E24b2cbb5';
    // await deployer.deploy(CErc20Delegator_,     YFI_TokenAddress, unitroller, whitePaperInterestRateModel, initialExchangeRateMantissa , 'S-YFI', 'S-YFI', 18, admin, cERC20_implementation ); // the cERC20 implementation contract

    // let ZRX_TokenAddress = '0x526BfcddF3698cFEf7bE0B95E69603FE571d1c10';
    // await deployer.deploy(CErc20Delegator_,     ZRX_TokenAddress, unitroller, whitePaperInterestRateModel, initialExchangeRateMantissa , 'S-ZRX', 'S-ZRX', 18, admin, cERC20_implementation ); // the cERC20 implementation contract


    // ******** ERC20 MARKET CONTRACTS ( Immutabile design) **************
    // await deployer.deploy(CErc20Immutable_,     underlying_erc20_token_address_1, sightroller.address, interestRateModel.address, initialExchangeRateMantissa_erc20_token_1, 'cTesting1_Immutable', 'cTest_I', 18, admin   ); // the cERC20 implementation + storage contract

    // ******** cETHER MARKET CONTRACTS **************
    // await deployer.deploy(CEther_,        sightroller.address, interestRateModel.address, initialExchangeRateMantissa_erc20_token_1, 'cETH_Testing', 'cETH_I', 18, admin  ); // the cETHER implementation + storage contract

    // let cEther = await CEther_.deployed();
    // await deployer.deploy(Maximillion_,   cEther.address); // it calls the borrowBalanceCurrent() function of cEther contract



    //  ******************** GETTING ADDRESSES OF THE DEPLOYED CONTRACTS **************************
    // let CErc20Delegate_____ = await CErc20Delegate_.deployed();                                           
    // console.log( 'CErc20Delegate_____ ' +  CErc20Delegate_____.address);

    // let CErc20Delegator___ = await CErc20Delegator_.deployed();                                           
    // console.log( 'CErc20Delegator___ ' +  CErc20Delegator___.address);

    // let CErc20Immutable_____ = await CErc20Immutable_.deployed();                                           
    // console.log( 'CErc20Immutable_____ ' +  CErc20Immutable_____.address);

    // let CEther____ = await CEther_.deployed();                                           
    // console.log( 'CEther____ ' +  CEther____.address);

    // let Maximillion_____ = await Maximillion_.deployed();                                           
    // console.log( 'Maximillion_ ' +  Maximillion_____.address);
  })

  };


