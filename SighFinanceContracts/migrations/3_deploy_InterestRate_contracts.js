
//     constructor(uint baseRatePerYear, uint multiplierPerYear, uint jumpMultiplierPerYear, uint kink_) public {
const JumpRateModel_ = artifacts.require("JumpRateModel");

// constructor(uint baseRatePerYear, uint multiplierPerYear, uint jumpMultiplierPerYear, uint kink_, address owner_) public {
const JumpRateModelV2_ = artifacts.require("JumpRateModelV2");

//     constructor(uint baseRatePerYear, uint multiplierPerYear) public {
const WhitePaperInterestRateModel_ = artifacts.require("WhitePaperInterestRateModel");


module.exports = function(deployer) {

    const admin = '0xc388cca9fd88c4cf69d7941ee8e6a4a2d43fd3c1';

    deployer.deploy(JumpRateModel_,34354,35354,534543,34);

    deployer.deploy(JumpRateModelV2_,34354,35354,534543,34,admin);

    deployer.deploy(WhitePaperInterestRateModel_,34354,35354);
    

};
