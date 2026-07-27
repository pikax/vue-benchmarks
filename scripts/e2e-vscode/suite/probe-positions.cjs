/**
 * Deterministic probe positions inside a `.vue` source.
 *
 * These used to be one heuristic (`findSymbolPosition`) that took the first
 * line containing `const <symbol>` OR, failing that, the first line containing
 * the bare symbol — whichever matched first, scanning top to bottom. In a
 * single-file component the template always precedes `<script setup>`, so the
 * bare-symbol branch always won and the "hover" probe silently landed on the
 * `{{ }}` interpolation. That was the right position by accident; nothing said
 * so, and nothing stopped it moving.
 *
 * The two positions are now named, found separately, and reported separately,
 * because the gate treats them differently: the SCRIPT position must answer
 * with a TypeScript type, and the TEMPLATE position must answer with the
 * auto-unwrapped one. See suite/hover-gate.cjs.
 *
 * All offsets are UTF-16 code units, which is both what `String.prototype`
 * indices are and what `vscode.Position.character` means, so no conversion is
 * needed between them.
 */

/** Convert a UTF-16 offset into the source to a 0-based {line, character}. */
function offsetToPosition(source, offset) {
  let line = 0;
  let lineStart = 0;
  for (let i = 0; i < offset; i++) {
    if (source[i] === "\n") {
      line += 1;
      lineStart = i + 1;
    }
  }
  return { line, character: offset - lineStart };
}

/**
 * Position of `<symbol>` in its `const <symbol>` declaration.
 * Word-bounded so `const benchMarkerTwo` cannot stand in for `benchMarker`.
 *
 * @returns {{line: number, character: number} | null}
 */
function findScriptPosition(source, symbol) {
  if (!symbol) return null;
  const re = new RegExp(`\\bconst\\s+(${escapeRe(symbol)})\\b`);
  const m = re.exec(source);
  if (!m) return null;
  // Offset of the symbol itself, not of the `const` keyword.
  return offsetToPosition(source, m.index + m[0].length - m[1].length);
}

/**
 * Position of `<symbol>` inside a `{{ ... }}` interpolation.
 *
 * Scans the whole source for interpolation spans rather than working line by
 * line, so an interpolation broken across lines still resolves. Only the first
 * span containing the symbol is used — the probe components declare exactly
 * one.
 *
 * @returns {{line: number, character: number} | null}
 */
function findTemplatePosition(source, symbol) {
  if (!symbol) return null;
  const word = new RegExp(`\\b${escapeRe(symbol)}\\b`);
  let from = 0;
  for (;;) {
    const open = source.indexOf("{{", from);
    if (open === -1) return null;
    const close = source.indexOf("}}", open + 2);
    if (close === -1) return null;
    const span = source.slice(open + 2, close);
    const m = word.exec(span);
    if (m) return offsetToPosition(source, open + 2 + m.index);
    from = close + 2;
  }
}

/**
 * Last-resort position for a workspace with no planted marker — a real cloned
 * project, where no identifier has a known-correct hover answer.
 *
 * Unchanged from the original heuristic ON PURPOSE. It is retained so those
 * workspaces are still measured, but a position chosen by "first word of four
 * or more characters, starting 30% into the file" cannot be gated: there is
 * nothing to compare the answer against. Rows measured here are reported
 * unranked for exactly that reason — see scripts/e2e-vscode/report.mjs.
 */
function findFallbackPosition(source) {
  const lines = source.split(/\r?\n/);
  for (let i = Math.floor(lines.length * 0.3); i < lines.length; i++) {
    const m = lines[i].match(/\b([A-Za-z_][A-Za-z0-9_]{3,})\b/);
    if (m) return { line: i, character: m.index };
  }
  return { line: 0, character: 0 };
}

function escapeRe(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

module.exports = {
  offsetToPosition,
  findScriptPosition,
  findTemplatePosition,
  findFallbackPosition,
};
