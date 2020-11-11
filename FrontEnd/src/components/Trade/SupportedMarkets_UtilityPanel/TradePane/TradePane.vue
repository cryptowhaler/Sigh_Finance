<template src="./template.html"></template>

<script>
import Vue from 'vue';

import TabBar from '@/components/TabBar/TabBar.vue';
import EventBus, { EventNames, } from '@/eventBuses/default';

// INDIVIDUAL TABS 
import Balance from './Balance/Balance.vue';
import Lending from './Lending/Lending.vue';
import Streaming from './Streaming/Streaming.vue';
import InterestRates from './InterestRates/InterestRates.vue';
import StakeSIGH from './StakeSIGH/StakeSIGH.vue';

export default {
  
  name: 'trade-pane',

  components: {
    TabBar,           // TAB-BAR : We emit events on tabBarEventBus (defined as vue component below in data() ) to change the tab
    Balance,
    Lending,         
    Streaming,
    InterestRates,
    StakeSIGH
  },

  data() {
    return {
      activeTab: 'Balance',
      tabs: {
        walletNotConnectedTabs: ['Balance','Lending','Streaming','Adjust Your Interest Rate','Stake SIGH'],
        walletConnectedTabs: ['Balance','Lending','Streaming','Adjust Your Interest Rate','Stake SIGH'],
      },
      height: 0,
      tabBarEventBus: new Vue(),
    };
  },

  updated() {
    this.height = this.$refs.tradePane.clientHeight;
  },

  mounted() {
    // We emit an event for Tab Bar event Bus, to change the Tab
    EventBus.$on(EventNames.userWalletConnected, () => this.tabBarEventBus.$emit('change-active-tab', 'Balance'));
    EventBus.$on(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
    userWalletDisconnectedListener() {
      this.activeTab = 'Balance';
      this.tabBarEventBus.$emit('change-active-tab', 'Balance');
    },
    this.height = this.$refs.tradePane.clientHeight;
  },

  methods: {
    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      let el = document.getElementsByClassName('trade-pane-content')[0];
      if (activeTab === 'Balance') {
        el.style.height = 'calc(100%)';
      } 
      else {
        el.style.height = 'calc(100%)';
      }
    },
  },

};
</script>


<style lang="scss" src="./style.scss" scoped></style>
