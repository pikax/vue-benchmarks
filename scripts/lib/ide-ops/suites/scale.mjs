/**
 * SCALE — how the editor experience degrades with project size.
 *
 * Every other suite in this harness runs against a ~20 file workspace. That
 * flatters a server that does eager whole-project work and penalises none of
 * them, so the single thing a user most wants to know — "is it still usable at
 * 500 files?" — is invisible. This suite measures it directly.
 *
 * WHAT IS MEASURED, at 20 / 100 / 500 generated components:
 *
 *   usable@N       initialize → didOpen → FIRST CORRECT hover. Time-to-usable.
 *   completion@N   completion in the probe's template. Gate: a real binding.
 *   references@N   references on a symbol every generated file uses.
 *   hover-warm@N   5 repeat hovers once warm, median.
 *   scale-*        the 20→500 ratio, as `artifact`. Flat ≈ incremental work;
 *                  linear ≈ the server is re-analysing the project.
 *
 * WHY THREE WORKSPACES RATHER THAN THREE GROUPS IN ONE.
 * Time-to-usable is a property of a project of a given size. Three groups in
 * one tsconfig would give all three "sizes" the same project load, and the
 * headline number would be identical at 20 and 500 by construction. So each
 * size is its own scaffolded workspace under the harness's workspace dir, and
 * `measure()` starts one session per size via the exported `createSession()`.
 * The harness's own root session is left idle against a deliberately tiny,
 * corpus-excluded root workspace — one idle server, identically, for every
 * server under test.
 *
 * WHY THE GATES ARE WHAT THEY ARE.
 * At scale a content gate is not paperwork, it is the whole measurement: a
 * server that stops resolving the project gets FASTER. `sharedLabel()` lives in
 * `shared.ts` and is what makes the probe ref a `string` at all, so the hover
 * gate cannot be passed without having resolved a cross-file import — an
 * unloaded project yields `Ref<any>`, which matches nothing here. The
 * references gate demands a hit in a generated component, not merely ">1 file",
 * because "declaration + the file I am in" is what a server returns when it
 * never searched the corpus.
 *
 * And the gates are written not to false-fail a CORRECT server: exact labels
 * for completion, semantic `symbol : type` shapes for hover, and never a
 * trailing `\b` after a type name — a server here once rendered
 * `let x: stringStable hover target…`, a correct answer with the doc comment
 * concatenated on, and `/\bstring\b/` failed it.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import {
  contentText,
  createSession,
  mergeCompletions,
  mergeHover,
  timed,
} from "../context.mjs";
import { positionAfter, positionOf, scaffold } from "../workspace.mjs";

/* -------------------------------------------------------------------------- */
/* Budgets — IDENTICAL for every server and every size. No per-server branch.  */
/* -------------------------------------------------------------------------- */

/**
 * Whole budget for "initialize → first correct hover", i.e. project load. A
 * server that cannot get there inside it reports valid:false with the timeout
 * as evidence; the corpus is never shrunk to make a struggling server pass.
 */
export const PROJECT_LOAD_TIMEOUT_MS = 120_000;
/** One hover attempt while polling for the first correct answer. */
const HOVER_ATTEMPT_TIMEOUT_MS = 15_000;
/** Gap between hover attempts, so polling does not flood a loading server. */
const POLL_MS = 150;
/** Completion and references, once the project is loaded (or has given up). */
const REQUEST_TIMEOUT_MS = 60_000;
/** Warm hover: enough repeats for a median, few enough to keep runtime sane. */
const WARM_REPEATS = 5;

/** Corpus sizes, smallest first. The ratio row uses first → last. */
export const SIZES = [20, 100, 500];

/* -------------------------------------------------------------------------- */
/* Corpus generator — deterministic, pure functions of the index.             */
/* -------------------------------------------------------------------------- */

export const PROBE_FILE = "ScaleProbe.vue";
export const SHARED_FILE = "shared.ts";

/** Directory name for one size, under the harness workspace. */
export function corpusDirName(size) {
  return `size-${size}`;
}

/** File name of the Nth generated component. Zero-padded so ordering is stable. */
export function componentName(index) {
  return `Comp${String(index).padStart(4, "0")}`;
}

/**
 * The one symbol every generated component imports and calls.
 *
 * It is a plain `.ts` module on purpose: resolving it requires nothing
 * Vue-specific, so a server that fails the hover gate failed at ordinary
 * TypeScript module resolution, not at some SFC subtlety.
 */
