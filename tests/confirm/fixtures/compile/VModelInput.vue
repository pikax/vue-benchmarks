<script setup>
import { ref } from "vue";
const text = ref("initial");
</script>

<template>
  <div class="v-model-input">
    <input v-model="text" data-testid="input" />
    <p data-testid="echo">{{ text }}</p>
  </div>
</template>
