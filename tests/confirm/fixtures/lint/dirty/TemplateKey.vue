<script setup>
const show = true;
</script>

<template>
  <div>
    <template :key="show">
      <span v-if="show">visible</span>
    </template>
  </div>
</template>
