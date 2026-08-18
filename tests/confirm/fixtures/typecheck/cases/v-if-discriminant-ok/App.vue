<script setup lang="ts">
import { ref } from "vue";

type Dog = { kind: "dog"; bark: () => string };
type Cat = { kind: "cat"; meow: () => string };

const pet = ref<Dog | Cat>({ kind: "dog", bark: () => "woof" });
</script>

<template>
  <div v-if="pet.kind === 'dog'">{{ pet.bark() }}</div>
  <div v-else>{{ pet.meow() }}</div>
</template>
