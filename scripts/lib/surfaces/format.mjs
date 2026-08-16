import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { collectVueFiles, prepareFormatCopy, totalBytes } from "../fixtures.mjs";
import { measureVariants, resolveBin, runCommand } from "../timing.mjs";
import {
  applyFileCoverageGate,
  applyWorkGate,
  dirtyForCoverage,
  formatterRewritesTemplate,
  prepareFormatPlant,
} from "../work-gate.mjs";

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
        "prettier --write **/*.vue (fresh copy each run) · single-threaded by design",
      measure: () => {
        const cwd = nextCopy("prettier");
        // RECURSIVE glob. `*.vue` matched nothing on nested real-world corpora,
        // so Prettier's ~80 ms "win" on every project was CLI boot + "no files
        // matched" with the non-zero exit swallowed below — ranked 1.00x for
        // doing zero work (2026-07-30 audit, finding 1). The format work gate
        // now plants its probe in a NESTED directory so a non-recursive
        // invocation of any tool fails the gate instead of topping the table.
        const { ms } = runCommand(prettier, ["--write", "**/*.vue", "--log-level", "error"], {
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
        "oxfmt --write (fresh copy each run) · .vue files route through oxfmt's BUNDLED PRETTIER fallback in worker threads, not the Rust core (its dist ships Prettier and exposes Prettier's Vue options) — read this row as Prettier-with-workers until oxfmt formats SFCs natively",
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

  // File-coverage census, untimed, one pass per tool with its EXACT timed
  // invocation: every corpus file is planted with a mess any formatter under
  // the shared configs must undo, and "files rewritten" is counted by byte
  // comparison — the same method for every tool, no per-tool output parsing.
  // Probed live (fixtures/50 in a nested layout): prettier, oxfmt and vize
  // rewrite 50/50; biome rewrites 0/50 ("Formatted 53 files … No fixes
  // applied") while also walking the two config files. Walk-invoked tools
  // touching a config file is disclosed, not gated — one or two extra tiny
  // files is noise; SKIPPING corpus files is the fault class that put a
  // zero-work row at 1.00x, and that is what the gate below catches.
  const coverage = new Map();
  const coverageCensus = (id, bin, args, { shell = false } = {}) => {
    try {
      const cwd = nextCopy(`coverage-${id}`);
      const planted = new Map();
      for (const f of files) {
        const p = join(cwd, f);
        const dirtied = dirtyForCoverage(readFileSync(p, "utf8"));
        writeFileSync(p, dirtied);
        planted.set(f, dirtied);
      }
      const cfgNames = [".prettierrc.json", "biome.json"];
      const cfgBefore = new Map(
        cfgNames.map((n) => [n, existsSync(join(cwd, n)) ? readFileSync(join(cwd, n), "utf8") : null]),
      );
      runCommand(bin, args, { cwd, allowNonZeroExit: true, shell });
      let covered = 0;
      for (const f of files) {
        if (readFileSync(join(cwd, f), "utf8") !== planted.get(f)) covered++;
      }
      const extras = cfgNames.filter(
        (n) => cfgBefore.get(n) !== null && readFileSync(join(cwd, n), "utf8") !== cfgBefore.get(n),
      );
      coverage.set(id, { covered, corpus: files.length, extras });
    } catch (error) {
      coverage.set(id, { covered: null, corpus: files.length, extras: [], error: String(error?.message ?? error) });
    }
  };
  if (prettier) coverageCensus("prettier", prettier, ["--write", "**/*.vue", "--log-level", "error"], { shell: process.platform === "win32" && prettier.endsWith(".cmd") });
  if (oxfmt) coverageCensus("oxfmt", oxfmt, [".", "--write"], { shell: process.platform === "win32" && oxfmt.endsWith(".cmd") });
  if (vize) coverageCensus("vize-fmt", vize, ["fmt", "--write", "."], { shell: process.platform === "win32" && vize.endsWith(".cmd") });
  if (biome) coverageCensus("biome-fmt", biome, ["format", "--write", "."], { shell: process.platform === "win32" && biome.endsWith(".cmd") });

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
          args: ["--write", "**/*.vue", "--log-level", "error"],
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

  applyFileCoverageGate(results, coverage, {
    verb: "rewrote",
    what: "planted corpus files",
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
      "Oxfmt's .vue path is NOT its Rust core: oxfmt (verified through 0.63) bundles Prettier and routes SFCs through it in worker threads — which is also why its output is byte-identical to Prettier's. Its row measures that pipeline, disclosed in its label notes; Vize is currently the only ranked formatter compiling SFCs natively.",
      "Every work copy and gate plant carries an empty .git dir as a repo-boundary marker: walk tools that honour ancestor .gitignore rules (oxfmt 0.63+) otherwise inherit THIS repo's exclusion of the work/ dir the copies live in, see zero files, and get unranked for walking reasons rather than formatting ones. A real project root has the boundary; the marker changes no tool's invocation.",
      "The template-rewrite gate probe lives in a NESTED directory, so a tool invoked non-recursively fails the gate rather than being ranked on an empty match (this exact fault put Prettier at 1.00x on every nested corpus while formatting zero files).",
      "Template-rewrite work gate: each formatter is run against a messy SFC and must actually change the <template> block, or it is measured but unranked.",
      "FILE-COVERAGE GATE, untimed, per tool with its exact timed invocation: every corpus file is planted with a mess (trailing spaces, stacked blank lines) that any formatter under the shared configs must undo, and files rewritten are counted by byte comparison — the same method for every tool. A ranked tool that rewrites fewer than every corpus file is measured but UNRANKED: tools walking different file sets are not doing the same job, however similar the clock looks. A walk-invoked tool that also rewrites a config file is disclosed, not gated (one extra tiny file is noise; skipping corpus files is not).",
      "Prettier, Oxfmt, and Vize format the whole SFC. On the pinned Biome, `biome format --write .` reports .vue files as formatted but applies NO fixes to any block of them (probed: 0 of 50 planted files rewritten, 'No fixes applied') — its bracketed time is a walk-and-parse, which both gates say on the row. Rule/option parity is not guaranteed for any tool.",
      "Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.",
    ],
    variants: results,
  };
}
