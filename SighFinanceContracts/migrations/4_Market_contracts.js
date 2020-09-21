const CErc20Delegate_ = artifacts.require("CErc20Delegate");            //   The implementation cERC20 Contract
const CErc20Delegator_ = artifacts.require("CErc20Delegator");            //   The storage cERC20 Contract
const CErc20Immutable_ = artifacts.require("CErc20Immutable");            //   The storage cERC20 Contract

const CEther_ = artifacts.require("CEther");            //   The storage + implementation cERC20 Contract
const Maximillion_ = artifacts.require("Maximillion");            //   The storage + implementation cERC20 Contract



module.exports = function(deployer) {
  deployer.then(async () => {

    // ******** ERC20 MARKET CONTRACTS ( Based on Delegate & Delegator Schema) **************
    // await deployer.deploy(CErc20Delegate_); // the cERC20 implementation contract

    // let sightroller = await Sightroller_.deployed();
    // let interestRateModel = await WhitePaperInterestRateModel_.deployed();
    // let cERC20_implementation = await CErc20Delegate_.deployed();
    // console.log(cERC20_implementation.address);

    // let underlying_erc20_token_address_1 = sigh.address;

    // await deployer.deploy(CErc20Delegator_,     underlying_erc20_token_address_1, sightroller.address, interestRateModel.address, initialExchangeRateMantissa_erc20_token_1, 'cTesting1_Flexi', 'cTest_F', 18, admin, cERC20_implementation.address ); // the cERC20 implementation contract

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


