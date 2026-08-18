<script setup lang="ts" generic="T extends { id: number }">
defineProps<{
  item: T;
}>();
</script>

<template>
  <!-- plant: T is only known to have id; name is not on the constraint -->
  <span>{{ item.name }}</span>
</template>
