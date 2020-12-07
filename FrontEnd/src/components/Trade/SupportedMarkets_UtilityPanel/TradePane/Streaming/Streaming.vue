<template src="./template.html"></template>

<script>
import EventBus, {EventNames,} from '@/eventBuses/default';
import TabBar from '@/components/TabBar/TabBar.vue';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';

import sighLiquidityStream from './sighLiquidityStream/sighLiquidityStream.vue';
import sighBorrowingStream from './sighBorrowingStream/sighBorrowingStream.vue';
import interestStream from './interestStream/interestStream.vue';

export default {
  name: 'Streaming',

  components: {
    TabBar,
    sighLiquidityStream,
    sighBorrowingStream,
    interestStream,
  },

  data() {
    return {
      activeTab: '$SIGH Liquidity Stream',
      tabs: ['$SIGH Liquidity Stream','$SIGH Borrowing Stream','Interest Stream'], 
      preActive:'$SIGH Stream',
      selectedInstrument: {},
      height: 0,
      statusCode: '',
    };
  },

  methods: {

    activeTabChange(activeTab) {
      this.activeTab = activeTab;
    }, 
 
    // Selecting an Instrument from dropdown
    updateSelectedInstrument() {
      console.log(this.selectedInstrument);
      this.$store.commit('updateSelectedInstrument',this.selectedInstrument);
      ExchangeDataEventBus.$emit(EventNames.changeSelectedInstrument, {'instrument':this.selectedInstrument });    
    }
  },  

     
};
</script>


<style lang="scss" src="./style.scss" scoped></style>
