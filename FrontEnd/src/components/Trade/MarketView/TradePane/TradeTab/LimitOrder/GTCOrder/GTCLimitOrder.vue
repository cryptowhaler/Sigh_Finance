<template src="./template.html"></template>

<script>
import VegaProtocolService from '@/services/VegaProtocolService';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';

export default {
  name: 'GTC-Limit-Order',
  data() {
    return {
      showConfirm: false,
      formData: {
        pair: 'BTC/USD',
        type: 'limit',
        exc: 'vegaProtocol',
        vegaMarketName: this.$store.state.selectedVegaMarketName,
        vegaMarketId: this.$store.state.selectedVegaMarketId,
        bos: 'Buy',
        selectedmarketid: 'LBXRA65PN4FN5HBWRI2YBCOYDG2PBGYU',
        amount: undefined,        //amount
        price: undefined,         //price
        moe: 'market',
      },
      showLoader: false,
      statusCode: 'operational',
      watcher: '',
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
    this.changeVegaMarket = (newMarket) => {       //Changing Selected Vega Market
      this.formData.vegaMarketName = newMarket.Name;
      this.formData.vegaMarketId = newMarket.Id;
      // console.log(this.formData.vegaMarketId + ' ' + this.formData.vegaMarketName);
    };
    ExchangeDataEventBus.$on('change-vega-market', this.changeVegaMarket);        
  },

  // mounted() {
  //   this.watcher = setInterval(() => {this.getStatus();}, 5000);  //getting status for exchange () every 5 sec
  //   // ExchangeDataEventBus.$on('change-symbol', this.changeSymbol);
  //   // this.getStatus('auto');
  // },

  methods: {
    // pairChange() {
    //   this.$store.commit('addLoaderTask', 3, false);
    //   // // console.log(this.$store.getters.getSelectedPairExchanges, "lovish");
    //   // this.$store.commit('setAvailableExchanges');
    //   ExchangeDataEventBus.$emit('change-symbol',this.$store.state.selectedPair);
    // },
    // changeSymbol() {
    //   this.formData.exc = 'auto';
    // },
    // getStatus() {
    //   // if (exc === 'auto') {
    //   //   this.statusCode = this.$store.getters.getAutoStatus;
    //   // } else {
    //   this.statusCode = this.$store.getters.getVegaExchangeStatus;
    //   // }
    // },
    // async getFees() {
    //   this.fees.maker = fees.data.maker;
    //   this.fees.taker = fees.data.taker;
    // },
    confirmTrade(buyOrSell) {   //Called when we press Buy/Sell. Performs validation. If valid, Confirm/Cancel buttons displayed.
      this.formData.bos = buyOrSell;
      let validationErrors = [];
      this.validateQty(validationErrors, 'Amount', this.formData.amount);
      this.validateQty(validationErrors, 'Price', this.formData.price);
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
      let t1 = this.$store.getters.selectedVegaMarketName;
      let t2 = this.$store.getters.selectedVegaMarketId;
      // console.log( 'In Store ' + t1 + ' ' + t2); //checking market
      // console.log( 'In OrderPanel ' + this.formData.vegaMarketName+ ' ' + this.formData.vegaMarketId); //checking market
      //      this.formData.pair = this.$store.getters.selectedmarketid;    // Selected market ID
      //Make Call
      const response = await  VegaProtocolService.submitOrder_limit(this.formData.vegaMarketId,this.formData.amount,this.formData.bos,'LIMIT','GTC',parseInt(this.formData.price*100000), this.$store.state.selectedVegaMarketquoteName);
      setTimeout(() => {
        if(!response) {   //TimeOut Limit
          this.formData.amount = undefined;
          this.formData.price = undefined;
          this.showConfirm = false;
          this.showLoader = false;
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
