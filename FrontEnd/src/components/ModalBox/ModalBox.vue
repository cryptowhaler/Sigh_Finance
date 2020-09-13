<template src='./template.html'></template>

<script>
import Deposit from '@/components/Deposit/Deposit.vue';
import Withdrawl from '@/components/Withdrawl/Withdrawl.vue';
import BalanceTransfer from '@/components/BalanceTransfer/BalanceTransfer.vue';
import VegaLogin from '@/components/Vega-Auth/Login/Login.vue';
import VegaLogout from '@/components/Vega-Auth/Logout/Logout.vue';
import Contact from '@/components/Contact/Contact.vue';

export default {
  name: 'modal-box',
  components: {
    Deposit,
    Withdrawl,
    BalanceTransfer,
    VegaLogin,
    VegaLogout,
    Contact,
  },
  props: {
    internalComponent: {
      required: true,
    },
    show: {
      default: false,
    },
  },
  methods: {
    closeModal() {
      this.$emit('modal-closed');
    },
    updateShow(show) {
      if (this.show && !show) {
        this.closeModal();
      }
    },
    handleKeyUp(keyboardEvent) {
      if (keyboardEvent.keyCode === 27) {
        this.closeModal();
      }
    },
  },
};
</script>
