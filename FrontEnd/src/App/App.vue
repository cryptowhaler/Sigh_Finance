<template>
  <div id="app">
    <header-section @show-deposit-modal="toggleDepositModal" @show-withdrawl-modal="toggleWithdrawlModal" @show-contact-modal="toggleContactModal" />

     <div class="uk-hidden@m">
    <side-menu @show-deposit-modal="toggleDepositModal" @show-withdrawl-modal="toggleWithdrawlModal"  @show-contact-modal="toggleContactModal"  />
    </div>

    <modal-box internalComponent="deposit" :show='depositModalShown' @modal-closed='toggleDepositModal' />
    <modal-box internalComponent="withdrawal"  :show='withdrawlModalShown' @modal-closed='toggleWithdrawlModal' />
    <!-- <modal-box internalComponent="vega-login"  :show='loginModalShown' @modal-closed='toggleLoginModal' />
    <modal-box internalComponent="vega-logout" :show='logoutModalShown' @modal-closed='toggleLogoutModal' /> -->
    <!-- <modal-box internalComponent="vega-logout" :show='logoutModalShown' @modal-closed='toggleLogoutModal' /> -->
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
import EventBus, {
  EventNames,
} from '../eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';

import HeaderSection from '@/components/HeaderSection/HeaderSection.vue';
import SideMenu from '@/components/SideMenu/SideMenu.vue';
import ModalBox from '@/components/ModalBox/ModalBox.vue';
import VegaProtocolService from '@/services/VegaProtocolService';
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
      depositModalShown: false,
      withdrawlModalShown: false,
      loginModalShown:false,      //Added
      logoutModalShown:true,     //Added
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


  async created() {         //STARTS GETTING TICKER DATA WHEN WEBSITE IS LOADED
    localStorage.shouldOpen = true;
    ExchangeDataEventBus.$emit('ticker-connect');
    this.getMarkets();

    this.handleWeb3();
    // this.loadWeb3();
    // this.getBlockchainData();
  },

  mounted() {
    this.walletConnected = body => this.fetchConfigsLogin(body.username);     //Login 

    this.WalletDisconnectedListener = body => this.fetchConfigsLogout();     //Logout
    this.sessionExpiryListener = () => {
      if (LocalStorage.isUserLoggedIn()) {
        this.$showErrorMsg({message: 'Your session has expired. Please login again.',});
      }
      EventBus.$emit(EventNames.userWalletDisconnected);
    };
  
    EventBus.$on(EventNames.userWalletConnected, this.walletConnected);           //AUTH
    EventBus.$on(EventNames.userWalletDisconnected, this.WalletDisconnectedListener);           //AUTH
    EventBus.$on(EventNames.userSessionExpired, this.sessionExpiryListener);  //AUTH
  },


  destroyed() {       //SESSION DESTROYED 
    EventBus.$off(EventNames.userWalletConnected, this.walletConnected);
    EventBus.$off(EventNames.userWalletDisconnected, this.WalletDisconnectedListener);           //AUTH    
    EventBus.$off(EventNames.userSessionExpired, this.sessionExpiryListener);
  },


  methods: {

    ...mapActions(['loadWeb3','getBlockchainData']),

    async handleWeb3() {
      let web3loaded = this.loadWeb3();
      console.log(web3loaded);
      if (web3loaded) {
       let walletConnected = this.getBlockchainData();
       console.log(walletConnected);
       if (walletConnected != '') {
          EventBus.$emit(EventNames.userWalletConnected, { username: walletConnected,}); //User has logged in (event)
       }
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

    toggleDepositModal() {
      this.depositModalShown = !this.depositModalShown;
    },
    toggleWithdrawlModal() {
      this.withdrawlModalShown = !this.withdrawlModalShown;
    },
    toggleLoginModal() {      //ADDED
      // console.log(this.loginModalShown);
      this.loginModalShown = !this.loginModalShown;
      // console.log(this.loginModalShown);      
    },
    toggleLogoutModal() {   //ADDED
      // console.log(this.logoutModalShown);    
      this.logoutModalShown = !this.logoutModalShown;
      // console.log(this.logoutModalShown);        
    },
    toggleContactModal() {   //ADDED
      // console.log(this.contactModalShown);    
      this.contactModalShown = !this.contactModalShown;
      // console.log(this.contactModalShown);        
    },
    
    closeBtnClicked() {
      sessionStorage.shouldOpen = true;
    },
    async getMarkets() {    //getting markets
      const markets = await VegaProtocolService.get_markets();
      // console.log(markets);
      if (markets.status == 200 ) {
        let marketsData = [];
        for (let i=0;i<markets.data.markets.length;i++) { 
          let obj = {};
          obj.id = markets.data.markets[i].id;
          obj.data = {};
          obj.data.name = markets.data.markets[i].name;
          obj.data.instrument_name = markets.data.markets[i].tradableInstrument.instrument.name;          
          obj.baseName = markets.data.markets[i].tradableInstrument.instrument.baseName;
          obj.quoteName = markets.data.markets[i].tradableInstrument.instrument.quoteName;          
          // console.log(obj);     
          this.$store.commit('mappedMarkets',obj);        //mapping markets by ID
          this.$store.commit('mappedMarketsbyName',obj);  //mapping markets by name
          marketsData.push(obj);    
        }
        // console.log(marketsData);
        this.$store.commit('markets',marketsData);
        // console.log(this.$store.getters.markets);
        // console.log(this.$store.getters.mappedMarkets);
      }
      else {
        this.$showErrorMsg({message: 'Couldn\'t fetch Markets data. Some of the features may not function properly',});
      }
    },

  },
};
</script>

<style lang="scss" src="./style.scss">
  
</style>
