const Sightroller_ = artifacts.require("Sightroller");          //       constructor() 
// const Unitroller_ = artifacts.require("Unitroller");           //     constructor() 

// const BAT = artifacts.require("BAT");
// const BUSD = artifacts.require("BUSD");
// const Comp = artifacts.require("Comp");
// const LINK = artifacts.require("LINK");
// const SNX = artifacts.require("SNX");
// const UNI = artifacts.require("UNI");
// const USDC = artifacts.require("USDC");
// const USDT = artifacts.require("USDT");
// const WBTC = artifacts.require("WBTC");
// const YFI = artifacts.require("YFI");
// const ZRX = artifacts.require("ZRX");




module.exports = function(deployer) {
  deployer.then(async () => {

    // await deployer.deploy(BAT);        
    // await deployer.deploy(BUSD);        
    // await deployer.deploy(Comp);        
    // await deployer.deploy(LINK);        
    // await deployer.deploy(SNX);        
    // await deployer.deploy(UNI);        
    // await deployer.deploy(USDC);        
    // await deployer.deploy(USDT);        
    // await deployer.deploy(WBTC);        
    // await deployer.deploy(YFI);        
    // await deployer.deploy(ZRX);        

    // let BAT___ = await BAT.deployed();                                           
    // console.log( 'BAT ' +  BAT___.address);

    // let BUSD___ = await BUSD.deployed();                                           
    // console.log( 'BUSD ' +  BUSD___.address);

    // let Comp___ = await Comp.deployed();                                           
    // console.log( 'Comp___ ' +  Comp___.address);

    // let LINK___ = await LINK.deployed();                                           
    // console.log( 'LINK ' +  LINK___.address);

    // let SNX__ = await SNX.deployed();                                           
    // console.log( 'SNX__ ' +  SNX__.address);

    // let UNI___ = await UNI.deployed();                                           
    // console.log( 'UNI___ ' +  UNI___.address);

    // let USDC__ = await USDC.deployed();                                           
    // console.log( 'USDC__ ' +  USDC__.address);

    // let USDT__ = await USDT.deployed();                                           
    // console.log( 'USDT ' +  USDT__.address);

    // let WBTC__ = await WBTC.deployed();                                           
    // console.log( 'WBTC__ ' +  WBTC__.address);

    // let YFI__ = await YFI.deployed();                                           
    // console.log( 'YFI__ ' +  YFI__.address);

    // let ZRX__ = await ZRX.deployed();                                           
    // console.log( 'ZRX__ ' +  ZRX__.address);



    // // ******** SIGHTROLLER & UNITROLLER CONTRACTS ( THE MAIN LOGIC HANDLING CONTRACTS ON A PLATFORM SPECIFIC LEVEL )  **************
    await deployer.deploy(Sightroller_);          // Deployer address is the Admin

    let Sightroller_____ = await Sightroller_.deployed();                                           
    console.log( 'Sightroller_____ ' +  Sightroller_____.address);

    // await deployer.deploy(Unitroller_);           // Deployer address is the Admin

    // let Unitroller_____ = await Unitroller_.deployed();                                           
    // console.log( 'Unitroller_____ ' +  Unitroller_____.address);

  })

  };


