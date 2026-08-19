<script setup>
import { computed, ref } from "vue";

const label = ref("hello");
const shout = computed(() => label.value.toUpperCase());
</script>

<template>
  <section class="box">
    <p>{{ shout }}</p>
    <input v-model="label" type="text" />
  </section>
</template>

<style scoped>
.box {
  display: flex;
  gap: 8px;
}
</style>
