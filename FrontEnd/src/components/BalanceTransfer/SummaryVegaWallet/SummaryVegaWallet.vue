<template src="./template.html"></template>

<script>
import Spinner from '@/components/Spinner/Spinner.vue';

export default {
  name: 'wallet-summary-vega',
  components: {
    Spinner,
  },
  data() {
    return {
      vegaSummary: [],
      spinnerFlag: true,
      sortBy: 0,
      searchString: '',
      initialData: [],
    };
  },
  watch: {
    searchString: function () {
      this.updateData();          
    },
  },
  async created() {
    let data = [];
    this.spinnerFlag = false;
    this.initialData = data;
  },
  methods: {
    updateData() {
      this.vegaSummary = this.initialData.filter((ele) => {
        return ele.asset.includes(this.searchString.toUpperCase());
      });
      this.vegaSummary = this.sortData(this.vegaSummary);
    },
    sortData(data) {
      switch(this.sortBy) {
        case 0: 
          return data.reverse();
        case 1: 
          return data;
        case 201: 
          return data.sort((b,a) => {
            return parseFloat(a.free) - parseFloat(b.free);
          });
        case 202: 
          return data.sort((b,a) => {
            return parseFloat(b.free) - parseFloat(a.free);
          });
        case 301: 
          return data.sort((b,a) => {
            return (parseFloat(a.free) + parseFloat(a.locked)) - (parseFloat(b.free) + parseFloat(b.locked));
          });
        case 302: 
          return data.sort((b,a) => {
            return (parseFloat(b.free) + parseFloat(b.locked)) - (parseFloat(a.free) + parseFloat(a.locked));
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


