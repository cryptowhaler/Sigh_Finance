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
        fromAccount: null,
        toAccount: null,                  // to which interest is to be re-directed
      },
      fromAccountAdministrator : null,      // Interest Stream: Administrator Rights Holder
      fromAccountRedirectedBalance: null,            // The redirected balance is the balance redirected by other accounts to the user,  that is accrueing interest for him.
      fromAccountRedirectedBalanceWorth: null,       // fromAccountRedirectedBalance * fromAccountRedirectedBalanceWorth

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

    ...mapActions(['IToken_redirectInterestStreamOf','IToken_getfromAccountRedirectedBalance','IToken_getinterestRedirectionAllowances']),
    

    async redirectInterestStreamOf() {                           // RE-DIRECT INTEREST STREAM
      // let price = (this.$store.state.SighInstrumentState.price / Math.pow(10,this.$store.state.SighInstrumentState.priceDecimals)).toFixed(4);
      console.log('Addresses to which it is to be re-directed to = ' + this.formData.toAccount);

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showInfoMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showInfoMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.fromAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showInfoMsg({message: " The 'From Account' Address provided is not valid ( check-sum check failed). Check the address again or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.toAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showInfoMsg({message: " The 'To Account' Address provided is not valid ( check-sum check failed). Check the address again or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if ( this.$store.state.connectedWallet !=  this.fromAccountAdministrator ) {
        this.$showInfoMsg({message: "The connected Account does not have administrator priviledges over the provided 'From Account'. Administrator privileges over the 'From Account' are currently held by " +  this.fromAccountAdministrator +  " . Contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if (Number(this.fromAccountRedirectedBalance) == 0 ) {
        this.$showInfoMsg({message: " The 'From Account' " + this.formData.fromAccount + " doesn't have any deposited " + this.selectedInstrument.symbol + " accuring Interest. The 'From Account' needs to have a valid deposted amount before you can Re-direct its interest stream. Contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        this.showLoader = true;
        let response =  await this.IToken_redirectInterestStreamOf( { iTokenAddress:  this.selectedInstrument.iTokenAddress,_from : this.formData.fromAccount ,_to: this.formData.toAccount } );
        if (response.status) {  
          await this.getCurrentStateOfInterestStream(true);
          this.$showSuccessMsg({message: "INTEREST STREAM for the instrument + "  + this.selectedInstrument.symbol +  " has been successfully re-directed from " + this.formData.fromAccount + " to " + this.formData.toAccount  });
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'InterestRedirectedByAdministrator',Service: 'STREAMING'});
        }
        else {
          this.$showErrorMsg({message: "INTEREST STREAM RE-DIRECTION BY ADMINISTRATOR FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
        this.formData.toAccount = null;
        this.showLoader = false;
      }
    },


    async  getCurrentStateOfInterestStream(toDisplay) {
      if ( this.formData.iTokenAddress && Web3.utils.isAddress(this.formData.fromAccount)  )  {
        this.fromAccountAdministrator = await this.IToken_getinterestRedirectionAllowances({ iTokenAddress: this.formData.iTokenAddress, _user: this.formData.fromAccount  });
        this.fromAccountRedirectedBalance = await this.IToken_getfromAccountRedirectedBalance({ iTokenAddress: this.selectedInstrument.iTokenAddress, _user: this.formData.fromAccount  });
        let price = (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
        this.fromAccountRedirectedBalanceWorth = price * this.fromAccountRedirectedBalance;
        if (toDisplay) {
            this.$showInfoMsg({message: this.fromAccountRedirectedBalance  + " " + this.selectedInstrument.symbol + " worth " + this.fromAccountRedirectedBalanceWorth + " USD accuring Interest in the provided From Account " });
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
