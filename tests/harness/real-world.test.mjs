import assert from "node:assert/strict";
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { collectVueFilesDeep, copyFixtureSubset } from "../../scripts/lib/fixtures.mjs";
import {
  CORPUS_IGNORE_DIRS,
  CORPUS_KINDS,
  REAL_WORLD_PROJECTS,
  defaultSelectors,
  findProject,
  resolveSelector,
} from "../../scripts/lib/real-world/projects.mjs";
import {
  BUNDLERS,
  INTEGRATIONS,
  attributeBuildFailure,
  corpusCompileVerdict,
} from "../../scripts/lib/surfaces/bundle.mjs";
import {
  actuallyChecked,
  applyTypecheckGates,
  diagnosticCensus,
} from "../../scripts/lib/surfaces/project-typecheck.mjs";
import { overrideConfigSource } from "../../scripts/lib/real-world/plugin-swap.mjs";
import { allCells, integrationSpec } from "../../scripts/lib/real-world/bundler-drivers.mjs";
import {
  discoverBuildTargets,
  discoverTestTargets,
  parseVitestSummary,
} from "../../scripts/lib/real-world/test-targets.mjs";
import { stripAnsi } from "../../scripts/lib/real-world/ansi.mjs";
import { SWAP_MECHANISMS, applyTestCountGate } from "../../scripts/lib/surfaces/project-test.mjs";

