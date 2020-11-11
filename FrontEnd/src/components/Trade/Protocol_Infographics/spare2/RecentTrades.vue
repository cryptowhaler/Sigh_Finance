<template src="./template.html"></template>

<script>
import { dateToDisplayDateTime, } from '@/utils/utility';
import EventBus, { EventNames, } from '@/eventBuses/default';
import gql from 'graphql-tag';

export default {
  name: 'recent-trades',

  data() {
    return {
      trades: [],
      connectedWallet: null, 
    };
  },

  // apollo: {
  //   $subscribe: {
  //     positions: {
  //       query: gql`subscription name($partyId: String!) {
  //                   trades (partyId: $partyId) {
  //                       id
  //                       market {
  //                         name
  //                       }
  //                       price
  //                       size
  //                       aggressor
  //                       buyOrder
  //                       sellOrder
  //                       createdAt
  //                   }
  //                 }`,

  //       variables() {  return {partyId: this.partiesId,};  },

  //       result({data,loading,}) {
  //         let trades = data.trades;
  //         this.subcribeToTrades(trades);
  //       },
  //     },
  //   },
  // },


  mounted() {
    this.userwalletConnected = () => this.getRecentTrades();
    this.userWalletDisconnectedListener = () => this.setTradesEmpty();
    EventBus.$on(EventNames.userWalletConnected, this.userwalletConnected);
    EventBus.$on(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },


  methods: {
    toggleOpen() {
      this.$emit('toggle-open');
    },

    formatDateTime(timestamp) {
      return dateToDisplayDateTime(new Date(timestamp));
    },
    async getRecentTrades() {
      this.trades = [];
    },
    setTradesEmpty() {
      this.trades = [];
    },
  },

  destroyed() {
    EventBus.$off(EventNames.userWalletConnected, this.userwalletConnected);
    EventBus.$off(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>


