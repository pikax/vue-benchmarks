<script setup lang="ts">
defineOptions({ inheritAttrs: false });
defineProps<{
  title: string;
}>();
</script>

<template>
  <!-- intentionally does not re-bind $attrs -->
  <div class="child-root">{{ title }}</div>
</template>
