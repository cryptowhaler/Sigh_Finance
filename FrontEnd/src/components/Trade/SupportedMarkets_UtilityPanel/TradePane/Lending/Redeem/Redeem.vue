<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import redeemQuantity from './quantity/redeemQuantity.vue';
import redeemAmount from './amount/redeemAmount.vue';

export default {
  name: 'Redeem',
  components: {
    TabBar,
    redeemQuantity,
    redeemAmount,
  },

  data() {
    return {
      activeTab: 'Quantity',
      tabs: [ 'Quantity','Amount',],
      height: 0,
      statusCode: '',
      preActive:'Quantity',
    };
  },
  
  methods: {
    activeTabChange(activeTab) {
      this.activeTab = activeTab;
    }, 
  },

};
</script>

<style lang="scss" src="./style.scss" scoped>
</style>
