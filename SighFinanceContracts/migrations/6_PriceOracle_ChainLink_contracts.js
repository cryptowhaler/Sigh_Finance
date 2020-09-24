const SimplePriceOracle_ = artifacts.require("SimplePriceOracle");            //   The implementation cERC20 Contract

module.exports = function(deployer) {
  deployer.then(async () => {

    await deployer.deploy(SimplePriceOracle_); // the cERC20 implementation contract
    SimplePriceOracle = SimplePriceOracle_.deployed();
    console.log(SimplePriceOracle_.address);
  })

  };


