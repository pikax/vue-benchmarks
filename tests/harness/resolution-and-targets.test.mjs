/**
 * Guards for the 2026-07-30 published-wrong-answer batch: the compile surface's
 * fs bridge answering "file" for directories (which silently emptied imported
 * type scopes and printed the baseline's ❌ as "Failed to resolve extends base
 * type"), the nameless-root packageName that rendered element-plus project-test
 * rows with no subject, and the solution-style tsconfig whose `files: []`
 * defeated the no-op guard so vue-tsc ranked process startup as a full check.
 */
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { test } from "node:test";

import { compilerFs, topLevelPropsKeys } from "../../scripts/lib/surfaces/compile.mjs";
import {
  discoverTestTargets,
  discoverTypecheckTargets,
} from "../../scripts/lib/real-world/test-targets.mjs";
import {
  issuerRealDir,
  webpackCensus,
  webpackExternals,
} from "../../scripts/lib/real-world/bundler-drivers.mjs";
import { applyUnreproducibleGate } from "../../scripts/lib/real-world/corpus.mjs";
import { canonicalUri } from "../../scripts/lib/surfaces/project-lsp.mjs";
import { GATE_IS_THE_WARM_PASS, measureVariants } from "../../scripts/lib/timing.mjs";

function scratchDir(prefix) {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
}

test("compilerFs bridge has ts.sys semantics", async (t) => {
  const { dir, cleanup } = scratchDir("rw-fsbridge-");
  t.after(cleanup);
  mkdirSync(join(dir, "use-delayed-toggle"));
  writeFileSync(join(dir, "use-delayed-toggle", "index.ts"), "export interface X { a?: number }\n");

  await t.test("a DIRECTORY is not a file — resolveExt tries the bare path first, and answering true made a directory-module import resolve to the directory, read as empty, and erase every type it exported", () => {
    assert.equal(compilerFs.fileExists(join(dir, "use-delayed-toggle")), false);
  });

  await t.test("a real file still answers true and reads", () => {
    const file = join(dir, "use-delayed-toggle", "index.ts");
    assert.equal(compilerFs.fileExists(file), true);
    assert.match(compilerFs.readFile(file), /interface X/);
  });

  await t.test("a missing path answers false rather than throwing", () => {
    assert.equal(compilerFs.fileExists(join(dir, "nope.ts")), false);
  });
});

test("a nameless ROOT package.json still names its rows", async (t) => {
  const { dir, cleanup } = scratchDir("rw-pkgname-");
  t.after(cleanup);
  // element-plus's shape: root package.json with scripts+vitest but NO name.
  writeFileSync(
    join(dir, "package.json"),
    JSON.stringify({ scripts: { test: "vitest run" }, devDependencies: { vitest: "^1.0.0" } }),
  );
  writeFileSync(join(dir, "vitest.config.ts"), "export default {}\n");

  const targets = discoverTestTargets(dir, { sfcCount: () => 3 });
  assert.equal(targets.length, 1);
  // `pkg.name ?? relative(cloneDir, dir)` is "" at the root — an empty string
  // survives `??` and rendered " — project's own toolchain (baseline)".
  assert.equal(targets[0].packageName, basename(dir));
  assert.notEqual(targets[0].packageName, "");
});

test("GATE_IS_THE_WARM_PASS actually removes the warmup — and numeric 0 still cannot", async (t) => {
  const mkVariant = (calls) => ({
    id: "v",
    label: "v",
    measure: async ({ phase }) => {
      calls.push(phase);
      return 1;
    },
  });

  await t.test("the sentinel yields ZERO warmup passes and says so on the row — the first version was a numeric 0, effectiveWarmups clamped it to 1, and three surfaces published a warmup reduction that never executed", async () => {
    const calls = [];
    const [row] = await measureVariants([mkVariant(calls)], {
      runs: 2,
      warmups: GATE_IS_THE_WARM_PASS,
    });
    assert.deepEqual(calls, ["measure", "measure"]);
    assert.equal(row.warmupPasses, 0);
  });

  await t.test("numeric 0 still clamps to 1 — CLI --warmups 0 must never silently unwarm a table", async () => {
    const calls = [];
    await measureVariants([mkVariant(calls)], { runs: 1, warmups: 0 });
    assert.deepEqual(calls, ["warmup", "measure"]);
  });

  await t.test("the sentinel is not numeric, so no arithmetic can reproduce it by accident", () => {
    assert.equal(typeof GATE_IS_THE_WARM_PASS, "string");
  });
});

