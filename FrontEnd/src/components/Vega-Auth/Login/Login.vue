<template src="./template.html"></template>

<script>
import VegaWalletService from '../../../services/Vega-WalletService';
import EventBus, { EventNames, } from '../../../eventBuses/default';
import ValidatorUtils from '../../../utils/validator';

export default {
  name: 'vega-login',
 
  data: function() {
    return {
      name: '',
      wallet: '',
      passphrase: '',
      response: [],
      msg:'',
    };
  },
  // mounted: {

  // },

  methods: {
    async executelogin() {
      // console.log(this.name, this.wallet, this.passphrase);
      if(!ValidatorUtils.isValidName(this.name)) {
        this.$showErrorMsg({message:'Please enter a valid name',});
      }
      else {
        this.response = await VegaWalletService.loginToVega(this.name,this.wallet,this.passphrase);
        // console.log(this.response);
        if (this.response) {
          this.msg = this.response.msg;
          if (this.response.status == 200) {
            // console.log(this.response.status, this.response.msg); 
            this.$emit('modal-closed');            
            EventBus.$emit(EventNames.userLogin, { username: this.name,}); //User has logged in (event)
            this.$showSuccessMsg({ message: 'Logged In Successfully',});
          } else {
            // console.log(this.response.status, this.response.msg); 
            this.$showErrorMsg({message: this.response.msg,});
          }
        } 
        else {
          this.msg = 'Invalid Response from Server.';
          // console.log(this.msg); 
          this.$showErrorMsg({message: this.msg,});
        }
        this.$emit('show-login-modal');         //Close login Modal (box)
      }
    },
  },
};
</script>



<style lang="scss" src="./style.scss" scoped>
</style>
