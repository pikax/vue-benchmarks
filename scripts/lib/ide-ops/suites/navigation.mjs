/**
 * NAVIGATION suite — cross-file navigation and refactoring.
 *
 * Every operation here is deliberately CROSS-FILE. The prior `definition`
 * measurement in this repo fired at a symbol's own declaration, so the answer
 * "here" was both instant and correct, and the number meant nothing: no module
 * graph was walked, no `.vue` was mapped into TypeScript, no template binding
 * was resolved. A definition that resolves to itself is not navigation.
 *
 * So the workspace is a real (small) component tree:
 *
 *   Parent.vue     — imports ChildCard.vue, uses `<ChildCard :captionText=… />`,
 *                    imports `formatCaption` from helpers.ts and a type from
 *                    types.ts, and carries one deliberate typo as a quick-fix
 *                    site.
 *   ChildCard.vue  — declares the props. `captionText` is the rename/reference
 *                    subject.
 *   helpers.ts     — `formatCaption(rawText, repeat)`: definition + signature
 *                    help target. `rawText` is deliberately NOT a substring of
 *                    the function name, so a gate matching it cannot be
 *                    satisfied by the function name alone.
 *   types.ts       — `CaptionOptions`: the typeDefinition target, in its own
 *                    module so the typeDefinition gate is distinguishable from
 *                    the definition gate.
 *   Messy.vue      — syntactically valid, atrociously formatted. Formatting
 *                    target. Its edits are INSPECTED, never written.
 *
 * The gate that matters most is the rename. Renaming `captionText` must produce
 * a WorkspaceEdit touching Parent.vue's TEMPLATE as well as ChildCard.vue's
 * declaration. A server that rewrites the declaration and leaves
 * `:captionText="heading"` behind has produced a refactor that does not
 * compile, and reporting that as a fast success would be worse than reporting
 * nothing. It is `valid:false`.
 *
 * Gate-writing rules obeyed throughout (see context.mjs):
 *   - Every legal LSP response shape is handled BEFORE a server is failed:
 *     Location | Location[] | LocationLink[] for definition family;
 *     `changes` | `documentChanges` (incl. AnnotatedTextEdit) for WorkspaceEdit;
 *     CodeAction | Command for code actions; string | [start,end] for
 *     ParameterInformation.label. An unhandled shape is this file's bug.
 *   - URIs are compared by normalised path, never by string equality. On
 *     Windows the same file legitimately arrives as `file:///D:/…`,
 *     `file:///d%3A/…` and `file:///d:/…`; and a Vue file may legitimately be
 *     reported as its generated `…/ChildCard.vue.ts` twin.
 *   - Identical timeouts, positions, payloads and merge policy for every
 *     server. No per-server branches exist in this file.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { budgetOf } from "../budget.mjs";
import { mergeHover, shouldMeasure, timed, timedColdWarm } from "../context.mjs";
import { positionAfter, positionOf, scaffold } from "../workspace.mjs";

/**
 * Budgets come from `ctx.budget` (budget.mjs), scaled by workspace size, and
 * are identical for every server as they always were. This suite writes 5
 * files, so it sits at the small-project floor.
 *
 * Two classes are in play here. Most operations are positional — definition,
 * type definition, prepareRename, signature help — and answer from state the
 * server already holds: `budget.warmMs`. `references` and `rename` are not:
 * both walk every file in the project on every call, and their cost tracks
 * project size directly. They get `budget.projectMs`, the same ramp cold work
 * rides. At 5 files the two are 5s and 60s; the distinction only bites in the
 * scale suite, where references@500 MEASURED 51.13s.
 */

const PROP_NAME = "captionText";
const NEW_NAME = "renamedCaption";
const PARAM_NAME = "rawText";
/** Misspelling of `fixtureLabel`; not a substring of it, so positionOf is exact. */
const TYPO = "fixtureLabl";

const PARENT_SOURCE = `<template>
  <main class="parent">
    <ChildCard :captionText="heading" :repeatCount="repeatTimes" />
  </main>
</template>

<script setup lang="ts">
import ChildCard from './ChildCard.vue'
import { formatCaption } from './helpers'
import type { CaptionOptions } from './types'

const heading = 'navigation-bench'
const repeatTimes = 2

const captionOptions: CaptionOptions = { repeat: repeatTimes, upper: false }
const captionProbe = formatCaption(heading, repeatTimes)

const fixtureLabel = 'navigation-fixture'
// Deliberate typo below: TS2552, "Did you mean 'fixtureLabel'?" — quick-fix site.
const spellingProbe = ${TYPO}
</script>
`;

/**
 * Parent as it looks the instant after the `(` of a call has been typed and the
 * editor auto-closed it. Same line count, so nothing else shifts.
 */
const PARENT_TYPING_SOURCE = PARENT_SOURCE.replace(
  "formatCaption(heading, repeatTimes)",
  "formatCaption()",
);

const CHILD_SOURCE = `<template>
  <section class="child-card">
    <h3>{{ ${PROP_NAME} }}</h3>
    <p>{{ repeated }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  ${PROP_NAME}: string
  repeatCount: number
}>()

const repeated = computed(() => props.${PROP_NAME}.repeat(props.repeatCount))
</script>
`;

