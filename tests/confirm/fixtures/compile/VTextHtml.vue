<script setup>
const msg = "compiled";
const markup = "<b data-testid='bold'>bold</b>";
</script>

<template>
  <div class="v-text-html">
    <span v-text="msg" data-testid="text"></span>
    <span v-html="markup" data-testid="html"></span>
  </div>
</template>
