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
    console.log("IN LENDING / REDEEM / QUANTITY (TRADE-PANE) FUNCTION ");
    this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
    this.getRemainingBalance(false);
    this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_.instrument;        
      console.log('REDEEM : changeSelectedInstrument - ');
      console.log(this.selectedInstrument);
      this.getRemainingBalance(false);
    };
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);        
  },


  computed: {
    calculatedValue() {
        console.log('calculatedValue');
        if (this.selectedInstrument && this.selectedInstrument.priceDecimals) {
          console.log(this.selectedInstrument);
          return ((this.formData.redeemQuantity) * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4) ; 
          }
      return 0;
    }
  },

  methods: {

    ...mapActions(['IToken_redeem','ERC20_balanceOf']),
    
    async redeem() {   //REDEEM 
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      } 
      else {        
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
        this.showLoader = true;
        let response =  await this.IToken_redeem( { iTokenAddress: this.selectedInstrument.iTokenAddress , _amount:  this.formData.redeemQuantity } );
        if (response.status) {      
          this.$showSuccessMsg({message: "REDEEM SUCCESS : " + this.formData.redeemQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully redeemed from SIGH Finance. Gas used = " + response.gasUsed });
          this.$showInfoMsg({message: " $SIGH Farms looks forward to serving you again!"});
          await this.getRemainingBalance(true);
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Redeem',Service: 'LENDING'});
        }
        else {
          this.$showErrorMsg({message: "REDEEM FAILED : " + response.message  }); 
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
          // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
        }
        this.formData.redeemQuantity = null;
        this.showLoader = false;
      }
    },
      

    async getRemainingBalance(toDisplay) {
      this.remainingBalance = await this.ERC20_balanceOf({tokenAddress: this.selectedInstrument.iTokenAddress, account: this.$store.getters.connectedWallet });
      console.log(this.remainingBalance);
      let remainingValue = (this.remainingBalance * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4); 
      if (toDisplay) {            
        this.$showInfoMsg({message: this.remainingBalance + " " + this.selectedInstrument.symbol  + " worth $" + remainingValue + " USD are currently farming $SIGH and Interest for you at SIGH Finance! "});    
      }    
      console.log( 'Current remaining deposited balance for ' + this.selectedInstrument.symbol + " is " + this.remainingBalance + " worth " +  remainingValue + " USD");
    }
  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changeSelectedInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
