/**
 * Completion suite — the operation an editor fires on every keystroke.
 *
 * The pre-existing LSP surface fires ONE completion at an arbitrary
 * mid-identifier offset inside a script block and validates nothing. That
 * measures the cost of a round-trip and nothing else: a server can return an
 * empty list in 0ms and score better than a server that returns the right
 * answer in 40ms. This suite replaces that with eight separately-timed
 * contexts, each gated on the expected item actually being in the list.
 *
 * WHY EIGHT CONTEXTS. Script member completion is the one a server can pass by
 * proxying to a TypeScript server — it is table stakes, not the job. Contexts
 * 2-6 (component tag, prop name, event name, directive, slot name) are the
 * Vue-specific ones and are the whole point of the suite: they require the
 * server to have modelled the SFC, resolved `./ChildCard.vue`, and understood
 * `defineProps` / `defineEmits` / `<slot name>`. Auto-import is measured
 * separately because it is the slowest, and `completionItem/resolve` because it
 * is the second round-trip an editor always makes and is completely invisible
 * in the current numbers.
 *
 * ── Three measured decisions, each of which would otherwise have produced a
 *    wrong number ──────────────────────────────────────────────────────────
 *
 * 1. triggerKind is Invoked (1) for every context, never TriggerCharacter (2).
 *    The trigger character is in the BUFFER — the file literally contains
 *    `<ChildCard :`, `<ChildCard @`, `<template #`, `probe.`, `v-` — so every
 *    probe sits at a real trigger point. Announcing the character in the
 *    request is a different thing: it asks the server "did you register this
 *    character?". Measured: at the identical `<template #|masthead>` position,
 *    `{triggerKind:2, triggerCharacter:"#"}` makes Volar return 0 items while
 *    `{triggerKind:1}` returns 500 including the slot names. `#` is simply not
 *    in Volar's registered trigger set. Gating on the triggerKind:2 answer
 *    would have reported "Volar cannot complete slot names", which is false.
 *    Invoked is what Ctrl+Space sends and every server must answer it.
 *
 * 2. `completionItem/resolve` goes through a local fan-out, not `ask`.
 *    A list request is owned by every provider — both halves contribute items
 *    and `ask` merges them. A resolve is owned by exactly ONE provider, and the
 *    others reject. Measured on Volar by asking each half alone: the Vue half
 *    answers every template context (tag, prop, event, directive, slot) and
 *    returns ZERO items at both script positions; the TypeScript half is the
 *    mirror image — it answers the script positions and contributes almost
 *    nothing to the template ones. Neither half is the whole list, which is why
 *    `ask` merges them. Handing the Vue half an item it did not produce throws
 *    `Cannot read properties of undefined (reading '1')`.
 *
 *    `ask` tolerates a rejecting leg, so it would survive that — but it returns
 *    a single merged VALUE, and the thing worth reporting when a resolve fails
 *    is WHICH half failed and why. That is how this suite found that Volar on
 *    the TNB/tsgo tsdk returns the `computed` item and then cannot resolve it:
 *    `Debug Failure. False expression. at
 *    getCompletionEntryCodeActionsAndSourceDisplay`. Collapsed to one value,
 *    that row would have read "resolve failed" with the Vue half's misleading
 *    "not my item" error and the actual tsgo crash discarded.
 *
 *    So `resolveItem()` below sends to every half, awaits all of them (the pair
 *    is charged the slower leg, exactly as `ask` charges it), keeps the richest
 *    answer and keeps every error text for the row. Single-process servers have
 *    one half; the code path is identical and there is no per-server branch.
 *
 * 3. Each resolve is preceded by an UNTIMED re-request of the completion that
 *    produced the item. Volar caches only the most recent completion list and
 *    resolves against it; with any other completion in between, resolve throws.
 *    An editor always resolves against the list it is currently showing, so
 *    refreshing first measures the real operation instead of a stale-cache
 *    error. The refresh is outside the timed block.
 *
 * ── Fixture naming is load-bearing ────────────────────────────────────────
 * Every expected name was chosen so that a list from the WRONG context cannot
 * contain it. The obvious names are all traps: `caption` and `footer` are HTML
 * elements, `title` is a global attribute, and `confirm` is a JS global — a
 * server that mis-maps a template position into the generated render function
 * returns TypeScript's global scope there, and a gate expecting `confirm`
 * would have credited it. Hence `blurb`, `epilogue`, `quench`, `quaver`,
 * `tessellate`: names that appear in a list only if the server put them there
 * on purpose.
 *
 * Known limitation, recorded rather than hidden: `ChildCard` is also a
 * `<script setup>` binding — a locally-imported component has to be — so the
 * component-tag gate cannot distinguish "offered the component" from "offered
 * every identifier in scope". Tightening it (requiring the matched item to name
 * the .vue file, or the list to contain an HTML element) would false-fail a
 * correct server that returns bare component names, which is the one thing a
 * gate must never do. So it stays a label gate, and the matched item's kind and
 * detail go into `sample` so a reader can see which it was. The caveat is
 * locked by a test, so it cannot silently go stale.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { budgetOf } from "../budget.mjs";
import { mergeCompletions, timed } from "../context.mjs";
import { positionAfter, scaffold } from "../workspace.mjs";

/**
 * Request budgets come from `ctx.budget` (budget.mjs), scaled by workspace size.
 * This suite writes 3 files, so it sits at the small-project floor.
 *
 * The warm-up used to get its OWN budget, at DOUBLE the measured one (60s
 * against 30s), on the reasoning that Volar's TypeScript half runs with
 * `useSyntaxServer: "never"` and so blocks its first completion on the full
 * project load. That reasoning was right about the cause and wrong about the
 * fix: project load is COLD work, and it is already covered by `budget.coldMs`
 * before the first warm-up is sent. What the extra budget actually bought was
 * 4 minutes of a wedged server — vize 0.302 stopped answering
 * `textDocument/completion` entirely, and the four sequential warm-ups spent
 * 60s each before the readiness loop had even started. Warm-ups now share the
 * measured budget; nothing may wait longer than the thing it is warming up for.
 */

