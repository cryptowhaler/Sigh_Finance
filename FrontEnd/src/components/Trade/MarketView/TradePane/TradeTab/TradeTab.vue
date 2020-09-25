<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import Supply from './Supply/Supply.vue';
import BorrowOrder from './BorrowOrder/BorrowOrder.vue';
import RedeemComponent from './RedeemOrder/RedeemOrder.vue';

import ExchangeDataEventBus from '@/eventBuses/exchangeData';

export default {
  name: 'trade-tab',
  components: {
    TabBar,
    Supply,
    BorrowOrder,
    RedeemComponent,
  },
  data() {
    return {
      activeTab: 'Supply ',
      selectedMarket: {},
      tabs: ['Supply ', 'Borrow ','Redeem'],
      preActive: 'Supply ',
    };
  },
  methods: {
    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      if (activeTab == 'Supply ') {
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
      this.$store.commit('selectedMarketId', this.selectedMarket.id );  //Name change (eq - ETHVUSD/DEC20)
      this.$store.commit('selectedMarketSymbol', this.selectedMarket.symbol );   //Selected market in TradeTab - ID Change
      this.$store.commit('selectedMarketUnderlyingSymbol', this.selectedMarket.underlyingSymbol );
      this.$store.commit('selectedMarketUnderlyingPriceUSD', this.selectedMarket.underlyingPriceUSD );
      this.$store.commit('selectedMarketExchangeRate', this.selectedMarket.exchangeRate );

      ExchangeDataEventBus.$emit('change-selected-market', {'symbol':this.selectedMarket.symbol,  'Id':this.selectedMarket.id,  'underlyingSymbol':this.selectedMarket.underlyingSymbol,    'underlyingPriceUSD':this.selectedMarket.underlyingPriceUSD,        'exchangeRate':this.selectedMarket.exchangeRate  });    //TO CHANGE ORDER-BOOK/Supported-Money-Markets
      // ExchangeDataEventBus.$emit('change-vega-header', {'Name':this.selectedMarket.data.name,'Summary':this.selectedMarket.data.instrument_name,}); //TO CHANGE HEADER LIVE FEED               
      // ExchangeDataEventBus.$emit('change-symbol',this.$store.state.selectedPair);
    },
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
