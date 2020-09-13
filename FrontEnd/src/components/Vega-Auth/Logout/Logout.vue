<template src="./template.html">  </template>

<script>
import VegaWalletService from '../../../services/Vega-WalletService';
import EventBus, { EventNames, } from '../../../eventBuses/default';

export default {
  name: 'vega-logout',

  data: function() {
    return {
      res:[],
    };
  },

  methods: {

    async executelogout() {
      this.res = await VegaWalletService.logoutfromVega();
      if (this.res) {
        if (this.res.status == 200) {
          // console.log(this.res.status, this.res.msg);                
          EventBus.$emit(EventNames.userLogout);               //User has logged out (event)
          this.$showSuccessMsg({ message: 'Logged Out Successfully',});
        } 
        else {
          // console.log(this.res.status, this.res.msg);   
          this.$showErrorMsg({message: this.res.msg,});               
        }
      }
      else {
        // console.log('Something went wrong. Please try again.');
        this.$showErrorMsg({message: 'Something went wrong. Please try again.',});
      }
      this.$emit('show-logout-modal');    //Close logout box
    },
  },
};
</script>



<style lang="scss" src="./style.scss" scoped>  </style>
