<script setup lang="ts">
defineOptions({ inheritAttrs: true });
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="child-root">{{ title }}</div>
</template>
