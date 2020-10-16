<template src="./template.html"></template>

<script>
import TabBar from '@/components/TabBar/TabBar.vue';

export default {
  name: 'balance-transfer',
  components: {
    TabBar,
  },
  data() {
    return {
      activeTab: 'TRADE-ALOGS',
      tabs: [
        'TRADE-ALOGS',        
      ],
      tabRouteMapping: {
        'TRADE-ALOGS': '/balance',            
      },
    };
  },
  methods: {
    onTabChange(activeTab) {
      this.activeTab = activeTab;
    },
  },
};
</script>
<style lang="scss" src="./style.scss" scoped>

</style>
