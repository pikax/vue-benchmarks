<script setup>
const msg = "compiled";
</script>

<template>
  <div class="v-pre">
    <span v-pre data-testid="pre">{{ msg }}</span>
    <span data-testid="normal">{{ msg }}</span>
  </div>
</template>
