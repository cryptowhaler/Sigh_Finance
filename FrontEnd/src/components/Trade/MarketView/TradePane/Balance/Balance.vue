<template src="./template.html"></template>

<script>
import { VegaKeys } from '../../../../../utils/localStorage';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import EventBus, {EventNames,} from '@/eventBuses/default';
export default {
  name: 'balance',
  data() {
    return {
      balance: {},
      marginInfo: {},
      showMarginInfo: true,
      marginBaseInfo:{},
      // totalUnrealizedPNL_: this.$store.getters.totalUnrealizedPNL,
      // totalRealizedPNL: this.$store.getters.totalRealizedPNL,
      selectedPubKey: '',
      pubkeys : VegaKeys.pubKeys,
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
      // console.log(VegaKeys.pubKeys);
      // console.log(this.pubkeys);
      this.pubkeys = VegaKeys.pubKeys;
      // console.log(this.pubkeys);
    },
    setpubkeysEmpty() {
      this.pubkeys = [];
    },

    PubKeyChange () {
      // console.log('newly selected ' + this.selectedPubKey);
      // console.log('currently active' + VegaKeys.currentActiveKey);
      VegaKeys.currentActiveKey = this.selectedPubKey;
      // console.log( 'newly active' + VegaKeys.currentActiveKey);
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
