<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'yourAccount',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      formData : {
        toAccount: null,                  // to which interest is to be re-directed
      },
      currentlyAdministrator : null,      // Interest Stream: Administrator Rights Holder
      currentlyRedirectedTo : null,       // Interest currently re-directed to
      redirectedBalance: null,            // The redirected balance is the balance redirected by other accounts to the user,  that is accrueing interest for him.
      redirectedBalanceWorth: null,       // redirectedBalance * redirectedBalanceWorth

      showLoader: false,
    };
  },
  

  created() {
    this. getCurrentStateOfInterestStream(false);                   // get the address to which the Interest Stream is currently re-directed            
    this.changeSelectedInstrument = (selectedInstrument_) => {                 //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_.instrument;        
      console.log('DEPOSIT : selected instrument changed - '+ this.selectedInstrument );
      this. getCurrentStateOfInterestStream(true);
    };    
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);    
  },


  // computed: {
  // },

  methods: {

    ...mapActions(['IToken_redirectInterestStream','IToken_allowInterestRedirectionTo','IToken_getInterestRedirectionAddress','IToken_getRedirectedBalance','IToken_getinterestRedirectionAllowances']),
    

    async redirectInterestStream() {                           // RE-DIRECT INTEREST STREAM
      // let price = (this.$store.state.SighInstrumentState.price / Math.pow(10,this.$store.state.SighInstrumentState.priceDecimals)).toFixed(4);
      console.log('Addresses to which it is to be re-directed to = ' + this.formData.toAccount);

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showInfoMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showInfoMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if (Number(this.redirectedBalance) == 0 ) {
        this.$showInfoMsg({message: " The Connected Account " + this.$store.state.connectedWallet + " doesn't have any deposited " + this.selectedInstrument.symbol + " accuring Interest for itself. You need to have a valid deposted amount before you can Re-direct its interest stream. Contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.toAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showInfoMsg({message: " The Account Address provided is not valid ( check-sum check failed). Check the address again or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        this.showLoader = true;
        let response =  await this.IToken_redirectInterestStream( { iTokenAddress:  this.selectedInstrument.iTokenAddress, _to: this.formData.toAccount } );
        if (response.status) {  
          await this.getCurrentStateOfInterestStream(true);
          this.$showSuccessMsg({message: "INTEREST STREAM for the instrument + "  + this.selectedInstrument.symbol +  " has been successfully re-directed to " + this.formData.toAccount + " from the connected Account " +  this.$store.state.connectedWallet  });
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'InterestRedirected',Service: 'STREAMING'});
        }
        else {
          this.$showErrorMsg({message: "INTEREST STREAM RE-DIRECTION FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
        this.formData.toAccount = null;
        this.showLoader = false;
      }
    },

    async allowInterestRedirectionTo() {                           // RE-DIRECT INTEREST STREAM
      // let price = (this.$store.state.SighInstrumentState.price / Math.pow(10,this.$store.state.SighInstrumentState.priceDecimals)).toFixed(4);
      console.log('Account to which the administrator priviledges to re-direct interest will be transferred = ' + this.formData.toAccount);

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showInfoMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported by SIGH Finance - 1) Ethereum :  Kovan Testnet(42) " }); 
      }      
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showInfoMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if (Number(this.redirectedBalance) == 0 ) {
        this.$showInfoMsg({message: " The Connected Account " + this.$store.state.connectedWallet + " doesn't have any deposited " + this.selectedInstrument.symbol + " accuring Interest for itself. You need to have a valid deposted amount before you can Transfer the administrator priviledges over its interest stream. Contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.toAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showInfoMsg({message: " The Account Address provided is not valid ( check-sum check failed). Check the address again or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        this.showLoader = true;
        let response =  await this.IToken_allowInterestRedirectionTo( { iTokenAddress:  this.selectedInstrument.iTokenAddress, _to: this.formData.toAccount } );
        if (response.status) {  
          await this.getCurrentStateOfInterestStream(true);
          this.$showSuccessMsg({message: "ADMINISTRATOR PRIVILEDGES to re-direct the INTEREST STREAM for the instrument + "  + this.selectedInstrument.symbol +  " of the connected Account " +  this.$store.state.connectedWallet + " has been transferred to " + this.formData.toAccount  });
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'InterestRidirectionRightsTransferred',Service: 'STREAMING'});
        }
        else {
          this.$showErrorMsg({message: " TRANSFERING ADMINISTRATOR PRIVILEDGES FAILED: " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
        this.formData.toAccount = null;
        this.showLoader = false;
      }
    },



    async  getCurrentStateOfInterestStream(toDisplay) {
      this.currentlyAdministrator = await this.IToken_getinterestRedirectionAllowances({ iTokenAddress: this.selectedInstrument.iTokenAddress, _user: this.$store.getters.connectedWallet  });
      this.currentlyRedirectedTo = await this.IToken_getInterestRedirectionAddress({iTokenAddress: this.selectedInstrument.iTokenAddress, _user: this.$store.getters.connectedWallet });
      this.redirectedBalance = await this.IToken_getRedirectedBalance({ iTokenAddress: this.selectedInstrument.iTokenAddress, _user: this.$store.getters.connectedWallet  });
      
      let price = (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
      this.redirectedBalanceWorth = price * this.redirectedBalance;
      if (toDisplay) {
          this.$showInfoMsg({message: this.selectedInstrument.symbol + " Accuring Interest for you = " + this.redirectedBalance + " worth " + this.redirectedBalanceWorth + " USD" });
          this.$showInfoMsg({message: "Your Interest Stream currently re-directed to = " + this.currentlyRedirectedTo + ". Your Interest Stream's administrator right's holder " + this.currentlyAdministrator });
      }
    }
  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changesighInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
