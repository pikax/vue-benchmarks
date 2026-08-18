<script setup lang="ts">
import { ref } from "vue";

const user = ref<{ name: string } | null>({ name: "Ada" });

function greet(name: string) {
  console.log(name.toUpperCase());
}
</script>

<template>
  <!-- v-if must narrow `user` for both interpolation AND the v-on handler -->
  <button v-if="user" type="button" @click="greet(user.name)">
    {{ user.name }}
  </button>
</template>
