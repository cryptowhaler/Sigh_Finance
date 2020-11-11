<template src="./template.html"></template>

<script>
import Vue from 'vue';
import TradeTab from './TradeTab/TradeTab.vue';
import SwapTokens0xAPI from './SwapTokens0xAPI/SwapTokens0xAPI.vue';
import TabBar from '@/components/TabBar/TabBar.vue';
import Balance from './Balance/Balance.vue';
import EventBus, { EventNames, } from '@/eventBuses/default';

export default {
  name: 'trade-pane',
  components: {
    TabBar,
    TradeTab,
    Balance,
    SwapTokens0xAPI,
  },

  data() {
    return {
      activeTab: 'Supply / Borrow',
      tabs: {
        walletNotConnectedTabs: ['Supply / Borrow','Treasury Fund'],
        walletConnectedTabs: ['Supply / Borrow','Treasury Fund'],
      },
      height: 0,
      tabBarEventBus: new Vue(),
    };
  },

  updated() {
    this.height = this.$refs.tradePane.clientHeight;
  },

  mounted() {
    EventBus.$on(EventNames.userWalletConnected, () =>
      this.tabBarEventBus.$emit('change-active-tab', 'Supply / Borrow')
    );
    this.height = this.$refs.tradePane.clientHeight;
    EventBus.$on(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },

  methods: {
    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      let el = document.getElementsByClassName('trade-pane-content')[0];
      if (activeTab === 'Supply / Borrow') {
        el.style.height = 'calc(100%)';
      } 
      else {
        el.style.height = 'calc(100%)';
      }
    },

    userWalletDisconnectedListener() {
      this.activeTab = 'Supply / Borrow';
      this.tabBarEventBus.$emit('change-active-tab', 'Supply / Borrow');
    },
  },
  
};
</script>


<style lang="scss" src="./style.scss" scoped></style>
