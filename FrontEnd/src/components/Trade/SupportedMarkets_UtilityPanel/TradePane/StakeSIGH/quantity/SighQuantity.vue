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
    this.sighInstrument = this.$store.state.SighInstrumentState;
    this.getAllowanceAndStakedBalance();
  },


  computed: {
    calculatedValue() {
        console.log('calculatedValue');
        if (this.sighInstrument) {
          let sighPrice = ((this.formData.sighQuantity) * (this.sighInstrument.price / Math.pow(10,this.sighInstrument.priceDecimals))).toFixed(4) ; 
          return sighPrice;
        }
      return 0;
    }
  },

  methods: {

    ...mapActions(['SIGHStaking_stake_SIGH','SIGHStaking_unstake_SIGH','ERC20_increaseAllowance','ERC20_getAllowance','SIGHStaking_getStakedBalanceForStaker']),
    

    async stakeSIGH() {                           //STAKE SIGH (WORKS PROPERLY)
      let price = (this.sighInstrument.price / Math.pow(10,this.sighInstrument.priceDecimals)).toFixed(4);
      let value = price * this.formData.sighQuantity;
      console.log('Stak Sigh- ' + this.sighInstrument.address);
      console.log('Stak Sigh- ' + this.sighInstrument.symbol);
      console.log('Available Allowance - ' + this.availableAllowance );      
      console.log('Stake Quantity - ' + this.formData.sighQuantity);
      console.log('Stake Value - ' + value);
      console.log('Stake Price - ' + price);     

      // WHEN THE ALLOWANCE IS LESS THAN WHAT IS NEEDED
      if ( Number(this.formData.sighQuantity) >  Number(this.availableAllowance)  ) {
        let dif = this.formData.sighQuantity - this.availableAllowance;
        this.$showInfoMsg({message: " You first need to 'APPROVE' an amount greater than " + dif + " " + this.sighInstrument.symbol + " so that the stake's deposit can be processed through the ERC20 Interface's transferFrom() Function."}); 
        this.$showInfoMsg({message: "Available SIGH Allowance : " + this.availableAllowance + " " + this.sighInstrument.symbol });        
      }
      else {
        this.showLoader = true;
        let response =  await this.SIGHStaking_stake_SIGH( { amountToBeStaked:  this.formData.sighQuantity } );
        if (response.status) {  
          await this.getAllowanceAndStakedBalance();
          let valueOfTotalStaked_SIGH = price * this.stakedSighBalance;
          this.$showSuccessMsg({message: "SIGH STAKING SUCCESS : " + this.formData.sighQuantity + "  " +  this.sighInstrument.symbol +  " worth " + value + " USD has been successfully staked. You currently have " + this.stakedSighBalance + " SIGH having worth " + this.valueOfTotalStaked_SIGH + " USD Staked farming staking rewards for you. Enjoy farming SIGH Staking rewards!"  });
          this.$showInfoMsg({message: " Available allowance : " + this.availableAllowance + " SIGH" });           
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
      let value = price * this.formData.sighQuantity;

      console.log('Stak Sigh- ' + this.sighInstrument.address);
      console.log('Stak Sigh- ' + this.sighInstrument.symbol);
      console.log('Available Allowance - ' + this.availableAllowance );      
      console.log('UN-Stake Quantity - ' + this.formData.sighQuantity);
      console.log('UN-Stake Value - ' + value);
      console.log('UN-Stake Price - ' + price);     

      this.showLoader = true;
      let response =  await this.SIGHStaking_unstake_SIGH( { amountToBeUNStaked:  this.formData.sighQuantity } );
      if (response.status) {      
        await this.getAllowanceAndStakedBalance();
        let valueOfTotalStaked_SIGH = price * this.stakedSighBalance;
        this.$showSuccessMsg({message: "SIGH UN-STAKING SUCCESS : " + this.formData.sighQuantity + "  " +  this.sighInstrument.symbol +  " worth " + value + " USD has been successfully un-staked. You currently have " + this.stakedSighBalance + " SIGH having worth " + this.valueOfTotalStaked_SIGH + " USD Staked farming staking rewards for you! " });
        this.$showInfoMsg({message: " Available allowance : " + this.availableAllowance + " SIGH" }); 
        this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Un-Staked',Service: 'STAKING'});
      }
      else {
        this.$showErrorMsg({message: "SIGH UN-STAKING FAILED : " + response.message  });
        this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
          // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
        }

        this.formData.sighQuantity = null;
        this.showLoader = false;      
    },
      


    async approve() {   //APPROVE (WORKS PROPERLY) - calls increaseAllowance() Function  // Need to handle tokens which do not have it implemented
      this.showLoader = true;
      console.log('Selected Instrument - ')
      console.log(this.sighInstrument);
      console.log('Quantity to be Approved - ' + this.formData.sighQuantity);
      let price = (this.sighInstrument.price / Math.pow(10,this.sighInstrument.priceDecimals)).toFixed(4);
      let value = price * this.formData.sighQuantity;
      console.log('Instrument Price - ' + price);
      let response = await this.ERC20_increaseAllowance( { tokenAddress: this.sighInstrument.address, spender: this.$store.getters.sighStakingContractAddress , addedValue:  this.formData.sighQuantity } );
      if (response.status) { 
        await this.getAllowanceAndStakedBalance();        
        this.$showSuccessMsg({message: "APPROVAL SUCCESS : Maximum of " + this.availableAllowance + "  " +  this.sighInstrument.symbol +  " can now be deposited to SIGH Finance. Gas used = " + response.gasUsed  });
        this.formData.sighQuantity = null;
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
      console.log( this.stakedSighBalance + " SIGH worth " + value + " USD currently staked. Addition SIGH that can be Staked =  " + this.availableAllowance + " SIGH"  );
    }
    
  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changesighInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
