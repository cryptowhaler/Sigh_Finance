<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import TabBar from '@/components/TabBar/TabBar.vue';

import yourAccount from './yourAccount/yourAccount.vue';
import anotherAccount from './anotherAccount/anotherAccount.vue';


export default {

  name: 'sighStream',

   components: {
    TabBar,
    anotherAccount,
    yourAccount,
  },

  data() {
    return {
      activeTab: 'Connected Account',
      tabs: ['Connected Account','Another Account'], 
      preActive:'Connected Account',
      selectedInstrument: {},
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
