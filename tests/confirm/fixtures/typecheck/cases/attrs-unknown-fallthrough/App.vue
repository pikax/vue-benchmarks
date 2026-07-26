<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- plant: id is not in props and not in AllowedComponentProps (class/style only) -->
  <Child title="ok" id="outer" />
</template>
