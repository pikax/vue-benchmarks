<script setup>
defineProps({
  title: { type: String, required: true },
});
</script>

<template>
  <article class="card">
    <h2>{{ title }}</h2>
    <p>Clean component with no intentional lint issues.</p>
  </article>
</template>
