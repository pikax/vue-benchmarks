<script setup>
import { h, ref } from "vue";

const Counter = {
  name: "KeepCounter",
  setup() {
    const n = ref(0);
    return () =>
      h(
        "button",
        {
          type: "button",
          "data-testid": "count",
          onClick: () => n.value++,
        },
        String(n.value),
      );
  },
};

const Other = { setup: () => () => h("span", { "data-testid": "other" }, "other") };

const showCounter = ref(true);

function toggle() {
  showCounter.value = !showCounter.value;
}
</script>

<template>
  <div class="keep-alive-host">
    <KeepAlive>
      <component :is="showCounter ? Counter : Other" />
    </KeepAlive>
    <button type="button" data-testid="toggle" @click="toggle">t</button>
  </div>
</template>
