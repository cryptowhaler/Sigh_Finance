<template src="./template.html"></template>

<script>
import { dateToDisplayDateTime, } from '@/utils/utility';
import VegaProtocolService from '@/services/VegaProtocolService';
import EventBus, { EventNames, } from '@/eventBuses/default';
import {VegaKeys,} from '@/utils/localStorage.js';
import gql from 'graphql-tag';

export default {
  name: 'sigh',

  props: {
    open: {
      type: Boolean,
    },
  },

  data() {
    return {
      sigh: [],
      sighAddress : "0x58897eb4e8e70eb8133587ce80b8e56f9248705c",
      sighSnapshot : [],
    };
  },

  apollo: {
    $subscribe: {
      sighs: {
        query: gql`subscription name($id: String!) {
                      sigh (id: $id)  {
                        id
                        currentCycle 
                        currentEra 
                        Recentminter 
                        RecentCoinsMinted 
                        totalSupply 
                        blockNumberWhenCoinsMinted 
                        Reservoir 
                      }
                  }`,

        variables() {  return {id: this.sighAddress ,};  },

        result({data,loading,}) {
          if (loading) {
            console.log('loading');
          }
          console.log(data);
          let sigh = data.sigh;
          console.log(sigh);
          this.subcribeToSighSnapshot(sigh);
        },
      },
    },
  },


  mounted() {
    // this.userwalletConnected = () => this.getSighSnapshot();
    // this.userWalletDisconnectedListener = () => this.setTradesEmpty();
    // EventBus.$on(EventNames.userWalletConnected, this.userwalletConnected);
    // EventBus.$on(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
    // EventBus.$on(EventNames.pubKeyChanged,this.userwalletConnected);  //to handle change in pubKey        
  },

  // computed: {
  //   recentTrades() {
  //     return this.mapRecentTrades(this.$store.getters.recentTrades);
  //   },
  // },

  methods: {
    // async getSighSnapshot() {
    //   console.log('/n  \n  /n   \n check what is hapeening')
    //   // this.partiesId = '5946e79a6e21950ea276ea7792d34553347611ee845d57088177c1df99f50633';
    //   this.$store.commit('sighSnapshot',[]);
    //   this.sigh = [];
    //   this.partiesId = VegaKeys.currentActiveKey;
    //   // console.log(this.partiesId);
    //   const response = await VegaProtocolService.get_trades_by_party(this.partiesId);
    //   // console.log(response);
    //   if (response.status == 200) {
    //     // console.log(response.data);
    //     for (let i=0;i<response.data.trades.length;i++ ) {
    //       this.addNewTrade(response.data.trades[i]);
    //     }
    //     // console.log(this.$store.getters.recentTrades);
    //     // console.log(this.trades);
    //     this.sigh = this.$store.getters.recentTrades;        
    //     // console.log(this.trades);
    //   }
    //   else {
    //     this.$showErrorMsg({message: 'Something went wrong. Couldn\'t fetch recent Trades',});        
    //   }
    // },

    // setTradesEmpty() {
    //   this.$store.commit('sighSnapshot',[]);
    //   this.sigh = [];
    // },

    subcribeToSighSnapshot(sigh) {
      // for (let i=0;i<sigh.length;i++) {
        console.log(sigh);
        let obj = [];
        obj.address = sigh.id;
        obj.currentCycle = sigh.currentCycle;
        obj.currentEra = sigh.currentEra;
        obj.Recentminter = sigh.Recentminter;
        obj.InflationRate = this.getInflationRate(sigh.currentEra);
        obj.RecentCoinsMinted = sigh.RecentCoinsMinted;
        obj.totalSupply = sigh.totalSupply;
        obj.blockNumberWhenCoinsMinted = sigh.blockNumberWhenCoinsMinted;
        obj.Reservoir = sigh.Reservoir;
        console.log(obj);
        this.$store.commit('sighSnapshot',obj);
        this.sigh = [obj];
        console.log(this.sigh);
        // console.log(this.trades);
      // }
    },

    getInflationRate (era) {

      if (era == '0') {
        return "1 %";
      }
      if (era == '1') {
        return "0.5 %";
      }
      if (era == '2') {
        return "0.25 %";
      }
      if (era == '3') {
        return "0.125 %";
      }
      if (era == '4') {
        return "0.0625 %";
      }
      if (era == '5') {
        return "0.03125 %";
      }
      if (era == '6') {
        return "0.015625 %";
      }
      if (era == '7') {
        return "0.0078125 %";
      }
      if (era == '8') {
        return "0.00390625 %";
      }
      if (era == '9') {
        return "0.001953125 %";
      }
      if (era == '10') {
        return "0.0009765625 %";
      }
      return "All Eras Completed"
    },

  
  // addNewTrade(sigh) {
  //       let obj = [];
  //       obj.address = sigh.id;
  //       obj.currentCycle = sigh.currentCycle;
  //       obj.currentEra = sigh.currentEra;
  //       obj.Recentminter = sigh.Recentminter;
  //       obj.RecentCoinsMinted = sigh.RecentCoinsMinted;
  //       obj.totalSupply = sigh.totalSupply;
  //       obj.blockNumberWhenCoinsMinted = sigh.blockNumberWhenCoinsMinted;
  //       obj.Reservoir = sigh.Reservoir;
  //       this.$store.commit('sighSnapshot',obj);
  //       // console.log(this.trades);
  //   },


    toggleOpen() {
      this.$emit('toggle-open');
    },

    formatDateTime(timestamp) {
      return dateToDisplayDateTime(new Date(timestamp));
    },
  },

  destroyed() {
    // EventBus.$off(EventNames.userWalletConnected, this.userwalletConnected);
    // EventBus.$off(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
    // EventBus.$on(EventNames.pubKeyChanged,this.userwalletConnected);  //to handle change in pubKey        
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>


