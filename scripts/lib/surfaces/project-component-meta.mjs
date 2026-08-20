/**
 * Project-component-meta surface — extract component metadata from a REAL
 * project's SFCs, in place, against the project's own tsconfig.
 *
 * ## Why in place, like project-typecheck
 *
 * `component-meta` on a *lifted* corpus is deliberately not offered, for the same
 * reason `typecheck` is not (see `project-typecheck.mjs`): a corpus pulled out of a
 * monorepo resolves none of its imports, and a metadata extractor whose imports do
 * not resolve does not fail — it returns a component with no props, very fast. In a
 * table that is indistinguishable from a fast, thorough extractor. Running against
 * the project's own `tsconfig.json`, its own `paths` and its own installed
 * `node_modules` is the only version of this measurement worth publishing.
 *
 * ## Rows
 *
 * - **vue-component-meta** — the official `createChecker` + `getComponentMeta`.
 *   This is the **BASELINE**: the reference the other rows are read against, and
 *   gated identically to them.
 * - **@verter/component-meta** — Verter's published session API
 *   (`openComponentMetaSession` + `getComponentMeta`).
 * - **Vize** — no row. There is no public component-meta API on `vize` or
 *   `@vizejs/native`; the surface CHECKS for one at runtime and says so rather than
 *   substituting a different job (declaration emit is not metadata extraction).
 *
 * ## The census is the whole point of the surface existing
 *
 * Returning `{}` is the trivial way to win here, and it is fast. So two counts are
 * recorded per row and both gate ranking:
 *
 * - **components resolved** — how many SFCs the tool returned metadata for at all.
 *   Fewer than the baseline is unranked.
 * - **components with at least one prop** — how many of those actually carried a
 *   declared prop. A tool that resolves every component and reports zero props for
 *   components the baseline found props on did less work, not less waiting.
 *
 * The raw member TOTAL (props + events + slots) is published too, but it is
 * INFORMATIONAL and never gates, because the tools genuinely disagree about what
 * belongs to a component's public API: vue-component-meta reports inherited and
 * implicit surface, Verter reports the declared API. Gating on that total would
 * brand a tool for a schema definition rather than for doing less work — the same
 * reasoning the generated-corpus `component-meta` surface applies to the same
 * number. What is NOT a schema disagreement is "the baseline found props on this
 * component and you found none", which is why that is the gated quantity.
 *
 * ## Baseline pre-flight
 *
 * If `vue-component-meta` cannot build a program for a candidate target — or
 * builds one and resolves nothing — NO ROWS are published for it and the reason is
 * printed. Anchoring a census on a baseline that resolved nothing inverts the gate:
 * it marks the tools that DID extract metadata as the anomalies. Same discipline
 * as `project-typecheck`'s pre-flight, which exists because Hoppscotch ships a
 * committed `src/types/post-request.d.ts` with a syntax error that stops program
 * construction dead.
 */

