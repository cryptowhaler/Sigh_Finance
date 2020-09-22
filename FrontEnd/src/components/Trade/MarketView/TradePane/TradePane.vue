<template src="./template.html"></template>

<script>
import Vue from 'vue';
import TradeTab from './TradeTab/TradeTab.vue';
import TabBar from '@/components/TabBar/TabBar.vue';
import Ticker from './Ticker/Ticker.vue';
import Balance from './Balance/Balance.vue';
import LiveTrades from './../BookPane/LiveTrades/LiveTrades';
import EventBus, { EventNames, } from '@/eventBuses/default';

export default {
  name: 'trade-pane',
  components: {
    TabBar,
    TradeTab,
    Ticker,
    Balance,
    LiveTrades,
  },

  data() {
    return {
      activeTab: 'Account Events',
      tabs: {
        walletNotConnectedTabs: ['Supply / Borrow'],
        walletConnectedTabs: ['Account Events','Account Balance','Supply / Borrow',],
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
      this.tabBarEventBus.$emit('change-active-tab', 'Account Balance')
    );
    this.height = this.$refs.tradePane.clientHeight;
    EventBus.$on(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },

  methods: {
    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      let el = document.getElementsByClassName('trade-pane-content')[0];
      if (activeTab === 'Account Events') {
        el.style.height = 'calc(100%)';
      } 
      else {
        el.style.height = 'calc(100%)';
      }
    },

    userWalletDisconnectedListener() {
      this.activeTab = 'Account Events';
      this.tabBarEventBus.$emit('change-active-tab', 'Account Events');
    },
  },
  
};
</script>


<style lang="scss" src="./style.scss" scoped></style>
