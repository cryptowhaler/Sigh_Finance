<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';

import sighQuantity from './quantity/SighQuantity.vue';
import sighAmount from './amount/SighAmount.vue';
import infographics from './infographics/infographics.vue';

import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import EventBus, {EventNames,} from '@/eventBuses/default';

export default {

  name: 'StakeSIGH',
  
  components: {
    TabBar,
    sighQuantity,
    sighAmount,
    infographics,
  },

  data() {
    return {
      activeTab: 'Quantity',
      tabs: ['Quantity','Amount'],  // ,'Analytics'
      preActive:'Quantity',
      height: 0,
      statusCode: '',
    };
  },

  methods: {
    activeTabChange(activeTab) {
      this.activeTab = activeTab;
    }, 
  },
     
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
