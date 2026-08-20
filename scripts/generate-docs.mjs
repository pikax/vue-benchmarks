#!/usr/bin/env node
/**
 * Generate every published page from the committed JSON snapshots.
 *
 *   results/benchmarks/*.json ─┬─→ docs/compiler.md · docs/typecheck.md
 *                              │    docs/format.md · docs/lint.md
 *                              │    docs/component-meta.md · docs/lsp.md
 *                              │    docs/memory.md (plant matrices embed in the group pages)
 *   results/real_world/*.json ─┴─→ docs/real-world.md · docs/real-world/<project>.md
 *                                  README.md (compact landing blocks)
 *
 * All charts go to docs/charts/ through the ONE shared renderer
 * (scripts/lib/chart-svg.mjs). A missing input leaves its outputs untouched —
 * absence means "this run has nothing to say", never "erase what is published".
 */

import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { GROUPS, attachMemoryToBench, confirmForGroup, loadPublished } from "./lib/docs/data.mjs";
import {
  escapeLooseHtml,
  GENERATED_NOTE,
  renderGroupDoc,
  renderRealWorldIndex,
  renderRealWorldProjectDoc,
} from "./lib/docs/render.mjs";
import { updateReadme } from "./lib/docs/readme.mjs";
import { renderMemoryMarkdown } from "./lib/memory-report.mjs";
import { formatTypecheckDoc } from "../tests/confirm/lib/typecheck-doc.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  // One raw unclosed <script>/<template> in a tool note swallows the rest of
  // an HTML-aware markdown page — escape at the door, on every page.
  writeFileSync(path, escapeLooseHtml(content));
  console.log(`[docs] wrote ${path.slice(rootDir.length + 1).replace(/\\/g, "/")}`);
}

export function generateDocs({ root = rootDir, includeLocal = false } = {}) {
  const model = loadPublished(root, process.env, { includeLocal });
  const chartsDir = join(root, "docs", "charts");

  let attached = 0;
  for (const source of [...model.benches, ...model.extras, model.repeated].filter(Boolean)) {
    attached += attachMemoryToBench(source.data, model.memories);
  }
  if (attached) console.log(`[docs] memory probe attached to ${attached} bench rows`);

  // The full typecheck plant matrix embeds into docs/typecheck.md, built
  // from the newest confirm source that carries typecheck rows.
  const typecheckGroup = GROUPS.find((g) => g.id === "typecheck");
  const { rows: tcRows, sources: tcSources } = confirmForGroup(model, typecheckGroup);
  const tcSource = tcSources.find((s) =>
    s.data.results.some((r) => r.suite.startsWith("typecheck")),
  );
  const typecheckPlants =
    tcRows.length && tcSource
      ? formatTypecheckDoc({
          results: tcRows,
          generatedAt: tcSource.data.generatedAt,
          runner: tcSource.data.runner,
          embedded: true,
        })
      : "";

  if (model.bench?.data) {
    for (const group of GROUPS) {
      write(
        join(root, group.doc),
        renderGroupDoc(group, model, { chartsDir, chartsHref: "charts", typecheckPlants }),
      );
    }
  } else {
    console.log("[docs] no publishable bench JSON — group pages LEFT UNTOUCHED");
  }

  if (model.memory?.data) {
    const body = renderMemoryMarkdown(model.memory.data).replace(
      /^# .+$/m,
      "# Memory (resource probe)",
    );
    write(
      join(root, "docs", "memory.md"),
      `${body.split("\n")[0]}\n\n${GENERATED_NOTE}\n> Source: \`results/benchmarks/${model.memory.name}\`. Timing tables on the group pages carry this probe's Peak RSS as a column.\n${body.split("\n").slice(1).join("\n")}`,
    );
  } else {
    console.log("[docs] no memory JSON — docs/memory.md LEFT UNTOUCHED");
  }

  if (model.realWorld.length) {
    write(
      join(root, "docs", "real-world.md"),
      renderRealWorldIndex(model.realWorld, { chartsDir, chartsHref: "charts" }),
    );
    for (const entry of model.realWorld) {
      write(
        join(root, "docs", "real-world", `${entry.project}.md`),
        renderRealWorldProjectDoc(entry, { chartsDir, chartsHref: "../charts" }),
      );
    }
  } else {
    console.log("[docs] no real-world JSON — docs/real-world* LEFT UNTOUCHED");
  }

  const readmePath = join(root, "README.md");
  if (existsSync(readmePath)) {
    const before = readFileSync(readmePath, "utf8");
    const after = updateReadme(before, model, { chartsDir });
    if (after !== before) {
      writeFileSync(readmePath, after);
      console.log("[docs] updated README.md");
    } else {
      console.log("[docs] README.md unchanged");
    }
  }

  // Prune SVGs no page references any more — but only on a complete run.
  // A partial run (one input missing) must not erase the absent input's charts.
  const complete =
    model.bench?.data && model.ide?.data && model.memory?.data && model.confirm?.data &&
    model.realWorld.length > 0;
  if (complete && existsSync(chartsDir)) {
    const referenced = new Set();
    const collect = (file) => {
      if (!existsSync(file)) return;
      // Charts are embedded as <picture> src/srcset pairs; keep recognizing
      // plain markdown image links too.
      const re = /(?:src|srcset)="(?:docs\/|\.\.\/)?charts\/([\w.-]+\.svg)"|\((?:docs\/|\.\.\/)?charts\/([\w.-]+\.svg)\)/g;
      for (const m of readFileSync(file, "utf8").matchAll(re)) {
        referenced.add(m[1] ?? m[2]);
      }
    };
    collect(readmePath);
    const docsDir = join(root, "docs");
    for (const name of readdirSync(docsDir)) {
      if (name.endsWith(".md")) collect(join(docsDir, name));
    }
    const rwDir = join(docsDir, "real-world");
    if (existsSync(rwDir)) {
      for (const name of readdirSync(rwDir)) {
        if (name.endsWith(".md")) collect(join(rwDir, name));
      }
    }
    let pruned = 0;
    for (const name of readdirSync(chartsDir)) {
      if (!name.endsWith(".svg") || referenced.has(name)) continue;
      rmSync(join(chartsDir, name));
      pruned++;
    }
    if (pruned) console.log(`[docs] pruned ${pruned} unreferenced chart(s)`);
  }

  return model;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    // --include-local: also read local runs from results/ root (win32, dirty
    // worktrees included); they render with an explicit local-run banner.
    generateDocs({ includeLocal: process.argv.includes("--include-local") });
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
