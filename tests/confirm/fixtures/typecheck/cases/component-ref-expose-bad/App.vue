<script setup lang="ts">
import { useTemplateRef } from "vue";
import Child from "./Child.vue";

const child = useTemplateRef("child");

function go() {
  // plant: hide was not defineExpose'd
  // @plant-error
  child.value?.hide();
}
</script>

<template>
  <Child ref="child" />
  <button type="button" @click="go">go</button>
</template>
