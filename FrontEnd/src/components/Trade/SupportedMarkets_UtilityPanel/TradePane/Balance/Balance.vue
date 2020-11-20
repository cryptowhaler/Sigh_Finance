<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import EventBus, {EventNames,} from '@/eventBuses/default';
import TabBar from '@/components/TabBar/TabBar.vue';
import lendingInfo from './lendingInfo/lendingInfo.vue';
import sighBalance from './sighBalance/sighBalance.vue';
import Web3 from 'web3';
import {mapState,mapActions,} from 'vuex';

export default {

  name: 'balance',

  components: {
    TabBar,
    lendingInfo,
    sighBalance,
  },


  data() {
    return {
      activeTab: 'Total Balance (Lending)',
      tabs: [ 'Total Balance (Lending)','Your SIGH Balances'],
      height: 0,
      preActive:'Total Balance (Lending)',

      walletInstrumentStatesArray: [],  // Wallet - Instrument States
      displayInUSD: false,
      showLoader: false,
    };
  },
  
  async created() {
    console.log("IN BALANCE (TRADE-PANE) FUNCTION ");
    if (this.$store.state.web3 && this.$store.state.isNetworkSupported && this.$store.state.connectedWallet) {
      await this.refreshConnectedWalletInstrumentStates(false);
    }
  },
  
  mounted() {
  },


  methods: {

    ...mapActions(['refresh_User_Instrument_State']),

    toggleTable() {
      this.displayInUSD = !this.displayInUSD;
    },

    activeTabChange(activeTab) {
      this.activeTab = activeTab;
    }, 

    async refresh() {
      console.log("refreshing User Balances");
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported by SIGH Finance - 1) Ethereum :  Kovan Testnet(42) " }); 
      }      
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        let response = await this.refreshConnectedWalletInstrumentStates(true);
        if (response) {
          this.$showInfoMsg({message: " Balances refreshed successfully for the account " + this.$store.state.connectedWallet  });
        }
        else {
          this.$showErrorMsg({message: " Could not refresh balances for the account " + this.$store.state.connectedWallet + ". Something went wrong. Contact our team at contact@sigh.finance in case of any queries!"  });
        }
      this.showLoader  = false;       
     }
    },

    async refreshConnectedWalletInstrumentStates(toDisplay) {    
      this.showLoader = true;
      let instruments = this.$store.getters.getSupportedInstruments;
      console.log(instruments);
      let  _walletInstrumentStatesArray = [];            
      this.$store.commit("setWalletSIGH_FinanceState",{});  // RESET SESSION DATA STORED GLOBAL STATE 
      try {
        for (let i=0; i < instruments.length; i++) { 
            let currentUserInstrumentState = await this.refresh_User_Instrument_State({ cur_instrument: instruments[i] }); 
            console.log(currentUserInstrumentState);
            this.$store.commit("addToWalletInstrumentStates",{ instrumentAddress: instruments[i].instrumentAddress, walletInstrumentState: currentUserInstrumentState }); 
            _walletInstrumentStatesArray.push(currentUserInstrumentState);
        }
        this.walletInstrumentStatesArray = _walletInstrumentStatesArray;
        console.log(this.walletInstrumentStatesArray);
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
<style lang="scss" src="./style.scss" scoped>

</style>
