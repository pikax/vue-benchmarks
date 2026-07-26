<script setup lang="ts">
import { useTemplateRef } from "vue";

const inputEl = useTemplateRef<HTMLInputElement>("inputEl");

function go() {
  // plant: HTMLInputElement has no `notAMethod`
  inputEl.value?.notAMethod();
}
</script>

<template>
  <input ref="inputEl" @focus="go" />
</template>
