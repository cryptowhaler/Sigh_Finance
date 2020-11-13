<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';

export default {

  name: 'borrowQuantity',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      formData : {
        borrowQuantity: null,
        borrowValue: null,
        interestRateMode: 'Stable',
      },
      interestRateModes: ['Stable','Variable'],
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
    calculatedValue() {
        console.log('calculatedValue');
        if (this.selectedInstrument) {
          console.log(this.selectedInstrument);
          return ((this.formData.borrowQuantity) * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4) ; 
          }
      return 0;
    }
  },

  methods: {

    ...mapActions(['LendingPool_borrow','ERC20_balanceOf']),
    
    async borrow() {   //DEPOSIT (WORKS PROPERLY)
      this.showLoader = true;
      let price = (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
      let value = price * this.formData.borrowQuantity;
      console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
      console.log('Borrow Quantity - ' + this.formData.borrowQuantity);
      console.log('Borrow Value - ' + value);
      console.log('Instrument Price - ' + price);     
      console.log('Interest Rate Mode - ' + this.formData.interestRateMode);     

      // WHEN THE AMOUNT ENTERED FOR BORROWING IS GREATER THAN THE AVAILABLE BALANCE
      if ( Number(this.formData.borrowQuantity) >  Number(this.remainingBalance)  ) {
        this.formData.borrowQuantity = this.remainingBalance;
        this.$showInfoMsg({message: " The provided amount to be borrowed exceeds your depsited balance . So your entire " + this.selectedInstrument.symbol +  " balance will be borrowed."});
      }
      let interestRateMode = this.formData.interestRateMode == 'Stable' ? 0 : 1;      
      let response =  await this.LendingPool_borrow( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  this.formData.borrowQuantity, _interestRateMode: interestRateMode, _referralCode: 0 } );
      if (response.status) {      
        this.$showSuccessMsg({message: "BORROW SUCCESS : " + this.formData.borrowQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully borrowed from SIGH Finance. Gas used = " + response.gasUsed });
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
    },
      

    async getRemainingBalance() {
      this.remainingBalance = await this.ERC20_balanceOf({tokenAddress: this.selectedInstrument.iTokenAddress, account: this.$store.getters.connectedWallet });
      console.log(this.remainingBalance);
      let remainingValue = (this.remainingBalance * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4); 
      this.$showInfoMsg({message: this.remainingBalance + " " + this.selectedInstrument.symbol  + " worth $" + remainingValue + " USD are currently farming $SIGH and Interest for you at SIGH Finance! "});        
      console.log( 'Current deposited balance for ' + this.selectedInstrument.symbol + " is " + this.remainingBalance + " worth " +  remainingValue + " USD");
    }
  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changeSelectedInstrument);    
  },
  
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
