<template src="./template.html"></template>

<script>
import EventBus, { EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'lendingInfo',

  data() {
    return {
      walletLendingProtocolState: {},   // Wallet : Lending Protocol Global State
      displayInUSD: false,
      showLoader: false,
    };
  },
  

  async created() {
    console.log("IN BALANCE / LENDING-INFO (TRADE-PANE) FUNCTION ");
    if (this.$store.state.web3 && this.$store.state.isNetworkSupported && this.$store.state.connectedWallet) {
      this.loadSessionData();
    }
  },


    mounted() {
    this.loadSessionData();

    this.refreshThisSession = () => this.loadSessionData();     
    ExchangeDataEventBus.$on(EventNames.ConnectedWalletSesssionRefreshed, this.refreshThisSession );    
    ExchangeDataEventBus.$on(EventNames.ConnectedWalletTotalLendingBalancesRefreshed, this.refreshThisSession );    
  },




  methods: {

    ...mapActions(['refresh_User_SIGH_Finance_State']),
    


    toggleTable() {
      this.displayInUSD = !this.displayInUSD;
    },



    async refresh() {
      console.log("refreshing User GLOBAL Balances");
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported by SIGH Finance - 1) Ethereum :  Kovan Testnet(42) " }); 
      }      
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        let response = await this.refreshConnectedWalletGlobalStates(true);
        if (response) {
          this.$showInfoMsg({message: " Global Lending Protocol Balances refreshed successfully for the account " + this.$store.state.connectedWallet  });
        }
        else {
          this.$showErrorMsg({message: " Could not refresh Global Lending Protocol Balances for the account " + this.$store.state.connectedWallet + ". Something went wrong. Contact our team at contact@sigh.finance in case of any queries!"  });
        }
        this.showLoader = false;      
     }
    },




    async refreshConnectedWalletGlobalStates(toDisplay) {      
      try {
        this.showLoader = true;
        let userGlobalState = await this.refresh_User_SIGH_Finance_State();
        this.$store.commit("setWalletSIGH_FinanceState",userGlobalState);
        this.walletLendingProtocolState = userGlobalState;   
        ExchangeDataEventBus.$emit(EventNames.ConnectedWalletTotalLendingBalancesRefreshed);    

        console.log(this.walletLendingProtocolState);            
        return true;
      }
      catch (error) {
        console.log(error);
        return false;
      }
    },





    // REFRESHES THE CURRENT SESSION : FROM STORE 
    loadSessionData() {
      console.log("LOADING WALLET : SIGH FINANCE :LENDING INFO");
      this.walletLendingProtocolState = this.$store.state.walletSIGH_FinanceState;
      console.log(this.walletLendingProtocolState);
    },

  },




  destroyed() {
    ExchangeDataEventBus.$off(EventNames.ConnectedWalletSesssionRefreshed );    
    ExchangeDataEventBus.$off(EventNames.ConnectedWalletTotalLendingBalancesRefreshed );    
  },


};
</script>

<style lang="scss" src="./style.scss" scoped></style>
