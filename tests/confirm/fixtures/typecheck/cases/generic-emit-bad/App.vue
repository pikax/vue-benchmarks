<script setup lang="ts">
import Child from "./Child.vue";

function onChange(value: string) {
  console.log(value.toUpperCase());
}
</script>

<template>
  <!-- plant: T is number from :value="1"; handler expects string -->
  <!-- @plant-error -->
  <Child :value="1" @change="onChange" />
</template>
