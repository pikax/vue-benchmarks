/**
 * Hover CONTENT gate for the VS Code E2E surface.
 *
 * This is a PORT, not a fork. `classifyHover` and `classifyTemplateHover` below
 * are line-for-line ports of the exported ESM originals in
 * `scripts/lib/surfaces/lsp.mjs`. The port exists only because this file is
 * loaded by Mocha inside the VS Code extension host, which is a CommonJS
 * context that cannot `require()` an ESM module — and reaching the originals
 * via dynamic `import()` would drag in the whole LSP surface graph
 * (lsp-client, tsserver-bridge, timing, memory, tsgo, tnb) just to obtain two
 * pure string predicates.
 *
 * DRIFT IS THE RISK, so it is tested rather than trusted:
 * `tests/harness/e2e-hover-gate-parity.test.mjs` loads BOTH implementations and
 * asserts they return identical `{ok, bytes, reason}` for every verbatim server
 * payload in `tests/harness/lsp-hover-gate.test.mjs` plus a generated corpus of
 * several hundred permutations. Change one side and that test fails.
 *
 * ---------------------------------------------------------------------------
 * The probe, restated so this file stands on its own:
 *
 * Vue auto-unwraps refs inside `{{ }}`. In the probe component `benchMarker` is
 * `Ref<string>` in `<script setup>` and `string` inside the interpolation three
 * lines up. A server that answers `Ref<...>` at the TEMPLATE position returned
 * the script type — it did not model the template, which is the job a *Vue*
 * language server exists to do. A server can satisfy the script probe by
 * proxying to a TypeScript server; only the template probe is Vue-specific.
 *
 * The template check matches the ANNOTATION (`benchMarker: string`), never a
 * bare `string` anywhere in the payload. Both directions were found by
 * measurement:
 *
 *   - A bare /\bstring\b/ false-FAILED `let benchMarker: stringStable hover
 *     target for…` — a server that resolved the template type correctly and
 *     merely ran its doc comment into the type signature with no separator.
 *     There is no word boundary inside `stringStable`.
 *   - A bare match would also false-PASS prose: one server returns the script
 *     type `Ref<string>` next to the sentence "auto-unwrapped in template",
 *     describing the unwrapping it did not perform.
 */

const HOVER_EXPECT_SYMBOL = "benchMarker";
const HOVER_EXPECT_TYPE = /\bRef\s*<|\bstring\b/;
const HOVER_TEMPLATE_EXPECT_TYPE = new RegExp(`\\b${HOVER_EXPECT_SYMBOL}\\s*:\\s*string`);
const HOVER_TEMPLATE_REJECT_TYPE = new RegExp(`\\b${HOVER_EXPECT_SYMBOL}\\s*:\\s*Ref\\s*<`);

/**
 * Does this hover actually carry TypeScript type information for the probe?
 * Requires the symbol name AND something type-shaped — a payload that merely
 * echoes the identifier is not a typecheck result.
 *
 * Port of `classifyHover` in scripts/lib/surfaces/lsp.mjs.
 */
function classifyHover(text) {
  const bytes = Buffer.byteLength(text, "utf8");
  if (!text) return { ok: false, bytes, reason: "empty hover payload" };
  const hasSymbol = text.includes(HOVER_EXPECT_SYMBOL);
  const hasType = HOVER_EXPECT_TYPE.test(text);
  if (!hasSymbol) return { ok: false, bytes, reason: `hover does not mention ${HOVER_EXPECT_SYMBOL}` };
  if (!hasType) {
    return {
      ok: false,
      bytes,
      reason: `hover names ${HOVER_EXPECT_SYMBOL} but carries no TypeScript type (expected Ref<string>)`,
    };
  }
  return { ok: true, bytes, reason: "" };
}

/**
 * Does this hover carry the TEMPLATE type for the probe symbol?
 * See the file header for why `Ref<...>` is a failure, not a pass.
 *
 * Port of `classifyTemplateHover` in scripts/lib/surfaces/lsp.mjs.
 */
function classifyTemplateHover(text) {
  const bytes = Buffer.byteLength(text, "utf8");
  if (!text) {
    return { ok: false, bytes, reason: "empty hover payload at the template position" };
  }
  if (!text.includes(HOVER_EXPECT_SYMBOL)) {
    return {
      ok: false,
      bytes,
      reason: `template hover does not mention ${HOVER_EXPECT_SYMBOL}`,
    };
  }
  if (HOVER_TEMPLATE_REJECT_TYPE.test(text)) {
    return {
      ok: false,
      bytes,
      reason: `template hover returned Ref<...> — that is the <script setup> type leaking into template context; refs auto-unwrap inside {{ }}, so the correct answer is \`string\``,
    };
  }
  if (!HOVER_TEMPLATE_EXPECT_TYPE.test(text)) {
    return {
      ok: false,
      bytes,
      reason: `template hover names ${HOVER_EXPECT_SYMBOL} but carries no type — the server resolves the binding without typechecking the template (expected \`string\`)`,
    };
  }
  return { ok: true, bytes, reason: "" };
}

/**
 * Flatten what `vscode.executeHoverProvider` returns into plain text.
 *
 * The command returns `Hover[]` — one entry per provider that answered, in an
 * editor these are stacked into a single popup. `Hover.contents` is itself a
 * list, and each entry is either a plain string, a `MarkdownString` (`.value`)
 * or the legacy `MarkedString` `{language, value}`. All of them are joined,
 * mirroring `mergeHover` + `hoverText` on the LSP surface: Volar is a
 * two-process product where the Vue server answers template hovers and the
 * TypeScript server answers script hovers, so taking only the first provider's
 * answer would gate on half the response.
 */
function hoverText(hovers) {
  if (hovers == null) return "";
  const list = Array.isArray(hovers) ? hovers : [hovers];
  const parts = [];
  for (const hover of list) {
    const contents = hover?.contents;
    if (contents == null) continue;
    for (const item of Array.isArray(contents) ? contents : [contents]) {
      if (typeof item === "string") parts.push(item);
      else if (typeof item?.value === "string") parts.push(item.value);
    }
  }
  return parts.join("\n").trim();
}

module.exports = {
  HOVER_EXPECT_SYMBOL,
  classifyHover,
  classifyTemplateHover,
  hoverText,
};
