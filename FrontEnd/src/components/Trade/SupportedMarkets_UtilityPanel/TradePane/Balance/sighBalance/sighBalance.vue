<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'sighBalance',

  data() {
    return {
      walletSIGHBalances: {},   // Wallet : SIGH INSTRUMENT State
    };
  },
  

  async created() {
    console.log("IN BALANCE /SIGH-BALANCE (TRADE-PANE) FUNCTION ");
    if (this.$store.state.web3 && this.$store.state.isNetworkSupported && this.$store.state.connectedWallet) {
        this.walletSIGHBalances = this.$store.getters.getWalletSIGHState;
    }
  },


  methods: {

    ...mapActions(['getWalletSIGHFinanceState']),
    
    async refresh() {
      console.log("refreshing User Your SIGH Balances");
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported by SIGH Finance - 1) Ethereum :  Kovan Testnet(42) " }); 
      }      
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        let response = await this.refreshWalletSessionData(true);
        if (response) {
          this.$showInfoMsg({message: " Your SIGH Balances refreshed successfully for the account " + this.$store.state.connectedWallet  });
        }
        else {
          this.$showErrorMsg({message: " Could not refresh Your SIGH Balances for the account " + this.$store.state.connectedWallet + ". Something went wrong. Contact our team at contact@sigh.finance in case of any queries!"  });
        }
     }
    },

    async refreshWalletSessionData(toDisplay) {      
      try {
        let response = await this.getWalletSIGHFinanceState();
        this.walletSIGHBalances = this.$store.getters.getWalletSIGHState;
        return true;
      }
      catch (error) {
        console.log(error);
        return false;
      }
    }
      

  },

  destroyed() {
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
