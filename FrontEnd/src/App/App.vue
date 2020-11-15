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
    this.handleWeb3();    
  },

  mounted() {
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

    ...mapActions(['loadWeb3','getWalletConfig','getContractAddresses','refreshConnectedAccountState']),

    // Connects to WEB3, Wallet, and initiates balance polling
    async handleWeb3() {
      console.log('handleWeb3() in APP');
      let isWeb3loaded = await this.loadWeb3();

      if (isWeb3loaded == 'EthereumEnabled') {
          this.$showSuccessMsg({message:" Welcome to SIGH Finance! Successfully connected to the Ethereum Network's '" + this.$store.getters.networkName });
      }
      if (isWeb3loaded == 'EthereumNotEnabled') {
          this.$showErrorMsg({message:' Welcome to SIGH Finance! Permission to connect your wallet denied. In case you have security concerns or are facing any issues, reach out to our support team at support@sigh.finance. '});
      }
      if (isWeb3loaded == 'BSCConnected') {
        this.$showSuccessMsg({message:" Welcome to SIGH Finance! Successfully connected to the Binance Smart Chain's '" + this.$store.getters.networkName + "'! Welcome to SIGH Finance!"});
      }
      if (isWeb3loaded == 'Web3Connected') {
        this.$showSuccessMsg({message:" Welcome to SIGH Finance! Successfully connected to the Ethereum Network's '" + this.$store.getters.networkName  + "' (not a Metamask wallet) !"});
      }
      if (isWeb3loaded == 'false') {
        this.$showErrorMsg({message:' Welcome to SIGH Finance! No Web3 Object injected into browser. Read-only access. Please install MetaMask browser extension or connect our support team at support@sigh.finance. '});
      }

      // If wallet is allowed to connect, then fetch the details
      if ( this.$store.getters.isNetworkSupported ) {   
        let walletConnected = await this.getWalletConfig();
        this.$showInfoMsg({message: "You are currently connected with the wallet - " + this.$store.getters.connectedWallet });        
        await this.fetchSessionProtocolStateData();
        if (  Web3.utils.isAddress(this.$store.getters.connectedWallet) ) {
          this.fetchSessionUserStateData();
        }
        // EventBus.$emit(EventNames.userWalletConnected, { username: walletConnected,}); //User has logged in (event)
      }
    },

    // Loads addresses of the contracts from the network
    async fetchSessionProtocolStateData() {
      let id = this.$store.getters.networkId;
      console.log('fetchSessionProtocolStateData() in APP - ' + id);
      if ( this.$store.getters.getWeb3 && this.$store.getters.isNetworkSupported ) {
        let contractAddressesInitialized = await this.getContractAddresses();  // Fetches Addresses & Instrument states
        if (contractAddressesInitialized) {
          this.$showInfoMsg({message: " SIGH Finance Protocol State fetched successfully for network " + id + " - " + this.$store.getters.networkName });
        }
        else {
          this.$showErrorMsg({message: " Something went wrong when fetching SIGH Finance State for the network - " + this.$store.getters.networkName + ". Please connect to either Kovan Testnet or Ethereum Main-net or reach out to our Support Team at support@sigh.finance" });
        }
      }
      else {
          this.$showErrorMsg({message: " SIGH Finance is currently not available on the connected blockchain network " });
      }
    },

    async fetchSessionUserStateData() {
      // let response = await this.refreshConnectedAccountState();
      this.$showInfoMsg({message: " Balances for the connected wallet " + this.$store.getters.connectedWallet + " fetched successfully. Enjoy Farming $SIGH! "});
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