/** Labels printed as evidence on a failing row. */
const SAMPLE_LABELS = 12;

/**
 * Readiness budget, identical for every server: ~2.2s of polling before the
 * first measured request. See the readiness loop in measure() for why.
 */
const READY_ATTEMPTS = 15;
const READY_INTERVAL_MS = 150;

const CHILD_SOURCE = `<template>
  <section class="child-card">
    <slot name="masthead" />
    <p>{{ blurb }} {{ tally }}</p>
    <button @click="emit('quench', tally)">ok</button>
    <button @click="emit('dismiss')">no</button>
    <slot name="epilogue" />
  </section>
</template>

<script setup lang="ts">
defineProps<{ blurb?: string; tally: number }>()
const emit = defineEmits<{
  (e: 'quench', value: number): void
  (e: 'dismiss'): void
}>()
</script>
`;

/**
 * A second component, used ONLY as a warm-up target.
 *
 * Its props share no name with ChildCard's, so completing on it stands up the
 * component-attribute machinery without computing the list the prop, event and
 * slot gates are about to ask for. Measured, first ChildCard prop completion:
 * Volar 72ms → 12ms, Volar/TNB 25ms → 7ms, Verter 11ms → 2ms. Roughly 85% of
 * what looked like "the cost of prop completion" was one-time setup that the
 * first component-aware context happened to be standing in front of; the
 * residual is ChildCard's own resolution and stays in the measurement.
 */
const SIBLING_SOURCE = `<template>
  <aside class="sibling-card">
    <slot name="aside" />
    <p>{{ ballast }}</p>
  </aside>
</template>

<script setup lang="ts">
defineProps<{ ballast?: string }>()
</script>
`;

/**
 * Every probe point is a syntactically valid construct, so one parse error
 * cannot poison the other seven contexts. Each trigger character is already in
 * the buffer with the probe sitting immediately after it, and each expected
 * item is deliberately NOT the one already written at the probe point — a
 * server that filters out attributes already present on the element must still
 * pass.
 */
