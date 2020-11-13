<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';

export default {

  name: 'borrowAmount',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      formData : {
        borrowQuantity: null,
        borrowValue: null,
      },
      remainingBalance: null,
      showLoader: false,
    };
  },
  

  created() {
    this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
    this.getRemainingBalance();
    this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_.instrument;        
      console.log('BORROW : changeSelectedInstrument - ');
      console.log(this.selectedInstrument);
      this.getRemainingBalance();
    };
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);        
  },


  computed: {
    calculatedQuantity() {
        console.log('calculatedquantity');
        if (this.selectedInstrument) {
          console.log(this.selectedInstrument);
          return ((this.formData.borrowValue) / (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(9) ; 
          }
      return 0;
    }
  },

  methods: {

    ...mapActions(['IToken_borrow','ERC20_balanceOf']),
    
    async borrow() {   //DEPOSIT (WORKS PROPERLY)
      this.showLoader = true;
      let price = (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
      if (price > 0) {
        let quantity = (this.formData.borrowValue / price);
        console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
        console.log('Selected IToken - ' + this.selectedInstrument.iTokenAddress);
        console.log('Borrow Quantity - ' + quantity);
        console.log('Borrow Value - ' + this.formData.borrowValue);
        console.log('Instrument Price - ' + price);     
      // WHEN THE AMOUNT ENTERED FOR BORROWING IS GREATER THAN THE AVAILABLE BALANCE
        if ( Number(quantity) >  Number(this.remainingBalance)  ) {
          quantity = this.remainingBalance;
          this.$showInfoMsg({message: " The provided amount to be borrowed exceeds your depsited balance . So your entire " + this.selectedInstrument.symbol +  " balance will be borrowed."});
        }
        let response =  await this.IToken_borrow( { iTokenAddress: this.selectedInstrument.iTokenAddress , _amount:  quantity } );
        if (response.status) {      
          this.$showSuccessMsg({message: "BORROW SUCCESS : " + quantity + "  " +  this.selectedInstrument.symbol +  " worth " + this.formData.borrowValue + " USD was successfully borrowed from SIGH Finance. Gas used = " + response.gasUsed });
          this.$showInfoMsg({message: " $SIGH Farms looks forward to serving you again!"});
          await this.getRemainingBalance();
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Borrow',Service: 'LENDING'});
        }
        else {
          this.$showErrorMsg({message: "BORROW FAILED : " + response.message  }); 
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
          // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
        }
        this.formData.borrowQuantity = null;
        this.showLoader = false;
      }
      else {
          this.$showErrorMsg({message: "Seems like the pricefeed is not functioning correctly. Please try again later! " }); 
      }
    },
      

    async getRemainingBalance() {
      this.remainingBalance = await this.ERC20_balanceOf({tokenAddress: this.selectedInstrument.iTokenAddress, account: this.$store.getters.connectedWallet });
      console.log(this.remainingBalance);
      let remainingValue = (this.remainingBalance * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4); 
      this.$showInfoMsg({message: this.remainingBalance + " " + this.selectedInstrument.symbol  + " worth $" + remainingValue + " USD are currently farming $SIGH for you at SIGH Finance! "});        
      console.log( 'Current remaining deposited balance for ' + this.selectedInstrument.symbol + " is " + this.remainingBalance + " worth " +  remainingValue + " USD");
    }
  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changeSelectedInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
