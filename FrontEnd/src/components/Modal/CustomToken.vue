<template>
  <UiModal :open="open" @close="$emit('close')">
    <div class="modal-body p-6 d-flex flex-items-center text-red">
      <Icon name="warning" class="mr-4" />
      <div>
        This could be a risky pool as it contains one or more tokens outside of
        our whitelist. A liquidity pool is only as good as its weakest token. If
        the token gets blacklisted, infinitely minted, or exploited in any other
        way, <b>the pool value can go to 0</b>. Sigh Finance is never liable
        for losses that happen using our UI or Sigh Finance protocol. Slow down and
        do your own research!
      </div>
    </div>
  </UiModal>
</template>

<script>
export default {
  props: ['open']
};
</script>
