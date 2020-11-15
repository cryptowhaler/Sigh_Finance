<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'repayQuantity',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      formData : {
        repayQuantity: null,
        repayValue: null,
        onBehalfOf: null,
      },
      principalBorrowBalance: null,
      compoundedBorrowBalance: null,
      borrowBalanceIncrease: null,            
      showLoader: false,
    };
  },
  

  created() {
    console.log("IN LENDING / REPAY / QUANTITY (TRADE-PANE) FUNCTION ");
    this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
    this.getUserBorrowBalances(false);
    this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_.instrument;        
      console.log('REPAY : changeSelectedInstrument - ');
      console.log(this.selectedInstrument);
      this.getUserBorrowBalances(true);
    };
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);        
  },


  computed: {
    calculatedValue() {
        console.log('calculatedValue');
        if (this.selectedInstrument && this.selectedInstrument.priceDecimals) {
          console.log(this.selectedInstrument);
          return ((this.formData.repayQuantity) * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4) ; 
          }
      return 0;
    }
  },

  methods: {

    ...mapActions(['LendingPool_repay','LendingPoolCore_getUserBorrowBalances']),
    
    async repay() {   //REPAY
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }     
      else if (this.formData.onBehalfOf && !Web3.utils.isAddress(this.formData.onBehalfOf) ) {
        this.$showErrorMsg({message: " The address provided in 'onBehalfOf' section is invalid. Please provide the correct address or make this column empty if you want to repay the borrow amount for the connected wallet." });         
      }
      else {      
        let price = (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
        let value = price * this.formData.repayQuantity;
        this.getUserBorrowBalances(false);

        console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
        console.log('Repay Quantity - ' + this.formData.repayQuantity);
        console.log('Repay Value - ' + value);
        console.log('Instrument Price - ' + price); 
            
        let onBehalfOf_ = this.formData.onBehalfOf ? this.formData.onBehalfOf : this.$store.getters.connectedWallet;

        if ( Number(this.formData.repayQuantity) >  Number(this.compoundedBorrowBalance) ) {
          this.$showErrorMsg({message: "The amount to be repaid is greater than the current compounded borrow balance = " +  this.compoundedBorrowBalance + " " + this.selectedInstrument.symbol + ". Please provide a lesser / equal amount than the current compounded borrow balance." });
        }
        else {
          this.showLoader = true;      
          let response =  await this.LendingPool_repay( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  this.formData.repayQuantity, _onBehalfOf: onBehalfOf_ } );
          if (response.status) {      
            this.$showSuccessMsg({message: "REPAY SUCCESS : " + this.formData.repayQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully repayed to SIGH Finance. Gas used = " + response.gasUsed });
            this.$showInfoMsg({message: " $SIGH FARMS look forward to serving you again!"});
            await this.getUserBorrowBalances(true);
            this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Repay',Service: 'LENDING'});
          }
          else {
            this.$showErrorMsg({message: "REPAY FAILED : " + response.message  }); 
            this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
            // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
          }
        }
        this.formData.repayQuantity = null;
        this.showLoader = false;
      }
    },
      
    async getUserBorrowBalances(toDisplay) {
      let user = this.formData.onBehalfOf ? this.formData.onBehalfOf : this.$store.getters.connectedWallet;
      let balances = await this.LendingPoolCore_getUserBorrowBalances({_instrument: this.selectedInstrument.instrumentAddress, _user: user });
      console.log(balances);
      this.principalBorrowBalance = balances[0];
      this.compoundedBorrowBalance =  balances[1];
      this.borrowBalanceIncrease =  balances[2];
      let compoundedBorrowBalanceValue = (this.compoundedBorrowBalance * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4); 
      if (toDisplay && Number(this.compoundedBorrowBalance)!= 0 ) {
        this.$showInfoMsg({message: this.compoundedBorrowBalance + " " + this.selectedInstrument.symbol  + " worth $" + compoundedBorrowBalanceValue + " USD have been borrowed which farm $SIGH for you whenever its price increases over any 24 hour period! "});        
      }
    }
  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changeSelectedInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
