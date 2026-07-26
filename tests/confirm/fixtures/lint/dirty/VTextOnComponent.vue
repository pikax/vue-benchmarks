<script setup>
import { h } from "vue";

const MyBox = { setup: () => () => h("div") };
const msg = "text";
</script>

<template>
  <MyBox v-text="msg" />
</template>
