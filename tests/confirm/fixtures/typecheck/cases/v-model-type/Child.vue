<script setup lang="ts">
const model = defineModel<number>({ required: true });
</script>

<template>
  <input :value="model" @input="model = Number(($event.target as HTMLInputElement).value)" />
</template>
