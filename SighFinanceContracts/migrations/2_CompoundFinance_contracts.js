const JumpRateModelV2_ = artifacts.require("JumpRateModelV2");          // constructor(uint baseRatePerYear, uint multiplierPerYear, uint jumpMultiplierPerYear, uint kink_)
const WhitePaperInterestRateModel_ = artifacts.require("WhitePaperInterestRateModel");          //     constructor(uint baseRatePerYear, uint multiplierPerYear) 
const SimplePriceOracle_ = artifacts.require("SimplePriceOracle");            //   constructor() 

const GSigh_  = artifacts.require("GSigh");                                         // constructor(address account)  *address of the account to which the amount is transferred*
const Timelock_ = artifacts.require("Timelock");            // constructor(address admin_, uint delay_) 
const GovernorAlpha_  = artifacts.require("GovernorAlpha");             //   constructor(EIP20Interface token_) 

const GSighReservoir_ = artifacts.require("GSighReservoir");

const SighLens_ = artifacts.require("SighLens");

const Sightroller_ = artifacts.require("Sightroller");          //       constructor() 
const Unitroller_ = artifacts.require("Unitroller");           //     constructor() 
const SIGH_ = artifacts.require("SIGH");            //        constructor () 
const SighReservoir_ = artifacts.require("SighReservoir");            //   constructor(EIP20Interface token_) 

const CErc20Delegate_ = artifacts.require("CErc20Delegate");            //   The implementation cERC20 Contract
const CErc20Delegator_ = artifacts.require("CErc20Delegator");            //   The storage cERC20 Contract
const CErc20Immutable_ = artifacts.require("CErc20Immutable");            //   The storage cERC20 Contract

const CEther_ = artifacts.require("CEther");            //   The storage + implementation cERC20 Contract
const Maximillion_ = artifacts.require("Maximillion");            //   The storage + implementation cERC20 Contract



module.exports = function(deployer) {
  deployer.then(async () => {

    const baseRatePerYear = 4204800;
    const multiplierPerYear = 1156320000;
    const jumpMultiplierPerYear = 2256320000;
    const kink_ = 2256320000;
    const admin = '0xc388cca9fd88c4cf69d7941ee8e6a4a2d43fd3c1';
    const delay = 2*6501;
    const guardian = '0xc388cca9fd88c4cf69d7941ee8e6a4a2d43fd3c1';

    // const underlying_erc20_token_address_1 = '';
    const initialExchangeRateMantissa_erc20_token_1 = 10000000; 



    // ******** INTEREST RATE MODELS  & PRICE ORACLE **************
    // await deployer.deploy(JumpRateModelV2_,    baseRatePerYear,multiplierPerYear,jumpMultiplierPerYear,kink_);  
    // await deployer.deploy(WhitePaperInterestRateModel_,     baseRatePerYear,multiplierPerYear);

    // ******** SIGHTROLLER & UNITROLLER CONTRACTS ( THE MAIN LOGIC HANDLING CONTRACTS ON A PLATFORM SPECIFIC LEVEL )  **************
    // await deployer.deploy(Unitroller_);           // Deployer address is the Admin

    // // ******** SIGH & SIGH RESERVOIR CONTRACTS  **************
    // await deployer.deploy(SIGH_);          // Deployer address is the Admin *Initial Supply is assigned to this address* 
    // let sigh = await SIGH_.deployed();                                            // gets the deployed gsigh contract
    // console.log(sigh.address);

    // await deployer.deploy(SighReservoir_, sigh.address);  // Reservoir contract for the SIGH Token

    // // ******** GOVERNANCE RELATED CONTRACTS (GSIGH , GOVERNANCE ALPHA , TIMELOCK, GSIGH RESERVOIR) **************
    // await deployer.deploy(GSigh_);                                              // admin is the user / contract to which all the amount is transferred
    // let gsigh = await  GSigh_.deployed();                                            // gets the deployed gsigh contract

    // await deployer.deploy(GSighReservoir_, gsigh.address);  // Reservoir contract for the Governance Token

    // //  ******************** GETTING ADDRESSES OF THE DEPLOYED CONTRACTS **************************
    // //  ******************** GETTING ADDRESSES OF THE DEPLOYED CONTRACTS **************************
    // //  ******************** GETTING ADDRESSES OF THE DEPLOYED CONTRACTS **************************

    // let JumpRateModelV2___ = await JumpRateModelV2_.deployed();                                           
    // console.log( 'JumpRateModelV2___ ' +  JumpRateModelV2___.address);

    // let WhitePaperInterestRateModel___ = await WhitePaperInterestRateModel_.deployed();                                           
    // console.log( 'WhitePaperInterestRateModel___ ' +  WhitePaperInterestRateModel___.address);

    // let Unitroller_____ = await Unitroller_.deployed();                                           
    // console.log( 'Unitroller____ ' +  Unitroller_____.address);

    // let SIGH____ = await SIGH_.deployed();                                           
    // console.log( 'SIGH____ ' +  SIGH____.address);

    // let SighReservoir_____ = await SighReservoir_.deployed();                                           
    // console.log( 'SighReservoir_ ' +  SighReservoir_____.address);

    // let GSigh___ = await GSigh_.deployed();                                           
    // console.log( 'GSigh___ ' +  GSigh___.address);

    // let GSighReservoir____ = await GSighReservoir_.deployed();                                           
    // console.log( 'GSighReservoir____ ' +  GSighReservoir____.address);

  })

  };


