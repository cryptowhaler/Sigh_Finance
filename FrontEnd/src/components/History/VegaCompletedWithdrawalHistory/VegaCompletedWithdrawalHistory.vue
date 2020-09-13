<template src="./template.html"></template>

<script>
import { dateToDisplayDateTime, } from '@/utils/utility';
import Spinner from '@/components/Spinner/Spinner.vue';

export default {
  name: 'vega-completed-withdrawal-history',
  components: {
    Spinner,
  },
  data() {
    return {
      history: [],
      spinnerFlag: true,
      displayText: 'Note: This feature is currently not supported with Trade-Alogs (Beta Version)',
    };
  },
  async created() {
    let newData = [];
    this.history = newData;
    if(this.history.length === 0)
      this.displayText = 'Note: This feature is currently not supported with Trade-Alogs (Beta Version)';
    this.$store.commit('removeLoaderTask', 1);
  },
  methods: {
    formatDateTime(timestamp) {
      return dateToDisplayDateTime(new Date(timestamp));
    },

    copyReferral(id) {
      let copyText = document.querySelector(`#txhash${id}`);
      copyText.select();
      copyText.select();
      document.execCommand('copy');
      alert('Copied the text: ' + copyText.value);
      this.$showSuccessMsg({ message: 'Transaction Hash copied successfully.', });
    }, 
  },
};
</script>
<style lang="scss" src="./style.scss" scoped>
</style>


