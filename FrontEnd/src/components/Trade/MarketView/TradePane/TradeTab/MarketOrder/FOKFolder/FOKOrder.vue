<template src="./template.html"></template>

<script>
import VegaProtocolService from '@/services/VegaProtocolService';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';

export default {
  name: 'FOK-Order',

  data() {
    return {
      showConfirm: false,
      formData: {
        pair: 'BTC/USD',
        type: 'limit',
        exc: 'vegaProtocol',
        vegaMarketName: this.$store.state.selectedVegaMarketNameTrade,
        vegaMarketId: this.$store.state.selectedVegaMarketTradeId,
        bos: 'Buy',
        selectedmarketid: 'LBXRA65PN4FN5HBWRI2YBCOYDG2PBGYU',
        amount: undefined,        //amount
        price: undefined,         //price
        moe: 'market',
      },
      AmountPlaceholder: this.$store.state.selectedVegaMarketbaseNameTrade,      
      showLoader: false,
      statusCode: 'operational',
      watcher: '',
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
    this.changeVegaMarket = (newMarket) => {       //Changing Selected Vega Market
      this.formData.vegaMarketName = newMarket.Name;
      this.formData.vegaMarketId = newMarket.Id;
      // console.log(this.formData.vegaMarketId + ' ' + this.formData.vegaMarketName);
    };
    ExchangeDataEventBus.$on('change-vega-market', this.changeVegaMarket);        
  },

  computed: {

    estimatedPriceSell() {    //Used "width: (((Number(ask.totalVolume)/Number(maxVol))*308)) + '%'," to determine width of dynamic bars
      if (!this.formData.amount) {
        return '';
      }
      else {      
        return ((Number(this.formData.amount))*Number(this.$store.state.liveTradePrice)).toFixed(5);
      }
    },
    estimatedPriceBuy() {   
      if (!this.formData.amount) {
        return '';
      }
      else {      
        return ((Number(this.formData.amount))*Number(this.$store.state.liveTradePrice)).toFixed(5);
      }
    },
  },

  methods: {
    // pairChange() {
    //   this.$store.commit('addLoaderTask', 3, false);
    // ExchangeDataEventBus.$emit('change-symbol',this.$store.state.selectedPair);
    // },

    // getStatus() {
    //   this.statusCode = this.$store.getters.getVegaExchangeStatus;
    // },
    
    confirmTrade(buyOrSell) {   //Called when we press Buy/Sell. Performs validation. If valid, Confirm/Cancel buttons displayed.
      // console.log('Test1' + this.formData.amount);
      this.formData.bos = buyOrSell;
      let validationErrors = [];
      this.validateQty(validationErrors, 'Amount', this.formData.amount);
      if (validationErrors.length) {this.$showErrorMsg({message: stringArrayToHtmlList(validationErrors),});
      } 
      else {this.showConfirm = true;}
    },
    
    validateQty(errorsArray, placeholder, value) {    //Checks if the values entered are valid
      if (!value || Number(value) === 0) {errorsArray.push(`${placeholder} is required.`);
      } 
      else if ((value && Number.isNaN(Number(value))) || Number(value) < 0) {
        errorsArray.push(`${placeholder} is not valid.`);
      }
    },

    cancelTrade() {       //When we press Cancel button
      this.formData.amount = undefined;
      this.formData.price = undefined;
      this.showConfirm = false;
    },

    async makeTrade() {   //When we press make Trade. Shows Loader
      // console.log('FOK Test2 ' + this.formData.amount);
      this.showLoader = true;
      let t1 = this.$store.getters.selectedVegaMarketNameTrade;
      let t2 = this.$store.getters.selectedVegaMarketTradeId;
      // console.log( 'In Store ' + t1 + ' ' + t2); //checking market
      // console.log( 'In OrderPanel ' + this.formData.vegaMarketName+ ' ' + this.formData.vegaMarketId); //checking market
      //Make Call
      const response = await  VegaProtocolService.submitOrder_market(this.formData.vegaMarketId,this.formData.amount,this.formData.bos,'MARKET','FOK');
      setTimeout(() => {
        if(!response) {   //TimeOut Limit
          this.formData.amount = undefined;
          this.formData.price = undefined;
          this.showConfirm = false;
          this.$showErrorMsg({message: 'Timeout exceeded.',});
        }
      },15000);
      this.formData.amount = undefined;
      this.formData.price = undefined;
      this.showConfirm = false;

      if (response.status == 200) {     //If Successful
        this.$showSuccessMsg({message: this.formData.vegaMarketName + ' - ' + response.message,});
      } 
      else {                          //If failed.
        this.$showErrorMsg({message: response.message,});
      }
      this.showLoader = false;
    },
  },

  destroyed() {
    clearInterval(this.watcher);
    ExchangeDataEventBus.$off('change-vega-market', this.changeVegaMarket);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