const HOST_SOURCE = `<template>
  <p>{{ headline }}</p>
  <span class="warm-up"></span>
  <SiblingCard :ballast="headline"></SiblingCard>
  <ChildCard :tally="7"></ChildCard>
  <ChildCard @dismiss="onDismiss" :tally="2"></ChildCard>
  <ChildCard :tally="3">
    <template #masthead>{{ headline }}</template>
  </ChildCard>
  <div v-show="visible">{{ probe.pinnacle }}</div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ChildCard from './ChildCard.vue'
import SiblingCard from './SiblingCard.vue'

const headline = ref('completion-probe')
const visible = ref(true)

/** Stable member-completion target — do not rename. */
const probe = {
  pinnacle: 1,
  quaver: 'two',
  tessellate() {
    return 3
  },
}

const chosen = probe.pinnacle

function onDismiss() {
  visible.value = false
}

const derived = comput
</script>
`;

/** The symbol the auto-import context completes. Exported from `vue`, not imported here. */
const AUTO_IMPORT_SYMBOL = "computed";

/* ────────────────────────────── gate helpers ────────────────────────────── */

/**
 * Reduce a label to the name it is presenting, so that two servers spelling the
 * same correct answer differently both pass.
 *
 * Observed spellings for ONE prop named `blurb`: Volar `:blurb`, Verter
 * `blurb?` (with `insertText: "blurb"`). For ONE emit named `quench`: Volar
 * `@quench`. For one slot named `epilogue`: Volar `epilogue?`. For one member:
 * Volar `quaver` with `textEdit.newText: ".quaver"`.
 *
 * What is normalised away: binding punctuation (`: @ # .`), a `v-bind:` /
 * `v-on:` / `v-slot:` prefix, the optional-prop `?`, an attribute or snippet
 * tail (`v-if="$1"`), and the kebab/camel distinction — `quench-request` and
 * `quenchRequest` are the same name in a Vue template.
 *
 * What is NOT normalised away: the `v-` of a directive. Stripping it would let
 * a bare `if` match, and `if` is a TypeScript keyword completion — a server
 * that mis-maps a template attribute position into the generated render
 * function offers exactly that, and would be credited for answering a context
 * it never modelled.
 */
export function normalizeName(raw) {
  let s = String(raw ?? "").trim();
  if (!s) return "";
  s = s.split("=")[0];
  s = s.replace(/^v-(?:bind|on|slot):/i, "");
  s = s.replace(/^[.:@#]+/, "");
  s = s.replace(/\?+$/, "");
  s = s.replace(/\$\{[^}]*\}|\$\d+/g, "");
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/**
 * Every name one item could be presenting: servers put the clean name in
 * `label` (Volar), in `insertText` beside a decorated label (Verter's
 * `blurb?` / `blurb`), or only in the `textEdit`.
 */
export function itemNames(item) {
  const out = new Set();
  for (const raw of [
    item?.label,
    item?.insertText,
    item?.textEdit?.newText,
    item?.filterText,
  ]) {
    const n = normalizeName(raw);
    if (n) out.add(n);
  }
  return out;
}

/** Every item presenting any of `alternates`, in list order. */
export function findAllExpected(items, alternates) {
  const wanted = new Set(alternates.map(normalizeName).filter(Boolean));
  if (!wanted.size) return [];
  return (items ?? []).filter((item) => {
    for (const name of itemNames(item)) if (wanted.has(name)) return true;
    return false;
  });
}

/** First item presenting any of `alternates`, or null. */
export function findExpected(items, alternates) {
  return findAllExpected(items, alternates)[0] ?? null;
}

/** Items array out of any of the shapes LSP allows for a completion result. */
export function itemsOf(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.items)) return result.items;
  return [];
}

