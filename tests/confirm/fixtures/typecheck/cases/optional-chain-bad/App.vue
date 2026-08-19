<script setup lang="ts">
type User = { profile?: { name: string } };

const user: User = {};
</script>

<template>
  <!-- plant: `profile` is optional, so the second hop needs ?. too -->
  <!-- @plant-error -->
  <div>{{ user.profile.name }}</div>
</template>
