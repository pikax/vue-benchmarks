<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!-- alwaysOn is the literal true type, so v-if is statically the single div root -->
  <Child title="ok" :alwaysOn="true" id="outer" />
</template>
