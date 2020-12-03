<template src="./template.html"></template>

<script>
import EventBus, { EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
import MoneyMarketGlobalStates from './MoneyMarketsGlobalStates/MoneyMarketsGlobalStates.vue';
import MoneyMarketConfigs from './MoneyMarketsConfig/MoneyMarketsConfigs.vue';
import MoneyMarketSIGHState from './MoneyMarketsSIGHState/MoneyMarketsSIGHState.vue';

export default {
  name: 'Supported-Money-Markets',


  components: {
    Spinner,
    MoneyMarketGlobalStates,
    MoneyMarketConfigs,
    MoneyMarketSIGHState
  },


  props: {
    parentHeight: Number,   //communicated to parent
  },



  data() {
    return {
      tableHeight: '',
      showLoader:false,
    };
  },




  watch: {
    parentHeight: function(newVal) {
      let calcHeight = newVal;
      this.tableHeight = 'calc(100vh - ' + (calcHeight  + 100) + 'px';
    },
  },




  async created() {
  },





  mounted() {
  },

  methods: {
  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
