<script setup>
const emit = defineEmits({
  submit: (payload) => typeof payload === "object" && payload !== null,
  cancel: () => true,
});
</script>

<template>
  <form @submit.prevent="emit('submit', { ok: true })">
    <button type="button" @click="emit('cancel')">cancel</button>
  </form>
</template>
