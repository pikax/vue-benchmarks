<script setup>
import { ref } from "vue";

const other = ref(0);
</script>

<template>
  <div class="v-once">
    <span v-once data-testid="once">{{ other }}</span>
    <span data-testid="live">{{ other }}</span>
    <button type="button" data-testid="bump" @click="other++">o</button>
  </div>
</template>
