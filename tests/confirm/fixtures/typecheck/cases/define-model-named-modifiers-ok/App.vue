<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const title = ref("ok");
</script>

<template>
  <Child v-model:title.trim="title" />
</template>
