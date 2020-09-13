<template src="./template.html"></template>

<script>
import Spinner from '@/components/Spinner/Spinner.vue';
import { dateToDisplayDateTime, } from '@/utils/utility';

export default {
  name: 'vega-orders-history',
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
  async created() {
    let data = [];
    this.initialData = data;
    // this.updateData();
  },
  watch: {
    searchString: function() {
      this.updateData();
    },
  },
  methods: {
    formatDateTime(timestamp) {
      return dateToDisplayDateTime(new Date(timestamp));
    },
    updateData() {
      this.history = this.initialData.filter((ele) => {
        return ele.symbol.includes(this.searchString.toUpperCase()) || ele.type.toString().includes(this.searchString) || ele.id.toString().includes(this.searchString) ;
      });
      this.history = this.sortData(this.history);
      this.history = this.history.reverse();
    },
    sortData(data) {
      switch(this.sortBy) {
        case 0: 
          return data.reverse();
        case 1: 
          return data;
        case 101: 
          return data.sort((b,a) => {
            return a.order_status - b.order_status;
          });
        case 102: 
          return data.sort((b,a) => {
            return b.order_status - a.order_status;
          });
        case 201: 
          return data.sort((b,a) => {
            return a.symbol - b.symbol;
          });
        case 202: 
          return data.sort((b,a) => {
            return b.symbol - a.symbol;
          });
        case 301: 
          return data.sort((b,a) => {
            return a.amount - b.amount;
          });
        case 302: 
          return data.sort((b,a) => {
            return b.amount - a.amount;
          });
        case 401: 
          return data.sort((b,a) => {
            return a.price - b.price;
          });
        case 402: 
          return data.sort((b,a) => {
            return b.price - a.price;
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


