<template src="./template.html"></template>

<script>
import { stringArrayToHtmlList, } from '@/utils/utility';

export default {
  name: 'crypto-withdrawls',
  data() {
    return {
      supportedCoins: ['BTC', 'eth', 'LTC','xrp',],
      formValue: {
        amount: '',
        recievingAddress: '',
        coin: 'BTC',
      },
      withdrawalFee: 0,
      statuses: {
        btc: 'feature under development',
        ltc: 'feature under development',
        eth: 'feature under development',
        dai: 'feature under development',
      },
      fees: {
        btc: 0,
        eth: 0,
        ltc: 0,
        xrp: 0,
      },
    };
  },
  watch: {
    'formValue.coin': {
      handler: function(to) {
        this.showFees(to);
      },
      deep: true,
    },
  },

  methods: {

    getStatus(coin) {
      if(coin === 'btc') {
        return  'feature under development';
      } else  if(coin === 'eth') {
        return  'feature under development';
      } else if(coin === 'ltc'){
        return  'feature under development';
      } else if(coin === 'xrp'){
        return  'feature under development';
      }
    },


    withdrawCrypto() {
      let validationErrors = [];
      if (!(Number(this.formValue.amount) > 0)) {
        validationErrors.push('Invalid Amount');
      }
      if (!this.formValue.recievingAddress)
        validationErrors.push('Recieving Address is required');
      if (validationErrors.length) {
        this.$showErrorMsg({
          message: stringArrayToHtmlList(validationErrors),
        });
      } 
      else {
        this.otpSent = true;
        this.$showErrorMsg({
          message: 'This feature is currently not supported in Trade-Alogs (Beta Version)',
        });
      }
      this.$store.commit('removeLoaderTask', 1);
    },
    getGrpId(index) {
      return 'grp-a' + index;
    },
    getGrpId2(index) {
      return 'grp-b' + index;
    },
    async showFees(coin) {
      this.withdrawalFee = this.fees[coin];
    },
  },
};
</script>
<style lang="scss" scoped>
.resend {
  line-height: 40px;
}
.resend :hover {
  color: var(--primary-text-color);
}
</style>
