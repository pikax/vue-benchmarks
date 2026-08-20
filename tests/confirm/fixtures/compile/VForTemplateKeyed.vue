<script setup>
import { ref } from "vue";

const rows = ref([
  { id: "a", label: "Alpha" },
  { id: "b", label: "Beta" },
  { id: "c", label: "Gamma" },
]);

function rotate() {
  const [first, ...rest] = rows.value;
  rows.value = [...rest, first];
}
</script>

<template>
  <ul class="v-for-template">
    <template v-for="({ id, label }, i) in rows" :key="id">
      <li :data-id="id" data-testid="row">{{ i }}:{{ label }}</li>
    </template>
  </ul>
  <button type="button" data-testid="rotate" @click="rotate">r</button>
</template>
