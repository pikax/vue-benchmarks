<script setup lang="ts">
import { ref } from "vue";

const user = ref<{ name: string } | null>(null);

function greet(name: string) {
  console.log(name.toUpperCase());
}
</script>

<template>
  <!-- plant: no v-if, so user may be null when the handler reads .name -->
  <!-- @plant-error -->
  <button type="button" @click="greet(user.name)">go</button>
</template>
