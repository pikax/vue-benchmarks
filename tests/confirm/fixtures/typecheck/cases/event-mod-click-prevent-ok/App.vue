<script setup lang="ts">
function onClick(e: MouseEvent) {
  console.log(e.button);
}
</script>

<template>
  <button type="button" @click.prevent="onClick">go</button>
</template>
