<script setup>
defineOptions({ inheritAttrs: false });
defineProps({
  title: { type: String, required: true },
});
</script>

<template>
  <div class="attrs-root" data-testid="root">{{ title }}</div>
</template>
