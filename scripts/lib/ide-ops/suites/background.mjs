/**
 * Background suite — the operations an editor fires constantly and nobody times.
 *
 * Hover and completion are the operations people benchmark because they are the
 * ones a user *waits* for. They are not the ones that dominate a session. Open a
 * file and the client immediately asks for semantic tokens, the outline, the
 * folding map and the inlay hints; move the caret one character and it asks for
 * document highlights again; type one character and it asks for all of it again.
 * A 20 ms regression in `documentHighlight` costs more CPU over an hour of
 * editing than a 200 ms regression in hover, because it fires on every keystroke
 * and every arrow key. None of these are measured anywhere else in this repo.
 *
 * Six operations, each with a content gate:
 *
 *   1. semanticTokens/full        syntax colouring
 *   2. semanticTokens/full/delta  the incremental form, after a small edit
 *   3. documentSymbol             breadcrumbs / outline
 *   4. documentHighlight          caret-move highlighting
 *   5. inlayHint                  inferred types and parameter names
 *   6. foldingRange               the fold gutter
 *
 * WHY THE GATES ARE SHAPED THE WAY THEY ARE
 *
 * Every one of these operations has more than one legal wire shape, and every
 * one of those shapes showed up in a real run against the four servers here:
 *
 *   - `documentSymbol` may answer with a nested `DocumentSymbol[]` (Volar,
 *     Verter), a FLAT `DocumentSymbol[]` with no children (Vize), or a
 *     `SymbolInformation[]` whose range hides inside `location.range`
 *     (typescript-language-server, for a .ts document). The flattener handles
 *     all three; a shape this suite failed to handle would be this suite's bug,
 *     reported as a server failure, which is the worst outcome available.
 *   - `inlayHint.label` is a plain string from Vize and an
 *     `InlayHintLabelPart[]` from the TypeScript half of the Volar pair. Both
 *     are legal, so the gate flattens before it looks at anything.
 *
 * Gates match STRUCTURE, never loose substrings. The precedent this repo keeps
 * paying for is a hover gate that matched /\bstring\b/ and failed a server whose
 * payload was `let x: stringStable hover target…` — a correct type with a doc
 * comment run onto it. Nothing here tests a payload by searching it for a word.
 *
 * WHY THIS SUITE PUSHES `workspace/didChangeConfiguration`
 *
 * Inlay hints are OFF by default in every TypeScript-derived server, and the
 * harness client answers `workspace/configuration` with `null` for every
 * `typescript.inlayHints.*` section it does not know about. Measuring
 * `inlayHint` without turning the feature on measures which server ignores the
 * client's configuration, not which server computes hints quickly: Volar
 * respects the setting and returns `[]`, and a gate of "at least one hint" would
 * then fail the server that behaved CORRECTLY. So the suite sends one identical
 * settings payload to every server process in the session before it opens the
 * document — exactly what an editor with inlay hints enabled does — and only
 * then measures. Same payload, same order, same delays, every server.
 *
 * WHY THE DELTA GATE IS STRUCTURAL
 *
 * `semanticTokens/full/delta` may legally answer with a `SemanticTokensDelta`
 * (`{ resultId?, edits }`) or with a whole `SemanticTokens` (`{ resultId?, data
 * }`); a server is free to decide the delta is not worth computing. The gate
 * accepts either and validates the encoding of whichever arrived. It does NOT
 * require a non-empty edit list: this fixture's edit widens a string literal,
 * and a server whose legend does not classify string literals can correctly
 * report zero edits. Verifying that the edits actually reconstruct the next full
 * token set would be a stronger gate, and would need a second full request
 * inside the timed region — which would stop the number being a delta timing.
 *
 * ADVERTISED CAPABILITIES
 *
 * `createSession()` does not surface the `initialize` result, so this suite
 * cannot read `capabilities` directly. It gates on the protocol facts it CAN
 * observe: a JSON-RPC -32601 is an unimplemented method no matter what the
 * handshake claimed, and a `resultId` on the full-token response is the server
 * inviting a delta request. Both are recorded in the row's `sample`, so an
 * advertise-versus-behave mismatch is visible from the output alone.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { timed } from "../context.mjs";
import { positionOf, scaffold } from "../workspace.mjs";

/**
 * The fixture, designed so every gate has one unambiguous right answer:
 *
 *   - seven named script bindings (`heading`, `nextLabel`, `threshold`,
 *     `entries`, `visibleEntries`, `formatEntry`, `addEntry`) for the outline;
 *   - `entries` used FOUR times, all inside the script, for highlights;
 *   - `ref()`/`computed()` bindings with no type annotation, and calls with
 *     positional parameters, for inlay hints;
 *   - a four-deep template (section > header/ul/footer > h1/li/button) and two
 *     SFC blocks, for folding;
 *   - enough identifiers, keywords and tags to make an empty token array
 *     obviously wrong.
 */
