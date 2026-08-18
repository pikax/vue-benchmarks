<script setup lang="ts">
</script>

<template>
  <!-- plant: .prevent does not change $event from MouseEvent -->
  <button type="button" @click.prevent="$event.key">go</button>
</template>
