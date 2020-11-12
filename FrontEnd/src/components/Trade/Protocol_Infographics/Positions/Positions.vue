<template src="./template.html"></template>

<script>
import EventBus, { EventNames, } from '@/eventBuses/default';
import Spinner from '@/components/Spinner/Spinner.vue';
import gql from 'graphql-tag';
import Multiselect from 'vue-multiselect';

export default {
  name: 'positions',

  components: {
    Spinner,
    Multiselect,
  },

  props: {
    parentHeight: Number,
    open: {
      type: Boolean,
    },
  },

  data() {
    return {
      MarketPositions: [],
      id: this.$store.getters.web3Account,
    };
  },

  computed: {
    walletID() {
      return this.setWalletID(this.$store.getters.web3Account);
    },
  },




  // apollo: {
  //   $subscribe: {
  //     accounts: {
  //       query: gql`subscription name($id: String!) {
  //                   account (id: $id) {
  //                     id
  //                     tokens {
  //                       market {
  //                         name
  //                       }
  //                       symbol
  //                       transactionHashes
  //                       transactionTimes
  //                       enteredMarket
  //                       cTokenBalance
  //                       totalUnderlyingSupplied
  //                       totalUnderlyingBorrowed
  //                       totalUnderlyingRedeemed
  //                       totalUnderlyingRepaid
  //                       accountBorrowIndex
  //                       storedBorrowBalance
  //                     }
  //                     countLiquidated
  //                     countLiquidator
  //                     hasBorrowed
  //                   }
  //                 }`,

  //       variables() {  return {id: this.id.toLowerCase(),};  },

  //       result({data,loading,}) {
  //         if (loading) {
  //           console.log('loading');
  //         }
  //         else {
  //         console.log(data);
  //         this.id  = this.$store.getters.web3Account;
  //         console.log(this.id);
  //         console.log(this.$store.getters.web3Account);
  //         let accountData = data.account;
  //         if (accountData) {
  //           this.subcribeToMarketPositions(accountData);
  //         }
  //         }
  //       },
  //     },
  //   },
  // },

  mounted() {
    this.userwalletConnected = () => this.setWallet();
    this.userWalletDisconnectedListener = () => (this.positions = []);
    EventBus.$on(EventNames.userWalletConnected, this.userwalletConnected);  //GET POSITIONS
    EventBus.$on(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener); //GO EMPTY AGAIN
    // EventBus.$on(EventNames.pubKeyChanged,this.userwalletConnected);  //to handle change in pubKey    
  },

  methods: {

    setWallet() {
    },

    subcribeToMarketPositions(accountData) {     

      // this.MarketPositions = [];

      // let countLiquidated = accountData.countLiquidated;
      // let countLiquidator = accountData.countLiquidator;
      // let hasBorrowed = accountData.hasBorrowed;
      // this.$store.commit('countLiquidated',countLiquidated);
      // this.$store.commit('countLiquidator',countLiquidator);
      // this.$store.commit('hasBorrowed',hasBorrowed);

      // let marketsData = accountData.tokens;
      // console.log(marketsData);

      // for (let i = 0 ; i < marketsData.length ; i++) {
      //   let obj = [];
      //   obj.marketName = marketsData[i].market.name;
      //   obj.symbol = marketsData[i].symbol;
      //   obj.enteredMarket = marketsData[i].enteredMarket;
      //   obj.cTokenBalance = Number(Number(marketsData[i].cTokenBalance)/10000000000).toFixed(3) ;
      //   obj.totalUnderlyingSupplied = Number(marketsData[i].totalUnderlyingSupplied).toFixed(3)  ;
      //   obj.totalUnderlyingBorrowed = Number(marketsData[i].totalUnderlyingBorrowed).toFixed(3);
      //   obj.totalUnderlyingRedeemed = Number(marketsData[i].totalUnderlyingRedeemed).toFixed(3);
      //   obj.totalUnderlyingRepaid = Number(marketsData[i].totalUnderlyingRepaid).toFixed(3);
      //   obj.accountBorrowIndex = Number(marketsData[i].accountBorrowIndex).toFixed(3);
      //   obj.storedBorrowBalance = Number(marketsData[i].storedBorrowBalance).toFixed(3) ; 
      //   console.log(obj);
      //   this.MarketPositions.push(obj);
      // }   

    },

    toggleOpen() {
      this.$emit('toggle-open');
    },

    userWalletDisconnectedListener() {
    },

  },

  destroyed() {
    EventBus.$off(EventNames.userWalletConnected, this.userwalletConnected);
    EventBus.$off(EventNames.userWalletDisconnected, this.userWalletDisconnectedListener);
    EventBus.$on(EventNames.pubKeyChanged,this.userwalletConnected);  //to handle change in pubKey        
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>


