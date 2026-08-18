<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <Child>
    <template #default="{ submit }">
      <button type="button" @click="submit(1)">go</button>
    </template>
  </Child>
</template>
