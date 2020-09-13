<template src="./template.html"></template>

<script>
import { dateToDisplayDateTime, } from '@/utils/utility';
import VegaProtocolService from '@/services/VegaProtocolService';
import EventBus, { EventNames, } from '@/eventBuses/default';
import {VegaKeys,} from '@/utils/localStorage.js';
import gql from 'graphql-tag';

export default {
  name: 'recent-trades',

  props: {
    open: {
      type: Boolean,
    },
  },

  data() {
    return {
      trades: this.$store.getters.recentTrades,
      isLoggedIn: false,
      // partiesId: '5946e79a6e21950ea276ea7792d34553347611ee845d57088177c1df99f50633',
      partiesId: VegaKeys.currentActiveKey,
    };
  },

  apollo: {
    $subscribe: {
      positions: {
        query: gql`subscription name($partyId: String!) {
                    trades (partyId: $partyId) {
                        id
                        market {
                          name
                        }
                        price
                        size
                        aggressor
                        buyOrder
                        sellOrder
                        createdAt
                    }
                  }`,

        variables() {  return {partyId: this.partiesId,};  },

        result({data,loading,}) {
          if (loading) {
            // console.log('loading');
          }
          let trades = data.trades;
          // console.log(trades);
          this.subcribeToTrades(trades);
        },
      },
    },
  },


  mounted() {
    this.userLoginListener = () => this.getRecentTrades();
    this.userLogoutListener = () => this.setTradesEmpty();
    EventBus.$on(EventNames.userLogin, this.userLoginListener);
    EventBus.$on(EventNames.userLogout, this.userLogoutListener);
    EventBus.$on(EventNames.pubKeyChanged,this.userLoginListener);  //to handle change in pubKey        
  },

  // computed: {
  //   recentTrades() {
  //     return this.mapRecentTrades(this.$store.getters.recentTrades);
  //   },
  // },

  methods: {
    async getRecentTrades() {
      // this.partiesId = '5946e79a6e21950ea276ea7792d34553347611ee845d57088177c1df99f50633';
      this.$store.commit('recentTrades',[]);
      this.trades = [];
      this.partiesId = VegaKeys.currentActiveKey;
      // console.log(this.partiesId);
      const response = await VegaProtocolService.get_trades_by_party(this.partiesId);
      // console.log(response);
      if (response.status == 200) {
        // console.log(response.data);
        for (let i=0;i<response.data.trades.length;i++ ) {
          this.addNewTrade(response.data.trades[i]);
        }
        // console.log(this.$store.getters.recentTrades);
        // console.log(this.trades);
        this.trades = this.$store.getters.recentTrades;        
        // console.log(this.trades);
      }
      else {
        this.$showErrorMsg({message: 'Something went wrong. Couldn\'t fetch recent Trades',});        
      }
    },

    setTradesEmpty() {
      this.$store.commit('recentTrades',[]);
      this.trades = [];
    },

    subcribeToTrades(trades) {
      for (let i=0;i<trades.length;i++) {
        let obj = [];
        obj.marketName = trades[i].market.name;
        obj.price = (Number(trades[i].price)/100000);
        obj.size = Number(trades[i].size);
        obj.aggressor = trades[i].aggressor;
        obj.buyOrderID = trades[i].buyOrderID;
        obj.sellOrderID = trades[i].sellOrderID;
        obj.createdAt = trades[i].createdAt;
        this.$store.commit('addToRecentTrades',obj);
        // console.log(this.trades);
      }
    },
  
  addNewTrade(trade) {
        let obj = [];
        obj.marketName = this.getNameforMarketID(trade.marketID);
        obj.price = (Number(trade.price)/100000);
        obj.size = Number(trade.size);
        obj.aggressor = trade.aggressor;
        obj.buyOrderID = trade.buyOrder;
        obj.sellOrderID = trade.sellOrder;
        obj.createdAt = trade.timestamp;
        this.$store.commit('addToRecentTrades',obj);
        // console.log(this.trades);
    },

    getNameforMarketID(marketID) {          //Gets market name for market ID
      let markets = this.$store.getters.mappedMarkets;
      // console.log(markets);
      if (this.$store.getters.mappedMarkets.has(marketID)) {
        // console.log(marketID + ' name found');
        let data = this.$store.getters.mappedMarkets.get(marketID);
        // console.log(data);
        return data.name;
      }
      else {
        return 'undefined';
      }
    },

    toggleOpen() {
      this.$emit('toggle-open');
    },

    formatDateTime(timestamp) {
      return dateToDisplayDateTime(new Date(timestamp));
    },
  },

  destroyed() {
    EventBus.$off(EventNames.userLogin, this.userLoginListener);
    EventBus.$off(EventNames.userLogout, this.userLogoutListener);
    EventBus.$on(EventNames.pubKeyChanged,this.userLoginListener);  //to handle change in pubKey        
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>


