<script setup>
import { computed, h, ref } from "vue";

const Row = {
  setup: (_props, { slots }) => () => h("li", slots.default ? slots.default({ n: 1 }) : null),
};

const items = ref([{ id: 1, label: "a" }]);
const query = ref("");
const filtered = computed(() => items.value.filter((item) => item.label.includes(query.value)));

function submit() {
  query.value = query.value.trim();
}
</script>

<template>
  <section class="clean-advanced">
    <form @submit.prevent="submit">
      <input v-model.trim="query" type="search" aria-label="Search items" />
    </form>

    <ul>
      <Row v-for="item in filtered" :key="item.id">
        <template #default="{ n }">{{ n }}. {{ item.label }}</template>
      </Row>
    </ul>

    <p v-if="filtered.length === 0">No matches</p>
    <p v-else>{{ filtered.length }} match(es)</p>
  </section>
</template>
