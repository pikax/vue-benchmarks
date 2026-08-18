<script setup lang="ts">
function onKey(e: KeyboardEvent) {
  console.log(e.key);
}
</script>

<template>
  <input @keyup.enter="onKey" />
</template>
