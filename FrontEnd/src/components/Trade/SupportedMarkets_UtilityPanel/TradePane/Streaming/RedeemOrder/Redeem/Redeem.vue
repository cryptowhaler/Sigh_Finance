<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';
import {mapState,mapActions,} from 'vuex';

export default {
  name: 'Redeem-Order',

  data() {
    return {
      showConfirm: false,
      formData: {
        amount: undefined,
        RedeemAmount : undefined,
        SelectedMarketId : this.$store.state.selectedMarketId ,
        SelectedMarketSymbol: this.$store.state.selectedMarketSymbol,
        selectedMarketUnderlyingSymbol: this.$store.state.selectedMarketUnderlyingSymbol,
        selectedMarketUnderlyingPriceUSD: this.$store.state.selectedMarketUnderlyingPriceUSD,
        selectedMarketExchangeRate: this.$store.state.selectedMarketExchangeRate,
        selectedMarketunderlyingAddress : this.$store.state.underlyingAddress,            
      },
      showLoader: false,
    };
  },

  // watch: {
  //   formData: {
  //     handler: function() {
  //       this.getVegaStatus();   //getting status for exchange ()
  //     },
  //     deep: true,
  //   },
  // },

  created() {
    this.changeSelectedInstrument = (newMarket) => {       //Changing Selected Instrument
      this.formData.SelectedMarketId = newMarket.Id;
      this.formData.SelectedMarketSymbol = newMarket.symbol;
      this.formData.SelectedMarketUnderlyingSymbol = newMarket.underlyingSymbol;
      this.formData.selectedMarketUnderlyingPriceUSD = newMarket.underlyingPriceUSD;  
      this.formData.selectedMarketExchangeRate = newMarket.exchangeRate;        
      this.formData.selectedMarketunderlyingAddress = newMarket.underlyingAddress;     

      console.log( 'NEW SELECTED MARKET - ' + newMarket.Id);
    };
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);        
  },

  // computed: {

  //   estimatedPriceSell() {    //Used "width: (((Number(ask.totalVolume)/Number(maxVol))*308)) + '%'," to determine width of dynamic bars
  //     if (!this.formData.amount) {
  //       return '';
  //     }
  //     else {      
  //       return ((Number(this.formData.amount))*Number(this.$store.state.liveTradePrice)).toFixed(5);
  //     }
  //   },
  //   estimatedPriceBuy() {   
  //     if (!this.formData.amount) {
  //       return '';
  //     }
  //     else {      
  //       return ((Number(this.formData.amount))*Number(this.$store.state.liveTradePrice)).toFixed(5);
  //     }
  //   },
  // },

  methods: {

    ...mapActions(['market_Redeem']),
    
    async Redeem() {   //When we press make Borrow. Shows Loader
      console.log(this.formData.SelectedMarketId);
      console.log(this.formData.RedeemAmount);
      console.log(this.formData.SelectedMarketSymbol);
      console.log(this.formData.SelectedMarketUnderlyingSymbol);
      console.log(this.formData.selectedMarketUnderlyingPriceUSD);
      console.log(this.formData.selectedMarketExchangeRate);

      let result =  this.market_Redeem( { marketId: this.formData.SelectedMarketId , RedeemAmount: this.formData.RedeemAmount } );
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
    // ExchangeDataEventBus.$off('change-selected-instrument', this.changeVegaMarket);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