/** One-line evidence for the row: what the server actually returned. */
export function describeItem(item) {
  if (!item) return "";
  const bits = [JSON.stringify(item.label ?? null)];
  if (item.kind != null) bits.push(`kind=${item.kind}`);
  const detail = item.detail ?? item.labelDetails?.description ?? item.labelDetails?.detail;
  if (detail) bits.push(`detail=${JSON.stringify(String(detail).slice(0, 70))}`);
  if (item.insertText) bits.push(`insertText=${JSON.stringify(item.insertText)}`);
  return bits.join(" ");
}

/** Evidence for a MISSING item: what was in the list instead. */
export function describeList(items) {
  const labels = (items ?? []).slice(0, SAMPLE_LABELS).map((i) => String(i?.label ?? ""));
  const more = (items?.length ?? 0) - labels.length;
  return labels.length
    ? `[${labels.join(", ")}${more > 0 ? `, …+${more}` : ""}]`
    : "(empty list)";
}

/**
 * The additionalTextEdits that constitute an import edit for `symbol`.
 *
 * Both real shapes must count, and one of them contains no `import` keyword at
 * all: Volar's TypeScript half widens the EXISTING `import { ref } from 'vue'`
 * by inserting `"computed, "` at line 11 character 9. A gate matching /import/
 * would have failed a server that performed the auto-import correctly. So the
 * test is "an edit outside the completion range that mentions the symbol",
 * which covers both widening an existing import and inserting a new statement.
 */
export function importEdits(item, symbol) {
  const edits = Array.isArray(item?.additionalTextEdits) ? item.additionalTextEdits : [];
  const re = new RegExp(`(^|[^\\w$])${symbol}([^\\w$]|$)`);
  return edits.filter((e) => typeof e?.newText === "string" && re.test(e.newText));
}

/**
 * The same check across a set of items. A server may ship several entries for
 * one symbol (Volar returns two `computed`, from `vue` and `@vue/reactivity`)
 * and only some of them may carry the edit; failing on the first one alone
 * would be a gate artifact. Reading the other items' inline edits costs no
 * extra round-trip, so it happens before any failure is declared.
 */
export function importEditsAmong(items, symbol) {
  for (const item of items ?? []) {
    const edits = importEdits(item, symbol);
    if (edits.length) return edits;
  }
  return [];
}

/**
 * Items whose label merely CONTAINS the symbol — evidence for a failing row.
 * Vize's auto-import list has no `computed` entry carrying an import edit, but
 * it does have a separate `import computed` entry whose insertText is
 * `import { computed } from 'vue'` placed at the cursor, which would produce
 * `const derived = import { computed } from 'vue'`. That is not an auto-import
 * and is not accepted, so the row shows it rather than just saying "no".
 */
export function nearMisses(items, symbol, limit = 3) {
  const needle = symbol.toLowerCase();
  return (items ?? [])
    .filter((i) => String(i?.label ?? "").toLowerCase().includes(needle))
    .slice(0, limit);
}

/** detail + documentation of a resolved item, flattened. */
export function resolvedText(item) {
  const doc =
    typeof item?.documentation === "string" ? item.documentation : item?.documentation?.value;
  return [item?.detail, doc].filter(Boolean).join("\n");
}

/**
 * Gate for a plain list context: the expected item must be present.
 *
 * Deliberately NOT satisfied by a non-empty list — it is an exact match on a
 * normalised, deliberately-unguessable name. Verter's 1193-item tag list passes
 * because `ChildCard` is genuinely in it; Vize's 42-item tag list fails because
 * it is directives and DOM events.
 */
export function gateList({ items, expect, what }) {
  const hit = findExpected(items, expect);
  return {
    hit,
    valid: Boolean(hit),
    reason: hit ? "" : `no ${what} in ${items.length} items`,
    sample: hit ? describeItem(hit) : describeList(items),
    artifact: items.length,
  };
}

/* ─────────────────────────────── the suite ──────────────────────────────── */

/**
 * The six list contexts, measured identically. Ordered cheapest-first only for
 * readability of the table; each is an independent request.
 */
