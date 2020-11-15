<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';

export default {

  name: 'repayAmount',

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
      remainingBalance: null,
      showLoader: false,
    };
  },
  

  created() {
    console.log("IN LENDING / REPAY / AMOUNT (TRADE-PANE) FUNCTION ");
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
    calculatedQuantity() {
        console.log('calculatedquantity');
        if (this.selectedInstrument) {
          console.log(this.selectedInstrument);
          return ((this.formData.repayValue) / (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(9) ; 
          }
      return 0;
    }
  },

  methods: {

    ...mapActions(['IToken_repay','ERC20_balanceOf']),
    
    async repay() {   //DEPOSIT (WORKS PROPERLY)
      let price = (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
      if (price > 0) {
        let repayQuantity_ = (this.formData.repayValue / price);
        console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
        console.log('Repay Quantity - ' + repayQuantity_);
        console.log('Repay Value - ' + this.formData.repayValue);
        console.log('Instrument Price - ' + price);     

        let onBehalfOf_ = this.formData.onBehalfOf ? this.formData.onBehalfOf : this.$store.getters.connectedWallet;

        if (this.formData.onBehalfOf && !Web3.utils.isAddress(this.formData.onBehalfOf) ) {
          this.$showInfoMsg({message: " The address provided in 'onBehalfOf' section is invalid. Please provide the correct address or make this column empty if you want to repay the borrow amount for the connected wallet." });         
        }
        else if ( Number(repayQuantity_) >  Number(this.compoundedBorrowBalance) ) {
          this.$showInfoMsg({message: "The amount to be repaid is greater than the current compounded borrow balance = " +  this.compoundedBorrowBalance + " " + this.selectedInstrument.symbol + ". Please provide a lesser / equal amount than the current compounded borrow balance." });
        }
        else {
          this.showLoader = true;
          let response =  await this.LendingPool_repay( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  repayQuantity_ , _onBehalfOf: onBehalfOf_ } );
          if (response.status) {      
            this.$showSuccessMsg({message: "REPAY SUCCESS : " + quantity + "  " +  this.selectedInstrument.symbol +  " worth " + this.formData.repayValue + " USD was successfully repayed from SIGH Finance. Gas used = " + response.gasUsed });
            this.$showInfoMsg({message: " $SIGH Farms looks forward to serving you again!"});
            await this.getUserBorrowBalances(true);
            this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Repay',Service: 'LENDING'});
          }
          else {
            this.$showErrorMsg({message: "REPAY FAILED : " + response.message  }); 
            this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
            // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
          }
          this.formData.repayQuantity = null;
          this.showLoader = false;
        }
      }
      else {
          this.$showErrorMsg({message: "Seems like the pricefeed is not functioning correctly. Please try again later! " }); 
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
