<template src="./template.html"></template>

<script>
// import EventBus, { EventNames,} from '@/eventBuses/default';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
// import {mapState,mapActions,} from 'vuex';
import gql from 'graphql-tag';

export default {
  name: 'Money-Markets-SIGH-State',


  components: {
    Spinner,
  },


  data() {
    return {
      instruments: [],      
      showLoader:false,
    };
  },

  apollo: {
    $subscribe: {
      instruments: {
        query: gql`subscription {
                    instruments {
                      name
                      underlyingInstrumentSymbol
                      isSIGHMechanismActivated

                      present_maxVolatilityLimitSuppliersPercent 
                      present_maxVolatilityLimitBorrowersPercent

                      present_PrevPrice_USD
                      present_OpeningPrice_USD

                      present_total24HrVolatilityUSD
                      present_percentTotalVolatility

                      present_24HrVolatilityLimitAmountUSD
                      present_percentTotalVolatilityLimitAmount

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
          console.log("IN SUBSCRIPTIONS : INSTRUMENTS SIGH STATE ");
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


  async created() {
  },




  methods: {



  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
