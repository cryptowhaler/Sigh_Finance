<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';
import {mapState,mapActions,} from 'vuex';

export default {
  name: 'Swap-Tokens-0xAPI',
  data() {
    return {
      showConfirm: false,
      formData: {
        SellMarketSymbol: undefined,
        SellMarketAddress: undefined,
        BuyMarketSymbol: undefined,
        BuyMarketAddress: undefined,
        SellAmount: undefined,
        BuyAmount: undefined,
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

    ...mapActions(['treasuryTokenSwapAPICall','treasuryTokenSwap']),


    async getQuotes() {  
      console.log(this.formData.SellMarketSymbol);
      console.log(this.formData.SellMarketAddress);
      console.log(this.formData.BuyMarketSymbol);
      console.log(this.formData.BuyMarketAddress);
      console.log(this.formData.SellAmount);
      console.log(this.formData.BuyAmount);          

      let result_1 =  this.treasuryTokenSwapAPICall( { sellTokenAddress: this.formData.SellMarketAddress , buyTokenAddress: this.formData.BuyMarketAddress, 
                                                        sellAmount_ : this.formData.sellAmount, buyAmount_: this.formData.BuyAmount } );
      console.log(result_1);

      // let result_2 =  this.treasuryTokenSwap( { sellToken: this.formData.SellMarketAddress , buyToken: this.formData.BuyMarketAddress, 
      //                                                   sellAmount : this.formData.sellAmount, buyAmount: this.formData.BuyAmount } );
      // console.log(result_2);


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
