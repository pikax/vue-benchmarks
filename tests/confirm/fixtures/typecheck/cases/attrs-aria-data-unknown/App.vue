<script setup lang="ts">
import Child from "./Child.vue";
</script>

<template>
  <!--
    plant: neither aria-zzz nor data-x is declared, and neither is part of
    AllowedComponentProps. A hyphen (or a well-known prefix) is not an exemption
    from strictTemplates — `foo-bar="1"` on the same component does error.
  -->
  <Child title="ok" aria-zzz="1" data-x="1" />
</template>
