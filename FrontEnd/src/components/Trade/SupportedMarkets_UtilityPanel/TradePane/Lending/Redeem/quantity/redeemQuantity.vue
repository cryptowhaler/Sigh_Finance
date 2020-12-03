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
      intervalActivated: false,
      displayInString: true,
    };
  },
  

  created() {
    console.log("IN LENDING / REDEEM / QUANTITY (TRADE-PANE) FUNCTION ");
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
    
    toggle() {
      this.displayInString = !this.displayInString;
    },


    async initiatePriceLoop() {
      if ( this.$store.state.isNetworkSupported && this.selectedInstrument.instrumentAddress ) {
        setInterval(async () => {
          // console.log("IN SET PRICE : REDEEM / QUANTITY");
          if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
            this.intervalActivated = true;
            this.selectedInstrumentPriceETH = await this.getInstrumentPrice({_instrumentAddress : this.selectedInstrument.instrumentAddress });
          }
        },1000);
        this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
        this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);        
      }
    },


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
        let response =  await this.IToken_redeem( { iTokenAddress: this.selectedInstrument.iTokenAddress , _amount:  this.formData.redeemQuantity, symbol: this.selectedInstrument.symbol, decimals: this.selectedInstrument.decimals });
        if (response.status) {      
          this.$showSuccessMsg({message: "REDEEM SUCCESS : " + this.formData.redeemQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully redeemed from SIGH Finance. Gas used = " + response.gasUsed });
          this.$showInfoMsg({message: " $SIGH FARMS Look forward to serving you again!"});
          await this.refreshCurrentInstrumentWalletState(false);
        }
        else {
          this.$showErrorMsg({message: "REDEEM FAILED : " + response.message  }); 
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
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
      if (this.intervalActivated == false) {
        this.initiatePriceLoop();
      }      
      this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
      console.log(this.selectedInstrument);
      if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
        this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
      }
      console.log(this.selectedInstrumentWalletState);
    },
    
    
    getBalanceString(number)  {
      if ( Number(number) >= 1000000000 ) {
        let inBil = (Number(number) / 1000000000).toFixed(2);
        return inBil.toString() + ' B';
      } 
      if ( Number(number) >= 1000000 ) {
        let inMil = (Number(number) / 1000000).toFixed(2);
        return inMil.toString() + ' M';
      } 
      if ( Number(number) >= 1000 ) {
        let inK = (Number(number) / 1000).toFixed(3);
        return inK.toString() + ' K';
      } 
      return Number(number).toFixed(2);
    },        

  },



  destroyed() {
    ExchangeDataEventBus.$off(EventNames.ConnectedWalletSesssionRefreshed);    
    ExchangeDataEventBus.$off(EventNames.changeSelectedInstrument );        
    ExchangeDataEventBus.$off(EventNames.ConnectedWallet_Instrument_Refreshed );        

  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
