<template src="./template.html"></template>

<script>
// import EventBus, { EventNames,} from '@/eventBuses/default';
// import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import Spinner from '@/components/Spinner/Spinner.vue';
import {mapState,mapActions,} from 'vuex';
import gql from 'graphql-tag';

export default {
  name: 'Money-Markets-Global-States',


  components: {
    Spinner,
  },


  data() {
    return {
      instruments: [],      
      tableHeight: '',
      showLoader:false,
      displayInUSD: true,
      sighPriceInUSD: 0,

      SIGH_Pay_Rate: 0,               //  Interest Percent for SIGH Rewards
      SIGH_Pay_Amount_Day: 0,         // Instrument Tokens being paid per day as SIGH Rewards
      SIGH_Pay_Amount_Year: 0,       // Instrument Tokens being paid per year as SIGH Rewards

      SIGH_Pay_Amount_Day_USD: 0,         // Value of Instrument Tokens being paid per day as SIGH Rewards
      SIGH_Pay_Amount_Year_USD: 0,       // Value of Instrument Tokens being paid per year as SIGH Rewards

      SIGH_Harvests_Speed:0,                //  Total SIGH Tokens being distributed by the instrument per Block among participants
      SIGH_Harvests_Amount_Day: 0,          //  Total SIGH Tokens being distributed by the instrument per day among participants
      SIGH_Harvests_Amount_Year: 0,         //  Total SIGH Tokens being distributed by the instrument per year among participants

      SIGH_Harvests_Speed_USD:0,            //  Value of SIGH Tokens being distributed by the instrument per Block among participants
      SIGH_Harvests_Amount_Day_USD: 0,      //  Value of SIGH Tokens being distributed by the instrument per day among participants
      SIGH_Harvests_Amount_Year_USD: 0,     //  Value of SIGH Tokens being distributed by the instrument per year among participants

      
    };
  },


  apollo: {
    $subscribe: {
      instruments: {
        query: gql`subscription {
                    instruments {
                      name
                      symbol
                      underlyingInstrumentName
                      underlyingInstrumentSymbol
                      priceUSD

                      bearSentimentPercent
                      bullSentimentPercent
                      isSIGHMechanismActivated

                      totalCompoundedLiquidity
                      totalCompoundedLiquidityUSD
                      totalCompoundedBorrows
                      totalCompoundedBorrowsUSD

                      stableBorrowInterestPercent
                      variableBorrowInterestPercent
                      supplyInterestRatePercent
                      sighPayInterestRatePercent

                      average24SnapsSuppliersHarvestAPY
                      average24SnapsBorrowersHarvestAPY

                      averageMonthlySnapsSuppliersHarvestAPY
                      averageMonthlySnapsBorrowersHarvestAPY

                      present_SIGH_Side
                      present_DeltaBlocks
                      present_SIGH_Suppliers_Speed
                      present_SIGH_Borrowers_Speed
                      present_SIGH_Staking_Speed
                      isSIGHMechanismActivated
                    }
                  }`,

        result({data,loading,}) {
          if (loading) {
            console.log('loading');
          }
          else {
          console.log("IN SUBSCRIPTIONS : INSTRUMENTS GLOBAL STATES");
          console.log(data);
          let instruments_ = data.instruments;
          if (instruments_) {
            this.subscribeToInstruments(instruments_);
          }
          }
        },
      },
    },
  },

  // watch: {
  //   parentHeight: function(newVal) {
  //     let calcHeight = newVal;
  //     this.tableHeight = 'calc(100vh - ' + (calcHeight  + 100) + 'px';
  //   },
  // },


  methods: {

    toggle() {
      this.displayInUSD = !this.displayInUSD;
    },   
    
    subscribeToInstruments(instruments) {
      let sighPriceInUSD = this.calculateSIGHPriceInUSD();
      let instrumentsArray = [];

      for (let i=0;i<instruments.length;i++) {
        let currentInstrument = {};
        currentInstrument.symbol = instruments[i].underlyingInstrumentSymbol;    

        currentInstrument.bearSentimentPercent = instruments[i].bearSentimentPercent;
        currentInstrument.bullSentimentPercent = instruments[i].bullSentimentPercent;        
        currentInstrument.isSIGHMechanismActivated = instruments[i].isSIGHMechanismActivated;

        currentInstrument.totalCompoundedLiquidity = instruments[i].totalCompoundedLiquidity;
        currentInstrument.totalCompoundedLiquidityUSD = instruments[i].totalCompoundedLiquidityUSD;
        currentInstrument.totalCompoundedBorrows = instruments[i].totalCompoundedBorrows;
        currentInstrument.totalCompoundedBorrowsUSD = instruments[i].totalCompoundedBorrowsUSD;
        currentInstrument.stableBorrowInterestPercent = instruments[i].stableBorrowInterestPercent;
        currentInstrument.variableBorrowInterestPercent = instruments[i].variableBorrowInterestPercent;
        currentInstrument.supplyInterestRatePercent = instruments[i].supplyInterestRatePercent;
        currentInstrument.deltaBlocks = instruments[i].present_DeltaBlocks;
        currentInstrument.side = instruments[i].present_SIGH_Side;

        // Get AMOUNT & VALUE OF TOKENS BEING PAID AS $SIGH REWARDS AGAINST $SIGH STAKING
        // Get AMOUNT & VALUE OF TOKENS BEING PAID AS $SIGH REWARDS AGAINST $SIGH STAKING
        // Get AMOUNT & VALUE OF TOKENS BEING PAID AS $SIGH REWARDS AGAINST $SIGH STAKING                
        currentInstrument.SIGH_Pay_Rate =  instruments[i].sighPayInterestRatePercent;
        currentInstrument.SIGH_Pay_Amount_Year = currentInstrument.SIGH_Pay_Rate * Number(currentInstrument.totalCompoundedLiquidity) ;
        currentInstrument.SIGH_Pay_Amount_Day = Number(currentInstrument.SIGH_Pay_Amount_Year) / 365;
        currentInstrument.SIGH_Pay_Amount_Block = Number(currentInstrument.SIGH_Pay_Amount_Day) / Number(currentInstrument.deltaBlocks);

        currentInstrument.SIGH_Pay_Amount_Day_USD = Number(currentInstrument.SIGH_Pay_Amount_Day) * Number(instruments[i].priceUSD);
        currentInstrument.SIGH_Pay_Amount_Year_USD = Number(currentInstrument.SIGH_Pay_Amount_Year) * Number(instruments[i].priceUSD);
        currentInstrument.SIGH_Pay_Amount_Block_USD = Number(currentInstrument.SIGH_Pay_Amount_Year_USD) / Number(currentInstrument.deltaBlocks);
                              
        // Get SIGH HARVESTS SPEEDS & AMOUNTS (DAILY AND YEARLY) based on current $SIGH Side
        // Get SIGH HARVESTS SPEEDS & AMOUNTS (DAILY AND YEARLY) based on current $SIGH Side
        // Get SIGH HARVESTS SPEEDS & AMOUNTS (DAILY AND YEARLY) based on current $SIGH Side                
        if (Number(instruments[i].present_SIGH_Suppliers_Speed) > 0) {
          currentInstrument.SIGH_Harvests_Speed = Number(instruments[i].present_SIGH_Suppliers_Speed);
        }
        else if (Number(instruments[i].present_SIGH_Borrowers_Speed) > 0) {
          currentInstrument.SIGH_Harvests_Speed = Number(instruments[i].present_SIGH_Borrowers_Speed);
        }
        else {
          currentInstrument.SIGH_Harvests_Speed = Number(instruments[i].present_SIGH_Staking_Speed);
        }
        currentInstrument.SIGH_Harvests_Amount_Day = Number(currentInstrument.SIGH_Harvests_Speed * currentInstrument.deltaBlocks);
        currentInstrument.SIGH_Harvests_Amount_Year = Number(currentInstrument.SIGH_Harvests_Amount_Day) * 365;

        currentInstrument.SIGH_Harvests_Speed_USD = Number(currentInstrument.SIGH_Harvests_Speed) * Number(this.sighPriceInUSD);
        currentInstrument.SIGH_Harvests_Amount_Day_USD = Number(currentInstrument.SIGH_Harvests_Amount_Day) * Number(this.sighPriceInUSD);
        currentInstrument.SIGH_Harvests_Amount_Year_USD = Number(currentInstrument.SIGH_Harvests_Amount_Year) * Number(this.sighPriceInUSD);

        if ( Number(currentInstrument.SIGH_Harvests_Amount_Year_USD) == 0) {
          currentInstrument.SIGH_Harvests_APY = 0;
        }
        else if (Number(instruments[i].present_SIGH_Suppliers_Speed) > 0  && Number(currentInstrument.totalCompoundedLiquidityUSD) > 0) {
          currentInstrument.SIGH_Harvests_APY = 100 *  Number(currentInstrument.SIGH_Harvests_Amount_Year_USD) / Number(currentInstrument.totalCompoundedLiquidityUSD);
        }
        else if (Number(instruments[i].present_SIGH_Borrowers_Speed) > 0  && Number(currentInstrument.totalCompoundedBorrowsUSD) > 0) {
          currentInstrument.SIGH_Harvests_APY = 100 *  Number(currentInstrument.SIGH_Harvests_Amount_Year_USD) / Number(currentInstrument.totalCompoundedBorrowsUSD);
        }
        else if ( (Number(currentInstrument.totalCompoundedLiquidityUSD) > 0) || (Number(currentInstrument.totalCompoundedBorrowsUSD) > 0) ) {
          currentInstrument.SIGH_Harvests_APY =  100 *  Number(currentInstrument.SIGH_Harvests_Amount_Year_USD) / (Number(currentInstrument.totalCompoundedBorrowsUSD) + Number(currentInstrument.totalCompoundedLiquidityUSD))  ;
        }
        else {
          currentInstrument.SIGH_Harvests_APY =  0;
        }

        // Get ALPHA BEING GENERATED FOR THE INSTRUMENT
        // Get ALPHA BEING GENERATED FOR THE INSTRUMENT
        // Get ALPHA BEING GENERATED FOR THE INSTRUMENT        
        currentInstrument.alpha_perBlock_USD = Number(currentInstrument.SIGH_Harvests_Speed_USD) - Number(currentInstrument.SIGH_Pay_Amount_Block_USD);
        currentInstrument.alpha_perDay_USD =  Number(currentInstrument.SIGH_Harvests_Amount_Day_USD) - Number(currentInstrument.SIGH_Pay_Amount_Day_USD);
        currentInstrument.alpha_perYear_USD =  Number(currentInstrument.SIGH_Harvests_Amount_Year_USD) - Number(currentInstrument.SIGH_Pay_Amount_Year_USD);
        if ( Number(currentInstrument.alpha_perYear_USD) == 0) {
          currentInstrument.alpha_APY = 0;
        }
        else if (Number(instruments[i].present_SIGH_Suppliers_Speed) > 0  && Number(currentInstrument.totalCompoundedLiquidityUSD) > 0) {
          currentInstrument.alpha_APY =  100* Number(currentInstrument.alpha_perYear_USD) / Number(currentInstrument.totalCompoundedLiquidityUSD);
        }
        else if (Number(instruments[i].present_SIGH_Borrowers_Speed) > 0  && Number(currentInstrument.totalCompoundedBorrowsUSD) > 0) {
          currentInstrument.alpha_APY =  100* Number(currentInstrument.alpha_perYear_USD) / Number(currentInstrument.totalCompoundedBorrowsUSD);
        }
        else if ( (Number(currentInstrument.totalCompoundedLiquidityUSD) > 0) || (Number(currentInstrument.totalCompoundedLiquidityUSD) > 0) ) {
          currentInstrument.alpha_APY =  100* Number(currentInstrument.alpha_perYear_USD) / (Number(currentInstrument.totalCompoundedBorrowsUSD) + Number(currentInstrument.totalCompoundedLiquidityUSD))  ;
        }
        else {
          currentInstrument.alpha_APY =  0;
        }

        currentInstrument.average24SnapsSuppliersHarvestAPY = instruments[i].average24SnapsSuppliersHarvestAPY
        currentInstrument.average24SnapsBorrowersHarvestAPY = instruments[i].average24SnapsBorrowersHarvestAPY
        currentInstrument.averageMonthlySnapsSuppliersHarvestAPY = instruments[i].averageMonthlySnapsSuppliersHarvestAPY
        currentInstrument.averageMonthlySnapsBorrowersHarvestAPY = instruments[i].averageMonthlySnapsBorrowersHarvestAPY
                            
        instrumentsArray.push(currentInstrument);
      }      
      this.instruments = instrumentsArray;      // UPDATE THE STATE BEING DISPLAYED
      console.log("subscribeToInstruments");
      console.log(this.instruments);      
    },



    calculateSIGHPriceInUSD() {
       this.sighPriceInUSD = Number(this.$store.state.sighPriceUSD) > 0 ? Number(this.$store.state.sighPriceUSD) : 0 ;
       console.log( "CALCULATED $SIGH PRICE FOR HARVEST CALCULATION : " + this.sighPriceInUSD)
       return this.sighPriceInUSD;
       con
    },



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

  },

  destroyed() {
  },
  
};
</script>
<style src="./style.scss" lang="scss"  scoped></style>
