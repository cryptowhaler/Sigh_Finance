<template src="./template.html"></template>

<script>
import EventBus, {EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'redeemQuantity',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      selectedInstrumentWalletState: {},
      formData : {
        redeemQuantity: null,
        redeemValue: null,
      },
      selectedInstrumentPriceETH: null,  // PRICE CONSTANTLY UPDATED
      showLoader: false,
      showLoaderRefresh: false,
    };
  },
  

  created() {
    console.log("IN LENDING / REDEEM / QUANTITY (TRADE-PANE) FUNCTION ");
    
    this.refreshThisSession = () => this.loadSessionData(); 

    this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_.instrument;       // UPDATED SELECTED INSTRUMENT (LOCALLY)
      this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
    };

    this.updateSelectedInstrument = (instrumentAddress) => {
      if ( this.selectedInstrument.instrumentAddress == instrumentAddress ) {
        this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
      }

    }

    ExchangeDataEventBus.$on(EventNames.ConnectedWalletSesssionRefreshed, this.refreshThisSession );    
    ExchangeDataEventBus.$on(EventNames.changeSelectedInstrument, this.changeSelectedInstrument);        
    ExchangeDataEventBus.$on(EventNames.ConnectedWallet_Instrument_Refreshed, this.updateSelectedInstrument);        
  },





  computed: {
    calculatedValue() {
        console.log('calculatedValue');
        if (this.selectedInstrument && this.selectedInstrument.priceDecimals) {
          console.log("COMPUTED VALUE : REDEEM QUANTITY");
          return (Number(this.formData.redeemQuantity) * ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4) ; 
          }
      return 0;
    }
  },

  methods: {

    ...mapActions(['IToken_redeem','refresh_User_Instrument_State','getInstrumentPrice']),
    
    async redeem() {   //REDEEM 
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      } 
        // WHEN THE AMOUNT ENTERED FOR REDEEMING IS GREATER THAN THE AVAILABLE BALANCE
      else if ( Number(this.formData.redeemQuantity) >  Number(this.selectedInstrumentWalletState.userDepositedBalance  )  ) {
          this.$showErrorMsg({message: " Please enter an amount less than your depsited balance . Try refreshing balances in-case it is not showing your correct deposted balance!"});
      }
      else {        
        let value =  (Number(this.formData.redeemQuantity) * ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4) ;
        console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
        console.log('Redeem Quantity - ' + this.formData.redeemQuantity);
        console.log('Redeem Value - ' + value);
        this.showLoader = true;
        let response =  await this.IToken_redeem( { iTokenAddress: this.selectedInstrument.iTokenAddress , _amount:  this.formData.redeemQuantity } );
        if (response.status) {      
          this.$showSuccessMsg({message: "REDEEM SUCCESS : " + this.formData.redeemQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully redeemed from SIGH Finance. Gas used = " + response.gasUsed });
          this.$showInfoMsg({message: " $SIGH FARMS Look forward to serving you again!"});
          await this.refreshCurrentInstrumentWalletState(false);
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Redeem',Service: 'LENDING'});
        }
        else {
          this.$showErrorMsg({message: "REDEEM FAILED : " + response.message  }); 
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
          // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Redeem',Service: 'LENDING'});
        }
        this.formData.redeemQuantity = null;
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
            this.$showInfoMsg({message: "Connected Wallet's " + this.selectedInstrument.symbol +  " Balances and Farming Yields have been refreshed! " });         
          }
        }
        catch(error) {
          console.log( 'FAILED' );
        }
        this.showLoaderRefresh = false;      
      }
    },



    loadSessionData() {
      this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
      console.log(this.selectedInstrument);
      if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
        this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
      }
      console.log(this.selectedInstrumentWalletState);
      if ( this.$store.state.isNetworkSupported  ) {
        setInterval(async () => {
          console.log("IN SET PRICE : DEPOSIT / QUANTITY");
          if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
            this.selectedInstrumentPriceETH = await this.getInstrumentPrice({_instrumentAddress : this.selectedInstrument.instrumentAddress });
          }
        },1000);
      }
    }    

  },



  destroyed() {
    ExchangeDataEventBus.$off(EventNames.ConnectedWalletSesssionRefreshed, this.refreshThisSession );    
    ExchangeDataEventBus.$off(EventNames.changeSelectedInstrument, this.changeSelectedInstrument);        
    ExchangeDataEventBus.$off(EventNames.ConnectedWallet_Instrument_Refreshed, this.updateSelectedInstrument);        

  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
