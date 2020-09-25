<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';
import RedeemOrder from './Redeem/Redeem.vue';
import RedeemUnderlyingOrder from './RedeemUnderlying/RedeemUnderlying.vue';

export default {
  name: 'Redeem-Component',
  components: {
    TabBar,
    RedeemOrder,
    RedeemUnderlyingOrder,
  },

  data() {
    return {
      activeTab: 'Redeem',
      tabs: [ 'Redeem','Redeem Underlying',],
      height: 0,
      statusCode: '',
      preActive:'Redeem',
    };
  },
  
  methods: {
    activeTabChange(activeTab) {
      this.activeTab = activeTab;
      if (activeTab === 'Redeem') {
        this.$store.commit('changeInvest_Invest_Tab');
      } else {
        this.$store.commit('changeInvest_Withdraw_Tab');
      }
      if (this.preActive !== activeTab) {
        this.$root.$emit('MarketTabChange', activeTab);
        this.preActive = activeTab;
      }
    }, 

    getStatus(exc) {
      if (exc === 'auto') {
        this.statusCode = this.$store.getters.getAutoStatus;
      } else {
        this.statusCode = this.$store.getters[`get${exc}OrderStatus`];
      }
    },
  },

};
</script>

<style lang="scss" src="./style.scss" scoped>
</style>
