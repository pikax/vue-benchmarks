<script setup>
import { h } from "vue";

const MyButton = { setup: () => () => h("button") };

function onClick() {}
</script>

<template>
  <MyButton @click.native="onClick" />
</template>
