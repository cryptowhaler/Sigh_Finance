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


  methods: {
    ...mapActions(['getWalletConfig']),

    onTriggerClick() {
      this.$store.commit('toggleSidebar');
    },

    async refreshWalletConnected() {
      let responseMsg = await this.getWalletConfig();
      if (this.$store.getters.connectedWallet) {
        this.$showInfoMsg({message: responseMsg + this.$store.getters.connectedWallet });  
        this.statusCode = 'Refresh Connection';
      }
      else {
        this.$showErrorMsg({message: responseMsg  });  
        // EventBus.$emit(EventNames.userWalletDisconnected);
        this.statusCode = 'Connect Wallet';
      }      
    },
    
    showContactModal() {        //Added
      this.$store.commit('closeSidebar');
      this.$emit('show-contact-modal');
    },
  },

  computed: {
    getServerStatus: function() {
      if (this.$store.getters.isWalletConnected) {
        return 'Refresh Connection';
      }
      return this.statusCode;
    }
  },


  created() {
    this.changeVegaHeader = (newMarket) => {       //Changing Selected Instrument
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
