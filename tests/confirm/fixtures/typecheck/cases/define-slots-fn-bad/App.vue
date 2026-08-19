<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <Child>
    <template #default="{ submit }">
      <!-- plant: submit expects number -->
      <!-- @plant-error -->
      <button type="button" @click="submit('nope')">go</button>
    </template>
  </Child>
</template>