function scratch() {
  const dir = mkdtempSync(join(tmpdir(), "rw-test-"));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

function write(root, rel, content = "<template><div /></template>\n") {
  const full = join(root, rel);
  mkdirSync(join(full, ".."), { recursive: true });
  writeFileSync(full, content);
}

test("every registered project pins a ref and declares at least one corpus", () => {
  assert.ok(REAL_WORLD_PROJECTS.length > 0, "registry must not be empty");
  const ids = new Set();
  for (const p of REAL_WORLD_PROJECTS) {
    assert.ok(!ids.has(p.id), `duplicate project id ${p.id}`);
    ids.add(p.id);
    assert.match(p.repo, /^https:\/\/github\.com\/.+\.git$/, `${p.id}: repo must be a git URL`);
    // An unpinned ref makes every published number unreproducible, which is the
    // one thing a benchmark against a moving third-party repo must not do.
    assert.ok(p.ref && p.ref.length > 0, `${p.id}: ref must be pinned`);
    assert.ok(["tag", "sha"].includes(p.refKind), `${p.id}: refKind must be tag or sha`);
    assert.ok(p.license, `${p.id}: license must be recorded — sources are third-party`);
    assert.ok(p.corpora.length > 0, `${p.id}: must declare a corpus`);

    const corpusIds = new Set();
    for (const c of p.corpora) {
      assert.ok(!corpusIds.has(c.id), `${p.id}: duplicate corpus id ${c.id}`);
      corpusIds.add(c.id);
      assert.ok(CORPUS_KINDS.includes(c.kind), `${p.id}:${c.id}: unknown kind ${c.kind}`);
      assert.ok(c.roots.length > 0, `${p.id}:${c.id}: must name at least one root`);
      for (const root of c.roots) {
        assert.ok(!root.startsWith("/") && !root.includes(".."), `${p.id}:${c.id}: root must be repo-relative`);
      }
      // The kind is what stops a docs-demo corpus being read as library source.
      assert.ok(c.note && c.note.length > 10, `${p.id}:${c.id}: needs a note saying what it is`);
    }
    assert.equal(
      p.corpora.filter((c) => c.default).length <= 1,
      true,
      `${p.id}: at most one default corpus`,
    );
  }
});

test("a sha-pinned project is pinned to a full commit sha", () => {
  for (const p of REAL_WORLD_PROJECTS.filter((x) => x.refKind === "sha")) {
    assert.match(p.ref, /^[0-9a-f]{40}$/, `${p.id}: sha refs must be the full 40-char commit`);
  }
});

test("resolveSelector picks the default corpus and rejects typos", () => {
  const p = REAL_WORLD_PROJECTS[0];
  const expected = p.corpora.find((c) => c.default) ?? p.corpora[0];
  assert.equal(resolveSelector(p.id).corpus.id, expected.id);
  assert.equal(resolveSelector(`${p.id}:${p.corpora[0].id}`).corpus.id, p.corpora[0].id);

  // A typo must name the valid options rather than silently benchmark something
  // else — a report that quietly measured a different corpus than it claims is
  // worse than one that failed.
  assert.throws(() => resolveSelector("no-such-project"), /unknown real-world project/);
  assert.throws(() => resolveSelector(`${p.id}:no-such-corpus`), /unknown corpus/);
});

test("defaultSelectors yields one resolvable selector per project", () => {
  const selectors = defaultSelectors();
  assert.equal(selectors.length, REAL_WORLD_PROJECTS.length);
  for (const s of selectors) {
    const { project, corpus } = resolveSelector(s);
    assert.ok(findProject(project.id));
    assert.ok(corpus.id);
  }
});

test("collectVueFilesDeep walks nested trees and returns sorted posix paths", () => {
  const { dir, cleanup } = scratch();
  try {
    write(dir, "src/a/B.vue");
    write(dir, "src/A.vue");
    write(dir, "src/deep/deeper/deepest/C.vue");
    write(dir, "src/notes.ts", "export const x = 1\n");

    const files = collectVueFilesDeep(dir);
    assert.deepEqual(files, ["src/A.vue", "src/a/B.vue", "src/deep/deeper/deepest/C.vue"]);
    for (const f of files) assert.ok(!f.includes("\\"), `${f} must be posix-separated`);
  } finally {
    cleanup();
  }
});

test("collectVueFilesDeep skips ignored directories at any depth", () => {
  const { dir, cleanup } = scratch();
  try {
    write(dir, "src/Real.vue");
    write(dir, "node_modules/pkg/Vendored.vue");
    write(dir, "src/nested/node_modules/pkg/Vendored.vue");
    write(dir, "dist/Built.vue");

    const files = collectVueFilesDeep(dir, { ignore: CORPUS_IGNORE_DIRS });
    assert.deepEqual(files, ["src/Real.vue"]);
  } finally {
    cleanup();
  }
});

test("collectVueFilesDeep honours roots and de-duplicates overlapping ones", () => {
  const { dir, cleanup } = scratch();
  try {
    write(dir, "pkg/a/One.vue");
    write(dir, "pkg/Two.vue");
    write(dir, "other/Three.vue");

    assert.deepEqual(collectVueFilesDeep(dir, { roots: ["pkg"] }), ["pkg/Two.vue", "pkg/a/One.vue"]);

    // Overlapping roots must not hand a tool the same source twice: it would
    // inflate the file count and content-hash caches serve the repeat for free.
    const overlapping = collectVueFilesDeep(dir, { roots: ["pkg", "pkg/a"] });
    assert.deepEqual(overlapping, ["pkg/Two.vue", "pkg/a/One.vue"]);
  } finally {
    cleanup();
  }
});

test("collectVueFilesDeep limit takes a stable prefix", () => {
  const { dir, cleanup } = scratch();
  try {
    for (const n of ["d", "a", "c", "b"]) write(dir, `src/${n}/X.vue`);
    const all = collectVueFilesDeep(dir);
    // Same truncated corpus for every tool, or the tools are not being compared
    // on the same input.
    assert.deepEqual(collectVueFilesDeep(dir, { limit: 2 }), all.slice(0, 2));
    assert.deepEqual(collectVueFilesDeep(dir, { limit: 2 }), collectVueFilesDeep(dir, { limit: 2 }));
  } finally {
    cleanup();
  }
});

test("copyFixtureSubset reproduces nested paths", () => {
  const { dir, cleanup } = scratch();
  try {
    const src = join(dir, "src");
    const out = join(dir, "out");
    write(src, "a/b/c/Deep.vue");
    write(src, "Top.vue");

    copyFixtureSubset(src, out, ["a/b/c/Deep.vue", "Top.vue"]);
    assert.ok(existsSync(join(out, "a/b/c/Deep.vue")), "nested file must survive the copy");
    assert.ok(existsSync(join(out, "Top.vue")));
  } finally {
    cleanup();
  }
});

test("bundler registry declares an engine and family for every bundler", () => {
  assert.ok(BUNDLERS.length >= 2, "the bundler axis needs at least two bundlers to be an axis");
  const ids = new Set();
  for (const b of BUNDLERS) {
    assert.ok(!ids.has(b.id), `duplicate bundler id ${b.id}`);
    ids.add(b.id);
    // The engine is the comparison class — Rollup rows must never be ranked
    // against Rolldown or webpack rows, and the report groups on this field.
    assert.ok(b.engine, `${b.id}: must declare its bundling engine`);
    assert.ok(b.spec, `${b.id}: must declare an import specifier`);
    assert.ok(INTEGRATIONS[b.family], `${b.id}: family "${b.family}" has no integration list`);
  }
});

test("every Vue integration declares package, strategy and a usable specifier", () => {
  for (const [family, integrations] of Object.entries(INTEGRATIONS)) {
    assert.ok(integrations.length >= 2, `${family}: needs at least two integrations to be an axis`);
    const ids = new Set();
    for (const i of integrations) {
      assert.ok(!ids.has(i.id), `${family}: duplicate integration id ${i.id}`);
      ids.add(i.id);
      assert.ok(i.package, `${family}/${i.id}: must name its npm package`);
      // Vize pre-compiles the corpus at plugin-init while the others compile
      // lazily. A row that does not say which strategy it used is not readable.
      assert.ok(i.strategy, `${family}/${i.id}: must declare its compile strategy`);
      assert.ok(
        i.spec || i.specByBundler,
        `${family}/${i.id}: must declare spec or specByBundler`,
      );
      if (family === "webpack") {
        assert.equal(
          typeof i.apply,
          "function",
          `${family}/${i.id}: webpack-family integrations are applied to a config, so they need apply()`,
        );
      }
    }
  }
});

test("discoverTestTargets finds vitest packages and ignores runners it cannot swap", () => {
  const { dir, cleanup } = scratch();
  try {
    const pkg = (rel, json, extra = {}) => {
      write(dir, `${rel}/package.json`, `${JSON.stringify(json)}\n`);
      for (const [f, c] of Object.entries(extra)) write(dir, `${rel}/${f}`, c);
    };
    // Swappable: vitest script + vitest dependency + importable config + SFCs.
    pkg(
      "packages/app",
      { name: "@p/app", scripts: { test: "vitest --run" }, devDependencies: { vitest: "1" } },
      { "vitest.config.mts": "export default {}\n" },
    );
    write(dir, "packages/app/src/A.vue");

    // A vitest suite with NO SFCs under it cannot exercise a Vue plugin, so it
    // must not be a candidate at all. This is the real Hoppscotch case: the first
    // implementation sorted alphabetically and picked `packages/hoppscotch-cli`,
    // which contains no Vue whatsoever, over `packages/hoppscotch-common` and its
    // 293 SFCs — then reported the resulting "no vite:vue plugin found" as a
    // failure of all three challengers.
    pkg(
      "packages/cli",
      { name: "@p/cli", scripts: { test: "vitest --run" }, devDependencies: { vitest: "1" } },
      { "vitest.config.ts": "export default {}\n" },
    );
    // Not swappable and must not be run: a `test` script that is not vitest.
    pkg("packages/e2e", {
      name: "@p/e2e",
      scripts: { test: "playwright test" },
      devDependencies: { "@playwright/test": "1" },
    });
    // Declares vitest but the script is watch-mode only — would never exit.
    pkg("packages/watch", {
      name: "@p/watch",
      scripts: { "test:watch": "vitest" },
      devDependencies: { vitest: "1" },
    });
    // A vitest script without vitest installed cannot run.
    pkg("packages/bogus", { name: "@p/bogus", scripts: { test: "vitest run" } });

    const targets = discoverTestTargets(dir);
    const names = targets.map((t) => t.packageName);
    assert.deepEqual(
      names,
      ["@p/app"],
      `expected only the SFC-bearing swappable vitest package, got ${names}`,
    );
    assert.equal(targets[0].config, "vitest.config.mts");
    assert.equal(targets[0].canOverride, true);
    assert.equal(targets[0].sfcs, 1);
  } finally {
    cleanup();
  }
});

test("a vitest target without an importable config is discovered but not overridable", () => {
  const { dir, cleanup } = scratch();
  try {
    write(
      dir,
      "package.json",
      `${JSON.stringify({ name: "root", scripts: { test: "vitest --run" }, devDependencies: { vitest: "1" } })}\n`,
    );
    // SFCs are required for a target to be a candidate at all — a Vue plugin
    // cannot be exercised by a suite with no Vue in it.
    write(dir, "src/A.vue");
    const targets = discoverTestTargets(dir);
    assert.equal(targets.length, 1);
    // Still a valid BASELINE row; the challengers become NOT MEASURED with a
    // stated reason rather than being silently dropped.
    assert.equal(targets[0].canOverride, false);
    assert.equal(targets[0].config, null);
  } finally {
    cleanup();
  }
});

test("discoverBuildTargets accepts only literal vite build and rejects framework wrappers", () => {
  const { dir, cleanup } = scratch();
  try {
    const pkg = (rel, scripts, extra = {}) => {
      write(dir, `${rel}/package.json`, `${JSON.stringify({ name: `@p/${rel.split("/").pop()}`, scripts })}\n`);
      write(dir, `${rel}/src/A.vue`);
      for (const [f, c] of Object.entries(extra)) write(dir, `${rel}/${f}`, c);
    };

    pkg("packages/app", { build: "vite build" }, { "vite.config.ts": "export default {}\n" });
    // Framework wrappers generate their Vite config at runtime, so there is no
    // plugins array to substitute into — excluded by construction, not ranked low.
    pkg("packages/nuxt", { build: "nuxt build" }, { "vite.config.ts": "export default {}\n" });
    pkg("packages/quasar", { build: "quasar build" }, { "vite.config.ts": "export default {}\n" });
    // Workspace fan-out would time packages containing no Vue at all.
    pkg("packages/mono", { build: "pnpm -r do-build-prod" }, { "vite.config.ts": "export default {}\n" });

    const names = discoverBuildTargets(dir).map((t) => t.packageName);
    assert.deepEqual(names, ["@p/app"], `expected only the literal vite build target, got ${names}`);
  } finally {
    cleanup();
  }
});

test("discoverBuildTargets ignores vitest-only configs and packages with no SFCs", () => {
  const { dir, cleanup } = scratch();
  try {
    // A vitest.config has no `build` section; building through it would measure a
    // different pipeline from the one the project ships.
    write(dir, "a/package.json", `${JSON.stringify({ name: "@p/a", scripts: { build: "vite build" } })}\n`);
    write(dir, "a/vitest.config.ts", "export default {}\n");
    write(dir, "a/src/A.vue");

    // No SFCs: a Vue plugin cannot be exercised here.
    write(dir, "b/package.json", `${JSON.stringify({ name: "@p/b", scripts: { build: "vite build" } })}\n`);
    write(dir, "b/vite.config.ts", "export default {}\n");

    const targets = discoverBuildTargets(dir);
    assert.deepEqual(targets.map((t) => t.packageName), ["@p/a"]);
    // Discovered as a baseline-only target: no importable BUILD config to override.
    assert.equal(targets[0].canOverride, false);
    assert.equal(targets[0].config, null);
  } finally {
    cleanup();
  }
});

test("stripAnsi removes colour sequences without eating ordinary characters", () => {
  const esc = String.fromCharCode(27);
  assert.equal(stripAnsi(`${esc}[31mError: boom${esc}[0m`), "Error: boom");
  // The regression this guards: a hand-escaped pattern with an optional ESC and a
  // broken character class matched a bare `m`, silently deleting characters from
  // the diagnostics the reports quote verbatim.
  assert.equal(stripAnsi("module failed"), "module failed");
  assert.equal(stripAnsi("m"), "m");
});

test("parseVitestSummary reads counts and never reports a crash as zero fast tests", () => {
  const ok = parseVitestSummary(`
 Test Files  10 passed (10)
      Tests  123 passed | 2 skipped (125)
   Duration  4.20s
`);
  assert.equal(ok.parsed, true);
  assert.equal(ok.tests, 125);
  assert.equal(ok.testsPassed, 123);
  assert.equal(ok.files, 10);

  const failing = parseVitestSummary(` Tests  3 failed | 7 passed (10)`);
  assert.equal(failing.testsFailed, 3);
  assert.equal(failing.tests, 10);

  // The load-bearing case: a run that died before collecting anything must be
  // `parsed: false` so the surface throws instead of recording a very fast row
  // with zero tests, which would rank first.
  const crashed = parseVitestSummary("Error: Cannot find module './missing'");
  assert.equal(crashed.parsed, false);
  assert.equal(crashed.tests, null);
});

test("parseVitestSummary reads the LAST summary block and never blends two", () => {
  // A run that printed two summary blocks. Vitest does this when a reporter list
  // names `default` twice, and when a blob report is merged in. The old parser
  // matched each label independently and un-anchored, so it took `Test Files`
  // from the first block and `Tests` from wherever the regex landed — publishing
  // a census that describes no single run, which the work gate then ruled on.
  const doubled = parseVitestSummary(
    [
      " Test Files  2 passed (2)",
      "      Tests  9 passed (9)",
      "   Start at  10:00:00",
      "   Duration  1.00s",
      "",
      " Test Files  4 failed | 58 passed (62)",
      "      Tests  3 failed | 411 passed | 2 skipped (416)",
      "   Start at  10:00:02",
      "   Duration  8.02s",
    ].join("\n"),
  );
  assert.equal(doubled.parsed, true);
  assert.equal(doubled.files, 62, "the file total must come from the LAST block");
  assert.equal(doubled.filesPassed, 58);
  assert.equal(doubled.filesFailed, 4);
  assert.equal(doubled.tests, 416, "the test total must come from the SAME block");
  assert.equal(doubled.testsPassed, 411);
  assert.equal(doubled.testsFailed, 3);
  assert.equal(doubled.summaryBlocks, 2, "the row says the census came from the last of several");
});

test("parseVitestSummary does not pair a file line with a test line from another block", () => {
  // The trailing block is PARTIAL — a file line with no test line under it, which
  // is what a run killed mid-summary leaves behind. Taking each label's last
  // occurrence independently would pair the second block's file count with the
  // first block's test count. There is no such run, so the test total must be
  // absent and the census must refuse to parse rather than invent a pairing.
  const partial = parseVitestSummary(
    [
      " Test Files  2 passed (2)",
      "      Tests  9 passed (9)",
      "",
      " Test Files  62 passed (62)",
    ].join("\n"),
  );
  assert.equal(partial.files, 62);
  assert.equal(partial.tests, null, "no Tests line follows the last Test Files line");
  assert.equal(partial.parsed, false, "and an unpaired census must not stand in for a run");
});

test("parseVitestSummary only matches a label at the start of a line", () => {
  // The text this parses is a third-party suite's console output: arbitrary test
  // names, arbitrary error messages. The old regex was `label + "\\s+(.+)"`,
  // unanchored, with `\s` able to cross a newline — so a test name or an error
  // string could supply the census the gate rules on.
  const spoofed = parseVitestSummary(
    [
      "   ✓ src/x.spec.ts > describe > Tests  999 passed (999)",
      ' FAIL  Error: expected "Test Files  999 passed (999)"',
      " Test Files  1 passed (1)",
      "      Tests  7 passed (7)",
    ].join("\n"),
  );
  assert.equal(spoofed.files, 1, "a quoted summary inside an error must not become the census");
  assert.equal(spoofed.tests, 7, "nor must a test title that happens to read like one");
});

test("parseVitestSummary reports files that failed to collect, not just the total", () => {
  // Verbatim from `vitest run` in fixtures/real/hoppscotch/packages/hoppscotch-common
  // (vitest 4.1.9, 62 spec files on disk). Half the files cannot be imported at
  // all because `@hoppscotch/data` is built by a postinstall that
  // `pnpm fetch:real-world` skips — so `62` on its own reads as a suite that ran.
  const hoppscotch = parseVitestSummary(
    [
      " Test Files  31 failed | 31 passed (62)",
      "      Tests  414 passed | 2 skipped (416)",
      "   Start at  23:52:59",
      "   Duration  8.02s (transform 34.23s, setup 5.99s)",
    ].join("\n"),
  );
  assert.equal(hoppscotch.files, 62);
  assert.equal(hoppscotch.filesPassed, 31);
  assert.equal(hoppscotch.filesFailed, 31, "the collapse must be readable, not inferred");
  assert.equal(hoppscotch.tests, 416);
  assert.equal(hoppscotch.testsPassed, 414);
  assert.equal(hoppscotch.summaryBlocks, 1);
});

test("project-test reports a half-collected suite on every row, baseline included", () => {
  // A file that fails to collect runs none of its tests while the file TOTAL
  // still looks whole. When it is the BASELINE that is half-collapsed, the count
  // every challenger is measured against covers half the suite — a fact about
  // the corpus on this machine, so it is stated on the baseline row too.
  const results = [
    {
      id: "baseline",
      package: "@vitejs/plugin-vue",
      notes: "n",
      status: "ok",
      metaSamples: [{ tests: 416, testsPassed: 414, testsFailed: 0, files: 62, filesPassed: 31, filesFailed: 31, exit: 1 }],
    },
    {
      id: "swap-vize",
      package: "@vizejs/vite-plugin",
      notes: "n",
      status: "ok",
      metaSamples: [{ tests: 416, testsPassed: 414, testsFailed: 0, files: 62, filesPassed: 31, filesFailed: 31, exit: 1 }],
    },
  ];
  applyTestCountGate(results);
  for (const row of results) {
    assert.match(row.notes, /31 of 62 test FILES failed to collect/, `${row.id} must disclose the collapse`);
  }
  assert.equal(results[1].status, "ok", "an equal-passing challenger is still ranked");
});

test("the project-test swap mechanisms are all documented", () => {
  // Every row states which mechanism produced it; an undocumented mechanism
  // would render as an empty explanation next to a number.
  for (const key of ["none", "override", "alias"]) {
    assert.ok(
      typeof SWAP_MECHANISMS[key] === "string" && SWAP_MECHANISMS[key].length > 20,
      `swap mechanism "${key}" needs a description a reader can act on`,
    );
  }
  // The fallback IS wired now, and its description must carry the two facts a
  // reader needs to interpret a row it produced: the project's own vue({...})
  // options reach the challenger (so a failure may be an option-shape mismatch),
  // and the redirect is verified rather than assumed.
  assert.match(SWAP_MECHANISMS.alias, /NODE_OPTIONS|resolve hook|resolution-hook/i);
  assert.match(SWAP_MECHANISMS.alias, /option-shape mismatch/i);
  assert.match(SWAP_MECHANISMS.alias, /NOT MEASURED/);
  // And it must not have been left claiming it does not work.
  assert.doesNotMatch(SWAP_MECHANISMS.alias, /NOT wired/i);
});

test("no integration note argues for charitable reading of its own row", () => {
  // Impartiality guard. A note may describe WHAT a tool does differently — a
  // reader needs to know Vize front-loads compilation to interpret its row — but
  // it must not assert equivalence the surface has not measured, or otherwise
  // plead the row's case. These phrases were all present at some point and each
  // was an excuse rather than a description.
  const excuses = [
    /same total work/i,
    /should be read as/i,
    /not really slower/i,
    /would be faster if/i,
    /to be fair/i,
    /in fairness/i,
  ];
  for (const [family, integrations] of Object.entries(INTEGRATIONS)) {
    for (const i of integrations) {
      for (const pattern of excuses) {
        assert.ok(
          !pattern.test(i.notes ?? ""),
          `${family}/${i.id}: note matches ${pattern} — describe what the tool does, do not argue for its row`,
        );
      }
    }
  }
});

test("each bundler family names a baseline integration", () => {
  // The baseline is what the group is read against. It is NOT protected — it is
  // gated and bracketed like everything else — but a group with no reference row
  // has nothing to interpret its alternatives against.
  const baselines = { vite: "plugin-vue", rolldown: "unplugin-vue", webpack: "vue-loader" };
  for (const [family, expected] of Object.entries(baselines)) {
    const integrations = INTEGRATIONS[family] ?? [];
    assert.ok(
      integrations.some((i) => i.id === expected),
      `${family}: baseline integration "${expected}" is missing, so the group has no reference row`,
    );
  }
});

test("allCells is the full cross-product and every cell resolves a specifier or is knowably absent", () => {
  const cells = allCells();
  assert.ok(cells.length >= BUNDLERS.length, "every bundler must contribute at least one cell");

  const ids = new Set();
  for (const cell of cells) {
    assert.ok(!ids.has(cell.id), `duplicate cell id ${cell.id}`);
    ids.add(cell.id);
    assert.ok(cell.label.includes("×"), `${cell.id}: label must name both axes`);

    // A null specifier is legitimate — @vizejs/rspack-plugin publishes no
    // webpack entry point — but it must be DISCOVERABLE, so the surface can emit
    // a skipped row that names the reason instead of throwing mid-matrix.
    const spec = integrationSpec(cell.integration, cell.bundler);
    assert.ok(spec === null || typeof spec === "string", `${cell.id}: specifier must be string or null`);
  }

  // The reference implementations must be present, or the tables have no anchor
  // to read the alternatives against.
  assert.ok(ids.has("vite8__plugin-vue"), "Vite 8 × @vitejs/plugin-vue is the reference cell");
  assert.ok(ids.has("webpack__vue-loader"), "webpack × vue-loader is the webpack-family reference cell");
});

/* -------------------------------------------------------------------------- */
/* Gates that decide whether a number is published as a ranked result.         */
/*                                                                            */
/* Every test below pins a bug that published a plausible WRONG ANSWER rather  */
/* than crashing: a row that did less work ranking above rows that did more,   */
/* or a tool being blamed for a gap in this harness. Those are the failures    */
/* nobody notices in a passing CI run, so they are pinned here.                */
/* -------------------------------------------------------------------------- */

test("parseVitestSummary refuses a run where every test file failed to collect", () => {
  // The exact output Vitest prints when no test file could be collected: a FILE
  // total exists, a TEST total does not. With `parsed` accepting either total,
  // this parsed "successfully" with tests: null, the row was recorded ok, and the
  // count gate skipped over the null — publishing a run that executed ZERO tests
  // as the fastest row in the table.
  const collapsed = parseVitestSummary(`
 Test Files  3 failed (3)
      Tests  no tests
   Duration  1.10s
`);
  assert.equal(collapsed.parsed, false, "a run with no test total must not parse");
  assert.equal(collapsed.tests, null);
  assert.equal(collapsed.files, 3, "the file census is still readable, it just cannot stand in");

  // A real summary still parses.
  assert.equal(parseVitestSummary(" Tests  1 passed (1)").parsed, true);
});

test("project-test gate ranks on tests PASSED, not tests collected", () => {
  const row = (id, meta, notes = "n") => ({
    id,
    package: id,
    notes,
    status: "ok",
    metaSamples: [meta],
  });
  // The challenger collected every test and then failed nearly all of them. A
  // collection-count gate passed this row: same 125 collected, so "same work".
  const results = [
    row("baseline", { tests: 125, testsPassed: 123, testsFailed: 2, exit: 0 }),
    row("swap-vize", { tests: 125, testsPassed: 4, testsFailed: 121, exit: 1 }),
  ];
  applyTestCountGate(results);

  assert.equal(results[0].status, "ok", "the baseline is never gated against itself");
  assert.equal(results[1].status, "unranked", "passing 4 of 125 is not a speed result");
  assert.match(results[1].notes, /FAILED TEST-COUNT GATE/);
  assert.match(results[1].notes, /passed 4 tests where the project's own toolchain passed 123/);
  assert.match(results[1].notes, /121 test\(s\) FAILED/, "the correctness finding is still reported");
});

test("project-test gate unranks a collapsed suite even with no baseline census", () => {
  const results = [
    // A baseline whose own census is missing cannot anchor anything...
    { id: "baseline", package: "b", notes: "n", status: "ok", metaSamples: [{}] },
    // ...but a challenger that exited non-zero having passed nothing is the
    // cheapest possible run and must never be ranked regardless.
    {
      id: "swap-verter",
      package: "@verter/unplugin",
      notes: "n",
      status: "ok",
      metaSamples: [{ tests: 40, testsPassed: null, testsFailed: 40, exit: 1 }],
    },
    // And a row that did pass equally is ranked, but told the gate never ran.
    {
      id: "swap-unplugin",
      package: "unplugin-vue",
      notes: "n",
      status: "ok",
      metaSamples: [{ tests: 40, testsPassed: 40, testsFailed: 0, exit: 0 }],
    },
  ];
  applyTestCountGate(results);

  assert.equal(results[1].status, "unranked");
  assert.match(results[1].notes, /exited 1 having passed no tests/);
  assert.equal(results[2].status, "ok");
  assert.match(
    results[2].notes,
    /GATE NOT RUN/,
    "an ungated row must say so rather than render like a row that cleared the gate",
  );
});

test("project-test gate notes never argue for keeping a red suite ranked", () => {
  const results = [
    { id: "baseline", package: "b", notes: "n", status: "ok", metaSamples: [{ tests: 10, testsPassed: 10, testsFailed: 0, exit: 0 }] },
    { id: "swap-x", package: "x", notes: "n", status: "ok", metaSamples: [{ tests: 10, testsPassed: 3, testsFailed: 7, exit: 1 }] },
  ];
  applyTestCountGate(results);
  // Impartiality guard, same rule as the integration-notes test above: a note may
  // state what happened, never plead the row's case.
  for (const pattern of [/rather than in place of it/i, /can be fast and wrong/i, /to be fair/i]) {
    assert.ok(
      !pattern.test(results[1].notes),
      `note matches ${pattern} — state the fact, do not argue for the row`,
    );
  }
});

test("diagnosticCensus reads every checker's output shape, including Vize's", () => {
  // tsc plain — the file is on the diagnostic line.
  const plain = diagnosticCensus(
    "src/A.vue(3,7): error TS2322: Type 'string' is not assignable to type 'number'.\n" +
      "src/B.vue(9,1): error TS2304: Cannot find name 'x'.\n",
  );
  assert.equal(plain.count, 2);
  assert.equal(plain.files, 2);

  // tsc pretty layout.
  const pretty = diagnosticCensus("src/A.vue:3:7 - error TS2322: Type 'string' ...\n");
  assert.equal(pretty.count, 1);
  assert.equal(pretty.files, 1);

  // Vize: an underlined path heading, then indented `error:line:col [TSxxxx]`. It
  // never writes the literal `error TS1234`, so an /error TS\d+/ counter scored it
  // ZERO — and a zero here is not harmless: the census gate unranks a row
  // reporting far fewer than the baseline, so mis-parsing Vize's output would have
  // bracketed Vize for the harness's inability to read it.
  const vize = diagnosticCensus(
    [
      "Building Corsa virtual project for 2 files under /tmp/p...",
      "",
      "/tmp/p/src/a.ts",
      "  error:1:14 [TS2322] Type 'string' is not assignable to type 'number'.",
      "  error:2:14 [TS2322] Type 'number' is not assignable to type 'string'.",
      "",
      "/tmp/p/src/b.ts",
      "  error:1:14 [TS2322] Type 'string' is not assignable to type 'boolean'.",
      "",
      "  3 error(s)",
    ].join("\n"),
  );
  assert.equal(vize.count, 3, "Vize's bracketed TS codes must still count");
  assert.equal(vize.files, 2, "diagnostics are attributed to the heading above them");

  // A checker that prints only a total is still counted.
  assert.equal(diagnosticCensus("Found 12 errors.").count, 12);
  // And a clean run is zero, not a false positive off some prose line.
  assert.equal(diagnosticCensus("No errors found. Checked 200 files in 3s").count, 0);
});

test("actuallyChecked separates a typecheck from an aborted program construction", () => {
  // The real case: Hoppscotch ships a committed .d.ts with a syntax error, and
  // vue-tsc reports exactly that one diagnostic after ~4 s having checked none of
  // the 293 SFCs — indistinguishable from a fast, thorough checker on wall clock.
  assert.equal(
    actuallyChecked({ status: 1, output: "src/types/post-request.d.ts(1294,5): error TS1128: Declaration or statement expected." }),
    false,
  );
  // Diagnostics across two files cannot come from a program that never got built.
  assert.equal(
    actuallyChecked({
      status: 1,
      output: "src/A.vue(1,1): error TS2322: x\nsrc/B.vue(2,2): error TS2304: y\n",
    }),
    true,
  );
  // A clean exit is a completed check by definition.
  assert.equal(actuallyChecked({ status: 0, output: "" }), true);
});

test("typecheck gates unrank a measured run that never constructed a program", () => {
  const results = [
    {
      id: "vue-tsc-js",
      notes: "baseline",
      status: "ok",
      artifactMedian: 40,
      metaSamples: [{ exit: 1, diagnostics: 40, diagnosticFiles: 12, checked: true }],
    },
    {
      // Ranked before this fix: `actuallyChecked` existed, was documented, and was
      // called only in the untimed pre-flight — so a challenger whose MEASURED runs
      // aborted during program construction published a fast, ranked row.
      id: "verter-tsc",
      notes: "challenger",
      status: "ok",
      artifactMedian: 1,
      metaSamples: [{ exit: 2, diagnostics: 1, diagnosticFiles: 1, checked: false }],
    },
  ];
  applyTypecheckGates(results);
  assert.equal(results[0].status, "ok");
  assert.equal(results[1].status, "unranked");
  assert.match(results[1].notes, /FAILED PROGRAM-CONSTRUCTION GATE/);
});

test("typecheck census gate holds a clean baseline to an exit-0 comparison", () => {
  const mk = (id, diags, exit, extra = {}) => ({
    id,
    notes: id,
    status: "ok",
    artifactMedian: diags,
    metaSamples: [{ exit, diagnostics: diags, diagnosticFiles: 0, checked: true, ...extra }],
  });
  // Baseline is clean: 0 diagnostics, exit 0. The ratio test `diags < 0 * 0.5` can
  // never fire, so every row used to pass by default — on exactly the corpus state
  // where "reported nothing" is easiest to achieve by not checking anything.
  const results = [
    mk("vue-tsc-js", 0, 0),
    mk("vize-check", 0, 1), // reported nothing AND failed
    mk("verter-tsc", 0, 0), // agreed with the baseline
  ];
  applyTypecheckGates(results);
  assert.equal(results[1].status, "unranked", "reporting nothing while failing is not a clean pass");
  assert.match(results[1].notes, /FAILED DIAGNOSTIC-CENSUS GATE/);
  assert.equal(results[2].status, "ok");
});

test("typecheck census gate still catches an under-reporting checker on a dirty project", () => {
  const mk = (id, diags) => ({
    id,
    notes: id,
    status: "ok",
    artifactMedian: diags,
    metaSamples: [{ exit: 1, diagnostics: diags, diagnosticFiles: 5, checked: true }],
  });
  const results = [mk("vue-tsc-js", 100), mk("vize-check", 10), mk("verter-tsc", 400)];
  applyTypecheckGates(results);
  assert.equal(results[1].status, "unranked", "under half the baseline's diagnostics is a gate failure");
  assert.equal(results[2].status, "ok", "stricter is legitimate — annotated, not gated");
  assert.match(results[2].notes, /Diagnostic equivalence is NOT asserted/);
});

test("TNB activation gate requires the banner on EVERY measured run", () => {
  const row = (samples) => ({
    id: "vue-tsc-native",
    notes: "n",
    status: "ok",
    artifactMedian: 40,
    metaSamples: samples,
  });
  const baseline = {
    id: "vue-tsc-js",
    notes: "b",
    status: "ok",
    artifactMedian: 40,
    metaSamples: [{ exit: 1, diagnostics: 40, diagnosticFiles: 9, checked: true }],
  };

  // Loaded once, silently fell back three times. `.some()` published this as a
  // native-engine result — the exact mislabel the gate exists to prevent.
  const flaky = row([
    { exit: 1, diagnostics: 40, diagnosticFiles: 9, checked: true, tnbActive: true },
    { exit: 1, diagnostics: 40, diagnosticFiles: 9, checked: true, tnbActive: false },
    { exit: 1, diagnostics: 40, diagnosticFiles: 9, checked: true, tnbActive: false },
  ]);
  applyTypecheckGates([baseline, flaky]);
  assert.equal(flaky.status, "unranked");
  assert.match(flaky.notes, /FAILED TNB ACTIVATION GATE/);

  const solid = row([
    { exit: 1, diagnostics: 40, diagnosticFiles: 9, checked: true, tnbActive: true },
    { exit: 1, diagnostics: 40, diagnosticFiles: 9, checked: true, tnbActive: true },
  ]);
  applyTypecheckGates([{ ...baseline }, solid]);
  assert.equal(solid.status, "ok");
});

test("a failed bundle cell is attributed on the transform census, not the error text", () => {
  // Compiled part of the corpus and then failed: the integration's own output is
  // implicated, so the row is an attributable ❌.
  assert.deepEqual(
    attributeBuildFailure({ ok: false, error: "Unexpected token", census: { vueModules: 37 } }),
    { compiled: 37, attributable: true },
  );

  // Zero corpus SFCs transformed: a gap in this harness's wiring and a plugin that
  // throws at init look identical from here, so nothing is attributed and no
  // number is published.
  assert.deepEqual(
    attributeBuildFailure({ ok: false, error: "Module parse failed", census: { vueModules: 0 } }),
    { compiled: 0, attributable: false },
  );

  // The old test was `/\?vue|type=(script|template)/` on the error text — a
  // sub-request shape ONLY vue-loader emits. So an unplugin codegen bug that
  // compiled modules and then failed was excused as a harness gap. Census-based
  // attribution does not care what the message looks like.
  const unpluginBug = {
    ok: false,
    error: "Module parse failed: Expression expected (1:42)",
    census: { vueModules: 200 },
  };
  assert.equal(attributeBuildFailure(unpluginBug).attributable, true);

  // No census recorded at all is not evidence of anything.
  assert.deepEqual(attributeBuildFailure({ ok: false, error: "boom" }), {
    compiled: null,
    attributable: false,
  });
});

test("the corpus-compile gate does not let a lone survivor self-anchor", () => {
  // The audit case: one cell built, it compiled 3 of 200 SFCs, and it was the
  // best-in-class by virtue of being the only one — so it ranked first.
  const lone = corpusCompileVerdict({ compiled: 3, best: 3, survivors: 1, fileCount: 200 });
  assert.equal(lone.matchesPeers, true, "it is trivially its own peer anchor");
  assert.equal(lone.ranked, false, "and must still be unranked, against the corpus");
  assert.equal(lone.soleSurvivorShortfall, true);

  // A lone survivor that compiled the whole corpus has nothing left to prove.
  assert.equal(
    corpusCompileVerdict({ compiled: 200, best: 200, survivors: 1, fileCount: 200 }).ranked,
    true,
  );

  // With peers, the peer anchor governs: a shortfall common to every cell is a
  // property of the corpus, and a cell below its peers is unranked.
  assert.equal(
    corpusCompileVerdict({ compiled: 150, best: 150, survivors: 3, fileCount: 200 }).ranked,
    true,
  );
  assert.equal(
    corpusCompileVerdict({ compiled: 120, best: 150, survivors: 3, fileCount: 200 }).ranked,
    false,
  );
  // A group where nothing compiled anything cannot rank on "matching" zero.
  assert.equal(
    corpusCompileVerdict({ compiled: 0, best: 0, survivors: 2, fileCount: 200 }).ranked,
    false,
  );
});

test("the override config resolves the base config with the caller's ConfigEnv", () => {
  // A function-form Vite/Vitest config branches on ConfigEnv, so resolving it with
  // the wrong one hands the challengers a different config from the baseline's —
  // invisible in the output. There is deliberately no default.
  assert.throws(
    () => overrideConfigSource({ baseConfigFile: "vite.config.ts", challengerSpec: "x" }),
    /configEnv \{ command, mode \} is required/,
  );

  const testSrc = overrideConfigSource({
    baseConfigFile: "vitest.config.mts",
    challengerSpec: "@vizejs/vite-plugin",
    configEnv: { command: "serve", mode: "test" },
  });
  assert.match(testSrc, /"command":"serve"/);
  assert.match(testSrc, /"mode":"test"/);
  // The challenger replaces the Vue plugin AT ITS OWN INDEX. Hoisting it to
  // plugins[0] changes which other plugins see an .vue file first, making the swap
  // a two-variable change.
  assert.match(testSrc, /splice\(vueIndex, 1, challenger\(\)\)/);
  assert.ok(
    !/plugins: \[challenger\(\)/.test(testSrc),
    "the challenger must not be hoisted to the front of the plugin array",
  );
  // Still refuses to run when there is no Vue plugin to replace.
  assert.match(testSrc, /refusing to add a second Vue plugin/);

  const buildSrc = overrideConfigSource({
    baseConfigFile: "vite.config.ts",
    challengerSpec: "@verter/unplugin/vite",
    configEnv: { command: "build", mode: "production" },
  });
  assert.match(buildSrc, /"command":"build"/);
});

test("every override row discloses that the project's vue() options were dropped", () => {
  // The baseline keeps the project's vue({...}) options and the challengers cannot
  // read them back out, so the rows are not doing provably equal work. The
  // inequality is published rather than left in a design document.
  assert.match(SWAP_MECHANISMS.optionsDropped, /NOT EQUAL WORK/);
  assert.match(SWAP_MECHANISMS.optionsDropped, /DROPPED/);
  // And it must not editorialise the difference away.
  for (const pattern of [/same total work/i, /should not matter/i, /negligible/i]) {
    assert.ok(
      !pattern.test(SWAP_MECHANISMS.optionsDropped),
      `disclosure matches ${pattern} — state the inequality, do not dismiss it`,
    );
  }
});

test("a bracketed baseline cannot anchor the typecheck diagnostic census", () => {
  // The baseline failed its own program-construction gate, so its diagnostic count
  // came from a series that did not reliably typecheck the project. Anchoring on it
  // would unrank the checkers that DID complete — the inversion the untimed
  // pre-flight exists to prevent, arriving through the back door.
  const results = [
    {
      id: "vue-tsc-js",
      notes: "baseline",
      status: "ok",
      artifactMedian: 1,
      metaSamples: [{ exit: 1, diagnostics: 1, diagnosticFiles: 1, checked: false }],
    },
    {
      id: "verter-tsc",
      notes: "challenger",
      status: "ok",
      artifactMedian: 58,
      metaSamples: [{ exit: 1, diagnostics: 58, diagnosticFiles: 19, checked: true }],
    },
  ];
  applyTypecheckGates(results);
  assert.equal(results[0].status, "unranked", "the baseline is gated like everything else");
  assert.equal(results[1].status, "ok", "a completing checker is not punished for the baseline's abort");
  assert.match(results[1].notes, /baseline row is itself unranked/);
  assert.ok(
    !/FAILED DIAGNOSTIC-CENSUS GATE/.test(results[1].notes),
    "and it must not be failed against an unusable anchor",
  );
});
