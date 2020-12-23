<template src="./template.html"></template>

<script>
// import EventBus, { EventNames,} from '@/eventBuses/default';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
import {mapState,mapActions,} from 'vuex';
import gql from 'graphql-tag';

export default {
  name: 'Money-Markets-Global-States',


  components: {
    Spinner,
  },


  data() {
    return {
      instruments: [],      
      tableHeight: '',
      showLoader:false,
      displayInUSD: true,
      sighPriceInUSD: 0,

      instrumentGlobalStates: [],

      SIGH_Pay_Rate: 0,               //  Interest Percent for SIGH Rewards
      SIGH_Pay_Amount_Day: 0,         // Instrument Tokens being paid per day as SIGH Rewards
      SIGH_Pay_Amount_Year: 0,       // Instrument Tokens being paid per year as SIGH Rewards

      SIGH_Pay_Amount_Day_USD: 0,         // Value of Instrument Tokens being paid per day as SIGH Rewards
      SIGH_Pay_Amount_Year_USD: 0,       // Value of Instrument Tokens being paid per year as SIGH Rewards

      SIGH_Harvests_Speed:0,                //  Total SIGH Tokens being distributed by the instrument per Block among participants
      SIGH_Harvests_Amount_Day: 0,          //  Total SIGH Tokens being distributed by the instrument per day among participants
      SIGH_Harvests_Amount_Year: 0,         //  Total SIGH Tokens being distributed by the instrument per year among participants

      SIGH_Harvests_Speed_USD:0,            //  Value of SIGH Tokens being distributed by the instrument per Block among participants
      SIGH_Harvests_Amount_Day_USD: 0,      //  Value of SIGH Tokens being distributed by the instrument per day among participants
      SIGH_Harvests_Amount_Year_USD: 0,     //  Value of SIGH Tokens being distributed by the instrument per year among participants

      
    };
  },


  // apollo: {
  //   $subscribe: {
  //     instruments: {
  //       query: gql`subscription {
  //                   instruments {
  //                     name
  //                     symbol
  //                     underlyingInstrumentName
  //                     underlyingInstrumentSymbol
  //                     priceUSD

  //                     bearSentimentPercent
  //                     bullSentimentPercent
  //                     isSIGHMechanismActivated

  //                     totalCompoundedLiquidity
  //                     totalCompoundedLiquidityUSD
  //                     totalCompoundedBorrows
  //                     totalCompoundedBorrowsUSD

  //                     stableBorrowInterestPercent
  //                     variableBorrowInterestPercent
  //                     supplyInterestRatePercent
  //                     sighPayInterestRatePercent

  //                     average24SnapsSuppliersHarvestAPY
  //                     average24SnapsBorrowersHarvestAPY

  //                     averageMonthlySnapsSuppliersHarvestAPY
  //                     averageMonthlySnapsBorrowersHarvestAPY

  //                     present_SIGH_Side
  //                     present_DeltaBlocks
  //                     present_SIGH_Suppliers_Speed
  //                     present_SIGH_Borrowers_Speed
  //                     present_SIGH_Staking_Speed
  //                     isSIGHMechanismActivated
  //                   }
  //                 }`,

  //       result({data,loading,}) {
  //         if (loading) {
  //           console.log('loading');
  //         }
  //         else {
  //         console.log("IN SUBSCRIPTIONS : INSTRUMENTS GLOBAL STATES");
  //         console.log(data);
  //         let instruments_ = data.instruments;
  //         if (instruments_) {
  //           this.instruments = instruments_;
  //         }
  //         }
  //       },
  //     },
  //   },
  // },

  // watch: {
  //   parentHeight: function(newVal) {
  //     let calcHeight = newVal;
  //     this.tableHeight = 'calc(100vh - ' + (calcHeight  + 100) + 'px';
  //   },
  // },


  methods: {

    ...mapActions(['fetchSighFinanceProtocolState']),

async refresh() {
      if (!this.$store.state.web3) {
        this.$showErrorMsg({title:"Not Connected to Web3", message: " You need to first connect to WEB3 (BSC Network) to interact with SIGH Finance!", timeout: 4000 });  
        this.$showInfoMsg({message: "Please install METAMASK Wallet to interact with SIGH Finance!", timeout: 4000 }); 
        return;
      }
      else if (!this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({title:"Network not Supported", message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName, timeout: 4000 }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) ", timeout: 4000 }); 
        return;
      }
      this.showLoader = true;
      await this.fetchSighFinanceProtocolState();
      let instrumentAddresses = this.$store.state.supportedInstrumentAddresses;
      console.log(instrumentAddresses);
      if (instrumentAddresses && instrumentAddresses.length>0) {
        this.instrumentGlobalStates = [];
        for (let i=0; i< instrumentAddresses.length; i++) { 
          let currentInstrument = instrumentAddresses[i];
          let currentInstrumentGlobalState = this.$store.state.supportedInstrumentGlobalStates.get(currentInstrument);
          this.instrumentGlobalStates.push(currentInstrumentGlobalState);
          console.log(currentInstrumentGlobalState);          
        }
          console.log(this.instrumentGlobalStates);          
      }
      this.showLoader = false;
    },

    toggle() {
      let instrumentAddresses = this.$store.state.supportedInstrumentAddresses;
      console.log(instrumentAddresses);
      if (instrumentAddresses && instrumentAddresses.length>0) {
        this.instrumentGlobalStates = [];
        for (let i=0; i< instrumentAddresses.length; i++) { 
          let currentInstrument = instrumentAddresses[i];
          let currentInstrumentGlobalState = this.$store.state.supportedInstrumentGlobalStates.get(currentInstrument);
          this.instrumentGlobalStates.push(currentInstrumentGlobalState);
          console.log(currentInstrumentGlobalState);          
        }
          console.log(this.instrumentGlobalStates);          
      }
      this.displayInUSD = !this.displayInUSD;
    },   
    
    calculateSIGHPriceInUSD() {
       this.sighPriceInUSD = Number(this.$store.state.sighPriceUSD) > 0 ? Number(this.$store.state.sighPriceUSD) : 0 ;
       console.log( "CALCULATED $SIGH PRICE FOR HARVEST CALCULATION : " + this.sighPriceInUSD)
       return this.sighPriceInUSD;
       con
    },



    getBalanceString(number)  {
      if ( Number(number) >= 1000000000 ) {
        let inBil = (Number(number) / 1000000000).toFixed(2);
        return inBil.toString() + ' B';
      } 
      if ( Number(number) >= 1000000 ) {
        let inMil = (Number(number) / 1000000).toFixed(2);
        return inMil.toString() + ' M';
      } 
      if ( Number(number) >= 1000 ) {
        let inK = (Number(number) / 1000).toFixed(2);
        return inK.toString() + ' K';
      } 
      return Number(number).toFixed(2);
    }, 

  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
