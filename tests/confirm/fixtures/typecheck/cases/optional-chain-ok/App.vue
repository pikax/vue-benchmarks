<script setup lang="ts">
type User = { profile?: { name: string; nickname?: string } };

const user: User = {};
</script>

<template>
  <div>
    {{ user.profile?.name ?? "anon" }}
    {{ user.profile?.nickname?.toUpperCase() ?? "-" }}
  </div>
</template>
