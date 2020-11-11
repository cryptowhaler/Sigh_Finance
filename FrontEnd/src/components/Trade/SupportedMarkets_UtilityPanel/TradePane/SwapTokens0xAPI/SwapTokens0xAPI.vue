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
      response: {
        data: undefined,
        allowanceTarget: undefined,
        to: undefined,
        buyAddress: undefined,
        sellAddress: undefined,
        guaranteedPrice: undefined,
        price: undefined,
        buyAmount: undefined,
        sellAmount: undefined,
        gasPrice: undefined,
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

    ...mapActions(['treasuryTokenSwapAPICall','treasuryTokenSwapTrade']),


    async getQuotes() {  
      console.log(this.formData.SellMarketSymbol);
      console.log(this.formData.SellMarketAddress);
      console.log(this.formData.BuyMarketSymbol);
      console.log(this.formData.BuyMarketAddress);
      console.log(this.formData.SellAmount);
      console.log(this.formData.BuyAmount);  
      if (this.formData.SellAmount == '') {
        this.formData.SellAmount = undefined;
      }
      if (this.formData.BuyAmount == '') {
        this.formData.BuyAmount = undefined;
      }

      const result_1 = await this.treasuryTokenSwapAPICall( { sellTokenAddress: this.formData.SellMarketAddress , buyTokenAddress: this.formData.BuyMarketAddress, 
                                                        sellAmount_ : this.formData.SellAmount, buyAmount_: this.formData.BuyAmount } );
      console.log(result_1);

      if ( result_1.data ) {
        this.response.data = result_1.data;
        this.response.allowanceTarget = result_1.allowanceTarget;
        this.response.to = result_1.to;
        this.response.buyAddress = result_1.buyTokenAddress;
        this.response.sellAddress = result_1.sellTokenAddress;
        this.response.price = result_1.price;
        this.response.guaranteedPrice = result_1.guaranteedPrice;
        this.response.buyAmount = result_1.buyAmount;
        this.response.sellAmount = result_1.sellAmount;
        this.response.gasPrice = result_1.gasPrice ,
        console.log(this.response);
      }
      else {
        this.response.data = undefined;
        this.response.allowanceTarget = undefined;
        this.response.to = undefined;
        this.response.buyAddress = undefined;
        this.response.sellAddress = undefined;
        this.response.price = undefined;
        this.response.guaranteedPrice = undefined;
        this.response.buyAmount = undefined;
        this.response.sellAmount = undefined;
        this.response.gasPrice = undefined;
      }
      // if (response.status == 200) {     //If Successful
      //   this.$showSuccessMsg({message: this.formData.SelectedMarketSymbol + ' - ' + response.message,});
      // } 
      // else {                          //If failed.
      //   this.$showErrorMsg({message: response.message,});
      // }
      this.showLoader = false;
    },

    async ExecuteTrade() {
      
      console.log(this.response.allowanceTarget);
      const response = await this.treasuryTokenSwapTrade( { allowanceTarget: this.response.allowanceTarget , to: this.response.to, 
                                                        callDataHex : this.response.data, token_bought: this.response.buyAddress,
                                                        token_sold: this.response.sellAddress  , sellAmount: this.response.sellAmount  
                                                        , gasPrice_: this.response.gasPrice } );

      console.log(response);

    }



  },

  destroyed() {
    // clearInterval(this.watcher);
    // ExchangeDataEventBus.$off('change-selected-market', this.changeVegaMarket);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
