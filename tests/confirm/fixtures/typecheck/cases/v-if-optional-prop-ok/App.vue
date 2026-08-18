<script setup lang="ts">
defineProps<{
  label?: string;
}>();
</script>

<template>
  <span v-if="label">{{ label.toUpperCase() }}</span>
</template>
