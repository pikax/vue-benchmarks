<script setup>
import { onMounted, ref } from "vue";

// `ref="box"` must be wired to the setup binding (ref_key), not just $refs.
const box = ref(null);
const tag = ref("none");

onMounted(() => {
  tag.value = box.value ? `${box.value.tagName.toLowerCase()}#${box.value.id}` : "missing";
});
</script>

<template>
  <div class="template-ref">
    <section id="target-box" ref="box" data-testid="box">content</section>
    <span data-testid="tag">{{ tag }}</span>
  </div>
</template>