test("document URIs compare across every spelling a server echoes", async (t) => {
  await t.test("Volar's percent-encoded lowercase drive matches the harness's plain form — the mismatch discarded every real publication and WAS 'project-lsp never finishes'", () => {
    assert.equal(
      canonicalUri("file:///d%3A/dev/vue-benchmarks/fixtures/real/element-plus/affix.vue"),
      canonicalUri("file:///D:/dev/vue-benchmarks/fixtures/real/element-plus/affix.vue"),
    );
  });

  await t.test("different documents still never match", () => {
    assert.notEqual(canonicalUri("file:///d%3A/a/b.vue"), canonicalUri("file:///d%3A/a/c.vue"));
  });

  await t.test("an undecodable URI fails the comparison instead of throwing out of a diagnostics listener", () => {
    assert.notEqual(canonicalUri("file:///d%ZZ/a.vue"), canonicalUri("file:///d:/a.vue"));
  });
});

test("the props parser feeding the prop-resolution census reads real emission shapes", async (t) => {
  await t.test("a plain props object yields its top-level keys and only those", () => {
    const keys = topLevelPropsKeys(
      "export default { props: { showAfter: { type: Number, default: 0 }, 'hide-after': { type: Number }, placement: {} }, setup() {} }",
    );
    assert.deepEqual(keys, ["showAfter", "hide-after", "placement"]);
  });

  await t.test("a _mergeDefaults call wrapper is looked through — that is how @vue/compiler-sfc emits withDefaults", () => {
    const keys = topLevelPropsKeys(
      "props: /*#__PURE__*/ _mergeDefaults({ role: { type: String }, trigger: {} }, { role: 'tooltip' })",
    );
    assert.deepEqual(keys, ["role", "trigger"]);
  });

  await t.test("braces inside default-value strings and nested objects do not invent keys", () => {
    const keys = topLevelPropsKeys(
      "props: { label: { type: String, default: '}{' }, meta: { type: Object, default: () => ({ deep: { deeper: 1 } }) } }",
    );
    assert.deepEqual(keys, ["label", "meta"]);
  });

  await t.test("no props object is 'cannot measure' (null), never 'zero props' — the census must annotate, not unrank, on shapes it cannot read", () => {
    assert.equal(topLevelPropsKeys("export default { setup() {} }"), null);
  });

  await t.test("_mergeModels unions BOTH argument objects — defineModel props live in the second, and reading only the first made a false unrank out of every defineModel component", () => {
    assert.deepEqual(
      topLevelPropsKeys(
        "props: /*#__PURE__*/_mergeModels({ disabled: { type: Boolean } }, { modelValue: {}, modelModifiers: {} })",
      ),
      ["disabled", "modelValue", "modelModifiers"],
    );
  });

  await t.test("array-form props yield the array's strings, never the NEXT object's keys — `props: ['msg'], emits: {click}` used to return ['click']", () => {
    assert.deepEqual(
      topLevelPropsKeys('props: ["msg", "count"], emits: { click: null }'),
      ["msg", "count"],
    );
  });

  await t.test("quoted keys keep their colons — Vize really emits 'onUpdate:visible' and the baseline really resolves it", () => {
    assert.deepEqual(
      topLevelPropsKeys('props: { "onUpdate:visible": { type: Function }, placement: {} }'),
      ["onUpdate:visible", "placement"],
    );
  });
});

