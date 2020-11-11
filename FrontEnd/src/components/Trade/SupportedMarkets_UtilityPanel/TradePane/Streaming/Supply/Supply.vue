<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';
import {mapState,mapActions,} from 'vuex';

export default {
  name: 'Supply',
  data() {
    return {
      showConfirm: false,
      formData: {
        amount: undefined,
        SupplyAmount : undefined,
        SelectedMarketId : this.$store.state.selectedMarketId ,
        SelectedMarketSymbol: this.$store.state.selectedMarketSymbol,
        selectedMarketUnderlyingSymbol: this.$store.state.selectedMarketUnderlyingSymbol,
        selectedMarketUnderlyingPriceUSD: this.$store.state.selectedMarketUnderlyingPriceUSD,
        selectedMarketExchangeRate: this.$store.state.selectedMarketExchangeRate,
        selectedMarketunderlyingAddress: this.$store.state.underlyingAddress,

      },
      showLoader: false,
      showApproveButton: true,
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

      this.showApproveButton = this.marketIsApproved( newMarket.underlyingAddress, newMarket.Id );
      console.log(this.showApproveButton);
    };
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);        
  },




  // computed: {
  //   estimatedNoOfTokensMinted() {    //Used "width: (((Number(ask.totalVolume)/Number(maxVol))*308)) + '%'," to determine width of dynamic bars
  //     if (!this.formData.SupplyAmount) {
  //       return '';
  //     }
  //     else {      
  //       return ((Number(this.formData.SupplyAmount))*Number(this.$store.state.selectedMarketExchangeRate)).toFixed(5);
  //     }
  //   },
  //   estimatedMintValue() {   
  //     if (!this.formData.SupplyAmount) {
  //       return '';
  //     }
  //     else {      
  //       return ((Number(this.formData.SupplyAmount))*Number(this.$store.state.selectedMarketUnderlyingPriceUSD)).toFixed(5);
  //     }
  //   },
  // },


  methods: {

    ...mapActions(['market_mint','Market_approve','marketIsApproved']),
    
    async Supply() {   //When we press make Borrow. Shows Loader
      console.log(this.formData.SelectedMarketId);
      console.log(this.formData.SupplyAmount);
      console.log(this.formData.SelectedMarketSymbol);
      console.log(this.formData.SelectedMarketUnderlyingSymbol);
      console.log(this.formData.selectedMarketUnderlyingPriceUSD);
      console.log(this.formData.selectedMarketExchangeRate);

      let result =  this.market_mint( { marketId: this.formData.SelectedMarketId , mintAmount: this.formData.SupplyAmount } );
      console.log(result);

      // if (response.status == 200) {     //If Successful
      //   this.$showSuccessMsg({message: this.formData.SelectedMarketSymbol + ' - ' + response.message,});
      // } 
      // else {                          //If failed.
      //   this.$showErrorMsg({message: response.message,});
      // }
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

      this.Market_approve( { contractAddress:this.formData.selectedMarketunderlyingAddress , sender: this.formData.SelectedMarketId , amount: 1000000000 } );
      console.log(result);
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
