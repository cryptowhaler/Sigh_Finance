<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import TradingView from './TradingView/TradingView.vue';
export default {
  name: 'price-pane',
  
  components: {
    TradingView,
  },

  data() {
    return {
      isTradingView: true,
    };
  },

  created() {
    this.subscribeExchangeListener = () => {
      this.isTradingView = false;
      setTimeout(() => (this.isTradingView = true), 10);
    };
    ExchangeDataEventBus.$on('change-symbol', this.subscribeExchangeListener);
    ExchangeDataEventBus.$on(
      'subscribe-exchange',
      this.subscribeExchangeListener
    );
  },

  destroyed() {
    ExchangeDataEventBus.$off('subscribe-exchange',this.subscribeExchangeListener);
  },

  methods: {},

};
</script>


<style lang="scss" src="./style.scss" scoped></style>
