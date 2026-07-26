<script setup>
import { ref } from "vue";
const num = ref(0);
const trimmed = ref("");
const lazy = ref("");
</script>

<template>
  <div class="v-model-modifiers">
    <input v-model.number="num" data-testid="num" />
    <p data-testid="num-type">{{ typeof num }}:{{ num }}</p>

    <input v-model.trim="trimmed" data-testid="trim" />
    <p data-testid="trim-value">[{{ trimmed }}]</p>

    <input v-model.lazy="lazy" data-testid="lazy" />
    <p data-testid="lazy-value">[{{ lazy }}]</p>
  </div>
</template>
