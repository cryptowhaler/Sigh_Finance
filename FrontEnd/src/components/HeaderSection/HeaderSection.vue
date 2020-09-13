<template src="./template.html"></template>

<script>
import { ModelSelect, } from 'vue-search-select';
import EventBus, { EventNames, } from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import { VegaKeys, } from '../../utils/localStorage';


export default {
  name: 'header-section',
  data() {
    return {
      status: 'Major Outage',
      serverStatusCode: 'major_outage',
      vegaSelectedMarketName: this.$store.getters.selectedVegaMarketName,
      vegaMarketSummary: this.$store.getters.selectedVegaMarketSummary,
    };
  },
  components: {
    ModelSelect,
  },
  methods: {
    onTriggerClick() {
      this.$store.commit('toggleSidebar');
    },

    getServerStatus() {
      let data = this.$store.getters.isLoggedIn;
      // console.log(data);
      if (data) {
        this.serverStatusCode = 'Connected ';
        return this.serverStatusCode;
      }
      else{
        this.serverStatusCode = 'Not Connected';
        return this.serverStatusCode;
      }
    },
    logout() {
      EventBus.$emit(EventNames.userLogout);
      this.$showSuccessMsg({
        message: 'Connected Successfully',
      });
    },
    showDepositModal() {
      this.$store.commit('closeSidebar');
      this.$emit('show-deposit-modal');
    },
    showWithdrawlModal() {
      this.$store.commit('closeSidebar');
      this.$emit('show-withdrawl-modal');
    },
    showLoginModal() {        //Added
      this.$store.commit('closeSidebar');
      this.$emit('show-login-modal');
    },
    showContactModal() {        //Added
      this.$store.commit('closeSidebar');
      this.$emit('show-contact-modal');
    },
    showLogoutModal() {     //Added
      this.$store.commit('closeSidebar');
      this.$emit('show-logout-modal');
    },
  },


  created() {
    this.changeVegaHeader = (newMarket) => {       //Changing Selected Vega Market
      this.vegaSelectedMarketName = newMarket.Name;
      this.vegaMarketSummary = newMarket.Summary;
    };
    ExchangeDataEventBus.$on('change-vega-header', this.changeVegaHeader);    
  }, 

  destroyed() {
    ExchangeDataEventBus.$on('change-vega-header', this.changeVegaHeader);    
  },





};
</script>

<style lang="scss" src="./style.scss" scoped></style>
