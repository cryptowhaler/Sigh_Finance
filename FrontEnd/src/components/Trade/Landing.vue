<template src='./template.html'></template>

<script>
import MarketView from './MarketView/MarketView.vue';
import TradeView from './TradeView/TradeView.vue';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
// import Positions from './TradeView/Positions/Positions.vue';
export default {
  components: {
    MarketView,
    TradeView,
    // Positions,
  },
  created() {
    // let self = this;
    // ExchangeDataEventBus.$emit('subscribe-exchange',this.$store.state.selectedExchange);
    
    // ExchangeDataEventBus.$on('exchange-connected', function() {  
    //   ExchangeDataEventBus.$emit('subscribe-exchange',self.$store.state.selectedExchange);
    //   ExchangeDataEventBus.$emit('setAvailableExchanges', 'binance');
    // });
  
  },
};
</script>
