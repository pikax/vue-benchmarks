<script setup>
defineProps({
  label: { type: String, required: true },
  count: { type: Number, default: 1 },
  enabled: Boolean,
});

const emit = defineEmits(["submit", "cancel"]);
</script>

<template>
  <form @submit.prevent="emit('submit')">
    <span>{{ label }} / {{ count }} / {{ enabled }}</span>
    <button type="button" @click="emit('cancel')">cancel</button>
  </form>
</template>
