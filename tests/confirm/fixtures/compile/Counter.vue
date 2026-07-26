<script setup>
import { ref } from "vue";
const count = ref(0);
function inc() {
  count.value++;
}
</script>

<template>
  <div class="counter">
    <span class="value" data-testid="value">{{ count }}</span>
    <button type="button" class="inc" data-testid="inc" @click="inc">+</button>
  </div>
</template>
