<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import Borrow from './Borrow/Borrow.vue';
import RepayBorrow from './RepayBorrow/RepayBorrow.vue';
// import GTTOrder from './GTTOrder/GTTLimitOrder.vue';

// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
// import { stringArrayToHtmlList, } from '@/utils/utility';

export default {
  name: 'borrow-order',

  components: {
    TabBar,
    Borrow,
    RepayBorrow,
  },

  data() {
    return {
      activeTab: 'Borrow',
      tabs: [ 'Borrow','Repay Borrow',],
      height: 0,
      statusCode: '',
      preActive:'Borrow',
    };
  },
 
  methods: {

    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      if (activeTab === 'Borrow') {
        this.activeTab = 'Borrow';
        this.$store.commit('changeToLimitGTCTab');
      }
      if (activeTab === 'Repay Borrow') {
        this.activeTab = 'Repay Borrow';
        this.$store.commit('changeToLimitFOKTab');
      }
      if (activeTab === 'IOC') {
        this.activeTab = 'IOC';
        this.$store.commit('changeToLimitIOCTab');
      }
    },     
  },
};
</script>

<style lang="scss" src="./style.scss" scoped>
</style>
