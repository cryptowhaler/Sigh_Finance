<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
import gql from 'graphql-tag';

export default {
  name: 'live-trades',

  components: {
    Spinner,
  },

  props: {
    parentHeight: Number,   //communicated to parent
  },

  data() {
    return {
      trades: {},
      tableHeight: '',
      showLoader:true,
      snapTaken: false,
      marketId: 'RTJVFCMFZZQQLLYVSXTWEN62P6AH6OCN', //this.$store.state.selectedVegaMarketId,
      
    };
  },

  apollo: {
    $subscribe: {
      trades: {
        query: gql`subscription name($marketId: String!) {
                  trades (marketId: $marketId) {
                      market {
                        id
                      }
                      price
                      size
                      aggressor
                      createdAt
                  }
                }`,

        variables() {  return {marketId: this.marketId,};  },

        result({data,loading,}) {
          if (loading) {
            // console.log('loading');
          }
          let _trades = data.trades;
          //          // console.log(_trades[0].market.id);
          if (!this.snapTaken) { 
            // // console.log(_trades[0].market.id);
            //            // console.log(_trades);
            this.snapshotListener(_trades);
            this.snapTaken = true;
          }
          else {
            // // console.log(_trades);
            for (let i=(_trades.length-1); i>=0;i--) {
              // // console.log(_trades[i]);
              this.liveTradeListener(_trades[i]);
            }
          }
        },
      },
    },
  },

  watch: {
    parentHeight: function(newVal) {
      let calcHeight = newVal;
      this.tableHeight = 'calc(100vh - ' + (calcHeight  + 100) + 'px';
    },
  },

  created() {

    this.snapshotListener = snap => {
      this.trades = snap;
      setTimeout(() => {this.showLoader=false;}, 500);
      const liveTrade = snap[0];
      let price;
      if (liveTrade.aggressor == 'Sell') {
        price = - Number(liveTrade.price);
      } 
      else {
        price = Number(liveTrade.price);
      }
      this.$store.commit('liveTradePrice', Math.abs((price/100000).toFixed(5)));
      this.$store.commit('removeLoaderTask', 1);
    };

    this.reset = (newMarket) => {
      this.showLoader=true;
      this.snapTaken = false;
      this.trades = {};
      this.marketId = newMarket.Id;
      // console.log('New Selected Market being fetched in LiveTrades with Id - ' + this.marketId);
      this.$store.state.selectedVegaMarketId
    };

    this.liveTradeListener = liveTrade => {
      this.trades.unshift(liveTrade);
      if (this.trades.length > 100) {
        this.trades.pop();
      }
      let price;
      if (liveTrade.aggressor == 'Sell') {
        price = -Number(liveTrade.price);
      } else {
        price = Number(liveTrade.price);
      }
      this.$store.commit('liveTradePrice', Math.abs((price/100000).toFixed(5)));
    };

    ExchangeDataEventBus.$on('change-vega-market', this.reset);
  },

  destroyed() {
    this.snapTaken = false;
    ExchangeDataEventBus.$off('change-vega-market', this.reset);
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
