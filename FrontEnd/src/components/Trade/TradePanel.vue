<template src='./template.html'></template>

<script>
import MarketView from './MarketView/MarketView.vue';
import TradeView from './TradeView/TradeView.vue';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Positions from './TradeView/Positions/Positions.vue';
import FAQs from '@/components/FaqsContainer';

export default {
  components: {
    MarketView,
    TradeView,
    Positions,
    faqs: FAQs,
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

 <style src="./style.scss" lang="scss"  scoped></style>
