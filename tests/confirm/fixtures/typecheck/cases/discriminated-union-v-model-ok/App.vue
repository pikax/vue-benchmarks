<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const n = ref(1);
</script>

<template>
  <Child kind="num" v-model:n="n" />
</template>
