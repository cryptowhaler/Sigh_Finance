<template src='./template.html'></template>

<script>
import CustomerSupport from '@/components/CustomerSupport';
import SupportedMarkets_UtilityPanel from './SupportedMarkets_UtilityPanel/SupportedMarkets_UtilityPanel.vue';
// import Protocol_Infographics from './Protocol_Infographics/Protocol_Infographics.vue';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import FAQs from '@/components/FaqsContainer';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {


  components: {
    SupportedMarkets_UtilityPanel,
    'customer-support': CustomerSupport,
    // Protocol_Infographics,
    faqs: FAQs,
  },


  created() {  
    console.log('IN Created TradePanel File');
  },

  methods: {
    ...mapActions(['SIGHSpeedController_drip']),


      async drip_SIGH() {
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }       
      else {       // WHEN ABOVE CONDITIONS ARE MET SO THE TRANSACTION GOES THROUGH
        let response =  await this.SIGHSpeedController_drip();
        if (response.status) {      
          this.$showSuccessMsg({message: "SIGH distributed successfully by the $SIGH Speed Controller!" });
        }
        else {
          this.$showErrorMsg({message: "SIGH Distribution FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
      }
    },



  }



  
};
</script>

 <style src="./style.scss" lang="scss"  scoped></style>
