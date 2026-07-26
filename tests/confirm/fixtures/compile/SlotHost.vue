<script setup>
defineProps({
  heading: { type: String, default: "Slot host" },
});
</script>

<template>
  <section class="slot-host">
    <h2 data-testid="heading">{{ heading }}</h2>
    <div class="body" data-testid="slot">
      <slot>fallback</slot>
    </div>
  </section>
</template>
