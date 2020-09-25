<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';
import {mapState,mapActions,} from 'vuex';

export default {
  name: 'supply-order',
  components: {
  },

  data() {
    return {
      height: 0,
      statusCode: '',

      showConfirm: false,
      formData: {
        mintAmount : 0,
        SelectedMarketId : this.$store.state.selectedMarketId ,
        SelectedMarketSymbol: this.$store.state.selectedMarketSymbol,
        selectedMarketUnderlyingSymbol: this.$store.state.selectedMarketUnderlyingSymbol,
        selectedMarketUnderlyingPriceUSD: this.$store.state.selectedMarketUnderlyingPriceUSD,
        selectedMarketExchangeRate: this.$store.state.selectedMarketExchangeRate,

      },
      AmountPlaceholder: this.$store.state.selectedVegaMarketbaseNameTrade,      
      showLoader: false,
      statusCode: 'operational',
      watcher: '',
    };
  },


  created() {
    this.changeSelectedMarket = (newMarket) => {       //Changing Selected Vega Market
      this.formData.SelectedMarketId = newMarket.Id;
      this.formData.SelectedMarketSymbol = newMarket.symbol;
      this.formData.SelectedMarketUnderlyingSymbol = newMarket.underlyingSymbol;
      this.formData.selectedMarketUnderlyingPriceUSD = newMarket.underlyingPriceUSD;  
      this.formData.selectedMarketExchangeRate = newMarket.exchangeRate;        

      console.log( 'NEW SELECTED MARKET - ' + newMarket);
    };
    ExchangeDataEventBus.$on('change-selected-market', this.changeSelectedMarket);        
  },

  computed: {

    estimatedNoOfTokensMinted() {    //Used "width: (((Number(ask.totalVolume)/Number(maxVol))*308)) + '%'," to determine width of dynamic bars
      if (!this.formData.mintAmount) {
        return '';
      }
      else {      
        return ((Number(this.formData.mintAmount))*Number(this.$store.state.selectedMarketExchangeRate)).toFixed(5);
      }
    },
    estimatedMintValue() {   
      if (!this.formData.mintAmount) {
        return '';
      }
      else {      
        return ((Number(this.formData.mintAmount))*Number(this.$store.state.selectedMarketUnderlyingPriceUSD)).toFixed(5);
      }
    },
  },


  
  methods: {

    ...mapActions(['Market_approve','cERC20_mint']),


    async approve() {   
      console.log(this.formData.SelectedMarketId);
      console.log(this.formData.mintAmount);
      console.log(this.formData.SelectedMarketSymbol);
      console.log(this.formData.SelectedMarketUnderlyingSymbol);
      console.log(this.formData.selectedMarketUnderlyingPriceUSD);
      console.log(this.formData.selectedMarketExchangeRate);

      let result = await this.Market_approve( { marketId: this.formData.SelectedMarketId , amount: 1000000000 } );
      console.log(result);
      
      if (validationErrors.length) {
        this.$showErrorMsg({message: stringArrayToHtmlList(validationErrors),});
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
      let t1 = this.$store.getters.selectedSelectedMarketSymbolTrade;
      let t2 = this.$store.getters.selectedVegaMarketTradeId;
      // console.log( 'In Store ' + t1 + ' ' + t2); //checking market
      // console.log( 'In OrderPanel ' + this.formData.SelectedMarketSymbol+ ' ' + this.formData.vegaMarketId); //checking market
      //Make Call
      // const response = await  VegaProtocolService.submitOrder_market(this.formData.vegaMarketId,this.formData.amount,this.formData.bos,'MARKET','FOK');
      // setTimeout(() => {
      //   if(!response) {   //TimeOut Limit
      //     this.formData.amount = undefined;
      //     this.formData.price = undefined;
      //     this.showConfirm = false;
      //     this.$showErrorMsg({message: 'Timeout exceeded.',});
      //   }
      // },15000);
      // this.formData.amount = undefined;
      // this.formData.price = undefined;
      // this.showConfirm = false;

      // if (response.status == 200) {     //If Successful
      //   this.$showSuccessMsg({message: this.formData.SelectedMarketSymbol + ' - ' + response.message,});
      // } 
      // else {                          //If failed.
      //   this.$showErrorMsg({message: response.message,});
      // }
      this.showLoader = false;
    },




  },

};
</script>

<style lang="scss" src="./style.scss" scoped>
</style>
