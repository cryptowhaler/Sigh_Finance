<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';
import {mapState,mapActions,} from 'vuex';

export default {
  name: 'Borrow',
  data() {
    return {
      showConfirm: false,
      formData: {
        amount: undefined,
        BorrowAmount : undefined,
        SelectedMarketId : this.$store.state.selectedMarketId ,
        SelectedMarketSymbol: this.$store.state.selectedMarketSymbol,
        selectedMarketUnderlyingSymbol: this.$store.state.selectedMarketUnderlyingSymbol,
        selectedMarketUnderlyingPriceUSD: this.$store.state.selectedMarketUnderlyingPriceUSD,
        selectedMarketExchangeRate: this.$store.state.selectedMarketExchangeRate,
      },
      showLoader: false,
    };
  },

  // watch: {
  //   formData: {
  //     handler: function() {
  //       this.getStatus();   //getting status for exchange ()
  //     },
  //     deep: true,
  //   },
  // },
  
  created() {
    this.changeSelectedMarket = (newMarket) => {       //Changing Selected Vega Market
      this.formData.SelectedMarketId = newMarket.Id;
      this.formData.SelectedMarketSymbol = newMarket.symbol;
      this.formData.SelectedMarketUnderlyingSymbol = newMarket.underlyingSymbol;
      this.formData.selectedMarketUnderlyingPriceUSD = newMarket.underlyingPriceUSD;  
      this.formData.selectedMarketExchangeRate = newMarket.exchangeRate;        

      console.log( 'NEW SELECTED MARKET - ' + newMarket.Id);
    };
    ExchangeDataEventBus.$on('change-selected-market', this.changeSelectedMarket);        
  },




  // computed: {
  //   estimatedNoOfTokensMinted() {    //Used "width: (((Number(ask.totalVolume)/Number(maxVol))*308)) + '%'," to determine width of dynamic bars
  //     if (!this.formData.BorrowAmount) {
  //       return '';
  //     }
  //     else {      
  //       return ((Number(this.formData.BorrowAmount))*Number(this.$store.state.selectedMarketExchangeRate)).toFixed(5);
  //     }
  //   },
  //   estimatedMintValue() {   
  //     if (!this.formData.BorrowAmount) {
  //       return '';
  //     }
  //     else {      
  //       return ((Number(this.formData.BorrowAmount))*Number(this.$store.state.selectedMarketUnderlyingPriceUSD)).toFixed(5);
  //     }
  //   },
  // },


  methods: {

    ...mapActions(['market_Borrow']),
    
    async Borrow() {   //When we press make Borrow. Shows Loader
      console.log(this.formData.SelectedMarketId);
      console.log(this.formData.BorrowAmount);
      console.log(this.formData.SelectedMarketSymbol);
      console.log(this.formData.SelectedMarketUnderlyingSymbol);
      console.log(this.formData.selectedMarketUnderlyingPriceUSD);
      console.log(this.formData.selectedMarketExchangeRate);

      let result =  this.market_Borrow( { marketId: this.formData.SelectedMarketId , BorrowAmount: this.formData.BorrowAmount } );
      console.log(result);

      // if (response.status == 200) {     //If Successful
      //   this.$showSuccessMsg({message: this.formData.SelectedMarketSymbol + ' - ' + response.message,});
      // } 
      // else {                          //If failed.
      //   this.$showErrorMsg({message: response.message,});
      // }
      this.showLoader = false;
    },



  },

  destroyed() {
    // clearInterval(this.watcher);
    // ExchangeDataEventBus.$off('change-selected-market', this.changeVegaMarket);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
