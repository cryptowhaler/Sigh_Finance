<template src="./template.html"></template>

<script>
import EventBus, { EventNames, } from '../../eventBuses/default';
import ExchangeDataEventBus from '@/eventBuses/exchangeData';
import ValidatorUtils from '../../utils/validator';

export default {
  name: 'contact',
 
  data: function() {
    return {
      form: {
        name: '',
        emailAddress: '',
        phoneNumber: '',
        response: [],
        message:'',
      }
    };
  },
  // mounted: {

  // },

  methods: {

    encode(data) {
      return Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&')
    },

    handleSubmit() {
      fetch('/', {
        method: 'post',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: this.encode({
          'form-name': 'CONTACT_FORM',
          ...this.form
        })
      }).then(() => { 
        // console.log('successfully sent Contact form content');
        // console.log('next line in then');
        this.showContactModal();       //Close login Modal (box)
        this.$showSuccessMsg({message: 'Your message has been successfully submitted. Our representative will contact you shortly',});


      })
      .catch( e => { 
        // console.log(e);
        // console.log('next line in catch');
        this.showContactModal();       //Close login Modal (box)
        this.$showErrorMsg({message: 'Your message could not be submitted. Please try again',}); 
        })
      //   console.log('next line');
      // this.$emit('show-contact-modal');         //Close login Modal (box)
    },
    
    showContactModal() {        //Added
      // console.log('chfetr');
      this.$store.commit('closeSidebar');
      this.$emit('show-contact-modal');
    },
  },
};
</script>



<style lang="scss" src="./style.scss" scoped>
</style>
