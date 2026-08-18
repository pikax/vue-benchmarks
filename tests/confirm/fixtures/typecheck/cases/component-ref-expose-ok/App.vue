<script setup lang="ts">
import { useTemplateRef } from "vue";
import Child from "./Child.vue";

const child = useTemplateRef("child");

function go() {
  child.value?.focus();
}
</script>

<template>
  <Child ref="child" />
  <button type="button" @click="go">go</button>
</template>
