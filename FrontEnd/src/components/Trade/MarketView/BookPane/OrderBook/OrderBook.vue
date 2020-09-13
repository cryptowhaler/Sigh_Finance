<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import SimpleBar from 'simplebar';
import Spinner from '@/components/Spinner/Spinner.vue';
import gql from 'graphql-tag';

export default {
  name: 'order-book',
  components: {
    Spinner,
  },
  props: {
    parentHeight: Number,
  },

  data() {
    return {
      marketId: 'RTJVFCMFZZQQLLYVSXTWEN62P6AH6OCN', //this.$store.state.selectedVegaMarketId,
      bids: [],
      asks: [],
      price: this.$store.state.liveTradePrice,
      tableHeight: '',
      orderHeight: '',
      timeout: '',
      orderbookdata: {},
      showLoader: true,
      snapF: 0,
      sum: 0,
      // precisionNumber: 1,
      count: 1,
      barAsk: 0,
      barBid: 0,
      order_updates: '',
      buyPrice: 0,
      sellPrice:0,
    };
  },

  apollo: {
    $subscribe: {
      orders: {
        query: gql`subscription name($marketId: String!) {
                  orders (marketId: $marketId) {
                      price
                      side
                      size
                      market {
                        name
                      }
                      createdAt
                  }
                } `,
        variables() { return {marketId: this.marketId,}; },
        result(data) {
          // // console.log(data);
          let orders = data.data.orders;
          let asks = [];
          let bids = [];

          if (Array.isArray(orders) && this.snapF!=1) {     //When new connection, we take the snapshot
            // // console.log('when snapshot');
            this.snapF = 1;
            // // console.log(orders[0]);
            orders.forEach((item) => {
              if (item.side == 'Buy') {
                let localData = {};
                localData.value = (Number(item.price)/100000).toFixed(5);
                localData.volume = Number(Math.abs(item.size));
                localData.createdAt = item.createdAt;
                bids.push(localData);
              } 
              else {
                let localData = {};
                localData.value = (Number(item.price)/100000).toFixed(5);
                localData.volume = Number(Math.abs(item.size));
                localData.createdAt = item.createdAt;
                asks.push(localData);
              }
            });
            asks.sort(function (a, b) {return a.value - b.value;});
            bids.sort(function (a, b) {return a.value - b.value;});
            this.orderbookdata.asks = asks;
            this.orderbookdata.bids = bids;
            this.buyPrice = Number(bids[0].value);
            this.sellPrice = Number(asks[0].value);
            this.snapshotListener(this.orderbookdata);
          } 
          else {                                  // To update
            // // console.log('else fiels');
            if (this.orderbookdata.asks && this.orderbookdata.bids) {
              // // console.log('For Update');

              for (let i=0;i<orders.length;i++) {
                // // console.log(orders[i]);
                if (orders[i].side == 'Buy') {      //for bid
                  // let flag = 0;
                  // this.orderbookdata.bids.forEach(function (elem, index) {
                  // if (elem.value == Number(orders.price)) {
                  //   if (Number(orders.size) == 0 && orders.side == 'Buy') {
                  //     this.orderbookdata.bids.splice(index, 1);
                  //   } 
                  //   else {
                  //     this.orderbookdata.bids[index].volume = Number(orders.size);
                  //   }
                  //   flag = 1;
                  // }
                  // if (index == (this.orderbookdata.bids.length - 1) && (flag == 0)) {  //No volume adjustment needed
                  let localData = {};
                  localData.value = (Number(orders[i].price)/100000).toFixed(5);
                  localData.volume = Number(orders[i].size);
                  localData.createdAt = orders[i].createdAt;
                  this.buyPrice = Number(localData.value);      //Buy Price
                  this.orderbookdata.bids.push(localData);
                  this.orderbookdata.bids.sort(function (a, b) { return a.value - b.value; });
                  // // // console.log('bids working');
                  // // // console.log(this.orderbookdata);
                  if (this.orderbookdata.bids.length > 50) {
                    this.orderbookdata.bids.pop();                
                  }
                }
                // );
                // } 
                else {      //for Ask
                  // let flag = 0;
                  // this.orderbookdata.asks.forEach(function (elem, index) {
                  // if (elem.value == Number(orders.price)) {
                  //   if (Number(orders.size) == 0 && orders.side == 'Sell') {
                  //     this.orderbookdata.asks.splice(index, 1);
                  //   } 
                  //   else {
                  //     this.orderbookdata.asks[index].volume = Number(orders.size);
                  //   }
                  //   flag = 1;
                  // }
                  // if (index == (this.orderbookdata.bids.length - 1) && (flag == 0)) {  //No volume adjustment needed
                  let localData = {};
                  localData.value = (Number(orders[i].price)/100000).toFixed(5);
                  localData.volume = Number(orders[i].size);
                  this.sellPrice = Number(localData.value);      //Sell Price                  
                  localData.createdAt = orders[i].createdAt;
                  this.orderbookdata.asks.push(localData);
                  this.orderbookdata.asks.sort(function (a, b) { return a.value - b.value; });
                  if (this.orderbookdata.asks.length > 50) {
                    this.orderbookdata.asks.shift();                
                  }                      
                }
                // );
              }
            }

            if (this.orderbookdata.asks.length > 9 && this.orderbookdata.bids.length > 9) {
              // // console.log('callling update');
              this.bookUpdateListener(this.orderbookdata);
            } 
          }
        }, 
      },
    },
  },
  // },

  computed: {
    maxVol() {    //Used "width: (((Number(ask.totalVolume)/Number(maxVol))*308)) + '%'," to determine width of dynamic bars
      return Math.max(this.asks[this.asks.length - 1].totalVolume, this.bids[0].totalVolume);
    },
  },

  methods: {
    // precision(key) {
    //   ExchangeDataEventBus.$emit('precision', {key,number: this.precisionNumber,});

    //   if (key === 'minus' && this.precisionNumber !== 0) {
    //     this.precisionNumber = this.precisionNumber - 1;
    //     this.count = parseFloat(new Decimal(this.count).dividedBy('10').toString());
    //   } 
    //   else if (key === 'plus' && this.precisionNumber !== 3) {
    //     this.precisionNumber = this.precisionNumber + 1;
    //     this.count = parseFloat(new Decimal(this.count).times(10).toString());
    //   }
    //   ExchangeDataEventBus.$emit('change-precision', {
    //     precisionPass: this.count,
    //     precisionNumber: this.precisionNumber,
    //   });
    //   this.timeout = setTimeout(() => this.scrollTopBookToBottom(), 2000);
    // },
    scrollTopBookToBottom() {
      try {
        let el = document.getElementById('ob-hello1');
        let obj = new SimpleBar(el, {autoHide: false,});
        obj.getScrollElement().scrollTop = 9999999;
      } catch (e) {throw e;}
    },
    asksUpdater(parsedSnap) {
      if (parsedSnap && parsedSnap.asks && parsedSnap.asks.length) {
        let asks = [parsedSnap.asks.length,];
        for (let i = 0; i < parsedSnap.asks.length; i++) {
          // if (i === 0) {
          //   parsedSnap.asks[i].totalVolume = parsedSnap.asks[i].volume;
          // } 
          // else {
          //   parsedSnap.asks[i].totalVolume = parsedSnap.asks[i].volume + parsedSnap.asks[i - 1].totalVolume;
          // }
          asks[parsedSnap.asks.length - (i + 1)] = parsedSnap.asks[i];
        }
        return asks.reverse();
      } 
      else {
        this.barAsk = 0;
        return [];
      }
    },
    bidsUpdater(parsedSnap) {
      if (parsedSnap && parsedSnap.bids && parsedSnap.bids.length) {
        let bids = [];
        for (let i = parsedSnap.bids.length - 1; i >= 0; i--) {
          // if (i === parsedSnap.bids.length - 1) {
          //   parsedSnap.bids[i].totalVolume = parsedSnap.bids[i].volume;
          // } else {
          //   parsedSnap.bids[i].totalVolume = parsedSnap.bids[i].volume + parsedSnap.bids[i + 1].totalVolume;
          // }
          bids.push(parsedSnap.bids[i]);
        }
        return bids.reverse();
      } 
      else {
        this.barBid = 0;
        return [];
      }
    },
  },

  watch: {
    parentHeight: function(newVal) {
      let height = newVal / 2;
      let orderHeight = newVal / 2;
      let calcHeight = height - 40;
      this.tableHeight = calcHeight + 'px';
      this.orderHeight = orderHeight + 'px';
    },
  },

  created() {
    this.count = 1;

    this.snapshotListener = snap => {
      // // console.log('Snapshot');
      // // console.log(snap);
      this.showLoader = false;
      let parsedSnap = JSON.parse(JSON.stringify(snap));
      this.asks = this.asksUpdater(parsedSnap);
      this.bids = this.bidsUpdater(parsedSnap);
      this.barAsk = this.asks[this.asks.length - 1].volume;
      this.barBid = this.bids[this.bids.length - 1].volume;
      this.timeout = setTimeout(() => this.scrollTopBookToBottom(), 2000);
      this.$store.commit('removeLoaderTask', 1);
    };

    this.bookUpdateListener = snap => {
      // // console.log('Update');
      // // console.log(snap);
      let parsedSnap = JSON.parse(JSON.stringify(snap));
      // // // console.log('Parsed snap - ');
      // // // console.log(parsedSnap);
      this.asks = this.asksUpdater(parsedSnap);
      this.bids = this.bidsUpdater(parsedSnap);
      this.barAsk = this.asks[0].volume;
      this.barBid = this.bids[this.bids.length - 1].volume;
      this.showLoader = false;
      // this.snapshotListener(snap);
    };

    this.reset = (newMarket) => {
      this.showLoader = true;
      this.count = 1;
      this.asks = [];
      this.bids = [];
      this.orderbookdata = {};
      this.snapF = 0;
      this.marketId = newMarket.Id;
      // console.log('New Selected Market being fetched in ORDER-BOOK with Id - ' + this.marketId);
      // this.precisionNumber = 1;
    };

    ExchangeDataEventBus.$on('change-vega-market', this.reset);
  },

  mounted() {
    this.$root.$on('tickerClicked', () => {
      this.scrollTopBookToBottom();
    });
  },
  
  destroyed() {
    ExchangeDataEventBus.$on('change-vega-market', this.reset);
    clearInterval(this.timeout);
  },
};
</script>

<style src="./style.scss" lang="scss" scoped></style>
