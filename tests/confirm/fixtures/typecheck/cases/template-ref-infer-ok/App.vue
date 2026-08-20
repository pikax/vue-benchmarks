<script setup lang="ts">
import { onMounted, useTemplateRef } from "vue";

const inputEl = useTemplateRef("inputEl");

onMounted(() => {
  inputEl.value?.focus();
});
</script>

<template>
  <input ref="inputEl" />
</template>
