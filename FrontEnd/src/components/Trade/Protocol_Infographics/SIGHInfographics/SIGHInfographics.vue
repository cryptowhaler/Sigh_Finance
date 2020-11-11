<template src="./template.html"></template>

<script>
import { dateToDisplayDateTime, } from '@/utils/utility';
import EventBus, { EventNames, } from '@/eventBuses/default';
import gql from 'graphql-tag';

export default {
  name: 'SIGHInfographics',

  props: {
    open: {
      type: Boolean,
    },
  },

  data() {
    return {
      sigh: [],
      sighAddress : "0x76ff68033ef96ee0727f85ea1f979b1b0fd4c75b",
      sighSnapshot : [],
    };
  },

  // apollo: {
  //   $subscribe: {
  //     sighs: {
  //       query: gql`subscription name($id: String!) {
  //                     sigh (id: $id)  {
  //                       id
  //                       currentCycle 
  //                       currentEra 
  //                       Recentminter 
  //                       RecentCoinsMinted 
  //                       totalSupply 
  //                       blockNumberWhenCoinsMinted 
  //                       Reservoir 
  //                     }
  //                 }`,

  //       variables() {  return {id: this.sighAddress ,};  },

  //       result({data,loading,}) {
  //         if (loading) {
  //           console.log('loading');
  //         }
  //         console.log(data);
  //         let sigh = data.sigh;
  //         console.log(sigh);
  //         this.subcribeToSighSnapshot(sigh);
  //       },
  //     },
  //   },
  // },


  mounted() {
    this.userwalletConnected = () => this.getSighSnapshot();
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
  },

  destroyed() {
    EventBus.$off(EventNames.userWalletConnected, this.userwalletConnected);
    EventBus.$off(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>


