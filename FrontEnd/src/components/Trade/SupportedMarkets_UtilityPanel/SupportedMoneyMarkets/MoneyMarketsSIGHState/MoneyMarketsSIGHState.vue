<template src="./template.html"></template>

<script>
// import EventBus, { EventNames,} from '@/eventBuses/default';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
import {mapState,mapActions,} from 'vuex';
import gql from 'graphql-tag';
import Web3 from 'web3';

export default {
  name: 'Money-Markets-SIGH-State',


  components: {
    Spinner,
  },


  data() {
    return {
      instruments: [], 
      deltaBlocks:0,     
      showLoader:false,
      sighPriceInUSD: 0,
    };
  },

  apollo: {
    $subscribe: {
      instruments: {
        query: gql`subscription {
                    instruments {
                      name
                      isSIGHMechanismActivated
                      present_SIGH_Side

                      present_DeltaBlocks

                      present_PrevPrice_USD
                      present_OpeningPrice_USD

                      present_total24HrVolatilityUSD
                      present_percentTotalVolatility

                      present_total24HrSentimentVolatilityUSD
                      
                      present_harvestSpeedPerBlock
                      present_harvestSpeedPerDay
                      present_harvestSpeedPerYear
                      
                      present_harvestValuePerBlockUSD
                      present_harvestValuePerDayUSD
                      present_harvestValuePerYearUSD
                      
                      present_harvestAPY
                      present_suppliersHarvestAPY
                      present_borrowersHarvestAPY

                      average24SnapsSuppliersHarvestAPY
                      average24SnapsBorrowersHarvestAPY

                      averageMonthlySnapsSuppliersHarvestAPY
                      averageMonthlySnapsBorrowersHarvestAPY
                    }
                  }`,


        result({data,loading,}) {
          if (loading) {
            console.log('loading');
          }
          else {
          console.log("IN SUBSCRIPTIONS : INSTRUMENTS SIGH STATE ");
          console.log(data);
          let instruments_ = data.instruments;
          if (instruments_) {
            this.instruments = instruments_;
            this.deltaBlocks =instruments_[0].present_DeltaBlocks;
            this.calculateSIGHPriceInUSD();
            }
          }
        },
      },
    },
  },


  async created() {
  },




  methods: {

    ...mapActions(['SIGHDistributionHandler_refreshSighSpeeds']),

      async refresh_SIGH_Speeds() {
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }       
      else {       // WHEN ABOVE CONDITIONS ARE MET SO THE TRANSACTION GOES THROUGH
        this.showLoader = true;
        let response =  await this.SIGHDistributionHandler_refreshSighSpeeds();
        if (response.status) {      
          this.$showSuccessMsg({message: "SIGH Speeds refreshed successfully for the supported Instruments" });
          this.speedRefreshed = true;
        }
        else {
          this.$showErrorMsg({message: "SIGH Speed Refresh FAILED : " + response.message  });
          this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 }); 
        }
        this.showLoader = false;
      }
    },


    // subscribeToInstrumentCurrent_SIGH_Harvests(instruments) {
    //   this.calculateSIGHPriceInUSD();
    //   let instrumentsArray = [];

    //   for (let i=0;i<instruments.length;i++) {
    //     let currentInstrument = {};
    //     currentInstrument.symbol = instruments[i].underlyingInstrumentSymbol;
    //     currentInstrument.isSIGHMechanismActivated = instruments[i].isSIGHMechanismActivated;
    //     currentInstrument.totalCompoundedLiquidity = instruments[i].totalCompoundedLiquidity;
    //     currentInstrument.totalCompoundedLiquidityUSD = instruments[i].totalCompoundedLiquidityUSD;
    //     currentInstrument.totalCompoundedBorrows = instruments[i].totalCompoundedBorrows;

    // },

    getBalanceString(number)  {
      if ( Number(number) >= 1000000000 ) {
        let inBil = (Number(number) / 1000000000).toFixed(2);
        return inBil.toString() + ' B';
      } 
      if ( Number(number) >= 1000000 ) {
        let inMil = (Number(number) / 1000000).toFixed(2);
        return inMil.toString() + ' M';
      } 
      if ( Number(number) >= 1000 ) {
        let inK = (Number(number) / 1000).toFixed(2);
        return inK.toString() + ' K';
      } 
      return Number(number).toFixed(2);
    }, 

    calculateSIGHPriceInUSD() {
       this.sighPriceInUSD = Number(this.$store.state.sighPriceUSD) > 0 ? Number(this.$store.state.sighPriceUSD) : 0 ;
      //  console.log( "CALCULATED $SIGH PRICE FOR HARVEST CALCULATION : " + this.sighPriceInUSD)
    },    

  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
