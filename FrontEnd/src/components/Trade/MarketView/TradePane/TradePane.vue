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
      activeTab: 'Ticker',
      tabs: {
        notLoggedInTabs: ['Ticker',],
        loggedInTabs: ['Ticker','Balance','Trade',],
      },
      height: 0,
      tabBarEventBus: new Vue(),
    };
  },

  updated() {
    this.height = this.$refs.tradePane.clientHeight;
  },

  mounted() {
    EventBus.$on(EventNames.userLogin, () =>
      this.tabBarEventBus.$emit('change-active-tab', 'Balance')
    );
    this.height = this.$refs.tradePane.clientHeight;
    EventBus.$on(EventNames.userLogout, this.userLogoutListener);
  },

  methods: {
    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      let el = document.getElementsByClassName('trade-pane-content')[0];
      if (activeTab === 'Ticker') {
        el.style.height = 'calc(50% - 15px)';
      } 
      else {
        el.style.height = 'auto';
      }
    },

    userLogoutListener() {
      this.activeTab = 'Ticker';
      this.tabBarEventBus.$emit('change-active-tab', 'Ticker');
    },
  },
  
};
</script>


<style lang="scss" src="./style.scss" scoped></style>
