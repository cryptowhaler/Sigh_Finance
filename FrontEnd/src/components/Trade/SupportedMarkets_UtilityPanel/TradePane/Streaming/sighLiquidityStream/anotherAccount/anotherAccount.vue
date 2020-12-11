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
      sighInstrument : this.$store.state.SIGHState,      
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      selectedInstrumentWalletState: this.$store.state.dummyWalletInstrumentState,
      formData : {
        fromAccount: null,                  // to which SIGH is to be re-directed
        toAccount: null,                  // to which SIGH is to be re-directed
      },
      SIGH_Price_ETH_ : null,
      SIGH_Price_USD_ : null,
      currentAdministratorFromAccount: null,
      instrumentBalancesFromAccount: [],
      showLoader: false,
      showLoaderRefresh: false,
      intervalActivated: false,
    };
  },

  

  async created() {
    console.log("IN STREAMING / SIGH_STREAMING / YOUR ACCOUNT (TRADE-PANE) FUNCTION ");
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


  computed: {
    calculatedSIGH_PRICE_USD() {
        if (this.sighInstrument && this.sighInstrument.priceDecimals) {
          this.SIGH_Price_USD_ = Number( ( Number(this.SIGH_Price_ETH_) / Math.pow(10,this.sighInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4);
          return this.SIGH_Price_USD_;
        }
      return 0;
    }
  },


  methods: {

    ...mapActions(['IToken_redirectLiquiditySIGHStreamOf','getInstrumentPrice','refresh_User_Instrument_State','IToken_getSIGHStreamsAllowances','LendingPoolCore_getUserBasicInstrumentData']),
    



    async initiatePriceLoop() {
      if ( this.$store.state.isNetworkSupported  ) {
        setInterval(async () => {
          if (this.$store.state.SIGHContractAddress != '0x0000000000000000000000000000000000000000') {
            this.intervalActivated = true;
            this.SIGH_Price_ETH_ = await this.getInstrumentPrice({_instrumentAddress : this.$store.state.SIGHContractAddress });
          }
        },1000);
        this.sighInstrument = this.$store.state.SIGHState;
        this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
        this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);        
      }
    },




    async redirectLiquiditySIGHStreamOf() {                           // RE-DIRECT SIGH STREAM
      console.log('Addresses to which SIGH is to be re-directed to = ' + this.formData.toAccount);
      
      if ( Web3.utils.isAddress(this.formData.toAccount) ) {          
        await this.getDetailsOfTheFromAccount();          
      }       

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.toAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showErrorMsg({message: " The Account Address provided is not valid . Check the address again or connect with our support team through our Discord Server in case of any queries! "}); 
      }
      else if ( this.$store.state.connectedWallet != this.currentAdministratorFromAccount ) {
        console.log(this.currentAdministratorFromAccount);
        this.$showErrorMsg({message: " The Connected Account " + this.$store.state.connectedWallet  + " is not having administrator priviledges over the 'From' Account, which are currently with " + this.currentAdministratorFromAccount}); 
      }
      else if (Number(this.instrumentBalancesFromAccount[0]) == 0 &&  Number(this.instrumentBalancesFromAccount[1]) == 0  ) {
        this.$showErrorMsg({message: " The 'From Account' " + this.formData.fromAccount + " doesn't have any supplied or Borrowed " + this.selectedInstrument.symbol + " balance accuring SIGH for it. The account needs to deposit assets (accures $SIGH whenever the asset's price (USD) increases over 24 hrs period) or borrow assets ((accures $SIGH whenever the asset's price (USD) decreases over 24 hrs period) before you can Re-direct its SIGH stream. connect with our support team through our Discord Server in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        this.showLoader = true;
        let response =  await this.IToken_redirectLiquiditySIGHStreamOf( { iTokenAddress:  this.selectedInstrument.iTokenAddress, _from: this.formData.fromAccount, _to: this.formData.toAccount, symbol : this.selectedInstrument.symbol } );
        if (response.status) {  
          this.$showSuccessMsg({message: "SIGH STREAM for  "  + this.selectedInstrument.symbol +  " of the account " + this.formData.fromAccount + " has been successfully re-directed to " + this.formData.toAccount   });
          this.formData.fromAccount = null;
          this.formData.toAccount = null;
          await this.refreshCurrentInstrumentWalletState(false);
        }
        else {
          this.$showErrorMsg({message: "SIGH STREAM RE-DIRECTION FAILED : " + response.message  });
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
            this.$showInfoMsg({message:  this.$store.state.connectedWallet + " : " + this.selectedInstrument.symbol + " Instrument's $SIGH FARM State have been refreshed! " });        
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
          let response = await this.IToken_getSIGHStreamsAllowances({ iTokenAddress: this.selectedInstrument.iTokenAddress, _user: this.formData.fromAccount   });
        this.currentAdministratorFromAccount = response.liquiditySIGHStreamRedirectionAllowance
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
