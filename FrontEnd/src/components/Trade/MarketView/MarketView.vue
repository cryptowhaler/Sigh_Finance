<template src="./template.html"></template>


<script>
// import PricePane from './PricePane/PricePane.vue';
import TradePane from './TradePane/TradePane.vue';
import BookPane from './BookPane/BookPane.vue';
import SupportedMoneyMarkets from './BookPane/SupportedMoneyMarkets/SupportedMoneyMarkets.vue';

export default   {
  name: 'market-view',

  components : {
    // PricePane,
    TradePane,
    BookPane,
    SupportedMoneyMarkets,
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
    sidebarTrigger(id) {
      switch(id) {
        case '1':
          this.$store.commit('toggleTradePaneClosed');
          break;
        case '2':
          this.$store.commit('toggleBookPaneClosed');
          break;
        
      }
    },
  },
};
</script>

<style lang="scss" src='./style.scss'></style>
