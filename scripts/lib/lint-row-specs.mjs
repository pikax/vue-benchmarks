/** Shared exact CLI definitions for lint timing and validity children. */

export const LINT_ROW_IDS = Object.freeze([
  "eslint-plugin-vue-1t",
  "eslint-plugin-vue-workers",
  "eslint-plugin-vue-cli",
  "vize-lint-1t",
  "vize-lint-max",
  "biome-lint-1t",
  "biome-lint-max",
  "oxlint-1t",
  "oxlint-max",
  "verter-lint-host",
]);

export function lintCliCommand(id) {
  if (id === "eslint-plugin-vue-cli") return { bin: "eslint", args: ["."], env: {} };
  if (id === "vize-lint-1t") {
    return { bin: "vize", args: ["lint", "."], env: { RAYON_NUM_THREADS: "1" } };
  }
  if (id === "vize-lint-max") return { bin: "vize", args: ["lint", "."], env: {} };
  if (id === "biome-lint-1t") {
    return { bin: "biome", args: ["lint", "."], env: { RAYON_NUM_THREADS: "1" } };
  }
  if (id === "biome-lint-max") return { bin: "biome", args: ["lint", "."], env: {} };
  if (id === "oxlint-1t") return { bin: "oxlint", args: [".", "--threads=1"], env: {} };
  if (id === "oxlint-max") return { bin: "oxlint", args: ["."], env: {} };
  return null;
}
