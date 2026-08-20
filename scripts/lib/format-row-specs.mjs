/** Shared command/config definitions for the timed and validity format paths. */

export const FORMAT_PRETTIER_CONFIG = `${JSON.stringify(
  { semi: true, singleQuote: true, trailingComma: "all", printWidth: 100 },
  null,
  2,
)}\n`;

export const FORMAT_BIOME_CONFIG = `${JSON.stringify(
  {
    formatter: { enabled: true, indentStyle: "space", indentWidth: 2, lineWidth: 100 },
    javascript: {
      formatter: { quoteStyle: "single", semicolons: "always", trailingCommas: "all" },
    },
    linter: { enabled: false },
  },
  null,
  2,
)}\n`;

export const FORMAT_ROW_IDS = Object.freeze(["prettier", "oxfmt", "vize-fmt", "biome-fmt"]);

export function formatRowCommand(id) {
  if (id === "prettier") {
    return { bin: "prettier", args: ["--write", "**/*.vue", "--log-level", "error"] };
  }
  if (id === "oxfmt") return { bin: "oxfmt", args: [".", "--write"] };
  if (id === "vize-fmt") return { bin: "vize", args: ["fmt", "--write", "."] };
  if (id === "biome-fmt") return { bin: "biome", args: ["format", "--write", "."] };
  return null;
}

export function formatConfigFiles() {
  return {
    ".prettierrc.json": FORMAT_PRETTIER_CONFIG,
    "biome.json": FORMAT_BIOME_CONFIG,
  };
}
