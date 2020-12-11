<template src="./template.html"></template>

<script>
import EventBus, {EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'yourAccount',

  data() {
    return {
      sighInstrument: this.$store.state.SIGHState,
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      selectedInstrumentWalletState: this.$store.state.dummyWalletInstrumentState,
      formData : {
        toAccount: null,                  // to which SIGH is to be re-directed
      },
      SIGH_Price_ETH_ : null,
      SIGH_Price_USD_ : null,
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


  methods: {

    ...mapActions(['IToken_redirectLiquiditySIGHStream','IToken_allowLiquiditySIGHRedirectionTo','IToken_claimMySIGH','getInstrumentPrice','refresh_User_Instrument_State']),
    
    async initiatePriceLoop() {
      if ( this.$store.state.isNetworkSupported  ) {
        setInterval(async () => {
          if (this.$store.state.SIGHContractAddress != '0x0000000000000000000000000000000000000000') {
            this.intervalActivated = true;
            this.SIGH_Price_ETH_ = await this.getInstrumentPrice({_instrumentAddress : this.$store.state.SIGHContractAddress });
            this.SIGH_Price_USD_ = Number( ( Number(this.SIGH_Price_ETH_) / Math.pow(10,this.sighInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4);
            // console.log("SIGH STREAM : YOUR ACCOUNT, Price (USD) " + this.SIGH_Price_USD_);
          }
        },1000);
      this.sighInstrument = this.$store.state.SIGHState;    
      this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
      this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);        
      }
    },


    async redirectLiquiditySIGHStream() {       // RE-DIRECT SIGH STREAM
      console.log('Addresses to which SIGH is to be re-directed to = ' + this.formData.toAccount);
      
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showInfoMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }
      else if (Number(this.selectedInstrumentWalletState.userDepositedBalance ) == 0 &&  Number(this.selectedInstrumentWalletState.currentBorrowBalance ) == 0  ) {
        this.$showErrorMsg({message: " The Connected Account " + this.$store.state.connectedWallet + " doesn't have any supplied or Borrowed " + this.selectedInstrument.symbol + " balance accuring SIGH for itself. You need to deposit assets (accures $SIGH whenever the asset's price (USD) increases over 24 hrs period) or borrow assets ((accures $SIGH whenever the asset's price (USD) decreases over 24 hrs period) before you can Re-direct its SIGH stream. connect with our support team through our Discord Server in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.toAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showErrorMsg({message: " The Account Address provided is not valid . Check the address again or connect with our support team through our Discord Server in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        this.showLoader = true;
        let response =  await this.IToken_redirectLiquiditySIGHStream( { iTokenAddress:  this.selectedInstrument.iTokenAddress, _to: this.formData.toAccount, symbol : this.selectedInstrument.symbol } );
        if (response.status) {  
          this.$showSuccessMsg({message: "LIQUIDITY SIGH STREAM for the instrument "  + this.selectedInstrument.symbol +  " has been successfully re-directed to " + this.formData.toAccount + " from the connected Account " +  this.$store.state.connectedWallet  });
          this.formData.toAccount = null;
          await this.refreshCurrentInstrumentWalletState(true);
        }
        else {
          this.$showErrorMsg({message: "LIQUIDITY SIGH STREAM RE-DIRECTION FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
        this.showLoader = false;
      }
    },



    async allowLiquiditySIGHRedirectionTo() {                           // RE-DIRECT SIGH STREAM

      console.log('Account to which the administrator priviledges to re-direct SIGH will be transferred = ' + this.formData.toAccount);

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported by SIGH Finance - 1) Ethereum :  Kovan Testnet(42) " }); 
      }      
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showInfoMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }
      else if (Number(this.selectedInstrumentWalletState.userDepositedBalance ) == 0 &&  Number(this.selectedInstrumentWalletState.currentBorrowBalance ) == 0  ) {
        this.$showErrorMsg({message: " The Connected Account " + this.$store.state.connectedWallet + " doesn't have any supplied or Borrowed " + this.selectedInstrument.symbol + " balance accuring SIGH for itself. You need to deposit assets (accures $SIGH whenever the asset's price (USD) decreases over 24 hrs period) or borrow assets ((accures $SIGH whenever the asset's price (USD) increases over 24 hrs period) before you can Re-direct its SIGH stream. connect with our support team through our Discord Server in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.toAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showErrorMsg({message: " The Account Address provided is not valid . Check the address again or connect with our support team through our Discord Server in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        this.showLoader = true;
        let response =  await this.IToken_allowLiquiditySIGHRedirectionTo( { iTokenAddress:  this.selectedInstrument.iTokenAddress, _to: this.formData.toAccount, symbol : this.selectedInstrument.symbol } );
        if (response.status) {  
          this.$showSuccessMsg({message: "ADMINISTRATOR PRIVILEDGES to re-direct the LIQUIDITY SIGH STREAM for the instrument "  + this.selectedInstrument.symbol +  " of the connected Account " +  this.$store.state.connectedWallet + " has been transferred to " + this.formData.toAccount  });
          this.formData.toAccount = null;
          await this.refreshCurrentInstrumentWalletState(true);          
        }
        else {
          this.$showErrorMsg({message: "LIQUIDITY SIGH STREAM : TRANSFERING ADMINISTRATOR PRIVILEDGES FAILED: " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
        this.showLoader = false;
      }
    },




    async claimMySIGH() {                           // RE-DIRECT SIGH STREAM

      console.log(' Claim SIGH = ');

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported by SIGH Finance - 1) Ethereum :  Kovan Testnet(42) " }); 
      }      
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }
      // else if ( Number(this.instrumentBalances[0]) == 0 && Number(this.instrumentBalances[1]) == 0  && Number(this.accuredSIGH) == 0  ) {
      //   this.$showErrorMsg({message: " The Connected Account " + this.$store.state.connectedWallet + " doesn't have any SIGH accured and haven't yet supplied / Borrowed any " + this.selectedInstrument.symbol + " which can farm SIGH to hedge its losses. connect with our support team through our Discord Server in case of any queries! "}); 
      // }
      else {                                  // EXECUTE THE TRANSACTION
        this.showLoader = true;
        let response =  await this.IToken_claimMySIGH({iTokenAddress : this.selectedInstrument.iTokenAddress, symbol : this.selectedInstrument.symbol });
        if (response.status) {  
          this.$showSuccessMsg({message: " Farmed $SIGH have been successfully harvested!" });
          await this.refreshCurrentInstrumentWalletState(true);                    
        }
        else {
          this.$showErrorMsg({message: " HARVESTING FARMED $SIGH Failed: " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
        this.formData.toAccount = null;
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
