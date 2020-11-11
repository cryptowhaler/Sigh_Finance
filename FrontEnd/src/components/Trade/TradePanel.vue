<template src='./template.html'></template>

<script>
import SupportedMarkets_UtilityPanel from './SupportedMarkets_UtilityPanel/SupportedMarkets_UtilityPanel.vue';
import Protocol_Infographics from './Protocol_Infographics/Protocol_Infographics.vue';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import FAQs from '@/components/FaqsContainer';

export default {
  components: {
    SupportedMarkets_UtilityPanel,
    Protocol_Infographics,
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
