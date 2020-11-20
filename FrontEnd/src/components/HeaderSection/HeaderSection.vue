<template src="./template.html"></template>

<script>
import { ModelSelect, } from 'vue-search-select';
import EventBus, { EventNames, } from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { ConnectedWallet, } from '../../utils/localStorage';
import {mapState,mapActions,} from 'vuex';


export default {
  name: 'header-section',


  data() {
    return {
      isConnected : this.$store.getters.isWalletConnected,
      statusCode: 'Connect Wallet',
    };
  },


  components: {
    ModelSelect,
  },

  created() {
  }, 

  methods: {
    ...mapActions(['loadWeb3','getContractsBasedOnNetwork','fetchSighFinanceProtocolState','getWalletConfig','getConnectedWalletState']),


    async refreshWalletConnected() {
      await this.handleWeb3();   
      await this.fetchSessionUserStateData(); 
    },


    onTriggerClick() {
      this.$store.commit('toggleSidebar');
    },

    
    showContactModal() {        //Added
      this.$store.commit('closeSidebar');
      this.$emit('show-contact-modal');
    },



    // Connects to WEB3, Wallet, and initiates balance polling
    async handleWeb3() {
      console.log('handleWeb3() in APP');
      let isWeb3loaded = await this.loadWeb3();

      if (isWeb3loaded == 'EthereumEnabled') {
          this.$showSuccessMsg({message:"  Successfully connected to the Ethereum Network : " + this.$store.getters.networkName + "! Welcome to SIGH Finance!" });
      }
      if (isWeb3loaded == 'EthereumNotEnabled') {
          this.$showErrorMsg({message:'  Permission to connect your wallet denied. In case you have security concerns or are facing any issues, reach out to our support team at support@sigh.finance. '});
      }
      if (isWeb3loaded == 'BSCConnected') {
        this.$showSuccessMsg({message:"  Successfully connected to the Binance Smart Chain : " + this.$store.getters.networkName + "! Welcome to SIGH Finance!"});
      }
      if (isWeb3loaded == 'Web3Connected') {
        this.$showSuccessMsg({message:"  Successfully connected to the Ethereum Network's " + this.$store.getters.networkName  + " (not a Metamask wallet) !"});
      }
      if (isWeb3loaded == 'false') {
        this.$showErrorMsg({message:'  No Web3 Object injected into browser. Read-only access. Please install MetaMask browser extension or connect our support team at support@sigh.finance. '});
      }

      // FETCHING CONTRACTS AND STATE FOR SIGH FINANCE
      if ( this.$store.getters.isNetworkSupported ) {   
        this.sighFinanceInitialized = await this.fetchSessionSIGHFinanceStateData();
        if (this.sighFinanceInitialized) {
          ExchangeDataEventBus.$emit(EventNames.connectedToSupportedNetwork);    
        }
      }
    },

    // Loads addresses of the contracts from the network
    async fetchSessionSIGHFinanceStateData() {
      let id = this.$store.getters.networkId;
      console.log('fetchSessionSIGHFinanceStateData() in APP - ' + id);
      if ( this.$store.getters.getWeb3 && this.$store.getters.isNetworkSupported ) {
        let contractAddressesInitialized = await this.getContractsBasedOnNetwork();  // Fetches Addresses & Instrument states
        if (contractAddressesInitialized) {
          this.$showInfoMsg({message: " SIGH Finance Contracts fetched successfully for the network " + id + " - " + this.$store.getters.networkName });
          let response = await this.fetchSighFinanceProtocolState();
          if (response) {
            this.$showSuccessMsg({message:" SIGH Finance Current State fetched Successfully"});
            return true;
          }
          else {
            this.$showErrorMsg({message: " Something went wrong when fetching SIGH Finance's current protocol state." });
            return false;
          }
        }
        else {
          this.$showErrorMsg({message: " Something went wrong when fetching SIGH Finance Contracts for the network - " + this.$store.getters.networkName + ". Please connect to either Kovan Testnet or Ethereum Main-net or reach out to our Support Team at support@sigh.finance" });
          return false;
        }
      }
      else {
          this.$showErrorMsg({message: " SIGH Finance is currently not available on the connected blockchain network " });
          return false;
      }
    },

    async fetchSessionUserStateData() {
      if ( this.sighFinanceInitialized ) {
        console.log("WALLET STATE FETCHING INITIATIATED IN APP.VUE");
        let response = await this.getConnectedWalletState();
        if (response) {
          this.$showSuccessMsg({message:"Successfully fetched SIGH Finance Session for the account : " + this.$store.state.connectedWallet });
          ExchangeDataEventBus.$emit(EventNames.ConnectedWalletSesssionRefreshed);    
        }
        else if (this.$store.state.connectedWallet) {
          this.$showErrorMsg({message:"Failed to fetch SIGH Finance Session for the account : " + this.$store.state.connectedWallet });
        }
        else {
          this.$showErrorMsg({message: "Web3 wallet not detected. Read only access." });
        }
      }
      else {
        await this.handleWeb3();
        if ( this.sighFinanceInitialized ) {
          console.log("WALLET STATE FETCHING INITIATIATED IN APP.VUE");
          let response = await this.getConnectedWalletState();
          if (response) {
            this.$showSuccessMsg({message:"Successfully fetched SIGH Finance Session for the account : " + this.$store.state.connectedWallet });
            ExchangeDataEventBus.$emit(EventNames.ConnectedWalletSesssionRefreshed);    
          }
          else if (this.$store.state.connectedWallet) {
            this.$showErrorMsg({message:"Failed to fetch SIGH Finance Session for the account : " + this.$store.state.connectedWallet });
          }
          else {
            this.$showErrorMsg({message: "Web3 wallet not detected. Read only access." });
          }
        }
      }
    }
  },

  computed: {
    getServerStatus: function() {
      if (this.$store.getters.isWalletConnected) {
        return 'Refresh Connection';
      }
      return this.statusCode;
    }
  },



  destroyed() {

  },





};
</script>

<style lang="scss" src="./style.scss" scoped></style>
