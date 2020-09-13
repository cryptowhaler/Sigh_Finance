<template src="./template.html"></template>

<script>
import EventBus, { EventNames, } from '@/eventBuses/default';
import { ModelSelect, } from 'vue-search-select';

export default {
  name: 'side-menu',
  watch: {
    $route() {
      this.$store.commit('closeSidebar');
    },
  },
  components: {
    ModelSelect,
  },
  methods: {
    onTriggerClick() {
      this.$store.commit('toggleSidebar');
    },
    showDepositModal() {
      this.$store.commit('closeSidebar');
      this.$emit('show-deposit-modal');
    },
    showWithdrawlModal() {
      this.$store.commit('closeSidebar');
      this.$emit('show-withdrawl-modal');
    },
    logout() {
      this.$store.commit('closeSidebar');
      this.$emit('show-logout-modal');
    },
    login() {
      this.$store.commit('closeSidebar');
      this.$emit('show-login-modal');      
    },
    contact() {
      this.$store.commit('closeSidebar');
      this.$emit('show-contact-modal');      
    },    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
