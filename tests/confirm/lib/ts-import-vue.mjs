/**
 * .ts-imports-.vue confirm plants.
 *
 * vue-tsc / vize / golar typecheck a .ts file that imports an SFC on the
 * shared tsconfig (declare module "*.vue" in env.d.ts is enough).
 * verter-tsc does not: it reports "checking N .vue file(s)..." and never
 * looks at the .ts importer unless the harness adds extra compilerOptions
 * the other tools do not need.
 *
 * Extra flags are therefore NOT on the shared tsconfig. If we apply them,
 * that is extra behaviour for one tool and must be disclosed as a warn,
 * never a silent pass.
 */

/** compilerOptions other tools do not need, tried only for verter-tsc. */
export const VERTER_TS_IMPORT_EXTRA_COMPILER_OPTIONS = {
  allowArbitraryExtensions: true,
  allowImportingTsExtensions: true,
};

export const VERTER_TS_IMPORT_EXTRA_KEYS = Object.keys(
  VERTER_TS_IMPORT_EXTRA_COMPILER_OPTIONS,
);

/**
 * True when verter-tsc's output shows it typechecked .vue files only and
 * never named the .ts importer. Silent success from other tools is NOT
 * this shape (they do not print a ".vue file(s)" census).
 *
 * @param {string} combined
 * @param {string} tsImporter basename, e.g. "main.ts"
 */
export function verterSkippedTsImporter(combined, tsImporter) {
  if (!combined || !tsImporter) return false;
  if (!/checking\s+\d+\s+\.vue file/i.test(combined)) return false;
  return !combined.toLowerCase().includes(String(tsImporter).toLowerCase());
}

/**
 * Disclosure when the harness applies (or attempted) extra tsconfig for
 * verter-tsc on a .ts→.vue plant. Other tools ran on the shared tsconfig.
 *
 * @param {string} tsImporter
 * @param {"retry-passed" | "retry-still-skipped" | "retry-failed"} kind
 * @param {string} [scoreMessage]
 */
export function verterExtraTsconfigWarning(tsImporter, kind, scoreMessage = "") {
  const flags = VERTER_TS_IMPORT_EXTRA_KEYS.join(" + ");
  const head =
    `EXTRA TSCONFIG — verter-tsc did not typecheck ${tsImporter} ` +
    `(a .ts importer of a .vue SFC) on the shared tsconfig the other tools use. ` +
    `Retried with ${flags} (other tools do not need these).`;
  if (kind === "retry-still-skipped") {
    return `${head} Retry still only checked .vue files — the plant in ${tsImporter} was not exercised.`;
  }
  if (kind === "retry-failed") {
    return `${head} ${scoreMessage}`.trim();
  }
  return `${head} Plant scored only after that extra config${scoreMessage ? `: ${scoreMessage}` : ""}.`;
}
