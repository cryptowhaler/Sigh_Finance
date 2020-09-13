<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import IOCOrder from './IOCFolder/IOCOrder.vue';
import FOKOrder from './FOKFolder/FOKOrder.vue';

export default {
  name: 'market-order',
  components: {
    TabBar,
    IOCOrder,
    FOKOrder,
  },

  data() {
    return {
      activeTab: 'Invest',
      tabs: [ 'Invest','Withdraw',],
      height: 0,
      statusCode: '',
      preActive:'Invest',
    };
  },
  
  methods: {
    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      if (activeTab === 'Invest') {
        this.$store.commit('changeInvest_Invest_Tab');
      } else {
        this.$store.commit('changeInvest_Withdraw_Tab');
      }
      if (this.preActive !== activeTab) {
        this.$root.$emit('MarketTabChange', activeTab);
        this.preActive = activeTab;
      }
    }, 

    getStatus(exc) {
      if (exc === 'auto') {
        this.statusCode = this.$store.getters.getAutoStatus;
      } else {
        this.statusCode = this.$store.getters[`get${exc}OrderStatus`];
      }
    },
  },

};
</script>

<style lang="scss" src="./style.scss" scoped>
</style>
