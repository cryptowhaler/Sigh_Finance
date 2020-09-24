<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
import gql from 'graphql-tag';

export default {
  name: 'live-trades',

  components: {
    Spinner,
  },

  props: {
    parentHeight: Number,   //communicated to parent
  },

  data() {
    return {
      trades: {},
      tableHeight: '',
      showLoader:true,
      markets: [],

      
    };
  },

  apollo: {
    $subscribe: {
      markets: {
        query: gql`subscription  {
          markets {
              id
              symbol
              name
              exchangeRate
              underlyingAddress
              underlyingName
              underlyingPrice
              underlyingSymbol
              underlyingPriceUSD
              underlyingDecimals
              totalSupply
              totalBorrows
              reserves
              borrowRate
              supplyRate
              collateralFactor
              numberOfBorrowers
              numberOfSuppliers
              interestRateModelAddress
              accrualBlockNumber
              blockTimestamp
              borrowIndex
              reserveFactor
              gsighSpeed
              totalGsighDistributedToSuppliers
              totalGsighDistributedToBorrowers
              pendingAdmin
              admin
              sightroller
            }                
          }`,

        // variables() {  return {marketId: this.marketId,};  },

        result({data,loading,}) {

          if (loading) {
            console.log('loading');
          }
          else {
            console.log(data);
            let _markets = data.markets;
            console.log(_markets);
            this.markets = [];
            for (let i= (_markets.length-1) ; i>=0;i--) {
              console.log(_markets[i]);
              this.handleEachMarket(_markets[i]);
            }
            this.showLoader = false;
          }
        },
      },
    },
  },

  watch: {
    parentHeight: function(newVal) {
      let calcHeight = newVal;
      this.tableHeight = 'calc(100vh - ' + (calcHeight  + 100) + 'px';
    },
  },

  created() {

    this.handleEachMarket = liveMarket => {
      console.log(liveMarket);
      let obj = [];
      obj.symbol = liveMarket.symbol;
      obj.underlyingSymbol = liveMarket.underlyingSymbol;
      obj.totalSupply = liveMarket.totalSupply;
      obj.totalBorrows = liveMarket.totalBorrows;
      obj.supplyRate = liveMarket.supplyRate;
      obj.borrowRate = liveMarket.borrowRate;
      obj.gsighSpeed = liveMarket.gsighSpeed;
      obj.exchangeRate = liveMarket.exchangeRate;
      obj.underlyingPrice = liveMarket.underlyingPrice;
      obj.underlyingPriceUSD = liveMarket.underlyingPriceUSD;
      obj.numberOfBorrowers = liveMarket.numberOfBorrowers;
      obj.numberOfSuppliers = liveMarket.numberOfSuppliers;
      obj.totalGsighDistributedToSuppliers = liveMarket.totalGsighDistributedToSuppliers;
      obj.totalGsighDistributedToBorrowers = liveMarket.totalGsighDistributedToBorrowers;
      obj.sighSpeed = liveMarket.gsighSpeed;
      if (liveMarket.underlyingPrice == '0') {
        obj.underlyingPrice = liveMarket.underlyingPriceUSD;
      }
      this.markets.push(obj);
      console.log(this.markets);
      // this.$store.commit('liveMarketPrice', Math.abs((price/100000).toFixed(5)));
    };

  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
