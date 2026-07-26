<script setup lang="ts">
import { ref } from "vue";

const user = ref<{ name: string } | null>({ name: "Ada" });

function handleClick() {
  // plant: user.value is still `{ name: string } | null` here —
  // template v-if does not narrow script closures.
  console.log(user.value.name);
}
</script>

<template>
  <button v-if="user" type="button" @click="handleClick">
    {{ user.name }}
  </button>
</template>
