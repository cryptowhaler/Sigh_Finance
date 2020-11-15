<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
import gql from 'graphql-tag';
import {mapState,mapActions,} from 'vuex';

export default {
  name: 'Supported-Money-Markets',

  components: {
    Spinner,
  },

  props: {
    parentHeight: Number,   //communicated to parent
  },

  data() {
    return {
      instruments: [],      
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

  created() {
    console.log(" IN Supported-Money-Markets Created Function");
    // this.instruments = this.$store.state.supportedInstruments;
    // this.updateLocalInstrumentStates();
  },

  methods: {

    updateLocalInstrumentStates() {
      let array = this.$store.state.supportedInstruments;
      // for (let i=0;i < array.length;i++ ) {
      //   let cur_instrument = {};
      //   console.log(array);
        // cur_instrument.symbol = array[i].symbol;
        // cur_instrument.totalSupply = array[i].globalBalances.totalLiquidity;
        // cur_instrument.totalSupplyWorth = Number(array[i].globalBalances.totalLiquidity) * Number( array[i].price ) / Number(array[i].pricedecimals)  ;
        // cur_instrument.totalBorrow = array[i].globalBalances.totalBorrows;
        // cur_instrument.totalBorrowWorth = Number(array[i].globalBalances.totalBorrows) * Number( array[i].price ) / Number(array[i].pricedecimals)  ;
        // cur_instrument.supplyAPY = array[i].globalBalances.liquidityRate;
        // cur_instrument.stableBorrowAPY = array[i].globalBalances.stableBorrowRate;
        // cur_instrument.variableBorrowAPY = array[i].globalBalances.variableBorrowRate;
        // cur_instrument.sighYieldSuppliers =  0; //array.symbol;
        // cur_instrument.sighYieldBorrowers =  0; // array.symbol;
        // this.instruments.push(cur_instrument);
      // }
    },

  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