export function sharedSource() {
  return `/**
 * Cross-file symbols the gates depend on.
 *
 * \`sharedLabel\` is the references target: every generated component calls it.
 * \`sharedCount\` is the hover target's type source, and it returns NUMBER on
 * purpose — see the hover gate for why a string would have been useless.
 */
export function sharedLabel(index: number): string {
  return \`item-\${index}\`
}

export function sharedCount(index: number): number {
  return index * 2
}
`;
}

/** One generated component: props, refs, a computed, and a template using them. */
export function componentSource(index) {
  const name = componentName(index);
  return `<template>
  <section :class="'${name.toLowerCase()}'">
    <h2>{{ title }}</h2>
    <p>{{ caption }}</p>
    <p>{{ doubled }}</p>
    <p>{{ sharedLabel(index) }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { sharedLabel } from './shared'

const props = defineProps<{ title: string; index: number }>()

const caption = ref(sharedLabel(props.index))
const seed = ref(${index})
const doubled = computed(() => seed.value * 2)
</script>
`;
}

/**
 * The probe file. Identical at every size — the ONLY difference between the
 * three measurements must be how many other files surround it.
 */
export const PROBE_SOURCE = `<template>
  <section class="scale-probe">
    <p>{{ scaleProbeTally }}</p>
    <p>{{ scaleProbeLabel }}</p>
    <p>{{ scaleProbeUpper }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { sharedCount, sharedLabel } from './shared'

/** Stable probe — do not rename. Its type requires ./shared to resolve. */
const scaleProbeTally = ref(sharedCount(0))
const scaleProbeLabel = ref(sharedLabel(0))
const scaleProbeUpper = computed(() => scaleProbeLabel.value.toUpperCase())
</script>
`;

/** Minimal file for the harness's own root session, which measures nothing. */
const ROOT_SOURCE = `<template>
  <p>{{ rootMarker }}</p>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const rootMarker = ref('scale-root')
</script>
`;

/**
 * Write `count` generated components plus the probe and the shared module.
 * Does NOT scaffold — kept separate so it is testable against a bare temp dir.
 *
 * @returns {{dir:string, generated:number, vueFiles:number, probeFile:string}}
 */
export function writeCorpus(dir, count) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, SHARED_FILE), sharedSource());
  writeFileSync(join(dir, PROBE_FILE), PROBE_SOURCE);
  for (let i = 1; i <= count; i++) {
    writeFileSync(join(dir, `${componentName(i)}.vue`), componentSource(i));
  }
  return {
    dir,
    generated: count,
    // The probe is a .vue file the server must load too.
    vueFiles: count + 1,
    probeFile: join(dir, PROBE_FILE),
  };
}

/* -------------------------------------------------------------------------- */
/* Probe positions — derived from the source, never hard-coded.               */
/* -------------------------------------------------------------------------- */

export const PROBE_POSITIONS = {
  //  #1 is the template interpolation, #2 the `const` declaration.
  hover: positionOf(PROBE_SOURCE, "scaleProbeTally", 2),
  // Immediately after `{{ ` — an empty expression prefix, so no server can
  // filter the scope list down and no correct server returns nothing.
  completion: positionAfter(PROBE_SOURCE, "{{ ", 1),
  //  #1 is the import specifier, #2 the call site in <script setup>.
  references: positionOf(PROBE_SOURCE, "sharedLabel", 2),
};

/* -------------------------------------------------------------------------- */
/* Gates                                                                      */
/* -------------------------------------------------------------------------- */

const PROBE_SYMBOL = "scaleProbeTally";

/**
 * `scaleProbeTally: Ref<number…>` (script type) or `scaleProbeTally: number`
 * (servers that render the unwrapped type in `<script>` too). Both prove the
 * one thing this gate exists to prove: `./shared` resolved, because
 * `sharedCount()` is the only reason the ref is a number at all.
 *
 * WHY THE PROBE RETURNS NUMBER, NOT STRING. The first version of this probe was
 * `ref(sharedLabel(0))`, expecting `Ref<string>`. Deleting `shared.ts` and
 * re-running showed one server still confidently answering `Ref<string>` for a
 * module that did not exist — it pattern-matches `ref(…)` and names a type it
 * never computed, which is the exact failure this repo's harness was built to
 * catch. A `string` gate rewards that guess. `number` does not: a server that
 * guesses from syntax gets it wrong, and a server that resolved the import gets
 * it right. The gate now discriminates instead of flattering.
 *
 * NOTE the missing `\b` after the type name: a correct server here renders
 * `const scaleProbeTally: Ref<number, number>Stable probe — do not rename.`,
 * running its doc comment straight onto the signature with no separator. There
 * is no word boundary inside `numberStable`, and a gate that required one
 * failed a server that had done the work.
 */
