<template src="./template.html"></template>

<script>

export default {
  name: 'vega-deposit-address',
  components: {
  },
  
  data() {
    return {
      destinationAddress: '',
      vegaMethodTypes: [],
    };
  },

  methods: {
    copyReferral() {
      let copyText = document.querySelector('#destination_Address');
      copyText.select();
      copyText.select();
      document.execCommand('copy');
      // alert("Copied the text: " + copyText.value);
      this.$showSuccessMsg({ message: 'Wallet Address copied successfully.', });
    }, 
  },
};
</script>
<style lang="scss" src="./style.scss" scoped>

</style>
