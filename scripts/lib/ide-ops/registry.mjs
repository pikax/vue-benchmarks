/**
 * Suite registry — auto-discovers `./suites/*.mjs`.
 *
 * Discovery rather than a hand-maintained list so suites stay genuinely
 * independent: adding one is dropping in a file, and no two authors ever edit
 * the same module. A suite that fails to load is reported loudly rather than
 * silently skipped — a missing suite would otherwise look like a passing run
 * with fewer rows.
 */

import { readdirSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const suitesDir = join(here, "suites");

/** Every field a suite must provide, checked at load so mistakes fail fast. */
function validate(suite, file) {
  const problems = [];
  if (!suite || typeof suite !== "object") problems.push("does not export SUITE");
  else {
    if (!suite.id) problems.push("missing id");
    if (!suite.label) problems.push("missing label");
    if (typeof suite.buildWorkspace !== "function") problems.push("missing buildWorkspace(dir)");
    if (typeof suite.measure !== "function") problems.push("missing async measure(ctx)");
  }
  if (problems.length) {
    throw new Error(`Invalid suite in ${file}: ${problems.join(", ")}`);
  }
  return suite;
}

async function load() {
  if (!existsSync(suitesDir)) return [];
  const files = readdirSync(suitesDir)
    .filter((f) => f.endsWith(".mjs"))
    .sort();
  const loaded = [];
  for (const f of files) {
    const mod = await import(pathToFileURL(join(suitesDir, f)).href);
    loaded.push(validate(mod.SUITE, f));
  }
  const ids = new Set();
  for (const s of loaded) {
    if (ids.has(s.id)) throw new Error(`Duplicate suite id: ${s.id}`);
    ids.add(s.id);
  }
  return loaded;
}

export const SUITES = await load();