const TYPES_SOURCE = `/** typeDefinition target. Lives in its own module on purpose. */
export interface CaptionOptions {
  repeat: number
  upper: boolean
}
`;

const HELPERS_SOURCE = `import type { CaptionOptions } from './types'

export const DEFAULT_CAPTION_OPTIONS: CaptionOptions = { repeat: 1, upper: false }

/**
 * Definition + signatureHelp target.
 * \`${PARAM_NAME}\` is deliberately not a substring of the function name.
 */
export function formatCaption(${PARAM_NAME}: string, repeat: number): string {
  return ${PARAM_NAME}.repeat(repeat)
}
`;

/**
 * The diagnostic replayed to every server before asking for a quick fix.
 *
 * VERBATIM from a real push by one of the servers under test (`code`, `source`
 * and wording unchanged); only the range is re-derived from the fixture so it
 * cannot drift. It is fixed rather than harvested per server on purpose:
 *
 *   - `context.diagnostics` is INPUT. Harvesting each server's own diagnostics
 *     would hand every server a different request and break the "same input"
 *     rule, and the differences would be about diagnostic transport, not about
 *     code actions. Volar v3 serves diagnostics by PULL
 *     (`textDocument/diagnostic`), so a push-only wait leaves its context empty
 *     and tsserver, which derives its `errorCodes` from that context, then
 *     offers only refactors — a measurement of the harness's wait loop.
 *   - Replaying the diagnostic an editor just received is exactly what an
 *     editor does when the lightbulb is opened.
 */
const QUICK_FIX_DIAGNOSTIC = {
  severity: 1,
  code: 2552,
  source: "ts",
  message: `Cannot find name '${TYPO}'. Did you mean 'fixtureLabel'?`,
};

/** Syntactically valid, deliberately unformatted. Never written back. */
const MESSY_SOURCE = `<template>
     <div    class="messy"   >
  <span>{{msg}}</span>
        <em>{{ shouted }}</em>
      </div>
</template>

<script setup lang="ts">
import {ref}    from 'vue'
const     msg=ref(  'messy'  )
     function shout( first:string ,times:number ){
return first.repeat( times )
      }
const shouted   =shout(msg.value,3)
</script>
`;

/**
 * The fixture sources, exported so the gate regression test can replay captured
 * ranges against the exact text they were computed from — the only way to prove
 * a returned range covers the identifier it claims to.
 */
export const FIXTURES = {
  PARENT_SOURCE,
  PARENT_TYPING_SOURCE,
  CHILD_SOURCE,
  HELPERS_SOURCE,
  TYPES_SOURCE,
  MESSY_SOURCE,
  PROP_NAME,
  NEW_NAME,
  PARAM_NAME,
  TYPO,
  QUICK_FIX_DIAGNOSTIC,
};

/* -------------------------------------------------------------------------- */
/* URI + payload normalisation                                                */
/* -------------------------------------------------------------------------- */

/** Last path segment, for legible reasons. */
export function basename(p) {
  return String(p ?? "").split(/[\\/]/).filter(Boolean).pop() ?? "";
}

/**
 * Reduce a uri OR an absolute path to one comparable form.
 *
 * The same file legitimately arrives as `file:///D:/x/A.vue`,
 * `file:///d%3A/x/A.vue`, `file://D:/x/A.vue` and `D:\x\A.vue`. Comparing the
 * strings would report every server as answering about the wrong file.
 */
