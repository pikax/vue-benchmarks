<script setup lang="ts" generic="K extends string, V">
defineProps<{
  keyName: K;
  value: V;
}>();
</script>

<template>
  <span>{{ keyName }}:{{ value }}</span>
</template>
