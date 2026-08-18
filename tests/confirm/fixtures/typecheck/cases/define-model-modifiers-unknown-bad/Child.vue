<script setup lang="ts">
const [model] = defineModel<string, "trim" | "capitalize">({ required: true });
</script>

<template>
  <span>{{ model }}</span>
</template>
