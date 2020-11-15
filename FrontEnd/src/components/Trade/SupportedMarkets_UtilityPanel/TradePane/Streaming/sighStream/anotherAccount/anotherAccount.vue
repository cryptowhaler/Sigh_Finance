<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'anotherAccount',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      formData : {
        fromAccount: null,                  // to which SIGH is to be re-directed
        toAccount: null,                  // to which SIGH is to be re-directed
      },
      currentAdministrator : null,      // SIGH Stream: Administrator Rights Holder
      accuredSIGH: null,            // The redirected balance is the balance redirected by other accounts to the user,  that is accrueing SIGH for him.
      instrumentBalances: null,       // accuredSIGHBalance * accuredSIGHBalanceWorth
      showLoader: false,
    };
  },

  

  created() {
    this.selectedInstrument = this.$store.state.currentlySelectedInstrument,
    this. getCurrentStateOfSIGHStream(false);                   // get the address to which the SIGH Stream is currently re-directed            
    this.changeSelectedInstrument = (selectedInstrument_) => {                 //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_.instrument;        
      console.log('SIGH-STREAM : selected instrument changed - '+ this.selectedInstrument );
      this. getCurrentStateOfSIGHStream(false);
    };    
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);    
  },


  // computed: {
  // },

  methods: {
        // BORROW AMOUNT ALSO NEEDS TO BE CHECKED
    ...mapActions(['IToken_redirectSighStreamOf','IToken_getSighAccured','IToken_getSighStreamAllowances','LendingPoolCore_getUserBasicInstrumentData']),
    


    async redirectSIGHStreamOf() {                           // RE-DIRECT SIGH STREAM
      console.log('Addresses to which SIGH is to be re-directed to = ' + this.formData.toAccount);
      
      await this. getCurrentStateOfSIGHStream(false);                   // get the address to which the SIGH Stream is currently re-directed            

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if (Number(this.instrumentBalances[0]) == 0 &&  Number(this.instrumentBalances[1]) == 0  ) {
        this.$showErrorMsg({message: " The 'From Account' " + this.$store.state.connectedWallet + " doesn't have any supplied or Borrowed " + this.selectedInstrument.symbol + " balance accuring SIGH for it. The account needs to deposit assets (accures $SIGH whenever the asset's price (USD) increases over 24 hrs period) or borrow assets ((accures $SIGH whenever the asset's price (USD) decreases over 24 hrs period) before you can Re-direct its SIGH stream. Contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.toAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showErrorMsg({message: " The Account Address provided is not valid ( check-sum check failed). Check the address again or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        this.showLoader = true;
        let response =  await this.IToken_redirectSighStreamOf( { iTokenAddress:  this.selectedInstrument.iTokenAddress, _from: this.formData.fromAccount, _to: this.formData.toAccount } );
        if (response.status) {  
          await this.getCurrentStateOfSIGHStream(true);
          this.$showSuccessMsg({message: "SIGH STREAM for  "  + this.selectedInstrument.symbol +  " of the account " + this.formData.fromAccount + " has been successfully re-directed to " + this.formData.toAccount   });
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'SIGHRedirectedFrom',Service: 'STREAMING'});
        }
        else {
          this.$showErrorMsg({message: "SIGH STREAM RE-DIRECTION FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
        this.formData.toAccount = null;
        this.showLoader = false;
      }
    },



    async  getCurrentStateOfSIGHStream(toDisplay) {
      console.log(this.selectedInstrument);
        if (this.$store.getters.connectedWallet && this.selectedInstrument.iTokenAddress) {
        this.accuredSIGH = await this.IToken_getSighAccured({ iTokenAddress: this.selectedInstrument.iTokenAddress, _user: this.$store.state.connectedWallet});
        this.currentAdministrator = await this.IToken_getSighStreamAllowances({ iTokenAddress: this.selectedInstrument.iTokenAddress, _user: this.formData.fromAccount   });
        this.instrumentBalances = await this.LendingPoolCore_getUserBasicInstrumentData({ _instrument: this.selectedInstrument.instrumentAddress, _user: this.formData.fromAccount   });
        // this.redirectedBalanceWorth = price * this.redirectedBalance;
        if (toDisplay == true) {
            this.$showInfoMsg({message: " Accured SIGH: " + this.accuredSIGH });
        }
      }
    } 

  },


  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changesighInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
