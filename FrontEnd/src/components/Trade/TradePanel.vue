<template src='./template.html'></template>

<script>
import CustomerSupport from '@/components/CustomerSupport';
import SupportedMarkets_UtilityPanel from './SupportedMarkets_UtilityPanel/SupportedMarkets_UtilityPanel.vue';
// import Protocol_Infographics from './Protocol_Infographics/Protocol_Infographics.vue';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import FAQs from '@/components/FaqsContainer';
import {mapState,mapActions,} from 'vuex';
import gql from 'graphql-tag';
import Web3 from 'web3';

export default {

  data() {
    return {
      sighInstrument: {}, 
      displayInNumbers: false,
    };
  },


  components: {
    SupportedMarkets_UtilityPanel,
    'customer-support': CustomerSupport,
    // Protocol_Infographics,
    faqs: FAQs,
  },


  created() {  
    console.log('IN Created TradePanel File');
  },


    apollo: {
    $subscribe: {
      instruments: {
        query: gql`subscription {
                    sighInstruments {
                      symbol
                      priceUSD
                      currentInflation
                      currentMintSpeed
                      currentBurnSpeed

                      # blocksPerCycle
                      sighTreasuryDistributionSpeed
                      sighVolatilityHarvestsDistributionSpeed

                      isUpperCheckForVolatilitySet
                      cryptoMarketSentiment
                      
                      maxSighVolatilityHarvestSpeed
                      currentSighVolatilityHarvestSpeed
                      
                      totalLendingProtocolVolatilityPerBlockUSD
                      totalLendingProtocolSentimentVolatilityPerBlockUSD
                      cryptoMarketSentimentFinalProtocolVolatilityPerBlockUSD
                      
                      maxHarvestSizePossibleETH
                      maxHarvestSizePossibleUSD

                      bullCurrentTotalSighHarvestSpeed
                      bearCurrentTotalSighHarvestSpeed
                    }
                  }`,

        result({data,loading,}) {
          if (loading) {
            console.log('loading');
          }
          else {
            console.log("IN SUBSCRIPTIONS : HEADER");
            console.log(data);
            let _sighInstrument = data.sighInstruments[0];
            if (_sighInstrument) {
              this.sighInstrument = _sighInstrument;
              this.$store.commit("updateSIGHPrice",this.sighInstrument.priceUSD);
            }
          }
        },
      },
    },
  },

  methods: {
    ...mapActions(['SIGHSpeedController_drip']),

    toggle() {
      this.displayInNumbers = !this.displayInNumbers;
    },

      async drip_SIGH() {
      if (!this.$store.state.web3) {
        this.$showErrorMsg({title:"Not Connected to Web3", message: " You need to first connect to WEB3 (BSC Network) to interact with SIGH Finance!", timeout: 4000 });  
        this.$showInfoMsg({message: "Please install METAMASK Wallet to interact with SIGH Finance!", timeout: 4000 }); 
      }
      else if (!this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({title:"Network not Supported", message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName, timeout: 4000 }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) ", timeout: 4000 }); 
        return;
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }       
      else {       // WHEN ABOVE CONDITIONS ARE MET SO THE TRANSACTION GOES THROUGH
        let response =  await this.SIGHSpeedController_drip();
        if (response.status) {      
          this.$showSuccessMsg({tite:"SIGH Successfully Driped" , message: "SIGH distributed successfully by the $SIGH Speed Controller!" });
        }
        else {
          this.$showErrorMsg({message: "SIGH Distribution FAILED : " + response.message  });
          this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 }); 
        }
      }
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

  }



  
};
</script>

 <style src="./style.scss" lang="scss"  scoped></style>
