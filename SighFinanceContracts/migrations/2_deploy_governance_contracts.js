const JumpRateModelV2_ = artifacts.require("JumpRateModelV2");          // constructor(uint baseRatePerYear, uint multiplierPerYear, uint jumpMultiplierPerYear, uint kink_)
const WhitePaperInterestRateModel_ = artifacts.require("WhitePaperInterestRateModel");          //     constructor(uint baseRatePerYear, uint multiplierPerYear) 

const GSigh_  = artifacts.require("GSigh");                                         // constructor(address account)  *address of the account to which the amount is transferred*
const Timelock_ = artifacts.require("Timelock");            // constructor(address admin_, uint delay_) 
const GovernorAlpha_  = artifacts.require("GovernorAlpha");             //   constructor(EIP20Interface token_) 

const GSighReservoir_ = artifacts.require("GSighReservoir");

const SighLens_ = artifacts.require("SighLens");

const Sightroller_ = artifacts.require("Sightroller");          //       constructor() 
const Unitroller_ = artifacts.require("Unitroller");           //     constructor() 
const SIGH_ = artifacts.require("SIGH");            //        constructor () 
const SighReservoir_ = artifacts.require("SighReservoir");            //   constructor(EIP20Interface token_) 



module.exports = function(deployer) {

    const baseRatePerYear = 4204800;
    const multiplierPerYear = 1156320000;
    const jumpMultiplierPerYear = 2256320000;
    const kink_ = 2256320000;
    const admin = '0xc388cca9fd88c4cf69d7941ee8e6a4a2d43fd3c1';
    const delay = 2*6501;
    const guardian = '0xc388cca9fd88c4cf69d7941ee8e6a4a2d43fd3c1';


    // ******** INTEREST RATE MODELS **************
    deployer.deploy(JumpRateModelV2_,    baseRatePerYear,multiplierPerYear,jumpMultiplierPerYear,kink_);  
    deployer.deploy(WhitePaperInterestRateModel_,     baseRatePerYear,multiplierPerYear);

    // ******** SIGHTROLLER & UNITROLLER CONTRACTS ( THE MAIN LOGIC HANDLING CONTRACTS ON A PLATFORM SPECIFIC LEVEL )  **************
    deployer.deploy(Sightroller_);          // Deployer address is the Admin
    deployer.deploy(Unitroller_);           // Deployer address is the Admin

    // ******** SIGH & SIGH RESERVOIR CONTRACTS  **************
    deployer.deploy(SIGH_);          // Deployer address is the Admin *Initial Supply is assigned to this address* 
    sigh = await SIGH_.deployed();                                            // gets the deployed gsigh contract

    deployer.deploy(SighReservoir_, sigh.address);  // Reservoir contract for the SIGH Token

    // ******** GOVERNANCE RELATED CONTRACTS (GSIGH , GOVERNANCE ALPHA , TIMELOCK, GSIGH RESERVOIR) **************
    deployer.deploy(GSigh_,admin);                                              // admin is the user / contract to which all the amount is transferred
    gsigh = await GSigh_.deployed();                                            // gets the deployed gsigh contract

    deployer.deploy(GSighReservoir_, gsigh.address);  // Reservoir contract for the Governance Token

    deployer.deploy(Timelock_,       guardian, delay);
    timelock = await Timelock_.deployed();                                       // gets the deployed timelock contract

    deployer.deploy(GovernorAlpha_,    timelock.address , gsigh.address , guardian);

    // ******** SIGHLENS CONTRACT (EACH FUNCTION IS A TRANSACTION TO EXTRACT DATA FROM THE PROTOCOL) **************
    deployer.deploy(SighLens_);








  };