export const LIST_CONTEXTS = [
  {
    id: "completion-script-member",
    label: "Completion: script member",
    probe: "member",
    expect: ["quaver"],
    what: "`quaver` member of the local object",
  },
  {
    id: "completion-component-tag",
    label: "Completion: component tag <Ch",
    probe: "tag",
    expect: ["ChildCard", "child-card"],
    what: "`ChildCard` component tag",
  },
  {
    id: "completion-prop-name",
    label: "Completion: prop name <C :",
    probe: "prop",
    expect: ["blurb"],
    what: "`blurb` declared prop",
  },
  {
    // `onQuench` is deliberately NOT an accepted alternate. Verter's real
    // ATTRIBUTE list for this component contains `onQuench?`, the props-object
    // form of the emit — so accepting it would let a server pass the event gate
    // by returning the prop list at the `@` position, which is the one thing
    // this context exists to distinguish. Nothing is lost: a server that labels
    // the item `onQuench` but inserts `quench` still passes, because
    // itemNames() reads insertText and textEdit as well as label.
    id: "completion-event-name",
    label: "Completion: event name <C @",
    probe: "event",
    expect: ["quench"],
    what: "`quench` declared emit",
  },
  {
    id: "completion-directive",
    label: "Completion: directive v-",
    probe: "directive",
    expect: ["v-if"],
    what: "`v-if` directive",
  },
  {
    id: "completion-slot-name",
    label: "Completion: slot name <template #",
    probe: "slot",
    expect: ["epilogue"],
    what: "`epilogue` declared slot",
  },
];

