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
      showConfirm: false,
      formData: {
        pair: 'BTC/USD',
        type: 'limit',
        exc: 'vegaProtocol',
        vegaMarketName: this.$store.state.selectedVegaMarketName,
        vegaMarketId: this.$store.state.selectedVegaMarketId,
        bos: 'Buy',
        selectedmarketid: 'LBXRA65PN4FN5HBWRI2YBCOYDG2PBGYU',
        amount: undefined,        //amount
        price: undefined,         //price
        moe: 'market',
      },
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
    'jumpV2ModelgetJumpMultiplierPerBlock','jumpV2ModelgetKink'         ,        'sighReservoirBeginDripping','sighReservoirChangeDripRate', 
     'sighReservoirDrip','sighReservoirGetSighTokenAddress','sighReservoirgetTargetAddress','sighReservoirgetDripStart','sighReservoirgetdripRate'
     , 'sighReservoirgetlastDripBlockNumber','sighReservoirgettotalDrippedAmount','sighReservoirgetadmin'      ]),

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

    async sightroller(type) {
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
