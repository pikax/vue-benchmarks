/**
 * Load the published JSON results that docs generation renders from.
 *
 * The committed snapshots are the ONLY inputs:
 *   results/benchmarks/*.json — bench, ide, ide-scale, memory, confirm
 *   results/real_world/*.json — one file per project
 *
 * Markdown artifacts are never read: every published page (README summary,
 * docs/<group>.md, docs/real-world*) is generated from the same JSON, so the
 * numbers cannot drift between views.
 */

import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

/**
 * The main groups. LSP and IDE operations are ONE group: the IDE suites talk
 * to the same language servers over the same protocol, so they publish as the
 * operation-level view of the LSP surface.
 */
export const GROUPS = [
  {
    id: "compiler",
    title: "Compiler",
    doc: "docs/compiler.md",
    benchSurfaces: ["compile", "jsx-compile"],
    memorySurfaces: ["compile", "jsx-compile"],
    confirmSuites: ["compile", "jsx-compile"],
  },
  {
    id: "typecheck",
    title: "Typecheck",
    doc: "docs/typecheck.md",
    benchSurfaces: ["typecheck"],
    memorySurfaces: ["typecheck"],
    confirmSuites: ["typecheck", "typecheck-all"],
  },
  {
    id: "format",
    title: "Format",
    doc: "docs/format.md",
    benchSurfaces: ["format"],
    memorySurfaces: ["format"],
    confirmSuites: ["format"],
  },
  {
    id: "lint",
    title: "Lint",
    doc: "docs/lint.md",
    benchSurfaces: ["lint"],
    memorySurfaces: ["lint"],
    confirmSuites: ["lint"],
  },
  {
    id: "component-meta",
    title: "Component-meta",
    doc: "docs/component-meta.md",
    benchSurfaces: ["component-meta"],
    memorySurfaces: ["component-meta"],
    confirmSuites: ["component-meta"],
  },
  {
    id: "lsp",
    title: "LSP and IDE operations",
    doc: "docs/lsp.md",
    benchSurfaces: ["lsp"],
    memorySurfaces: ["lsp"],
    confirmSuites: ["lsp"],
    includesIde: true,
  },
];

export function groupById(id) {
  return GROUPS.find((g) => g.id === id) ?? null;
}

/**
 * README publishes Linux CI numbers only; local runs on other platforms are
 * for the developer's own box. PUBLISH_ANY_PLATFORM=1 overrides deliberately.
 */
export function publishablePlatform(platform, env = process.env) {
  if (env.PUBLISH_ANY_PLATFORM === "1") return true;
  const p = String(platform ?? "").toLowerCase();
  return p.includes("linux") || p === "ubuntu";
}

function isLinuxName(name) {
  return /linux|ubuntu/i.test(name);
}

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    console.warn(`[docs] unreadable JSON skipped: ${path} (${err?.message ?? err})`);
    return null;
  }
}

function listJson(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .map((n) => ({ name: n, path: join(dir, n) }));
}

/** A dirty-worktree bench result is never publishable as reproducible. */
function benchIsPublishable(data, name, env = process.env) {
  if (!data) return false;
  if (!publishablePlatform(data.runner?.platform ?? name, env)) return false;
  if (data.commit?.dirty === true && env.PUBLISH_ANY_PLATFORM !== "1") return false;
  return true;
}

/** True when a source is a local/non-reproducible run that needs a banner. */
function isLocalRun(data, fromRoot, name = "") {
  // Artifacts that predate the runner envelope carry the platform only in
  // their file name (ide-scale-Linux.json).
  const platform = String(data?.runner?.platform ?? name).toLowerCase();
  return (
    fromRoot ||
    !(platform.includes("linux") || platform.includes("ubuntu")) ||
    data?.commit?.dirty === true
  );
}

/**
 * Discover the published inputs. Every slot is null (or []) when absent —
 * renderers must treat absence as "leave the existing page alone", never as
 * "erase what is published".
 *
 * `includeLocal` additionally scans the results/ ROOT (where local runs land)
 * for the known artifact families. Local, non-Linux and dirty-worktree
 * sources are admitted there but marked `local: true`, and every page that
 * renders them carries a disclosure banner — the same rule the README used
 * for the local Windows Compiler block. The committed snapshot dirs stay
 * guarded by platform + clean-worktree unless PUBLISH_ANY_PLATFORM=1.
 */
