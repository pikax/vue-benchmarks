<script setup>
import { ref } from "vue";
import MyWidget from "./MyWidget.vue";

const src = ref("/logo.png");
const text = ref("");
</script>

<template>
  <form>
    <img :src="src" alt="logo">
    <br>
    <input v-model="text" type="text">
    <hr />
    <MyWidget />
    <textarea v-model="text"></textarea>
  </form>
</template>
