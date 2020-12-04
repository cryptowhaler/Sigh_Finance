<template src="./template.html"></template>

<script>
// import EventBus, { EventNames,} from '@/eventBuses/default';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
// import {mapState,mapActions,} from 'vuex';
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
    };
  },


  apollo: {
    $subscribe: {
      instruments: {
        query: gql`subscription {
                    instruments {
                      instrumentAddress
                      iTokenAddress
                      name
                      symbol
                      underlyingInstrumentName
                      underlyingInstrumentSymbol
                      decimals
                      totalCompoundedLiquidity
                      totalCompoundedLiquidityUSD
                      totalCompoundedBorrows
                      totalCompoundedBorrowsUSD
                      utilizationRatePercent
                      stableBorrowInterestPercent
                      variableBorrowInterestPercent
                      supplyInterestRatePercent
                      present_SIGH_Side
                      present_DeltaBlocks
                      present_SIGH_Suppliers_Speed
                      present_SIGH_Borrowers_Speed
                      present_SIGH_Staking_Speed
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
        let inK = (Number(number) / 1000).toFixed(3);
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