const HOVER_OK = new RegExp(`\\b${PROBE_SYMBOL}\\s*:\\s*(?:Ref\\s*<\\s*number|number)`);
/** Diagnostic only — never decides pass/fail, so it cannot false-fail anyone. */
const HOVER_LOOKS_UNRESOLVED = new RegExp(
  `\\b${PROBE_SYMBOL}\\s*:\\s*(?:Ref\\s*<\\s*)?(?:any|string|unknown)`,
);

/** Does this hover carry the project-resolved type for the probe? */
export function classifyScaleHover(text) {
  const bytes = Buffer.byteLength(text ?? "", "utf8");
  if (!text) return { ok: false, bytes, reason: "empty hover payload" };
  if (!text.includes(PROBE_SYMBOL)) {
    return { ok: false, bytes, reason: `hover does not mention ${PROBE_SYMBOL}` };
  }
  if (HOVER_OK.test(text)) return { ok: true, bytes, reason: "" };
  if (HOVER_LOOKS_UNRESOLVED.test(text)) {
    return {
      ok: false,
      bytes,
      reason: `${PROBE_SYMBOL} is not a number — sharedCount() from ./shared did not resolve, so this type was guessed, not computed`,
    };
  }
  return {
    ok: false,
    bytes,
    reason: `hover names ${PROBE_SYMBOL} but carries no number type (expected Ref<number> or number)`,
  };
}

/** Bindings that a template-scope completion in the probe must be able to offer. */
export const TEMPLATE_BINDINGS = [
  "scaleProbeTally",
  "scaleProbeLabel",
  "scaleProbeUpper",
  "sharedLabel",
];

/** Normalise the several shapes LSP allows for a completion response. */
export function completionItems(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.items)) return result.items;
  return [];
}

/**
 * Did completion still know the component's own scope?
 *
 * EXACT label match against the probe's script-setup bindings. Substring
 * matching would credit a server for an unrelated item that happens to contain
 * the text; requiring one specific label would false-fail a server that filters
 * by prefix. "At least one of my own bindings, spelled exactly" is the
 * semantics, and no correct server can miss all four.
 */
export function classifyScaleCompletion(items) {
  const count = items.length;
  if (!count) {
    return { ok: false, count, matched: [], reason: "completion returned no items" };
  }
  const labels = new Set(
    items
      .map((i) => (typeof i === "string" ? i : typeof i?.label === "string" ? i.label : ""))
      .map((l) => l.trim())
      .filter(Boolean),
  );
  const matched = TEMPLATE_BINDINGS.filter((b) => labels.has(b));
  if (!matched.length) {
    return {
      ok: false,
      count,
      matched,
      reason: `${count} items but none of the probe's own bindings (${TEMPLATE_BINDINGS.join(", ")}) — the template scope was not resolved`,
    };
  }
  return { ok: true, count, matched, reason: "" };
}

/** Compare URIs from different servers: percent-encoding and drive case vary. */
export function normalizeUri(uri) {
  if (typeof uri !== "string") return "";
  let u = uri;
  try {
    u = decodeURIComponent(u);
  } catch {
    // Malformed escape — compare the raw form rather than throwing.
  }
  return u.replace(/\\/g, "/").toLowerCase();
}

/** Normalise Location[] / LocationLink[] / {locations} into plain locations. */
export function toLocations(result) {
  if (!result) return [];
  const arr = Array.isArray(result)
    ? result
    : Array.isArray(result?.locations)
      ? result.locations
      : [result];
  const out = [];
  for (const item of arr) {
    if (!item || typeof item !== "object") continue;
    if (typeof item.uri === "string") out.push({ uri: item.uri, range: item.range });
    else if (typeof item.targetUri === "string") {
      out.push({ uri: item.targetUri, range: item.targetSelectionRange ?? item.targetRange });
    }
  }
  return out;
}