export const SOURCE = `<template>
  <section class="panel">
    <header>
      <h1>{{ heading }}</h1>
    </header>
    <ul>
      <li v-for="entry in visibleEntries" :key="entry.id">
        {{ formatEntry(entry) }}
      </li>
    </ul>
    <footer>
      <button type="button" @click="addEntry(nextLabel, 1)">Add</button>
    </footer>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

interface Entry {
  id: number
  label: string
  weight: number
}

const heading = 'Background operations'
const nextLabel = 'item'
const threshold = 2

const entries = ref<Entry[]>([])

const visibleEntries = computed(() => entries.value.filter((e) => e.weight >= threshold))

function formatEntry(entry: Entry): string {
  return \`\${entry.label} (\${entry.weight})\`
}

function addEntry(label: string, weight: number): void {
  entries.value.push({ id: entries.value.length + 1, label, weight })
}

addEntry('seed', 3)
</script>
`;

/**
 * The edit that separates the full token request from the delta request.
 *
 * Deliberately confined to one line, and to a line nothing else in this suite
 * measures: it changes no line count and no column of any later line, so the
 * four operations that run after it are still asking about exactly the spans
 * their gates were derived from.
 */
export const EDIT_FROM = "const nextLabel = 'item'";
export const EDIT_TO = "const nextLabel = 'items'";
export const EDITED_SOURCE = SOURCE.replace(EDIT_FROM, EDIT_TO);

/** The symbol the highlight probe sits on. Used 4x, all within the script. */
export const HIGHLIGHT_SYMBOL = "entries";

/**
 * Script bindings the outline must name.
 *
 * `Entry` is deliberately NOT required: Verter omits the interface from its
 * outline while listing every value binding, and demanding it would fail a
 * server whose breadcrumbs are perfectly usable.
 */
export const EXPECTED_SYMBOLS = [
  "heading",
  "nextLabel",
  "threshold",
  "entries",
  "visibleEntries",
  "formatEntry",
  "addEntry",
];

/**
 * Inlay hints, on, for everyone.
 *
 * Two key spellings on purpose. `typescript-language-server` merges
 * `settings.typescript.inlayHints` straight into the tsserver preference bag, so
 * it needs the raw `includeInlay*` preference names; VS Code-shaped servers read
 * the nested `variableTypes.enabled` form. Sending both is one payload that
 * every server can understand some part of, which is what "identical input"
 * requires — the alternative is a per-server payload, i.e. a per-server branch.
 */
const INLAY_HINT_SETTINGS = {
  includeInlayParameterNameHints: "all",
  includeInlayParameterNameHintsWhenArgumentMatchesName: true,
  includeInlayFunctionParameterTypeHints: true,
  includeInlayVariableTypeHints: true,
  includeInlayVariableTypeHintsWhenTypeMatchesName: true,
  includeInlayPropertyDeclarationTypeHints: true,
  includeInlayFunctionLikeReturnTypeHints: true,
  includeInlayEnumMemberValueHints: true,
  parameterNames: { enabled: "all", suppressWhenArgumentMatchesName: false },
  parameterTypes: { enabled: true },
  variableTypes: { enabled: true, suppressWhenTypeMatchesName: false },
  propertyDeclarationTypes: { enabled: true },
  functionLikeReturnTypes: { enabled: true },
  enumMemberValues: { enabled: true },
};

export const EDITOR_SETTINGS = {
  typescript: { inlayHints: INLAY_HINT_SETTINGS },
  javascript: { inlayHints: INLAY_HINT_SETTINGS },
  vue: {
    inlayHints: {
      destructuredProps: true,
      missingProps: true,
      inlineHandlerLeading: true,
      optionsWrapper: true,
      vBindShorthand: true,
    },
  },
};

