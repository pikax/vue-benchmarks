<script setup lang="ts">
const title = defineModel<string>("title", { required: true });
const count = defineModel<number>("count", { default: 0 });
</script>

<template>
  <span>{{ title }}:{{ count }}</span>
</template>
