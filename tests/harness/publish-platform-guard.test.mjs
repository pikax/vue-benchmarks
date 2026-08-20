/**
 * The publish path must not contradict the document it publishes into.
 *
 * README says twice that published numbers are Linux only, and that local runs
 * on other platforms are for comparison on your own box rather than against
 * published figures. Nothing enforced it. Running `pnpm update-readme` on a
 * developer machine spliced `#### Windows · bench` sections straight in — 218
 * lines of them, measured on hardware nobody else has, under a heading that
 * says the opposite two screens further down.
 *
 * It was never silent: the tables carry a platform heading. But "labelled" and
 * "correct" are different things, and the numbers most likely to be published
 * by accident are exactly the ones taken on an unreproducible machine.
 *
 * The guard is a filter, not a wall — PUBLISH_ANY_PLATFORM=1 allows it and
 * says so on stdout, because it exists to stop an accident rather than someone
 * who means it.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  collapseAllFailedTables,
  condenseExclusionBlocks,
  ENGINE_MERGE_NOTE,
  escapeLooseHtml,
  extractToolLegends,
  filterPublishable,
  filterReproducibleBenchmarkArtifacts,
  hoistRepeatedLines,
  mergeEngineTables,
  stripParagraphs,
} from "../../scripts/update-readme.mjs";
import { IDE_RANKING_RULES, RANKING_RULES } from "../../scripts/lib/report.mjs";

const LINUX_CI = "results/bench-Linux-200-bench.md";
const LINUX_LOCAL = "results/bench-linux-50-bench.md";
const UBUNTU = "results/bench-ubuntu-latest-200-bench.md";
const WINDOWS = "results/bench-win32-50.md";
const MACOS = "results/bench-darwin-50-bench.md";

describe("publish platform guard", () => {
  test("Linux artifacts publish — CI must keep working", () => {
    // The whole point of benchmark.yml. If this ever fails, the guard has
    // broken the only path that is supposed to produce published numbers.
    const { publish, rejected } = filterPublishable([
      LINUX_CI,
      LINUX_LOCAL,
      UBUNTU,
    ]);
    assert.deepEqual(publish, [LINUX_CI, LINUX_LOCAL, UBUNTU]);
    assert.deepEqual(rejected, []);
  });

  test("Windows and macOS artifacts are refused", () => {
    const { publish, rejected } = filterPublishable([WINDOWS, MACOS]);
    assert.deepEqual(publish, []);
    assert.deepEqual(
      rejected.map((r) => r.platform),
      ["Windows", "macOS"],
    );
  });

  test("a mixed results directory publishes only the Linux half", () => {
    // The real local situation: CI artifacts downloaded next to local runs.
    // Publishing the whole directory is how the two get mixed in one table.
    const { publish, rejected } = filterPublishable([WINDOWS, LINUX_CI, MACOS]);
    assert.deepEqual(publish, [LINUX_CI]);
    assert.equal(rejected.length, 2);
  });

  test("the rejection names the file, so the skip is not mysterious", () => {
    const { rejected } = filterPublishable([WINDOWS]);
    assert.equal(rejected[0].file, "bench-win32-50.md");
    assert.doesNotMatch(
      rejected[0].file,
      /[/\\]/,
      "should be the leaf, not a full path",
    );
  });

  test("PUBLISH_ANY_PLATFORM=1 publishes everything", () => {
    // Passing `null` is what publishablePlatforms() returns under the override.
    const { publish, rejected } = filterPublishable(
      [WINDOWS, LINUX_CI, MACOS],
      null,
    );
    assert.deepEqual(publish, [WINDOWS, LINUX_CI, MACOS]);
    assert.deepEqual(rejected, []);
  });

  test("an empty input is not an error", () => {
    const { publish, rejected } = filterPublishable([]);
    assert.deepEqual(publish, []);
    assert.deepEqual(rejected, []);
  });
});

test("dirty-worktree benchmark reports cannot enter the publication set", () => {
  const dir = mkdtempSync(join(tmpdir(), "vue-bench-publish-"));
  try {
    const clean = join(dir, "clean.md");
    const dirty = join(dir, "dirty.md");
    writeFileSync(clean, "- **Benchmark commit:** `abc` · clean worktree\n");
    writeFileSync(
      dirty,
      "- **Benchmark commit:** `abc` · **DIRTY WORKTREE** — not attributable\n",
    );
    assert.deepEqual(filterReproducibleBenchmarkArtifacts([clean, dirty]), {
      publish: [clean],
      rejected: [dirty],
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

/**
 * Each artifact states the ranking rules so it reads standalone, but a README
 * section splices several artifacts together. Stated once per document becomes
 * stated four times per README unless the splice drops the copies.
 */
