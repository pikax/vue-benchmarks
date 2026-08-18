<script setup lang="ts">
const emit = defineEmits<{
  change: [value: number];
}>();

emit("change", 1);
</script>

<template>
  <button type="button" @click="emit('change', 2)">go</button>
</template>
