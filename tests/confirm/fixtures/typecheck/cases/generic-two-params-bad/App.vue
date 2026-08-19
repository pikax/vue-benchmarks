<script setup lang="ts">
import Child from "./Child.vue";

function takesString(s: string) {
  return s.toUpperCase();
}
</script>

<template>
  <!-- plant: value is inferred as number from :value="1"; takesString wants string -->
  <!-- @plant-error -->
  <Child key-name="id" :value="1" #default="{ value }">{{ takesString(value) }}</Child>
</template>