import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, join, relative, resolve as resolvePath } from "node:path";
import { fileURLToPath } from "node:url";
import { measureVariants, timedAsync, timedSync } from "../timing.mjs";
import { discoverTypecheckTargets } from "../real-world/test-targets.mjs";
import {
  applyComponentMetaValidityGates,
  runComponentMetaValidityChildren,
} from "../component-meta-validity-gates.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function loadOptional(name) {
  try {
    return { mod: require(require.resolve(name, { paths: [rootDir] })) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Count the members one tool reported for one component.
 *
 * `exposed` is deliberately EXCLUDED from the gated counts and included only in
 * the informational total: the tools disagree most about it (vue-component-meta
 * reports the implicit instance surface, Verter reports `defineExpose` only), so a
 * count that includes it says more about the schema than about the work.
 */
export function metaCensusFor(meta) {
  const props = meta?.props?.length ?? 0;
  const events = meta?.events?.length ?? 0;
  const slots = meta?.slots?.length ?? 0;
  const exposed = meta?.exposed?.length ?? 0;
  return { props, events, slots, exposed, members: props + events + slots };
}

/**
 * Accumulate one tool's pass over the corpus into the surface's census.
 *
 * `resolved` counts components the tool returned an object for; `failed` counts
 * the ones it threw on. Both are needed: a tool that throws on half the corpus and
 * is quick about the rest is doing less work, and a bare "resolved" count with no
 * denominator cannot show it.
 */
export function makeMetaCollector(total, declaredProps = []) {
  const state = {
    total,
    resolved: 0,
    failed: 0,
    withProps: 0,
    members: 0,
    props: 0,
    events: 0,
    slots: 0,
    /** Component paths this tool reported at least one prop for. */
    propBearing: new Set(),
  };
  return {
    state,
    /** @param {string} key stable per-component key (corpus-relative path) */
    add(key, meta) {
      if (meta == null) {
        state.failed++;
        return;
      }
      const c = metaCensusFor(meta);
      state.resolved++;
      state.members += c.members;
      state.props += c.props;
      state.events += c.events;
      state.slots += c.slots;
      if (c.props > 0) {
        state.withProps++;
        state.propBearing.add(key);
      }
    },
    fail() {
      state.failed++;
    },
    /** Flat, JSON-safe snapshot for a row's `meta`. */
    snapshot() {
      return {
        artifact: state.resolved,
        components: state.resolved,
        componentsFailed: state.failed,
        componentsTotal: state.total,
        withProps: state.withProps,
        members: state.members,
        props: state.props,
        events: state.events,
        slots: state.slots,
        propBearing: [...state.propBearing],
        // The gate's anchor: components whose SOURCE declares props. Carried on
        // every row so the gate stays a pure function of the rows it is given.
        declaredProps,
      };
    },
  };
}

/**
 * Every post-measurement gate on this surface, in order, mutating rows in place.
 *
 * Exported and pure so it can be tested against synthetic rows. The failure mode
 * these prevent is silent: a tool that returned `{}` for every component, ranked
 * first, with the artifact column showing a number nobody cross-checked.
 *
 * @param {Array<object>} results rows from `measureVariants`
 */
export function applyComponentMetaGates(results) {
  const baseline = results.find((r) => r.id === "vue-component-meta");
  const baseSample = baseline?.metaSamples?.[0] ?? null;

  for (const row of results) {
    if (row.status === "skipped" || row.status === "error") continue;
    const sample = row.metaSamples?.[0] ?? null;

    // 1. Self-consistency, applied to EVERY row including the baseline's. A pass
    // that resolved nothing is the cheapest possible pass and can never be a
    // speed result, whatever the baseline did.
    if (!sample || sample.components === 0) {
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ FAILED METADATA CENSUS — resolved metadata for ${
        sample?.components ?? 0
      } of ${sample?.componentsTotal ?? "?"} components. Returning nothing is the fastest thing a metadata extractor can do, so this is measured but UNRANKED.`;
      continue;
    }

    if (row.id === "vue-component-meta") continue;

    // 2. Against the baseline. A bracketed baseline cannot anchor anything — its
    // own counts came from a pass that did not do the work, and comparing to it
    // would unrank the tools that did.
    if (!baseline || baseline.status !== "ok" || !baseSample) {
      row.notes = `${row.notes} | ⓘ METADATA CENSUS GATE NOT RUN — ${
        baseline ? `the baseline row is itself ${baseline.status}` : "there is no baseline row"
      }, so this row's coverage was never compared against the reference extractor. Ranked, but unverified rather than verified-equal.`;
      continue;
    }

    if (sample.components < baseSample.components) {
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ FAILED METADATA CENSUS — returned metadata for ${sample.components} components where the baseline returned ${baseSample.components} (of ${sample.componentsTotal}), failing on ${sample.componentsFailed}. Fewer components is less work, and less work finishes sooner. Measured but UNRANKED.`;
      continue;
    }

    // 3. Props found, per component, over the components whose SOURCE declares
    // props. This is the gate that catches the tool which resolves every component
    // and reports an empty API for it — the exact way a fast, empty answer hides
    // behind a healthy-looking component count.
    //
    // The anchor is the intersection of two things, and using only the first was a
    // real unfairness that measurement caught. `vue-component-meta` reports props
    // for components that declare NONE — the implicit and inherited instance
    // surface — so on Hoppscotch's first 25 SFCs it found props on 25 of 25 while
    // 18 of 25 contain a `defineProps`. Anchoring on "the baseline found props
    // here" therefore bracketed @verter/component-meta for reporting props on
    // exactly those 18: a schema disagreement about what a component's public API
    // IS, published as a verdict that it did less work.
    //
    // Requiring the SOURCE to declare props makes the anchor a fact about the
    // corpus rather than about either tool's schema, and the claim the gate makes
    // becomes one no reasonable reading disputes: this component declares props,
    // the reference tool found them, and you reported none.
    const declared = new Set(sample.declaredProps ?? baseSample.declaredProps ?? []);
    const baselineProps = new Set(baseSample.propBearing ?? []);
    const rowProps = new Set(sample.propBearing ?? []);
    const anchor = [...baselineProps].filter((k) => declared.has(k));
    const missed = anchor.filter((k) => !rowProps.has(k));
    if (anchor.length === 0) {
      row.notes = `${row.notes} | ⓘ PROP-COVERAGE GATE NOT RUN — no component in this corpus both declares props in its source AND had props reported by the baseline, so there is nothing to anchor on. Ranked, but unverified rather than verified-equal.`;
    } else if (missed.length > 0) {
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ FAILED PROP-COVERAGE GATE — reported ZERO props for ${missed.length} of the ${anchor.length} components that DECLARE props in their source and that the baseline also found props on (e.g. ${missed
        .slice(0, 3)
        .join(
          ", ",
        )}). Returning an empty API is the trivial way to be fast on this surface. Measured but UNRANKED.`;
    } else {
      row.notes = `${row.notes} | prop coverage verified: reported at least one prop for all ${anchor.length} components that declare props in their source. Components that declare NO props are excluded from this gate, because the tools legitimately disagree about whether such a component still has implicit and inherited surface.`;
    }

    // 4. Member totals: reported, never gated. The tools disagree about what is
    // part of a component's public API, and that is a schema difference rather
    // than a work difference — see the module docblock.
    if (baseSample.members > 0 && sample.members !== baseSample.members) {
      row.notes = `${row.notes} | ⓘ reported ${sample.members} props+events+slots against the baseline's ${baseSample.members} across the same ${sample.components} components. Member counts are NOT asserted equivalent: the tools differ on whether inherited and implicit surface belongs to a component's public API. The gated quantities are components resolved and per-component prop coverage.`;
    }
  }
  return results;
}

/**
 * The corpus files that live under a target, as absolute paths plus stable keys.
 *
 * Uses the RESOLVED CORPUS file list rather than a fresh walk, so `--file-limit`
 * and its truncation disclosure apply to this surface exactly as they do to every
 * other real-world surface. A private walk here would quietly measure a different
 * file set from the one the corpus line names.
 */
export function componentsUnderTarget(resolved, targetDir) {
  const out = [];
  for (const rel of resolved.files) {
    const abs = resolvePath(resolved.dir, rel);
    const inside = relative(targetDir, abs);
    if (!inside || inside.startsWith("..")) continue;
    out.push({
      key: rel,
      abs: abs.split("\\").join("/"),
      declaresProps: sourceDeclaresProps(safeRead(abs)),
    });
  }
  return out;
}

function safeRead(path) {
  try {
    return readFileSync(path, "utf8");
  } catch {
    return "";
  }
}

/**
 * Does this SFC's SOURCE declare props?
 *
 * Read off the text, not off any tool's answer, because it is the prop-coverage
 * gate's anchor and an anchor derived from a tool's schema is not an anchor. Both
 * spellings a Vue SFC uses: the `defineProps` macro (with or without
 * `withDefaults`) and the options-API `props:` key.
 *
 * Conservative on purpose — a false NEGATIVE only narrows the gate's anchor, while
 * a false POSITIVE would fail a tool for finding no props on a component that has
 * none.
 */
export function sourceDeclaresProps(source) {
  const text = String(source ?? "");
  if (/\bdefineProps\s*[<(]/.test(text)) return true;
  // `props: { … }` / `props: [` inside a component options object. The colon and
  // the opening brace/bracket together are what keep a local variable named
  // `props` from counting.
  return /(^|[\s{,])props\s*:\s*[[{]/m.test(text);
}

/**
 * @param {import("../real-world/corpus.mjs").ResolvedCorpus} resolved
 */
export async function runProjectComponentMetaSurface(resolved, options) {
  const base = {
    id: "project-component-meta",
    label: `Project component-meta (own tsconfig) — ${resolved.selector}`,
    files: resolved.files.length,
    bytes: resolved.bytes,
  };

  if (!resolved.installed) {
    return {
      ...base,
      variants: [],
      methodology: [
        `Skipped: ${resolved.project.id} has no node_modules. A metadata extractor whose imports do not resolve does not fail — it returns components with no props, quickly, which in a table is indistinguishable from a fast thorough extractor. Fix with: pnpm fetch:real-world --projects ${resolved.project.id}`,
      ],
    };
  }

  const vueMeta = loadOptional("vue-component-meta");
  if (vueMeta.error) {
    return {
      ...base,
      variants: [],
      methodology: [
        `No rows: vue-component-meta could not be loaded (${vueMeta.error}), so there is no baseline to rank anything against.`,
      ],
    };
  }

  const candidates = discoverTypecheckTargets(resolved.dir);
  if (candidates.length === 0) {
    return {
      ...base,
      variants: [],
      methodology: [
        `No component-meta target in ${resolved.project.id} at ${resolved.project.ref}: a target needs its own tsconfig.json and SFCs beneath it. Reusing the typecheck discovery is deliberate — both surfaces need a real TypeScript program over the project's own sources.`,
      ],
    };
  }

  // Baseline pre-flight, UNTIMED. The baseline has to demonstrate it can build a
  // program and resolve real metadata before anything is ranked against it.
  let target = null;
  let components = [];
  const rejected = [];
  for (const candidate of candidates) {
    const tsconfig = join(candidate.dir, candidate.tsconfig);
    const files = componentsUnderTarget(resolved, candidate.dir);
    if (files.length === 0) {
      rejected.push({
        candidate,
        detail: `no corpus SFC lies under ${candidate.relDir}, so this target and this corpus do not overlap`,
      });
      continue;
    }
    let detail = null;
    try {
      const checker = vueMeta.mod.createChecker(tsconfig, { forceUseTs: true });
      // A bounded sample, not the whole set: the pre-flight only has to show the
      // baseline can build a program and find a declared API. Running the full
      // corpus untimed would double the surface's cost for no extra evidence.
      const sample = files.slice(0, Math.min(files.length, 25));
      let resolvedCount = 0;
      let propBearing = 0;
      for (const f of sample) {
        try {
          const meta = checker.getComponentMeta(f.abs);
          if (!meta) continue;
          resolvedCount++;
          if ((meta.props?.length ?? 0) > 0) propBearing++;
        } catch {
          // One unresolvable component is not a reason to reject a target; the
          // aggregate below is.
        }
      }
      if (resolvedCount === 0) {
        detail = `baseline vue-component-meta built a program but resolved 0 of ${sample.length} sampled components — that is program construction failing to see the project, not a metadata result`;
      } else if (propBearing === 0) {
        detail = `baseline vue-component-meta resolved ${resolvedCount} of ${sample.length} sampled components but found no declared props on any of them, so there is nothing for the prop-coverage gate to anchor on`;
      }
    } catch (error) {
      detail = `baseline vue-component-meta could not create a checker for ${candidate.tsconfig}: ${
        String(error instanceof Error ? error.message : error).split("\n")[0]
      }`;
    }
    if (!detail) {
      target = candidate;
      components = files;
      break;
    }
    rejected.push({ candidate, detail });
  }

  const rejectedNotes = rejected.map(
    (r) =>
      `Candidate ${r.candidate.packageName} (${r.candidate.relDir}, ${r.candidate.sfcs} SFCs) was REJECTED before measurement: ${r.detail}. No rows are published for a target the baseline cannot extract from — every other row would be gated against a reference that did no work, which marks the tools that DID as the anomalies.`,
  );

  if (!target) {
    return {
      ...base,
      variants: [],
      methodology: [
        `No component-meta target in ${resolved.project.id} could be read by the baseline (vue-component-meta) in this environment, so there is no reference to rank against and no rows are published.`,
        ...rejectedNotes,
      ],
    };
  }

  // Computed once, from the sources, and carried on every row: see
  // `sourceDeclaresProps` and the prop-coverage gate.
  const declaredPropComponents = components.filter((c) => c.declaresProps).map((c) => c.key);
  const tsconfigPath = join(target.dir, target.tsconfig);
  const verterMeta = loadOptional("@verter/component-meta");
  const vizeNative = loadOptional("@vizejs/native");

  const variants = [];

  variants.push({
    id: "vue-component-meta",
    label: "vue-component-meta",
    package: "vue-component-meta",
    target: "project-component-meta",
    invocation: "in-process API",
    comparisonClass: "project-component-public-api",
    comparisonClassLabel: "Project component public-API metadata",
    baseline: true,
    baselineLabel: "Vue official",
    artifactLabel: "components resolved",
    // MORE is more work here, so the renderer's low-artifact warning is wanted:
    // a row well below the largest component count is not comparable on speed.
    notes: `BASELINE · createChecker(${target.tsconfig}) + getComponentMeta for each of ${components.length} corpus SFCs under ${target.relDir}, using the project's own tsconfig and installed dependencies`,
    measure: () => {
      const collector = makeMetaCollector(components.length, declaredPropComponents);
      const { ms } = timedSync(() => {
        // A fresh checker per run, so no run inherits another's program cache and
        // the two rows pay the same construction cost each time.
        const checker = vueMeta.mod.createChecker(tsconfigPath, { forceUseTs: true });
        for (const f of components) {
          try {
            collector.add(f.key, checker.getComponentMeta(f.abs));
          } catch {
            collector.fail();
          }
        }
      });
      return { ms, meta: collector.snapshot() };
    },
  });

  if (!verterMeta.error && typeof verterMeta.mod.openComponentMetaSession === "function") {
    const { openComponentMetaSession, evictComponentMetaSession } = verterMeta.mod;
    const sessionConfig = {
      root: target.dir.split("\\").join("/"),
      tsconfig: tsconfigPath.split("\\").join("/"),
    };
    variants.push({
      id: "verter-component-meta",
      label: "@verter/component-meta",
      package: "@verter/component-meta",
      target: "project-component-meta",
      invocation: "in-process API",
      comparisonClass: "project-component-public-api",
      comparisonClassLabel: "Project component public-API metadata",
      artifactLabel: "components resolved",
      notes: `openComponentMetaSession({root: ${target.relDir}, tsconfig: ${target.tsconfig}}) + getComponentMeta for the same ${components.length} corpus SFCs`,
      measure: async () => {
        const collector = makeMetaCollector(components.length, declaredPropComponents);
        const { ms } = await timedAsync(async () => {
          const session = await openComponentMetaSession(sessionConfig);
          try {
            for (const f of components) {
              try {
                collector.add(f.key, await session.getComponentMeta(f.abs));
              } catch {
                collector.fail();
              }
            }
          } finally {
            // Engines are pooled per root+tsconfig, so the evict is what actually
            // ends the cycle. Without it the second run would measure a warm
            // engine against the baseline's cold one.
            try {
              session.close();
            } catch {
              /* ignore */
            }
            try {
              evictComponentMetaSession(sessionConfig);
            } catch {
              /* ignore */
            }
          }
        });
        return { ms, meta: collector.snapshot() };
      },
    });
  } else {
    variants.push({
      id: "verter-component-meta",
      label: "@verter/component-meta",
      package: "@verter/component-meta",
      target: "project-component-meta",
      notes: `Unavailable: ${verterMeta.error ?? "openComponentMetaSession missing from @verter/component-meta"}. No substitute workload — a row measured through a different entry point than the one it names is not that tool's number.`,
      skip: true,
    });
  }

  // Vize: CHECKED, not assumed. The claim "no public API" is only worth printing
  // if the harness looked.
  const vizeHasApi =
    !vizeNative.error && typeof vizeNative.mod?.extractComponentMeta === "function";
  variants.push({
    id: "vize-component-meta",
    label: "Vize component-meta",
    package: "vize",
    target: "project-component-meta",
    notes: vizeHasApi
      ? "@vizejs/native exposes extractComponentMeta() but this surface has no gated wiring for it yet — no number is published rather than an ungated one."
      : `No component-meta API found on @vizejs/native in this install (${
          vizeNative.error
            ? `the package could not be loaded: ${vizeNative.error}`
            : "loaded successfully, but exports no extractComponentMeta()"
        }). Declaration emit is a different job and is NOT substituted for metadata extraction.`,
    skip: true,
  });

  const results = await measureVariants(variants, {
    runs: options.runs,
    warmups: options.warmups,
    fileCount: components.length,
  });

  applyComponentMetaGates(results);

  // Capability plants are isolated from the real checkout and run only after
  // all project timings. They certify the exact published entrypoints against
  // known generated cases; they do not claim what the correct metadata for a
  // third-party component should be.
  const componentMetaCapability = runComponentMetaValidityChildren();
  applyComponentMetaValidityGates(results, componentMetaCapability);

  const p = resolved.project;
  return {
    ...base,
    files: components.length,
    variants: results,
    validation: { componentMetaCapability },
    methodology: [
      `Target: ${target.packageName} (${target.relDir}) — ${components.length} corpus SFCs, read with the project's OWN ${target.tsconfig} and its own installed dependencies.`,
      `Corpus pin: ${p.ref} @ ${(resolved.sha ?? "").slice(0, 8)}, ${p.releasedAt ? `released ${p.releasedAt}` : `committed ${p.committedAt}`} (${p.releaseKind}), pinned ${p.pinnedAt}.`,
      "The component set is the RESOLVED CORPUS restricted to the target package, not a private walk — so `--file-limit` and its truncation disclosure apply here exactly as they do to every other real-world surface. A private walk would quietly measure a different file set from the one the corpus line names.",
      "Both tools are given the same absolute file list, the same tsconfig and the same directory, and each is driven through its own published entry point. No payload is hand-decoded and no row is measured through an API it does not ship.",
      `POST-TIMING ENTRYPOINT-CAPABILITY GATE: suite ${componentMetaCapability.suiteVersion} runs ${componentMetaCapability.plantCount} known generated cases through the same createChecker/getComponentMeta and openComponentMetaSession/getComponentMeta lifecycles in isolated children. It never reads or writes the third-party checkout and cannot warm its timed programs. A failure or UNKNOWN exact entrypoint is measured but UNRANKED; a failed Vue reference invalidates the class. This gate proves only that the published API handles the planted language features, not that this project's metadata is semantically equivalent.`,
      "The target was pre-flighted: the baseline built a checker and extracted from a bounded sample untimed first, and the target is measured only because that resolved components AND found declared props on some of them. A target the baseline cannot read publishes no rows at all — every other row would be gated against a reference that did no work.",
      ...rejectedNotes,
      "Metadata census gate: a row that resolved metadata for fewer components than the baseline is UNRANKED, and so is a row that resolved none at all — including the baseline's own row, which is gated identically. Returning `{}` is the fastest thing a metadata extractor can do.",
      "Prop-coverage gate: a row reporting ZERO props for any component the baseline found props on is UNRANKED. This is the gate that catches a fast, empty answer hiding behind a healthy-looking component count.",
      "Member totals (props+events+slots) are published but NEVER gated. The tools disagree about what belongs to a component's public API — vue-component-meta reports inherited and implicit surface, Verter reports the declared API — and gating on that would brand a tool for a schema definition rather than for doing less work. The per-component prop coverage above is the part that is not a schema disagreement.",
      "PROJECT METADATA EQUIVALENCE remains UNKNOWN and is not asserted: the generated capability plants do not supply an oracle for the third-party components, and nobody has written down their complete correct public APIs. This is a throughput surface with a project coverage census plus a separate entrypoint-capability gate.",
      "Each measured run constructs a fresh checker/session and Verter's pooled engine is evicted afterwards, so no run inherits another's warm program. Tool order is rotated on every warmup and measured run.",
      "The checkout is never written to by this surface — it only reads.",
    ],
  };
}