test("the no-lockfile rule is code, not prose", async (t) => {
  const noLockfile = {
    dependenciesReproducible: false,
    unreproducibleReason: "test-project ships no lockfile",
    project: { id: "test-project" },
  };

  await t.test("checkout-executing rows on a lockfile-less corpus are unranked — baselines included — and say why", () => {
    // Rows shaped the way measureVariants ACTUALLY emits them — the first
    // version of this test fed a synthetic `{skip: true}` shape the pipeline
    // never produces, and the gate stamped "UNRANKED" onto skipped and error
    // rows in production while the test stayed green.
    const surface = {
      id: "project-test",
      variants: [
        { id: "baseline", status: "ok", notes: "baseline row" },
        { id: "challenger", status: "unranked", notes: "already bracketed" },
        { id: "absent", status: "skipped", notes: "never ran" },
        { id: "broken", status: "error", notes: "failed on this corpus" },
        { id: "pre-measure", skip: true, notes: "never entered the loop" },
      ],
      methodology: [],
    };
    applyUnreproducibleGate(surface, noLockfile);
    assert.equal(surface.variants[0].status, "unranked");
    assert.match(surface.variants[0].notes, /NO LOCKFILE/);
    // Already-bracketed rows keep their verdict but still carry the reason.
    assert.equal(surface.variants[1].status, "unranked");
    assert.match(surface.variants[1].notes, /NO LOCKFILE/);
    // Rows that never produced a measurement must not claim to be unranked.
    assert.ok(!/NO LOCKFILE/.test(surface.variants[2].notes));
    assert.ok(!/NO LOCKFILE/.test(surface.variants[3].notes));
    assert.ok(!/NO LOCKFILE/.test(surface.variants[4].notes));
    assert.match(surface.methodology.join(" "), /no lockfile/);
  });

  await t.test("corpus-copy surfaces are untouched — their numbers do not execute the checkout", () => {
    const surface = { id: "bundle", variants: [{ status: "ok", notes: "n" }] };
    applyUnreproducibleGate(surface, noLockfile);
    assert.equal(surface.variants[0].status, "ok");
  });

  await t.test("a reproducible corpus is untouched", () => {
    const surface = { id: "project-test", variants: [{ status: "ok", notes: "n" }] };
    applyUnreproducibleGate(surface, { dependenciesReproducible: true });
    assert.equal(surface.variants[0].status, "ok");
  });
});

test("vue-loader's pitcher requests stay internal and leaks are counted", async (t) => {
  const appDir = join(tmpdir(), "rw-bundle-app");

  await t.test("a `-!` inline-loader request is never externalised — it is how vue-loader re-dispatches every ?vue&type= block, and externalising it made both vue-loader cells rank 162 SFCs of require() stubs as the fastest builds in their groups", () => {
    const externals = webpackExternals(appDir);
    let verdict = "not called";
    externals(
      { context: appDir, request: "-!../vue-loader/dist/templateLoader.js??ruleSet!./alert.vue?vue&type=template&id=1" },
      (err, external) => {
        verdict = external ?? "internal";
      },
    );
    assert.equal(verdict, "internal");
  });

  await t.test("an externalised SFC sub-request is a counted leak, not a compiled component", () => {
    const census = webpackCensus(appDir, {
      compilation: {
        modules: [
          // The facade NormalModule — names the SFC, proves nothing about blocks.
          { resource: join(appDir, "alert.vue") },
          // The leak: the template block as an ExternalModule stub.
          {
            externalType: "commonjs",
            request: "-!../vue-loader/dist/templateLoader.js!./alert.vue?vue&type=template&id=1",
          },
        ],
      },
    });
    assert.equal(census.vueModules, 1);
    assert.equal(census.externalizedVueRequests, 1);
  });

  await t.test("a healthy cell reports zero leaks and externalised bare specifiers do not count", () => {
    const census = webpackCensus(appDir, {
      compilation: {
        modules: [
          { resource: join(appDir, "alert.vue") },
          { resource: `${join(appDir, "alert.vue")}?vue&type=template&id=1` },
          { externalType: "commonjs", request: "vue" },
        ],
      },
    });
    assert.equal(census.vueModules, 1);
    assert.equal(census.externalizedVueRequests, 0);
  });
});

