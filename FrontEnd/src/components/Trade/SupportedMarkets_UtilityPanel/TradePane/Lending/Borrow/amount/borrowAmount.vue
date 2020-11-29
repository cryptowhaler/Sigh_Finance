<template src="./template.html"></template>

<script>
import EventBus, {EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'borrowAmount',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      selectedInstrumentWalletState: {},
      formData : {
        borrowQuantity: null,
        borrowValue: null,
        interestRateMode: 'Stable',
      },
      interestRateModes: ['Stable','Variable'],
      selectedInstrumentPriceETH: null,
      showLoader: false,
      showLoaderRefresh: false,
      intervalActivated: false,
      displayInString: true,
    };
  },
  
  

  created() {
    console.log("IN LENDING / BORROW / AMOUNT (TRADE-PANE) FUNCTION ");
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
    calculatedQuantity() {
        if (this.selectedInstrument && this.selectedInstrument.priceDecimals) {
          console.log("COMPUTED : BORROW AMOUNT");
          return (  Number(this.formData.borrowValue) / ( ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ) ).toFixed(4) ;
          }
      return 0;
    }
  },

  methods: {

    ...mapActions(['LendingPool_borrow','getInstrumentPrice','refresh_User_Instrument_State']),
    
    toggle() {
      this.displayInString = !this.displayInString;
    },

    async initiatePriceLoop() {
      if ( this.$store.state.isNetworkSupported && this.selectedInstrument.instrumentAddress ) {
        setInterval(async () => {
          // console.log("IN SET PRICE : BORROW / AMOUNT");
          if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
            this.intervalActivated = true;
            this.selectedInstrumentPriceETH = await this.getInstrumentPrice({_instrumentAddress : this.selectedInstrument.instrumentAddress });
          }
        },1000);
        this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
        this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);        
      }
    },



    async borrow() {   //BORROW --> TO BE CHECKED
      let quantity = null;
      if (this.$store.state.isNetworkSupported && this.selectedInstrument.priceDecimals && this.$store.state.ethereumPriceUSD ) {
        quantity =  Number(this.formData.borrowValue) / ( ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) )  ;
      }

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      } 
      else  {       
        let instrumentGlobalState = this.$store.state.supportedInstrumentGlobalStates.get(this.selectedInstrument.instrumentAddress);
        let instrumentGlobalStateConfig = this.$store.state.supportedInstrumentGlobalStates.get(this.selectedInstrument.instrumentAddress);
        if ( !instrumentGlobalStateConfig.borrowingEnabled  ) {
          this.$showErrorMsg({message: " Borrowing is currently disabled for the selected Instrument. Contact our Team at contact@sigh.finance in case you have any queries! "}); 
        }
        else if ( this.formData.interestRateMode == 'Stable' && !instrumentGlobalStateConfig.stableBorrowRateEnabled) {
          this.$showErrorMsg({message: " Stable borrow rate is currently disabled for the selected Instrument. Try borrowing at variable rate. Contact our Team at contact@sigh.finance in case you have any queries! "}); 
        }
        else if ( Number(quantity) > Number(instrumentGlobalState.availableLiquidity ) ) {
          this.$showErrorMsg({message: " SIGH Finance currently doesn't have the needed Liquidity to process this Loan. Available Liquidity =  " + instrumentGlobalState.availableLiquidity + " " + this.selectedInstrument.symbol + ". Try again after some time! "}); 
        }
        else {
          console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
          console.log('Borrow Quantity - ' + quantity);
          console.log('Interest Rate Mode - ' + this.formData.interestRateMode);     
          console.log('Borrow Value - ' + this.formData.borrowValue);

          this.showLoader = true;        
          let interestRateMode = this.formData.interestRateMode == 'Stable' ? 1 : 2;      
          let response =  await this.LendingPool_borrow( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  quantity, _interestRateMode: interestRateMode, _referralCode: 0 , symbol: this.selectedInstrument.symbol, decimals: this.selectedInstrument.decimals });
          if (response.status) {      
            this.$showSuccessMsg({message: "BORROW SUCCESS : " + Number(quantity).toFixed(4) + "  " +  this.selectedInstrument.symbol +  " worth " + this.formData.borrowValue + " USD have been successfully borrowed from SIGH Finance. Gas used = " + response.gasUsed });
            this.$showInfoMsg({message: "ThankYou for choosing $SIGH Farms! We look forward to serving your again!"});
            await this.refreshCurrentInstrumentWalletState(false);
          }
          else {
            this.$showErrorMsg({message: "BORROW FAILED : " + response.message  }); 
            this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
          }
          this.formData.borrowQuantity = null;
          this.showLoader = false;
        }
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
      }
          this.showLoaderRefresh = false;      
    },



    loadSessionData() {
      if ( this.$store.state.web3 && this.$store.state.isNetworkSupported ) {      
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

    getBalanceString(number)  {
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