export const SUITE = {
  id: "completion",
  label: "Completion (8 contexts, content-gated)",

  buildWorkspace(dir) {
    scaffold(dir);
    writeFileSync(join(dir, "ChildCard.vue"), CHILD_SOURCE);
    writeFileSync(join(dir, "SiblingCard.vue"), SIBLING_SOURCE);
    writeFileSync(join(dir, "Host.vue"), HOST_SOURCE);
    return {
      dir,
      fileCount: 3,
      file: join(dir, "Host.vue"),
      fileRel: "Host.vue",
      source: HOST_SOURCE,
      childSource: CHILD_SOURCE,
      // Every position is derived from the source. A hard-coded line number
      // would silently slide onto whitespace the moment the fixture gains a
      // line, and the suite would then time a completion on nothing.
      probes: {
        // `const chosen = probe.|pinnacle` — after the `.` trigger.
        member: positionAfter(HOST_SOURCE, "const chosen = probe."),
        // `<Ch|ildCard :tally="7">` — the tag-name prefix the task specifies.
        tag: positionAfter(HOST_SOURCE, "<Ch"),
        // `<ChildCard :|tally="7">` — after the `:` trigger. Expects `blurb`,
        // which is NOT on the element, so a server that hides already-used
        // attributes still passes.
        prop: positionAfter(HOST_SOURCE, "<ChildCard :"),
        // `<ChildCard @|dismiss=…>` — after the `@` trigger. Expects `quench`.
        event: positionAfter(HOST_SOURCE, "<ChildCard @"),
        // `<div v-|show=…>` — expects `v-if`.
        directive: positionAfter(HOST_SOURCE, "v-"),
        // `<template #|masthead>` — after the `#` trigger. Expects `epilogue`.
        slot: positionAfter(HOST_SOURCE, "<template #"),
        // `const derived = comput|` — `computed` is exported by `vue` and not
        // imported in this file.
        autoImport: positionAfter(HOST_SOURCE, "const derived = comput"),
        // Untimed warm-ups, one per pipeline, none of them a measured context
        // and none of them computing an answer a gate is about to ask for:
        // script members, template interpolation, plain-HTML attribute names,
        // and component attribute names on the throwaway SiblingCard. Without
        // them, whichever context ran first absorbed one-time setup and the
        // table reported it as that context's cost (measured on Volar: prop
        // 72ms first call, 3-5ms every call after).
        warmScript: positionAfter(HOST_SOURCE, "visible."),
        warmTemplate: positionAfter(HOST_SOURCE, "{{ head"),
        warmAttribute: positionAfter(HOST_SOURCE, "<span "),
        warmComponentAttribute: positionAfter(HOST_SOURCE, "<SiblingCard :"),
      },
    };
  },

  async measure(ctx) {
    const { ask, openDoc, ws, pathToFileUri, client, hybrid, verbose } = ctx;
    const uri = pathToFileUri(ws.file);
    // Completion and resolve are both warm, single-document requests. Warm-ups
    // and readiness probes use the SAME budget — see the header.
    const budget = budgetOf(ctx);
    const REQUEST_TIMEOUT_MS = budget.warmMs;
    const WARMUP_TIMEOUT_MS = budget.warmMs;

    // Only the file under edit is opened, as in an editor. Verified to make no
    // difference: opening ChildCard.vue as well produces byte-identical results
    // on all four servers, so the child is left on disk for every server to
    // find the way a real project would.
    openDoc(uri, ws.source);
    await new Promise((r) => setTimeout(r, 100));

    const complete = (position, timeoutMs = REQUEST_TIMEOUT_MS) =>
      ask(
        "textDocument/completion",
        { textDocument: { uri }, position, context: { triggerKind: 1 } },
        timeoutMs,
        mergeCompletions,
      );

    /**
     * Resolve one item against every half of the server, tolerating the halves
     * that did not produce it. See decision 2 in the file header.
     */
    const halves = [
      (item) => client.sendRequest("completionItem/resolve", item, REQUEST_TIMEOUT_MS),
      ...(hybrid ? [(item) => hybrid.request("completionItem/resolve", item, REQUEST_TIMEOUT_MS)] : []),
    ];
    const resolveItem = async (item) => {
      const settled = await Promise.all(
        halves.map((send) =>
          send(item).then(
            // `null` is a legal LSP response meaning "nothing to add". Recorded
            // as a non-answer rather than dropped silently, so a row can never
            // say "failed on every half:" with nothing after the colon.
            (r) => (r ? { ok: true, value: r } : { ok: false, error: "returned null" }),
            (e) => ({ ok: false, error: e.message }),
          ),
        ),
      );
      const answers = settled.filter((s) => s.ok).map((s) => s.value);
      const errors = settled.filter((s) => !s.ok).map((s) => s.error);
      // Richest wins: an import edit beats prose, prose beats an echo. This is
      // the closest single-request analogue of an editor sending the resolve to
      // the provider that owns the item.
      const score = (i) =>
        (importEdits(i, AUTO_IMPORT_SYMBOL).length ? 1e6 : 0) +
        (Array.isArray(i?.additionalTextEdits) ? i.additionalTextEdits.length * 1e3 : 0) +
        resolvedText(i).length;
      const best = answers.reduce((a, b) => (score(b) > score(a) ? b : a), answers[0] ?? null);
      return { item: best, errors };
    };

    /**
     * One untimed probe, separating "answered, but not with what we wanted"
     * from "did not answer at all".
     *
     * That distinction is the whole point. A server that answers something
     * useless is worth asking again — it is loading, and the next attempt may
     * catch it ready. A server that consumed its entire budget in silence is
     * not: nothing about waiting another 150ms makes it more likely to reply,
     * and every further attempt costs a full budget. Collapsing the two into
     * `.catch(() => null)` is what let one wedged server (vize 0.302, which
     * stopped answering `textDocument/completion` outright) spend 9 minutes
     * here and take a 10-minute CI job down with it.
     */
    const probe = async (position) => {
      try {
        return { items: itemsOf(await complete(position, WARMUP_TIMEOUT_MS)), timedOut: false };
      } catch (e) {
        return { items: [], timedOut: /timed out after/.test(e?.message ?? "") };
      }
    };

    // Warm-ups, untimed and identical for every server, so that no measured
    // context pays for project load, first-template compile or one-time
    // attribute-machinery setup. See the `probes` comment for the measurements
    // that made each of these necessary.
    //
    // A server that cannot warm up will fail its gates below with a real
    // reason; swallowing the error here keeps the failure attributed to the
    // context that actually failed. But a warm-up that TIMED OUT ends the loop:
    // the remaining three would each pay the same budget to learn the same
    // thing, and the gates below will report it anyway.
    for (const position of [
      ws.probes.warmScript,
      ws.probes.warmTemplate,
      ws.probes.warmAttribute,
      ws.probes.warmComponentAttribute,
    ]) {
      if ((await probe(position)).timedOut) break;
    }

    // Readiness, on a budget identical for every server.
    //
    // Seen once in a four-server run: Volar/TNB returned its template lists
    // WITHOUT the component-specific entries, so prop, event and slot all
    // failed in one run of three while the other two passed with the same item
    // counts. Under contention the Vue half will answer before it has finished
    // resolving the child component, and a gate that fires at that moment
    // reports "this server cannot complete props" — the single most damaging
    // thing this harness can get wrong.
    //
    // So poll until both pipelines demonstrably answer: the script half knows
    // `visible.value`, the component half knows SiblingCard's `ballast`.
    // Neither probe is a measured context and neither computes a measured
    // answer, so this cannot flatter anyone — a server that never satisfies it
    // proceeds after the budget and reports its real result. It can only stop
    // a ready server from being measured before it is ready.
    let readiness = { script: false, component: false, attempts: 0, timedOut: false };
    for (let attempt = 1; attempt <= READY_ATTEMPTS; attempt++) {
      const [script, component] = await Promise.all([
        probe(ws.probes.warmScript),
        probe(ws.probes.warmComponentAttribute),
      ]);
      readiness = {
        script: Boolean(findExpected(script.items, ["value"])),
        component: Boolean(findExpected(component.items, ["ballast"])),
        attempts: attempt,
        timedOut: script.timedOut || component.timedOut,
      };
      if (readiness.script && readiness.component) break;
      // Silence is not a slow answer — stop polling. See probe(). Recorded on
      // `readiness` rather than swallowed, so `--verbose` shows the loop ended
      // because the server stopped talking, not because it ran out of attempts.
      if (readiness.timedOut) break;
      await new Promise((r) => setTimeout(r, READY_INTERVAL_MS));
    }

    const ops = [];
    /** id -> every label returned, printed under --verbose. */
    const census = {};

    for (const cx of LIST_CONTEXTS) {
      ops.push(
        await timed(cx.id, cx.label, async () => {
          const items = itemsOf(await complete(ws.probes[cx.probe]));
          census[cx.id] = items.map((i) => i.label);
          return gateList({ items, expect: cx.expect, what: cx.what });
        }),
      );
    }

    // ── 7. Auto-import ─────────────────────────────────────────────────────
    // Timed alone, so the number is the completion round-trip and not the
    // resolve behind it. Its gate needs the import edit, which no server ships
    // in the list, so `valid` is completed from the resolve op below.
    let autoMatches = [];
    let autoItems = [];
    const autoOp = await timed("completion-auto-import", "Completion: auto-import", async () => {
      autoItems = itemsOf(await complete(ws.probes.autoImport));
      census["completion-auto-import"] = autoItems.map((i) => i.label);
      autoMatches = findAllExpected(autoItems, [AUTO_IMPORT_SYMBOL]);
      const hit = autoMatches[0];
      const misses = nearMisses(autoItems, AUTO_IMPORT_SYMBOL);
      return {
        valid: Boolean(hit),
        reason: hit ? "" : `no \`${AUTO_IMPORT_SYMBOL}\` in ${autoItems.length} items`,
        sample: hit
          ? describeItem(hit)
          : misses.length
            ? `near: ${misses.map(describeItem).join(" ; ")}`
            : describeList(autoItems),
        artifact: autoItems.length,
      };
    });
    ops.push(autoOp);

    // ── 8. The resolve that turns that item into an import ─────────────────
    // Untimed refresh first: Volar resolves against the most recent completion
    // list only (decision 3 in the header).
    if (autoMatches.length) {
      try {
        const refreshed = findAllExpected(itemsOf(await complete(ws.probes.autoImport)), [
          AUTO_IMPORT_SYMBOL,
        ]);
        if (refreshed.length) autoMatches = refreshed;
      } catch {
        // Keep the items from the timed request; the resolve below reports the
        // real failure if the server cannot answer.
      }
    }
    ops.push(
      await timed("resolve-auto-import", "Resolve: auto-import edit", async () => {
        const autoItem = autoMatches[0];
        if (!autoItem) {
          return {
            valid: false,
            reason: `auto-import completion offered no \`${AUTO_IMPORT_SYMBOL}\` item to resolve`,
            sample: describeList(autoItems),
          };
        }
        // Any inline edit on ANY entry for the symbol counts before the round
        // trip is blamed — see importEditsAmong().
        const before = importEditsAmong(autoMatches, AUTO_IMPORT_SYMBOL);
        const { item, errors } = await resolveItem(autoItem);
        const after = importEdits(item ?? autoItem, AUTO_IMPORT_SYMBOL);
        const edits = after.length ? after : before;
        const ok = edits.length > 0;
        // Completed here, per the header: the auto-import gate is "the item,
        // with an import edit", and the edit only exists after the resolve.
        autoOp.valid = autoOp.valid && ok;
        if (!ok && !autoOp.reason) {
          const misses = nearMisses(autoItems, AUTO_IMPORT_SYMBOL);
          autoOp.reason = `\`${AUTO_IMPORT_SYMBOL}\` offered but no import edit on any entry, in the list or after resolve — see resolve-auto-import`;
          autoOp.sample = `offered: ${misses.map(describeItem).join(" ; ")}`.slice(0, 200);
        }
        return {
          valid: ok,
          reason: ok
            ? ""
            : item
              ? `resolve returned no import edit for \`${AUTO_IMPORT_SYMBOL}\`${
                  errors.length ? ` (half failed: ${errors[0]})` : ""
                }`
              : `resolve failed on every half: ${errors.join(" | ")}`,
          sample: ok
            ? `edit ${edits.map((e) => JSON.stringify(e.newText)).join(" ")} | ${describeItem(item ?? autoItem)}`
            : `${describeItem(item ?? autoItem)}${errors.length ? ` err=${errors[0]}` : ""}`,
          artifact: Buffer.byteLength(resolvedText(item ?? autoItem), "utf8"),
        };
      }),
    );

    // ── 9. The everyday resolve: docs/detail for a script member ───────────
    let memberItem = null;
    let memberItems = [];
    try {
      memberItems = itemsOf(await complete(ws.probes.member));
      memberItem = findExpected(memberItems, ["quaver"]);
    } catch {
      memberItem = null;
    }
    ops.push(
      await timed("resolve-member", "Resolve: script member detail", async () => {
        if (!memberItem) {
          return {
            valid: false,
            reason: `script member completion offered no \`quaver\` item to resolve (${memberItems.length} items)`,
            sample: describeList(memberItems),
          };
        }
        const before = resolvedText(memberItem);
        const { item, errors } = await resolveItem(memberItem);
        const after = resolvedText(item);
        const sameItem = item != null && itemNames(item).has("quaver");
        const ok = sameItem && after.length > 0;
        return {
          valid: ok,
          reason: ok
            ? ""
            : !item
              ? `resolve failed on every half: ${errors.join(" | ")}`
              : !sameItem
                ? `resolve returned a different item: ${describeItem(item)}`
                : "resolve returned no detail and no documentation",
          sample: ok
            ? `${describeItem(item)} (+${after.length - before.length} chars over the list item)`
            : `${describeItem(item ?? memberItem)}${errors.length ? ` err=${errors[0]}` : ""}`,
          artifact: Buffer.byteLength(after, "utf8"),
        };
      }),
    );

    if (verbose) {
      console.log(`\n    --- ${ctx.server.id}: readiness ${JSON.stringify(readiness)} ---`);
      console.log(`    --- ${ctx.server.id}: labels returned per context ---`);
      for (const [id, labels] of Object.entries(census)) {
        console.log(`    ${id} (${labels.length}): ${JSON.stringify(labels.slice(0, 60))}`);
      }
    }

    return ops;
  },
};
