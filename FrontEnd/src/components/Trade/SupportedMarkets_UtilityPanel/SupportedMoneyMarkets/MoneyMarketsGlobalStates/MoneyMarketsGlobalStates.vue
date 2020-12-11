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


  apollo: {
    $subscribe: {
      instruments: {
        query: gql`subscription {
                    instruments {
                      name
                      symbol
                      underlyingInstrumentName
                      underlyingInstrumentSymbol
                      priceUSD

                      bearSentimentPercent
                      bullSentimentPercent
                      isSIGHMechanismActivated

                      totalCompoundedLiquidity
                      totalCompoundedLiquidityUSD
                      totalCompoundedBorrows
                      totalCompoundedBorrowsUSD

                      stableBorrowInterestPercent
                      variableBorrowInterestPercent
                      supplyInterestRatePercent
                      sighPayInterestRatePercent

                      average24SnapsSuppliersHarvestAPY
                      average24SnapsBorrowersHarvestAPY

                      averageMonthlySnapsSuppliersHarvestAPY
                      averageMonthlySnapsBorrowersHarvestAPY

                      present_SIGH_Side
                      present_DeltaBlocks
                      present_SIGH_Suppliers_Speed
                      present_SIGH_Borrowers_Speed
                      present_SIGH_Staking_Speed
                      isSIGHMechanismActivated
                    }
                  }`,

        result({data,loading,}) {
          if (loading) {
            console.log('loading');
          }
          else {
          console.log("IN SUBSCRIPTIONS : INSTRUMENTS GLOBAL STATES");
          console.log(data);
          let instruments_ = data.instruments;
          if (instruments_) {
            this.instruments = instruments_;
          }
          }
        },
      },
    },
  },

  // watch: {
  //   parentHeight: function(newVal) {
  //     let calcHeight = newVal;
  //     this.tableHeight = 'calc(100vh - ' + (calcHeight  + 100) + 'px';
  //   },
  // },


  methods: {

    toggle() {
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
