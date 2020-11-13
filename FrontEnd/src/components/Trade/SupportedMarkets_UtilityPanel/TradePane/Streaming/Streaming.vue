<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';

import sighStream from './sighStream/sighStream.vue';
import interestStream from './interestStream/interestStream.vue';

export default {
  name: 'Streaming',

  components: {
    TabBar,
    sighStream,
    interestStream,
  },

  data() {
    return {
      activeTab: '$SIGH Stream',
      tabs: ['$SIGH Stream','Interest Stream'], 
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
      this.$store.commit('addLoaderTask', 3, false);    
      this.$store.commit('updateSelectedInstrument',this.selectedInstrument);
      ExchangeDataEventBus.$emit('change-selected-instrument', {'instrument':this.selectedInstrument });    
    }
  },  

     
};
</script>


<style lang="scss" src="./style.scss" scoped></style>
