<template src="./template.html"></template>

<script>
import { ConnectedWallet } from '../../../../../utils/localStorage';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import EventBus, {EventNames,} from '@/eventBuses/default';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'balance',

  data() {
    return {
      balance: {},
    };
  },
  
  created() {
    console.log("IN BALANCE (TRADE-PANE) FUNCTION ");
  },
  
  mounted() {
    // this.userwalletConnected = () => this.setpubkeys();
    // this.userWalletDisconnectedListener = () => this.setpubkeysEmpty();
    // EventBus.$on(EventNames.userWalletConnected, this.userwalletConnected);
    // EventBus.$on(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },

  methods: {

    ...mapActions(['refreshConnectedAccountState']),

    async refresh() {
      console.log("refreshing User Balances");
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showInfoMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported by SIGH Finance - 1) Ethereum :  Kovan Testnet(42) " }); 
      }      
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showInfoMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        let response = await this.refreshConnectedAccountState();
        if (response) {
          this.$showInfoMsg({message: " Balances refreshed successfully for the account " + this.$store.state.connectedAccount  });
        }
        else {
          this.$showInfoMsg({message: " Could not refresh balances for the account " + this.$store.state.connectedAccount + ". Something went wrong. Contact our team at contact@sigh.finance in case of any queries!"  });
        }
     }
    }

  },

  destroyed() {
  },
};
</script>
<style lang="scss" src="./style.scss" scoped>

</style>
