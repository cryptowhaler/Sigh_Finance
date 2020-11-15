<template src="./template.html"></template>

<script>
import { ConnectedWallet } from '../../../../../utils/localStorage';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import EventBus, {EventNames,} from '@/eventBuses/default';

export default {

  name: 'balance',

  data() {
    return {
      balance: {},
    };
  },
  
  created() {
    console.log("IN BALANCE (TRADE-PANE) FUNCTION ");
  },
  
  mounted() {
    // this.userwalletConnected = () => this.setpubkeys();
    // this.userWalletDisconnectedListener = () => this.setpubkeysEmpty();
    // EventBus.$on(EventNames.userWalletConnected, this.userwalletConnected);
    // EventBus.$on(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },

  methods: {

  },

  destroyed() {
    EventBus.$off(EventNames.userWalletConnected, this.userwalletConnected);
    EventBus.$off(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },
};
</script>
<style lang="scss" src="./style.scss" scoped>

</style>
