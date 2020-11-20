<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'sighQuantity',

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
    };
  },
  


  created() {
    console.log("IN STAKE SIGH / QUANTITY (TRADE-PANE) FUNCTION ");
    this.sighInstrument = this.$store.state.SIGHState;
    console.log(this.sighInstrument); 
    if ( this.sighInstrument && this.$store.state.SIGHContractAddress != '0x0000000000000000000000000000000000000000') {
      this.walletSIGHState = this.$store.state.walletSIGHState;
    }
    console.log(this.walletSIGHState);
    // SIGH's PRICE (IN ETH) POLLING
    if ( this.$store.state.isNetworkSupported  ) {
      setInterval(async () => {
        // console.log("IN SET INTERVAL (STAKE SIGH / QUANTITY)");
        if (this.$store.state.SIGHContractAddress != '0x0000000000000000000000000000000000000000') {
          this.SIGH_Price_ETH_ = await this.getInstrumentPrice({_instrumentAddress : this.$store.state.SIGHContractAddress });
        }
      },1000);
    }
    // ExchangeDataEventBus.$on(EventNames.changeSelectedInstrument, this.changesighInstrument);        
  },




  computed: {
    calculatedSIGH_PRICE_USD() {
        console.log('calculatedSIGH_PRICE_USD');
        if (this.sighInstrument && this.sighInstrument.priceDecimals) {
          console.log("COMPUTED : SIGH PRICE USD");          
          this.SIGH_Price_USD_ = Number( ( Number(this.SIGH_Price_ETH_) / Math.pow(10,this.sighInstrument.priceDecimals)) * (Number(this.$store.state.ethereumPriceUSD) / Math.pow(10,this.$store.state.ethPriceDecimals)) ).toFixed(4);
          console.log( this.SIGH_Price_USD_ );      
          return this.SIGH_Price_USD_;
        }
      return 0;
    },

    calculatedValue() {
        console.log('calculatedValue');
        if (this.sighInstrument && this.sighInstrument.priceDecimals) {
          console.log("COMPUTED VALUE : SIGH STAKING");          
          return  ( Number(this.formData.sighQuantity) * Number(this.SIGH_Price_USD_) ).toFixed(4) ; 
        }
      return 0;
    }
  },



  methods: {

    ...mapActions(['SIGHStaking_stake_SIGH','SIGHStaking_unstake_SIGH','ERC20_increaseAllowance','getInstrumentPrice','refresh_User_SIGH__State']),
    

    async stakeSIGH() {                           //STAKE SIGH (WORKS PROPERLY)
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }     
      // USER BALANCE IS LESS THAN WHAT HE WANTS TO STAKE
      else if ( Number(this.formData.sighQuantity) >  Number(this.WalletSIGHState.sighBalance)  ) {
        this.$showErrorMsg({message: " You do not have the mentioned amount of $SIGH tokens. Please make sure that you have the needed amount in your connected Wallet! " });        
      }
      // WHEN THE ALLOWANCE IS LESS THAN WHAT IS NEEDED      
      else if ( Number(this.formData.sighQuantity) >  Number(this.WalletSIGHState.sighStakingAllowance)  ) {
        let dif = Number(this.formData.sighQuantity) - Number(this.WalletSIGHState.sighStakingAllowance);
        this.$showErrorMsg({message: " You first need to 'APPROVE' an amount greater than " + dif + " $SIGH so that the repayment can be processed through the ERC20 Interface's transferFrom() Function."}); 
      }
      else {
        this.showLoader = true;
        let value =  ( Number(this.formData.sighQuantity) * Number(this.SIGH_Price_USD_) ).toFixed(4) ; 
        console.log('Stake Quantity - ' + this.formData.sighQuantity);
        console.log('Stake Value - ' + value);

        let response =  await this.SIGHStaking_stake_SIGH( { amountToBeStaked:  this.formData.sighQuantity } );
        if (response.status) {  
          this.showLoader = false;
          this.$showSuccessMsg({message: "SIGH STAKING SUCCESS : " + this.formData.sighQuantity + "  $SIGH worth " + value + " USD have been successfully staked. You currently have " + this.WalletSIGHState.sighStaked + " SIGH having worth " + (Number(this.WalletSIGHState.sighStaked) * (Number(this.SIGH_Price_USD_))).toFixed(4) + " USD Staked farming staking rewards for you. Enjoy farming SIGH Staking rewards!"  });
          this.formData.sighQuantity = null;
          await this.refresh_Wallet_SIGH_State(false);        
          // this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Staked',Service: 'STAKING'});
        }
        else {
          this.$showErrorMsg({message: "SIGH STAKING  FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
          // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
        }
        this.formData.sighQuantity = null;
        this.showLoader = false;
      }
    },



    async unstakeSIGH() {
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }     
      if ( Number(this.formData.sighQuantity) > Number(this.WalletSIGHState.sighStaked) ) {
        this.$showErrorMsg({message: "The amount entered for unstaking exceeds your current Staked balance. Please enter a valid amount. Current SIGH Staked = " + this.stakedSighBalance + " SIGH"  });
      }
      else {
        this.showLoader = true;
        let value =  ( Number(this.formData.sighQuantity) * Number(this.SIGH_Price_USD_) ).toFixed(4) ; 
        console.log('UN-Stake Quantity - ' + this.formData.sighQuantity);
        console.log('UN-Stake Value - ' + value);

        let response =  await this.SIGHStaking_unstake_SIGH( { amountToBeUNStaked:  this.formData.sighQuantity } );
        if (response.status) { 
          this.showLoader = false;
          this.$showSuccessMsg({message: "SIGH UN-STAKING SUCCESS : " + this.formData.sighQuantity + " $SIGH worth " + value + " USD have been successfully un-staked. You currently have " + this.WalletSIGHState.sighStaked + " SIGH having worth " + (Number(this.WalletSIGHState.sighStaked) * (Number(this.SIGH_Price_USD_))).toFixed(4) + " USD Staked farming staking rewards for you! " });
          this.formData.sighQuantity = null;
          await this.refresh_Wallet_SIGH_State(false);        
          // this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Un-Staked',Service: 'STAKING'});
        }
        else {
          this.$showErrorMsg({message: "SIGH UN-STAKING FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
            // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
          }
          this.showLoader = false;      
        }
      },


      


    async approve() {   //APPROVE (WORKS PROPERLY) - calls increaseAllowance() Function  // Need to handle tokens which do not have it implemented
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }     
      else {
        this.showLoader = true;
        let value =  ( Number(this.formData.sighQuantity) * Number(this.SIGH_Price_USD_) ).toFixed(4) ; 
        console.log(this.sighInstrument);
        console.log('SIGH Quantity to be Approved - ' + this.formData.sighQuantity);
        console.log('SIGH Quantity Worth - ' + value);
        let response = await this.ERC20_increaseAllowance( { tokenAddress: this.$store.state.SIGHContractAddress , spender: this.$store.getters.sighStakingContractAddress , addedValue:  this.formData.sighQuantity } );
        if (response.status) { 
          this.showLoader = false;
          this.formData.sighQuantity = null;
          this.$showSuccessMsg({message: "APPROVAL SUCCESS : Allowance Added = " + this.formData.sighQuantity +  " SIGH. Maximum of " + this.WalletSIGHState.sighStakingAllowance + "  SIGH can now be staked to farm Staking Rewards!"  });
          await this.refresh_Wallet_SIGH_State(false);        
          // this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'ApproveForDeposit',Service: 'LENDING'});      
        }
        else {
          this.$showErrorMsg({message: "APPROVAL FAILED : " + response.message  }); 
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
          // this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'ApproveForDeposit',Service: 'LENDING'});              
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
          this.sighInstrument = this.$store.state.SIGHState;
          console.log("refreshWallet_SIGH_State() in STAKE_SIGH / QUANTITY");
          let response = await this.refresh_User_SIGH__State();
          console.log(" RESPONSE : refreshWallet_SIGH_State() in STAKE_SIGH / QUANTITY");
          console.log(response);
          console.log(this.$store.getters.getWalletSIGHState);
          this.$store.commit("setWalletSIGHState",response);
          console.log(this.$store.getters.getWalletSIGHState);
          this.WalletSIGHState = this.$store.getters.getWalletSIGHState;
          console.log(" WalletSIGHState : refreshWallet_SIGH_State() in STAKE_SIGH / QUANTITY");
          console.log(this.WalletSIGHState );
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


  },

  destroyed() {
    ExchangeDataEventBus.$off(EventNames.changeSelectedInstrument, this.changesighInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
