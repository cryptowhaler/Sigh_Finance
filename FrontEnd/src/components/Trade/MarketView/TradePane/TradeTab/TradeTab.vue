<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import MarketOrder from './MarketOrder/MarketOrder.vue';
import LimitOrder from './LimitOrder/LimitOrder.vue';
// import StopLimitOrder from './StopLimitOrder/StopLimitOrder.vue';
// import StopMarketOrder from './StopMarketOrder/StopMarketOrder.vue';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';

export default {
  name: 'trade-tab',
  components: {
    TabBar,
    MarketOrder,
    LimitOrder,
  },
  data() {
    return {
      activeTab: 'Invest',
      selectedMarket: {},
      tabs: ['Invest', 'Hedge',],
      preActive: 'Hedge',
    };
  },
  methods: {
    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      if (activeTab == 'Invest') {
        this.$store.commit('changeInvestTab');
      } else {
        this.$store.commit('changeHedgeTab');
      }
      if (this.preActive !== activeTab) {
        this.$root.$emit('tabChange', activeTab);
        this.preActive = activeTab;
      }
    },
    // Changing Selected Pair from dropdown
    marketChange() {
      // console.log(this.selectedMarket);
      this.$store.commit('addLoaderTask', 3, false);
      this.$store.commit('changeSelectedVegaMarketNameTrade', this.selectedMarket.data.name );  //Name change (eq - ETHVUSD/DEC20)
      this.$store.commit('changeSelectedVegaMarketTradeId', this.selectedMarket.id );   //Selected market in TradeTab - ID Change
      this.$store.commit('changeSelectedVegaMarketbaseNameTrade', this.selectedMarket.baseName );
      this.$store.commit('changeSelectedVegaMarketquoteNameTrade', this.selectedMarket.quoteName );
      this.$store.commit('changeSelectedVegaMarketSummaryTrade',this.selectedMarket.data.instrument_name);
      // console.log(this.$store.getters.selectedVegaMarketNameTrade);
      // console.log(this.$store.getters.selectedVegaMarketTradeId);
      // console.log(this.$store.getters.selectedVegaMarketSummaryTrade);
      // console.log(this.$store.getters.selectedVegaMarketbaseNameTrade);
      // console.log(this.$store.getters.selectedVegaMarketquoteNameTrade);
      ExchangeDataEventBus.$emit('change-vega-market', {'Name':this.selectedMarket.data.name,'Id':this.selectedMarket.id,});    //TO CHANGE ORDER-BOOK/LIVE-TRADES
      this.$store.commit('changeSelectedVegaMarketSummary', this.selectedMarket.data.instrument_name);      //TO CHANGE HEADER
      this.$store.commit('changeSelectedVegaMarketquoteName', this.selectedMarket.quoteName);   //Displayed in header and order book live feed
      ExchangeDataEventBus.$emit('change-vega-header', {'Name':this.selectedMarket.data.name,'Summary':this.selectedMarket.data.instrument_name,}); //TO CHANGE HEADER LIVE FEED               

      // ExchangeDataEventBus.$emit('change-symbol',this.$store.state.selectedPair);
    },
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