/** Union two reference payloads the way an editor merges two providers. */
export function mergeLocations(...results) {
  const out = [];
  const seen = new Set();
  for (const r of results) {
    for (const loc of toLocations(r)) {
      const s = loc.range?.start;
      const key = `${normalizeUri(loc.uri)}#${s?.line ?? "?"}:${s?.character ?? "?"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(loc);
    }
  }
  return out;
}

/** A generated component file, by name — the proof the corpus was searched. */
const GENERATED_FILE = /\/comp\d+\.vue$/;

/**
 * Did `references` actually cross the corpus?
 *
 * ">1 file" alone is too weak: declaration + current file is exactly what a
 * server returns when it never looked at the other 499 files, and it would pass
 * a two-file check. So the gate additionally requires a hit inside a generated
 * component. A correct server cannot fail this — every generated component
 * genuinely calls `sharedLabel`.
 */
export function classifyScaleReferences(result, { probeUri }) {
  const locations = toLocations(result);
  const total = locations.length;
  const probe = normalizeUri(probeUri);
  const uris = new Set(locations.map((l) => normalizeUri(l.uri)).filter(Boolean));
  const files = uris.size;
  const generated = [...uris].filter((u) => GENERATED_FILE.test(u) && u !== probe);
  const base = { ok: false, total, files, generatedFiles: generated.length };
  if (!total) {
    return {
      ...base,
      reason:
        result == null
          ? "server answered textDocument/references with null — no reference provider replied"
          : "references returned an empty list — the symbol is used in every generated component",
    };
  }
  if (files < 2) {
    return {
      ...base,
      reason: `all ${total} references are in a single file — no cross-file search happened`,
    };
  }
  if (!generated.length) {
    return {
      ...base,
      reason: `${total} references across ${files} files but none in any generated component — the corpus was not searched`,
    };
  }
  return { ...base, ok: true, reason: "" };
}

/* -------------------------------------------------------------------------- */
/* Op helpers                                                                  */
/* -------------------------------------------------------------------------- */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function median(nums) {
  const s = nums.filter(Number.isFinite).sort((a, b) => a - b);
  if (!s.length) return null;
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/** Build an Op record with the same field discipline `timed()` applies. */
function op({ id, label, ms, valid, reason = "", sample = "", artifact, artifactLabel }) {
  return {
    id,
    label,
    ms,
    valid,
    reason: String(reason).slice(0, 240),
    sample: String(sample ?? "").slice(0, 200),
    artifact,
    // Optional: what the artifact number MEANS, when it is not a census. The
    // ratio rows below put a scale factor there and a column headed "Artifact"
    // invites reading it as a payload size.
    ...(artifactLabel ? { artifactLabel } : {}),
  };
}

/**
 * Repeat a gated request and report the MEDIAN — the point of a warm-hover row
 * is the steady state, and a single sample at 500 files is mostly noise. The
 * row is valid only if EVERY repeat passed its gate: one wrong answer in five
 * is a server that is guessing.
 */
async function medianOp({ id, label, repeats, run }) {
  const times = [];
  let firstBad = null;
  let failures = 0;
  let last = null;
  for (let i = 0; i < repeats; i++) {
    const t0 = performance.now();
    let r;
    try {
      r = await run();
    } catch (e) {
      r = { valid: false, reason: `request failed: ${e.message}`, sample: "" };
    }
    times.push(performance.now() - t0);
    last = r;
    if (r?.valid === false) {
      failures++;
      firstBad ??= r;
    }
  }
  return op({
    id,
    label,
    ms: median(times),
    valid: !firstBad,
    // How MANY repeats failed is evidence in itself: 5 of 5 is a server that
    // cannot answer, 1 of 5 is a server that sometimes answers before it knows.
    reason: firstBad ? `${failures}/${repeats} repeats failed the gate — ${firstBad.reason}` : "",
    sample: firstBad ? firstBad.sample : (last?.sample ?? ""),
    artifact: last?.artifact,
  });
}

/* -------------------------------------------------------------------------- */
/* Measurement                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Every operation at one corpus size, on a session of its own.
 *
 * The session is created HERE rather than reusing the harness's, because
 * time-to-usable has to include `initialize` and the project load that follows
 * it — that is the number that separates a server which is snappy at 20 files
 * from one that is unusable at 500.
 */
async function measureSize(ctx, corpus) {
  const { size } = corpus;
  const ids = {
    usable: `usable@${size}`,
    completion: `completion@${size}`,
    references: `references@${size}`,
    warm: `hover-warm@${size}`,
  };
  const at = `@${size} files`;

  const t0 = performance.now();
  let session = null;
  try {
    session = await createSession({
      server: ctx.server,
      workspaceDir: corpus.dir,
      initTimeoutMs: PROJECT_LOAD_TIMEOUT_MS,
    });
  } catch (e) {
    // A server that cannot come up on this corpus inside the shared budget is a
    // RESULT, not a reason to shrink the corpus. Every row at this size is
    // invalid, and carries the failure as its evidence.
    const ms = performance.now() - t0;
    const reason = `session did not start on ${corpus.vueFiles} .vue files within ${PROJECT_LOAD_TIMEOUT_MS} ms: ${e.message}`;
    return [
      op({
        id: ids.usable,
        label: `Time-to-usable ${at}`,
        ms,
        valid: false,
        reason,
        sample: e.message,
        artifact: corpus.vueFiles,
      }),
      op({ id: ids.completion, label: `Completion ${at}`, ms: null, valid: false, reason }),
      op({ id: ids.references, label: `References ${at}`, ms: null, valid: false, reason }),
      op({ id: ids.warm, label: `Hover warm ${at}`, ms: null, valid: false, reason }),
    ];
  }

  const ops = [];
  const uri = ctx.pathToFileUri(corpus.probeFile);

  try {
    /* 1. Time-to-usable: didOpen, then poll hover until it is CORRECT. */
    session.openDoc(uri, PROBE_SOURCE);
    const deadline = t0 + PROJECT_LOAD_TIMEOUT_MS;
    let attempts = 0;
    let cls = null;
    let lastText = "";
    let lastError = "";
    for (;;) {
      const remaining = deadline - performance.now();
      if (remaining <= 0) break;
      attempts++;
      try {
        const text = contentText(
          await session.ask(
            "textDocument/hover",
            { textDocument: { uri }, position: PROBE_POSITIONS.hover },
            Math.min(remaining, HOVER_ATTEMPT_TIMEOUT_MS),
            mergeHover,
          ),
        );
        if (text) lastText = text;
        cls = classifyScaleHover(text);
        if (cls.ok) break;
      } catch (e) {
        lastError = e.message;
      }
      if (deadline - performance.now() <= 0) break;
      await sleep(POLL_MS);
    }
    const usableMs = performance.now() - t0;
    ops.push(
      op({
        id: ids.usable,
        label: `Time-to-usable ${at}`,
        ms: usableMs,
        valid: !!cls?.ok,
        reason: cls?.ok
          ? ""
          : `no correct hover within ${PROJECT_LOAD_TIMEOUT_MS} ms (${attempts} attempts): ${cls?.reason || lastError || "no answer at all"}`,
        sample: lastText || lastError,
        artifact: corpus.vueFiles,
      }),
    );

    /* 2. Completion in the probe's template. */
    ops.push(
      await timed(ids.completion, `Completion ${at}`, async () => {
        const items = completionItems(
          await session.ask(
            "textDocument/completion",
            {
              textDocument: { uri },
              position: PROBE_POSITIONS.completion,
              context: { triggerKind: 1 },
            },
            REQUEST_TIMEOUT_MS,
            mergeCompletions,
          ),
        );
        const r = classifyScaleCompletion(items);
        return {
          valid: r.ok,
          reason: r.reason,
          sample: r.matched.length
            ? `${r.count} items; matched ${r.matched.join(", ")}`
            : items
                .slice(0, 12)
                .map((i) => (typeof i === "string" ? i : i?.label))
                .join(", "),
          artifact: r.count,
        };
      }),
    );

    /* 3. References on the symbol every generated component uses. */
    ops.push(
      await timed(ids.references, `References ${at}`, async () => {
        const result = await session.ask(
          "textDocument/references",
          {
            textDocument: { uri },
            position: PROBE_POSITIONS.references,
            context: { includeDeclaration: true },
          },
          REQUEST_TIMEOUT_MS,
          mergeLocations,
        );
        const r = classifyScaleReferences(result, { probeUri: uri });
        return {
          valid: r.ok,
          reason: r.reason,
          sample: `${r.total} refs / ${r.files} files / ${r.generatedFiles} generated components`,
          artifact: r.files,
        };
      }),
    );

    /* 4. Warm hover — same position, now that everything above has run. */
    ops.push(
      await medianOp({
        id: ids.warm,
        label: `Hover warm ${at}`,
        repeats: WARM_REPEATS,
        run: async () => {
          const text = contentText(
            await session.ask(
              "textDocument/hover",
              { textDocument: { uri }, position: PROBE_POSITIONS.hover },
              HOVER_ATTEMPT_TIMEOUT_MS,
              mergeHover,
            ),
          );
          const r = classifyScaleHover(text);
          return { valid: r.ok, reason: r.reason, sample: text, artifact: r.bytes };
        },
      }),
    );
  } finally {
    await session.close();
  }

  return ops;
}

/**
 * The headline: how much worse does each operation get from 20 to 500 files?
 *
 * `ms` is null because a ratio is not a duration — the runner prints "n/a" for
 * the time and the ratio lands in the artifact column. The row is invalid when
 * there is no gate-passing pair to divide, which is the honest reading: you
 * cannot quote a scale factor for a server that stopped answering correctly.
 *
 * `artifactLabel` is set so the report can head that column with what the
 * number is. Nothing here may ever put a DURATION in `ms` to make these rows
 * look like the other rows: the four headline rows of this suite carry a
 * factor, and a report that cannot render a factor must be fixed in the report.
 */
export function scalingOps(ops, sizes = SIZES) {
  const lo = sizes[0];
  const hi = sizes[sizes.length - 1];
  const families = [
    ["usable", "time-to-usable"],
    ["completion", "completion"],
    ["references", "references"],
    ["hover-warm", "hover warm"],
  ];
  return families.map(([family, human]) => {
    const a = ops.find((o) => o.id === `${family}@${lo}`);
    const b = ops.find((o) => o.id === `${family}@${hi}`);
    const usable =
      a?.valid === true &&
      b?.valid === true &&
      Number.isFinite(a.ms) &&
      Number.isFinite(b.ms) &&
      a.ms > 0;
    const failed = [a?.valid === true ? null : lo, b?.valid === true ? null : hi].filter(Boolean);
    return op({
      id: `scale-${family}`,
      label: `Scale × ${human} ${lo}→${hi}`,
      ms: null,
      valid: usable,
      reason: usable
        ? ""
        : failed.length
          ? `no scale factor: the gate failed at ${failed.join(" and ")} files (see ${family}@${failed[0]})`
          : `no scale factor: missing timing for ${family}`,
      sample: usable ? `${a.ms.toFixed(1)} ms → ${b.ms.toFixed(1)} ms` : "",
      artifact: usable ? Number((b.ms / a.ms).toFixed(2)) : undefined,
      artifactLabel: `Scale factor ${lo}→${hi} (×, lower is better)`,
    });
  });
}

/* -------------------------------------------------------------------------- */

export const SUITE = {
  id: "scale",
  label: "Scale (20 / 100 / 500 files)",

  buildWorkspace(dir) {
    scaffold(dir);

    // The harness opens a session on THIS directory and keeps it alive for the
    // whole of measure(). Without an exclude its `include: ["**/*.vue", …]`
    // would swallow all three corpora, so the idle root session would load 620
    // files and compete with the size it is supposed to be standing aside for.
    // Read back what scaffold() wrote so the shared config stays authoritative.
    const tsconfigPath = join(dir, "tsconfig.json");
    const tsconfig = JSON.parse(readFileSync(tsconfigPath, "utf8"));
    tsconfig.exclude = SIZES.map(corpusDirName);
    writeFileSync(tsconfigPath, `${JSON.stringify(tsconfig, null, 2)}\n`);
    writeFileSync(join(dir, "Root.vue"), ROOT_SOURCE);

    const corpora = SIZES.map((size) => {
      const sub = join(dir, corpusDirName(size));
      // Same scaffold as every other suite: identical tsconfig, identical
      // strictTemplates, identical Vize switches. The ONLY variable is count.
      scaffold(sub);
      return { size, ...writeCorpus(sub, size) };
    });

    return { dir, sizes: SIZES, corpora };
  },

  async measure(ctx) {
    const ops = [];
    for (const corpus of ctx.ws.corpora) {
      ops.push(...(await measureSize(ctx, corpus)));
    }
    ops.push(...scalingOps(ops, ctx.ws.sizes));
    return ops;
  },
};
