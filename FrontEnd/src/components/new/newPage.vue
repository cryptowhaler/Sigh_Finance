<template src="./template.html"></template>

<script>
import VegaProtocolService from '@/services/VegaProtocolService';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';
import {mapState,mapActions,} from 'vuex';

export default {
  name: 'FOK-Limit-Order',
  data() {
    return {

      // InterestRateVariables
        baseRatePerYear: undefined,
        multiplierPerYear: undefined,
        jumpMultiplierPerYear: undefined,
        kink_: undefined,
        cash: undefined,
        borrows: undefined,
        reserves: undefined,
        reserveMantissa: undefined,

        // ReservoirVariables
        dripRate: undefined,
        targetAddress: undefined,

        // SIGH Token Variables
        recepient: undefined,
        amount: undefined,
        spender: undefined,
        sender: undefined,
        addedValue: undefined,
        subtractedValue: undefined,
        newReservoir: undefined,

        // SIGHTROLLER Variables
        account: undefined,
        token: undefined,
        markets: [],
        market: undefined,
        minter: undefined,
        mintAmount: undefined,
        amount: undefined,
        actualMintAmount: undefined,
        mintTokens: undefined,
        redeemer: undefined,
        redeemTokens: undefined,
        actualRedeemAmount: undefined,
        borrower: undefined,
        borrowAmount: undefined,
        payer: undefined,
        repayAmount: undefined,
        actualRepayAmount: undefined,
        borrowerIndex: undefined,
        marketBorrowed: undefined,
        marketCollateral: undefined,
        liquidator: undefined,
        seizeTokens: undefined,
        src: undefined,
        dst: undefined,
        transferTokens: undefined,
        newPriceOracle: undefined,
        newCloseFactorMantissa: undefined,
        newCollateralFactorMantissa: undefined,
        newMaxAssets: undefined,
        newLiquidationIncentiveMantissa: undefined,
        supportMarket: undefined,
        newPauseGuardian: undefined,
        boolstate: undefined,
        unitroller: undefined,
        holder: undefined,
        borrowers: undefined,                        
        gsighRate_: undefined,   









      showLoader: false,
      statusCode: 'operational',
      watcher: '',
    };
  },

  // watch: {
  //   formData: {
  //     handler: function() {
  //       this.getStatus();   //getting status for exchange ()
  //     },
  //     deep: true,
  //   },
  // },



  methods: {

    ...mapActions(['whitePaperModelChangeBaseParamters','whitePaperModelUtilRate','whitePaperModelBorrowRate','whitePaperModelSupplyRate',
    'whitePaperModelgetBaseRatePerBlock','whitePaperModelgetMultiplierPerBlock','jumpV2ModelChangeBaseParamters', 'jumpV2ModelUtilRate', 
    'jumpV2ModelBorrowRate', 'jumpV2ModelSupplyRate', 'jumpV2ModelgetBaseRatePerBlock', 'jumpV2ModelgetMultiplierPerBlock',
    'jumpV2ModelgetJumpMultiplierPerBlock','jumpV2ModelgetKink'         
    ,        'sighReservoirBeginDripping','sighReservoirChangeDripRate', 
     'sighReservoirDrip','sighReservoirGetSighTokenAddress','sighReservoirgetTargetAddress','sighReservoirgetDripStart','sighReservoirgetdripRate'
     , 'sighReservoirgetlastDripBlockNumber','sighReservoirgettotalDrippedAmount','sighReservoirgetadmin',
     
     'sighInitMinting','sightransfer','sighapprove','sightransferFrom','sighincreaseAllowance','sighdecreaseAllowance','sighMintCoins',
     'sighchangeReservoir','sighgetRecentyMintedAmount','sighgetRecentMinter','sighgetCurrentCycle','sighgetCurrentEra','sighgetallowance',
     'sighgetbalanceOf','sigh_getTotalSupply','sighIsMintingActivated','sighgetStart_Time','sighgetdecimals','sighgetsymbol','sighgetname',
     
     'sightroller_getAssetsIn','sightroller_checkMembership','sightroller_enterMarkets','sightroller_exitMarket','sightroller_mintAllowed',
     'sightroller_mintVerify','sightroller_redeemAllowed','sightroller_redeemVerify','sightroller_borrowAllowed','sightroller_borrowVerify',
     'sightroller_repayBorrowAllowed','sightroller_repayBorrowVerify','sightroller_liquidateBorrowAllowed','sightroller_liquidateBorrowVerify',
     'sightroller_seizeAllowed','sightroller_seizeVerify','sightroller_transferAllowed','sightroller_transferVerify','sightroller_getAccountLiquidity',
     'sightroller_getHypotheticalAccountLiquidity','sightroller_liquidateCalculateSeizeTokens','sightroller_setPriceOracle','sightroller_setCloseFactor',
     'sightroller_setCollateralFactor','sightroller_setMaxAssets','sightroller_setLiquidationIncentive','sightroller_supportMarket','sightroller_setPauseGuardian',
     'sightroller_setMintPaused','sightroller_setBorrowPaused','sightroller_setTransferPaused','sightroller_setSeizePaused','sightroller__become','sightroller_refreshGsighSpeeds',
     'sightroller_claimGSigh','sightroller_claimGSigh_bs','sightroller_setGsighRate','sightroller__addGsighMarkets','sightroller__dropGsighMarket','sightroller__getAllMarkets',
     'sightroller__getBlockNumber','sightroller__getGSighAddress',
     
     ]),


    // **********************
    // whitepaperInterestRate
    // **********************    
    async whitepaperInterestRate(type) {
      console.log(type);
      console.log('cash = ' + this.cash);
      console.log('borrows = ' + this.borrows);
      console.log('reserves' + this.reserves);
      console.log('reservesMantissa' + this.reserveMantissa);
      console.log('baseRatePerYear' + this.baseRatePerYear);
      console.log('multiplierPerYear' + this.multiplierPerYear);

      if (type == 'changeParameters') {
        this.whitePaperModelChangeBaseParamters({baseRatePerYear: this.baseRatePerYear, multiplierPerYear: this.multiplierPerYear });
      }

      if (type == 'utilization') {
        this.whitePaperModelUtilRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves});
      }

      if (type == 'borrow') {
        this.whitePaperModelBorrowRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves});        
      }

      if (type == 'supply') {
        this.whitePaperModelSupplyRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves, reserveMantissa: this.reserveMantissa});                
      }
      if (type == 'baseRatePerBlock') {
        this.whitePaperModelgetBaseRatePerBlock();                
      }
      if (type == 'multiplierPerBlock') {
        this.whitePaperModelgetMultiplierPerBlock();                
      }

    },

    // **********************
    // jumpInterestRate_V2
    // **********************
    async jumpInterestRate_V2(type) {
      console.log(type);
      console.log('cash = ' + this.cash);
      console.log('borrows = ' + this.borrows);
      console.log('reserves' + this.reserves);
      console.log('reservesMantissa' + this.reserveMantissa);

      if (type == 'changeParameters') {
        this.jumpV2ModelChangeBaseParamters({baseRatePerYear: this.baseRatePerYear, multiplierPerYear: this.multiplierPerYear,jumpMultiplierPerYear: this.jumpMultiplierPerYear,kink_ : this.kink_});
      }
      if (type == 'utilization') {
        this.jumpV2ModelUtilRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves});
      }
      if (type == 'borrow') {
        this.jumpV2ModelBorrowRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves});        
      }
      if (type == 'supply') {
        this.jumpV2ModelSupplyRate({cash : this.cash,borrows: this.borrows, reserves: this.reserves, reserveMantissa: this.reserveMantissa});                
      }
      if (type == 'baseRatePerBlock') {
        this.jumpV2ModelgetBaseRatePerBlock();                
      }
      if (type == 'multiplierPerBlock') {
        this.jumpV2ModelgetMultiplierPerBlock();                
      }
      if (type == 'jumpMultiplierPerBlock') {
        this.jumpV2ModelgetJumpMultiplierPerBlock();                
      }
      if (type == 'kink') {
        this.jumpV2ModelgetKink();                
      }
    },

    // **********************
    // sighReservoir
    // **********************
    async sighReservoir(type) {
      console.log(type);
      console.log('dripRate = ' + this.dripRate);
      console.log('targetAddress = ' + this.targetAddress);

      if (type == 'BeginDripping') {
        this.sighReservoirBeginDripping({dripRate: this.dripRate, targetAddress: this.targetAddress});
      }
      if (type == 'ChangeDripRate') {
        this.sighReservoirChangeDripRate({dripRate: this.dripRate});
      }
      if (type == 'Drip') {
        this.sighReservoirDrip();        
      }
      if (type == 'RecentlyDrippedAmount') {
        this.sighReservoirDrip();        
      }
      if (type == 'gettotalDrippedAmount') {
        this.sighReservoirgettotalDrippedAmount();                
      }
      if (type == 'getdripRate') {
        this.sighReservoirgetdripRate();                
      }
      if (type == 'getlastDripBlockNumber') {
        this.sighReservoirgetlastDripBlockNumber();                
      }
      if (type == 'GetSighTokenAddress') {
        this.sighReservoirGetSighTokenAddress();                
      }
      if (type == 'getTargetAddress') {
        this.sighReservoirgetTargetAddress();                
      }
      if (type == 'GetDripStart') {
        this.sighReservoirgetDripStart();                
      }
      if (type == 'getadmin') {
        this.sighReservoirgetadmin();                
      }
    },

    // **********************
    // sighTokens
    // **********************
    async sighTokens(type) {
      console.log(type);
      console.log('recepient = ' + this.recepient);
      console.log('amount = ' + this.amount);
      console.log('spender = ' + this.spender);
      console.log('sender = ' + this.sender);
      console.log('addedValue = ' + this.addedValue);
      console.log('subtractedValue = ' + this.subtractedValue);
      console.log('newReservoir = ' + this.newReservoir);      

      if (type == 'initMinting') {
        this.sighInitMinting();
      }
      if (type == 'sightransfer') {
        this.sightransfer({recepient: this.recepient, amount: this.amount});
      }
      if (type == 'sighapprove') {
        this.sighapprove({spender: this.spender, amount: this.amount});        
      }
      if (type == 'sightransferFrom') {
        this.sightransferFrom({sender: this.sender, amount: this.amount});        
      }
      if (type == 'sighincreaseAllowance') {
        this.sighincreaseAllowance({spender: this.spender, addedValue: this.addedValue});                
      }
      if (type == 'sighdecreaseAllowance') {
        this.sighdecreaseAllowance({spender: this.spender, subtractedValue: this.subtractedValue});                
      }
      if (type == 'sighMintCoins') {
        this.sighMintCoins();                
      }
      if (type == 'sighchangeReservoir') {
        this.sighchangeReservoir({newReservoir: this.newReservoir});                
      }
      if (type == 'sighgetRecentyMintedAmount') {
        this.sighgetRecentyMintedAmount();                
      }
      if (type == 'sighgetRecentMinter') {
        this.sighgetRecentMinter();                
      }
      if (type == 'sighgetCurrentCycle') {
        this.sighgetCurrentCycle();                
      }
      if (type == 'sighgetCurrentEra') {
        this.sighgetCurrentEra();                
      }
      if (type == 'sighgetallowance') {
        this.sighgetallowance();                
      }
      if (type == 'sighgetbalanceOf') {
        this.sighgetbalanceOf();                
      }
      if (type == 'sigh_getTotalSupply') {
        this.sigh_getTotalSupply();                
      }
      if (type == 'sighIsMintingActivated') {
        this.sighIsMintingActivated();                
      }
      if (type == 'sighgetStart_Time') {
        this.sighgetStart_Time();                
      }
      if (type == 'sighgetdecimals') {
        this.sighgetdecimals();                
      }
      if (type == 'sighgetsymbol') {
        this.sighgetsymbol();                
      }
      if (type == 'sighgetname') {
        this.sighgetname();                
      }
    },

    // **********************
    // sightroller
    // **********************
    async sightroller(type) {
      console.log(type);
      console.log('account = ' + this.account);
      console.log('token = ' + this.token);
      console.log('markets = ' + this.markets);
      console.log('market = ' + this.market);
      console.log('minter = ' + this.minter);
      console.log('mintAmount = ' + this.mintAmount);
      console.log('actualMintAmount = ' + this.actualMintAmount);      
      console.log('mintTokens = ' + this.mintTokens);      
      console.log('redeemer = ' + this.redeemer);      
      console.log('redeemTokens = ' + this.redeemTokens);      
      console.log('actualRedeemAmount = ' + this.actualRedeemAmount);      
      console.log('borrower = ' + this.borrower);      
      console.log('borrowAmount = ' + this.borrowAmount);      
      console.log('payer = ' + this.payer);      
      console.log('repayAmount = ' + this.repayAmount);      
      console.log('actualRepayAmount = ' + this.actualRepayAmount);      
      console.log('borrowerIndex = ' + this.borrowerIndex);      
      console.log('marketBorrowed = ' + this.marketBorrowed);      
      console.log('marketCollateral = ' + this.marketCollateral);      
      console.log('liquidator = ' + this.liquidator);      
      console.log('seizeTokens = ' + this.seizeTokens);      
      console.log('src = ' + this.src);      
      console.log('dst = ' + this.dst);      
      console.log('transferTokens = ' + this.transferTokens);      
      console.log('newPriceOracle = ' + this.newPriceOracle);      
      console.log('newCloseFactorMantissa = ' + this.newCloseFactorMantissa);      

      console.log('newCollateralFactorMantissa = ' + this.newCollateralFactorMantissa);      
      console.log('newMaxAssets = ' + this.newMaxAssets);      
      console.log('newLiquidationIncentiveMantissa = ' + this.newLiquidationIncentiveMantissa);      
      console.log('supportMarket = ' + this.supportMarket);      
      console.log('newPauseGuardian = ' + this.newPauseGuardian);      
      console.log('boolstate = ' + this.boolstate);      
      console.log('unitroller = ' + this.unitroller);      
      console.log('holder = ' + this.holder);      
      console.log('borrowers = ' + this.borrowers);      
      console.log('gsighRate_ = ' + this.gsighRate_);      


      if (type == 'getAssetsIn') {
        this.sightroller_getAssetsIn({account: this.account});
      }
      if (type == 'checkMembership') {
        this.sightroller_checkMembership({account: this.account, market: this.market});
      }
      if (type == 'enterMarkets') {
        this.sightroller_enterMarkets({markets: this.markets});        
      }
      if (type == 'exitMarket') {
        this.sightroller_exitMarket({market: this.market});        
      }
      if (type == 'mintAllowed') {
        this.sightroller_mintAllowed({market: this.market,minter: this.minter,mintAmount: this.mintAmount});        
      }
      if (type == 'mintVerify') {
        this.sightroller_mintVerify({market: this.market, minter: this.minter, actualMintAmount: this.actualMintAmount, mintTokens: this.mintTokens});        
      }
      if (type == 'redeemAllowed') {
        this.sightroller_redeemAllowed({market: this.market,redeemer: this.redeemer,redeemTokens: this.redeemTokens});        
      }
      if (type == 'redeemVerify') {
        this.sightroller_redeemVerify({market: this.market, minter: this.minter, actualRedeemAmount: this.actualRedeemAmount, redeemTokens: this.redeemTokens});        
      }
      if (type == 'borrowAllowed') {
        this.sightroller_borrowAllowed({market: this.market,borrower: this.borrower,borrowAmount: this.borrowAmount});        
      }
      if (type == 'borrowVerify') {
        this.sightroller_borrowVerify({market: this.market, borrower: this.borrower, borrowAmount: this.borrowAmount});        
      }
      if (type == 'repayBorrowAllowed') {
        this.sightroller_repayBorrowAllowed({market: this.market,payer: this.payer, borrower: this.borrower, repayAmount: this.repayAmount});        
      }
      if (type == 'repayBorrowVerify') {
        this.sightroller_repayBorrowVerify({market: this.market, payer: this.payer, borrower: this.borrower, actualRepayAmount: this.actualRepayAmount, borrowerIndex: this.borrowerIndex});        
      }
      if (type == 'liquidateBorrowAllowed') {
        this.sightroller_liquidateBorrowAllowed({marketBorrowed: this.marketBorrowed,marketCollateral: this.marketCollateral, liquidator: this.liquidator, borrower: this.borrower, repayAmount: this.repayAmount});        
      }
      if (type == 'liquidateBorrowVerify') {
        this.sightroller_liquidateBorrowVerify({marketBorrowed: this.marketBorrowed, marketCollateral: this.marketCollateral, liquidator: this.liquidator, borrower: this.borrower, repayAmount: this.repayAmount, seizeTokens: this.seizeTokens});        
      }
      if (type == 'seizeAllowed') {
        this.sightroller_seizeAllowed({marketCollateral: this.marketCollateral, marketBorrowed: this.marketBorrowed, liquidator: this.liquidator, borrower: this.borrower, repayAmount: this.repayAmount, seizeTokens: this.seizeTokens});        
      }
      if (type == 'seizeVerify') {
        this.sightroller_seizeVerify({marketCollateral: this.marketCollateral, marketBorrowed: this.marketBorrowed, liquidator: this.liquidator, borrower: this.borrower, repayAmount: this.repayAmount, seizeTokens: this.seizeTokens});        
      }
      if (type == 'transferAllowed') {
        this.sightroller_transferAllowed({market: this.market,src: this.src, dst: this.dst, transferTokens: this.transferTokens});        
      }
      if (type == 'transferVerify') {
        this.sightroller_transferVerify({market: this.market, src: this.src, dst: this.dst, transferTokens: this.transferTokens});        
      }
      if (type == 'getAccountLiquidity') {
        this.sightroller_getAccountLiquidity({account: this.account});        
      }
      if (type == 'getHypotheticalAccountLiquidity') {
        this.sightroller_getHypotheticalAccountLiquidity({account: this.account, market: this.market, redeemTokens: this.redeemTokens, borrowAmount: this.borrowAmount});        
      }
      if (type == 'liquidateCalculateSeizeTokens') {
        this.sightroller_liquidateCalculateSeizeTokens({marketBorrowed: this.marketBorrowed, marketCollateral: this.marketCollateral, actualRepayAmount: this.actualRepayAmount });        
      }
      if (type == 'setPriceOracle') {
        this.sightroller_setPriceOracle({newPriceOracle: this.newPriceOracle});        
      }
      if (type == 'setCloseFactor') {
        this.sightroller_setCloseFactor({ newCloseFactorMantissa: this.newCloseFactorMantissa });        
      }
      if (type == 'setCollateralFactor') {
        this.sightroller_setCollateralFactor({market: this.market, newCollateralFactorMantissa: this.newCollateralFactorMantissa });        
      }
      if (type == 'setMaxAssets') {
        this.sightroller_setMaxAssets({ newMaxAssets: this.newMaxAssets });        
      }
      if (type == 'setLiquidationIncentive') {
        this.sightroller_setLiquidationIncentive({newLiquidationIncentiveMantissa: this.newLiquidationIncentiveMantissa });        
      }
      if (type == 'supportMarket') {
        this.sightroller_supportMarket({supportMarket: this.supportMarket });        
      }
      if (type == 'setPauseGuardian') {
        this.sightroller_setPauseGuardian({newPauseGuardian: this.newPauseGuardian });        
      }
      if (type == 'setMintPaused') {
        this.sightroller_setMintPaused({market: this.market, boolstate: this.boolstate });        
      }
      if (type == 'setBorrowPaused') {
        this.sightroller_setBorrowPaused({market: this.market, boolstate: this.boolstate  });        
      }
      if (type == 'setTransferPaused') {
        this.sightroller_setTransferPaused({boolstate: this.boolstate });        
      }
      if (type == 'setSeizePaused') {
        this.sightroller_setSeizePaused({boolstate: this.boolstate });        
      }
      if (type == '__become') {
        this.sightroller__become({unitroller: this.unitroller});        
      }
      if (type == 'refreshGsighSpeeds') {
        this.sightroller_refreshGsighSpeeds();        
      }
      if (type == 'claimGSigh') {
        this.sightroller_claimGSigh({holder: this.holder, markets: this.markets });        
      }
      if (type == 'claimGSigh_bs') {
        this.sightroller_claimGSigh_bs({holders: this.holders, markets: this.markets, borrowers: this.borrowers, suppliers: this.suppliers });        
      }
      if (type == 'setGsighRate') {
        this.sightroller_setGsighRate({gsighRate_: this.gsighRate_});        
      }
      if (type == 'addGsighMarkets') {
        this.sightroller__addGsighMarkets({markets: this.markets});        
      }
      if (type == 'dropGsighMarket') {
        this.sightroller__dropGsighMarket({market: this.market});        
      }
      if (type == 'getAllMarkets') {
        this.sightroller__getAllMarkets();        
      }
      if (type == 'getBlockNumber') {
        this.sightroller__getBlockNumber();        
      }
      if (type == 'getGSighAddress') {
        this.sightroller__getGSighAddress();        
      }
    }









  },

  created() {
    this.changeVegaMarket = (newMarket) => {       //Changing Selected Vega Market
      this.formData.vegaMarketName = newMarket.Name;
      this.formData.vegaMarketId = newMarket.Id;
      // console.log(this.formData.vegaMarketId + ' ' + this.formData.vegaMarketName);
    };
    ExchangeDataEventBus.$on('change-vega-market', this.changeVegaMarket);        
  },

  // mounted() {
  //   this.watcher = setInterval(() => {this.getStatus();}, 5000);  //getting status for exchange () every 5 sec
  //   // ExchangeDataEventBus.$on('change-symbol', this.changeSymbol);
  //   // this.getStatus('auto');
  // },


  destroyed() {
    clearInterval(this.watcher);
    ExchangeDataEventBus.$off('change-vega-market', this.changeVegaMarket);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
