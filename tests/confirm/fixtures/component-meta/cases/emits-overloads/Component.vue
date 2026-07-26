<script setup lang="ts">
const emit = defineEmits<{
  (event: "save", id: number): void;
  (event: "save", id: number, force: boolean): void;
  (event: "cancel"): void;
}>();

function run() {
  emit("save", 1);
  emit("save", 1, true);
  emit("cancel");
}
</script>

<template>
  <button type="button" @click="run">go</button>
</template>
