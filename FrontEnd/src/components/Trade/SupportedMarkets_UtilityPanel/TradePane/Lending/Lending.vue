<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';

import Deposit from './Deposit/Deposit.vue';
import Redeem from './Redeem/Redeem.vue';
import Borrow from './Borrow/Borrow.vue';
import Repay from './Repay/Repay.vue';

import ExchangeDataEventBus from '@/eventBuses/exchangeData';

export default {

  name: 'Lending',
  
  components: {
    TabBar,
    Deposit,
    Redeem,
    Borrow,
    Repay,
  },

  data() {
    return {
      tabs: ['Deposit','Redeem','Borrow','Repay'],
      activeTab: 'Deposit ',
      preActive: 'Deposit',
      selectedInstrument: {},
    };
  },

  methods: {

    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      if (activeTab == 'Deposit') {
        this.$store.commit('changeInvestTab');
      } 
      else {
        this.$store.commit('changeHedgeTab');
      }
      if (this.preActive !== activeTab) {
        this.$root.$emit('tabChange', activeTab);
        this.preActive = activeTab;
      }
    },
     
    // Selecting an Instrument from dropdown
    updateSelectedInstrument() {
      console.log(this.selectedInstrument);
      this.$store.commit('addLoaderTask', 3, false);    
      this.$store.commit('updateSelectedInstrument',this.selectedInstrument);
      ExchangeDataEventBus.$emit('change-selected-instrument', {'instrument':this.selectedInstrument });    //TO CHANGE ORDER-BOOK/Supported-Money-Markets
    },
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
