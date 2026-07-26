<script setup>
defineOptions({ inheritAttrs: true });
defineProps({
  title: { type: String, required: true },
});
</script>

<template>
  <div class="attrs-root" data-testid="root">{{ title }}</div>
</template>
