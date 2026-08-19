<script setup lang="ts">
import { ref } from "vue";

type Dog = { kind: "dog"; bark: () => string };
type Cat = { kind: "cat"; meow: () => string };

const pet = ref<Dog | Cat>({ kind: "dog", bark: () => "woof" });
</script>

<template>
  <!-- plant: dog branch has bark, not meow -->
  <!-- @plant-error -->
  <div v-if="pet.kind === 'dog'">{{ pet.meow() }}</div>
</template>
