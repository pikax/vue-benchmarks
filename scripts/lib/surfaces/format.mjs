import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";
import { collectVueFiles, prepareFormatCopy, totalBytes } from "../fixtures.mjs";
import { measureVariantsAlternating, resolveBin, runCommand } from "../timing.mjs";

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
      notes: "prettier --write **/*.vue (fresh copy each run)",
      measure: () => {
        const cwd = nextCopy("prettier");
        const { ms } = runCommand(prettier, ["--write", "*.vue", "--log-level", "error"], {
          cwd,
          allowNonZeroExit: false,
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
      notes: "oxfmt --write (Vue-capable Oxc formatter; fresh copy each run)",
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
      notes: "vize fmt --write (fresh copy each run)",
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

  const results = await measureVariantsAlternating(variants, {
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
      "Output style is NOT normalized across tools — this measures format throughput, not style identity.",
      "Prettier, Oxfmt, and Vize all claim Vue SFC support; rule/option parity is not guaranteed.",
      "Measured runs alternate tool order each iteration.",
      "Cold = first measured run; warm = later runs (OS page cache + process start costs still apply per CLI).",
    ],
    variants: results,
  };
}
