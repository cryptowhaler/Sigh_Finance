<template src="./template.html"></template>

<script>
import { dateToDisplayDateTime, } from '@/utils/utility';
import EventBus, { EventNames, } from '@/eventBuses/default';
import gql from 'graphql-tag';

export default {
  
  name: 'active-orders',

  components: {},

  data() {
    return {
      orders: [],
      tableHeight: '',
      connectedWallet: null, // ConnectedWallet.currentActiveKey,          
      showLoader:false,
    };
  },  

  // apollo: {
  //   $subscribe: {
  //     orders: {
  //       query: gql`subscription name($partyId: String!) {
  //                 orders (partyId:$partyId) {
  //                     id
  //                     price
  //                     side
  //                     size
  //                     remaining
  //                     timeInForce
  //                     market {
  //                       id
  //                       name
  //                     }
  //                     status
  //                     createdAt
  //                 }
  //               }`,

  //       variables() {  return {partyId: this.partiesId,};  },

  //       result({data,loading,}) {
  //         let order = data.orders;
  //       },
  //     },
  //   },
  // },


  // computed: {
  //   activeOrders() {
  //     return this.mapActiveOrders(this.$store.getters.activeOrders);
  //   },
  // },

  mounted() {     
    this.userwalletConnected = () => this.getActiveOrders();
    this.userWalletDisconnectedListener = () => (this.deleteOrders());
    EventBus.$on(EventNames.userWalletConnected, this.userwalletConnected);
    EventBus.$on(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },



  methods: {
    toggleOpen() {
      this.$emit('toggle-open');
    },

    formatDateTime(timestamp) {
      return dateToDisplayDateTime(new Date(timestamp));
    },

    async getActiveOrders() {     //will call vegaProtocolService 
      // this.$store.commit('activeOrders',[]);
    },

    deleteOrders() {  //cleaning order history 
      // this.$store.commit('activeOrders',[]);
      this.orders = [];
    },
  },



  destroyed() {
    EventBus.$off(EventNames.userWalletConnected, this.userwalletConnected);
    EventBus.$off(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
  },

};
</script>

<style lang="scss" src="./style.scss" scoped></style>


