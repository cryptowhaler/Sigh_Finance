<template src="./template.html"></template>


<script>
import TradePane from './TradePane/TradePane.vue';
import SupportedMoneyMarkets from './SupportedMoneyMarkets/SupportedMoneyMarkets.vue';

export default   {
  name: 'supported-markets_utility-panel',

  components : {
    TradePane,
    SupportedMoneyMarkets,
  },


  created() {  
    console.log('IN CREATED supported-markets_utility-panel File');
  },


  data() {
    return {
      height: 0,
    }
  },

  updated() {
    this.height = this.$refs.stockChart.clientHeight;
  },

  mounted() {
        this.height = this.$refs.stockChart.clientHeight;
  },

  methods :{

  },

};
</script>

<style lang="scss" src='./style.scss'></style>
