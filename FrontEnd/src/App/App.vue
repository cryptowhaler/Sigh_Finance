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
      shouldOpen: false,
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
    localStorage.shouldOpen = true;
    this.handleWeb3();    
  },

  mounted() {
    this.walletConnected = body => this.fetchConfigsLogin(body.username);     //Login 
    this.WalletDisconnectedListener = body => this.fetchConfigsLogout();     //Logout

  
    EventBus.$on(EventNames.userWalletConnected, this.walletConnected);           //AUTH
    EventBus.$on(EventNames.userWalletDisconnected, this.WalletDisconnectedListener);           //AUTH
  },


  destroyed() {       //SESSION DESTROYED 
    EventBus.$off(EventNames.userWalletConnected, this.walletConnected);
    EventBus.$off(EventNames.userWalletDisconnected, this.WalletDisconnectedListener);           //AUTH    
  },


  methods: {

    ...mapActions(['loadWeb3','getWalletConfig','getContractAddresses']),

    // Connects to WEB3, Wallet, and initiates balance polling
    async handleWeb3() {
      console.log('handleWeb3() in APP');
      let isWeb3loaded = await this.loadWeb3();

      if (isWeb3loaded == 'EthereumEnabled') {
          this.$showSuccessMsg({message:"Successfully connected to the Ethereum Network's '" + this.$store.getters.networkName + "' ! Welcome to SIGH Finance!"});
      }
      if (isWeb3loaded == 'EthereumNotEnabled') {
          this.$showErrorMsg({message:'Permission to connect your wallet denied. In case you have security concerns or are facing any issues, reach out to our support team at support@sigh.finance. '});
      }
      if (isWeb3loaded == 'BSCConnected') {
        this.$showSuccessMsg({message:"Successfully connected to the Binance Smart Chain's '" + this.$store.getters.networkName + "'! Welcome to SIGH Finance!"});
      }
      if (isWeb3loaded == 'Web3Connected') {
        this.$showSuccessMsg({message:"Successfully connected to the Ethereum Network's '" + this.$store.getters.networkName  + "' (not a Metamask wallet) ! Welcome to SIGH Finance!"});
      }
      if (isWeb3loaded == 'false') {
        this.$showErrorMsg({message:'No Ethereum interface injected into browser. Read-only access. Please install MetaMask wallet browser extension or connect our support team at support@sigh.finance. '});
      }

      // If wallet is allowed to connect, then fetch the details
      if (isWeb3loaded == 'EthereumEnabled' ) {   
        let walletConnected = await this.getWalletConfig();
        this.$showInfoMsg({message: "You are currently connected with the wallet - " + this.$store.getters.connectedWallet });        
        this.loadContractAddresses();
        // EventBus.$emit(EventNames.userWalletConnected, { username: walletConnected,}); //User has logged in (event)
      }
    },

    // Loads addresses of the contracts from the network
    async loadContractAddresses() {
      let id = this.$store.getters.networkId;
      console.log('loadContractAddresses() in APP - ' + id);
      if ( this.$store.getters.getWeb3 && (id == '42' || id == '97' ) ) {
        let contractAddressesInitialized = await this.getContractAddresses();
        if (contractAddressesInitialized) {
          this.$showInfoMsg({message: " Contract Addresses fetched successfully for network " + id + " - " + this.$store.getters.networkName });
        }
        else {
          this.$showErrorMsg({message: " Something went wrong when fetching contract addresses for teh network - " + this.$store.getters.networkName + ". Please connect to either Kovan Testnet or Ethereum Main-net." });
        }
      }
      else {
          this.$showErrorMsg({message: " SIGH Finance is currently not available of the connected blockchain network " });
      }
    },

    async fetchConfigs() {
      this.$store.commit('addLoaderTask', 1, false);
      this.$store.commit('removeLoaderTask', 1);
    },
    async fetchConfigsLogin() {
      this.$store.commit('addLoaderTask', 1, false);
      this.$store.commit('removeLoaderTask', 1);
      this.toggleLoginModal();
    },
    async fetchConfigsLogout() {
      this.$store.commit('addLoaderTask', 1, false);
      this.$store.commit('removeLoaderTask', 1);
      // console.log('IN LOGOUT TOGGLING');
      // console.log(this.toggleLogoutModal);
      this.toggleLogoutModal();
      // console.log(this.toggleLogoutModal);
    },

    toggleContactModal() {   //ADDED
      // console.log(this.contactModalShown);    
      this.contactModalShown = !this.contactModalShown;
      // console.log(this.contactModalShown);        
    },
    
    closeBtnClicked() {
      sessionStorage.shouldOpen = true;
    },
    // async getMarkets() {    //getting markets
    //   const markets = await VegaProtocolService.get_markets();
    //   // console.log(markets);
    //   if (markets.status == 200 ) {
    //     let marketsData = [];
    //     for (let i=0;i<markets.data.markets.length;i++) { 
    //       let obj = {};
    //       obj.id = markets.data.markets[i].id;
    //       obj.data = {};
    //       obj.data.name = markets.data.markets[i].name;
    //       obj.data.instrument_name = markets.data.markets[i].tradableInstrument.instrument.name;          
    //       obj.baseName = markets.data.markets[i].tradableInstrument.instrument.baseName;
    //       obj.quoteName = markets.data.markets[i].tradableInstrument.instrument.quoteName;          
    //       // console.log(obj);     
    //       this.$store.commit('mappedMarkets',obj);        //mapping markets by ID
    //       this.$store.commit('mappedMarketsbyName',obj);  //mapping markets by name
    //       marketsData.push(obj);    
    //     }
    //     // console.log(marketsData);
    //     this.$store.commit('markets',marketsData);
    //     // console.log(this.$store.getters.markets);
    //     // console.log(this.$store.getters.mappedMarkets);
    //   }
    //   else {
    //     this.$showErrorMsg({message: 'Couldn\'t fetch Markets data. Some of the features may not function properly',});
    //   }
    // },

  },
};
</script>

<style lang="scss" src="./style.scss">
  
</style>