describe("a rule spliced into one section is stated once", () => {
  const doc = [
    "## IDE operation results",
    "",
    "- **Runs / warmups:** 3 / 1",
    "",
    RANKING_RULES,
    "",
    IDE_RANKING_RULES,
    "",
    "### IDE · hover",
    "",
    "| Tool | Median |",
  ].join("\n");

  test("a document's own copies are dropped, with the blank line each left", () => {
    const stripped = stripParagraphs(doc, [RANKING_RULES, IDE_RANKING_RULES]);

    assert.ok(!stripped.includes(RANKING_RULES));
    assert.ok(!stripped.includes(IDE_RANKING_RULES));
    assert.equal(
      stripped,
      [
        "## IDE operation results",
        "",
        "- **Runs / warmups:** 3 / 1",
        "",
        "### IDE · hover",
        "",
        "| Tool | Median |",
      ].join("\n"),
    );
  });

  test("everything else survives verbatim", () => {
    const stripped = stripParagraphs(doc, [RANKING_RULES, IDE_RANKING_RULES]);
    assert.ok(stripped.includes("- **Runs / warmups:** 3 / 1"));
    assert.ok(stripped.includes("| Tool | Median |"));
  });

  test("a document that never stated them is unchanged", () => {
    const plain = "## IDE operation results\n\n| Tool | Median |";
    assert.equal(
      stripParagraphs(plain, [RANKING_RULES, IDE_RANKING_RULES]),
      plain,
    );
  });
});

/**
 * The published README stopped rendering entirely — VS Code preview and GitHub
 * both — because tool notes mention `<script>`/`<template>` without backticks
 * and one raw unclosed tag swallows the rest of an HTML-aware page. The tables
 * were all present in the bytes and all invisible in the browser.
 */
describe("escapeLooseHtml", () => {
  test("raw unclosed tags are escaped", () => {
    const out = escapeLooseHtml(
      "formats the <script> block only, never <template>",
    );
    assert.equal(
      out,
      "formats the &lt;script> block only, never &lt;template>",
    );
  });

  test("tags inside inline code spans and fences survive verbatim", () => {
    assert.equal(
      escapeLooseHtml("formats the `<script>` block"),
      "formats the `<script>` block",
    );
    const fenced = "```vue\n<template><div/></template>\n```";
    assert.equal(escapeLooseHtml(fenced), fenced);
  });

  test("HTML comments and allowlisted tags survive", () => {
    assert.equal(
      escapeLooseHtml("<!-- source: x.md -->"),
      "<!-- source: x.md -->",
    );
    const details =
      "<details><summary>Notes</summary>a <MyComp> here</details>";
    assert.equal(
      escapeLooseHtml(details, ["details", "summary"]),
      "<details><summary>Notes</summary>a &lt;MyComp> here</details>",
    );
  });

  test("idempotent — escaping twice changes nothing more", () => {
    const once = escapeLooseHtml("thread '<unnamed>' panicked");
    assert.equal(escapeLooseHtml(once), once);
  });
});

/**
 * Tool names are unique, so the per-surface legends (~55 identical copies
 * across the README) live once per section in its how-to-read file; the
 * tables reference tools by name.
 */
describe("extractToolLegends", () => {
  const body = [
    "### Typecheck",
    "",
    "Tools:",
    "",
    "- **vue-tsc (JS)** — the official CLI.",
    "- **Vize** — vize check.",
    "",
    "| Tool | Median |",
  ].join("\n");

  test("legend bullets move out, the table stays", () => {
    const { body: out, tools } = extractToolLegends(body);
    assert.deepEqual(tools, [
      "- **vue-tsc (JS)** — the official CLI.",
      "- **Vize** — vize check.",
    ]);
    assert.ok(!out.includes("Tools:"));
    assert.ok(out.includes("| Tool | Median |"));
    assert.ok(out.includes("### Typecheck"));
  });

  test("a bare Tools: line with no bullets is left alone", () => {
    const odd = "Tools:\n\nNo list here.";
    const { body: out, tools } = extractToolLegends(odd);
    assert.equal(out, odd);
    assert.deepEqual(tools, []);
  });
});

/**
 * A grid of "skipped – – –" rows says only that nothing happened; the summary
 * states the WHY instead, quoted from the table's own Notes. Full reports keep
 * the table. A table with even one measured row is untouchable.
 */
