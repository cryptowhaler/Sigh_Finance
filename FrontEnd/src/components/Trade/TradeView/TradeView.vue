<template src="./template.html"></template>

<script>
import RecentTrades from './RecentTrades/RecentTrades.vue';
import ActiveOrders from './ActiveOrders/ActiveOrders.vue';
import Positions from './Positions/Positions.vue';

export default {
  name: 'trade-view',
  components: {
    RecentTrades,
    ActiveOrders,
    Positions,
  },
  data() {
    return {
      openAccordionTrades: 'activeTrades',
      openAccordionPosition: 'positions',
      openAccordionOrders: 'activeOrders',
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
    toggleOpenOrders() {
      if (this.openAccordionOrders == 'activeOrders') {
        this.openAccordionOrders = '';
      }
      else {
         this.openAccordionOrders = 'activeOrders';
      }
    },       
    toggleOpenTrades() {
      if (this.openAccordionTrades == 'recentTrades') {
        this.openAccordionTrades = '';
      }
      else {
        this.openAccordionTrades = 'recentTrades';
      }
    },       
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>


