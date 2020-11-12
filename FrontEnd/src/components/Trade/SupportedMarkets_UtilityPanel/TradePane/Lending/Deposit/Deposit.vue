<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { stringArrayToHtmlList, } from '@/utils/utility';
import {mapState,mapActions,} from 'vuex';

export default {

  name: 'Deposit',

  data() {
    return {
      selectedInstrument: this.$store.getters.currentlySelectedInstrument,
      formData : {
        depositQuantity: null,
        depositValue: null,
        enteredReferralCode: null,
      },
      showLoader: false,
      // showApproveButton: true,
      // showConfirm: false,
    };
  },
  

  created() {
    this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_;        
      console.log('DEPOSIT : changeSelectedInstrument - ');
      console.log(this.selectedInstrument);
    };
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);        
  },


  computed: {
    // Updated instrument Price of the selected Instrument
    selectedInstrumentPrice() {
      let price = this.$store.getters.getInstrumentPrice(this.selectedInstrument.instrumentAddress);
      if (price) {
        return price / Math.pow(10,this.selectedInstrument.decimals); 
      }
      return 0;
    },
    computedDepositQuantity() {
      if (this.selectedInstrument && !this.formData.depositQuantity && this.formData.depositValue) {
        this.formData.depositQuantity = this.formData.depositValue / this.selectedInstrumentPrice;
        return this.formData.depositQuantity;
      }
      return this.formData.depositQuantity;
    },
    computedDepositValue() {
      if (this.selectedInstrument && !this.formData.depositValue && this.formData.depositQuantity) {
        this.formData.depositValue = this.formData.depositQuantity * this.selectedInstrumentPrice;
        return this.formData.depositValue;
      }
      return this.formData.depositValue;
    }
  },


  asyncComputed: {
    async isTheProvidedAmountApproved() {
      if (this.selectedInstrument && this.$store.getters.connectedWallet && this.$store.getters.LendingPoolCoreContractAddress ) {
        let allowedAmount = await this.ERC20_getAllowance({ tokenAddress: this.selectedInstrument.instrumentAddress, owner: this.$store.getters.connectedWallet, spender: this.$store.getters.LendingPoolCoreContractAddress } );
        if (allowedAmount > this.formData.depositQuantity) {
          return true;
        }
      }
      return false;
    }
  },


  methods: {

    ...mapActions(['LendingPool_deposit','ERC20_approve','ERC20_getAllowance']),
    
    async deposit() {   //When we press make Borrow. Shows Loader
      this.showLoader = true;
      console.log('Selected Instrument - ' + this.selectedInstrument);
      console.log('Deposit Quantity - ' + this.formData.depositQuantity);
      console.log('Deposit Value - ' + this.formData.depositValue);
      console.log('Instrument Price - ' + this.selectedInstrumentPrice);
      let response =  await this.LendingPool_deposit( { _instrument: this.selectedInstrument.instrumentAddress , _amount: this.formData.depositQuantity, _referralCode: this.formData.enteredReferralCode } );
      console.log(result);
      this.showLoader = false;
    },

    async approve() {   //When we press make Borrow. Shows Loader
      this.showLoader = true;
      console.log('Selected Instrument - ' + this.selectedInstrument);
      console.log('Value to be Approved - ' + this.formData.depositValue);
      console.log('Instrument Price - ' + this.selectedInstrumentPrice);
      let response = await this.ERC20_approve( { tokenAddress: this.selectedInstrument.instrumentAddress, spender: this.$store.getters.LendingPoolCoreContractAddress , amount: this.formData.depositValue } );
      console.log(result);
      this.showLoader = false;
    },




  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changeSelectedInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
