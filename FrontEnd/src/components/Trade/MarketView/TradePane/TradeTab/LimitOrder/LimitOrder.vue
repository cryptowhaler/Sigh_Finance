<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import IOCLimitOrder from './IOCOrder/IOCLimitOrder.vue';
import FOKLimitOrder from './FOKOrder/FOKLimitOrder.vue';
import GTCLimitOrder from './GTCOrder/GTCLimitOrder.vue';
// import GTTOrder from './GTTOrder/GTTLimitOrder.vue';

// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
// import { stringArrayToHtmlList, } from '@/utils/utility';

export default {
  name: 'limit-order',

  components: {
    TabBar,
    IOCLimitOrder,
    FOKLimitOrder,
    GTCLimitOrder,
  },

  data() {
    return {
      activeTab: 'GTC',
      tabs: [ 'GTC','FOK','IOC',],
      height: 0,
      statusCode: '',
      preActive:'GTC',
    };
  },
 
  methods: {
    getStatus(exc) {
      if (exc === 'auto') {
        this.statusCode = this.$store.getters.getAutoStatus;
      } else {
        this.statusCode = this.$store.getters[`get${exc}OrderStatus`];
      }
    },
    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      if (activeTab === 'GTC') {
        this.activeTab = 'GTC';
        this.$store.commit('changeToLimitGTCTab');
      }
      if (activeTab === 'FOK') {
        this.activeTab = 'FOK';
        this.$store.commit('changeToLimitFOKTab');
      }
      if (activeTab === 'IOC') {
        this.activeTab = 'IOC';
        this.$store.commit('changeToLimitIOCTab');
      }
      // if (this.preActive !== activeTab) {
      //   this.$root.$emit('MarketTabChange', activeTab);
      //   this.preActive = activeTab;
      // }
    },     
  },
};
</script>

<style lang="scss" src="./style.scss" scoped>
</style>
