<template>
  <UiModal :open="open" @close="$emit('close')" style="max-width: 440px;">

    <!-- If the pop up is to connect wallet -->
    <div v-if="!web3.account || step === 'connect'">
      <h3 class="p-4 border-bottom text-center">Connect wallet</h3>
      <!-- Buttons (Metamask, Walletconnect, Portis, Coinbase, Fortmatic) -->
      <div class="m-4 mb-5">
        <a
          v-for="(connector, id, i) in config.connectors"
          :key="i"
          @click="$emit('login', connector.id)"
          target="_blank"
          class="mb-2 d-block"
        >
          <UiButton class="width-full v-align-middle">
            <img :src="`https://raw.githubusercontent.com/bonustrack/lock/master/connectors/assets/${connector.id}.png`"
              height="28"
              width="28"
              class="mr-2 v-align-middle"
            />
            {{ connector.name }}
          </UiButton>
        </a>
      </div>
    </div>

    <!-- When pop up is on clicking wallet (already logged in) -->
    <div v-else>
      <h3 class="p-4 border-bottom text-center">Account</h3>
      <div v-if="web3.account" class="m-4">
        <!-- etherscan link for account -->
        <a
          :href="_etherscanLink(web3.account)"
          target="_blank"
          class="mb-2 d-block"
        >
          <UiButton class="width-full">
            <Avatar :address="web3.account" size="16" class="mr-2 ml-n1" />
            <span v-if="web3.name" v-text="web3.name" />
            <span v-else v-text="_shorten(web3.account)" />
            <Icon name="external-link" class="ml-1" />
          </UiButton>
        </a>
        <!-- connect different wallet -->
        <UiButton @click="step = 'connect'" class="width-full mb-2">
          Connect Another wallet
        </UiButton>
        <!-- Logout -->
        <UiButton @click="handleLogout" class="width-full text-red mb-2">
          Log out
        </UiButton>
      </div>
    </div>
  </UiModal>
</template>

<script>
import { mapActions } from 'vuex';

export default {

  props: ['open'],

  data() {
    return {
      step: null
    };
  },

  watch: {
    open() {
      this.step = null;
    }
  },

  methods: {
    ...mapActions(['logout']),

    //Logout (in store)
    async handleLogout() {
      await this.logout();
      this.$emit('close');
    }
  }
};
</script>
