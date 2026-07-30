/**
 * Gates and wiring for the alias swap, the webpack-family census, and the two
 * `project-*` surfaces added for real-world corpora.
 *
 * Every test here pins a bug that published a plausible WRONG ANSWER rather than
 * crashing: a swap that silently did not happen, a census that counted one
 * component twice, or a tool credited with latency for an answer it never gave.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";

import { matchesAliasedSpecifier } from "../../scripts/lib/real-world/alias-hooks.mjs";
import {
  BASELINE_PLUGIN_SPECIFIER,
  aliasRedirectCensus,
  aliasSwapEnv,
  resolveChallengerUrl,
} from "../../scripts/lib/real-world/plugin-swap.mjs";
import { applyAliasVerificationGate } from "../../scripts/lib/surfaces/project-test.mjs";
import {
  sfcKeyForWebpackModule,
  tsRules,
  webpackCensus,
  webpackExternals,
} from "../../scripts/lib/real-world/bundler-drivers.mjs";
import {
  CHECKOUT_DEPENDENCY_SURFACES,
  usesCheckoutDependencies,
} from "../../scripts/lib/real-world/corpus.mjs";
import { applyComponentMetaGates } from "../../scripts/lib/surfaces/project-component-meta.mjs";
import { applyProjectLspGates, hoverCandidates } from "../../scripts/lib/surfaces/project-lsp.mjs";

function scratchDir() {
  const dir = mkdtempSync(join(tmpdir(), "rw-alias-"));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

/* -------------------------------------------------------------------------- */
/* Task 1 — the alias fallback, and the verification that it actually fired.   */
/* -------------------------------------------------------------------------- */

test("the alias rule matches an ALREADY-RESOLVED plugin path, not just the bare name", () => {
  // The load-bearing case, found by measurement. A rule matching only the bare
  // specifier and its subpaths intercepted `import("@vitejs/plugin-vue")` perfectly
  // and intercepted a real `vite build` NOT AT ALL: Vite bundles the config file and
  // resolves its externalised imports to absolute paths first, so Node is handed a
  // file URL in which the package name is only a path segment. The marker stayed
  // empty and the project's own plugin compiled every SFC.
  assert.equal(matchesAliasedSpecifier("@vitejs/plugin-vue"), true);
  assert.equal(matchesAliasedSpecifier("@vitejs/plugin-vue/dist/index.mjs"), true);
  assert.equal(
    matchesAliasedSpecifier(
      "file:///repo/node_modules/.pnpm/@vitejs+plugin-vue@6.0.8_x/node_modules/@vitejs/plugin-vue/dist/index.mjs",
    ),
    true,
    "a resolved file: URL for the package must match, or the swap never fires under vite",
  );
  // Windows path separators and percent-encoded `@` both occur in the wild.
  assert.equal(
    matchesAliasedSpecifier("D:\\repo\\node_modules\\@vitejs\\plugin-vue\\dist\\index.mjs"),
    true,
  );
  assert.equal(
    matchesAliasedSpecifier("file:///repo/node_modules/%40vitejs/plugin-vue/dist/index.mjs"),
    true,
  );

  // And it must not swallow neighbours. Redirecting one of these would swap a
  // plugin nobody asked to swap, silently changing what the row measures.
  assert.equal(matchesAliasedSpecifier("@vitejs/plugin-vue-jsx"), false);
  assert.equal(matchesAliasedSpecifier("unplugin-vue/vite"), false);
  assert.equal(matchesAliasedSpecifier("/repo/node_modules/vue/index.mjs"), false);
  assert.equal(matchesAliasedSpecifier("", "@vitejs/plugin-vue"), false);
});

