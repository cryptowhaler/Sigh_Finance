<template src="./template.html"></template>

<script>
import { dateToDisplayDateTime, } from '@/utils/utility';
import Spinner from '@/components/Spinner/Spinner.vue';

export default {
  name: 'vega-deposit-history',
  components: {
    Spinner,
  },
  data() {
    return {
      history: [],
      spinnerFlag: true,
      sortBy: 0,
      searchString: '',
      initialData: [],
      displayText: 'Note: This feature is currently not supported with Trade-Alogs (Beta Version)',
    };
  },
  watch: {
    searchString: function() {
      this.updateData();
    },
  },
  created() {
    this.updateData();
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
      // alert("Copied the text: " + copyText.value);
      this.$showSuccessMsg({ message: 'Transaction Hash copied successfully.', });
    }, 
    updateData() {
      this.history = this.initialData.filter((ele) => {
        return ele.currency.includes(this.searchString.toUpperCase()) || ele.id.toString().includes(this.searchString) || ele.destinationAddress.toString().includes(this.searchString) ;
      });
      this.history = this.sortData(this.history);
    },
    sortData(data) {
      switch(this.sortBy) {
        case 0: 
          return data.sort((b,a) => {
            return a.id - b.id;
          });
        case 1: 
          return data.sort((b,a) => {
            return b.id - a.id;
          });
        case 101: 
          return data.sort((b,a) => {
            return ('' + a.currency).localeCompare(b.currency);
          });
        case 102: 
          return data.sort((b,a) => {
            return ('' + b.currency).localeCompare(a.currency);
          });
        case 201: 
          return data.sort((b,a) => {
            return a.amount - b.amount;
          });
        case 202: 
          return data.sort((b,a) => {
            return b.amount - a.amount;
          });
        case 301: 
          return data.sort((b,a) => {
            return a.movementLastUpdated - b.movementLastUpdated;
          });
        case 302: 
          return data.sort((b,a) => {
            return b.movementLastUpdated - a.movementLastUpdated;
          });
        case 401: 
          return data.sort((b,a) => {
            return ('' + a.status).localeCompare(b.status);
          });
        case 402: 
          return data.sort((b,a) => {
            return ('' + b.status).localeCompare(a.status);
          });
      }
    },
    sortDataBy(value) {
      if(this.sortBy === value) {
        this.sortBy += 1;
      } else {
        this.sortBy = value;
      }
      this.updateData();
    },
  },
};
</script>
<style lang="scss" src="./style.scss" scoped>
</style>


