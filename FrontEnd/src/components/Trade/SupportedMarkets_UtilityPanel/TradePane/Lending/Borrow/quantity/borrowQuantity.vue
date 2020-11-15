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
    console.log("IN LENDING / BORROW / QUANTITY (TRADE-PANE) FUNCTION ");
    this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
    this.getRemainingBalance(false);
    this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_.instrument;        
      console.log('BORROW : changeSelectedInstrument - ');
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
          return ((this.formData.borrowQuantity) * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4) ; 
          }
      return 0;
    }
  },

  methods: {

    ...mapActions(['LendingPool_borrow','ERC20_balanceOf','LendingPoolCore_getUserBorrowBalances']),
    
    async borrow() {   //BORROW --> TO BE CHECKED
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      } 
      else {        
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
        this.showLoader = true;        
        let interestRateMode = this.formData.interestRateMode == 'Stable' ? 0 : 1;      
        let response =  await this.LendingPool_borrow( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  this.formData.borrowQuantity, _interestRateMode: interestRateMode, _referralCode: 0 } );
        if (response.status) {      
          this.$showSuccessMsg({message: "BORROW SUCCESS : " + this.formData.borrowQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully borrowed from SIGH Finance. Gas used = " + response.gasUsed });
          this.$showInfoMsg({message: " $SIGH Farms looks forward to serving you again!"});
          await this.getRemainingBalance(true);
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
    },
      

    async getRemainingBalance(toDisplay) {
      if (this.selectedInstrument.iTokenAddress && this.$store.getters.connectedWallet) {
        this.remainingBalance = await this.ERC20_balanceOf({tokenAddress: this.selectedInstrument.iTokenAddress, account: this.$store.getters.connectedWallet });
        console.log(this.remainingBalance);
        let remainingValue = (this.remainingBalance * (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4); 
        if (toDisplay) {
          this.$showInfoMsg({message: this.remainingBalance + " " + this.selectedInstrument.symbol  + " worth $" + remainingValue + " USD are currently farming $SIGH and Interest for you at SIGH Finance! "});        
        }
        console.log( 'Current deposited balance for ' + this.selectedInstrument.symbol + " is " + this.remainingBalance + " worth " +  remainingValue + " USD");
      }
    },

    async getUserBorrowBalances(toDisplay) {
      let balances = await this.LendingPoolCore_getUserBorrowBalances({_instrument: this.selectedInstrument.instrumentAddress, _user: this.$store.getters.connectedWallet });
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
