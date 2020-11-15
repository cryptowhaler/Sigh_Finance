<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';

export default {

  name: 'sighQuantity',

  data() {
    return {
      sighInstrument: this.$store.state.SighInstrumentState,
      formData : {
        sighQuantity: null,
        sighValue: null
      },
      stakedSighBalance : null,      
      availableAllowance: null,
      showLoader: false,
    };
  },
  

  created() {
    console.log("IN STAKE SIGH / AMOUNT (TRADE-PANE) FUNCTION ");
    this.sighInstrument = this.$store.state.SighInstrumentState;
    this.getAllowanceAndStakedBalance();
  },


  computed: {
    calculatedQuantity() {
        console.log('calculatedQuantity');
        if (this.sighInstrument) {
          let price = (this.sighInstrument.price / Math.pow(10,this.sighInstrument.priceDecimals)).toFixed(4);
          let quantity = (this.formData.sighValue) / price ; 
          return quantity;
        }
      return 0;
    }
  },

  methods: {

    ...mapActions(['SIGHStaking_stake_SIGH','SIGHStaking_unstake_SIGH','ERC20_increaseAllowance','ERC20_getAllowance','SIGHStaking_getStakedBalanceForStaker']),
    

    async stakeSIGH() {                           //STAKE SIGH (WORKS PROPERLY)
      let price = (this.sighInstrument.price / Math.pow(10,this.sighInstrument.priceDecimals)).toFixed(4);
      let quantity = this.formData.sighValue / price;

      console.log('Stak Sigh- ' + this.sighInstrument.address);
      console.log('Stak Sigh- ' + this.sighInstrument.symbol);
      console.log('Available Allowance - ' + this.availableAllowance );      
      console.log('Stake Quantity - ' + quantity);
      console.log('Stake Value - ' + this.formData.sighValue);
      console.log('Stake Price - ' + price);     

      // WHEN THE ALLOWANCE IS LESS THAN WHAT IS NEEDED
      if ( Number(quantity) >  Number(this.availableAllowance)  ) {
        let dif = Number(quantity) - Number(this.availableAllowance);
        this.$showInfoMsg({message: " You first need to 'APPROVE' an amount greater than " + dif + " " + this.sighInstrument.symbol + " so that the stake's deposit can be processed through the ERC20 Interface's transferFrom() Function."}); 
        this.$showInfoMsg({message: "Available SIGH Allowance : " + this.availableAllowance + " " + this.sighInstrument.symbol });        
      }
      else {
        this.showLoader = true;
        let response =  await this.SIGHStaking_stake_SIGH( { amountToBeStaked:  quantity } );
        if (response.status) {  
          await this.getAllowanceAndStakedBalance();
          let valueOfTotalStaked_SIGH = price * this.stakedSighBalance;
          this.$showSuccessMsg({message: "SIGH STAKING SUCCESS : " + quantity + "  " +  this.sighInstrument.symbol +  " worth " + this.formData.sighValue + " USD has been successfully staked. You currently have " + this.stakedSighBalance + " SIGH having worth " + valueOfTotalStaked_SIGH + " USD Staked farming staking rewards for you. Enjoy farming SIGH Staking rewards!"  });
          this.$showInfoMsg({message: " Additional SIGH that can be staked : " + this.availableAllowance + " SIGH" });           
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Staked',Service: 'STAKING'});
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
      let price = (this.sighInstrument.price / Math.pow(10,this.sighInstrument.priceDecimals)).toFixed(4);
      let quantity = this.formData.sighValue / price ;

      console.log('Stak Sigh- ' + this.sighInstrument.address);
      console.log('Stak Sigh- ' + this.sighInstrument.symbol);
      console.log('Available Allowance - ' + this.availableAllowance );      
      console.log('UN-Stake sighValue - ' + this.formData.sighValue);
      console.log('UN-Stake Quantity - ' + quantity);
      console.log('UN-Stake Price - ' + price);     
      console.log('UN-Stake : Currently staked balance - ' + this.stakedSighBalance);     

      if ( Number(quantity) > Number(this.stakedSighBalance) ) {
        this.$showErrorMsg({message: "The amount entered for unstaking exceeds your current Staking balance. Please enter a valid amount. Current SIGH Staked = " + this.stakedSighBalance + " SIGH"  });
      }
      else {
        this.showLoader = true;
        let response =  await this.SIGHStaking_unstake_SIGH( { amountToBeUNStaked:  quantity } );
        if (response.status) {      
          await this.getAllowanceAndStakedBalance();
          let valueOfTotalStaked_SIGH = price * this.stakedSighBalance;
          this.$showSuccessMsg({message: "SIGH UN-STAKING SUCCESS : " + quantity + "  " +  this.sighInstrument.symbol +  " worth " + this.formData.sighValue + " USD has been successfully un-staked. You currently have " + this.stakedSighBalance + " SIGH having worth " + valueOfTotalStaked_SIGH + " USD Staked farming staking rewards for you! " });
          this.$showInfoMsg({message: " Additional SIGH that can be staked : " + this.availableAllowance + " SIGH" }); 
          this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Un-Staked',Service: 'STAKING'});
        }
        else {
          this.$showErrorMsg({message: "SIGH UN-STAKING FAILED : " + response.message  });
          this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
            // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
          }
          this.formData.sighQuantity = null;
          this.showLoader = false;      
      }
    },


      


    async approve() {   //APPROVE (WORKS PROPERLY) - calls increaseAllowance() Function  // Need to handle tokens which do not have it implemented
      console.log('Selected Instrument - ')
      console.log(this.sighInstrument);
      console.log('Amount (Value) to be Approved - ' + this.formData.sighValue);
      let price = (this.sighInstrument.price / Math.pow(10,this.sighInstrument.priceDecimals)).toFixed(4);
      let quantity = this.formData.sighValue / price ;
      console.log('Instrument Price - ' + price + ' SIGH Quantity - ' + quantity );
      this.showLoader = true;
      let response = await this.ERC20_increaseAllowance( { tokenAddress: this.sighInstrument.address, spender: this.$store.getters.sighStakingContractAddress , addedValue: quantity } );
      if (response.status) { 
        await this.getAllowanceAndStakedBalance();        
        this.$showSuccessMsg({message: "APPROVAL SUCCESS : Allowance Added = " + this.formData.sighQuantity +  " SIGH. Maximum of " + this.availableAllowance + "  " +  this.sighInstrument.symbol +  " can now be deposited to SIGH Finance. Gas used = " + response.gasUsed  });
        this.formData.sighValue = null;
        // this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'ApproveForDeposit',Service: 'LENDING'});      
      }
      else {
        this.$showErrorMsg({message: "APPROVAL FAILED : " + response.message  }); 
        this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
        // this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'ApproveForDeposit',Service: 'LENDING'});              
      }
      this.showLoader = false;
    }, 



    async getAllowanceAndStakedBalance() {
      this.availableAllowance = await this.ERC20_getAllowance({tokenAddress: this.sighInstrument.address, owner: this.$store.getters.connectedWallet, spender: this.$store.getters.sighStakingContractAddress });
      this.stakedSighBalance = await this.SIGHStaking_getStakedBalanceForStaker({ _user: this.$store.getters.connectedWallet  });
      let price = (this.sighInstrument.price / Math.pow(10,this.sighInstrument.priceDecimals)).toFixed(4);
      let value = price * this.stakedSighBalance;
      console.log( this.stakedSighBalance + " SIGH worth " + value + " USD currently staked. Addition SIGH that can be Staked =  " + this.availableAllowance + " SIGH"  );
    }

  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changeSelectedInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
