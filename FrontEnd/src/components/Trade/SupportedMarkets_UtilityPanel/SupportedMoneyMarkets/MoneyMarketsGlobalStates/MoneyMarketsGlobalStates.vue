<template src="./template.html"></template>

<script>
import EventBus, { EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
import {mapState,mapActions,} from 'vuex';
import gql from 'graphql-tag';

export default {
  name: 'Money-Markets-Global-States',


  components: {
    Spinner,
  },


  data() {
    return {
      instruments: [],      
      tableHeight: '',
      showLoader:false,
    };
  },


  apollo: {
    $subscribe: {
      instruments: {
        query: gql`subscription {
                    instruments {
                      instrumentAddress
                      iTokenAddress
                      name
                      symbol
                      underlyingInstrumentName
                      underlyingInstrumentSymbol
                      decimals
                      totalCompoundedLiquidity
                      totalCompoundedLiquidityUSD
                      totalCompoundedBorrows
                      totalCompoundedBorrowsUSD
                      utilizationRatePercent
                      stableBorrowInterestPercent
                      variableBorrowInterestPercent
                      supplyInterestRatePercent
                      present_SIGH_Side
                      present_percentTotalVolatility
                      present_total24HrVolatilityUSD
                      present_percentTotalVolatilityLimitAmount
                      present_24HrVolatilityLimitAmountUSD
                      present_SIGH_Suppliers_Speed
                      present_SIGH_Borrowers_Speed
                      present_SIGH_Staking_Speed
                    }
                  }`,

        // variables() {  return {id: this.id.toLowerCase(),};  },

        result({data,loading,}) {
          if (loading) {
            console.log('loading');
          }
          else {
          console.log("IN SUBSCRIPTIONS : INSTRUMENTS GLOBAL STATES");
          console.log(data);
          // let accountData = data.account;
          // if (accountData) {
          //   this.subcribeToMarketPositions(accountData);
          // }
          }
        },
      },
    },
  },

  // watch: {
  //   parentHeight: function(newVal) {
  //     let calcHeight = newVal;
  //     this.tableHeight = 'calc(100vh - ' + (calcHeight  + 100) + 'px';
  //   },
  // },




  async created() {
    console.log(" IN Supported-Money-Markets Created Function");
    if (this.$store.state.web3 && this.$store.state.isNetworkSupported) {
      this.loadSessionData();
    }
  },





    mounted() {
    this.refreshThisSession = () => this.loadSessionData();     // DATA LOADED FOR THE SUPPORTED NETWORK
    this.updateLocallyStoredStatesForInstrument = (instrumentAddress) => this.refreshForInstrument(instrumentAddress);     //INSTRUMENT REFRESHED 

    ExchangeDataEventBus.$on(EventNames.connectedToSupportedNetwork, this.refreshThisSession );    
    ExchangeDataEventBus.$on(EventNames.instrumentGlobalBalancesUpdated, this.updateLocallyStoredStatesForInstrument );    
    ExchangeDataEventBus.$on(EventNames.instrument_SIGH_STATES_Updated, this.updateLocallyStoredStatesForInstrument );    
  },

  methods: {

    ...mapActions(['LendingPool_getInstruments','refershInstrumentState']),

    async refresh() {
      this.showLoader = true;
      console.log("refreshing INSTRUMENT Global States");
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported by SIGH Finance - 1) Ethereum :  Kovan Testnet(42) " }); 
      }      
      else {                                  // EXECUTE THE TRANSACTION
        let response = await this.refreshInstrumentStates(true);
        if (response) {
          this.$showInfoMsg({message: " SIGH FINANCE : Data refreshed successfully" });
        }
        else {
          this.$showErrorMsg({message: " Could not refresh SIGH FINANCE : Session. Something went wrong. Contact our team at contact@sigh.finance in case of any queries!"  });
        }
     }
      this.showLoader = false;
    },

    // REFRESHES INSTRUMENTS BASIC STATE, GLOBAL STATE, CONFIG, SIGH STATES : (API Call)  
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
          ExchangeDataEventBus.$emit(EventNames.instrumentStateUpdated, {'instrumentAddress': instrumentAddresses[i]});    
    
          console.log(" SUPPORTED INSTRUMENT - " + i + " : CONFIGURATION");
          this.$store.commit("addToSupportedInstrumentConfigs",{instrumentAddress: instrumentAddresses[i] , instrumentConfig: data.instrumentConfiguration});
          ExchangeDataEventBus.$emit(EventNames.instrumentConfigUpdated, {'instrumentAddress': instrumentAddresses[i] });    
    
          console.log(" SUPPORTED INSTRUMENT - " + i + " : GLOBAL BALANCES");          // console.log(data.instrumentGlobalBalances);
          this.$store.commit("addToSupportedInstrumentGlobalStates",{instrumentAddress: instrumentAddresses[i] , instrumentGlobalState: data.instrumentGlobalBalances});
          ExchangeDataEventBus.$emit(EventNames.instrumentGlobalBalancesUpdated, {'instrumentAddress': instrumentAddresses[i] });    

          console.log(" SUPPORTED INSTRUMENT - " + i + " : SIGH STATES");          // console.log(data.instrumentGlobalBalances);
          this.$store.commit("addToSupportedInstrumentSIGHStates",{instrumentAddress: instrumentAddresses[i] , instrumentSIGHState: data.instrumentSighState});
          ExchangeDataEventBus.$emit(EventNames.instrument_SIGH_STATES_Updated, {'instrumentAddress': instrumentAddresses[i]});    
        }
        this.loadSessionData();
        return true;
      }
      catch(error) {
        console.log(error);
        return false;
      }
    },

    
    // REFRESHES THE CURRENT SESSION : FROM STORE 
    loadSessionData() {
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
    },

    // REFRESHES STATE FOR A PARTICULAR INSTRUMENT
    refreshForInstrument(instrumentAddress) {
      let instrumentGlobalStates = this.$store.getters.getsupportedInstrumentGlobalStates;
      let instrumentSIGHStates = this.$store.getters.getsupportedInstrumentSIGHStates;
      for (let i=0; i<this.instruments.length; i++) {
        if (instrumentAddress == this.instruments[i].instrumentAddress ) {
          console.log("Updating State for instrumnet = " + this.instruments[i].basicData.symbol );
          console.log(this.instruments[i]);
          this.instruments[i].globalState = instrumentGlobalStates.get(instrumentAddress);
          this.instruments[i].sighState = instrumentSIGHStates.get(instrumentAddress);
        }
      }
    }

  },

  destroyed() {
    ExchangeDataEventBus.$off(EventNames.connectedToSupportedNetwork  );    
    ExchangeDataEventBus.$off(EventNames.instrumentGlobalBalancesUpdated );    
    ExchangeDataEventBus.$off(EventNames.instrument_SIGH_STATES_Updated );    
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
