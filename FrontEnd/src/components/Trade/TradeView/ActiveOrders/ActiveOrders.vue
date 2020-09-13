<template src="./template.html"></template>

<script>
import { dateToDisplayDateTime, } from '@/utils/utility';
import VegaProtocolService from '@/services/VegaProtocolService';
import EventBus, { EventNames, } from '@/eventBuses/default';
import { VegaKeys, } from '../../../../utils/localStorage';
import gql from 'graphql-tag';

export default {
  
  name: 'active-orders',

  components: {},

  props: {
    open: {
      type: Boolean,
    },
  },

  data() {
    return {
      orders: this.$store.getters.activeOrders,
      tableHeight: '',
      orders_array: [],
      isLoggedIn: false,
      partiesId: VegaKeys.currentActiveKey,          
      // showLoader:false,
      // snapTaken: false,
    };
  },  

  apollo: {
    $subscribe: {
      orders: {
        query: gql`subscription name($partyId: String!) {
                  orders (partyId:$partyId) {
                      id
                      price
                      side
                      size
                      remaining
                      timeInForce
                      market {
                        id
                        name
                      }
                      status
                      createdAt
                  }
                }`,

        variables() {  return {partyId: this.partiesId,};  },

        result({data,loading,}) {
          if (loading) {
            // console.log('loading');
          }
          let order = data.orders;
          // console.log(order);
          for (let i=0;i<order.length;i++)
          {
            // console.log(order[i]);
            if (order[i] == null ) {
              this.$showErrorMsg({message: ' Recently entered order has been rejected by the Vega Network',});                
            }
            else if ( order[i].status == 'Rejected') {
              let msg = order[i].side + ' order for the market ' + order[i].market.name + ' of size = ' + order[i].size;
              this.$showErrorMsg({message: msg +  ' has been rejected by the Vega Network',});                
            }
            else if (order[i].status == 'Filled') {
              let msg = order[i].side + ' order for the market ' + order[i].market.name + ' of size = ' + order[i].size;
              this.$showSuccessMsg({message: msg +  ' has been filled',});                
            }
            else if (order[i].status == 'Stopped') {
              let msg = order[i].side + ' order for the market ' + order[i].market.name + ' of size = ' + order[i].size;
              this.$showErrorMsg({message: msg +  ' has been stopped by the Vega Network',});                
            }
            else if (order[i].status == 'PartiallyFilled') {
              let msg = order[i].side + ' order for the market ' + order[i].market.name + ' of size = ' + order[i].size + ' has been partially filled (Filled = ' + (Number(order[i].size) - Number(order[i].remaining)) + ', Remaining = ' + Number(order[i].remaining);
              this.$showSuccessMsg({message: msg +  ' by the Vega Network',});                
              this.addNewOrder(order[i]);

            }
            else if (order[i].status == 'Cancelled') {
              this.$store.commit('removeFromActiveOrders',order[i].id);
              let msg = order[i].side + ' order for the market ' + order[i].market.name + ' of size = ' + order[i].size + ' with orderID - ' + order[i].id;
              this.$showSuccessMsg({message: msg +  ' has been successfully cancelled',});                
            }           
            else if (order[i].status == 'Active') {  //Only active Orders
              this.addNewOrder(order[i]);
            }
          }
        },
      },
    },
  },


  // computed: {
  //   activeOrders() {
  //     return this.mapActiveOrders(this.$store.getters.activeOrders);
  //   },
  // },

  mounted() {     //handles Login/Logout
    this.userLoginListener = () => this.getActiveOrders();
    this.userLogoutListener = () => (this.deleteOrders());
    EventBus.$on(EventNames.userLogin, this.userLoginListener);
    EventBus.$on(EventNames.userLogout, this.userLogoutListener);
    EventBus.$on(EventNames.pubKeyChanged,this.userLoginListener);  //to handle change in pubKey
  },

  methods: {

    addNewOrder(order) {  //Adding new order incoming from subscription
      let new_order = this.mapNewOrder(order);
      // console.log(new_order);
      // this.orders.unshift(new_order);
      this.$store.commit('addToActiveOrders',new_order);
      // console.log(this.$store.getters.activeOrders);
    },

    async getActiveOrders() {     //will call vegaProtocolService 
      this.$store.commit('activeOrders',[]);
      this.orders = [];
      this.partiesId = VegaKeys.currentActiveKey;
      // console.log(this.partiesId);
      // console.log(VegaKeys.currentActiveKey);
      const response = await VegaProtocolService.get_orders_by_party(this.partiesId);
      // console.log(response);
      if (response.status == 200) {
        // console.log(response.data);
        for (let i=0; i<response.data.orders.length;i++) {
          let new_ = this.mapNewOrder_API(response.data.orders[i]);
          // console.log(new_);
          // this.orders.unshift(new_);
          this.$store.commit('addToActiveOrders',new_);
          // console.log(this.$store.getters.activeOrders);
        }
          // console.log(this.orders);
          this.orders = this.$store.getters.activeOrders;
          // console.log(this.orders);          
      }
      else {
        this.$showErrorMsg({message: 'Something went wrong. Couldn\'t fetch orders',});        
      }
    },

    deleteOrders() {  //cleaning order history 
      this.$store.commit('activeOrders',[]);
      this.orders = [];
    },

    mapNewOrder_API(order) {
      let new_order = {};
      new_order.id = order.id;
      new_order.price = order.price;
      new_order.side = order.side;
      new_order.size = order.size;
      new_order.remaining = order.remaining;
      new_order.marketID = order.marketID;
      new_order.market = this.getNameforMarketID(order.marketID);
      new_order.status = order.status;
      new_order.orderExecType = order.timeInForce;
      new_order.creationTime = order.createdAt;
      // console.log(new_order);
      return new_order;
    },    

    getNameforMarketID(marketID) {          //Gets market name for market ID
      let markets = this.$store.getters.mappedMarkets;
      // console.log(markets);
      if (this.$store.getters.mappedMarkets.has(marketID)) {
        // console.log(marketID + ' name found');
        let data = this.$store.getters.mappedMarkets.get(marketID);
        // console.log(data);
        return data.name;
      }
      else {
        return 'undefined';
      }
    },

    mapNewOrder(order) {
      let new_order = {};
      new_order.id = order.id;
      new_order.price = order.price;
      new_order.side = order.side;
      new_order.size = order.size;
      new_order.remaining = order.remaining;
      new_order.market = order.market.name;
      new_order.marketID = order.market.id;
      new_order.status = order.status;
      new_order.orderExecType = order.timeInForce;
      new_order.creationTime = order.createdAt;
      return new_order;
    },

    toggleOpen() {
      this.$emit('toggle-open');
    },

    formatDateTime(timestamp) {
      return dateToDisplayDateTime(new Date(timestamp));
    },

    async cancelAllOrders() {
      for (let i=0;i<this.orders.length;i++) {
        let resp = await this.cancelOrder(this.orders[i]);
      }
      // console.log(this.orders);
      this.getActiveOrders();
    },

    async cancelOrder(order) {        
      // console.log(order);
      this.$store.commit('addLoaderTask', 1, false);
      // console.log('in cancel order');
      try {
        const data = await this.$apollo.mutate({
            mutation: gql`mutation prepareOrderCancel($id: ID!, $partyId: String!, $marketId: String!) {
            prepareOrderCancel(id:$id, partyId:$partyId,marketId:$marketId) {
              blob
            }
          }`,
          variables: { id:order.id, partyId:this.partiesId, marketId: order.marketID },
        });
      
        // console.log(data);
        // console.log(data.data);
        // console.log(data.data.prepareOrderCancel.blob);
        // console.log('Cancel Order preparation successful for order with orderID ' + order.id );
        let blob = data.data.prepareOrderCancel.blob;

        try{                      //SIGNING PREPARED ORDER
            // console.log(blob);
            const transactionSign = await VegaProtocolService.signtx(blob,true);  //Propogating the transaction
            // console.log(transactionSign);
            if (transactionSign.status == 200) {    //IF SUCCESSFUL
              let msg = 'Order Cancellation request for orderID: ' + order.id + ' has been successfully signed and propogated into the chain.';
              // console.log(msg);    
              this.$showSuccessMsg({message: msg,});                
            }
            else {      //Else for signing order
              let msg = 'Deletion request\'s signature transaction failed. Please try again';
              // console.log(msg);
              this.$$showErrorMsg({message: msg});                
           }
        }
        catch (err) {  //catch for signing order
          let msg = ' Order signature for deletion request returned error. Please try again';
          // console.log(msg);
          this.$$showErrorMsg({message: msg});                
        }
      }
      catch(error) {
        // console.log(error);
        let msg = ' Order deletion request preparation returned error. Please try again';
        // console.log(msg);
        this.$$showErrorMsg({message: msg});                        
      } 
    }
  },

  destroyed() {
    EventBus.$off(EventNames.userLogin, this.userLoginListener);
    EventBus.$off(EventNames.userLogout, this.userLogoutListener);
    EventBus.$off(EventNames.pubKeyChanged,this.userLoginListener);  //to handle change in pubKey    
  },

};
</script>

<style lang="scss" src="./style.scss" scoped></style>


