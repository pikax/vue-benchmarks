<script setup>
import { ref } from "vue";

const memoKey = ref(0);
const other = ref(0);
</script>

<template>
  <div class="v-memo">
    <span v-memo="[memoKey]" data-testid="memo">{{ memoKey }}-{{ other }}</span>
    <span data-testid="live">{{ other }}</span>
    <button type="button" data-testid="bump-other" @click="other++">o</button>
    <button type="button" data-testid="bump-key" @click="memoKey++">k</button>
  </div>
</template>
