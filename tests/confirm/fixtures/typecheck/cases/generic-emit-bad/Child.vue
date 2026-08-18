<script setup lang="ts" generic="T">
defineProps<{
  value: T;
}>();
defineEmits<{
  change: [value: T];
}>();
</script>

<template>
  <button type="button">{{ value }}</button>
</template>
