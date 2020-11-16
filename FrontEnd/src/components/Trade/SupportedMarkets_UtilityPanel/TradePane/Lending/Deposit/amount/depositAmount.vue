<template src="./template.html"></template>

<script>
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import {mapState,mapActions,} from 'vuex';
import Web3 from 'web3';

export default {

  name: 'depositAmount',

  data() {
    return {
      selectedInstrument: this.$store.state.currentlySelectedInstrument,
      formData : {
        depositQuantity: null,
        depositValue: null,
        enteredReferralCode: 0,
      },
      availableAllowance: null,
      showLoader: false,
      // showApproveButton: true,
      // showConfirm: false,
    };
  },
  

  created() {
    console.log("IN LENDING / DEPOSIT / AMOUNT (TRADE-PANE) FUNCTION ");
    this.selectedInstrument = this.$store.state.currentlySelectedInstrument;
    this.updateAvailableAllowance(false);
    this.changeSelectedInstrument = (selectedInstrument_) => {       //Changing Selected Instrument
      this.selectedInstrument = selectedInstrument_.instrument;        
      console.log('DEPOSIT : changeSelectedInstrument - ');
      console.log(this.selectedInstrument);
      this.updateAvailableAllowance(false);
    };
    ExchangeDataEventBus.$on('change-selected-instrument', this.changeSelectedInstrument);        
  },


  computed: {
    calculatedQuantity() {
        console.log('calculatedQuantity');
        if (this.selectedInstrument && this.selectedInstrument.priceDecimals) {
          console.log(this.selectedInstrument);
          this.formData.depositQuantity = Number((this.formData.depositValue) / (this.selectedInstrument.price / Math.pow(10,this.selectedInstrument.priceDecimals))).toFixed(4) ; 
          console.log('depositQuantity (computed) ' + this.formData.depositQuantity);          
          return this.formData.depositQuantity;
          }
      return 0;
    }
  },

  methods: {

    ...mapActions(['LendingPool_deposit','ERC20_increaseAllowance','ERC20_getAllowance','ERC20_mint','getInstrumentPrice']),
    
    async deposit() {   //DEPOSIT (WORKS PROPERLY)

      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }       
      else {
        let currentPrice = await this.getInstrumentPrice({_instrumentAddress: this.selectedInstrument.instrumentAddress });
        let price = (currentPrice / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
        let quantity = this.formData.depositValue / price;
        console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
        console.log('Available Allowance - ' + this.availableAllowance );      
        console.log('Deposit Quantity - ' + this.formData.depositQuantity);
        console.log('Deposit Value - ' + value);
        console.log('Instrument Price - ' + price);     

        // WHEN THE ALLOWANCE IS LESS THAN WHAT IS NEEDED
        if ( Number(quantity) >  Number(this.availableAllowance)  ) {
          let dif = quantity - this.availableAllowance;
          this.$showErrorMsg({message: " You first need to 'APPROVE' an amount greater than " + dif + " " + this.selectedInstrument.symbol + " so that the deposit can be processed through the ERC20 Interface's transferFrom() Function."}); // this.formData.depositQuantity + "  " + this.selectedInstrument.symbol +  " worth " + value + " USD approval failed. Try increasing Gas or contact our team at contact@sigh.finance in case of any queries." });        
          this.$showInfoMsg({message: "Available Allowance : " + this.availableAllowance + " " + this.selectedInstrument.symbol });        
        }
        // WHEN ALLOWANCE CONDITION IS MET SO THE TRANSACTION GOES THROUGH
        else {
          this.showLoader = true;          
          let response =  await this.LendingPool_deposit( { _instrument: this.selectedInstrument.instrumentAddress , _amount:  quantity, _referralCode: this.formData.enteredReferralCode } );
          if (response.status) {      
            this.$showSuccessMsg({message: "DEPOSIT SUCCESS : " + quantity + "  " +  this.selectedInstrument.symbol +  " worth " + this.formData.depositValue + " USD was successfully deposited to SIGH Finance. Gas used = " + response.gasUsed });
            await this.updateAvailableAllowance(true);
            this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
          }
          else {
            this.$showErrorMsg({message: "DEPOSIT FAILED : " + response.message  }); // this.formData.depositQuantity + "  " + this.selectedInstrument.symbol +  " worth " + value + " USD approval failed. Try increasing Gas or contact our team at contact@sigh.finance in case of any queries." });        
            this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); // this.formData.depositQuantity + "  " + this.selectedInstrument.symbol +  " worth " + value + " USD approval failed. Try increasing Gas or contact our team at contact@sigh.finance in case of any queries." });        
            // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
          }
          this.formData.depositValue = null;
          this.showLoader = false;
        }
      }
    },

    async mint() {
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }       
      else if (this.$store.state.networkId != '42' ) { 
        this.$showErrorMsg({message: " Mock tokens are not available for testing over the currently connected Network. "}); 
      }
      else {
        let currentPrice = await this.getInstrumentPrice({_instrumentAddress: this.selectedInstrument.instrumentAddress });
        if (Number(currentPrice) > 0) {
          let price = (currentPrice / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
          let quantity_ = this.formData.depositValue / price ;
          console.log('Selected Instrument - ' + this.selectedInstrument.symbol);
          console.log('Deposit (Mint) Quantity - ' + quantity_);
          console.log('Deposit Value - ' + this.formData.depositValue);
          console.log('Instrument Price - ' + price);     
          this.showLoader = true;
          let response = await this.ERC20_mint({tokenAddress: this.selectedInstrument.instrumentAddress , quantity: quantity_ });
          if (response.status) {      
            this.$showSuccessMsg({message: "DEPOSIT (MINT) SUCCESS : " + quantity_ + "  " +  this.selectedInstrument.symbol +  " worth " + this.formData.depositValue + " USD was successfully minted for testing. Gas used = " + response.gasUsed });
            await this.updateAvailableAllowance(true);
            this.$store.commit('addTransactionDetails',{status: 'success',Hash:response.transactionHash, Utility: 'Minting',Service: 'LENDING'});
          }
          else {
            this.$showErrorMsg({message: "DEPOSIT (MINT) FAILED : " + response.message  }); 
            this.$showInfoMsg({message: " Reach out to our Team at contact@sigh.finance in case you are facing any problems!" }); 
            // this.$store.commit('addTransactionDetails',{status: 'failure',Hash:response.message.transactionHash, Utility: 'Deposit',Service: 'LENDING'});
          }
          this.formData.depositValue = null;
          this.showLoader = false;

        }
        else {
          this.$showErrorMsg({message: " The Price returned by the price Oracle is not Valid. Please try again or try refreshing your connection!"}); 
        }        
      }
    },
      

    async approve() {   //APPROVE (WORKS PROPERLY)
      if ( !this.$store.state.web3 || !this.$store.state.isNetworkSupported ) {       // Network Currently Connected To Check
        this.$showErrorMsg({message: " SIGH Finance currently doesn't support the connected Decentralized Network. Currently connected to \" +" + this.$store.getters.networkName }); 
        this.$showInfoMsg({message: " Networks currently supported - Ethereum :  Kovan Testnet (42) " }); 
      }
      else if ( !Web3.utils.isAddress(this.$store.state.connectedWallet) ) {       // Connected Account not Valid
        this.$showErrorMsg({message: " The wallet currently connected to the protocol is not supported by SIGH Finance ( check-sum check failed). Try re-connecting your Wallet or contact our support team at contact@sigh.finance in case of any queries! "}); 
      }       
      else {       // WHEN ABOVE CONDITIONS ARE MET SO THE TRANSACTION GOES THROUGH
        this.showLoader = true;
        console.log('Selected Instrument - ')
        console.log(this.selectedInstrument);
        let currentPrice = await this.getInstrumentPrice({_instrumentAddress: this.selectedInstrument.instrumentAddress });
        let price = (currentPrice / Math.pow(10,this.selectedInstrument.priceDecimals)).toFixed(4);
        let quantity = this.formData.depositValue / price;
        console.log('Instrument Price - ' + price);
        console.log('Quantity to be Approved - ' + quantity);
        let response = await this.ERC20_increaseAllowance( { tokenAddress: this.selectedInstrument.instrumentAddress, spender: this.$store.getters.LendingPoolCoreContractAddress , addedValue:  quantity } );
        if (response.status) { 
          this.$showSuccessMsg({message: "APPROVAL SUCCESS : " + quantity + "  " +  this.selectedInstrument.symbol +  " worth " + value + " USD can now be deposited to SIGH Finance. Gas used = " + response.gasUsed  });
          this.formData.depositValue = null;
          await this.updateAvailableAllowance(true);
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

    async updateAvailableAllowance(toDisplay) {
      this.availableAllowance = await this.ERC20_getAllowance({tokenAddress: this.selectedInstrument.instrumentAddress, owner: this.$store.getters.connectedWallet, spender: this.$store.getters.LendingPoolCoreContractAddress });
      console.log(this.availableAllowance);
      if (toDisplay) {
        this.$showInfoMsg({message: "Available Allowance : " + this.availableAllowance + " " + this.selectedInstrument.symbol });        
      }
      console.log( 'Current available allowance for ' + this.selectedInstrument.symbol + " is " + this.availableAllowance );
    }
  },

  destroyed() {
    ExchangeDataEventBus.$off('change-selected-instrument', this.changeSelectedInstrument);    
  },
};
</script>

<style lang="scss" src="./style.scss" scoped></style>
