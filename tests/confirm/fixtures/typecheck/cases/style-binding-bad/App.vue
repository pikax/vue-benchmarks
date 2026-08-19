<script setup lang="ts">
const notStyle = 123;
</script>

<template>
  <!-- plant: :style expects a CSS object / string / array, not a number -->
  <!-- @plant-error -->
  <div :style="notStyle">x</div>
</template>
