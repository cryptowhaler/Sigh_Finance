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
    await deployer.deploy(JumpRateModelV2_,    baseRatePerYear,multiplierPerYear,jumpMultiplierPerYear,kink_);  
    await deployer.deploy(WhitePaperInterestRateModel_,     baseRatePerYear,multiplierPerYear);
    await deployer.deploy(SimplePriceOracle_);

    // ******** SIGHTROLLER & UNITROLLER CONTRACTS ( THE MAIN LOGIC HANDLING CONTRACTS ON A PLATFORM SPECIFIC LEVEL )  **************
    await deployer.deploy(Sightroller_);          // Deployer address is the Admin
    await deployer.deploy(Unitroller_);           // Deployer address is the Admin

    // ******** SIGH & SIGH RESERVOIR CONTRACTS  **************
    await deployer.deploy(SIGH_);          // Deployer address is the Admin *Initial Supply is assigned to this address* 
    let sigh = await SIGH_.deployed();                                            // gets the deployed gsigh contract
    console.log(sigh.address);

    await deployer.deploy(SighReservoir_, sigh.address);  // Reservoir contract for the SIGH Token

    // ******** GOVERNANCE RELATED CONTRACTS (GSIGH , GOVERNANCE ALPHA , TIMELOCK, GSIGH RESERVOIR) **************
    await deployer.deploy(GSigh_,admin);                                              // admin is the user / contract to which all the amount is transferred
    let gsigh = await  GSigh_.deployed();                                            // gets the deployed gsigh contract

    await deployer.deploy(GSighReservoir_, gsigh.address);  // Reservoir contract for the Governance Token

    await deployer.deploy(Timelock_,       guardian, delay);
    let timelock = await Timelock_.deployed();                                       // gets the deployed timelock contract

    await deployer.deploy(GovernorAlpha_,    timelock.address , gsigh.address , guardian);

    // ******** SIGHLENS CONTRACT (EACH FUNCTION IS A TRANSACTION TO EXTRACT DATA FROM THE PROTOCOL) **************
    await deployer.deploy(SighLens_);

    // ******** ERC20 MARKET CONTRACTS ( Based on Delegate & Delegator Schema) **************
    await deployer.deploy(CErc20Delegate_); // the cERC20 implementation contract

    let sightroller = await Sightroller_.deployed();
    let interestRateModel = await WhitePaperInterestRateModel_.deployed();
    let cERC20_implementation = await CErc20Delegate_.deployed();
    console.log(cERC20_implementation.address);

    let underlying_erc20_token_address_1 = sigh.address;

    await deployer.deploy(CErc20Delegator_,     underlying_erc20_token_address_1, sightroller.address, interestRateModel.address, initialExchangeRateMantissa_erc20_token_1, 'cTesting1_Flexi', 'cTest_F', 18, admin, cERC20_implementation.address ); // the cERC20 implementation contract

    // ******** ERC20 MARKET CONTRACTS ( Immutabile design) **************
    await deployer.deploy(CErc20Immutable_,     underlying_erc20_token_address_1, sightroller.address, interestRateModel.address, initialExchangeRateMantissa_erc20_token_1, 'cTesting1_Immutable', 'cTest_I', 18, admin   ); // the cERC20 implementation + storage contract

    // ******** cETHER MARKET CONTRACTS **************
    await deployer.deploy(CEther_,        sightroller.address, interestRateModel.address, initialExchangeRateMantissa_erc20_token_1, 'cETH_Testing', 'cETH_I', 18, admin  ); // the cETHER implementation + storage contract

    let cEther = await CEther_.deployed();
    await deployer.deploy(Maximillion_,   cEther.address); // it calls the borrowBalanceCurrent() function of cEther contract
    
  })

  };


