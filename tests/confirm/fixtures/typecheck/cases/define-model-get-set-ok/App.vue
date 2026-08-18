<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const text = ref("ok");
</script>

<template>
  <Child v-model="text" />
</template>
