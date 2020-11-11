<template src="./template.html"></template>

<script>
// import RecentTrades from './spare2/RecentTrades.vue';
// import ActiveOrders from './spare1/ActiveOrders.vue';
import Positions from './Positions/Positions.vue';
import SIGHInfographics from './SIGHInfographics/SIGHInfographics.vue';

export default {
  name: 'Protocol_Infographics',
  components: {
    Positions,
    SIGHInfographics,
  },
  data() {
    return {
      openAccordionPosition: 'positions',
    };
  },
  methods: {
    toggleOpenPosition() {
      if (this.openAccordionPosition === 'positions') {
        this.openAccordionPosition = '';
      } 
      else {
        this.openAccordionPosition = 'positions';
      }
    }, 
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>


