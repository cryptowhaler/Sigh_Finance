<template src="./template.html"></template>

<script>
import EventBus, { EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'sighBalance',

  data() {
    return {
      walletSIGHBalances: {},   // Wallet : SIGH INSTRUMENT State
      showLoader: false,
    };
  },
  

  async created() {
    console.log("IN BALANCE /SIGH-BALANCE (TRADE-PANE) FUNCTION ");
    if (this.$store.state.web3 && this.$store.state.isNetworkSupported && this.$store.state.connectedWallet) {
      this.loadSessionData();
    }
  },


  mounted() {
    this.loadSessionData();

    this.refreshThisSession = () => this.loadSessionData();     
    ExchangeDataEventBus.$on(EventNames.ConnectedWalletSesssionRefreshed, this.refreshThisSession );    
    ExchangeDataEventBus.$on(EventNames.ConnectedWallet_SIGH_Balances_Refreshed, this.refreshThisSession );    
  },


  methods: {

    ...mapActions(['refresh_User_SIGH__State']),
    
    async refresh() {
      console.log("refreshing User Your SIGH Balances");
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported by SIGH Finance - 1) Ethereum :  Kovan Testnet(42) " }); 
      }      
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        let response = await this.refreshWalletSessionData(true);
        if (response) {
          this.$showInfoMsg({message: " $SIGH FARM Yields refreshed successfully for the account " + this.$store.state.connectedWallet  });
        }
        else {
          this.$showErrorMsg({message: " Could not refresh $SIGH FARM Yields for the account " + this.$store.state.connectedWallet + ". Something went wrong. Contact our team at contact@sigh.finance in case of any queries!"  });
        }
      this.showLoader = false;
     }
    },

    async refreshWalletSessionData(toDisplay) {      
      try {
        this.showLoader = true;
        let response = await this.refresh_User_SIGH__State();
        this.$store.commit("setWalletSIGHState",response);
        ExchangeDataEventBus.$emit(EventNames.ConnectedWallet_SIGH_Balances_Refreshed);            
        this.walletSIGHBalances = this.$store.getters.getWalletSIGHState;
        return true;
      }
      catch (error) {
        console.log(error);
        return false;
      }
    },


    loadSessionData() {
        this.walletSIGHBalances = this.$store.getters.getWalletSIGHState;
    }


  },

  destroyed() {
    ExchangeDataEventBus.$off(EventNames.ConnectedWalletSesssionRefreshed );    
    ExchangeDataEventBus.$off(EventNames.ConnectedWallet_SIGH_Balances_Refreshed );    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
