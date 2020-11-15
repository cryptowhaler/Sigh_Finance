<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';

export default {

  name: 'sighQuantity',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      formData : {
        sighQuantity: null,
        sighValue: null,
        enteredReferralCode: 0,
      },
      availableAllowance: null,
      showLoader: false,
      // showApproveButton: true,
      // showConfirm: false,
    };
  },
  

  created() {
    // this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
    // // this.updateAvailableAllowance();
    // this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
    //   this.selectedInstrument = selectedInstrument_.instrument;        
    //   console.log('DEPOSIT : changeSelectedInstrument - ');
    //   console.log(this.selectedInstrument);
    //   this.updateAvailableAllowance();
    // };
    // ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);        
  },


  computed: {
    // calculatedValue() {
    //     console.log('calculatedValue');
    //     if (this.selectedInstrument && this.selectedInstrument.priceDecimals) {
    //       console.log(this.selectedInstrument);
    //       return ((this.formData.sighQuantity) * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4) ; 
    //       }
    //   return 0;
    // }
  },

  methods: {

  },

  destroyed() {
    // ExchangeDataEventBus.$off('change-selected-instrument', this.changeSelectedInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
