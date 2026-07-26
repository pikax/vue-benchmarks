<script>
import { h } from "vue";

export default {
  components: {
    UnusedPanel: { setup: () => () => h("div") },
  },
};
</script>

<template>
  <div>nothing renders UnusedPanel</div>
</template>
