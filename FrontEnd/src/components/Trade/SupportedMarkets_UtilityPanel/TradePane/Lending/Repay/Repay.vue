<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import repayQuantity from './quantity/repayQuantity.vue';
import repayAmount from './amount/repayAmount.vue';

export default {

  name: 'Repay',

  components: {
    TabBar,
    repayQuantity,
    repayAmount,
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
