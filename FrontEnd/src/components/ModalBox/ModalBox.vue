<template src='./template.html'></template>

<script>
import Contact from '@/components/Contact/Contact.vue';

export default {
  name: 'modal-box',
  components: {
    Contact,
  },
  props: {
    internalComponent: {
      required: true,
    },
    show: {
      default: false,
    },
  },
  methods: {
    closeModal() {
      this.$emit('modal-closed');
    },
    updateShow(show) {
      if (this.show && !show) {
        this.closeModal();
      }
    },
    handleKeyUp(keyboardEvent) {
      if (keyboardEvent.keyCode === 27) {
        this.closeModal();
      }
    },
  },
};
</script>
