// constructor(address admin_, uint delay_) public {
    const Timelock_ = artifacts.require("Timelock");
// constructor(address account) public { *address of the account to which the amount is transferred*
const GSigh_  = artifacts.require("GSigh");
// constructor(address timelock_, address gSigh_, address guardian_) 
const GovernorAlpha_  = artifacts.require("GovernorAlpha");

module.exports = function(deployer) {
    const admin = '0xc388cca9fd88c4cf69d7941ee8e6a4a2d43fd3c1';
    const delay = 2*6501;

    // DEPLOYS TIMELOCK CONTRACT - WORKING
    // deployer.deploy(Timelock_,admin,delay);
    // timelock = await Timelock_.deployed(); // gets the deployed timelock contract

    // deployer.deploy(GSigh_,admin);
    // gsigh = await GSigh_.deployed(); // gets the deployed gsigh contract
    
    
    // deployer.deploy(GovernorAlpha_,timelock.address ,gsigh.address ,admin);
     

    // deployer.deploy(GSigh_,admin);  // DEPLOYS TIMELOCK CONTRACT - WORKING
    // web3.utils.fromWei()
    // web3.utils.toWei()

  };


