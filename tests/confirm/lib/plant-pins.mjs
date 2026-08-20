/**
 * Plant location pins. These are harness comments, not compiler directives.
 *
 *   <!-- @plant-error -->     template (HTML comment — every tool ignores it)
 *   // @plant-error           script
 *
 * `<!-- @ts-expect-error -->` is NOT portable in Vue templates (not TypeScript;
 * Volar-only at best). Script `// @ts-expect-error` is real TS and is left
 * alone when expectErrors is false (unused-directive plants).
 *
 * The work copy strips @plant-error so line numbers of the bad code stay put
 * and the diagnostic is always visible.
 */
import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const SOURCE_EXT = /\.(vue|ts|tsx|mts|cts|js|jsx)$/i;
const PLANT_RE = /@plant-error\b/;
/** Legacy alias still recognised so old fixtures keep working during the rename. */
const LEGACY_RE = /@ts-expect-error\b/;
const PIN_RE = /@plant-error\b|@ts-expect-error\b/;

function listSourceFiles(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === "meta.json") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) listSourceFiles(p, acc);
    else if (SOURCE_EXT.test(name)) acc.push(p);
  }
  return acc;
}

function nextCodeLine(lines, fromIdx) {
  for (let i = fromIdx + 1; i < lines.length; i++) {
    const t = lines[i].trim();
    if (!t) continue;
    if (t.startsWith("//") && !PIN_RE.test(t)) continue;
    if (t.startsWith("<!--") && t.endsWith("-->") && !PIN_RE.test(t)) continue;
    return i;
  }
  return fromIdx;
}

/**
 * @returns {Array<{ file: string, commentLine: number, targetLine: number, strippedLine: number, text: string }>}
 *
 * `targetLine` / `commentLine` are SOURCE coordinates (what the docs and the
 * failure messages quote). `strippedLine` is where that code actually lands in
 * the work copy once `stripExpectErrorDirectives` has removed the pin lines
 * above it — which is the only line number a tool can possibly report.
 *
 * With one pin per file the shift is exactly one line, so `commentLine` was
 * numerically the same as `strippedLine` and the distinction never surfaced.
 * The second pin in a file shifts by two, the third by three: a two-error plant
 * was unscoreable, and quietly failed every tool at once.
 */
export function findExpectErrorPins(dir) {
  const pins = [];
  for (const abs of listSourceFiles(dir)) {
    const rel = relative(dir, abs).replace(/\\/g, "/");
    const lines = readFileSync(abs, "utf8").split(/\r?\n/);
    let stripped = 0;
    for (let i = 0; i < lines.length; i++) {
      if (!PIN_RE.test(lines[i])) continue;
      // Only @plant-error is stripped from the work copy; a real
      // `// @ts-expect-error` stays and shifts nothing.
      if (PLANT_RE.test(lines[i])) stripped += 1;
      const target = nextCodeLine(lines, i);
      pins.push({
        file: rel,
        commentLine: i + 1,
        targetLine: target + 1,
        strippedLine: target + 1 - stripped,
        text: lines[i].trim(),
      });
    }
  }
  return pins;
}

/** Strip only harness @plant-error pins. Never strip real // @ts-expect-error. */
export function stripExpectErrorDirectives(dir) {
  for (const abs of listSourceFiles(dir)) {
    const src = readFileSync(abs, "utf8");
    const next = src
      .split(/\r?\n/)
      .filter((line) => !PLANT_RE.test(line))
      .join("\n");
    if (next !== src) writeFileSync(abs, next);
  }
}

export { PLANT_RE, LEGACY_RE, PIN_RE };
