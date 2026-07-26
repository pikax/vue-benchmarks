<script setup>
import { h } from "vue";

const MyPanel = {
  setup: (_props, { slots }) => () => h("div", slots.header ? slots.header() : null),
};
</script>

<template>
  <MyPanel>
    <span slot="header">h</span>
  </MyPanel>
</template>
