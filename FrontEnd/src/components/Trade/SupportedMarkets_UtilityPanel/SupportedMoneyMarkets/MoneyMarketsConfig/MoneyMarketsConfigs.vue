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
      instrumentConfigStates: [],
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

                      availableLiquidity
                      availableLiquidityUSD

                      baseLTVasCollateral
                      liquidationThreshold
                      liquidationBonus

                      stableBorrowInterestPercent
                      variableBorrowInterestPercent
                      supplyInterestRatePercent

                      average24SnapsSuppliersHarvestAPY
                      average24SnapsBorrowersHarvestAPY

                      averageMonthlySnapsSuppliersHarvestAPY
                      averageMonthlySnapsBorrowersHarvestAPY

                      isSIGHMechanismActivated
                      present_SIGH_Side

                      present_total24HrVolatilityUSD
                      present_total24HrSentimentVolatilityUSD
                      present_harvestValuePerDayUSD

                      present_harvestSpeedPerBlock
                      present_harvestValuePerBlockUSD
                      present_harvestAPY
                    }
                  }`,

        result({data,loading,}) {
          if (loading) {
            console.log('loading');
          }
          else {
          // console.log("IN SUBSCRIPTIONS : INSTRUMENTS CONFIGURATION");
          // console.log(data);
          let instruments_ = data.instruments;
          if (instruments_) {
            this.instruments = instruments_;
            if (this.$store.state.supportedInstruments.length == 0 ) {
              this.addToSupportedInstruments(instruments_);
            }
            this.commitConfigurations(this.instruments);
            }
          }
        },
      },
    },
  },


  created() {
    if (this.$store.state.supportedInstruments.length == 0 ) {
      this.addToSupportedInstruments(this.instruments);
        this.commitConfigurations(this.instruments);
    }
    if (!this.loopInitialized) {
      this.loopInitialized = true;            
      setInterval(async () => {
        this.commitConfigurations(this.instruments);
      }, 5000);
    }
  },


  methods: {
    
    async refresh() {
      if (!this.$store.state.web3) {
        this.$showErrorMsg({title:"Not Connected to Web3", message: " You need to first connect to WEB3 (BSC Network) to interact with SIGH Finance!", timeout: 4000 });  
        this.$showInfoMsg({message: "Please install METAMASK Wallet to interact with SIGH Finance!", timeout: 4000 }); 
        return;
      }
      else if (!this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({title:"Network not Supported", message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName, timeout: 4000 }); 
        this.$showInfoMsg({message: " Networks currently supported - Binance Smart Chain testnet (97) ", timeout: 4000 }); 
        return;
      }
      let instrumentAddresses = this.$store.state.supportedInstrumentAddresses;
      console.log(instrumentAddresses);
      if (instrumentAddresses && instrumentAddresses.length>0) {
        this.instrumentConfigStates = [];
        for (let i=0; i< instrumentAddresses.length; i++) { 
          let currentInstrument = instrumentAddresses[i];
          let currentInstrumentConfigState = this.$store.state.supportedInstrumentConfigs.get(currentInstrument);
          this.instrumentConfigStates.push(currentInstrumentConfigState);
          console.log(currentInstrumentConfigState);          
        }
          console.log(this.instrumentConfigStates);          
      }
    },

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
        instrumentState.stableBorrowInterestPercent = instruments[i].stableBorrowInterestPercent;
        instrumentState.variableBorrowInterestPercent = instruments[i].variableBorrowInterestPercent;
        instrumentState.supplyInterestRatePercent = instruments[i].supplyInterestRatePercent;
        instrumentState.stableBorrowRateEnabled = instruments[i].isStableBorrowRateEnabled;
        instrumentState.borrowingEnabled = instruments[i].borrowingEnabled;
        instrumentState.usageAsCollateralEnabled = instruments[i].usageAsCollateralEnabled;
        instrumentState.isSIGHMechanismActivated = instruments[i].isSIGHMechanismActivated;

        instrumentState.average24SnapsSuppliersHarvestAPY = instruments[i].average24SnapsSuppliersHarvestAPY;
        instrumentState.average24SnapsBorrowersHarvestAPY = instruments[i].average24SnapsBorrowersHarvestAPY;

        instrumentState.averageMonthlySnapsSuppliersHarvestAPY = instruments[i].averageMonthlySnapsSuppliersHarvestAPY;
        instrumentState.averageMonthlySnapsBorrowersHarvestAPY = instruments[i].averageMonthlySnapsBorrowersHarvestAPY;

        instrumentState.isSIGHMechanismActivated = instruments[i].isSIGHMechanismActivated;
        instrumentState.present_SIGH_Side = instruments[i].present_SIGH_Side;

        instrumentState.present_total24HrVolatilityUSD = instruments[i].present_total24HrVolatilityUSD;
        instrumentState.present_total24HrSentimentVolatilityUSD = instruments[i].present_total24HrSentimentVolatilityUSD;
        instrumentState.present_harvestValuePerDayUSD = instruments[i].present_harvestValuePerDayUSD;

        instrumentState.present_harvestSpeedPerBlock = instruments[i].present_harvestSpeedPerBlock;
        instrumentState.present_harvestValuePerBlockUSD = instruments[i].present_harvestValuePerBlockUSD;
        instrumentState.present_harvestAPY = instruments[i].present_harvestAPY;
                      
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
        instrumentState.symbol = instruments[i].underlyingInstrumentSymbol;
        instrumentState.stableBorrowRateEnabled = instruments[i].isStableBorrowRateEnabled;
        instrumentState.borrowingEnabled = instruments[i].borrowingEnabled;
        instrumentState.isActive = instruments[i].isActive;
        instrumentState.isFreezed = instruments[i].isFreezed;
        instrumentState.usageAsCollateralEnabled = instruments[i].usageAsCollateralEnabled;
        instrumentState.isSIGHMechanismActivated = instruments[i].isSIGHMechanismActivated;
        instrumentState.availableLiquidity = instruments[i].availableLiquidity;
        instrumentState.availableLiquidityUSD = instruments[i].availableLiquidityUSD;
        this.$store.commit("addToSupportedInstrumentConfigs",{instrumentAddress: instrumentState.instrumentAddress, instrumentConfig: instrumentState });
      }
    }
  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
