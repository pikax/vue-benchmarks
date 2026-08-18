<script setup lang="ts">
defineOptions({ inheritAttrs: false });
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="child-root">{{ title }}</div>
</template>
