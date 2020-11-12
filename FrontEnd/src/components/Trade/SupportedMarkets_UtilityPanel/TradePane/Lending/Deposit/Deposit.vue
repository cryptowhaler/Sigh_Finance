<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import depositQuantity from './quantity/depositQuantity.vue';
import depositAmount from './amount/depositAmount.vue';

export default {
  
  name: 'Deposit',

  components: {
    TabBar,
    depositQuantity,
    depositAmount,
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
