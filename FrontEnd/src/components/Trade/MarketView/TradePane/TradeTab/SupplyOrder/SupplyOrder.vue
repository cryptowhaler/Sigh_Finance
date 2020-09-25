<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import Supply from './Supply/Supply.vue';

// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
// import { stringArrayToHtmlList, } from '@/utils/utility';

export default {
  name: 'supply-order',

  components: {
    TabBar,
    Supply,
  },

  data() {
    return {
      activeTab: 'Supply',
      tabs: [ 'Supply'],
      height: 0,
      statusCode: '',
      preActive:'Supply',
    };
  },
 
  methods: {

    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      if (activeTab === 'Supply') {
        this.activeTab = 'Supply';
        // this.$store.commit('changeToLimitGTCTab');
      }
    },     
  },
};
</script>

<style lang="scss" src="./style.scss" scoped>
</style>