describe("collapseAllFailedTables", () => {
  const HEADER = "| Tool | **Median (primary)** | vs fastest |";
  const SEP = "| --- | ---: | ---: |";
  const table = (rows) => [HEADER, SEP, ...rows].join("\n");

  test("all-skipped with a uniform reason becomes one sentence", () => {
    const doc = [
      table(["| A × x ⏭ | skipped | – |", "| A × y ⏭ | skipped | – |"]),
      "",
      "<details><summary>Notes</summary>",
      "",
      "- **A × x ⏭**: ⏭ NOT MEASURED — no dev server exists here. Not a statement about x.",
      "- **A × y ⏭**: ⏭ NOT MEASURED — no dev server exists here. Not a statement about y.",
      "",
      "</details>",
    ].join("\n");
    const { collapsed, removed } = collapseAllFailedTables(
      doc,
      "docs/results/r.md",
    );
    assert.equal(removed, 1);
    assert.ok(!collapsed.includes(HEADER));
    assert.ok(collapsed.includes("All 2 cells in this group were skipped"));
    assert.ok(collapsed.includes("no dev server exists here."));
    assert.ok(collapsed.includes("[full report](docs/results/r.md)"));
  });

  test("differing reasons are listed per row", () => {
    const doc = [
      table(["| A ❌ | error | – |", "| B ❌ | error | – |"]),
      "",
      "<details><summary>Notes</summary>",
      "",
      "- **A ❌**: Build failed with 5 errors.",
      "- **B ❌**: Config could not be loaded.",
      "",
      "</details>",
    ].join("\n");
    const { collapsed } = collapseAllFailedTables(doc, "r.md");
    assert.ok(collapsed.includes("All 2 cells in this group failed"));
    assert.ok(collapsed.includes("- **A ❌**: Build failed with 5 errors."));
    assert.ok(collapsed.includes("- **B ❌**: Config could not be loaded."));
  });

  test("one measured row — even ⚠ unranked — keeps the whole table", () => {
    for (const live of [
      "| C | **9.1 ms** | 1.00x |",
      "| C ⚠ | (9.1 ms) | not ranked |",
    ]) {
      const doc = table(["| A ❌ | error | – |", live]);
      const { collapsed, removed } = collapseAllFailedTables(doc, "r.md");
      assert.equal(removed, 0);
      assert.equal(collapsed, doc);
    }
  });

  test("missing Notes falls back honestly instead of inventing a reason", () => {
    const doc = table(["| A ⏭ | skipped | – |"]);
    const { collapsed } = collapseAllFailedTables(doc, "r.md");
    assert.ok(collapsed.includes("The only cell in this group was skipped"));
    assert.ok(collapsed.includes("reason not stated in the summary"));
  });

  test("project typecheck/test all-error tables stay as tables", () => {
    const doc = [
      "## Project test suite — nuxt-ui:runtime",
      "",
      table([
        "| @nuxt/ui — baseline ❌ | error | – |",
        "| @nuxt/ui — unplugin-vue ❌ | error | – |",
      ]),
    ].join("\n");
    const { collapsed, removed } = collapseAllFailedTables(doc, "r.md");
    assert.equal(removed, 0);
    assert.ok(collapsed.includes(HEADER));
    assert.ok(collapsed.includes("error"));
  });
});

/**
 * The maintainer's ruling: JS-engine and native-tsgo rows always share a
 * table. "vs fastest" is recomputed against the merged fastest; rows without
 * a parseable median sink below the measured ones; deeper "ranked alone"
 * classes in the same surface (project-typecheck's third table) are absorbed.
 */
