<script setup lang="ts" generic="T extends string | number">
const model = defineModel<T>({ required: true });
</script>

<template>
  <span>{{ model }}</span>
</template>
