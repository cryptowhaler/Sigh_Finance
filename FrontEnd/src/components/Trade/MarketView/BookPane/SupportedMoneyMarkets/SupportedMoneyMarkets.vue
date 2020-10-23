<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
import gql from 'graphql-tag';
import {mapState,mapActions,} from 'vuex';

export default {
  name: 'Supported-Money-Markets',

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
      marketAddress: '',

      
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
              sighSpeed
              savePriceSnapshot
              sighAccuredInCurrentCycle              
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
            this.handleMarkets(_markets);
            this.showLoader = false;
          }
        },
      },
    },
    marlin: {
      query: gql`query name($id: String!) {
              market ($id: String!) {
                  id
                  exchangeRate
                  underlyingPrice
                  totalSupply
                  totalBorrows
                  gsighSpeed
                  sighSpeed
              }
          }`,                

        client: marlinClient ,
        
        variables() {  return {id: this.marketAddress ,};  },
        
        result({data,loading,}) {
            if (loading) {
              console.log('loading');
            }
            console.log(data);
            let market_ = [];
            market_.push(data.market);
            console.log(market_);
            this.handleMarkets(market_);
          },

    }



  },

  watch: {
    parentHeight: function(newVal) {
      let calcHeight = newVal;
      this.tableHeight = 'calc(100vh - ' + (calcHeight  + 100) + 'px';
    },
  },

  created() {

    this.handleMarkets = _markets => {

      for (let i = (_markets.length-1) ; i>=0; i--) {

        let liveMarket = _markets[i];
        console.log(liveMarket);

        if ( this.marketIsSupported(liveMarket.id) ) {
          let obj = [];
          obj.id =  liveMarket.id;
          obj.symbol = liveMarket.symbol;
          obj.underlyingSymbol = liveMarket.underlyingSymbol;
          obj.totalSupply = Number(Number(liveMarket.totalSupply)/10000000000).toFixed(3) ;
          obj.totalBorrows = Number(Number(liveMarket.totalBorrows)).toFixed(3) ;
          obj.supplyRate = liveMarket.supplyRate;
          obj.borrowRate = liveMarket.borrowRate;
          obj.gsighSpeed = liveMarket.gsighSpeed;
          console.log()        
          obj.exchangeRate = Number(liveMarket.exchangeRate*10000000000).toFixed(3);
          obj.underlyingPrice = Number(Number(liveMarket.underlyingPrice)*100000000000).toFixed(3) ;
          obj.underlyingPriceUSD = Number(Number(liveMarket.underlyingPrice)*100000000000).toFixed(3) ;
          obj.numberOfBorrowers = liveMarket.numberOfBorrowers;
          obj.numberOfSuppliers = liveMarket.numberOfSuppliers;
          obj.totalGsighDistributedToSuppliers = liveMarket.totalGsighDistributedToSuppliers;
          obj.totalGsighDistributedToBorrowers = liveMarket.totalGsighDistributedToBorrowers;
          obj.underlyingAddress = liveMarket.underlyingAddress;        
          obj.sighSpeed = liveMarket.sighSpeed;

          obj.savePriceSnapshot = liveMarket.savePriceSnapshot;
          obj.sighAccuredInCurrentCycle = liveMarket.savePriceSnapshot;    

          // obj.lossesRecovered =       (market.sighAccuredInCurrentCycle) * sighPrice  / market.totalSupply * ( Number(market.savePriceSnapshot) - Number(market.underlyingPrice) )
      
          if (liveMarket.underlyingPrice == '0') {
            obj.underlyingPrice = liveMarket.underlyingPriceUSD;
          }
          
          this.markets.push(obj);
          console.log(this.markets);
        }
      }

      this.$store.commit('LiveMarkets', this.markets);
    };
  },

  methods: {

    ...mapActions(['marketIsSupported']),

  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