export function normalizeUri(uri) {
  if (typeof uri !== "string" || uri === "") return "";
  let p = uri.trim();
  try {
    p = decodeURIComponent(p);
  } catch {
    // Malformed percent-escape: compare what we were given rather than throw.
  }
  p = p.replace(/\\/g, "/");
  p = p.replace(/^file:\/*/i, "/");
  if (!p.startsWith("/")) p = `/${p}`;
  p = p.replace(/\/{2,}/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p.toLowerCase();
}

/**
 * True when `uri` designates `absPath`.
 *
 * Also accepts the generated twin of a Vue file (`ChildCard.vue.ts`): both
 * Volar's tsserver leg and a virtual-file server may answer with it, and an
 * editor maps it straight back. The suffix must be a bare alphabetic extension
 * so `A.vue.backup.vue` is still a different file.
 */
export function uriMatchesPath(uri, absPath) {
  const a = normalizeUri(uri);
  const b = normalizeUri(absPath);
  if (!a || !b) return false;
  if (a === b) return true;
  if (!a.startsWith(`${b}.`)) return false;
  return /^[a-z]+$/.test(a.slice(b.length + 1));
}

/** Location | Location[] | LocationLink[] | null -> [{ uri, range }]. */
export function toLocations(result) {
  const out = [];
  const push = (item) => {
    if (!item || typeof item !== "object") return;
    if (typeof item.uri === "string") {
      out.push({ uri: item.uri, range: item.range ?? null });
      return;
    }
    if (typeof item.targetUri === "string") {
      out.push({
        uri: item.targetUri,
        range: item.targetSelectionRange ?? item.targetRange ?? null,
      });
    }
  };
  if (Array.isArray(result)) for (const r of result) push(r);
  else push(result);
  return out;
}

function locationKey(l) {
  const r = l.range;
  const span = r
    ? `${r.start?.line}:${r.start?.character}-${r.end?.line}:${r.end?.character}`
    : "";
  return `${normalizeUri(l.uri)}#${span}`;
}

/**
 * Merge the location answers of several providers, as an editor does when it
 * shows one "Go to definition" list from every provider that replied.
 */
export function mergeLocations(...results) {
  const seen = new Set();
  const out = [];
  for (const r of results) {
    for (const l of toLocations(r)) {
      const k = locationKey(l);
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(l);
    }
  }
  return out.length ? out : null;
}

/** WorkspaceEdit (`changes` and/or `documentChanges`) -> [{ uri, edits }]. */
export function normalizeWorkspaceEdit(edit) {
  const byUri = new Map();
  const add = (uri, edits) => {
    if (typeof uri !== "string" || uri === "") return;
    const key = normalizeUri(uri);
    if (!byUri.has(key)) byUri.set(key, { uri, edits: [] });
    for (const e of Array.isArray(edits) ? edits : []) {
      // AnnotatedTextEdit is a TextEdit plus `annotationId`; same fields here.
      if (e && e.range && typeof e.newText === "string") byUri.get(key).edits.push(e);
    }
  };
  if (edit && typeof edit === "object") {
    if (edit.changes && typeof edit.changes === "object") {
      for (const [uri, edits] of Object.entries(edit.changes)) add(uri, edits);
    }
    if (Array.isArray(edit.documentChanges)) {
      for (const dc of edit.documentChanges) {
        if (!dc || typeof dc !== "object") continue;
        if (dc.textDocument && Array.isArray(dc.edits)) {
          add(dc.textDocument.uri, dc.edits);
        } else if (typeof dc.kind === "string") {
          // Create/Rename/Delete file operations carry no text edits, but the
          // file they name is still part of the refactor.
          add(dc.newUri ?? dc.uri, []);
        }
      }
    }
  }
  return [...byUri.values()];
}

function textEditKey(e) {
  const r = e.range ?? {};
  return `${r.start?.line}:${r.start?.character}-${r.end?.line}:${r.end?.character}=>${e.newText}`;
}

/**
 * Merge WorkspaceEdits from several providers, deduplicating identical edits.
 *
 * Volar answers rename from its Vue half AND (through the bridge) from
 * tsserver; without the dedupe the same edit would be counted twice and the
 * artifact census would be fiction.
 */
export function mergeWorkspaceEdits(...edits) {
  const byUri = new Map();
  for (const edit of edits) {
    for (const file of normalizeWorkspaceEdit(edit)) {
      const key = normalizeUri(file.uri);
      if (!byUri.has(key)) byUri.set(key, { uri: file.uri, seen: new Set(), edits: [] });
      const slot = byUri.get(key);
      for (const te of file.edits) {
        const k = textEditKey(te);
        if (slot.seen.has(k)) continue;
        slot.seen.add(k);
        slot.edits.push(te);
      }
    }
  }
  if (!byUri.size) return null;
  const changes = {};
  for (const slot of byUri.values()) changes[slot.uri] = slot.edits;
  return { changes };
}

/** CodeAction[] | Command[] | null, merged and deduplicated by title+kind. */
export function mergeCodeActions(...results) {
  const seen = new Set();
  const out = [];
  for (const r of results) {
    const items = Array.isArray(r) ? r : r ? [r] : [];
    for (const a of items) {
      if (!a || typeof a !== "object") continue;
      const k = `${a.title ?? ""}|${a.kind ?? ""}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(a);
    }
  }
  return out.length ? out : null;
}

/** SignatureHelp merge: concatenate signatures, keep the first active index. */
export function mergeSignatureHelp(...results) {
  const signatures = [];
  let activeSignature;
  let activeParameter;
  for (const r of results) {
    const sigs = Array.isArray(r?.signatures) ? r.signatures : Array.isArray(r) ? r : [];
    for (const s of sigs) if (s && typeof s === "object") signatures.push(s);
    if (activeSignature == null && typeof r?.activeSignature === "number") {
      activeSignature = r.activeSignature;
    }
    if (activeParameter == null && typeof r?.activeParameter === "number") {
      activeParameter = r.activeParameter;
    }
  }
  if (!signatures.length) return null;
  return { signatures, activeSignature: activeSignature ?? 0, activeParameter: activeParameter ?? 0 };
}

/**
 * Formatting is owned by ONE provider — concatenating two formatters' edits
 * would produce overlapping, mutually invalid ranges. Take the first leg that
 * produced edits, which is the server's own answer; the TS leg is a fallback.
 */
export function pickFormatting(...results) {
  for (const r of results) if (Array.isArray(r) && r.length) return r;
  for (const r of results) if (r != null) return r;
  return null;
}

/** prepareRename merge: the first leg that offered a rename wins. */
export function pickPrepareRename(...results) {
  for (const r of results) if (r != null) return r;
  return null;
}

/* -------------------------------------------------------------------------- */
/* Text-edit application (inspection only — nothing is written to disk)        */
/* -------------------------------------------------------------------------- */

function lineStartsOf(text) {
  const starts = [0];
  for (let i = 0; i < text.length; i++) if (text[i] === "\n") starts.push(i + 1);
  return starts;
}

function offsetAt(text, starts, pos) {
  if (!pos || typeof pos.line !== "number" || typeof pos.character !== "number") return null;
  const line = Math.max(0, Math.min(pos.line, starts.length - 1));
  const lineStart = starts[line];
  const lineEnd = line + 1 < starts.length ? starts[line + 1] : text.length;
  return Math.min(lineStart + Math.max(0, pos.character), lineEnd);
}

/** Apply TextEdit[] to a string, in memory. Used to prove edits change something. */
export function applyTextEdits(text, edits) {
  const list = (Array.isArray(edits) ? edits : []).filter(
    (e) => e && e.range && typeof e.newText === "string",
  );
  if (!list.length) return text;
  const starts = lineStartsOf(text);
  const resolved = [];
  for (let i = 0; i < list.length; i++) {
    const e = list[i];
    const start = offsetAt(text, starts, e.range.start);
    const end = offsetAt(text, starts, e.range.end);
    if (start == null || end == null) continue;
    resolved.push({ i, start: Math.min(start, end), end: Math.max(start, end), newText: e.newText });
  }
  resolved.sort((a, b) => b.start - a.start || b.end - a.end || b.i - a.i);
  let out = text;
  for (const e of resolved) {
    const s = Math.max(0, Math.min(e.start, out.length));
    const t = Math.max(s, Math.min(e.end, out.length));
    out = out.slice(0, s) + e.newText + out.slice(t);
  }
  return out;
}

/** Substring covered by an LSP range, or "" if the range is unusable. */
export function textInRange(text, range) {
  if (!range) return "";
  const starts = lineStartsOf(text);
  const s = offsetAt(text, starts, range.start);
  const e = offsetAt(text, starts, range.end);
  if (s == null || e == null) return "";
  return text.slice(Math.min(s, e), Math.max(s, e));
}

/** Case/punctuation-insensitive identity, so `renamed-caption` matches `renamedCaption`. */
function squash(s) {
  return String(s ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

/* -------------------------------------------------------------------------- */
/* Gates                                                                       */
/* -------------------------------------------------------------------------- */

function describeLocations(locs) {
  return locs
    .map(
      (l) =>
        `${basename(normalizeUri(l.uri))}@${l.range?.start?.line ?? "?"}:${
          l.range?.start?.character ?? "?"
        }`,
    )
    .join(" ");
}

/**
 * definition / typeDefinition: at least one location must land in `targetPath`.
 *
 * Accepting "at least one" rather than "exactly one" is deliberate: a server
 * that returns both the local import binding and the real declaration has still
 * navigated the user across the file boundary, and failing it would be a false
 * fail. Returning ONLY locations inside the current file is the failure this
 * gate exists to catch.
 */
export function gateDefinition(result, { targetPath, currentPath, what = "definition" }) {
  const locs = toLocations(result);
  const hit = locs.some((l) => uriMatchesPath(l.uri, targetPath));
  const onlyCurrent =
    !hit && locs.length > 0 && locs.every((l) => uriMatchesPath(l.uri, currentPath));
  const seen = [...new Set(locs.map((l) => basename(normalizeUri(l.uri))))];
  return {
    valid: hit,
    reason: hit
      ? ""
      : locs.length === 0
        ? `${what} returned no location`
        : onlyCurrent
          ? `${what} stayed inside ${basename(currentPath)} — never crossed into ${basename(targetPath)}`
          : `${what} resolved to ${seen.join(", ")} — expected ${basename(targetPath)}`,
    sample: locs.length ? describeLocations(locs) : JSON.stringify(result ?? null),
    artifact: locs.length,
  };
}

/**
 * references: both the declaration file and the consuming file must appear.
 *
 * The declaration alone is what a server produces when it searches the current
 * document only; the point of the operation is the use site in another file's
 * template.
 */
export function gateReferences(result, { declPath, usePath }) {
  const locs = toLocations(result);
  const hasDecl = locs.some((l) => uriMatchesPath(l.uri, declPath));
  const hasUse = locs.some((l) => uriMatchesPath(l.uri, usePath));
  const seen = [...new Set(locs.map((l) => basename(normalizeUri(l.uri))))];
  const missing = [];
  if (!hasDecl) missing.push(basename(declPath));
  if (!hasUse) missing.push(basename(usePath));
  return {
    valid: hasDecl && hasUse,
    reason:
      hasDecl && hasUse
        ? ""
        : locs.length === 0
          ? "references returned nothing"
          : `references missing ${missing.join(" + ")} — only found ${seen.join(", ")}`,
    sample: locs.length ? describeLocations(locs) : JSON.stringify(result ?? null),
    artifact: locs.length,
  };
}

/**
 * prepareRename: Range | { range, placeholder } | { defaultBehavior } | null.
 *
 * `defaultBehavior: true` is a full-strength positive answer ("use the word at
 * the cursor"), so it passes without a range. A returned range is checked
 * against the source it was computed from, which is the only way to tell a
 * range over the identifier from a range over something else.
 */
export function gatePrepareRename(result, { source, expected }) {
  if (result == null) {
    return {
      valid: false,
      reason: "prepareRename returned null — server declines to rename at this position",
      sample: JSON.stringify(result ?? null),
    };
  }
  if (typeof result !== "object") {
    return {
      valid: false,
      reason: `prepareRename returned a ${typeof result}, not a Range/placeholder/defaultBehavior`,
      sample: JSON.stringify(result),
    };
  }
  if (result.defaultBehavior === true) {
    return { valid: true, reason: "", sample: JSON.stringify(result) };
  }
  if (typeof result.placeholder === "string") {
    const ok = squash(result.placeholder).includes(squash(expected));
    return {
      valid: ok,
      reason: ok ? "" : `placeholder ${JSON.stringify(result.placeholder)} is not ${expected}`,
      sample: JSON.stringify(result),
    };
  }
  const range = result.range ?? (result.start && result.end ? result : null);
  if (!range?.start || !range?.end) {
    return {
      valid: false,
      reason: "prepareRename returned neither a Range, a placeholder, nor defaultBehavior",
      sample: JSON.stringify(result).slice(0, 200),
    };
  }
  const covered = textInRange(source, range);
  const ok = squash(covered).includes(squash(expected));
  return {
    valid: ok,
    reason: ok ? "" : `rename range covers ${JSON.stringify(covered)} — expected ${expected}`,
    sample: `${JSON.stringify(range)} -> ${JSON.stringify(covered)}`,
  };
}

/**
 * THE KILLER GATE.
 *
 * A rename of a prop is only correct if the WorkspaceEdit reaches the consuming
 * template. A server that edits only the declaration has produced a refactor
 * that leaves `:captionText="heading"` bound to a prop that no longer exists —
 * broken code, delivered fast. That is `valid:false`, not a caveat.
 */
export function gateRename(edit, { templatePath, declPath, newName }) {
  const files = normalizeWorkspaceEdit(edit);
  const total = files.reduce((n, f) => n + f.edits.length, 0);
  const template = files.find((f) => uriMatchesPath(f.uri, templatePath));
  const decl = files.find((f) => uriMatchesPath(f.uri, declPath));
  const seen = files.map((f) => `${basename(normalizeUri(f.uri))}:${f.edits.length}`);

  if (!files.length || total === 0) {
    return {
      valid: false,
      reason:
        edit == null
          ? "rename returned no WorkspaceEdit"
          : "rename returned a WorkspaceEdit with no text edits",
      sample: JSON.stringify(edit ?? null).slice(0, 200),
      artifact: total,
    };
  }

  const templateEdits = template?.edits ?? [];
  const carriesNewName = templateEdits.some((e) => squash(e.newText).includes(squash(newName)));
  const valid = templateEdits.length > 0 && carriesNewName;

  let reason = "";
  if (!template || templateEdits.length === 0) {
    reason = `BROKEN REFACTOR: edited ${seen.join(", ")} but produced no edit in ${basename(
      templatePath,
    )} — the template usage is left behind`;
  } else if (!carriesNewName) {
    reason = `edit in ${basename(templatePath)} does not write ${newName}: ${JSON.stringify(
      templateEdits.map((e) => e.newText).slice(0, 3),
    )}`;
  }

  return {
    valid,
    reason,
    sample: `${seen.join(", ")}${decl ? "" : ` (no edit in ${basename(declPath)})`} :: ${JSON.stringify(
      templateEdits.map((e) => e.newText).slice(0, 3),
    )}`,
    artifact: total,
  };
}

/**
 * codeAction: CodeAction[] and Command[] are both legal; both need a title.
 *
 * The operation is "offer a quick fix for THIS diagnostic" — the diagnostic is
 * handed to every server as request input (see QUICK_FIX_DIAGNOSTIC). So a
 * title alone is not the gate. Two ways a response can look like an answer and
 * not be one, both of which the gate used to pass:
 *
 *   - an entry with a title and neither `edit` nor `command`: nothing an editor
 *     could apply. The `actionable` count was already computed and printed in
 *     the sample — `0/1 actionable` was reported next to `valid: true`, the
 *     gate contradicting its own evidence.
 *   - refactors only. `refactor.*` and `source.*` are, by the LSP kinds spec,
 *     things you can always offer anywhere ("Move to a new file", "Organize
 *     imports"); they are not a fix for the error at the cursor. A server that
 *     offers only those has not answered this request. Volar's real response
 *     carries `Change spelling to 'fixtureLabel'` (quickfix, with an edit) AND
 *     `Move to a new file` (refactor) — the first is the answer, and it still
 *     passes.
 *
 * An entry with NO `kind` counts as a candidate fix: `kind` is optional in the
 * spec and a bare `Command[]` has nowhere to put one, so requiring it would
 * fail a server for terseness rather than for behaviour. Only an explicitly
 * declared refactor/source action is excluded — the server said what it was.
 */
const NON_FIX_KIND = /^(refactor|source)\b/;

export function gateCodeActions(result) {
  const items = Array.isArray(result) ? result : result ? [result] : [];
  const titled = items.filter(
    (a) => a && typeof a === "object" && typeof a.title === "string" && a.title.trim() !== "",
  );
  // A CodeAction carries `edit` and/or a Command object; a bare Command carries
  // `command` as a string. Either one is actionable.
  const actionable = titled.filter((a) => a.edit != null || a.command != null);
  const fixes = actionable.filter((a) => !NON_FIX_KIND.test(String(a.kind ?? "")));

  const kinds = titled.map((a) => a.kind ?? "(no kind)");
  let reason = "";
  if (items.length === 0) reason = "codeAction returned nothing at the diagnostic";
  else if (titled.length === 0) reason = "codeAction returned entries without a title";
  else if (actionable.length === 0)
    reason = `codeAction returned ${titled.length} titled entr${
      titled.length === 1 ? "y" : "ies"
    } with no \`edit\` and no \`command\` — nothing an editor could apply`;
  else if (fixes.length === 0)
    reason = `codeAction offered only refactor/source actions (${[...new Set(kinds)].join(
      ", ",
    )}) — no quick fix for the diagnostic it was handed`;

  return {
    valid: fixes.length > 0,
    reason,
    sample: titled.length
      ? `${actionable.length}/${titled.length} actionable, ${fixes.length} quick fix :: ${titled
          .slice(0, 3)
          .map((a) => a.title)
          .join(" | ")}`
      : JSON.stringify(result ?? null),
    artifact: titled.length,
  };
}

/** ParameterInformation.label is `string` OR `[start, end]` into signature.label. */
export function signatureParamLabels(sig) {
  const label = typeof sig?.label === "string" ? sig.label : "";
  const params = Array.isArray(sig?.parameters) ? sig.parameters : [];
  return params.map((p) => {
    const l = p?.label;
    if (typeof l === "string") return l;
    if (Array.isArray(l) && l.length === 2 && typeof l[0] === "number" && typeof l[1] === "number") {
      return label.slice(l[0], l[1]);
    }
    return "";
  });
}

/**
 * signatureHelp: at least one signature naming the expected parameter.
 *
 * The signature label is accepted as evidence too. A server that renders
 * `formatCaption(rawText: string, repeat: number): string` but leaves
 * `parameters` empty has still shown the user the parameter, and failing it
 * would be a false fail. `rawText` appears nowhere else in the fixture, so the
 * label check cannot be satisfied by accident.
 */
export function gateSignatureHelp(result, expectedParam) {
  const sigs = Array.isArray(result?.signatures)
    ? result.signatures
    : Array.isArray(result)
      ? result
      : result?.label
        ? [result]
        : [];
  const want = squash(expectedParam);
  let hit = false;
  const rendered = [];
  for (const sig of sigs) {
    const names = signatureParamLabels(sig);
    const label = typeof sig?.label === "string" ? sig.label : "";
    rendered.push(label || names.join(", "));
    if (names.some((n) => squash(n).includes(want)) || squash(label).includes(want)) hit = true;
  }
  return {
    valid: hit,
    reason: hit
      ? ""
      : sigs.length === 0
        ? "signatureHelp returned no signatures"
        : `no signature names \`${expectedParam}\`: ${rendered.slice(0, 2).join(" | ")}`,
    sample: rendered.length ? rendered.slice(0, 2).join(" | ") : JSON.stringify(result ?? null),
    artifact: sigs.length,
  };
}

/**
 * formatting: a non-empty TextEdit[] that actually changes the document.
 *
 * The fixture is deliberately unformatted, so "no edits" is a real failure and
 * a set of edits that reproduce the input byte for byte is a real failure too —
 * both would otherwise register as a very fast success.
 */
export function gateFormatting(source, result) {
  const edits = (Array.isArray(result) ? result : []).filter(
    (e) => e && e.range && typeof e.newText === "string",
  );
  if (!edits.length) {
    return {
      valid: false,
      reason:
        result == null
          ? "formatting returned null on a deliberately unformatted document"
          : "formatting returned no usable TextEdits",
      sample: JSON.stringify(result ?? null).slice(0, 200),
      artifact: 0,
    };
  }
  const next = applyTextEdits(source, edits);
  const changed = next !== source;
  let at = 0;
  while (at < next.length && at < source.length && next[at] === source[at]) at++;
  return {
    valid: changed,
    reason: changed ? "" : "formatting edits reproduce the input unchanged",
    sample: changed
      ? `${edits.length} edit(s); first change @${at}: ${JSON.stringify(
          source.slice(at, at + 40),
        )} -> ${JSON.stringify(next.slice(at, at + 40))}`
      : `${edits.length} no-op edit(s)`,
    artifact: edits.length,
  };
}

/* -------------------------------------------------------------------------- */
/* Request fan-out                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Fan a request out to every half of the product and merge, charging the slower
 * leg — the same policy as `ctx.ask`, with one difference that this suite
 * cannot do without: a leg that REJECTS does not sink the answer of a leg that
 * replied.
 *
 * `ctx.ask` uses `Promise.all`, so the first rejection wins. Volar is two
 * processes and its Vue half answers `-32601 Unhandled method` for
 * `textDocument/typeDefinition` and `textDocument/signatureHelp` — it never
 * claimed them; its manifest does not advertise `typeDefinitionProvider` or
 * `signatureHelpProvider`, so a real editor routes both straight to the
 * TypeScript half, which answers correctly. Failing the operation on the Vue
 * half's decline would measure this harness's `Promise.all` and report a
 * working product as broken. That is precisely the false-fail context.mjs warns
 * about, so it is fixed here rather than tolerated.
 *
 * The policy is identical for all four servers: a single-process server has one
 * leg, and if that leg rejects there is nothing to merge and the operation is
 * reported as failed, with the wire error preserved as evidence.
 *
 * @returns {{ value: unknown|undefined, errors: string[] }} `value` is
 *   `undefined` only when EVERY leg rejected.
 */
async function askAll(ctx, method, params, timeoutMs, merge) {
  const legs = [ctx.client.sendRequest(method, params, timeoutMs)];
  if (ctx.hybrid) legs.push(ctx.hybrid.request(method, params, timeoutMs));
  // Promise.allSettled never rejects, but an unobserved rejection on a leg we
  // are about to inspect anyway would still be flagged; attach early.
  for (const p of legs) p.catch(() => {});
  const settled = await Promise.allSettled(legs);
  const values = [];
  const errors = [];
  for (const s of settled) {
    if (s.status === "fulfilled") values.push(s.value);
    else errors.push(String(s.reason?.message ?? s.reason));
  }
  if (!values.length) return { value: undefined, errors };
  return { value: merge(...values), errors };
}

/**
 * askAll + gate, with the wire error kept as the sample when nothing replied.
 *
 * `timeoutMs` defaults to the warm budget; the two project-wide operations
 * (references, rename) pass `ctx.budget.projectMs` explicitly. See the header.
 */
async function probe(ctx, method, params, merge, gate, timeoutMs = budgetOf(ctx).warmMs) {
  const { value, errors } = await askAll(ctx, method, params, timeoutMs, merge);
  if (value === undefined) {
    return {
      valid: false,
      reason: `every provider rejected ${method}: ${errors[0] ?? "no response"}`,
      sample: errors.join(" | "),
    };
  }
  return gate(value);
}

/* -------------------------------------------------------------------------- */
/* Suite                                                                       */
/* -------------------------------------------------------------------------- */

export const SUITE = {
  id: "navigation",
  label: "Navigation & refactor (cross-file)",
  // Imported-fn definition is the second request of a shared session unless
  // isolated — the runner re-spawns so its cold is the first request after open.
  isolatedColdOps: [{ id: "def-imported-symbol", after: "def-component-tag" }],

  buildWorkspace(dir) {
    scaffold(dir);
    writeFileSync(join(dir, "Parent.vue"), PARENT_SOURCE);
    writeFileSync(join(dir, "ChildCard.vue"), CHILD_SOURCE);
    writeFileSync(join(dir, "helpers.ts"), HELPERS_SOURCE);
    writeFileSync(join(dir, "types.ts"), TYPES_SOURCE);
    writeFileSync(join(dir, "Messy.vue"), MESSY_SOURCE);

    const typoStart = positionOf(PARENT_SOURCE, TYPO, 1);

    return {
      dir,
      fileCount: 5,
      // Documented contract fields — the "current" document of this suite.
      file: join(dir, "Parent.vue"),
      fileRel: "Parent.vue",
      source: PARENT_SOURCE,

      parentFile: join(dir, "Parent.vue"),
      parentSource: PARENT_SOURCE,
      parentTypingSource: PARENT_TYPING_SOURCE,
      childFile: join(dir, "ChildCard.vue"),
      childSource: CHILD_SOURCE,
      helpersFile: join(dir, "helpers.ts"),
      helpersSource: HELPERS_SOURCE,
      typesFile: join(dir, "types.ts"),
      typesSource: TYPES_SOURCE,
      messyFile: join(dir, "Messy.vue"),
      messySource: MESSY_SOURCE,

      propName: PROP_NAME,
      newName: NEW_NAME,
      paramName: PARAM_NAME,

      // Inside the `ChildCard` identifier of `<ChildCard …/>`, not on the `<`.
      componentTagProbe: positionAfter(PARENT_SOURCE, "<Chi", 1),
      // The CALL site, not the import specifier: `formatCaption(` occurs once.
      importedSymbolProbe: positionOf(PARENT_SOURCE, "formatCaption(", 1),
      // `captionOptions` (lowercase c) never occurs inside `CaptionOptions`.
      typeBindingProbe: positionOf(PARENT_SOURCE, "captionOptions", 1),
      // The prop declaration inside defineProps<{…}>().
      propDeclProbe: positionOf(CHILD_SOURCE, `${PROP_NAME}: string`, 1),
      // The typo identifier, for the quick-fix request.
      typoRange: {
        start: typoStart,
        end: { line: typoStart.line, character: typoStart.character + TYPO.length },
      },
      // Between the parens the editor just auto-closed.
      signatureProbe: positionAfter(PARENT_TYPING_SOURCE, "formatCaption(", 1),
    };
  },

  async measure(ctx) {
    const { openDoc, changeDoc, ws, pathToFileUri } = ctx;

    const parentUri = pathToFileUri(ws.parentFile);
    const childUri = pathToFileUri(ws.childFile);
    const helpersUri = pathToFileUri(ws.helpersFile);
    const typesUri = pathToFileUri(ws.typesFile);
    const messyUri = pathToFileUri(ws.messyFile);

    // Open everything. A server that only indexes open documents and one that
    // scans the whole project then start from the same state, which is the only
    // way the cross-file gates are fair to both.
    openDoc(parentUri, ws.parentSource);
    openDoc(childUri, ws.childSource);
    openDoc(messyUri, ws.messySource);
    openDoc(helpersUri, ws.helpersSource, { languageId: "typescript" });
    openDoc(typesUri, ws.typesSource, { languageId: "typescript" });
    await new Promise((r) => setTimeout(r, 50));

    // No discarded hover: each timedColdWarm records first request as cold,
    // second as warm. The imported-fn probe is isolated into its own session
    // by the runner so it is not measured against a server the tag definition
    // already warmed.

    const ops = [];

    /* 1 — the Vue-specific one: a component TAG must resolve into its SFC. */
    if (shouldMeasure(ctx, "def-component-tag")) {
      ops.push(
        await timedColdWarm("def-component-tag", "Definition: <ChildCard/> tag", () =>
          probe(
            ctx,
            "textDocument/definition",
            { textDocument: { uri: parentUri }, position: ws.componentTagProbe },
            mergeLocations,
            (res) =>
              gateDefinition(res, {
                targetPath: ws.childFile,
                currentPath: ws.parentFile,
                what: "tag definition",
              }),
          ),
        ),
      );
    }

    /* 2 — imported symbol used in <script setup>, must leave the .vue file. */
    if (shouldMeasure(ctx, "def-imported-symbol")) {
      ops.push(
        await timedColdWarm("def-imported-symbol", "Definition: imported fn (script)", () =>
          probe(
            ctx,
            "textDocument/definition",
            { textDocument: { uri: parentUri }, position: ws.importedSymbolProbe },
            mergeLocations,
            (res) =>
              gateDefinition(res, {
                targetPath: ws.helpersFile,
                currentPath: ws.parentFile,
                what: "definition",
              }),
          ),
        ),
      );
    }

    // Isolated-cold session: this op was the first request after didOpen. The
    // rest of the suite belongs to the full session.
    if (ctx.only) return ops;

    /* 3 — type of a binding, declared in a third module. */
    ops.push(
      await timed("type-definition", "Type definition: typed binding", () =>
        probe(
          ctx,
          "textDocument/typeDefinition",
          { textDocument: { uri: parentUri }, position: ws.typeBindingProbe },
          mergeLocations,
          (res) =>
            gateDefinition(res, {
              targetPath: ws.typesFile,
              currentPath: ws.parentFile,
              what: "typeDefinition",
            }),
        ),
      ),
    );

    /* 4 — references from the prop declaration must reach the parent template. */
    ops.push(
      await timed("references-prop", "References: prop -> parent template", () =>
        probe(
          ctx,
          "textDocument/references",
          {
            textDocument: { uri: childUri },
            position: ws.propDeclProbe,
            context: { includeDeclaration: true },
          },
          mergeLocations,
          (res) => gateReferences(res, { declPath: ws.childFile, usePath: ws.parentFile }),
          // Project-wide: walks every file on every call. See the header.
          budgetOf(ctx).projectMs,
        ),
      ),
    );

    /* 5a — prepareRename at the same position. */
    ops.push(
      await timed("prepare-rename", "Prepare rename: prop", () =>
        probe(
          ctx,
          "textDocument/prepareRename",
          { textDocument: { uri: childUri }, position: ws.propDeclProbe },
          pickPrepareRename,
          (res) => gatePrepareRename(res, { source: ws.childSource, expected: ws.propName }),
        ),
      ),
    );

    /* 5b — the rename itself. Edits are INSPECTED, never applied to disk. */
    ops.push(
      await timed("rename-prop", "Rename prop (cross-file edit)", () =>
        probe(
          ctx,
          "textDocument/rename",
          {
            textDocument: { uri: childUri },
            position: ws.propDeclProbe,
            newName: ws.newName,
          },
          mergeWorkspaceEdits,
          (res) =>
            gateRename(res, {
              templatePath: ws.parentFile,
              declPath: ws.childFile,
              newName: ws.newName,
            }),
          // Project-wide: a cross-file rename edits every use site. Same class
          // as references — see the header.
          budgetOf(ctx).projectMs,
        ),
      ),
    );

    /* 6 — quick fix at a diagnostic. The diagnostic is the fixed, real one
       every server is handed (see QUICK_FIX_DIAGNOSTIC): it is request INPUT,
       so it must be identical or the operation is not the same operation. */
    const contextDiagnostics = [{ ...QUICK_FIX_DIAGNOSTIC, range: ws.typoRange }];

    ops.push(
      await timed("code-action", "Code action at diagnostic", () =>
        probe(
          ctx,
          "textDocument/codeAction",
          {
            textDocument: { uri: parentUri },
            range: ws.typoRange,
            context: { diagnostics: contextDiagnostics, triggerKind: 1 },
          },
          mergeCodeActions,
          (res) => gateCodeActions(res),
        ),
      ),
    );

    /* 7 — signature help right after the `(` an editor just auto-closed. */
    changeDoc(parentUri, ws.parentTypingSource, 2);
    ops.push(
      await timed("signature-help", "Signature help after `(`", () =>
        probe(
          ctx,
          "textDocument/signatureHelp",
          {
            textDocument: { uri: parentUri },
            position: ws.signatureProbe,
            context: { triggerKind: 2, triggerCharacter: "(", isRetrigger: false },
          },
          mergeSignatureHelp,
          (res) => gateSignatureHelp(res, ws.paramName),
        ),
      ),
    );

    /* 8 — formatting a deliberately unformatted document. Result inspected in
       memory; nothing is written back. */
    ops.push(
      await timed("formatting", "Format unformatted SFC", () =>
        probe(
          ctx,
          "textDocument/formatting",
          {
            textDocument: { uri: messyUri },
            options: { tabSize: 2, insertSpaces: true, trimTrailingWhitespace: true },
          },
          pickFormatting,
          (res) => gateFormatting(ws.messySource, res),
        ),
      ),
    );

    return ops;
  },
};
