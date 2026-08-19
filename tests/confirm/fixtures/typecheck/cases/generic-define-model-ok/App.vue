<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const value = ref("ok");
</script>

<template>
  <Child v-model="value" />
</template>
