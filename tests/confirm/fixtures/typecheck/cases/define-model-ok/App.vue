<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const title = ref("ok");
const count = ref(0);
</script>

<template>
  <Child v-model:title="title" v-model:count="count" />
</template>
