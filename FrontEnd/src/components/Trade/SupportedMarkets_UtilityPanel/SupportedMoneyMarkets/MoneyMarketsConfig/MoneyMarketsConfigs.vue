<template src="./template.html"></template>

<script>
// import EventBus, { EventNames,} from '@/eventBuses/default';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
// import {mapState,mapActions,} from 'vuex';
import gql from 'graphql-tag';

export default {
  name: 'Money-Markets-Configs',


  components: {
    Spinner,
  },


  data() {
    return {
      instruments: [],      
      showLoader:false,
    };
  },

  apollo: {
    $subscribe: {
      instruments: {
        query: gql`subscription {
                    instruments {
                      instrumentAddress
                      iTokenAddress
                      underlyingInstrumentName
                      underlyingInstrumentSymbol
                      name
                      symbol

                      decimals
                      priceETH
                      priceDecimals

                      isActive 
                      isFreezed
                      borrowingEnabled
                      usageAsCollateralEnabled
                      isStableBorrowRateEnabled
                      isSIGHMechanismActivated

                      baseLTVasCollateral
                      liquidationThreshold
                      liquidationBonus
                    }
                  }`,

        result({data,loading,}) {
          if (loading) {
            console.log('loading');
          }
          else {
          console.log("IN SUBSCRIPTIONS : INSTRUMENTS CONFIGURATION");
          console.log(data);
          let instruments_ = data.instruments;
          if (instruments_) {
            this.instruments = instruments_;
            this.addToSupportedInstruments(instruments_);
            setInterval(async () => {
              this.commitConfigurations(this.instruments);
            }, 5000);
          }
          }
        },
      },
    },
  },


  methods: {

    // INSTRUMENT  STATE
    addToSupportedInstruments(instruments) {
        // this.$store.commit( "resetSupportedInstrumentsArray" );  
      for (let i=0;i< instruments.length; i++) {
        let instrumentState = {};
        instrumentState.instrumentAddress = instruments[i].instrumentAddress;
        instrumentState.iTokenAddress = instruments[i].iTokenAddress;
        instrumentState.name = instruments[i].underlyingInstrumentName;
        instrumentState.symbol = instruments[i].underlyingInstrumentSymbol;
        instrumentState.decimals = instruments[i].decimals;
        instrumentState.priceETH = instruments[i].priceETH;
        instrumentState.priceDecimals = instruments[i].priceDecimals;
        instrumentState.iTokenName = instruments[i].name;
        instrumentState.iTokenSymbol = instruments[i].symbol;
        this.$store.commit( "addToSupportedInstrumentsArray",instrumentState );
        if (i==1) {
          this.$store.commit('updateSelectedInstrument',instrumentState); // THE FIRST INSTRUMENT IS BY DEFAULT THE SELECTED INSTRUMENT
        }
      }
    },

    // INSTRUMENT CONFIGURATION STATE
    commitConfigurations(instruments) {
      for (let i=0;i< instruments.length; i++) {
        let instrumentState = {};
        instrumentState.instrumentAddress = instruments[i].instrumentAddress;
        instrumentState.iTokenAddress = instruments[i].iTokenAddress;
        instrumentState.name = instruments[i].underlyingInstrumentName;
        instrumentState.symbol = instruments[i].underlyingInstrumentSymbol;
        instrumentState.decimals = instruments[i].decimals;
        instrumentState.priceETH = instruments[i].priceETH;
        instrumentState.priceDecimals = instruments[i].priceDecimals;
        instrumentState.iTokenName = instruments[i].name;
        instrumentState.iTokenSymbol = instruments[i].symbol;
        this.$store.commit("addToSupportedInstrumentConfigs",{instrumentAddress: instrumentState.instrumentAddress, instrumentConfig: instrumentState });
      }
    }
  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
