<script setup lang="ts">
function onKey(e: KeyboardEvent) {
  console.log(e.key);
}
</script>

<template>
  <!-- plant: .prevent does not rewrite @click as KeyboardEvent -->
  <button type="button" @click.prevent="onKey">go</button>
</template>
