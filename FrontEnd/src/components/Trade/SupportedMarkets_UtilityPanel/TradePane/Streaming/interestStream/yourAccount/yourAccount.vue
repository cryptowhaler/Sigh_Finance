<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'yourAccount',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument;
      formData : {
        toAccount: null,                  // to which interest is to be re-directed
      },
      currentlyRedirectedTo : null,       // Interest currently re-directed to
      showLoader: false,
    };
  },
  

  created() {
    this. getCurrentStateOfInterestStream();                   // get the address to which the Interest Stream is currently re-directed            
    this.changeSelectedInstrument = (selectedInstrument_) => {                 //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_.instrument;        
      console.log('DEPOSIT : selected instrument changed - '+ this.selectedInstrument );
      this. getCurrentStateOfInterestStream();
    };    
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);    
  },


  // computed: {
  // },

  methods: {

    ...mapActions(['IToken_redirectInterestStream','IToken_allowInterestRedirectionTo','IToken_getInterestRedirectionAddress','getRedirectedBalance','IToken_getRedirectedBalance']),
    

    async redirectInterestStream() {                           // RE-DIRECT INTEREST STREAM
      // let price = (this.$store.state.SighInstrumentState.price / Math.pow(10,this.$store.state.SighInstrumentState.priceDecimals)).toFixed(4);
      console.log('Addresses to which it is to be re-directed to = ' + this.formData.toAccount);

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) ) {       // Network Currently Connected To Check
        this.$showInfoMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showInfoMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.toAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showInfoMsg({message: " The Account Address provided is not valid ( check-sum check failed). Check the address again or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        this.showLoader = true;
        let response =  await this.IToken_redirectInterestStream( { iTokenAddress:  this.selectedInstrument.iTokenAddress, _to: this.formData.toAccount } );
        if (response.status) {  
          await this.getCurrentStateOfInterestStream(false);
          this.$showSuccessMsg({message: "INTEREST STREAM for the instrument + "  + this.selectedInstrument.symbol +  " has been successfully re-directed to " + this.formData.toAccount + " from the connected Account " +  this.$store.state.connectedWallet  });
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'InterestRedirected',Service: 'STREAMING'});
        }
        else {
          this.$showErrorMsg({message: "INTEREST STREAM RE-DIRECTION FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
        this.formData.toAccount = null;
        this.showLoader = false;
      }
    },

    async allowInterestRedirectionTo() {                           // RE-DIRECT INTEREST STREAM
      // let price = (this.$store.state.SighInstrumentState.price / Math.pow(10,this.$store.state.SighInstrumentState.priceDecimals)).toFixed(4);
      console.log('Account to which the administrator priviledges to re-direct interest will be transferred = ' + this.formData.toAccount);

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) ) {       // Network Currently Connected To Check
        this.$showInfoMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported by SIGH Finance - 1) Ethereum :  Kovan Testnet(42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showInfoMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else if ( !Web3.utils.isAddress(this.formData.toAccount) ) {            // 'ToAccount' provided is not Valid
        this.$showInfoMsg({message: " The Account Address provided is not valid ( check-sum check failed). Check the address again or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }
      else {                                  // EXECUTE THE TRANSACTION
        this.showLoader = true;
        let response =  await this.IToken_allowInterestRedirectionTo( { iTokenAddress:  this.selectedInstrument.iTokenAddress, _to: this.formData.toAccount } );
        if (response.status) {  
          await this.getCurrentStateOfInterestStream();
          this.$showSuccessMsg({message: "ADMINISTRATOR PRIVILEDGES to re-direct the INTEREST STREAM for the instrument + "  + this.selectedInstrument.symbol +  " of the connected Account " +  this.$store.state.connectedWallet + " has been transferred to " + this.formData.toAccount  });
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'InterestRidirectionRightsTransferred',Service: 'STREAMING'});
        }
        else {
          this.$showErrorMsg({message: " TRANSFERING ADMINISTRATOR PRIVILEDGES FAILED: " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        }
        this.formData.toAccount = null;
        this.showLoader = false;
      }
    },


    async unstakeSIGH() {
      let price = (this.sighInstrument.price / Math.pow(10,this.sighInstrument.priceDecimals)).toFixed(4);
      let value = price * this.formData.interestStream;

      console.log('Stak Sigh- ' + this.sighInstrument.address);
      console.log('Stak Sigh- ' + this.sighInstrument.symbol);
      console.log('Available Allowance - ' + this.availableAllowance );      
      console.log('UN-Stake Quantity - ' + this.formData.interestStream);
      console.log('UN-Stake Value - ' + value);
      console.log('UN-Stake Price - ' + price);     
      console.log('UN-Stake : Currently staked balance - ' + this.stakedSighBalance);     

      if ( Number(this.formData.interestStream) > Number(this.stakedSighBalance) ) {
        this.$showErrorMsg({message: "The amount entered for unstaking exceeds your current Staking balance. Please enter a valid amount. Current SIGH Staked = " + this.stakedSighBalance + " SIGH"  });
      }
      else {
        this.showLoader = true;
        let response =  await this.SIGHStaking_unstake_SIGH( { amountToBeUNStaked:  this.formData.interestStream } );
        if (response.status) {      
          await this.getAllowanceAndStakedBalance();
          let valueOfTotalStaked_SIGH = price * this.stakedSighBalance;
          this.$showSuccessMsg({message: "SIGH UN-STAKING SUCCESS : " + this.formData.interestStream + "  " +  this.sighInstrument.symbol +  " worth " + value + " USD has been successfully un-staked. You currently have " + this.stakedSighBalance + " SIGH having worth " + valueOfTotalStaked_SIGH + " USD Staked farming staking rewards for you! " });
          this.$showInfoMsg({message: " Additional SIGH that can be staked : " + this.availableAllowance + " SIGH" }); 
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Un-Staked',Service: 'STAKING'});
        }
        else {
          this.$showErrorMsg({message: "SIGH UN-STAKING FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
            // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
          }
          this.formData.interestStream = null;
          this.showLoader = false;      
      }
    },


      



    async approve() {   //APPROVE (WORKS PROPERLY) - calls increaseAllowance() Function  // Need to handle tokens which do not have it implemented
      console.log('Selected Instrument - ')
      console.log(this.sighInstrument);
      console.log('Quantity to be Approved - ' + this.formData.interestStream);
      let price = (this.sighInstrument.price / Math.pow(10,this.sighInstrument.priceDecimals)).toFixed(4);
      let value = price * this.formData.interestStream;
      console.log('Instrument Price - ' + price);
      this.showLoader = true;
      let response = await this.ERC20_increaseAllowance( { tokenAddress: this.sighInstrument.address, spender: this.$store.getters.sighStakingContractAddress , addedValue:  this.formData.interestStream } );
      if (response.status) { 
        await this.getAllowanceAndStakedBalance();        
        this.$showSuccessMsg({message: "APPROVAL SUCCESS : Allowance Added = " + this.formData.interestStream +  " SIGH. Maximum of " + this.availableAllowance + "  " +  this.sighInstrument.symbol +  " can now be deposited to SIGH Finance. Gas used = " + response.gasUsed  });
        this.formData.interestStream = null;
        // this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'ApproveForDeposit',Service: 'LENDING'});      
      }
      else {
        this.$showErrorMsg({message: "APPROVAL FAILED : " + response.message  }); 
        this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        // this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'ApproveForDeposit',Service: 'LENDING'});              
      }
      this.showLoader = false;
    }, 



    async  getCurrentStateOfInterestStream() {
      this.availableAllowance = await this.ERC20_getAllowance({tokenAddress: this.sighInstrument.address, owner: this.$store.getters.connectedWallet, spender: this.$store.getters.sighStakingContractAddress });
      this.stakedSighBalance = await this.SIGHStaking_getStakedBalanceForStaker({ _user: this.$store.getters.connectedWallet  });
      let price = (this.sighInstrument.price / Math.pow(10,this.sighInstrument.priceDecimals)).toFixed(4);
      let value = price * this.stakedSighBalance;
      console.log( this.stakedSighBalance + " SIGH worth " + value + " USD currently staked. Addition SIGH that can be Staked =  " + this.availableAllowance + " SIGH"  );
    }

  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changesighInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
