<script setup lang="ts" generic="T extends { id: number; label: string }">
defineProps<{
  item: T;
}>();
defineSlots<{
  default(props: { item: T }): unknown;
}>();
</script>

<template>
  <div>
    <slot :item="item" />
  </div>
</template>
