<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';

export default {

  name: 'depositAmount',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      formData : {
        depositQuantity: null,
        depositValue: null,
        enteredReferralCode: 0,
      },
      availableAllowance: null,
      showLoader: false,
      // showApproveButton: true,
      // showConfirm: false,
    };
  },
  

  created() {
    console.log("IN LENDING / DEPOSIT / AMOUNT (TRADE-PANE) FUNCTION ");
    this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
    this.updateAvailableAllowance();
    this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_.instrument;        
      console.log('DEPOSIT : changeSelectedInstrument - ');
      console.log(this.selectedInstrument);
      this.updateAvailableAllowance();
    };
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);        
  },


  computed: {
    calculatedQuantity() {
        console.log('calculatedQuantity');
        if (this.selectedInstrument) {
          console.log(this.selectedInstrument);
          this.formData.depositQuantity = Number((this.formData.depositValue) / (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4) ; 
          console.log('depositQuantity (computed) ' + this.formData.depositQuantity);          
          return this.formData.depositQuantity;
          }
      return 0;
    }
  },

  methods: {

    ...mapActions(['LendingPool_deposit','ERC20_increaseAllowance','ERC20_getAllowance']),
    
    async deposit() {   //DEPOSIT (WORKS PROPERLY)
      this.showLoader = true;
      let price = (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
      let value = price * this.formData.depositQuantity;
      console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
      console.log('Available Allowance - ' + this.availableAllowance );      
      console.log('Deposit Quantity - ' + this.formData.depositQuantity);
      console.log('Deposit Value - ' + value);
      console.log('Instrument Price - ' + price);     

      // WHEN THE ALLOWANCE IS LESS THAN WHAT IS NEEDED
      if ( Number(this.formData.depositQuantity) >  Number(this.availableAllowance)  ) {
        let dif = this.formData.depositQuantity - this.availableAllowance;
        this.$showInfoMsg({message: " You first need to 'APPROVE' an amount greater than " + dif + " " + this.selectedInstrument.symbol + " so that the deposit can be processed through the ERC20 Interface's transferFrom() Function."}); // this.formData.depositQuantity + "  " + this.selectedInstrument.symbol +  " worth " + value + " USD approval failed. Try increasing Gas or contact our team at contact@sigh.finance in case of any queries." });        
        this.$showInfoMsg({message: "Available Allowance : " + this.availableAllowance + " " + this.selectedInstrument.symbol });        
        this.showLoader = false;
      }
      // WHEN ALLOWANCE CONDITION IS MET SO THE TRANSACTION GOES THROUGH
      else {
        let response =  await this.LendingPool_deposit( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  this.formData.depositQuantity, _referralCode: this.formData.enteredReferralCode } );
        if (response.status) {      
          this.$showSuccessMsg({message: "DEPOSIT SUCCESS : " + this.formData.depositQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully deposited to SIGH Finance. Gas used = " + response.gasUsed });
          await this.updateAvailableAllowance();
          // this.$showInfoMsg({message: "Available Allowance : " + this.availableAllowance + " " + this.selectedInstrument.symbol });        
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
        }
        else {
          this.$showErrorMsg({message: "DEPOSIT FAILED : " + response.message  }); // this.formData.depositQuantity + "  " + this.selectedInstrument.symbol +  " worth " + value + " USD approval failed. Try increasing Gas or contact our team at contact@sigh.finance in case of any queries." });        
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); // this.formData.depositQuantity + "  " + this.selectedInstrument.symbol +  " worth " + value + " USD approval failed. Try increasing Gas or contact our team at contact@sigh.finance in case of any queries." });        
          // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
        }
        this.formData.depositQuantity = null;
        this.showLoader = false;
      }
    },
      

    async approve() {   //APPROVE (WORKS PROPERLY)
      this.showLoader = true;
      console.log('Selected Instrument - ')
      console.log(this.selectedInstrument);
      console.log('Quantity to be Approved - ' + this.formData.depositQuantity);
      let price = (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
      let value = price * this.formData.depositQuantity;
      console.log('Instrument Price - ' + price);
      let response = await this.ERC20_increaseAllowance( { tokenAddress: this.selectedInstrument.instrumentAddress, spender: this.$store.getters.LendingPoolCoreContractAddress , addedValue:  this.formData.depositQuantity } );
      if (response.status) { 
        this.$showSuccessMsg({message: "APPROVAL SUCCESS : " + this.formData.depositQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD can now be deposited to SIGH Finance. Gas used = " + response.gasUsed  });
        this.formData.depositQuantity = null;
        await this.updateAvailableAllowance();
        // this.$showInfoMsg({message: "Available Allowance : " + this.availableAllowance + " " + this.selectedInstrument.symbol });        
        // this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'ApproveForDeposit',Service: 'LENDING'});      
      }
      else {
        this.$showErrorMsg({message: "APPROVAL FAILED : " + response.message  }); 
        this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        // this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'ApproveForDeposit',Service: 'LENDING'});              
      }
      this.showLoader = false;
    }, 

    async updateAvailableAllowance() {
      this.availableAllowance = await this.ERC20_getAllowance({tokenAddress: this.selectedInstrument.instrumentAddress, owner: this.$store.getters.connectedWallet, spender: this.$store.getters.LendingPoolCoreContractAddress });
      console.log(this.availableAllowance);
      this.$showInfoMsg({message: "Available Allowance : " + this.availableAllowance + " " + this.selectedInstrument.symbol });        
      console.log( 'Current available allowance for ' + this.selectedInstrument.symbol + " is " + this.availableAllowance );
    }
  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changeSelectedInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
