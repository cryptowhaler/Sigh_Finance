<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'repayQuantity',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      selectedInstrumentWalletState: {},
      formData : {
        repayQuantity: null,
        repayValue: null,
        onBehalfOf: null,
      },
      selectedInstrumentPriceETH: null,  // PRICE CONSTANTLY UPDATED
      showLoader: false,
    };
  },
  

  created() {
    console.log("IN LENDING / REPAY / QUANTITY (TRADE-PANE) FUNCTION ");
    this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
    console.log(this.selectedInstrument);
    if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
      this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
    }
    console.log(this.selectedInstrumentWalletState);
    if ( this.$store.state.isNetworkSupported  ) {
      setInterval(async () => {
        console.log("IN SET INTERVAL (REPAY / QUANTITY)");
        if (this.selectedInstrument.instrumentAddress != '0x0000000000000000000000000000000000000000') {
          this.selectedInstrumentPriceETH = await this.getInstrumentPrice({_instrumentAddress : this.selectedInstrument.instrumentAddress });
        }
      },1000);
    }

    this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
      console.log("NEW SELECTED INSTRUMENT");
      this.selectedInstrument = selectedInstrument_.instrument;       // UPDATED SELECTED INSTRUMENT (LOCALLY)
      console.log(this.selectedInstrument);   
      this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
      console.log(this.selectedInstrumentWalletState);
    };
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);        
  },


  computed: {
    calculatedValue() {
        console.log('calculatedValue');
        if (this.selectedInstrument && this.selectedInstrument.priceDecimals) {
          console.log("COMPUTED VALUED");
          return (Number(this.formData.repayQuantity) * ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4) ; 
        }
      return 0;
    }
  },

  methods: {

    ...mapActions(['LendingPool_repay','refresh_User_Instrument_State','LendingPoolCore_getUserBorrowBalances','getInstrumentPrice']),
    
    async repay() {   //REPAY
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }     
      else if (this.formData.onBehalfOf && !Web3.utils.isAddress(this.formData.onBehalfOf) ) {
        this.$showErrorMsg({message: " The address provided in 'onBehalfOf' section is invalid. Please provide the correct address or make this column empty if you want to repay the borrow amount for the connected wallet." });         
      }
      else {      
        let value =  (Number(this.formData.repayQuantity) * ( Number(this.selectedInstrumentPriceETH) / Math.pow(10,this.selectedInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4) ;
        console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
        console.log('Repay Quantity - ' + this.formData.repayQuantity);
        console.log('Repay Value - ' + value);
        // ON BEHALF OF 
        if (this.formData.onBehalfOf) { 
          let borrowBalance = await this.getOnBehalfOfBorrowBalances();
          if (Number(borrowBalance) < Number(this.formData.repayQuantity) ) {
            this.$showErrorMsg({message: " The amount entered to be repaid for the account " + this.formData.onBehalfOf +  " exceeds its current borrowed balance, which is + " + borrowBalance + " " + this.selectedInstrument.symbol + ". Please enter an amount less than its current Borrowed Balance!" }); 
          }
          else {
            console.log('ON BEHALF OF  - ' +  this.formData.onBehalfOf);
            this.showLoader = true;      
            let response =  await this.LendingPool_repay( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  this.formData.repayQuantity, _onBehalfOf: this.formData.onBehalfOf } );
            if (response.status) {      
              this.$showSuccessMsg({message: "REPAY SUCCESS : " + this.formData.repayQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully repayed to SIGH Finance for the Account + " + this.formData.onBehalfOf +  ". Gas used = " + response.gasUsed });
              this.$showInfoMsg({message: " $SIGH FARMS look forward to serving you again!"});
              await this.refreshCurrentInstrumentWalletState(true);
              this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Repay',Service: 'LENDING'});
            }
            else {
              this.$showErrorMsg({message: "REPAY FAILED : " + response.message  }); 
              this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
              // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Repay',Service: 'LENDING'});
            }
          }
        }
        // REPAYING YOUR OWN LOAN
        else {
          if (Number(this.selectedInstrumentWalletState.compoundedBorrowBalance) < Number(this.formData.repayQuantity) ) {
            this.$showErrorMsg({message: " The amount entered to be repaid for the account exceeds your current borrowed balance, which is + " + this.selectedInstrumentWalletState.compoundedBorrowBalance + " " + this.selectedInstrument.symbol + ". Please enter an amount less than your current Borrowed Balance!" }); 
          }
          else {
            this.showLoader = true;      
            let response =  await this.LendingPool_repay( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  this.formData.repayQuantity, _onBehalfOf: this.$store.state.connectedWallet  } );
            if (response.status) {      
              this.$showSuccessMsg({message: "REPAY SUCCESS : " + this.formData.repayQuantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD was successfully repayed to SIGH Finance! Gas used = " + response.gasUsed });
              this.$showInfoMsg({message: " $SIGH FARMS look forward to serving you again!"});
              await this.refreshCurrentInstrumentWalletState(true);
              this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Repay',Service: 'LENDING'});
            }
            else {
              this.$showErrorMsg({message: "REPAY FAILED : " + response.message  }); 
              this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
              // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Repay',Service: 'LENDING'});
            }
          }
        }
        this.formData.repayQuantity = null;
        this.showLoader = false;
      }
    },
      

    async refreshCurrentInstrumentWalletState(toDisplay) {
      if ( this.$store.state.web3 && this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        try {
          console.log("refreshCurrentInstrumentWalletState() in REPAY-QUANTITY");
          let response = await this.refresh_User_Instrument_State({cur_instrument: this.selectedInstrument });
          console.log(response);
          console.log("getting WalletInstrumentStates MAPPING before UPDATING & COMMITING  in REPAY-QUANTITY");
          console.log(this.$store.getters.getWalletInstrumentStates);
          this.$store.commit("addToWalletInstrumentStates",{instrumentAddress : this.selectedInstrument.instrumentAddress  , walletInstrumentState: response});
          console.log("getting WalletInstrumentStates MAPPING after UPDATING & COMMITING  in REPAY-QUANTITY");
          console.log(this.$store.getters.getWalletInstrumentStates);
          this.selectedInstrumentWalletState = this.$store.state.walletInstrumentStates.get(this.selectedInstrument.instrumentAddress);
          if (toDisplay) {
            this.$showInfoMsg({message: "Updated balances" });        
          }
        }
        catch(error) {
          console.log( 'FAILED' );
        }
      }
    },


    async getOnBehalfOfBorrowBalances(onBehalfOfAddress) {
      if ( this.selectedInstrument.instrumentAddress ) {
        let balances = await this.LendingPoolCore_getUserBorrowBalances({_instrument: this.selectedInstrument.instrumentAddress, _user: onBehalfOfAddress });
        console.log(balances);
        return balances[1];  // returning compounded borrow balance
        }
      }
  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changeSelectedInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
