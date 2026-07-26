<script setup>
import { ref } from "vue";

const visible = ref(true);

function toggle() {
  visible.value = !visible.value;
}
</script>

<template>
  <div class="v-show-toggle">
    <span v-show="visible" data-testid="shown">body</span>
    <button type="button" data-testid="toggle" @click="toggle">t</button>
  </div>
</template>
