<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <Child :item="{ id: 1 }" id="outer" />
</template>
