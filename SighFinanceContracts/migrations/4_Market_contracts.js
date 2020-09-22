const CErc20Delegate_ = artifacts.require("CErc20Delegate");            //   The implementation cERC20 Contract
const CErc20Delegator_ = artifacts.require("CErc20Delegator");            //   The storage cERC20 Contract
const CErc20Immutable_ = artifacts.require("CErc20Immutable");            //   The storage cERC20 Contract

// const CEther_ = artifacts.require("CEther");            //   The storage + implementation cERC20 Contract
// const Maximillion_ = artifacts.require("Maximillion");            //   The storage + implementation cERC20 Contract



module.exports = function(deployer) {
  deployer.then(async () => {

    // ******** ERC20 MARKET CONTRACTS ( Based on Delegate & Delegator Schema) **************
    await deployer.deploy(CErc20Delegate_); // the cERC20 implementation contract

    let unitroller = '0x0b1834DB6C4B58Ea28f7a299a78BE1D23d20C92D';
    let whitePaperInterestRateModel = '0x4eC0B0b77163b1aC1A273BC104D33F16A65E926F';
    let cERC20_implementation = await CErc20Delegate_.deployed();
    console.log(cERC20_implementation.address);

    let polyTokenAddress = '0xB06d72a24df50D4E2cAC133B320c5E7DE3ef94cB';
    let initialExchangeRateMantissa = 10000000;
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


    await deployer.deploy(CErc20Delegator_,     polyTokenAddress, unitroller, whitePaperInterestRateModel, initialExchangeRateMantissa , 'cPoly', 'CPoly', 18, admin, cERC20_implementation.address ); // the cERC20 implementation contract

    // ******** ERC20 MARKET CONTRACTS ( Immutabile design) **************
    // await deployer.deploy(CErc20Immutable_,     underlying_erc20_token_address_1, sightroller.address, interestRateModel.address, initialExchangeRateMantissa_erc20_token_1, 'cTesting1_Immutable', 'cTest_I', 18, admin   ); // the cERC20 implementation + storage contract

    // ******** cETHER MARKET CONTRACTS **************
    // await deployer.deploy(CEther_,        sightroller.address, interestRateModel.address, initialExchangeRateMantissa_erc20_token_1, 'cETH_Testing', 'cETH_I', 18, admin  ); // the cETHER implementation + storage contract

    // let cEther = await CEther_.deployed();
    // await deployer.deploy(Maximillion_,   cEther.address); // it calls the borrowBalanceCurrent() function of cEther contract



    //  ******************** GETTING ADDRESSES OF THE DEPLOYED CONTRACTS **************************
    let CErc20Delegate_____ = await CErc20Delegate_.deployed();                                           
    console.log( 'CErc20Delegate_____ ' +  CErc20Delegate_____.address);

    let CErc20Delegator___ = await CErc20Delegator_.deployed();                                           
    console.log( 'CErc20Delegator___ ' +  CErc20Delegator___.address);

    // let CErc20Immutable_____ = await CErc20Immutable_.deployed();                                           
    // console.log( 'CErc20Immutable_____ ' +  CErc20Immutable_____.address);

    // let CEther____ = await CEther_.deployed();                                           
    // console.log( 'CEther____ ' +  CEther____.address);

    // let Maximillion_____ = await Maximillion_.deployed();                                           
    // console.log( 'Maximillion_ ' +  Maximillion_____.address);
  })

  };


