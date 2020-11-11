<template src="./template.html"></template>

<script>
import { ConnectedWallet } from '../../../../../utils/localStorage';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import EventBus, {EventNames,} from '@/eventBuses/default';
export default {
  name: 'StakeSIGH',
  data() {
    return {
      balance: {},
      marginInfo: {},
      showMarginInfo: true,
      marginBaseInfo:{},
      // totalUnrealizedPNL_: this.$store.getters.totalUnrealizedPNL,
      // totalRealizedPNL: this.$store.getters.totalRealizedPNL,
      selectedPubKey: '',
      pubkeys : ConnectedWallet.pubKeys,
    };
  },
  
  async created() {
  },
  
  mounted() {
    this.userwalletConnected = () => this.setpubkeys();
    this.userWalletDisconnectedListener = () => this.setpubkeysEmpty();
    EventBus.$on(EventNames.userWalletConnected, this.userwalletConnected);
    EventBus.$on(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },

  methods: {
    setpubkeys() {
      // console.log(ConnectedWallet.pubKeys);
      // console.log(this.pubkeys);
      this.pubkeys = ConnectedWallet.pubKeys;
      // console.log(this.pubkeys);
    },
    setpubkeysEmpty() {
      this.pubkeys = [];
    },

    PubKeyChange () {
      // console.log('newly selected ' + this.selectedPubKey);
      // console.log('currently active' + ConnectedWallet.currentActiveKey);
      ConnectedWallet.currentActiveKey = this.selectedPubKey;
      // console.log( 'newly active' + ConnectedWallet.currentActiveKey);
      EventBus.$emit(EventNames.pubKeyChanged);
    },
  },

  destroyed() {
    EventBus.$off(EventNames.userWalletConnected, this.userwalletConnected);
    EventBus.$off(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },
};
</script>
<style lang="scss" src="./style.scss" scoped>

</style>
