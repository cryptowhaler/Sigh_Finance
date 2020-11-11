<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';
import {mapState,mapActions,} from 'vuex';

export default {
  name: 'Deposit',
  data() {
    return {
      selectedInstrument: this.$store.getters.currentlySelectedInstrument;
      showLoader: false,
      showApproveButton: true,
      showConfirm: false,
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
    this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_;        
      console.log('DEPOSIT : changeSelectedInstrument - ');
      console.log(this.selectedInstrument);
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