/** One timeout, one settle, for every operation and every server. */
const REQUEST_TIMEOUT_MS = 45_000;
const SETTLE_AFTER_OPEN_MS = 400;
const SETTLE_AFTER_CONFIG_MS = 200;
const SETTLE_AFTER_EDIT_MS = 200;

/* -------------------------------------------------------------------------- */
/* Positions — all derived from the source, never written down                 */
/* -------------------------------------------------------------------------- */

/** Every position of `needle`, found by walking positionOf until it runs out. */
export function occurrencesOf(source, needle) {
  const out = [];
  for (let n = 1; ; n++) {
    try {
      out.push(positionOf(source, needle, n));
    } catch {
      return out;
    }
  }
}

/**
 * Everything the gates need to know about the fixture, computed from its text.
 *
 * A hard-coded line number points at whitespace the moment the fixture gains a
 * line, and the suite then measures folding against a block that is not there.
 */
export function expectationsFor(source) {
  const lines = source.split(/\r?\n/);
  const lastLine = lines.length - 1;
  return {
    lastLine,
    template: {
      openLine: positionOf(source, "<template>").line,
      closeLine: positionOf(source, "</template>").line,
    },
    script: {
      openLine: positionOf(source, "<script setup").line,
      closeLine: positionOf(source, "</script>").line,
    },
    // Caret on the declaration — where a reader's cursor lands when they click
    // the symbol they are about to rename.
    highlightProbe: positionOf(source, HIGHLIGHT_SYMBOL, 1),
    highlightOccurrences: occurrencesOf(source, HIGHLIGHT_SYMBOL),
    documentRange: {
      start: { line: 0, character: 0 },
      end: { line: lastLine, character: 0 },
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Gates — pure functions over payloads, so tests can lock them to captures    */
/* -------------------------------------------------------------------------- */

/** JSON-RPC error text as thrown by LspClient, decoded when it is one. */
export function decodeRequestError(message) {
  try {
    const parsed = JSON.parse(message);
    if (parsed && typeof parsed === "object" && "message" in parsed) {
      return {
        code: typeof parsed.code === "number" ? parsed.code : null,
        text: String(parsed.message),
        raw: message,
      };
    }
  } catch {
    // Not JSON — a timeout or a transport failure. Report it verbatim.
  }
  return { code: null, text: message, raw: message };
}

/**
 * `SemanticTokens` gate.
 *
 * LSP packs five integers per token (deltaLine, deltaStart, length, type,
 * modifiers), so a well-formed array has a length that is a positive multiple of
 * 5. That is the whole structural claim; token COUNT is reported, never gated,
 * because servers legitimately colour different things (Volar emitted 48 tokens
 * for this fixture, Vize 15) and picking a threshold would just encode one
 * server's legend as the right answer.
 */
export function gateSemanticTokens(result) {
  if (result == null) {
    return { ok: false, reason: "returned null — no tokens at all for this document" };
  }
  // `SemanticTokens` is `{ data }`; a bare array is not spec but costs nothing
  // to accept and cannot make a wrong answer look right.
  const data = Array.isArray(result) ? result : result.data;
  if (!Array.isArray(data)) {
    const keys = result && typeof result === "object" ? Object.keys(result).join(",") : typeof result;
    return { ok: false, reason: `no \`data\` array in the response (got ${keys || "no keys"})` };
  }
  if (data.length === 0) return { ok: false, reason: "empty token array" };
  if (data.length % 5 !== 0) {
    return {
      ok: false,
      reason: `data.length ${data.length} is not a multiple of 5 — LSP encodes 5 integers per token`,
    };
  }
  const badAt = data.findIndex((n) => !Number.isInteger(n) || n < 0);
  if (badAt !== -1) {
    return {
      ok: false,
      reason: `data[${badAt}] is ${JSON.stringify(data[badAt])}, not a non-negative integer`,
    };
  }
  return {
    ok: true,
    reason: "",
    tokens: data.length / 5,
    resultId: typeof result.resultId === "string" ? result.resultId : null,
  };
}

/**
 * `SemanticTokensDelta | SemanticTokens` gate.
 *
 * See the file header for why an empty `edits` array is accepted.
 */
export function gateSemanticTokensDelta(result) {
  if (result == null) {
    return { ok: false, reason: "returned null — neither a delta nor a full token set" };
  }
  if (Array.isArray(result?.edits)) {
    for (let i = 0; i < result.edits.length; i++) {
      const e = result.edits[i];
      if (!Number.isInteger(e?.start) || !Number.isInteger(e?.deleteCount)) {
        return { ok: false, reason: `edits[${i}] has no integer start/deleteCount` };
      }
      if (e.data !== undefined) {
        if (!Array.isArray(e.data) || e.data.length % 5 !== 0) {
          return { ok: false, reason: `edits[${i}].data is not a whole number of 5-integer tokens` };
        }
        const badAt = e.data.findIndex((n) => !Number.isInteger(n) || n < 0);
        if (badAt !== -1) {
          return { ok: false, reason: `edits[${i}].data[${badAt}] is not a non-negative integer` };
        }
      }
    }
    return {
      ok: true,
      reason: "",
      kind: "delta",
      edits: result.edits.length,
      resultId: typeof result.resultId === "string" ? result.resultId : null,
    };
  }
  const full = gateSemanticTokens(result);
  if (full.ok) return { ok: true, reason: "", kind: "full", tokens: full.tokens, resultId: full.resultId };
  return {
    ok: false,
    reason: `no \`edits\` array, and not a valid full token set either: ${full.reason}`,
  };
}

/**
 * Flatten every legal documentSymbol shape into one list.
 *
 * `DocumentSymbol` nests through `children` and carries `range`;
 * `SymbolInformation` is flat and hides its range in `location.range`. A server
 * may answer with either — ours answer with both, depending on the document —
 * and the LSP spec allows a client to receive either regardless of what it
 * advertised.
 */
export function flattenSymbols(result, out = []) {
  if (!Array.isArray(result)) return out;
  for (const s of result) {
    if (!s || typeof s.name !== "string") continue;
    const range = s.range ?? s.location?.range ?? null;
    out.push({
      name: s.name,
      kind: typeof s.kind === "number" ? s.kind : null,
      range,
      container: typeof s.containerName === "string" ? s.containerName : null,
    });
    if (Array.isArray(s.children)) flattenSymbols(s.children, out);
  }
  return out;
}

const IDENTIFIER = /[A-Za-z_$][A-Za-z0-9_$]*/g;

/** LSP SymbolKind values for a callable. */
const FUNCTION_KINDS = new Set([6 /* Method */, 9 /* Constructor */, 12 /* Function */]);

/**
 * Outline gate: the named script bindings are all present, and the outline
 * actually points into the script block.
 *
 * Names are compared exactly first, then as whole identifiers inside the symbol
 * name, because servers decorate: `script setup (ts)`, `const threshold`,
 * `addEntry(label, weight)` are all names a correct server might emit for a
 * symbol this suite is looking for. Whole-identifier matching is what keeps
 * `entries` from being credited to `visibleEntries` — a substring test would
 * pass an outline that never mentioned `entries` at all.
 */
export function gateDocumentSymbols(result, expected, script) {
  if (result == null) return { ok: false, reason: "returned null — no outline" };
  if (!Array.isArray(result)) {
    return { ok: false, reason: `expected an array of symbols, got ${typeof result}` };
  }
  const flat = flattenSymbols(result);
  if (flat.length === 0) return { ok: false, reason: "no symbols in the outline" };

  const exact = new Set(flat.map((s) => s.name));
  const identifiers = new Set();
  for (const s of flat) for (const id of s.name.match(IDENTIFIER) ?? []) identifiers.add(id);

  const missing = expected.filter((n) => !exact.has(n) && !identifiers.has(n));
  if (missing.length) {
    return {
      ok: false,
      reason: `outline is missing ${missing.length}/${expected.length} script symbols: ${missing.join(", ")}`,
      count: flat.length,
      names: [...exact],
    };
  }

  // An outline that names the functions but ranges them outside the script is
  // not usable for breadcrumbs, and would mean the server mapped the virtual
  // TypeScript file back to the wrong place.
  const anchored = flat.some(
    (s) =>
      FUNCTION_KINDS.has(s.kind) &&
      Number.isInteger(s.range?.start?.line) &&
      s.range.start.line > script.openLine &&
      s.range.start.line < script.closeLine,
  );
  if (!anchored) {
    return {
      ok: false,
      reason: `no function symbol is ranged inside the script block (lines ${script.openLine}-${script.closeLine})`,
      count: flat.length,
      names: [...exact],
    };
  }
  return { ok: true, reason: "", count: flat.length, names: [...exact] };
}

/** (line, character) ordering, so "is this position inside this range" is one compare. */
function beforeOrEqual(a, b) {
  return a.line < b.line || (a.line === b.line && a.character <= b.character);
}

function rangeCovers(range, pos) {
  if (!Number.isInteger(range?.start?.line) || !Number.isInteger(range?.end?.line)) return false;
  return beforeOrEqual(range.start, pos) && beforeOrEqual(pos, range.end);
}

/**
 * Highlight gate: at least two of the known occurrences of the probe symbol are
 * covered by a returned range.
 *
 * "At least 2 ranges" alone would pass a server that returned two ranges over
 * the wrong symbol, so the ranges are checked against the positions the fixture
 * actually puts `entries` at. Coverage rather than exact equality, because a
 * server is entitled to return a wider range (the whole declarator, say) and
 * still be pointing at the right thing.
 */
export function gateDocumentHighlights(result, occurrences, minimum = 2) {
  if (result == null) return { ok: false, reason: "returned null — no highlights" };
  if (!Array.isArray(result)) {
    return { ok: false, reason: `expected an array of highlights, got ${typeof result}` };
  }
  if (result.length < minimum) {
    return {
      ok: false,
      reason: `${result.length} range(s); the fixture uses the symbol ${occurrences.length} times so at least ${minimum} are expected`,
      count: result.length,
      matched: 0,
    };
  }
  const matched = occurrences.filter((occ) =>
    result.some((h) => rangeCovers(h?.range, occ)),
  ).length;
  if (matched < minimum) {
    return {
      ok: false,
      reason: `${result.length} range(s) returned but only ${matched} of the ${occurrences.length} known occurrences are covered — highlighting something else`,
      count: result.length,
      matched,
    };
  }
  return { ok: true, reason: "", count: result.length, matched };
}

/** `InlayHint.label` is a string OR an InlayHintLabelPart[]. Flatten both. */
export function inlayLabelText(label) {
  if (typeof label === "string") return label;
  if (Array.isArray(label)) {
    return label
      .map((part) => (typeof part === "string" ? part : typeof part?.value === "string" ? part.value : ""))
      .join("");
  }
  return "";
}

/**
 * Inlay hint gate: at least one hint that carries a label and sits on the
 * inferable bindings in the script block.
 *
 * The anchor matters. A hint with an empty label, or one parked at 0:0, is not
 * evidence that anything was inferred — and this fixture puts the untyped
 * `ref()`/`computed()` bindings and the parameterised calls inside
 * `<script setup>` precisely so "sensibly positioned" has an address. One
 * qualifying hint is enough: a stray malformed hint among good ones must not
 * sink a server that did the work.
 */
export function gateInlayHints(result, { script, lastLine }) {
  if (result == null) {
    return { ok: false, reason: "returned null — no inlay hints for a document full of inferable bindings" };
  }
  const hints = Array.isArray(result) ? result : Array.isArray(result?.items) ? result.items : null;
  if (!hints) return { ok: false, reason: `expected an array of hints, got ${typeof result}` };
  if (hints.length === 0) return { ok: false, reason: "empty hint array" };

  let labelled = 0;
  let inBounds = 0;
  let best = null;
  for (const h of hints) {
    const text = inlayLabelText(h?.label).trim();
    if (text) labelled++;
    const pos = h?.position;
    const positioned =
      Number.isInteger(pos?.line) &&
      Number.isInteger(pos?.character) &&
      pos.line >= 0 &&
      pos.line <= lastLine &&
      pos.character >= 0;
    if (positioned) inBounds++;
    if (text && positioned && pos.line > script.openLine && pos.line < script.closeLine) {
      best ??= { text, line: pos.line, character: pos.character };
    }
  }
  if (!best) {
    return {
      ok: false,
      reason: `${hints.length} hint(s), ${labelled} with a label, ${inBounds} inside the document, none labelled AND inside the script block (lines ${script.openLine}-${script.closeLine})`,
      count: hints.length,
    };
  }
  return { ok: true, reason: "", count: hints.length, best };
}

/**
 * Folding gate: some returned range folds the whole template block or the whole
 * script block.
 *
 * Both closing conventions are accepted — a fold may end on the line holding the
 * closing tag or on the last line before it, and both are what editors draw.
 */
export function gateFoldingRanges(result, { template, script }) {
  if (result == null) return { ok: false, reason: "returned null — no folding ranges" };
  if (!Array.isArray(result)) {
    return { ok: false, reason: `expected an array of ranges, got ${typeof result}` };
  }
  if (result.length === 0) return { ok: false, reason: "empty folding range array" };

  const covers = (r, block) =>
    Number.isInteger(r?.startLine) &&
    Number.isInteger(r?.endLine) &&
    r.startLine <= block.openLine &&
    r.endLine >= block.closeLine - 1;

  const foldsTemplate = result.some((r) => covers(r, template));
  const foldsScript = result.some((r) => covers(r, script));
  if (!foldsTemplate && !foldsScript) {
    return {
      ok: false,
      reason: `${result.length} range(s), none covering the template (lines ${template.openLine}-${template.closeLine}) or the script (lines ${script.openLine}-${script.closeLine})`,
      count: result.length,
      covers: [],
    };
  }
  return {
    ok: true,
    reason: "",
    count: result.length,
    covers: [foldsTemplate && "template", foldsScript && "script"].filter(Boolean),
  };
}

/* -------------------------------------------------------------------------- */
/* Suite                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Turn the editor's settings on in every process of the session.
 *
 * `ctx.notify()` forwards to `hybrid.notify?.()`, which the tsserver bridge does
 * not implement, so a plain notify reaches only the Vue half of the Volar pair —
 * and the Vue half of Volar v3 answers no TypeScript features at all. Sending to
 * every client in the session is the same thing an editor does when the user
 * changes a setting, and it is not a per-server branch: single-process servers
 * simply have one client in the list.
 */
function configureEditor(ctx) {
  const clients = [ctx.client, ctx.hybrid?.tsClient].filter(Boolean);
  for (const c of clients) {
    c.sendNotification("workspace/didChangeConfiguration", { settings: EDITOR_SETTINGS });
  }
  return clients.length;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const SUITE = {
  id: "background",
  label: "Background (editor chatter)",

  buildWorkspace(dir) {
    scaffold(dir);
    writeFileSync(join(dir, "Background.vue"), SOURCE);
    return {
      dir,
      file: join(dir, "Background.vue"),
      fileRel: "Background.vue",
      source: SOURCE,
      editedSource: EDITED_SOURCE,
      expect: expectationsFor(SOURCE),
    };
  },

  async measure(ctx) {
    const { ask, openDoc, changeDoc, ws, pathToFileUri, verbose } = ctx;
    const uri = pathToFileUri(ws.file);
    const expect = ws.expect;

    const dump = (what, value) => {
      if (!verbose) return;
      process.stderr.write(`[background:${ctx.server.id}] ${what} ${JSON.stringify(value)}\n`);
    };

    // Settings first, then open — the order an editor uses, and the order
    // typescript-language-server needs if the file is to be configured with
    // inlay hints enabled when it is first opened.
    const configured = configureEditor(ctx);
    openDoc(uri, ws.source);
    await sleep(SETTLE_AFTER_OPEN_MS);
    configureEditor(ctx);
    await sleep(SETTLE_AFTER_CONFIG_MS);
    dump("configured-clients", configured);

    const ops = [];
    let previousResultId = null;

    /* 1. Semantic tokens ---------------------------------------------------- */
    ops.push(
      await timed("semantic-tokens-full", "Semantic tokens (full)", async () => {
        const res = await ask(
          "textDocument/semanticTokens/full",
          { textDocument: { uri } },
          REQUEST_TIMEOUT_MS,
        );
        dump("semanticTokens/full", res);
        const gate = gateSemanticTokens(res);
        previousResultId = gate.resultId ?? null;
        const data = Array.isArray(res) ? res : res?.data;
        return {
          valid: gate.ok,
          reason: gate.reason,
          sample: gate.ok
            ? `${gate.tokens} tokens, resultId=${JSON.stringify(gate.resultId)}, data[0..9]=${JSON.stringify((data ?? []).slice(0, 10))}`
            : JSON.stringify(res).slice(0, 200),
          artifact: gate.ok ? gate.tokens : undefined,
        };
      }),
    );

    /* 2. Semantic tokens delta, after a small edit -------------------------- */
    // The edit is applied OUTSIDE the timed region: this row is the cost of the
    // delta request, not the cost of a keystroke.
    changeDoc(uri, ws.editedSource, 2);
    await sleep(SETTLE_AFTER_EDIT_MS);

    ops.push(
      await timed("semantic-tokens-delta", "Semantic tokens (delta after edit)", async () => {
        // A server that returned no resultId never invited a delta; ask anyway,
        // with the LSP-legal fallback of an unknown id, because "does not
        // implement it" is a result to record, not a row to skip.
        const previous = previousResultId ?? "0";
        let res;
        try {
          res = await ask(
            "textDocument/semanticTokens/full/delta",
            { textDocument: { uri }, previousResultId: previous },
            REQUEST_TIMEOUT_MS,
          );
        } catch (e) {
          const err = decodeRequestError(e.message);
          dump("semanticTokens/full/delta:error", err.raw);
          return {
            valid: false,
            reason:
              err.code === -32601
                ? `not implemented (JSON-RPC ${err.code}: ${err.text}); the full request ${previousResultId ? `DID return resultId ${JSON.stringify(previousResultId)}, which invites a delta` : "returned no resultId"}`
                : `request failed: ${err.text}`,
            sample: err.raw,
          };
        }
        dump("semanticTokens/full/delta", res);
        const gate = gateSemanticTokensDelta(res);
        return {
          valid: gate.ok,
          reason: gate.reason,
          sample: gate.ok
            ? `${gate.kind}: ${gate.kind === "delta" ? `${gate.edits} edit(s)` : `${gate.tokens} tokens`}, previousResultId=${JSON.stringify(previous)}`
            : JSON.stringify(res).slice(0, 200),
          artifact: gate.ok ? (gate.kind === "delta" ? gate.edits : gate.tokens) : undefined,
        };
      }),
    );

    /* 3. Document symbols --------------------------------------------------- */
    ops.push(
      await timed("document-symbol", "Document symbols (outline)", async () => {
        const res = await ask(
          "textDocument/documentSymbol",
          { textDocument: { uri } },
          REQUEST_TIMEOUT_MS,
        );
        dump("documentSymbol", res);
        const gate = gateDocumentSymbols(res, EXPECTED_SYMBOLS, expect.script);
        return {
          valid: gate.ok,
          reason: gate.reason,
          sample: `${gate.count ?? 0} symbols: ${(gate.names ?? []).join(", ")}`,
          artifact: gate.count,
        };
      }),
    );

    /* 4. Document highlight ------------------------------------------------- */
    ops.push(
      await timed("document-highlight", "Document highlight (caret move)", async () => {
        const res = await ask(
          "textDocument/documentHighlight",
          { textDocument: { uri }, position: expect.highlightProbe },
          REQUEST_TIMEOUT_MS,
        );
        dump("documentHighlight", res);
        const gate = gateDocumentHighlights(res, expect.highlightOccurrences);
        return {
          valid: gate.ok,
          reason: gate.reason,
          sample: `${gate.count ?? 0} range(s), ${gate.matched ?? 0}/${expect.highlightOccurrences.length} occurrences of \`${HIGHLIGHT_SYMBOL}\` covered`,
          artifact: gate.count,
        };
      }),
    );

    /* 5. Inlay hints -------------------------------------------------------- */
    ops.push(
      await timed("inlay-hint", "Inlay hints (document range)", async () => {
        const res = await ask(
          "textDocument/inlayHint",
          { textDocument: { uri }, range: expect.documentRange },
          REQUEST_TIMEOUT_MS,
        );
        dump("inlayHint", res);
        const gate = gateInlayHints(res, expect);
        return {
          valid: gate.ok,
          reason: gate.reason,
          sample: gate.ok
            ? `${gate.count} hint(s); e.g. ${JSON.stringify(gate.best.text)} at ${gate.best.line}:${gate.best.character}`
            : JSON.stringify(res).slice(0, 200),
          artifact: gate.count,
        };
      }),
    );

    /* 6. Folding ranges ----------------------------------------------------- */
    ops.push(
      await timed("folding-range", "Folding ranges", async () => {
        const res = await ask(
          "textDocument/foldingRange",
          { textDocument: { uri } },
          REQUEST_TIMEOUT_MS,
        );
        dump("foldingRange", res);
        const gate = gateFoldingRanges(res, expect);
        return {
          valid: gate.ok,
          reason: gate.reason,
          sample: gate.ok
            ? `${gate.count} range(s), folds: ${gate.covers.join("+")}`
            : JSON.stringify(res).slice(0, 200),
          artifact: gate.count,
        };
      }),
    );

    return ops;
  },
};
