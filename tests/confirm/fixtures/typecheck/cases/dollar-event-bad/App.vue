<script setup lang="ts">
</script>

<template>
  <!-- plant: MouseEvent has no notAMethod -->
  <button type="button" @click="$event.notAMethod()">go</button>
</template>
