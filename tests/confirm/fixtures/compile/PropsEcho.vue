<script setup>
const props = defineProps({
  title: { type: String, required: true },
  count: { type: Number, default: 0 },
});
</script>

<template>
  <div class="props-echo">
    <h1 data-testid="title">{{ title }}</h1>
    <p data-testid="count">count={{ count }}</p>
  </div>
</template>
