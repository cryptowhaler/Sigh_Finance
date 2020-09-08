//        constructor (address _sighTroller) public {
    const SIGH_ = artifacts.require("SIGH");

module.exports = function(deployer) {

    const sightrollerAddress = '';
    deployer.deploy(SIGH_,sightrollerAddress);
};