export function loadPublished(root, env = process.env, { includeLocal = false } = {}) {
  const benchDir = join(root, "results", "benchmarks");
  const realDir = join(root, "results", "real_world");
  const rootDirFiles = includeLocal ? listJson(join(root, "results")) : [];

  /** All publishable bench snapshots, largest corpus first. */
  const benches = [];
  /** Supplementary bench-schema studies keyed to a group by their surfaces. */
  const extras = [];
  /** Every memory probe seen (snapshot + compiler-memory + local). */
  const memories = [];
  let repeated = null;
  let ide = null;
  let ideScale = null;
  const confirms = [];
  let compileSingle = null;

  const seenNames = new Set();
  const consider = (entry, fromRoot) => {
    const { name, path } = entry;
    if (seenNames.has(name)) return; // snapshot wins over a root duplicate
    // Smoke tests and one-off probes are debugging scratch, not benchmarks.
    if (fromRoot && /smoke|probe|demo|scratch|tmp/i.test(name)) return;
    if (/^bench-/i.test(name)) {
      const data = readJson(path);
      if (!data) return;
      if (!fromRoot && !benchIsPublishable(data, name, env)) return;
      seenNames.add(name);
      if (/repeated|cache-demo/i.test(name)) {
        if (!repeated) repeated = { name, data, local: isLocalRun(data, fromRoot, name) };
      } else {
        benches.push({ name, data, local: isLocalRun(data, fromRoot, name) });
      }
    } else if (/^compiler-memory-/i.test(name)) {
      const data = readJson(path);
      if (!data) return;
      seenNames.add(name);
      memories.push({ name, data, local: isLocalRun(data, fromRoot, name) });
    } else if (/^compiler-/i.test(name) || /^engine-decomp/i.test(name)) {
      const data = readJson(path);
      if (!data?.surfaces) return;
      seenNames.add(name);
      extras.push({ name, data, local: isLocalRun(data, fromRoot, name) });
    } else if (/^compile-single-/i.test(name)) {
      const data = readJson(path);
      if (!data) return;
      seenNames.add(name);
      if (!compileSingle) compileSingle = { name, data, local: isLocalRun(data, fromRoot, name) };
    } else if (/^ide-scale-/i.test(name)) {
      const data = readJson(path);
      if (!data) return;
      if (!fromRoot && !publishablePlatform(data.runner?.platform ?? name, env)) return;
      seenNames.add(name);
      ideScale = { name, data, local: isLocalRun(data, fromRoot, name) };
    } else if (/^ide-/i.test(name)) {
      const data = readJson(path);
      if (!data) return;
      if (!fromRoot && !publishablePlatform(data.runner?.platform ?? name, env)) return;
      seenNames.add(name);
      ide = { name, data, local: isLocalRun(data, fromRoot, name) };
    } else if (/^memory-/i.test(name)) {
      const data = readJson(path);
      if (!data) return;
      if (!fromRoot && !publishablePlatform(data.runner?.platform ?? name, env)) return;
      seenNames.add(name);
      memories.push({ name, data, local: isLocalRun(data, fromRoot, name) });
    } else if (/^confirm/i.test(name)) {
      // Confirm files merge per suite (a local run may carry suites the
      // published one lacks), so BOTH the snapshot and a root copy load —
      // key by path, not by the shared "confirm.json" leaf name.
      const data = readJson(path);
      if (!data) return;
      if (!fromRoot && !publishablePlatform(data.runner?.platform ?? name, env)) return;
      confirms.push({ name, data, local: isLocalRun(data, fromRoot, name) });
    }
  };

  for (const entry of listJson(benchDir)) consider(entry, false);
  for (const entry of rootDirFiles) consider(entry, true);

  // Primary bench: the largest published corpus, newest on a tie. Everything
  // else stays in `benches` and renders as a corpus-scaling section.
  benches.sort((a, b) => {
    const fa = Number(a.data.fileCount) || 0;
    const fb = Number(b.data.fileCount) || 0;
    if (a.local !== b.local) return a.local ? 1 : -1;
    if (fa !== fb) return fb - fa;
    return String(b.data.generatedAt ?? "").localeCompare(String(a.data.generatedAt ?? ""));
  });
  // Newest study first so a `-current` artifact leads its group page.
  extras.sort((a, b) =>
    String(b.data.generatedAt ?? "").localeCompare(String(a.data.generatedAt ?? "")),
  );

  const realWorld = [];
  const realFiles = [...listJson(realDir), ...rootDirFiles.filter((f) => /^real-world-/i.test(f.name))];
  const seenProjects = new Set();
  for (const { name, path } of realFiles) {
    if (!/^real-world-/i.test(name)) continue;
    const data = readJson(path);
    if (!data) continue;
    if (!publishablePlatform(data.runner?.platform ?? name, env)) continue;
    const project = name
      .replace(/^real-world-/i, "")
      .replace(/\.json$/i, "")
      .replace(/^(Linux|Windows|macOS|win32|darwin|ubuntu)-/i, "");
    if (seenProjects.has(project)) continue;
    seenProjects.add(project);
    realWorld.push({ name, project, data });
  }
  realWorld.sort((a, b) => a.project.localeCompare(b.project));

  return {
    bench: benches[0] ?? null,
    benches,
    extras,
    memories,
    // Back-compat single-memory slot: the primary (first non-local) probe.
    memory: memories.find((m) => !m.local) ?? memories[0] ?? null,
    repeated,
    ide,
    ideScale,
    confirms,
    // Back-compat single slot: the published (non-local) confirm run.
    confirm: confirms.find((c) => !c.local) ?? confirms[0] ?? null,
    compileSingle,
    realWorld,
  };
}

