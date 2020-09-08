<template>
  <UiModal :open="open" @close="$emit('close')" style="max-width: 440px;">
    <!-- About heading -->
    <h3 class="m-4 mb-0 text-center">About</h3>
    <h4 class="m-4 mb-0 text-center" style="color=aqua;">This project is currently in BETA. Use it at your own Risk</h4>

  <!-- version, license, network -->
    <div class="m-4 mb-0 p-4 border rounded-2 text-white">
      <div class="d-flex">
        <span v-text="'Version'" class="flex-auto text-gray mr-1" />
        {{ pkg.version }}
      </div>
      <!-- <div class="d-flex">
        <span v-text="'License'" class="flex-auto text-gray mr-1" />
        {{ pkg.license }}
      </div> -->
      <div class="d-flex">
        <span v-text="'Network'" class="flex-auto text-gray mr-1" />
        {{ config.network === 'homestead' ? 'mainnet' : config.network }}
      </div>
    </div>

    <!-- Link to GITHUB Code Repository -->
    <div class="m-4">
      <a
        :href="`https://github.com/${pkg.repository}`"
        target="_blank"
        class="mb-2 d-block"
      >
        <UiButton class="button-outline width-full">
          <Icon name="github" class="mr-1" />
          {{ pkg.repository }}
          <Icon name="external-link" class="ml-1" />
        </UiButton>
      </a>
    </div>
  </UiModal>
</template>

<script>
import pkg from '@/../package.json';

export default {
  props: ['open'],
  data() {
    return {
      pkg
    };
  }
};
</script>
