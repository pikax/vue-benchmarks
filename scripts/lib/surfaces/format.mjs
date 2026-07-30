import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { collectVueFiles, prepareFormatCopy, totalBytes } from "../fixtures.mjs";
import { measureVariants, resolveBin, runCommand } from "../timing.mjs";
import { applyWorkGate, formatterRewritesTemplate, prepareFormatPlant } from "../work-gate.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

const PRETTIER_CONFIG = `${JSON.stringify(
  { semi: true, singleQuote: true, trailingComma: "all", printWidth: 100 },
  null,
  2,
)}\n`;

/**
 * Biome's equivalent of the Prettier config above — same indent, same width,
 * same quote/semicolon/trailing-comma choices — so neither tool is doing more
 * rewriting than the other for reasons of style settings alone.
 */
const BIOME_CONFIG = `${JSON.stringify(
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

function tryResolveBin(name) {
  try {
    return resolveBin(name, rootDir);
  } catch {
    return null;
  }
}

/**
 * Format surface.
 * Destructive tools always receive a fresh copy of the corpus per invocation.
 * Prefer --check/--write consistently; we use write on a throwaway copy so tools
 * do equivalent full-format work (not early-exit check optimizations only).
 */
export async function runFormatSurface(fixtureDir, options) {
  // See compile.mjs: `options.files` carries a caller-supplied (possibly nested)
  // corpus, which is how the real-world orchestrator feeds cloned projects in.
  const files = options.files ?? collectVueFiles(fixtureDir, options.fileLimit);
  const bytes = totalBytes(fixtureDir, files);
  const workRoot = options.workRoot;

  const prettier = tryResolveBin("prettier");
  const oxfmt = tryResolveBin("oxfmt");
  const vize = tryResolveBin("vize");
  const biome = tryResolveBin("biome");

  // Prettier Vue: built-in support in modern Prettier for .vue
  // Write a shared prettier config into fixture root for copies to inherit via walk-up if needed.
  writeFileSync(join(fixtureDir, ".prettierrc.json"), PRETTIER_CONFIG);
  // Same for Biome — prepareFormatCopy carries both into every work copy.
  writeFileSync(join(fixtureDir, "biome.json"), BIOME_CONFIG);

  let invocation = 0;
  const nextCopy = (label) => prepareFormatCopy(fixtureDir, files, workRoot, label, ++invocation);

  const variants = [];

  if (prettier) {
    variants.push({
      id: "prettier",
      label: "Prettier",
      package: "prettier",
      threading: "1t",
      invocation: "cli",
      notes:
        "prettier --write *.vue (fresh copy each run) · single-threaded by design",
      measure: () => {
        const cwd = nextCopy("prettier");
        const { ms } = runCommand(prettier, ["--write", "*.vue", "--log-level", "error"], {
          cwd,
          // Consistent with the other formatters: a non-zero exit from a
          // style diagnostic must not fail one tool while the others are
          // allowed to exit non-zero freely.
          allowNonZeroExit: true,
          shell: process.platform === "win32" && prettier.endsWith(".cmd"),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "prettier",
      label: "Prettier",
      package: "prettier",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (oxfmt) {
    variants.push({
      id: "oxfmt",
      label: "Oxfmt",
      package: "oxfmt",
      threading: "max",
      invocation: "cli",
      notes:
        "oxfmt --write (Vue-capable Oxc formatter; fresh copy each run) · multi-threaded (self-reports its thread count) — a gap against single-threaded Prettier is partly thread count, not formatter speed",
      measure: () => {
        const cwd = nextCopy("oxfmt");
        // oxfmt accepts paths; try write mode flags used by oxfmt CLI
        const { ms } = runCommand(oxfmt, [".", "--write"], {
          cwd,
          allowNonZeroExit: true,
          shell: process.platform === "win32" && oxfmt.endsWith(".cmd"),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "oxfmt",
      label: "Oxfmt",
      package: "oxfmt",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (vize) {
    variants.push({
      id: "vize-fmt",
      label: "Vize fmt",
      package: "vize",
      threading: "unknown",
      invocation: "cli",
      notes:
        "vize fmt --write (fresh copy each run) · does not report thread usage — not assumed single-threaded",
      measure: () => {
        const cwd = nextCopy("vize-fmt");
        const { ms } = runCommand(vize, ["fmt", "--write", "."], {
          cwd,
          allowNonZeroExit: true,
          shell: process.platform === "win32" && vize.endsWith(".cmd"),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "vize-fmt",
      label: "Vize fmt",
      package: "vize",
      notes: "Binary not found",
      skip: true,
    });
  }

  if (biome) {
    variants.push({
      id: "biome-fmt",
      label: "Biome format",
      package: "@biomejs/biome",
      threading: "max",
      invocation: "cli",
      notes:
        "biome format --write . (fresh copy each run) · multi-threaded (Rayon; honours RAYON_NUM_THREADS) · formats the <script> block ONLY — template and style are returned byte-identical",
      measure: () => {
        const cwd = nextCopy("biome-fmt");
        const { ms } = runCommand(biome, ["format", "--write", "."], {
          cwd,
          allowNonZeroExit: true,
          shell: process.platform === "win32" && biome.endsWith(".cmd"),
        });
        return ms;
      },
    });
  } else {
    variants.push({
      id: "biome-fmt",
      label: "Biome format",
      package: "@biomejs/biome",
      notes: "Binary not found",
      skip: true,
    });
  }

  // Work gate: a formatter is ranked only if it actually rewrites the template
  // block. Without this the table silently compares whole-SFC formatters against
  // a script-only one on wall clock — see prepareFormatPlant.
  const fmtPlant = prepareFormatPlant(options.workRoot ?? join(rootDir, "work"));
  try {
    const isWinShell = (bin) => process.platform === "win32" && bin.endsWith(".cmd");
    applyWorkGate(variants, (v) => {
      if (v.id === "prettier") {
        return formatterRewritesTemplate(fmtPlant, {
          bin: prettier,
          args: ["--write", "*.vue", "--log-level", "error"],
          label: "prettier",
          shell: isWinShell(prettier),
          configFiles: { ".prettierrc.json": PRETTIER_CONFIG },
        });
      }
      if (v.id === "oxfmt") {
        return formatterRewritesTemplate(fmtPlant, {
          bin: oxfmt,
          args: [".", "--write"],
          label: "oxfmt",
          shell: isWinShell(oxfmt),
        });
      }
      if (v.id === "vize-fmt") {
        return formatterRewritesTemplate(fmtPlant, {
          bin: vize,
          args: ["fmt", "--write", "."],
          label: "vize-fmt",
          shell: isWinShell(vize),
        });
      }
      if (v.id === "biome-fmt") {
        return formatterRewritesTemplate(fmtPlant, {
          bin: biome,
          args: ["format", "--write", "."],
          label: "biome-fmt",
          shell: isWinShell(biome),
          configFiles: { "biome.json": BIOME_CONFIG },
        });
      }
      return true;
    });
  } finally {
    fmtPlant.cleanup();
  }

  const results = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: files.length,
  });

  return {
    id: "format",
    label: "Format",
    files: files.length,
    bytes,
    methodology: [
      "Each invocation receives a fresh copy of the same Vue SFC corpus (formatters rewrite files).",
      ".prettierrc.json and biome.json are copied into every work copy so each tool's config actually resolves (config left in the fixture root is not on the work dir's lookup path). Both configs set the same indent, width, quote, semicolon and trailing-comma choices.",
      "All four formatters are CLI invocations and share the same non-zero-exit policy — no tool is failed for a diagnostic another tool is forgiven for.",
      "Output style is NOT normalized across tools — this measures format throughput, not style identity. Spot-checked: on a messy SFC, oxfmt and Prettier produce byte-identical output and Vize reformats template + script + style, so no tool is winning by no-op.",
      "Template-rewrite work gate: each formatter is run against a messy SFC and must actually change the <template> block, or it is measured but unranked. Biome fails this gate — it formats the <script> block and returns template and style byte-identical, so its wall clock is not comparable to a whole-SFC formatter's.",
      "Prettier, Oxfmt, and Vize format the whole SFC; Biome covers the script block only. Rule/option parity is not guaranteed for any of them.",
      "Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.",
    ],
    variants: results,
  };
}
