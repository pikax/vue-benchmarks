<script setup lang="ts">
const title = defineModel<string>("title", { required: true });
const count = defineModel<number>("count", { default: 0 });
</script>

<template>
  <div>
    <input :value="title" @input="title = ($event.target as HTMLInputElement).value" />
    <span>{{ count }}</span>
  </div>
</template>
