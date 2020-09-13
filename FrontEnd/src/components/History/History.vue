<template src="./template.html"></template>

<script>
import vegaDepositHistory from './VegaDepositHistory/VegaDepositHistory';
import vegaTradingHistory from './VegaTradingHistory/VegaTradingHistory';
import vegaCompletedWithdrawalHistory from './VegaCompletedWithdrawalHistory/VegaCompletedWithdrawalHistory';
import vegaPendingWithdrawalHistory from './VegaPendingWithdrawalHistory/VegaPendingWithdrawalHistory';
import vegaOrdersHistory from './VegaOrdersHistory/VegaOrdersHistory';
import vegaPositionsHistory from './VegaPositionsHistory/VegaPositionsHistory';

export default {
  name: 'history',
  components: {
    vegaDepositHistory,
    vegaTradingHistory,
    vegaCompletedWithdrawalHistory,
    vegaPendingWithdrawalHistory,
    vegaOrdersHistory,
    vegaPositionsHistory,
  },
  
  data() {
    return {
      selectedExchange: 'vega',
      vegaFlag: true,
      vegaActiveTab: 'Orders',
      vegaTabs: ['Orders', 'Trading', 'Positions', 'Deposits', 'Withdrawal',],
    };
  },

  methods: {
    onDropDownvegaTabChange(tab) {
      this.vegaActiveTab = tab;
    },
  },
};
</script>
<style lang="scss" src="./style.scss" scoped>

</style>
