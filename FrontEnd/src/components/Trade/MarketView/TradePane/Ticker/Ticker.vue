<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
// import VegaProtocolService from '@/services/VegaProtocolService';
import Spinner from '@/components/Spinner/Spinner.vue';
import gql from 'graphql-tag';

const LIVE_TICKERS = gql`
subscription {
  marketData  {
    market {
      id
      name
      tradableInstrument {
        instrument {
          name 
          baseName
          quoteName
        }    
      }
    }
    bestBidPrice
    bestOfferPrice
    midPrice
  }
}`;

export default {
  name: 'ticker',
  components: {
    Spinner,
  },

  data() {
    return {
      tickerObj: {},
      tickers: [],
      snapTaken: false,
      showLoader: false,
      i: 0,
    //   toggleOn: true,
    //   toggleFees: false,
    };
  },

  apollo: {
    $subscribe: {
      tickers: {
        query: LIVE_TICKERS,
        result(data) {
          let tickers = data.data.marketData;
          (this.i)++;
          // // console.log(tickers);
          setTimeout(() => {
            this.addnewTicker(tickers);
          },(this.i*1000 + 1000)); 
        }, 
      },
    },
  },

  created() {
    if (JSON.stringify(this.$store.state.tickerData) == '{}') { //Showing loader initially when page loaded
      this.showLoader = true;
    }
    setTimeout(() => {this.showLoader = false;}, 3000);
  },

  methods: {
    tickerClick(ticker) {
      let selectedMarket = {'Name':ticker.markName,'Id':ticker.markId,};
      let selectedMarketTrade = {'Name':ticker.markName,'Id':ticker.markId,'baseName':ticker.baseName,'quoteName':ticker.quoteName,'summary':ticker.summary,};
      // console.log(selectedMarket);
      this.$store.commit('changeSelectedVegaMarket', selectedMarket );      
      this.$store.commit('changeSelectedVegaMarketSummary', ticker.summary);
      this.$store.commit('changeSelectedVegaMarketbaseName', ticker.baseName);      
      this.$store.commit('changeSelectedVegaMarketquoteName', ticker.quoteName);      
      this.$store.commit('changeSelectedVegaMarketTrade', selectedMarketTrade );        //Used for trade Tab
      this.$store.commit('changeSelectedVegaMarketNameTrade', ticker.markName );  //Name change (eq - ETHVUSD/DEC20)
      this.$store.commit('changeSelectedVegaMarketTradeId', ticker.markId);   //Selected market in TradeTab - ID Change
      this.$store.commit('changeSelectedVegaMarketbaseNameTrade', ticker.baseName);
      this.$store.commit('changeSelectedVegaMarketquoteNameTrade', ticker.quoteName );
      this.$store.commit('changeSelectedVegaMarketSummaryTrade',ticker.summary);

      ExchangeDataEventBus.$emit('change-vega-market', selectedMarket);      
      ExchangeDataEventBus.$emit('change-vega-header', {'Name':ticker.markName,'Summary':ticker.summary,});
      this.$root.$emit('tickerClicked');
    },

    addnewTicker(tickers) {
      let obj = [];
      obj.markId = tickers.market.id;
      obj.markName = tickers.market.name;
      obj.bid = (Number(tickers.bestBidPrice)/100000).toFixed(5);
      obj.ask = (Number(tickers.bestOfferPrice)/100000).toFixed(5);
      obj.mid = (Number(tickers.midPrice)/1000).toFixed(5);
      obj.summary = tickers.market.tradableInstrument.instrument.name;
      obj.baseName = tickers.market.tradableInstrument.instrument.baseName;
      obj.quoteName = tickers.market.tradableInstrument.instrument.quoteName;
      // // console.log(obj);
      this.tickers.unshift(obj);
      if(this.tickers.length > 15) {
        this.tickers.pop();
      }
    },

    // toggle(e) {
    //   e.preventDefault();
    //   this.toggleOn = !this.toggleOn;
    //   e.target.innerHTML = e.target.innerHTML === 'Fees Off' ? 'Fees On' : 'Fees Off';
    // },
  },

};
</script>

<style lang="scss" src="./style.scss" scoped></style>

