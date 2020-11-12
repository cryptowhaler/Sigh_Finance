<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';

export default {

  name: 'redeemQuantity',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      formData : {
        redeemQuantity: null,
        redeemValue: null,
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
      console.log('REDEEM : changeSelectedInstrument - ');
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
          return ((this.formData.redeemQuantity) * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4) ; 
          }
      return 0;
    }
  },

  methods: {

    ...mapActions(['IToken_redeem','ERC20_balanceOf']),
    
    async redeem() {   //DEPOSIT (WORKS PROPERLY)
      this.showLoader = true;
      let price = (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
      let value = price * this.formData.redeemQuantity;
      console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
      console.log('Selected IToken - ' + this.selectedInstrument.iTokenAddress);
      console.log('Redeem Quantity - ' + this.formData.redeemQuantity);
      console.log('Redeem Value - ' + value);
      console.log('Instrument Price - ' + price);     

      // WHEN THE AMOUNT ENTERED FOR REDEEMING IS GREATER THAN THE AVAILABLE BALANCE
      if ( Number(this.formData.redeemQuantity) >  Number(this.remainingBalance)  ) {
        this.formData.redeemQuantity = this.remainingBalance;
        this.$showInfoMsg({message: " The provided amount to be redeemed exceeds your depsited balance . So your entire " + this.selectedInstrument.symbol +  " balance will be redeemed."});
      }
      let response =  await this.IToken_redeem( { iTokenAddress: this.selectedInstrument.iTokenAddress , _amount:  this.formData.redeemQuantity } );
      if (response.status) {      
        this.$showSuccessMsg({message: "REDEEM SUCCESS : " + this.formData.redeemQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully redeemed from SIGH Finance. Gas used = " + response.gasUsed });
        this.$showInfoMsg({message: " $SIGH Farms looks forward to serving you again!"});
        await this.getRemainingBalance();
        this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Redeem',Service: 'LENDING'});
      }
      else {
        this.$showErrorMsg({message: "REDEEM FAILED : " + response.message  }); 
        this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
      }
      this.formData.redeemQuantity = null;
      this.showLoader = false;
    },
      

    async getRemainingBalance() {
      this.remainingBalance = await this.ERC20_balanceOf({tokenAddress: this.selectedInstrument.iTokenAddress, account: this.$store.getters.connectedWallet });
      console.log(this.remainingBalance);
      let remainingValue = (this.remainingBalance * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4); 
      this.$showInfoMsg({message: this.remainingBalance + " " + this.selectedInstrument.symbol  + " worth $" + remainingValue + " USD are currently farming $SIGH and Interest for you at SIGH Finance! "});        
      console.log( 'Current remaining deposited balance for ' + this.selectedInstrument.symbol + " is " + this.remainingBalance + " worth " +  remainingValue + " USD");
    }
  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changeSelectedInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
