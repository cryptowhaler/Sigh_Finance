<template src="./template.html"></template>

<script>
import EventBus, {EventNames,} from '@/eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'sighAmount',

  data() {
    return {
      sighInstrument: this.$store.state.SIGHState, // SIGH's STATE
      WalletSIGHState: {},                         // WALLET - SIGH STATE
      formData : {
        sighQuantity: null,
        sighValue: null
      },
      SIGH_Price_ETH_ : null,
      SIGH_Price_USD_ : null,
      showLoader: false,
      showLoaderRefresh: false,
      intervalActivated: false,
    };
  },
  

  created() {
    console.log("IN STAKE SIGH / AMOUNT (TRADE-PANE) FUNCTION ");
    this.initiatePriceLoop();    
  },

  mounted() {
    this.refreshThisSession = () => this.loadSessionData(); 

    ExchangeDataEventBus.$on(EventNames.ConnectedWalletSesssionRefreshed, this.refreshThisSession );    
    ExchangeDataEventBus.$on(EventNames.ConnectedWallet_Instrument_Refreshed, this.refreshThisSession);        
    ExchangeDataEventBus.$on(EventNames.ConnectedWallet_SIGH_Balances_Refreshed, this.refreshThisSession);        
  },



  computed: {
    calculatedQuantity() {
        console.log('calculatedQuantity');
        if (this.sighInstrument && this.sighInstrument.priceDecimals) {
          console.log("COMPUTED QUANTITY : SIGH STAKING");          
          return  ( Number(this.formData.sighValue) / Number(this.SIGH_Price_USD_) ).toFixed(4) ; 
        }
      return 0;
    }
  },



  methods: {

    ...mapActions(['SIGHStaking_stake_SIGH','SIGHStaking_unstake_SIGH','ERC20_increaseAllowance','getInstrumentPrice','refresh_User_SIGH__State']),
    
    async initiatePriceLoop() {
      if ( this.$store.state.isNetworkSupported  ) {
        setInterval(async () => {
          if (this.$store.state.SIGHContractAddress != '0x0000000000000000000000000000000000000000') {
            this.intervalActivated = true;
            this.SIGH_Price_ETH_ = await this.getInstrumentPrice({_instrumentAddress : this.$store.state.SIGHContractAddress });
            this.SIGH_Price_USD_ = Number( ( Number(this.SIGH_Price_ETH_) / Math.pow(10,this.sighInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4);
            // console.log("SIGH STAKING :  AMOUNT, Price (USD) " + this.SIGH_Price_USD_);
          }
        },1000);
      this.sighInstrument = this.$store.state.SIGHState;    
      this.walletSIGHState = this.$store.state.walletSIGHState;
      }
    },


    async stakeSIGH() {                           //STAKE SIGH (WORKS PROPERLY)
      let quantity = null;
      if (this.$store.state.isNetworkSupported && this.sighInstrument.priceDecimals  ) {
        quantity =  Number( Number(this.formData.sighValue) / Number(this.SIGH_Price_USD_) );
      }

      if ( Number(quantity) == 0 ) {      
        this.$showErrorMsg({message: " Please enter a valid Amount!" }); 
      }
      else if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Binance Smart Chain testnet (97) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }     
      // USER BALANCE IS LESS THAN WHAT HE WANTS TO STAKE
      else if ( Number(quantity) >  Number(this.WalletSIGHState.sighBalance)  ) {
        this.$showErrorMsg({message: " You do not have the mentioned amount of $SIGH tokens. Please make sure that you have the needed amount in your connected Wallet! " });        
      }
      // WHEN THE ALLOWANCE IS LESS THAN WHAT IS NEEDED      
      else if ( Number(quantity) >  Number(this.WalletSIGHState.sighStakingAllowance)  ) {
        let dif = Number(quantity) - Number(this.WalletSIGHState.sighStakingAllowance);
        this.$showErrorMsg({message: " You first need to 'APPROVE' an amount greater than " + dif + " $SIGH so that the repayment can be processed through the ERC20 Interface's transferFrom() Function."}); 
      }
      else {
        this.showLoader = true;
        console.log('Stake Quantity - ' + quantity );
        console.log('Stake Value - ' + this.formData.sighValue);

        let response =  await this.SIGHStaking_stake_SIGH( { amountToBeStaked:  quantity } );
        if (response.status) {  
          this.showLoader = false;
          console.log("BEFORE SUCCESS MESSAGE");
          console.log(response);
          this.$showSuccessMsg({message: "SIGH STAKING SUCCESS : " + Number(quantity).toFixed(4) + "  $SIGH worth " + this.formData.sighValue + " USD have been successfully staked. You currently have " + this.WalletSIGHState.sighStaked + " SIGH having worth " + (Number(this.WalletSIGHState.sighStaked) * (Number(this.SIGH_Price_USD_))).toFixed(4) + " USD Staked farming staking rewards for you. Enjoy farming SIGH Staking rewards!"  });
          this.formData.sighValue = null;
          await this.refresh_Wallet_SIGH_State(false);        
        }
        else {
          this.$showErrorMsg({message: "SIGH STAKING  FAILED : " + response.message  });
          this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 }); 
        }
        this.formData.sighValue = null;
        this.showLoader = false;
      }
    },



    async unstakeSIGH() {
      let quantity = null;
      if (this.$store.state.isNetworkSupported && this.sighInstrument.priceDecimals  ) {
        quantity =  Number( Number(this.formData.sighValue) / Number(this.SIGH_Price_USD_) );
      }

      if ( Number(quantity) == 0 ) {      
        this.$showErrorMsg({message: " Please enter a valid Amount!" }); 
      }
      else if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Binance Smart Chain testnet (97) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }     
      else if ( Number(quantity) > Number(this.WalletSIGHState.sighStaked) ) {
        this.$showErrorMsg({message: "The amount entered for unstaking exceeds your current Staked balance. Please enter a valid amount. Current SIGH Staked = " + this.stakedSighBalance + " SIGH"  });
      }
      else {
        this.showLoader = true;
        console.log('UN-Stake Quantity - ' + quantity);
        console.log('UN-Stake Value - ' + this.formData.sighValue);

        let response =  await this.SIGHStaking_unstake_SIGH( { amountToBeUNStaked:  quantity } );
        if (response.status) { 
          this.showLoader = false;
          this.$showSuccessMsg({message: "SIGH UN-STAKING SUCCESS : " + Number(quantity).toFixed(4) + "  $SIGH worth " + this.formData.sighValue + " USD have been successfully un-staked. You currently have " +  this.WalletSIGHState.sighStaked  + " SIGH having worth " + (Number(this.WalletSIGHState.sighStaked) * (Number(this.SIGH_Price_USD_))).toFixed(4) + " USD Staked farming staking rewards for you! " });
          this.formData.sighValue = null;
          await this.refresh_Wallet_SIGH_State(false);        
        }
        else {
          this.$showErrorMsg({message: "SIGH UN-STAKING FAILED : " + response.message  });
          this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 }); 
          }
          this.showLoader = false;      
        }
      },



    async approve() {   //APPROVE (WORKS PROPERLY) - calls increaseAllowance() Function  // Need to handle tokens which do not have it implemented
      let quantity = null;
      if (this.$store.state.isNetworkSupported && this.sighInstrument.priceDecimals  ) {
        quantity =  Number( Number(this.formData.sighValue) / Number(this.SIGH_Price_USD_) );
      }

      if ( Number(quantity) == 0 ) {      
        this.$showErrorMsg({message: " Please enter a valid Amount!" }); 
      }
      else if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Binance Smart Chain testnet (97) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance . Try re-connecting your Wallet or connect with our support team through our Discord Server in case of any queries! "}); 
      }     
      else {
        this.showLoader = true;
        console.log('SIGH Quantity to be Approved - ' + quantity);
        console.log('SIGH Quantity Worth - ' + value);
        let response = await this.ERC20_increaseAllowance( { tokenAddress: this.$store.state.SIGHContractAddress , spender: this.$store.getters.sighStakingContractAddress , addedValue:  quantity  , symbol : 'SIGH', decimals: 18  } );
        if (response.status) { 
          this.showLoader = false;
          this.formData.sighValue = null;
          this.$showSuccessMsg({message: "APPROVAL SUCCESS : Allowance Added = " + Number(quantity).toFixed(4) +  " SIGH. Maximum of " + this.WalletSIGHState.sighStakingAllowance + "  SIGH can now be staked to farm Staking Rewards!"  });
          await this.refresh_Wallet_SIGH_State(false);        
        }
        else {
          this.$showErrorMsg({message: "APPROVAL FAILED : " + response.message  }); 
          this.$showInfoMsg({title: "Contact our Support Team" , message: "Contact our Team through our Discord Server in case you need any help!", timeout: 4000 }); 
        }
        this.showLoader = false;
      }
    }, 



    async refresh_Wallet_SIGH_State(toDisplay) {
      if ( this.$store.state.web3 && this.$store.state.isNetworkSupported &&  this.$store.state.SIGHContractAddress  ) {       // Network Currently Connected To Check
        try {
          if (toDisplay) {
            this.$showInfoMsg({ message: "Initiating re-calculation of current Aggregated $SIGH Yields across your Portfolio ! "});          
          }
          this.showLoaderRefresh = true;
          let response = await this.refresh_User_SIGH__State();
          this.$store.commit("setWalletSIGHState",response);
          this.WalletSIGHState = this.$store.getters.getWalletSIGHState;
          ExchangeDataEventBus.$emit(EventNames.ConnectedWallet_SIGH_Balances_Refreshed);    
          if (toDisplay) {
            this.$showInfoMsg({message: "Connected Wallet's $SIGH Balances and Farming Yields have been refreshed! " });        
          }
        }
        catch(error) {
          console.log( 'FAILED' );
        }
        this.showLoaderRefresh = false;
      }
    },


    loadSessionData() {
      if (this.intervalActivated == false) {
        this.initiatePriceLoop();
      }
      if (this.$store.state.SIGHState ) {
        this.sighInstrument = this.$store.state.SIGHState;   
        this.walletSIGHState = {}; 
        this.walletSIGHState = this.$store.state.walletSIGHState;
      }
      console.log("SIGH STAKE : AMOUNT SESSION REFRESHED");
      console.log(this.sighInstrument);
      console.log(this.walletSIGHState);
    }

  },


  

  destroyed() {
    ExchangeDataEventBus.$off(EventNames.ConnectedWalletSesssionRefreshed );    
    ExchangeDataEventBus.$off(EventNames.ConnectedWallet_Instrument_Refreshed );        
    ExchangeDataEventBus.$off(EventNames.ConnectedWallet_SIGH_Balances_Refreshed );        
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
