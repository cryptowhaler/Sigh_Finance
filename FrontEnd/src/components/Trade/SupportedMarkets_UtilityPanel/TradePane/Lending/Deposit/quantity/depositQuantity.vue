<template src="./template.html"></template>

<script>
import EventBus, {EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'depositQuantity',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      selectedInstrumentWalletState: this.$store.state.dummyWalletInstrumentState,
      formData : {
        depositQuantity: null,
        depositValue: null,
        enteredReferralCode: 0,
      },
      selectedInstrumentPriceETH: null,  // PRICE CONSTANTLY UPDATED
      showLoader: false,
      showLoaderRefresh: false,
      intervalActivated: false,
      displayInString: true,
      showLoaderCollateral: false,
    };
  },
  

   created() {
    console.log("IN LENDING / DEPOSIT / QUANTITY (TRADE-PANE) FUNCTION ");
    this.initiatePriceLoop();
    this.refreshThisSession = () => this.loadSessionData(); 

    this.changeSelectedInstrument = (instrument) => {       //Changing Selected Instrument
      this.selectedInstrument = instrument.instrument;       // UPDATED SELECTED INSTRUMENT (LOCALLY)
      console.log("this.selectedInstrument");
      console.log(this.selectedInstrument);
      this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
      if (this.intervalActivated == false) {
        this.initiatePriceLoop();
      }      
    };

    ExchangeDataEventBus.$on(EventNames.ConnectedWalletSesssionRefreshed, this.refreshThisSession );    
    ExchangeDataEventBus.$on(EventNames.changeSelectedInstrument, this.refreshThisSession);        
    ExchangeDataEventBus.$on(EventNames.ConnectedWallet_Instrument_Refreshed, this.refreshThisSession);        
  },





  computed: {
    calculatedValue() {
        if (this.selectedInstrument && this.selectedInstrument.priceDecimals) {
          console.log("COMPUTED VALUED");
          return (Number(this.formData.depositQuantity) * ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4) ; 
          }
      return 0;
    },

  },





  methods: {

    ...mapActions(['refresh_User_SIGH__State','ERC20_mint','LendingPool_deposit','ERC20_increaseAllowance','getInstrumentPrice','refresh_User_Instrument_State','LendingPool_setUserUseInstrumentAsCollateral']),
    
    toggle() {
      this.displayInString = !this.displayInString;
    },


    async initiatePriceLoop() {
      if ( this.$store.state.isNetworkSupported && this.selectedInstrument.instrumentAddress ) {
        setInterval(async () => {
          // console.log("IN SET PRICE : DEPOSIT / AMOUNT");
          if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
            this.intervalActivated = true;
            this.selectedInstrumentPriceETH = await this.getInstrumentPrice({_instrumentAddress : this.selectedInstrument.instrumentAddress });
          }
        },1000);
        this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
        this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);        
      }
    },

    async deposit() {   //DEPOSIT (WORKS PROPERLY)
      
      if (!this.$store.state.web3) {
        this.$showErrorMsg({title:"Not Connected to Web3", message: " You need to first connect to WEB3 (BSC Network) to interact with SIGH Finance!", timeout: 4000 });  
        this.$showInfoMsg({message: "Please install METAMASK Wallet to interact with SIGH Finance!", timeout: 4000 }); 
      }
      else if (!this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({title:"Network not Supported", message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName, timeout: 4000 }); 
        this.$showInfoMsg({message: " Networks currently supported - Binance Smart Chain testnet (97) ", timeout: 4000 }); 
        return;
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }       
      // USER BALANCE IS LESS THAN WHAT HE WANTS TO DEPOSIT
      else if ( Number(this.formData.depositQuantity) >  Number(this.selectedInstrumentWalletState.userBalance)  ) {
        this.$showErrorMsg({message: " You do not have the mentioned amount of " + this.selectedInstrument.symbol +  " tokens. Please make sure that you have the needed amount in your connected Wallet! " });        
      }
      // WHEN THE ALLOWANCE IS LESS THAN WHAT IS NEEDED
      else if ( Number(this.formData.depositQuantity) >  Number(this.selectedInstrumentWalletState.userAvailableAllowance)  ) {
        let dif = Number(this.formData.depositQuantity) - Number(this.selectedInstrumentWalletState.userAvailableAllowance);
        this.$showErrorMsg({message: " You first need to 'APPROVE' an amount greater than " + dif + " " + this.selectedInstrument.symbol + " so that the deposit can be processed through the ERC20 Interface's transferFrom() Function."}); // this.formData.depositQuantity + "  " + this.selectedInstrument.symbol +  " worth " + value + " USD approval failed. Try increasing Gas or contact our team at contact@sigh.finance in case of any queries." });        
      }
      else {       // WHEN ABOVE CONDITIONS ARE MET SO THE TRANSACTION GOES THROUGH
        this.showLoader = true;
        let value =  (Number(this.formData.depositQuantity) * ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4) ;
        console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
        console.log('Available Allowance - ' + this.selectedInstrumentWalletState.userAvailableAllowance );      
        console.log('Deposit Quantity - ' + this.formData.depositQuantity);
        console.log('Deposit Value - ' + value);

        let response =  await this.LendingPool_deposit( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  this.formData.depositQuantity, _referralCode: this.formData.enteredReferralCode, symbol: this.selectedInstrument.symbol, decimals: this.selectedInstrument.decimals  });
        if (response.status) {      
          this.$showSuccessMsg({title:"DEPOSIT SUCCESSFUL" , message: this.formData.depositQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD have been successfully deposited to SIGH Finance. Enjoy your $SIGH farm yields." });
          this.$showInfoMsg({title:"New I-" + this.selectedInstrument.symbol + " Minted : " , message: " Interest & $SIGH bearing ITokens (ERC20) are issued as debt against the deposits made in the SIGH Finance Protocol on a 1:1 basis. You can read more about it at medium.com/SighFinance", timeout: 4000 }); 
          await this.refreshCurrentInstrumentWalletState(false);
        }
        else {
          this.$showErrorMsg({title:"DEPOSIT FAILED" ,message: this.formData.depositQuantity + "  " +  this.selectedInstrument.symbol + " Deposit FAILED. Check Etherescan to undersand why and try again! ", timeout: 7000 }); 
          this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 });        
        }
        this.formData.depositQuantity = null;
        this.showLoader = false;
      }
    },
      


    async mint() {
      if (!this.$store.state.web3) {
        this.$showErrorMsg({title:"Not Connected to Web3", message: " You need to first connect to WEB3 (BSC Network) to interact with SIGH Finance!", timeout: 4000 });  
        this.$showInfoMsg({message: "Please install METAMASK Wallet to interact with SIGH Finance!", timeout: 4000 }); 
      }
      else if (!this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({title:"Network not Supported", message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName, timeout: 4000 }); 
        this.$showInfoMsg({message: " Networks currently supported - Binance Smart Chain testnet (97) ", timeout: 4000 }); 
        return;
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }       
      else if (this.$store.state.networkId != '42' && this.$store.state.networkId != '97' ) { 
        this.$showErrorMsg({message: " Mock tokens are not available for testing over the currently connected Network. "}); 
      }
      else {
        let value =  (Number(this.formData.depositQuantity) * ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4) ;
        console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
        console.log(this.selectedInstrument);
        console.log('Deposit (Mint) Quantity - ' + this.formData.depositQuantity);
        console.log('Deposit Value - ' + value);
        console.log('Decimals- ' + this.selectedInstrument.decimals);
        this.showLoader = true;
        let response = await this.ERC20_mint({tokenAddress: this.selectedInstrument.instrumentAddress , quantity: this.formData.depositQuantity, symbol: this.selectedInstrument.symbol, decimals: this.selectedInstrument.decimals  });
        if (response.status) {      
          this.$showSuccessMsg({title:"MINT SUCCESSFUL" ,message: this.formData.depositQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully minted for testing. Gas used = " + response.gasUsed });
          await this.refreshCurrentInstrumentWalletState(false);         // UPDATE THE STATE OF THE SELECTED INSTRUMENT
        }
        else {
          this.$showErrorMsg({title:"MINT FAILED" ,message: this.formData.depositQuantity+ "  " +  this.selectedInstrument.symbol + " Mint FAILED. Check Etherescan to undersand why and try again! ", timeout: 7000 }); 
          this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 });             
        }
        this.formData.depositValue = null;
        this.showLoader = false;
      }
    },



    async approve() {   //APPROVE (WORKS PROPERLY) 
      if (!this.$store.state.web3) {
        this.$showErrorMsg({title:"Not Connected to Web3", message: " You need to first connect to WEB3 (BSC Network) to interact with SIGH Finance!", timeout: 4000 });  
        this.$showInfoMsg({message: "Please install METAMASK Wallet to interact with SIGH Finance!", timeout: 4000 }); 
      }
      else if (!this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({title:"Network not Supported", message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName, timeout: 4000 }); 
        this.$showInfoMsg({message: " Networks currently supported - Binance Smart Chain testnet (97) ", timeout: 4000 }); 
        return;
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }       
      else {       // WHEN ABOVE CONDITIONS ARE MET SO THE TRANSACTION GOES THROUGH
        this.showLoader = true;
        let value =  (Number(this.formData.depositQuantity) * ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4) ;
        console.log('Selected Instrument - ' + this.selectedInstrument.symbol)
        console.log('Quantity to be Approved - ' + this.formData.depositQuantity);
        console.log('Value - ' + value);
        let response = await this.ERC20_increaseAllowance( { tokenAddress: this.selectedInstrument.instrumentAddress, spender: this.$store.getters.LendingPoolCoreContractAddress , addedValue:  this.formData.depositQuantity , symbol :this.selectedInstrument.symbol, decimals: this.selectedInstrument.decimals  } );
        if (response.status) { 
          await this.refreshCurrentInstrumentWalletState(false);        
          this.$showSuccessMsg({title:"APPROVAL SUCCESS" , message: "Maximum of " + this.selectedInstrumentWalletState.userAvailableAllowance + "  " +  this.selectedInstrument.symbol +  " can now be deposited to SIGH Finance. Gas used = " + response.gasUsed  });
          this.formData.depositQuantity = null;
        }
        else {
          this.$showErrorMsg({title:"FAILED TO INCREASE ALLOWANCE" ,message: Number(this.formData.depositQuantity).toFixed(4) + "  " +  this.selectedInstrument.symbol + " FAILED to be Approved for further deposits into SIGH Finance. Check Etherescan to undersand why and try again! ", timeout: 7000 }); 
          this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 });             
        }
        this.showLoader = false;
      }
    }, 


    async switchInstrumentAsCollateral(_switch) {
      if (!this.$store.state.web3) {
        this.$showErrorMsg({title:"Not Connected to Web3", message: " You need to first connect to WEB3 (BSC Network) to interact with SIGH Finance!", timeout: 4000 });  
        this.$showInfoMsg({message: "Please install METAMASK Wallet to interact with SIGH Finance!", timeout: 4000 }); 
      }
      else if (!this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({title:"Network not Supported", message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName, timeout: 4000 }); 
        this.$showInfoMsg({message: " Networks currently supported - Binance Smart Chain testnet (97) ", timeout: 4000 }); 
        return;
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
        return;
      }       
      let instrumentGlobalStateConfig = this.$store.state.supportedInstrumentConfigs.get(this.selectedInstrument.instrumentAddress);      
      if ( !instrumentGlobalStateConfig.usageAsCollateralEnabled ) {
        this.$showErrorMsg({message: this.selectedInstrument.symbol + " is currently not Enabled to be used as Collateral!" });        
      }
      // USER DOES NOT HAVE ANY DEPOSITS
      else if ( Number(this.selectedInstrumentWalletState.userDepositedBalance) == 0  ) {
        this.$showErrorMsg({message: " You do not have any deposited  " + this.selectedInstrument.symbol +  ". You need to have some deposited balance before you can enable / disable it as Collateral! " });        
      }
      else {
        this.showLoaderCollateral = true;
        let response = await this.LendingPool_setUserUseInstrumentAsCollateral({_instrument: this.selectedInstrument.instrumentAddress, _useAsCollateral: _switch, symbol: this.selectedInstrument.symbol  });
        if (response.status) { 
          await this.refreshCurrentInstrumentWalletState(false);       
          if (_switch) {
            this.$showSuccessMsg({title: this.selectedInstrument.symbol + "ENABLED AS COLLATERAL" ,message: this.selectedInstrument.symbol  + " has been Enabled as Collateral! Gas used = " + response.gasUsed  });
          } 
          else {
            this.$showSuccessMsg({title: this.selectedInstrument.symbol + "DISABLED AS COLLATERAL" ,message: this.selectedInstrument.symbol  + " has been Disabled as Collateral! Gas used = " + response.gasUsed  });
          }
        }
        else {
          if (_switch) {
            this.$showErrorMsg({title:"FAILED TO ENABLE " + this.selectedInstrument.symbol + " AS COLLATERAL" ,message:  + "Check Etherescan to undersand why and try again! ", timeout: 7000 }); 
            this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 });             
          }
          else {
            this.$showErrorMsg({title:"FAILED TO DISABLE " + this.selectedInstrument.symbol + " AS COLLATERAL" ,message:  + "Check Etherescan to undersand why and try again! ", timeout: 7000 }); 
            this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 });             
          }
        }
        this.showLoaderCollateral = false;
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
            this.$showInfoMsg({title: this.selectedInstrument.symbol + ": Balances Refreshed", message: "Connected Wallet's " + this.selectedInstrument.symbol +  " Balances have been refreshed! ", timeout: 3000  });        
          }
        }
        catch(error) {
            this.$showInfoMsg({title: this.selectedInstrument.symbol + ": Balances Refresh FAILED", message: "", timeout: 3000  });               
        }
          this.showLoaderRefresh = false;
      }
    },



    async loadSessionData() {
      if (this.intervalActivated == false) {
        this.initiatePriceLoop();
      }      
      this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
      console.log(this.selectedInstrument);
      if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
        console.log("In Deposit Quantity : loadSessionData : Before loading the state");
        this.selectedInstrumentWalletState = await this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
        console.log("In Deposit Quantity : loadSessionData : After loading the state");
        console.log(this.selectedInstrumentWalletState);
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
        let inK = (Number(number) / 1000).toFixed(2);
        return inK.toString() + ' K';
      } 
      return Number(number).toFixed(2);
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