test("virtual-module issuers recover their real directory", async (t) => {
  const { dir: appDir, cleanup } = scratchDir("rw-virtual-");
  t.after(cleanup);
  mkdirSync(join(appDir, "src", "date-table"), { recursive: true });
  writeFileSync(join(appDir, "src", "date-table", "basic-date-table.vue"), "<template><i /></template>\n");
  const embedded = join(appDir, "src", "date-table", "date-table.vue");
  const issuer = `${join(appDir, `_virtual_${encodeURIComponent(embedded)}%3Fvue%26type%3Dscript%26lang.ts`)}`;

  await t.test("the embedded path decodes to the original directory", () => {
    assert.equal(
      String(issuerRealDir(appDir, issuer)).split("\\").join("/"),
      join(appDir, "src", "date-table").split("\\").join("/"),
    );
  });

  await t.test("a real-path issuer recovers nothing and changes nothing", () => {
    assert.equal(issuerRealDir(appDir, embedded), null);
  });

  await t.test("a sibling-SFC import from a virtual issuer is externalised, not left to fail from the corpus root — 'Can't resolve ./basic-date-table.vue in <corpus root>' was published as an integration ❌ on three projects", async () => {
    const externals = webpackExternals(appDir);
    const verdict = await new Promise((resolve) =>
      externals(
        { context: appDir, request: "./basic-date-table.vue", contextInfo: { issuer } },
        (_e, result) => resolve(result ?? "internal"),
      ),
    );
    assert.equal(verdict, "commonjs ./basic-date-table.vue");
  });

  await t.test("the same import from a REAL issuer context stays internal", async () => {
    const externals = webpackExternals(appDir);
    const verdict = await new Promise((resolve) =>
      externals(
        {
          context: join(appDir, "src", "date-table"),
          request: "./basic-date-table.vue",
          contextInfo: { issuer: embedded },
        },
        (_e, result) => resolve(result ?? "internal"),
      ),
    );
    assert.equal(verdict, "internal");
  });
});

test("solution-style tsconfig roots are followed, never targeted", async (t) => {
  const { dir, cleanup } = scratchDir("rw-solution-");
  t.after(cleanup);
  // element-plus's exact shape: `files: []` is an empty ARRAY — truthy, so the
  // old `!raw.files` guard accepted the root, and `-p` at it checks NOTHING.
  writeFileSync(
    join(dir, "tsconfig.json"),
    JSON.stringify({
      files: [],
      references: [{ path: "./tsconfig.web.json" }, { path: "./tsconfig.node.json" }],
    }),
  );
  // The web config names real sources — including a comment and a glob whose
  // text contains block-comment delimiters, which the old regex stripper ate.
  writeFileSync(
    join(dir, "tsconfig.web.json"),
    '{\n  // the real program\n  "include": ["packages", "packages/**/*.vue"],\n}\n',
  );
  // The node config's includes are pinned to non-.vue files; it must count 0
  // and never outrank the config that actually checks the Vue program.
  writeFileSync(
    join(dir, "tsconfig.node.json"),
    JSON.stringify({ include: ["scripts/**/*.ts", "**/vite.config.*"] }),
  );
  mkdirSync(join(dir, "packages"));
  mkdirSync(join(dir, "scripts"));
  writeFileSync(join(dir, "packages", "a.vue"), "<template><div /></template>\n");

  const sfcCount = (d) => (basename(d) === "packages" ? 7 : 0);
  const targets = discoverTypecheckTargets(dir, { sfcCount });

  await t.test("the empty-files solution root is not a -p target", () => {
    assert.ok(!targets.some((x) => x.tsconfig === "tsconfig.json" && x.relDir === "."));
  });

  await t.test("the referenced config that names the sources is the target, comments and in-string glob delimiters notwithstanding", () => {
    assert.equal(targets[0]?.tsconfig, "tsconfig.web.json");
    assert.equal(targets[0]?.sfcs, 7);
  });

  await t.test("a referenced config pinned to non-vue files never outranks it", () => {
    assert.ok(!targets.some((x) => x.tsconfig === "tsconfig.node.json"));
  });
});
