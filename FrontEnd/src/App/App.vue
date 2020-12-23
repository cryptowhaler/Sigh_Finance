<template>
  <div id="app">
    <header-section @show-contact-modal="toggleContactModal" />

     <div class="uk-hidden@m">
     <side-menu  @show-contact-modal="toggleContactModal"  />
     </div>

    <modal-box internalComponent="contact" :show='contactModalShown' @modal-closed='toggleContactModal' />

    <notifications group="foo" />

    <loading :show="showLoader" :label="loaderLabel"></loading>

    <div class="page-wrapper">
      <router-view/>
    </div>

  </div>
</template>

<script>
import Vue from 'vue';
import Loading from 'vue-full-loading';
import NotificationPlugin from '../plugins/notifications.js';
import EventBus, { EventNames,} from '../eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';

import HeaderSection from '@/components/HeaderSection/HeaderSection.vue';
import SideMenu from '@/components/SideMenu/SideMenu.vue';
import ModalBox from '@/components/ModalBox/ModalBox.vue';
import LocalStorage from '@/utils/localStorage.js';
import Vuikit from 'vuikit';
import Notifications from 'vue-notification';
import Datetime from 'vue-datetime';
// You need a specific loader for CSS files
import 'vue-datetime/dist/vue-datetime.css';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';
 
Vue.use(Datetime);
Vue.use(Vuikit);
Vue.use(Loading);
Vue.use(NotificationPlugin);
Vue.use(Notifications);


export default {
  components: {
    Loading,
    HeaderSection,
    SideMenu,
    ModalBox,
  },


  data() {
    return {
      sighFinanceInitialized : false,  
      loaderLabel: 'Loading...',
      contactModalShown: false,
      firstTime: true,
    };
  },


  computed: {
    showLoader() {
      return this.$store.getters.showLoader;
    },
    isWalletConnected() {
      return this.$store.getters.isWalletConnected;
    }
  },


  async created() {         //GETS WEB3
    this.displayWelcomeMessage();
    // await this.handleWeb3();   
    // await this.fetchSessionUserStateData(); 
  },

  async mounted() {
    this.walletConnected = body => this.fetchConfigsWalletConnected(body.username);     //Wallet connected 
    this.WalletDisconnectedListener = body => this.fetchConfigsWalletDisconnected();     //Wallet Disconnected   

    EventBus.$on(EventNames.userWalletConnected, this.walletConnected);           //WHENEVER A USER WALLET IS CONNECTED, WE 
    EventBus.$on(EventNames.userWalletDisconnected, this.WalletDisconnectedListener);           //AUTH
  },


  destroyed() {       //SESSION DESTROYED 
    EventBus.$off(EventNames.userWalletConnected, this.walletConnected);
    EventBus.$off(EventNames.userWalletDisconnected, this.WalletDisconnectedListener);           //AUTH    
  },


  methods: {

    ...mapActions(['loadWeb3','getContractsBasedOnNetwork','initiateSighFinancePolling','getWalletConfig','getConnectedWalletState']),

    displayWelcomeMessage() {
        this.$showSuccessMsg({title: 'Hey, Welcome to SIGH Finance!', message:"" });
        this.$showInfoMsg({title: 'Onboarding Info :' ,message:"The protocol is currently Live on Ethereum's KOVAN Testnet and Binance Smart Chain's testnet. Please connect to the KOVAN Network or the BSC's test network to interact with SIGH Finance!" });
    },

    // Connects to WEB3, Wallet, and initiates balance polling
    async handleWeb3() {
      console.log('handleWeb3() in APP');
      let isWeb3loaded = await this.loadWeb3();

      if (isWeb3loaded == 'EthereumEnabled') {
          this.$showSuccessMsg({message:"  Successfully connected to the Ethereum Network : " + this.$store.getters.networkName + "! Welcome to SIGH Finance!" });
      }
      if (isWeb3loaded == 'EthereumNotEnabled') {
          this.$showErrorMsg({message:'  Permission to connect your wallet denied. In case you have security concerns or are facing any issues, reach out to our support team at contact@sigh.finance. '});
      }
      if (isWeb3loaded == 'BSCConnected') {
        this.$showSuccessMsg({message:"  Successfully connected to the Binance Smart Chain : " + this.$store.getters.networkName + "! Welcome to SIGH Finance!"});
      }
      if (isWeb3loaded == 'Web3Connected') {
        this.$showSuccessMsg({message:"  Successfully connected to the Ethereum Network's " + this.$store.getters.networkName  + " (not a Metamask wallet) !"});
      }
      if (isWeb3loaded == 'false') {
        this.$showErrorMsg({message:'  No Web3 Object injected into browser. Read-only access. Please install MetaMask browser extension or connect our support team at contact@sigh.finance. '});
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
          let response = await this.initiateSighFinancePolling();
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
          this.$showErrorMsg({message: " Something went wrong when fetching SIGH Finance Contracts for the network - " + this.$store.getters.networkName + ". Please connect to either Kovan Testnet or Ethereum Main-net or reach out to our Support Team at contact@sigh.finance" });
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
    },



    async fetchConfigsWalletConnected() {
      console.log('IN fetchConfigsWalletConnected() in APP.vue');
    },

    async fetchConfigsWalletDisconnected() {
      console.log('IN fetchConfigsWalletDisconnected() in APP.vue');
    },

    toggleContactModal() {   //ADDED
      console.log(this.contactModalShown);    
      this.contactModalShown = !this.contactModalShown;
      console.log(this.contactModalShown);        
    },


  },
};
</script>

<style lang="scss" src="./style.scss">
  
</style>
