<script setup lang="ts">
import { useTemplateRef } from "vue";

const inputEl = useTemplateRef("inputEl");

function go() {
  // plant: inferred HTMLInputElement has no `notAMethod`
  // @plant-error
  inputEl.value?.notAMethod();
}
</script>

<template>
  <input ref="inputEl" @focus="go" />
</template>
