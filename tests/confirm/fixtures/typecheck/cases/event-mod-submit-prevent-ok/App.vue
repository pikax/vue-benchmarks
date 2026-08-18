<script setup lang="ts">
function onSubmit(e: Event) {
  console.log(e.type);
}
</script>

<template>
  <form @submit.prevent="onSubmit">
    <button type="submit">go</button>
  </form>
</template>
