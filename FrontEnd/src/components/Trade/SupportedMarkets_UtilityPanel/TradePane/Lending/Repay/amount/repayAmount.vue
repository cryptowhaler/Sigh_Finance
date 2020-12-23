<template src="./template.html"></template>

<script>
import EventBus, {EventNames,} from '@/eventBuses/default';

import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'repayAmount',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      selectedInstrumentWalletState: this.$store.state.dummyWalletInstrumentState,
      formData : {
        repayQuantity: null,
        repayValue: null,
        onBehalfOf: null,
      },
      selectedInstrumentPriceETH: null,  // PRICE CONSTANTLY UPDATED
      showLoader: false,
      showLoaderRefresh: false,
      intervalActivated: false,
      displayInString: true,
    };
  },
  


  created() {
    console.log("IN LENDING / REPAY / AMOUNT (TRADE-PANE) FUNCTION ");
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
          console.log("COMPUTED : REPAY AMOUNT");
          return (Number(this.formData.repayValue) / ( ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ) ).toFixed(4) ;
        }
      return 0;
    }
  },

  methods: {

    ...mapActions(['LendingPool_repay','ERC20_increaseAllowance','refresh_User_Instrument_State','LendingPoolCore_getUserBorrowBalances','getInstrumentPrice']),
    
    toggle() {
      this.displayInString = !this.displayInString;
    },


    async initiatePriceLoop() {
      if ( this.$store.state.isNetworkSupported && this.selectedInstrument.instrumentAddress ) {
        setInterval(async () => {
          // console.log("IN SET PRICE : REPAY / AMOUNT");
          if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
            this.intervalActivated = true;
            this.selectedInstrumentPriceETH = await this.getInstrumentPrice({_instrumentAddress : this.selectedInstrument.instrumentAddress });
          }
        },1000);
        this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
        this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);        
      }
    },


    async repay() {   //REPAY
      let quantity = null;
      if (this.$store.state.isNetworkSupported && this.selectedInstrument.priceDecimals && this.$store.state.ethereumPriceUSD ) {
        quantity = Number(this.formData.repayValue) / ( ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ) ;
      }

      if (!this.$store.state.web3) {
        this.$showErrorMsg({title:"Not Connected to Web3", message: " You need to first connect to WEB3 (BSC Network) to interact with SIGH Finance!", timeout: 4000 });  
        this.$showInfoMsg({message: "Please install METAMASK Wallet to interact with SIGH Finance!", timeout: 4000 }); 
      }
      else if (!this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({title:"Network not Supported", message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName, timeout: 4000 }); 
        this.$showInfoMsg({message: " Networks currently supported - Binance Smart Chain testnet (97) ", timeout: 4000 }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }     
      else if (this.formData.onBehalfOf && !Web3.utils.isAddress(this.formData.onBehalfOf) ) {
        this.$showErrorMsg({message: " The address provided in 'onBehalfOf' section is invalid. Please provide the correct address or make this column empty if you want to repay the borrow amount for the connected wallet." });         
      }
      // USER BALANCE IS LESS THAN WHAT HE WANTS TO REPAY
      else if ( Number(quantity) >  Number(this.selectedInstrumentWalletState.userBalance)  ) {
        this.$showErrorMsg({message: " You do not have the mentioned amount of " + this.selectedInstrument.symbol +  " tokens. Please make sure that you have the needed amount in your connected Wallet! " });        
      }
      // WHEN THE ALLOWANCE IS LESS THAN WHAT IS NEEDED
      else if ( Number(quantity) >  Number(this.selectedInstrumentWalletState.userAvailableAllowance)  ) {
        let dif = Number(quantity) - Number(this.selectedInstrumentWalletState.userAvailableAllowance);
        this.$showErrorMsg({message: " You first need to 'APPROVE' an amount greater than " + dif + " " + this.selectedInstrument.symbol + " so that the repayment can be processed through the ERC20 Interface's transferFrom() Function."}); 
      }
      else {      
        console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
        console.log('Repay Quantity - ' + quantity );
        console.log('Repay Value - ' + this.formData.repayValue);
        // ON BEHALF OF 
        if (Web3.utils.isAddress(this.formData.onBehalfOf)) { 
          let borrowBalance = await this.getOnBehalfOfBorrowBalances();
          if (Number(borrowBalance) < Number(quantity) ) {
            this.$showErrorMsg({message: " The amount entered to be repaid for the account " + this.formData.onBehalfOf +  " exceeds its current borrowed balance, which is + " + borrowBalance + " " + this.selectedInstrument.symbol + ". Please enter an amount less than its current Borrowed Balance!" }); 
          }
          else {
            console.log('ON BEHALF OF  - ' +  this.formData.onBehalfOf);
            this.showLoader = true;      
            let response =  await this.LendingPool_repay( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  quantity, _onBehalfOf: this.formData.onBehalfOf , symbol: this.selectedInstrument.symbol, decimals: this.selectedInstrument.decimals });
            if (response.status) {      
              this.$showSuccessMsg({title: "REPAYMENT  SUCCESSFUL" ,message: Number(quantity).toFixed(4) + "  " +  this.selectedInstrument.symbol +  " worth " + this.formData.repayValue + " USD have been successfully repayed to SIGH Finance for the Account + " + this.formData.onBehalfOf +  ". Gas used = " + response.gasUsed });
              this.$showInfoMsg({title:"See ya soon!", message: " $SIGH FARMS look forward to serving you again!", timeout:4000});
              await this.refreshCurrentInstrumentWalletState(false);
            }
            else {
              this.$showErrorMsg({title:"REPAYMENT FAILED ",message: Number(quantity).toFixed(4) + "Loan Repayment FAILED. Check Etherescan to undersand why and try again! ", timeout: 7000 }); 
              this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 }); 
            }
            this.showLoader = false;     
            this.formData.repayValue = null;
          }
        }
        // REPAYING YOUR OWN LOAN
        else {
          if (Number(this.selectedInstrumentWalletState.currentBorrowBalance) < Number(quantity) ) {
            this.$showErrorMsg({message: " The amount entered to be repaid for the account exceeds your current borrowed balance, which is + " + this.selectedInstrumentWalletState.currentBorrowBalance + " " + this.selectedInstrument.symbol + ". Please enter an amount less than your current Borrowed Balance!" }); 
          }
          else {
            this.showLoader = true;      
            let response =  await this.LendingPool_repay( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  quantity, _onBehalfOf: this.$store.state.connectedWallet , symbol: this.selectedInstrument.symbol, decimals: this.selectedInstrument.decimals });
            if (response.status) {      
              this.$showSuccessMsg({ title:"REPAYMENT  SUCCESSFUL" ,message: Number(quantity).toFixed(4) + "  " +  this.selectedInstrument.symbol +  " worth " + this.formData.repayValue  + " USD have been successfully repayed to SIGH Finance! Gas used = " + response.gasUsed });
              this.$showInfoMsg({title:"See ya soon!", message: " $SIGH FARMS look forward to serving you again!", timeout:4000});
              await this.refreshCurrentInstrumentWalletState(false);
            }
            else {
              this.$showErrorMsg({title:"REPAYMENT FAILED ",message: Number(quantity).toFixed(4) + "Loan Repayment FAILED. Check Etherescan to undersand why and try again! ", timeout: 7000 }); 
              this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 }); 
            }
            this.formData.repayValue = null;
            this.showLoader = false;
          }
        }
      }
    },
      

    async approve() {   //APPROVE (WORKS PROPERLY) - calls increaseAllowance() Function  // Need to handle tokens which do not have it implemented
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
        let quantity =  (Number(this.formData.repayValue) / ( ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ) ).toFixed(4) ;
        console.log('Selected Instrument - ' + this.selectedInstrument.symbol)
        console.log('Quantity to be Approved - ' + quantity);
        console.log('Value - ' + this.formData.repayValue);
        let response = await this.ERC20_increaseAllowance( { tokenAddress: this.selectedInstrument.instrumentAddress, spender: this.$store.getters.LendingPoolCoreContractAddress , addedValue:  quantity, symbol :this.selectedInstrument.symbol  } );
        if (response.status) { 
          await this.refreshCurrentInstrumentWalletState(false);        
          this.$showSuccessMsg({title:"APPROVAL SUCCESS" , message: "Maximum of " + this.selectedInstrumentWalletState.userAvailableAllowance + "  " +  this.selectedInstrument.symbol +  " can now be deposited to SIGH Finance. Gas used = " + response.gasUsed  });
          this.formData.repayValue = null;
        }
        else {
          this.$showErrorMsg({title:"FAILED TO INCREASE ALLOWANCE" ,message: Number(quantity).toFixed(4) + "  " +  this.selectedInstrument.symbol + " FAILED to be Approved for further deposits into SIGH Finance to repay your Loan. Check Etherescan to undersand why and try again! ", timeout: 7000 }); 
          this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 }); 
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
            this.$showInfoMsg({title: this.selectedInstrument.symbol + ": Balances Refreshed", message: "Connected Wallet's " + this.selectedInstrument.symbol +  " Balances have been refreshed! ", timeout: 3000  });        
          }
        }
        catch(error) {
            this.$showInfoMsg({title: this.selectedInstrument.symbol + ": Balances Refresh FAILED", message: "", timeout: 3000  });               
        }
          this.showLoaderRefresh = false;
      }
    },


    async getOnBehalfOfBorrowBalances(onBehalfOfAddress) {
      if ( this.selectedInstrument.instrumentAddress ) {
        let balances = await this.LendingPoolCore_getUserBorrowBalances({_instrument: this.selectedInstrument.instrumentAddress, _user: onBehalfOfAddress });
        console.log(balances);
        return balances[1];  // returning compounded borrow balance
        }
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
