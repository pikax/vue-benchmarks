<script setup lang="ts">
function onKey(e: MouseEvent) {
  console.log(e.button);
}
</script>

<template>
  <!-- plant: @keyup is KeyboardEvent, handler expects MouseEvent -->
  <!-- @plant-error -->
  <input @keyup="onKey" />
</template>
