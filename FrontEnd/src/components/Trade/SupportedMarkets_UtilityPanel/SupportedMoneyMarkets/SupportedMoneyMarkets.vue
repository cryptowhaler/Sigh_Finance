<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
import gql from 'graphql-tag';
import {mapState,mapActions,} from 'vuex';

export default {
  name: 'Supported-Money-Markets',

  components: {
    Spinner,
  },

  props: {
    parentHeight: Number,   //communicated to parent
  },

  data() {
    return {
      instruments: [],      
      tableHeight: '',
      showLoader:false,
    };
  },

  watch: {
    parentHeight: function(newVal) {
      let calcHeight = newVal;
      this.tableHeight = 'calc(100vh - ' + (calcHeight  + 100) + 'px';
    },
  },

  async created() {
    console.log(" IN Supported-Money-Markets Created Function");
    if (this.$store.state.web3 && this.$store.state.isNetworkSupported) {
      await this.refreshInstrumentStates();
    }
  },

  methods: {

    ...mapActions(['LendingPool_getInstruments','refershInstrumentState']),

    async refresh() {
      console.log("refreshing INSTRUMENT Global States");
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported by SIGH Finance - 1) Ethereum :  Kovan Testnet(42) " }); 
      }      
      else {                                  // EXECUTE THE TRANSACTION
        let response = await this.refreshInstrumentStates(true);
        if (response) {
          this.$showInfoMsg({message: " Instruments refreshed successfully" });
        }
        else {
          this.$showErrorMsg({message: " Could not refresh Instruments States. Something went wrong. Contact our team at contact@sigh.finance in case of any queries!"  });
        }
     }
    },


    async refreshInstrumentStates() {
      let instrumentAddresses = await this.LendingPool_getInstruments();
      this.$store.commit("resetSupportedInstrumentsArray");
      this.$store.commit("resetSupportedInstrumentGlobalStates");
      this.$store.commit("resetSupportedInstrumentSIGHStates");
      this.$store.commit("resetSupportedInstrumentConfigs");
      try {
        for (let i=0; i<instrumentAddresses.length; i++) {
          let data = await this.refershInstrumentState({instrumentAddress: instrumentAddresses[i] });
          console.log(" SUPPORTED INSTRUMENT - " + i + " : STATE FETCHED (SESSION INITIALIALIZATION)");
    
          console.log(" SUPPORTED INSTRUMENT - " + i + " : BASIC STATE");
          this.$store.commit("addToSupportedInstrumentsArray",data.instrumentState);
    
          console.log(" SUPPORTED INSTRUMENT - " + i + " : CONFIGURATION");
          this.$store.commit("addToSupportedInstrumentConfigs",{instrumentAddress: instrumentAddresses[i] , instrumentConfig: data.instrumentConfiguration});
    
          console.log(" SUPPORTED INSTRUMENT - " + i + " : GLOBAL BALANCES");          // console.log(data.instrumentGlobalBalances);
          this.$store.commit("addToSupportedInstrumentGlobalStates",{instrumentAddress: instrumentAddresses[i] , instrumentGlobalState: data.instrumentGlobalBalances});

          console.log(" SUPPORTED INSTRUMENT - " + i + " : SIGH STATES");          // console.log(data.instrumentGlobalBalances);
          this.$store.commit("addToSupportedInstrumentSIGHStates",{instrumentAddress: instrumentAddresses[i] , instrumentSIGHState: data.instrumentSighState});
        }
        this.loadInstrumentData();
        return true;
      }
      catch(error) {
        console.log(error);
        return false;
      }
    },

    loadInstrumentData() {
      console.log("LOADING INSTRUMENTS : MONEY MARKETS LIST");
      let localInstruments = [];
      let instruments = this.$store.getters.getSupportedInstruments;
      let instrumentGlobalStates = this.$store.getters.getsupportedInstrumentGlobalStates;
      let instrumentSIGHStates = this.$store.getters.getsupportedInstrumentSIGHStates;
      for (let i=0; i<instruments.length; i++ ) {
        let currentInstrument = {};
        currentInstrument.basicData = instruments[i];
        currentInstrument.globalState = instrumentGlobalStates.get(instruments[i].instrumentAddress);
        currentInstrument.sighState = instrumentSIGHStates.get(instruments[i].instrumentAddress);
        console.log(currentInstrument);
        localInstruments.push(currentInstrument);
      }
      this.instruments = localInstruments;
      console.log(this.instruments);
    }

  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
