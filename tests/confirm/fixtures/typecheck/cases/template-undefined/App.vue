<script setup lang="ts">
const known = 1;
</script>

<template>
  <!-- plant: missingName is not defined in script -->
  <div>{{ known }} / {{ missingName }}</div>
</template>
