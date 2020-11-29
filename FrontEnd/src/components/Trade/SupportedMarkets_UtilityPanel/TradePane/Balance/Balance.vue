<template src="./template.html"></template>

<script>
import EventBus, {EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
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
      this.loadSessionData();
    }
  },
  
  mounted() {
    this.refreshThisSession = () => this.loadSessionData();     // DATA LOADED FOR THE SUPPORTED NETWORK
    this.updateLocallyStoredStatesForInstrument = (instrumentRefreshed) => this.loadSessionData();     //INSTRUMENT REFRESHED 

    ExchangeDataEventBus.$on(EventNames.ConnectedWalletSesssionRefreshed, this.refreshThisSession );    
    ExchangeDataEventBus.$on(EventNames.ConnectedWallet_SIGH_Balances_Refreshed, this.refreshThisSession );    
    ExchangeDataEventBus.$on(EventNames.ConnectedWallet_Instrument_Refreshed, this.updateLocallyStoredStatesForInstrument );    
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
      // let  _walletInstrumentStatesArray = [];            
      this.$store.commit("setWalletSIGH_FinanceState",{});  // RESET SESSION DATA STORED GLOBAL STATE 
      try {
        for (let i=0; i < instruments.length; i++) { 
            let currentUserInstrumentState = await this.refresh_User_Instrument_State({ cur_instrument: instruments[i] }); 
            console.log(currentUserInstrumentState);
            this.$store.commit("addToWalletInstrumentStates",{ instrumentAddress: instruments[i].instrumentAddress, walletInstrumentState: currentUserInstrumentState }); 
            ExchangeDataEventBus.$emit(EventNames.ConnectedWallet_Instrument_Refreshed, {'instrumentAddress': instruments[i].instrumentAddress });    
        }
        this.loadSessionData();
        return true;
      }
      catch (error) {
        console.log(error);
        return false;
      }
    },



    // REFRESHES THE CURRENT SESSION : FROM STORE 
    loadSessionData() {
      if (this.$store.state.connectedWallet) {
        console.log("LOADING 'WALLET : INSTRUMENT STATES'  LIST");
        let localInstruments = [];
        let instruments = this.$store.getters.getSupportedInstruments;
        let walletInstrumentStates = this.$store.getters.getWalletInstrumentStates;
        for (let i=0; i<instruments.length; i++ ) {
          let currentUserInstrumentState = walletInstrumentStates.get(instruments[i].instrumentAddress);
          console.log(currentUserInstrumentState);
          localInstruments.push(currentUserInstrumentState);
        }
        this.walletInstrumentStatesArray = localInstruments;
        console.log(this.walletInstrumentStatesArray);
      }
    },



    // REFRESHES STATE FOR A PARTICULAR INSTRUMENT
    refreshForInstrument(instrumentRefreshed) {
      console.log(instrumentRefreshed );
      console.log("IN BAALNCES :  " + instrumentRefreshed.instrumentAddress );
      let i=0;
      for ( i=0; i<this.walletInstrumentStatesArray.length; i++) {
        if (instrumentRefreshed.instrumentAddress == this.walletInstrumentStatesArray[i].instrumentAddress ) {
          console.log("Updating State for WALLET :INSTRUMENT = " + this.walletInstrumentStatesArray[i].symbol );
          break;
        }
      }
      if (i<this.walletInstrumentStatesArray.length) {
        console.log(this.walletInstrumentStatesArray[i]);
        console.log(this.$store.state.walletInstrumentStates);
        this.walletInstrumentStatesArray[i] = this.$store.state.walletInstrumentStates.get(instrumentRefreshed.instrumentAddress);
        console.log(this.walletInstrumentStatesArray[i]);
      }

    },

    getBalanceString(number)  {
      if ( Number(number) > 1000000 ) {
        let inMil = (Number(number) / 1000000).toFixed(2);
        return inMil.toString() + ' M';
      } 
      if ( Number(number) > 1000 ) {
        let inK = (Number(number) / 1000).toFixed(3);
        return inK.toString() + ' K';
      } 
      return number;
    },        

  },


  destroyed() {
    ExchangeDataEventBus.$off(EventNames.ConnectedWalletSesssionRefreshed  );    
    ExchangeDataEventBus.$off(EventNames.ConnectedWallet_SIGH_Balances_Refreshed  );    
    ExchangeDataEventBus.$off(EventNames.ConnectedWallet_Instrument_Refreshed  );    
  },


};
</script>
<style lang="scss" src="./style.scss" scoped>

</style>
