<template src="./template.html"></template>

<script>
import EventBus, {EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'anotherAccount',


  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      selectedInstrumentWalletState: {},
      formData : {
        fromAccount: null,
        toAccount: null,                  // to which INTEREST / PERMISSIONS are to be re-directed / assigned
      },
      currentAdministratorFromAccount: null,
      instrumentBalancesFromAccount: [],
      selectedInstrumentPriceETH: null,
      showLoader: false,
      showLoaderRefresh: false,
      intervalActivated: false,
    };
  },  
  


  async created() {
    console.log("IN STREAMING / INTEREST_STREAMING / YOUR ACCOUNT (TRADE-PANE) FUNCTION ");
    this.initiatePriceLoop();    
    this.refreshThisSession = () => this.loadSessionData(); 

    this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_.instrument;       // UPDATED SELECTED INSTRUMENT (LOCALLY)
      this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
      if (this.intervalActivated == false) {
        this.initiatePriceLoop();
      }
    };


    ExchangeDataEventBus.$on(EventNames.ConnectedWalletSesssionRefreshed, this.refreshThisSession );    
    ExchangeDataEventBus.$on(EventNames.changeSelectedInstrument, this.changeSelectedInstrument);        
    ExchangeDataEventBus.$on(EventNames.ConnectedWallet_Instrument_Refreshed, this.refreshThisSession);        
  },


  // computed: {
  // },

  methods: {

    ...mapActions(['IToken_redirectInterestStreamOf','getInstrumentPrice','refresh_User_Instrument_State','IToken_getinterestRedirectionAllowances','LendingPoolCore_getUserBasicInstrumentData']),
    
    async initiatePriceLoop() {
      if ( this.$store.state.isNetworkSupported  ) {
        setInterval(async () => {
          // console.log("IN SET PRICE : INTEREST STREAM / ANOTHER ACCOUNT");
          if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
            this.intervalActivated = true;
            this.selectedInstrumentPriceETH = await this.getInstrumentPrice({_instrumentAddress : this.selectedInstrument.instrumentAddress });
          }
        },1000);
      }
      this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
      this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);        
    },



    async redirectInterestStreamOf() {                           // RE-DIRECT INTEREST STREAM
      // let price = (this.$store.state.SighInstrumentState.price / Math.pow(10,this.$store.state.SighInstrumentState.priceDecimals)).toFixed(4);
      console.log('Addresses to which it is to be re-directed to = ' + this.formData.toAccount);

      if ( Web3.utils.isAddress(this.formData.toAccount) ) {          
        await this.getDetailsOfTheFromAccount();          
      }       

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.fromAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showErrorMsg({message: " The 'From Account' Address provided is not valid ( check-sum check failed). Check the address again or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.toAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showErrorMsg({message: " The 'To Account' Address provided is not valid ( check-sum check failed). Check the address again or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if ( this.$store.state.connectedWallet !=  this.currentAdministratorFromAccount ) {
        this.$showErrorMsg({message: "The connected Account does not have administrator priviledges over the provided 'From Account'. Administrator privileges over the 'From Account' are currently held by " +  this.currentAdministratorFromAccount +  " . Contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if (Number(this.instrumentBalancesFromAccount[0]) == 0 &&  Number(this.instrumentBalancesFromAccount[1]) == 0  ) {
        this.$showErrorMsg({message: " The 'From Account' " + this.formData.fromAccount + " doesn't have any supplied or Borrowed " + this.selectedInstrument.symbol + " balance accuring Interest for itself. The account needs to deposit assets (accures $SIGH whenever the asset's price (USD) increases over 24 hrs period) or borrow assets ((accures $SIGH whenever the asset's price (USD) decreases over 24 hrs period) before you can Re-direct its SIGH stream. Contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        this.showLoader = true;
        let response =  await this.IToken_redirectInterestStreamOf( { iTokenAddress:  this.selectedInstrument.iTokenAddress,_from : this.formData.fromAccount ,_to: this.formData.toAccount } );
        if (response.status) {  
          this.$showSuccessMsg({message: "INTEREST STREAM for the instrument + "  + this.selectedInstrument.symbol +  " has been successfully re-directed from " + this.formData.fromAccount + " to " + this.formData.toAccount  });
          await this.refreshCurrentInstrumentWalletState(true);
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'InterestRedirectedByAdministrator',Service: 'STREAMING'});
          this.formData.toAccount = null;
        }
        else {
          this.$showErrorMsg({message: "INTEREST STREAM RE-DIRECTION BY ADMINISTRATOR FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
        this.showLoader = false;
      }
    },




    async refreshCurrentInstrumentWalletState(toDisplay) {
      if ( this.$store.state.web3 && this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        try {
          this.showLoaderRefresh = true;          
          let response = await this.refresh_User_Instrument_State({cur_instrument: this.selectedInstrument });
          this.$store.commit("addToWalletInstrumentStates",{instrumentAddress : this.selectedInstrument.instrumentAddress  , walletInstrumentState: response});
          this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
          ExchangeDataEventBus.$emit(EventNames.ConnectedWallet_Instrument_Refreshed, {'instrumentAddress': this.selectedInstrument.instrumentAddress });    
          if (toDisplay) {
            this.$showInfoMsg({message:  this.$store.state.connectedWallet + " : " + this.selectedInstrument.symbol + " Instrument's State have been refreshed! " });        
          }
        }
        catch(error) {
          console.log( 'FAILED' );
        }
        this.showLoaderRefresh = false;        
      }
    },




    async  getDetailsOfTheFromAccount() {
        console.log("CHECK CHECK CHECK");
        if (this.$store.getters.connectedWallet && this.selectedInstrument.iTokenAddress) {
        this.currentAdministratorFromAccount = await this.IToken_getinterestRedirectionAllowances({ iTokenAddress: this.selectedInstrument.iTokenAddress, _user: this.formData.fromAccount   });
        console.log(this.currentAdministratorFromAccount);
        this.instrumentBalancesFromAccount = await this.LendingPoolCore_getUserBasicInstrumentData({ _instrument: this.selectedInstrument.instrumentAddress, _user: this.formData.fromAccount   });
      }
    },



    loadSessionData() {
      if (this.intervalActivated == false) {
        this.initiatePriceLoop();
      }
      this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
      console.log(this.selectedInstrument);
      if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
        this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
      }
      console.log(this.selectedInstrumentWalletState);
    }


  },




  destroyed() {
    ExchangeDataEventBus.$off(EventNames.ConnectedWalletSesssionRefreshed);    
    ExchangeDataEventBus.$off(EventNames.changeSelectedInstrument );        
    ExchangeDataEventBus.$off(EventNames.ConnectedWallet_Instrument_Refreshed );        
  },



};
</script>

<style lang="scss" src="./style.scss" scoped></style>
