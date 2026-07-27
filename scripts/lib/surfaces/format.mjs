import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { collectVueFiles, prepareFormatCopy, totalBytes } from "../fixtures.mjs";
import { measureVariants, resolveBin, runCommand } from "../timing.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

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
  const files = collectVueFiles(fixtureDir, options.fileLimit);
  const bytes = totalBytes(fixtureDir, files);
  const workRoot = options.workRoot;

  const prettier = tryResolveBin("prettier");
  const oxfmt = tryResolveBin("oxfmt");
  const vize = tryResolveBin("vize");

  // Prettier Vue: built-in support in modern Prettier for .vue
  // Write a shared prettier config into fixture root for copies to inherit via walk-up if needed.
  writeFileSync(
    join(fixtureDir, ".prettierrc.json"),
    `${JSON.stringify({ semi: true, singleQuote: true, trailingComma: "all", printWidth: 100 }, null, 2)}\n`,
  );

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
      ".prettierrc.json is copied into every work copy so Prettier's config actually resolves (config left in the fixture root is not on the work dir's lookup path).",
      "All three formatters are CLI invocations and share the same non-zero-exit policy — no tool is failed for a diagnostic another tool is forgiven for.",
      "Output style is NOT normalized across tools — this measures format throughput, not style identity. Spot-checked: on a messy SFC, oxfmt and Prettier produce byte-identical output and Vize reformats template + script + style, so no tool is winning by no-op.",
      "Prettier, Oxfmt, and Vize all claim Vue SFC support; rule/option parity is not guaranteed.",
      "Tool order is rotated on every warmup and measured run; ranking metric is the median of warmed runs.",
    ],
    variants: results,
  };
}
