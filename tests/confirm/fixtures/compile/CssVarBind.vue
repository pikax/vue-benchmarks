<script setup>
import { ref } from "vue";
const themeColor = ref("rgb(1, 2, 3)");
</script>

<template>
  <div class="css-var-bind" data-testid="root">text</div>
</template>

<style scoped>
.css-var-bind {
  color: v-bind(themeColor);
}
</style>
