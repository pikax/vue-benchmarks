<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- inheritAttrs default + single root: id falls through to the native div -->
  <Child title="ok" id="outer" />
</template>
