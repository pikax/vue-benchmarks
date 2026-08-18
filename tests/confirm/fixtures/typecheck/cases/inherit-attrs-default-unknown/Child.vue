<script setup lang="ts">
// no defineOptions — inheritAttrs default is true
defineProps<{
  title: string;
}>();
</script>

<template>
  <div class="child-root">{{ title }}</div>
</template>