describe("mergeEngineTables", () => {
  const SEP = "| --- | ---: | ---: |";
  const doc = [
    "#### JavaScript TypeScript engine — ranked alone",
    "",
    "| Tool | **Median (primary)** | vs fastest |",
    SEP,
    "| vue-tsc (JS) | **2.00 s** | 1.00x |",
    "",
    "#### Native tsgo engines — ranked together",
    "",
    "| Tool | **Median (primary)** | vs fastest |",
    SEP,
    "| vue-tsc (N) ⏭ | skipped | – |",
    "",
    "##### PROJECT-TYPECHECK — ranked alone",
    "",
    "| Tool | **Median (primary)** | vs fastest |",
    SEP,
    "| verter-tsc | **500.0 ms** | 1.00x |",
    "",
    "## Next surface",
  ].join("\n");

  test("pair plus deeper class merge; ratios recomputed; dead rows sink", () => {
    const out = mergeEngineTables(doc);
    assert.ok(!out.includes("ranked alone"), "engine headings gone");
    assert.ok(!out.includes("ranked together"));
    const rows = out.split("\n").filter((l) => l.startsWith("| v"));
    assert.deepEqual(rows, [
      "| verter-tsc | **500.0 ms** | 1.00x |",
      "| vue-tsc (JS) | **2.00 s** | 4.00x |",
      "| vue-tsc (N) ⏭ | skipped | – |",
    ]);
    assert.ok(out.includes(ENGINE_MERGE_NOTE));
    assert.ok(out.includes("## Next surface"));
  });

  test("an LSP-style prefixed pair keeps the operation as the heading", () => {
    const lsp = [
      "#### hover on `props` — JavaScript TypeScript engine, ranked alone",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      SEP,
      "| Volar (JS) | **3.0 ms** | 1.00x |",
      "",
      "#### hover on `props` — native tsgo engines, ranked together",
      "",
      "| Tool | **Median (primary)** | vs fastest |",
      SEP,
      "| Verter | **5.3 ms** | 1.00x |",
    ].join("\n");
    const out = mergeEngineTables(lsp);
    assert.ok(out.includes("#### hover on `props`\n"));
    assert.ok(out.includes("| Volar (JS) | **3.0 ms** | 1.00x |"));
    assert.ok(out.includes("| Verter | **5.3 ms** | 1.77x |"));
  });

  test("a column-count mismatch refuses to merge", () => {
    const bad = doc.replace(
      "| Tool | **Median (primary)** | vs fastest |\n| --- | ---: | ---: |\n| vue-tsc (N)",
      "| Tool | Median |\n| --- | ---: |\n| vue-tsc (N)",
    );
    const out = mergeEngineTables(bad);
    assert.ok(out.includes("JavaScript TypeScript engine — ranked alone"));
  });

  test("a document with no engine pair is unchanged", () => {
    const plain =
      "#### VITE8 — ranked alone\n\n| Tool | **Median (primary)** | vs fastest |\n" +
      SEP +
      "\n| a | **1.0 ms** | 1.00x |";
    assert.equal(mergeEngineTables(plain), plain);
  });
});

/**
 * The exclusion block must stay above the tables (a tool that produced no
 * measurement is disclosed, not hidden) — but its boilerplate paragraphs are
 * identical in every affected project block. The summary keeps the fact,
 * links the reasoning.
 */
describe("condenseExclusionBlocks", () => {
  const doc = [
    "> **Did not run — excluded from every table below.**",
    ">",
    "> These tools produced no measurement on this corpus, so they have no row: a ranking table is for things that were ranked.",
    ">",
    "> - **fervid** (`@fervid/napi`) — aborted: SIGABRT while compiling /home/runner/work/vue-benchmarks/vue-benchmarks/fixtures/real/x/a.vue — panicked at crates/x.rs:1:1:",
    ">   fervid is a Rust compiler behind NAPI and signals unimplemented constructs with a panic.",
    "",
    "### Next heading",
  ].join("\n");

  test("keeps header and crash line, drops boilerplate, links the rest", () => {
    const out = condenseExclusionBlocks(doc, "docs/results/r.md");
    assert.ok(
      out.includes("> **Did not run — excluded from every table below.**"),
    );
    assert.ok(
      out.includes("SIGABRT while compiling fixtures/real/x/a.vue"),
      "runner prefix stripped",
    );
    assert.ok(!out.includes("Rust compiler behind NAPI"));
    assert.ok(!out.includes("they have no row"));
    assert.ok(out.includes("[full report](docs/results/r.md)"));
    assert.ok(out.includes("### Next heading"));
  });

  test("a document without the block is unchanged", () => {
    assert.equal(condenseExclusionBlocks("plain\ntext", "r.md"), "plain\ntext");
  });
});

describe("hoistRepeatedLines family guard", () => {
  test("a parameterized label with siblings is never hoisted", () => {
    // "Target: vdom · production" appears in both artifacts (meets the
    // threshold) but has a sibling variant — hoisting it would strip a group
    // label from above its table and present one variant as global truth.
    const label =
      "Target: `vdom` · Environment: `production` · Source map: `off`";
    const sibling =
      "Target: `vapor` · Environment: `production` · Source map: `off`";
    const note =
      "Primary ranking metric is the median of measured runs, always warmed first.";
    const a = [note, label, sibling].join("\n");
    const b = [note, label].join("\n");
    const { contents, hoisted } = hoistRepeatedLines([a, b]);
    assert.deepEqual(hoisted, [note]);
    assert.ok(contents[0].includes(label) && contents[0].includes(sibling));
    assert.ok(contents[1].includes(label));
  });
});