test("aliasSwapEnv appends to NODE_OPTIONS and clears a stale marker", () => {
  const { dir, cleanup } = scratchDir();
  try {
    const markerPath = join(dir, "nested", "redirects.txt");
    mkdirSync(join(dir, "nested"), { recursive: true });
    // A marker left over from a previous iteration would report a redirect THIS
    // run did not make — and the gate reads the file as evidence, so a stale line
    // is a false pass on the one check that stops the baseline being published
    // under a challenger's name.
    writeFileSync(markerPath, "@vitejs/plugin-vue\tstale\n");

    const built = aliasSwapEnv({
      challengerSpec: "unplugin-vue/vite",
      markerPath,
      baseEnv: { NODE_OPTIONS: "--max-old-space-size=4096" },
    });

    assert.equal(aliasRedirectCensus(markerPath).fired, false, "the stale marker must be gone");
    assert.match(built.env.NODE_OPTIONS, /^--max-old-space-size=4096 --import /);
    assert.match(
      built.env.NODE_OPTIONS,
      /--import "file:\/\/.*alias-loader\.mjs"/,
      "the loader URL must be quoted — NODE_OPTIONS is whitespace-split, and a repo path with a space would inject a truncated URL and install no hook",
    );
    assert.equal(built.env.BENCH_ALIAS_FROM, BASELINE_PLUGIN_SPECIFIER);
    assert.match(built.env.BENCH_ALIAS_TO, /^file:\/\/.*unplugin-vue/);
    assert.equal(built.env.BENCH_ALIAS_MARKER, markerPath);

    // A challenger that is not installed yields no url and no env, so the surface
    // can emit a stated skip instead of a run with no hook in it.
    const missing = aliasSwapEnv({
      challengerSpec: "@not-installed/nothing-here",
      markerPath: join(dir, "m2.txt"),
    });
    assert.equal(missing.url, null);
    assert.deepEqual(missing.env, {});
    assert.match(missing.notes, /not resolvable/);
  } finally {
    cleanup();
  }
});

