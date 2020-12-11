<template src="./template.html"></template>

<script>
import { ModelSelect, } from 'vue-search-select';
import EventBus, { EventNames, } from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';


export default {
  name: 'header-section',


  data() {
    return {
      isConnected : this.$store.getters.isWalletConnected,
      statusCode: 'Connect Wallet',
      selectedTransaction: null,
      sighInstrument: {},
    };
  },


  components: {
    ModelSelect,
  },

  async created() {         //GETS WEB3
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
    ...mapActions(['loadWeb3','getContractsBasedOnNetwork','initiateSighFinancePolling','getWalletConfig','getConnectedWalletState','SIGHDistributionHandler_refreshSighSpeeds','SIGHSpeedController_drip']),


    async fetchConfigsWalletConnected() {
      // await this.handleWeb3();   
      await this.fetchSessionUserStateData(); 
    },

    transactionClicked() {
      console.log(this.selectedTransaction);
      if (this.selectedTransaction && this.$store.state.networkId == '42') {
        window.open('https://kovan.etherscan.io/tx/'  + this.selectedTransaction.hash  , '_blank');
        window.focus();
      }
    },


    onTriggerClick() {
      this.$store.commit('toggleSidebar');
    },

    
    showContactModal() {        //Added
      this.$store.commit('closeSidebar');
      this.$emit('show-contact-modal');
    },


    async dripMintedSIGH() {
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }       
      else {       // WHEN ABOVE CONDITIONS ARE MET SO THE TRANSACTION GOES THROUGH
        let response =  await this.SIGHSpeedController_drip();
        if (response.status) {      
          this.$showSuccessMsg({message: "SIGH transferred Successfully to SIGH Distribution Handler and the SIGH Treasury Contracts!" });
        }
        else {
          this.$showErrorMsg({message: "SIGH Drip FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
      }
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
