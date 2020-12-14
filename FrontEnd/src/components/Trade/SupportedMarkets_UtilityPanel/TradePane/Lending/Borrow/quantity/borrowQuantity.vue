<template src="./template.html"></template>

<script>
import EventBus, {EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'borrowQuantity',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      selectedInstrumentWalletState: this.$store.state.dummyWalletInstrumentState,
      formData : {
        borrowQuantity: null,
        borrowValue: null,
        interestRateMode: 'Variable',
      },
      interestRateModes: ['Variable','Stable'],
      selectedInstrumentPriceETH: null,
      showLoader: false,
      showLoaderRefresh: false,
      intervalActivated: false,
      displayInString: true,
      showLoaderBorrowRateSwap: false,
    };
  },
  

  created() {
    console.log("IN LENDING / BORROW / QUANTITY (TRADE-PANE) FUNCTION ");
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
        if (this.selectedInstrument && this.selectedInstrument.priceDecimals) {
          console.log("COMPUTED : BORROW QUANTITY");
          return (Number(this.formData.borrowQuantity) * ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4) ; 
          }
      return 0;
    }
  },




  methods: {

    ...mapActions(['LendingPool_borrow','getInstrumentPrice','refresh_User_Instrument_State','LendingPool_swapBorrowRateMode']),
    
    toggle() {
      this.displayInString = !this.displayInString;
    },

    async initiatePriceLoop() {
      if ( this.$store.state.isNetworkSupported && this.selectedInstrument.instrumentAddress ) {
        setInterval(async () => {
          // console.log("IN SET PRICE : BORROW / QUANTITY");
          if (this.selectedInstrument && this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
            this.intervalActivated = true;
            this.selectedInstrumentPriceETH = await this.getInstrumentPrice({_instrumentAddress : this.selectedInstrument.instrumentAddress });
          }
        },1000);
        this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
        this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);        
      }
    },



    async borrow() {   //BORROW --> TO BE CHECKED
      if (!this.$store.state.web3) {
        this.$showErrorMsg({title:"Not Connected to Web3", message: " You need to first connect to WEB3 (Ethereum Network) to interact with SIGH Finance!", timeout: 4000 });  
        this.$showInfoMsg({message: "Please install METAMASK Wallet to interact with SIGH Finance!", timeout: 4000 }); 
      }
      else if (!this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({title:"Network not Supported", message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName, timeout: 4000 }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) ", timeout: 4000 }); 
        return;
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      } 
      else  {       
        let instrumentGlobalStateConfig = this.$store.state.supportedInstrumentConfigs.get(this.selectedInstrument.instrumentAddress);
        console.log(instrumentGlobalStateConfig);
        if ( !instrumentGlobalStateConfig.borrowingEnabled  ) {
          this.$showErrorMsg({message: " Borrowing is currently disabled for the selected Instrument. Contact our Team at contact@sigh.finance in case you have any queries! "}); 
        }
        else if ( this.formData.interestRateMode == 'Stable' && !instrumentGlobalStateConfig.stableBorrowRateEnabled) {
          this.$showErrorMsg({message: " Stable borrow rate is currently disabled for the selected Instrument. Try borrowing at variable rate. Contact our Team at contact@sigh.finance in case you have any queries! "}); 
        }
        else if ( this.formData.interestRateMode == 'Stable' && instrumentGlobalStateConfig.usageAsCollateralEnabled && this.selectedInstrumentWalletState.usageAsCollateralEnabled &&  (Number(this.selectedInstrumentWalletState.userDepositedBalance) > Number(quantity))  ) {
          this.$showErrorMsg({message: " The amount to be borrowed needs to be greater than your deposited " + this.selectedInstrument.symbol + " balance for it to be issued at a STABLE rate!"}); 
        }
        else if ( Number(this.formData.borrowQuantity) > Number(instrumentGlobalStateConfig.availableLiquidity ) ) {
          this.$showErrorMsg({message: " SIGH Finance currently doesn't have the needed Liquidity to process this Loan. Available Liquidity =  " + + instrumentGlobalStateConfig.availableLiquidity + " ( " +  this.getBalanceString(instrumentGlobalStateConfig.availableLiquidityUSD) + " USD ) " + this.selectedInstrument.symbol + ". Try again after some time! "}); 
        }
        else {
          let value =  (Number(this.formData.borrowQuantity) * ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4) ;
          console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
          console.log('Borrow Quantity - ' + this.formData.borrowQuantity);
          console.log('Interest Rate Mode - ' + this.formData.interestRateMode);     
          console.log('Borrow Value - ' + value);

          this.showLoader = true;        
          let interestRateMode = this.formData.interestRateMode == 'Stable' ? 1 : 2;      
          let response =  await this.LendingPool_borrow( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  this.formData.borrowQuantity, _interestRateMode: interestRateMode, _referralCode: 0, symbol: this.selectedInstrument.symbol, decimals: this.selectedInstrument.decimals });
          if (response.status) {      
            this.$showSuccessMsg({title: "BORROW SUCCESSFUL",message: this.formData.borrowQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully borrowed from SIGH Finance. Gas used = " + response.gasUsed });
            this.$showInfoMsg({message: "ThankYou for choosing $SIGH Farms! We look forward to serving your capital requirements again!"});
            await this.refreshCurrentInstrumentWalletState(false);
          }
          else {
            this.$showErrorMsg({title: "BORROW FAILED", message: this.formData.borrowQuantity + "  " +  this.selectedInstrument.symbol + " failed to be borrowed from SIGH Finance.  Check Etherescan to undersand why and try again! ", timeout: 7000 }); 
            this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 }); 
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
          if (toDisplay) {
            this.$showInfoMsg({title: this.selectedInstrument.symbol + ": Balances Refreshed", message: "Connected Wallet's " + this.selectedInstrument.symbol +  " Balances have been refreshed! ", timeout: 3000  });            
          }
        }
        catch(error) {
          console.log( 'FAILED' );
        }
          this.showLoaderRefresh = false;
      }
    },


    async swapBorrowRateMode(rateType) {
      if (!this.$store.state.web3) {
        this.$showErrorMsg({title:"Not Connected to Web3", message: " You need to first connect to WEB3 (Ethereum Network) to interact with SIGH Finance!", timeout: 4000 });  
        this.$showInfoMsg({message: "Please install METAMASK Wallet to interact with SIGH Finance!", timeout: 4000 }); 
      }
      else if (!this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({title:"Network not Supported", message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName, timeout: 4000 }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) ", timeout: 4000 }); 
        return;
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
        return;
      } 
      if (rateType == 'stable') {
        let instrumentGlobalStateConfig = this.$store.state.supportedInstrumentConfigs.get(this.selectedInstrument.instrumentAddress);
        if ( instrumentGlobalStateConfig.usageAsCollateralEnabled && this.selectedInstrumentWalletState.usageAsCollateralEnabled &&  (Number(this.selectedInstrumentWalletState.userDepositedBalance) > Number(this.selectedInstrumentWalletState.currentBorrowBalance))  ) {
          this.$showErrorMsg({message: " The instrument needs to be disabled as collateral or the current borrow balance needs to be greater than the deposited " + this.selectedInstrument.symbol + " balance for it to be switched to the STABLE rate!"}); 
          return;
        }
      }
      this.showLoaderBorrowRateSwap = true;
      let response =  await this.LendingPool_swapBorrowRateMode({_instrument: this.selectedInstrument.instrumentAddress, symbol: this.selectedInstrument.symbol  });
      if (response.status) {    
        if (rateType == 'stable') {
          this.$showSuccessMsg({message: "BORROW position for the instrument "+ this.selectedInstrument.symbol + " successfully switched to STABLE Interest Rate! Gas used = " + response.gasUsed });
        }
        if (rateType == 'variable') {
          this.$showSuccessMsg({message: "BORROW position for the instrument "+ this.selectedInstrument.symbol + " successfully switched to VARIABLE Interest Rate! Gas used = " + response.gasUsed });
        }        
        await this.refreshCurrentInstrumentWalletState(false);
        console.log(this.selectedInstrumentWalletState);
      }
      else {
        this.$showErrorMsg({title: "BORROW Rate Switch Failed : ", message: "Failed to switch Borrow Rate for the instrument " + this.selectedInstrument.symbol  }); 
        this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 }); 
      }
      this.showLoaderBorrowRateSwap = false;
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
      if ( Number(number) >= 1000000000 ) {
        let inBil = (Number(number) / 1000000000).toFixed(2);
        return inBil.toString() + ' B';
      } 
      if ( Number(number) >= 1000000 ) {
        let inMil = (Number(number) / 1000000).toFixed(2);
        return inMil.toString() + ' M';
      } 
      if ( Number(number) >= 1000 ) {
        let inK = (Number(number) / 1000).toFixed(2);
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
