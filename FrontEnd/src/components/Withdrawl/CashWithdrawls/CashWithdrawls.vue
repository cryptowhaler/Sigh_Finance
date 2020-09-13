<template src="./template.html"></template>

<script>
import { stringArrayToHtmlList, } from '@/utils/utility';

export default {
  name: 'cash-withdrawls',
  data() {
    return {
      formValue: {
        amount: '',
      },
    };
  },
  methods: {
    withdrawCash() {
      let validationErrors = [];
      if (!(Number(this.formValue.amount) > 0)) {
        validationErrors.push('Invalid Amount');
      }

      if (validationErrors.length) {
        this.$showErrorMsg({
          message: stringArrayToHtmlList(validationErrors),
        });
      }

      this.$showErrorMsg({
        message: 'This feature is currently not supported in Trade-Alogs (Beta Version)',
      });
    },
  },
};
</script>
