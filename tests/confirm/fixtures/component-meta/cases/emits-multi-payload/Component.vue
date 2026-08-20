<script setup lang="ts">
const emit = defineEmits<{
  move: [x: number, y: number];
  toggle: [value?: boolean];
  "item-click": [id: number, meta: { shift: boolean }];
}>();

function fire() {
  emit("move", 1, 2);
  emit("toggle");
  emit("item-click", 7, { shift: true });
}
</script>

<template>
  <button type="button" @click="fire">go</button>
</template>
