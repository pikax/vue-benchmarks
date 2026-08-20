<script setup>
import { h } from "vue";

const Card = { setup: (_, { slots }) => () => h("div", slots.header?.()) };
</script>

<template>
  <Card>
    <template #header.foo>Title</template>
  </Card>
</template>