/**
 * Confirm rows for one group, merged across confirm sources per suite: for
 * each suite the NEWEST source carrying it wins whole (rows from different
 * runs of the same suite never mix). Returns the contributing sources too,
 * so the renderer can disclose a local run.
 */
export function confirmForGroup(model, group) {
  const sources = model?.confirms?.length
    ? model.confirms
    : model?.confirm
      ? [model.confirm]
      : [];
  const rows = [];
  const used = [];
  for (const suite of group.confirmSuites ?? []) {
    let best = null;
    for (const src of sources) {
      if (!(src.data?.results ?? []).some((r) => r.suite === suite)) continue;
      if (
        !best ||
        String(src.data.generatedAt ?? "") > String(best.data.generatedAt ?? "")
      ) {
        best = src;
      }
    }
    if (!best) continue;
    rows.push(...best.data.results.filter((r) => r.suite === suite));
    if (!used.includes(best)) used.push(best);
  }
  return { rows, sources: used };
}

/**
 * Memory-probe row id → bench variant id, where the mechanical rule
 * (strip the `mem-` prefix) does not hold. The probe measures one invocation
 * per tool; where bench has threading variants the alias names the variant
 * the probe actually ran (CLI default = max threads).
 */
const MEMORY_ALIASES = {
  "mem-eslint-vue": "eslint-plugin-vue-1t",
  "mem-vize-lint": "vize-lint-max",
  "mem-biome-lint": "biome-lint-max",
  "mem-oxlint": "oxlint-max",
  "mem-verter-lint": "verter-lint-host",
  "mem-lsp-volar": "volar-language-server",
  "mem-lsp-vize": "vize-lsp",
  "mem-lsp-verter": "verter-lsp",
};

/** Prefix rewrites where the probe and bench name the same tool differently. */
const MEMORY_ID_REWRITES = [
  [/^vue-style-reference-/, "vue-reference-sfc-style-"],
];

function memoryTargetId(row) {
  const aliased = MEMORY_ALIASES[row.id];
  if (aliased) return aliased;
  let id = String(row.id ?? "").replace(/^mem-/, "");
  for (const [re, to] of MEMORY_ID_REWRITES) id = id.replace(re, to);
  return id;
}

/**
 * Bench variant ids may carry a sourcemap suffix the probe ids omit
 * (`vue-3.5-1t-vdom-prod-smoff` ↔ `mem-vue-3.5-1t-vdom-prod`) — index both
 * spellings so the compile surfaces join too.
 */
function benchIdKeys(id) {
  const s = String(id ?? "");
  const keys = [s];
  const stripped = s.replace(/-sm(off|on)$/, "");
  if (stripped !== s) keys.push(stripped);
  return keys;
}

/** Peak RSS of a probe row in MB, or null. */
export function memoryPeakMb(row) {
  for (const key of ["peakMaxMb", "maxMb", "avgMb"]) {
    const v = Number(row?.[key]);
    if (Number.isFinite(v) && v > 0) return v;
  }
  return null;
}

