<script setup>
defineProps({
  show: { type: Boolean, default: false },
  label: { type: String, default: "secret" },
});
</script>

<template>
  <div class="conditional">
    <p v-if="show" data-testid="shown">{{ label }}</p>
    <p v-else data-testid="hidden">hidden</p>
  </div>
</template>