test("resolveChallengerUrl resolves every challenger this repo installs", () => {
  // The alias mechanism returns a URL rather than a specifier because the
  // challenger lives in THIS repo's node_modules and the timed process runs in a
  // third-party checkout that cannot see it. If resolution silently failed the row
  // would be skipped with a message that reads like the tool's fault.
  for (const spec of ["unplugin-vue/vite", "@vizejs/vite-plugin", "@verter/unplugin/vite"]) {
    const r = resolveChallengerUrl(spec);
    assert.ok(r.url, `${spec} must resolve from the repo root — ${r.notes}`);
    assert.match(r.url, /^file:\/\//);
  }
});

test("aliasRedirectCensus reads the marker and distinguishes absent from empty", () => {
  const { dir, cleanup } = scratchDir();
  try {
    const missing = join(dir, "never-written.txt");
    assert.deepEqual(aliasRedirectCensus(missing), {
      fired: false,
      count: 0,
      specifiers: [],
      importers: [],
    });

    const marker = join(dir, "m.txt");
    writeFileSync(marker, "");
    assert.equal(aliasRedirectCensus(marker).fired, false, "an empty marker is not a redirect");

    writeFileSync(
      marker,
      "@vitejs/plugin-vue\tfile:///p/vite.config.mjs\nfile:///n/@vitejs/plugin-vue/dist/index.mjs\tfile:///p/other.mjs\n",
    );
    const census = aliasRedirectCensus(marker);
    assert.equal(census.fired, true);
    assert.equal(census.count, 2);
    assert.equal(census.specifiers.length, 2);
    assert.equal(census.importers.length, 2);
  } finally {
    cleanup();
  }
});

test("an alias row whose redirect never fired is WITHDRAWN, not ranked", () => {
  const row = (id, samples, status = "ok") => ({
    id,
    package: "p",
    notes: "n",
    status,
    medianMs: 100,
    metaSamples: samples,
  });

  const results = [
    // The baseline is not an alias row and must be left alone.
    row("baseline", [{ testsPassed: 10 }]),
    // Never fired: the run may have been the project's own toolchain end to end,
    // so publishing its time under a challenger's name is the worst outcome
    // available here — and nothing in the output would show it.
    row("alias-vize", [{ aliasFired: false }, { aliasFired: false }]),
    // Fired on ONE of three runs: a mixed series is not a swapped series.
    row("alias-verter", [{ aliasFired: true }, { aliasFired: false }, { aliasFired: true }]),
    // Fired every time: ranked.
    row("alias-unplugin-vue", [{ aliasFired: true }, { aliasFired: true }]),
    // No samples at all cannot be evidence of a redirect.
    row("alias-empty", []),
  ];
  applyAliasVerificationGate(results);

  assert.equal(results[0].status, "ok");
  assert.equal(results[1].status, "skipped", "a never-fired alias row must publish no number");
  assert.match(results[1].notes, /NOT MEASURED/);
  assert.match(results[1].notes, /fired on 0 of 2 measured run\(s\)/);
  assert.equal(results[2].status, "skipped", "a partially-fired series is not a swapped series");
  assert.equal(results[3].status, "ok");
  assert.equal(results[4].status, "skipped");

  // And the withdrawal must be worded as a harness gap, not as a tool verdict.
  assert.match(results[1].notes, /harness gap, NOT a statement about the tool/);
});

/* -------------------------------------------------------------------------- */
/* Task 2 — the webpack-family census and loader wiring.                      */
/* -------------------------------------------------------------------------- */

test("the webpack census collapses unplugin's virtual sub-request onto its source SFC", () => {
  const appDir = "/work/app";
  const source = `${appDir}/components/app/Banner.vue`;
  // unplugin's webpack adapter serves the script block from its own vfs under a
  // filename that is the ENTIRE original request percent-encoded. Keyed raw, that
  // is a different string from the source path, so `webpack × unplugin-vue`
  // reported 6 of 3 corpus SFCs compiled. That is not a harmless over-count: the
  // corpus-compile gate anchors on the BEST cell for the bundler, so a doubled
  // challenger raises the bar above the corpus and UNRANKS the vue-loader baseline
  // for compiling "too few" — the harness bracketing the reference implementation
  // on the strength of its own arithmetic.
  const virtual = `${appDir}/_virtual_%2Fwork%2Fapp%2Fcomponents%2Fapp%2FBanner.vue%3Fvue%26type%3Dscript%26setup%3Dtrue%26lang.ts`;

  const a = sfcKeyForWebpackModule(appDir, source);
  const b = sfcKeyForWebpackModule(appDir, virtual);
  assert.ok(a, "the plain SFC path must resolve to a key");
  assert.equal(b, a, "the virtual sub-request must key to the SAME component");

  // vue-loader's query form, and Vize's sidecar, both key to the source too.
  assert.equal(sfcKeyForWebpackModule(appDir, `${source}?vue&type=template&id=abc`), a);
  assert.equal(sfcKeyForWebpackModule(appDir, `${source}.ts`), a);

  // Vendor and out-of-corpus modules are not corpus SFCs.
  assert.equal(sfcKeyForWebpackModule(appDir, "/work/app/node_modules/x/Y.vue"), null);
  assert.equal(sfcKeyForWebpackModule(appDir, "/elsewhere/Z.vue"), null);
  assert.equal(sfcKeyForWebpackModule(appDir, `${appDir}/entry.js`), null);

  // End to end through the census: three sub-requests of one component is one.
  const stats = {
    compilation: {
      modules: [
        { resource: source },
        { resource: virtual },
        { resource: `${source}?vue&type=style&index=0&lang.scss` },
        { resource: `${appDir}/components/app/Other.vue` },
      ],
    },
  };
  const census = webpackCensus(appDir, stats);
  assert.equal(census.vueModules, 2, "two components, however many sub-requests they were split into");
  assert.equal(census.styleRequests, 1);
});

test("the census recognises a style sub-request whose query is baked into a virtual filename", () => {
  const appDir = "/work/app";
  const stats = {
    compilation: {
      modules: [
        {
          resource: `${appDir}/_virtual_%2Fwork%2Fapp%2FShare.vue%3Fvue%26type%3Dstyle%26index%3D0%26lang.scss`,
        },
      ],
    },
  };
  // The marker lives in the query for one integration and in the path for another.
  // A census that only saw the query form would report zero style sub-requests for
  // half the cells, and the surface publishes that count.
  assert.equal(webpackCensus(appDir, stats).styleRequests, 1);
});

test("the webpack TypeScript rules put SFC-derived modules in the POST slot only", () => {
  for (const isRspack of [false, true]) {
    const rules = tsRules(isRspack);
    const plainTs = rules.find((r) => String(r.test) === String(/\.ts$/));
    const sfcRule = rules.find((r) => r.enforce === "post");
    assert.ok(plainTs, "a plain .ts rule must exist for real TypeScript in the graph");
    assert.ok(sfcRule, "the SFC rule must be a POST loader so swc sees the integration's OUTPUT");

    // The bug: the plain-.ts rule also carried `|lang\.ts`, and unplugin's virtual
    // script-block filename ENDS in `lang.ts`. swc therefore matched it as a NORMAL
    // loader, and unplugin's own load loader — also normal, and `unshift`ed to the
    // front of module.rules — ran AFTER it. webpack's parser was handed
    // `setup(__props: any, …)` and every `webpack × unplugin` cell failed while the
    // vue-loader cells passed: a difference in how each integration NAMES its
    // output, published as a difference in capability.
    assert.doesNotMatch(String(plainTs.test), /lang/, "lang.ts must not be matched by a NORMAL rule");
    assert.ok(plainTs.exclude, "the plain .ts rule must exclude SFC-derived modules");
    assert.equal(
      plainTs.exclude.test("/app/_virtual_%2Fapp%2FA.vue%3Fvue%26type%3Dscript%26lang.ts"),
      true,
    );
    assert.equal(plainTs.exclude.test("/app/src/helpers.ts"), false);

    // The post rule must reach BOTH id shapes.
    assert.equal(sfcRule.test.test("/app/A.vue"), true);
    assert.equal(
      sfcRule.test.test("/app/_virtual_%2Fapp%2FA.vue%3Fvue%26type%3Dscript%26lang.ts"),
      true,
    );

    // A `<style>` block is not TypeScript. Handing one to a TypeScript parser fails
    // on the first selector, which looks like a Vue-integration defect and is
    // nothing of the kind — 39 of Hoppscotch's 293 SFCs carry one.
    assert.ok(sfcRule.resourceQuery?.not, "style sub-requests must be excluded by query");
    assert.equal(sfcRule.resourceQuery.not[0].test("?vue&type=style&lang.scss"), true);
    assert.equal(sfcRule.resourceQuery.not[0].test("?vue&type=script&lang.ts"), false);
    assert.ok(sfcRule.exclude, "and by path, for the virtual form");
    // `exclude` grew from one regex to an array when CUSTOM blocks joined style
    // blocks in the not-TypeScript set (naive-ui's <markdown> was handed to swc
    // and the parse error read as an integration defect).
    const excludes = Array.isArray(sfcRule.exclude) ? sfcRule.exclude : [sfcRule.exclude];
    assert.ok(excludes.some((re) => re.test("/app/_virtual_%2FA.vue%3Fvue%26type%3Dstyle%26lang.scss")));
    assert.ok(excludes.some((re) => re.test("/app/_virtual_%2FA.vue%3Fvue%26type%3Dmarkdown%26index%3D0")));
    assert.ok(
      !excludes.some((re) => re.test("/app/_virtual_%2FA.vue%3Fvue%26type%3Dscript%26lang.ts")),
      "script blocks must still reach the TypeScript transform",
    );
    assert.ok(
      !excludes.some((re) => re.test("/app/_virtual_%2FA.vue%3Fvue%26type%3Dtemplate%26id%3D1")),
      "template blocks must still reach the TypeScript transform",
    );
    assert.equal(sfcRule.resourceQuery.not.some((re) => re.test("?vue&type=markdown&index=0")), true);
    assert.equal(sfcRule.resourceQuery.not.some((re) => re.test("?vue&type=script&lang.ts")), false);

    // And they must be STORED rather than parsed, identically in every cell —
    // style and custom blocks alike, each in both id shapes.
    const storedRules = rules.filter((r) => r.type === "asset/source");
    assert.equal(storedRules.length, 4, "one rule per (block class × id shape) — webpack ANDs a rule's conditions");
  }
});

test("the webpack externals rule externalises a project ALIAS that happens to end in .vue", async () => {
  const { dir, cleanup } = scratchDir();
  try {
    const appDir = join(dir, "app");
    mkdirSync(join(appDir, "components"), { recursive: true });
    writeFileSync(join(appDir, "components", "A.vue"), "<template><i /></template>\n");

    const externals = webpackExternals(appDir);
    const ask = (request, context = join(appDir, "components")) =>
      new Promise((resolve) => externals({ context, request }, (_e, result) => resolve(result)));

    // Hoppscotch's router does `import("~/pages/_.vue")`. A blanket
    // "the request mentions .vue ⇒ internal" rule sent that to webpack's resolver,
    // which failed with `Can't resolve '~/pages/_.vue'` AFTER the integration had
    // compiled all 60 SFCs — so the bundle surface classified it as ❌ attributable
    // to the integration. Three of four webpack-family integrations were blamed for
    // an alias this harness declined to externalise.
    assert.equal(await ask("~/pages/_.vue"), "commonjs ~/pages/_.vue");
    assert.equal(await ask("vue"), "commonjs vue");
    assert.equal(await ask("~icons/lucide/check"), "commonjs ~icons/lucide/check");

    // Corpus code and the integrations' own sub-requests stay internal, or a loader
    // would be measured never compiling a template.
    assert.equal(await ask("./A.vue"), undefined);
    assert.equal(await ask("./A.vue?vue&type=template&id=abc&ts=true"), undefined);
    // A virtual id a plugin invented inside the app dir: not on disk, still internal.
    assert.equal(
      await ask(join(appDir, "_virtual_A.vue%3Fvue%26type%3Dscript%26lang.ts"), appDir),
      undefined,
    );
    // A relative import to something the corpus does not contain is external.
    assert.equal(await ask("./missing-helper"), "commonjs ./missing-helper");
  } finally {
    cleanup();
  }
});

/* -------------------------------------------------------------------------- */
/* Task 3a — project-component-meta work gates.                                */
/* -------------------------------------------------------------------------- */

function metaRow(id, sample, status = "ok") {
  return { id, package: id, notes: "n", status, artifactMedian: sample?.components, metaSamples: sample ? [sample] : [] };
}

const metaSample = (over = {}) => ({
  components: 20,
  componentsFailed: 0,
  componentsTotal: 20,
  withProps: 12,
  members: 80,
  propBearing: Array.from({ length: 12 }, (_, i) => `src/C${i}.vue`),
  // Components whose SOURCE contains a defineProps / props: declaration. The
  // prop-coverage gate anchors on the INTERSECTION of this and what the baseline
  // reported — see the test below for why the baseline alone is not an anchor.
  declaredProps: Array.from({ length: 12 }, (_, i) => `src/C${i}.vue`),
  ...over,
});

test("the prop-coverage anchor excludes components that declare NO props", () => {
  // Measured on Hoppscotch: vue-component-meta reported props for 25 of 25 SFCs
  // while only 18 of them contain a `defineProps`, because it also reports the
  // implicit and inherited instance surface. Anchoring on "the baseline found props
  // here" therefore bracketed @verter/component-meta for reporting props on exactly
  // those 18 — a schema disagreement about what a component's public API IS,
  // published as a verdict that it did less work.
  const declared = ["src/A.vue", "src/B.vue"];
  const results = [
    metaRow(
      "vue-component-meta",
      metaSample({
        components: 4,
        componentsTotal: 4,
        withProps: 4,
        // The baseline finds props on all four, including the two that declare none.
        propBearing: ["src/A.vue", "src/B.vue", "src/C.vue", "src/D.vue"],
        declaredProps: declared,
      }),
    ),
    metaRow(
      "verter-component-meta",
      metaSample({
        components: 4,
        componentsTotal: 4,
        withProps: 2,
        propBearing: declared,
        declaredProps: declared,
      }),
    ),
  ];
  applyComponentMetaGates(results);
  assert.equal(
    results[1].status,
    "ok",
    "reporting the DECLARED API and nothing more is a schema difference, not less work",
  );
  assert.match(results[1].notes, /prop coverage verified/);
  assert.match(results[1].notes, /Components that declare NO props are excluded/);
});
test("component-meta gate unranks a tool that resolved fewer components than the baseline", () => {
  const results = [
    metaRow("vue-component-meta", metaSample()),
    metaRow("verter-component-meta", metaSample({ components: 9, componentsFailed: 11, withProps: 5, propBearing: ["src/C0.vue"] })),
  ];
  applyComponentMetaGates(results);
  assert.equal(results[0].status, "ok", "the baseline is not gated against itself");
  assert.equal(results[1].status, "unranked");
  assert.match(results[1].notes, /FAILED METADATA CENSUS/);
  assert.match(results[1].notes, /9 components where the baseline returned 20/);
});

test("component-meta gate unranks a tool that returned an EMPTY API for components the baseline found props on", () => {
  // The trivial way to win this surface is to resolve every component and report
  // `{}` for it: the component count looks healthy and the pass is nearly free.
  const results = [
    metaRow("vue-component-meta", metaSample()),
    metaRow("verter-component-meta", metaSample({ withProps: 2, propBearing: ["src/C0.vue", "src/C1.vue"] })),
  ];
  applyComponentMetaGates(results);
  assert.equal(results[1].status, "unranked");
  assert.match(results[1].notes, /FAILED PROP-COVERAGE GATE/);
  assert.match(results[1].notes, /ZERO props for 10 of the 12 components/);
});

test("component-meta gate unranks ANY row that resolved nothing, the baseline included", () => {
  const results = [
    metaRow("vue-component-meta", metaSample({ components: 0, componentsFailed: 20, withProps: 0, propBearing: [] })),
    metaRow("verter-component-meta", metaSample()),
  ];
  applyComponentMetaGates(results);
  assert.equal(results[0].status, "unranked", "returning nothing is the fastest possible pass");
  assert.match(results[0].notes, /FAILED METADATA CENSUS/);
  // And a bracketed baseline cannot anchor the challenger — comparing against a
  // reference that did no work would unrank the tool that did.
  assert.equal(results[1].status, "ok");
  assert.match(results[1].notes, /GATE NOT RUN/);
  assert.doesNotMatch(results[1].notes, /FAILED PROP-COVERAGE GATE/);
});

test("component-meta member totals are reported, never gated", () => {
  // The tools disagree about what belongs to a component's public API —
  // vue-component-meta reports inherited and implicit surface, Verter the declared
  // API. Gating on that total would brand a tool for a schema definition.
  const results = [
    metaRow("vue-component-meta", metaSample({ members: 665 })),
    metaRow("verter-component-meta", metaSample({ members: 40 })),
  ];
  applyComponentMetaGates(results);
  assert.equal(results[1].status, "ok", "a member-count gap is a schema difference, not less work");
  assert.match(results[1].notes, /NOT asserted equivalent/);
});

/* -------------------------------------------------------------------------- */
/* Task 3b — project-lsp work gates and probe selection.                       */
/* -------------------------------------------------------------------------- */

test("hoverCandidates picks script-block declarations and ignores the template", () => {
  const source = [
    "<template>",
    "  <p>{{ const notThis }}</p>",
    "</template>",
    "",
    '<script setup lang="ts">',
    'import { ref } from "vue"',
    "const interceptor = ref(0)",
    "let counter = 1",
    "function handleClick(): void {}",
    "const { a, b } = props",
    "</script>",
  ].join("\n");

  const found = hoverCandidates(source);
  assert.deepEqual(
    found.map((f) => f.symbol),
    ["interceptor", "counter", "handleClick"],
    "a destructuring pattern has no single identifier a hover is guaranteed to describe",
  );
  // The position must land ON the identifier, not at the start of the line: a
  // position chosen without reference to the source lands on whitespace as often
  // as not, and every row would then fail the content gate for the harness's
  // choice of cursor.
  const line = source.split("\n")[found[0].line];
  assert.equal(line.slice(found[0].character, found[0].character + "interceptor".length), "interceptor");
  assert.deepEqual(hoverCandidates(""), []);
});

function lspRow(id, samples, status = "ok") {
  return { id, package: "p", notes: "n", status, medianMs: 50, metaSamples: samples };
}

test("project-lsp hover gate unranks a server that answered nothing at the baseline's position", () => {
  const results = [
    lspRow("volar-js-hover", [{ hoverAnswered: true, hoverBytes: 120 }]),
    // Empty payload: a fast non-answer. The position was chosen because the
    // baseline answered at it untimed, so there is no excuse available here.
    lspRow("vize-lsp-hover", [{ hoverAnswered: false, hoverBytes: 0 }]),
    // Answered on one run of two — a series that mostly did not answer.
    lspRow("verter-lsp-hover", [{ hoverAnswered: true }, { hoverAnswered: false }]),
  ];
  applyProjectLspGates(results);
  assert.equal(results[0].status, "ok");
  assert.equal(results[1].status, "unranked");
  assert.match(results[1].notes, /FAILED HOVER CONTENT GATE/);
  assert.match(results[1].notes, /not asserted for third-party code/i);
  assert.equal(results[2].status, "unranked");
  assert.match(results[2].notes, /on 1 of 2 measured run/);
});

test("project-lsp diagnostic gate anchors on the baseline and says when it could not", () => {
  const results = [
    lspRow("volar-js-diagnostics", [{ diagnosticsCount: 7 }]),
    // Nothing reported for a document the reference server reported 7 for.
    lspRow("vize-lsp-diagnostics", [{ diagnosticsCount: 0 }, { diagnosticsCount: 0 }]),
    // Fewer, but not none: annotated by the count column, not gated — a server may
    // legitimately be less strict, and diagnostic equivalence is not asserted.
    lspRow("verter-lsp-diagnostics", [{ diagnosticsCount: 3 }]),
  ];
  applyProjectLspGates(results);
  assert.equal(results[1].status, "unranked");
  assert.match(results[1].notes, /FAILED DIAGNOSTIC-CONTENT GATE/);
  assert.equal(results[2].status, "ok");

  // An EMPTY baseline list is a legitimate answer but not an anchor, and the row
  // must say so rather than rendering as though it had cleared the gate.
  const clean = [
    lspRow("volar-js-diagnostics", [{ diagnosticsCount: 0 }]),
    lspRow("vize-lsp-diagnostics", [{ diagnosticsCount: 0 }]),
  ];
  applyProjectLspGates(clean);
  assert.equal(clean[1].status, "ok");
  assert.match(clean[1].notes, /GATE NOT RUN/);
});

test("project-lsp reports a degraded type backend on any row, ranked or not", () => {
  // A server can initialise, answer everything and look healthy while its type
  // backend never started. Detecting one vendor's and not another's would disclose
  // the condition only for the tool the harness happens to know about.
  const results = [
    lspRow("volar-js-hover", [{ hoverAnswered: true }]),
    lspRow("vize-lsp-hover", [
      { hoverAnswered: true, backendFallback: "tsgo/Corsa backend did not start" },
    ]),
  ];
  applyProjectLspGates(results);
  assert.equal(results[1].status, "ok", "a fallback is reported, never used to fail a row on its own");
  assert.match(results[1].notes, /BACKEND FALLBACK/);
});

/* -------------------------------------------------------------------------- */
/* Wiring — the surfaces are reachable everywhere they are published from.     */
/* -------------------------------------------------------------------------- */

test("the new project-* surfaces are subject to the lockfile rule", () => {
  // A project shipping no lockfile installed whatever resolved on the day, so a
  // timing that executes those dependencies is not reproducible and every row on
  // such a surface is unranked. Both new surfaces read the project's own tsconfig
  // and resolve through its own node_modules — the types a metadata extractor and
  // a language server report come OUT of those packages — so leaving them off this
  // list would publish ranked, unreproducible numbers while the surfaces beside
  // them were correctly bracketed.
  for (const id of ["project-component-meta", "project-lsp"]) {
    assert.ok(
      CHECKOUT_DEPENDENCY_SURFACES.includes(id),
      `${id} runs inside the checkout, so it must be subject to the lockfile rule`,
    );
    assert.equal(usesCheckoutDependencies(id), true);
    // And the orchestrator applies it per surface id, which arrives suffixed with
    // the corpus selector.
    assert.equal(usesCheckoutDependencies(`${id}@hoppscotch:common`), true);
  }
  // The corpus-copy surfaces stay off it: they externalise every specifier that is
  // not corpus code, so the project's dependency resolution cannot move their
  // numbers and unranking them would discard sound measurements for no gain.
  for (const id of ["compile", "format", "lint", "bundle", "hmr"]) {
    assert.equal(usesCheckoutDependencies(id), false, `${id} must not be gated on the lockfile`);
  }
});

test("the two project-* surfaces are wired into every entry point that publishes them", () => {
  const root = new URL("../../", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
  const read = (rel) => readFileSync(join(root, rel), "utf8");

  const orchestrator = read("scripts/bench-real-world.mjs");
  // Dispatch moved OUT of the orchestrator: every surface now runs in its own
  // child process (`scripts/run-surface.mjs`), so that a native panic or an
  // exhausted process costs one (project, surface) cell instead of the whole
  // sweep. The orchestrator still owns the surface LIST; the child owns the
  // mapping from id to runner. Both halves are asserted, because a surface
  // present in one and missing from the other is silently unreachable.
  const child = read("scripts/run-surface.mjs");
  for (const id of ["project-component-meta", "project-lsp"]) {
    // In SUPPORTED_SURFACES, dispatched, and NOT still listed as deferred — a
    // surface left in DEFERRED_SURFACES prints "not available" in the report's
    // methodology while its table sits three screens below.
    assert.match(orchestrator, new RegExp(`"${id}",`), `${id} must be in SUPPORTED_SURFACES`);
    assert.match(child, new RegExp(`"${id}":`), `${id} must be dispatched in run-surface.mjs`);
  }
  const deferredBlock = /const DEFERRED_SURFACES = \{([\s\S]*?)\n\};/.exec(orchestrator)?.[1] ?? "";
  assert.doesNotMatch(deferredBlock, /"project-component-meta"|project-lsp:/, "still deferred");
  // The LIFTED forms stay refused, and must say where to go instead: "typecheck on
  // a lifted corpus" and "project-typecheck" are different measurements.
  for (const id of ["component-meta", "lsp", "typecheck"]) {
    assert.ok(deferredBlock.includes(id), `the lifted ${id} must still be refused by name`);
  }
  assert.match(deferredBlock, /project-component-meta/, "and must point at the in-place surface");

  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.scripts["bench:project-component-meta"],
    "node scripts/bench-real-world.mjs --surfaces project-component-meta",
  );
  assert.equal(
    pkg.scripts["bench:project-lsp"],
    "node scripts/bench-real-world.mjs --surfaces project-lsp",
  );

  const workflow = read(".github/workflows/benchmark-real-world.yml");
  assert.match(
    workflow,
    /--surfaces [^\s]*project-component-meta/,
    "the CI surface list must include project-component-meta, or it is wired but never published",
  );
  // project-lsp is wired and hand-runnable (the bench:project-lsp script above)
  // but MAY be excluded from the CI default list — as of 2026-07-30 it is,
  // because a wedged Volar/tsserver pair burns ~100 minutes of timeouts at
  // --runs 5, past the job budget, which discards EVERY surface for the
  // project. The exclusion must stay deliberate and explained: a workflow that
  // neither runs the surface nor says why has simply lost it.
  if (!/--surfaces [^\s]*project-lsp/.test(workflow)) {
    assert.match(
      workflow,
      /project-lsp is EXCLUDED[\s\S]{0,600}fail-fast/,
      "project-lsp missing from the CI surface list without the documented exclusion reason",
    );
  }

  // And the methodology must no longer claim they are not run on real corpora.
  const methodology = read("docs/methodology.md");
  assert.doesNotMatch(
    methodology,
    /`component-meta` and `lsp` are absent by decision/,
    "the 'deliberately not run' section must no longer list them",
  );
  assert.match(methodology, /project-component-meta/);
  assert.match(methodology, /project-lsp/);
});
