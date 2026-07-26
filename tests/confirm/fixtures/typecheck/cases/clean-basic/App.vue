<script setup lang="ts">
import { ref, computed } from "vue";

const count = ref(0);
const doubled = computed(() => count.value * 2);

function inc() {
  count.value += 1;
}
</script>

<template>
  <div>
    <p>{{ count }} / {{ doubled }}</p>
    <button type="button" @click="inc">inc</button>
  </div>
</template>
