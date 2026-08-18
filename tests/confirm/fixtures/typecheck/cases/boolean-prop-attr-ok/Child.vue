<script setup lang="ts">
defineProps<{
  enabled: boolean;
}>();
</script>

<template>
  <span>{{ enabled ? "on" : "off" }}</span>
</template>