/**
 * Inject the isolated probe's peak RSS onto bench variants (`rssMaxMb`) so
 * the timing tables carry a memory column instead of a second table/chart.
 * Rows that already carry a measured rssMaxMb (real-world, IDE) keep it.
 *
 * `memoryData` may be one probe or a list; a probe from the SAME platform as
 * the bench run wins, so a local win32 bench joins its local probe rather
 * than the Linux one. Returns how many variants got a value.
 */
export function attachMemoryToBench(benchData, memoryData) {
  if (!benchData?.surfaces) return 0;
  const sources = (Array.isArray(memoryData) ? memoryData : [{ data: memoryData }])
    .map((m) => m?.data ?? m)
    .filter((d) => d?.results);
  if (!sources.length) return 0;
  const platform = String(benchData.runner?.platform ?? "").toLowerCase();
  sources.sort((a, b) => {
    const ap = String(a.runner?.platform ?? a.fixture ?? "").toLowerCase();
    const bp = String(b.runner?.platform ?? b.fixture ?? "").toLowerCase();
    const am = platform && ap.includes(platform) ? 0 : 1;
    const bm = platform && bp.includes(platform) ? 0 : 1;
    return am - bm;
  });

  const byTarget = new Map(); // `${surface} ${targetId}` -> row (first source wins)
  for (const src of sources) {
    for (const row of src.results) {
      if (!row?.surface) continue;
      const key = `${row.surface} ${memoryTargetId(row)}`;
      if (!byTarget.has(key)) byTarget.set(key, row);
    }
  }

  let attached = 0;
  for (const surface of benchData.surfaces) {
    const variantLists = [
      surface.variants ?? [],
      ...(surface.groups ?? []).map((g) => g.variants ?? []),
    ];
    for (const variants of variantLists) {
      for (const v of variants) {
        if (Number.isFinite(v.rssMaxMb) && v.rssMaxMb > 0) continue;
        let row = null;
        for (const key of benchIdKeys(v.id)) {
          row = byTarget.get(`${surface.id} ${key}`);
          if (row) break;
        }
        const peak = row ? memoryPeakMb(row) : null;
        if (peak == null) continue;
        v.rssMaxMb = peak;
        // LSP probe rows split the tree like the typecheck surface — carry
        // the tool/engine attribution into the timing table's cell.
        if (Number.isFinite(row.rssToolMb)) {
          v.rssToolMb = row.rssToolMb;
          if (Number.isFinite(row.rssEngineMb)) v.rssEngineMb = row.rssEngineMb;
        }
        v.rssSource = "memory-probe";
        attached++;
      }
    }
  }
  return attached;
}

/** Format bytes as GB with one decimal. */
export function formatGb(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}

/** The shared run-meta block head for generated docs. */
export function runMetaLines(data, { sourceName } = {}) {
  const lines = [];
  if (data?.generatedAt) lines.push(`- **Generated:** ${data.generatedAt}`);
  if (data?.fixture) {
    lines.push(
      `- **Fixture:** \`${data.fixture}\`${data.fileCount ? ` (${data.fileCount} files)` : ""}`,
    );
  }
  if (data?.settings?.runs != null) {
    lines.push(`- **Runs / warmups:** ${data.settings.runs} / ${data.settings.warmups}`);
  }
  const r = data?.runner;
  if (r?.platform) {
    const mem = formatGb(r.totalmem);
    lines.push(
      `- **Runner:** ${r.label ?? r.platform} · ${r.platform}/${r.arch} · ${r.cpuCount} CPUs · ${r.cpuModel}${mem ? ` · ${mem}` : ""}${r.node ? ` · Node ${r.node}` : ""}`,
    );
  }
  if (data?.commit?.sha) {
    const sha = String(data.commit.sha);
    const repo = data.commit.repository;
    const rendered = repo ? `[\`${sha.slice(0, 7)}\`](https://github.com/${repo}/commit/${sha})` : `\`${sha.slice(0, 7)}\``;
    lines.push(`- **Commit:** ${rendered}`);
  }
  if (data?.commit?.runUrl) lines.push(`- **CI run:** ${data.commit.runUrl}`);
  if (sourceName) lines.push(`- **Source:** \`results/benchmarks/${sourceName}\``);
  return lines;
}
