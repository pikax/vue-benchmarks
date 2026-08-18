<script setup lang="ts">
import { ref } from "vue";
import Child from "./Child.vue";

const on = ref(true);
</script>

<template>
  <!-- inheritAttrs false: even a guaranteed single root must not accept undeclared id -->
  <Child title="ok" :on="on" id="outer" />
</template>
