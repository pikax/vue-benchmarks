<script setup>
import { ref } from "vue";

const themeColor = ref("#3366ff");
const spacing = ref("12px");
const theme = { accent: "rebeccapurple" };
</script>

<template>
  <p class="bound">CSS_VBIND_PLANT</p>
</template>

<style scoped>
.bound {
  color: v-bind(themeColor);
  padding: v-bind(spacing);
  border-color: v-bind('theme.accent');
}
</style>
