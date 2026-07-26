import pluginVue from "eslint-plugin-vue";

export default [
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/require-default-prop": "off",
      "vue/require-explicit-emits": "off",
      "vue/html-self-closing": "off",
      "vue/max-attributes-per-line": "off",
      "vue/singleline-html-element-content-newline": "off",
      "vue/multiline-html-element-content-newline": "off",
      // Keep a few high-signal rules we plant for
      "vue/no-v-html": "error",
      "vue/no-unused-vars": "error",
      "vue/no-dupe-v-else-if": "error",
      "vue/require-v-for-key": "error",
      "vue/no-textarea-mustache": "error",
    },
  },
];
