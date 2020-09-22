<template src="./template.html"></template>

<script>
import Spinner from '@/components/Spinner/Spinner.vue';
import { dateToDisplayDateTime, } from '@/utils/utility';
import EventBus, { EventNames, } from '@/eventBuses/default';

export default {
  name: 'vega-trading-history',
  components: {
    Spinner,
  },
  data() {
    return {
      history: [],
      spinnerFlag: true,
      sortBy: 0,
      searchString: '',
      initialData: [],
      displayText: 'Note: This feature is currently not supported with Trade-Alogs (Beta Version)',
    };
  },

  // async created() {
  //   this.updateData();
  // },

  watch: {
    searchString: function() {
      this.updateData();
    },
  },

  created() {
    this.userwalletConnected = () => this.getRecentTrades();
    this.userLogoutListener = () => this.setTradesEmpty();
    EventBus.$on(EventNames.userLogin, this.userwalletConnected);
    EventBus.$on(EventNames.userLogout, this.userLogoutListener);
    EventBus.$on(EventNames.pubKeyChanged,this.userwalletConnected);  //to handle change in pubKey        
  },


  methods: {

    getRecentTrades() {
      // console.log('ksnvrnv.sv jkrbvukd.rbvjfkbjd');
      this.history = this.$store.getters.recentTrades;
      // console.log(this.history);
    },

    setTradesEmpty() {
      this.history = [];
    },

    formatDateTime(timestamp) {
      return dateToDisplayDateTime(new Date(timestamp));
    },
    updateData() {
      this.history = this.initialData.filter((ele) => {
        return ele.Pair.includes(this.searchString.toUpperCase()) || ele.ORDER_ID.toString().includes(this.searchString) || ele.id.toString().includes(this.searchString) ;
      });
      this.history = this.sortData(this.history);
    },
    sortData(data) {
      switch(this.sortBy) {
        case 0: 
          return data.reverse();
        case 1: 
          return data;
        case 101: 
          return data.sort((b,a) => {
            return a.ORDER_PRICE - b.ORDER_PRICE;
          });
        case 102: 
          return data.sort((b,a) => {
            return b.ORDER_PRICE - a.ORDER_PRICE;
          });
        case 201: 
          return data.sort((b,a) => {
            return a.EXEC_AMOUNT - b.EXEC_AMOUNT;
          });
        case 202: 
          return data.sort((b,a) => {
            return b.EXEC_AMOUNT - a.EXEC_AMOUNT;
          });
        case 301: 
          return data.sort((b,a) => {
            return a.EXEC_PRICE - b.EXEC_PRICE;
          });
        case 302: 
          return data.sort((b,a) => {
            return b.EXEC_PRICE - a.EXEC_PRICE;
          });
        // case 301: 
        //   return data.sort((b,a) => {
        //     return a.MTS_CREATE - b.MTS_CREATE;
        //   });
        // case 302: 
        //   return data.sort((b,a) => {
        //     return b.MTS_CREATE - a.MTS_CREATE;
        //   });
      }
    },
    sortDataBy(value) {
      if(this.sortBy === value) {
        this.sortBy += 1;
      } else {
        this.sortBy = value;
      }
      this.updateData();
    },
  },

  destroyed() {
    EventBus.$off(EventNames.userLogin, this.userwalletConnected);
    EventBus.$off(EventNames.userLogout, this.userLogoutListener);
    EventBus.$on(EventNames.pubKeyChanged,this.userwalletConnected);  //to handle change in pubKey        
  },

};
</script>
<style lang="scss" src="./style.scss" scoped>
</style>


