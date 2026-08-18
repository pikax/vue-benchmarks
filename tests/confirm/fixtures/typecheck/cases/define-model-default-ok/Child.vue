<script setup lang="ts">
const model = defineModel<string>({ required: true });
</script>

<template>
  <span>{{ model }}</span>
</template>
