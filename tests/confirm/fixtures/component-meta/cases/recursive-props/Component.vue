<script setup lang="ts">
export type TreeNode = {
  id: number;
  label: string;
  children?: TreeNode[];
  parent?: TreeNode;
};

defineProps<{
  root: TreeNode;
  depth?: number;
}>();

defineSlots<{
  node(props: { node: TreeNode; depth: number }): any;
}>();
</script>

<template>
  <div>
    <slot name="node" :node="root" :depth="depth ?? 0" />
  </div>
</template>
