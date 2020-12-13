<template src="./template.html"></template>

<script>
import EventBus, {EventNames,} from '@/eventBuses/default';
import TabBar from '@/components/TabBar/TabBar.vue';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';

import sighLiquidityStream from './sighLiquidityStream/sighLiquidityStream.vue';
import sighBorrowingStream from './sighBorrowingStream/sighBorrowingStream.vue';
import interestStream from './interestStream/interestStream.vue';
import Web3 from 'web3';

export default {
  name: 'Streaming',

  components: {
    TabBar,
    sighLiquidityStream,
    sighBorrowingStream,
    interestStream,
  },

  data() {
    return {
      activeTab: '$SIGH Liquidity Stream',
      tabs: ['$SIGH Liquidity Stream','$SIGH Borrowing Stream','Interest Stream'], 
      preActive:'$SIGH Stream',
      selectedInstrument: {},
      height: 0,
      statusCode: '',
    };
  },

  methods: {

    activeTabChange(activeTab) {
      this.activeTab = activeTab;
    }, 
 
    updateSelectedInstrument() {        // Selecting an Instrument from dropdown
      console.log(this.selectedInstrument);
      if ( !this.$store.state.web3 ) {
        this.$showErrorMsg({title:"Connect Your Wallet", message:'You need to connect your Wallet to interact with SIGH Finance!'});
      }
      else if (!this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({title:"Network Not Supported", message:" SIGH Finance is currently not available on the connected blockchain network!"});
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries!"}); 
      }       
      else {
        this.$store.commit('updateSelectedInstrument',this.selectedInstrument);
        ExchangeDataEventBus.$emit(EventNames.changeSelectedInstrument, {'instrument':this.selectedInstrument });    //TO CHANGE ORDER-BOOK/Supported-Money-Markets
      }
    },
  },

     
};
</script>


<style lang="scss" src="./style.scss" scoped></style>
