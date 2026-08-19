<script setup lang="ts">
import { defineAsyncComponent } from "vue";

const Child = defineAsyncComponent(() => import("./Child.vue"));
</script>

<template>
  <Child :count="1" />
</template>
