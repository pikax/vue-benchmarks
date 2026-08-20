<template lang="pug">
.wrapper
  h1.title CONFIRM_PUG_TITLE
  ul
    li(v-for="item in items" :key="item") {{ item }}
</template>

<script setup>
const items = ["a", "b"];
</script>
