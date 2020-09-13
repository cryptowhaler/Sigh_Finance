<template src="./template.html"></template>

<script>
import Spinner from '@/components/Spinner/Spinner.vue';
import { dateToDisplayDateTime, } from '@/utils/utility';

export default {
  name: 'vega-trading-history',
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
    this.updateData();
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
        return ele.SYMBOL.includes(this.searchString.toUpperCase()) || ele.PL.toString().includes(this.searchString) || ele.ID.toString().includes(this.searchString) ;
      });
      this.history = this.sortData(this.history);
    },
    sortData(data) {
      switch(this.sortBy) {
        case 0: 
          return data.reverse();
        case 1: 
          return data;
        case 101: 
          return data.sort((b,a) => {
            return a.STATUS - b.STATUS;
          });
        case 102: 
          return data.sort((b,a) => {
            return b.STATUS - a.STATUS;
          });
        case 201: 
          return data.sort((b,a) => {
            return a.AMOUNT - b.AMOUNT;
          });
        case 202: 
          return data.sort((b,a) => {
            return b.AMOUNT - a.AMOUNT;
          });
        case 301: 
          return data.sort((b,a) => {
            return a.PL_PERC - b.PL_PERC;
          });
        case 302: 
          return data.sort((b,a) => {
            return b.PL_PERC - a.PL_PERC;
          });
        // case 301: 
        //   return data.sort((b,a) => {
        //     return a.MTS_CREATE - b.MTS_CREATE;
        //   });
        // case 302: 
        //   return data.sort((b,a) => {
        //     return b.MTS_CREATE - a.MTS_CREATE;
        //   });
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


