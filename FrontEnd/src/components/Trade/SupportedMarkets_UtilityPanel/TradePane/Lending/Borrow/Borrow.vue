<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import borrowQuantity from './quantity/borrowQuantity.vue';
import borrowAmount from './amount/borrowAmount.vue';

export default {
  name: 'Borrow',

  components: {
    TabBar,
    borrowQuantity,
    borrowAmount,
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
