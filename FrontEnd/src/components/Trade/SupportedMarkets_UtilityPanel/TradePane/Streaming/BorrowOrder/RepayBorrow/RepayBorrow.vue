<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';
import {mapState,mapActions,} from 'vuex';


export default {
  name: 'Repay-Borrow',
  data() {
    return {
      showConfirm: false,
      formData: {
        amount: undefined,
        RepayBorrowAmount : undefined,
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
  //       this.getStatus();   //getting status for exchange ()
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


  // mounted() {
  //   this.watcher = setInterval(() => {this.getStatus();}, 5000);  //getting status for exchange () every 5 sec
  //   // ExchangeDataEventBus.$on('change-symbol', this.changeSymbol);
  //   // this.getStatus('auto');
  // },

  methods: {

    ...mapActions(['market_Repay_Borrow','Market_approve']),
    
    async RepayBorrow() {   //When we press make Borrow. Shows Loader
      console.log(this.formData.SelectedMarketId);
      console.log(this.formData.RepayBorrowAmount);
      console.log(this.formData.SelectedMarketSymbol);
      console.log(this.formData.SelectedMarketUnderlyingSymbol);
      console.log(this.formData.selectedMarketUnderlyingPriceUSD);
      console.log(this.formData.selectedMarketExchangeRate);

      let result =  this.market_Repay_Borrow( { marketId: this.formData.SelectedMarketId , RepayBorrowAmount: this.formData.RepayBorrowAmount } );
      console.log(result);
      this.showLoader = false;
    },

    async Approve() {   //When we press make Borrow. Shows Loader
      console.log(this.formData.SelectedMarketId);
      console.log(this.formData.SupplyAmount);
      console.log(this.formData.SelectedMarketSymbol);
      console.log(this.formData.SelectedMarketUnderlyingSymbol);
      console.log(this.formData.selectedMarketUnderlyingPriceUSD);
      console.log(this.formData.selectedMarketExchangeRate);
      console.log(this.formData.selectedMarketunderlyingAddress);

      this.Market_approve( { contractAddress:this.formData.selectedMarketunderlyingAddress , sender: this.formData.SelectedMarketId , amount: this.formData.RepayBorrowAmount } );
      console.log(result);
      this.showLoader = false;
    },
    


  },

  destroyed() {
    clearInterval(this.watcher);
    ExchangeDataEventBus.$off('change-selected-instrument', this.changeVegaMarket);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
