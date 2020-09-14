
// constructor(uint baseRatePerYear, uint multiplierPerYear, uint jumpMultiplierPerYear, uint kink_, address owner_) public {
const JumpRateModelV2_ = artifacts.require("JumpRateModelV2");

//     constructor(uint baseRatePerYear, uint multiplierPerYear) public {
const WhitePaperInterestRateModel_ = artifacts.require("WhitePaperInterestRateModel");


module.exports = function(deployer) {

    const baseRatePerYear = 4204800;
    const multiplierPerYear = 1156320000;
    const jumpMultiplierPerYear = 2256320000;
    const kink_ = 2256320000;
    const admin = '0xc388cca9fd88c4cf69d7941ee8e6a4a2d43fd3c1';

    deployer.deploy(JumpRateModelV2_,baseRatePerYear,multiplierPerYear,jumpMultiplierPerYear,kink_,admin);

    deployer.deploy(WhitePaperInterestRateModel_,baseRatePerYear,multiplierPerYear);
    

};
