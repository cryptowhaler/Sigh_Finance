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
                      underlyingInstrumentSymbol
                      isSIGHMechanismActivated
                      present_SIGH_Side

                      present_DeltaBlocks
                      fromBlockNumber
                      toBlockNumber

                      present_maxVolatilityLimitSuppliersPercent 
                      present_maxVolatilityLimitBorrowersPercent

                      present_PrevPrice_USD
                      present_OpeningPrice_USD

                      present_total24HrVolatilityUSD
                      present_percentTotalVolatility

                      present_24HrVolatilityLimitAmountUSD
                      present_percentTotalVolatilityLimitAmount

                      present_SIGH_Suppliers_Speed
                      present_SIGH_Borrowers_Speed
                      present_SIGH_Staking_Speed
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
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
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
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
        this.showLoader = false;
      }
    },

    calculateSIGHPriceInUSD() {
       this.sighPriceInUSD = (Number(this.$store.state.sighPriceETH) / Math.pow(10,this.$store.state.sighPriceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)); 
    },    

  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
