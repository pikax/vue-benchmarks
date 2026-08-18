/**
 * Generate docs/typecheck.md from confirmation results + plant metas.
 *
 * The methodology prose is the source of truth for *how* we judge tools.
 * The results tables are generated so they cannot drift from confirm.json.
 */
import { readdirSync, readFileSync } from "node:fs";
import os from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const casesRoot = join(here, "../fixtures/typecheck/cases");

const TOOLS = ["vue-tsc", "vize-check", "verter-tsc", "golar-typecheck"];
const TOOL_LABEL = {
  "vue-tsc": "vue-tsc",
  "vize-check": "vize",
  "verter-tsc": "verter-tsc",
  "golar-typecheck": "golar",
};

const GROUPS = [
  ["narrowing", "Template narrowing"],
  ["fallthrough-root", "inheritAttrs + root shape"],
  ["inherit-attrs", "inheritAttrs / strictTemplates (no fallthrough typing)"],
  ["generics", "Generics"],
  ["emits", "Emits"],
  ["events", "Native events / $event / modifiers"],
  ["v-model", "v-model / defineModel"],
  ["slots", "Slots"],
  ["props", "Props / v-bind"],
  ["refs", "Refs / expose / unwrap"],
  ["script", "Script / inject / options API"],
  ["ts-import", ".ts imports .vue"],
  ["other", "Other"],
];

function inferGroup(id, explicit) {
  if (explicit) return explicit;
  if (id.startsWith("fallthrough-")) return "fallthrough-root";
  if (id.startsWith("generic-")) return "generics";
  if (id.startsWith("inherit-attrs-") || id.startsWith("attrs-") || id.startsWith("unknown-prop"))
    return "inherit-attrs";
  if (id.startsWith("v-if-") || id.startsWith("v-else-") || id.startsWith("v-show-"))
    return "narrowing";
  if (id.startsWith("emit-") || id.startsWith("event-emit")) return "emits";
  if (
    id.startsWith("v-model-") ||
    id.startsWith("define-model") ||
    id.startsWith("native-input-v-model") ||
    id.startsWith("native-v-model")
  )
    return "v-model";
  if (id.startsWith("slot-") || id.startsWith("define-slots-")) return "slots";
  if (
    id.startsWith("wrong-prop") ||
    id.startsWith("missing-required") ||
    id.startsWith("static-number") ||
    id.startsWith("boolean-prop") ||
    id.startsWith("v-bind-") ||
    id.startsWith("literal-union") ||
    id.startsWith("with-defaults")
  )
    return "props";
  if (
    id.startsWith("event-mod-") ||
    id.startsWith("dollar-event") ||
    id.startsWith("native-keyup") ||
    id.startsWith("element-prop")
  )
    return "events";
  if (
    id.startsWith("component-ref") ||
    id.startsWith("ref-unwrap") ||
    id.startsWith("computed-") ||
    id.startsWith("template-ref")
  )
    return "refs";
  if (id.startsWith("ts-import-")) return "ts-import";
  if (
    id.startsWith("script-") ||
    id.startsWith("inject-") ||
    id.startsWith("provide-") ||
    id.startsWith("options-api") ||
    id.startsWith("async-setup")
  )
    return "script";
  return "other";
}

function loadMetas() {
  return readdirSync(casesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => {
      const meta = JSON.parse(readFileSync(join(casesRoot, d.name, "meta.json"), "utf8"));
      return {
        id: meta.id || d.name,
        dir: d.name,
        description: meta.description || "",
        expectErrors: Boolean(meta.expectErrors),
        group: inferGroup(meta.id || d.name, meta.group),
        fallthrough: Boolean(meta.needsFallthroughAttributes),
      };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function cell(status) {
  if (status === "pass") return "✓";
  if (status === "fail") return "**✗**";
  if (status === "warn") return "⚠";
  if (status === "skip") return "○";
  return "–";
}

function resultMap(results) {
  /** @type {Map<string, Map<string, { status: string, message?: string, ms?: number, rssMb?: number }>>} */
  const byCase = new Map();
  for (const r of results) {
    if (r.suite !== "typecheck") continue;
    if (!byCase.has(r.caseId)) byCase.set(r.caseId, new Map());
    byCase.get(r.caseId).set(r.tool, {
      status: r.status,
      message: r.message,
      ms: r.ms,
      rssMb: r.rssMb,
    });
  }
  return byCase;
}

function escapeCell(s) {
  // `<script …>` in a table cell is parsed as a real HTML script tag by
  // VS Code's markdown preview and swallows every following row (and the
  // Time and memory table). Escape angle brackets; pipes already break GFM tables.
  return String(s || "")
    .replace(/\|/g, "\\|")
    .replace(/\n/g, " ")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Relative link from docs/typecheck.md to the plant's fixture project. */
function caseLink(meta) {
  const dir = meta.dir || meta.id;
  return `[\`${meta.id}\`](../tests/confirm/fixtures/typecheck/cases/${dir}/)`;
}

export function formatMs(ms) {
  if (!Number.isFinite(ms)) return "–";
  if (ms >= 1000) return `${(ms / 1000).toFixed(2)}s`;
  if (ms >= 10) return `${Math.round(ms)}ms`;
  return `${ms.toFixed(1)}ms`;
}

export function formatRss(mb) {
  if (!Number.isFinite(mb) || mb <= 0) return "–";
  return mb >= 10 ? `${Math.round(mb)}MB` : `${mb.toFixed(1)}MB`;
}

function resourceCell(r) {
  if (!r || r.status === "skip") return "–";
  const time = formatMs(r.ms);
  const mem = formatRss(r.rssMb);
  if (time === "–" && mem === "–") return "–";
  if (mem === "–") return time;
  return `${time} / ${mem}`;
}

function appendTimeAndMemory(lines, metas, byCase, host) {
  lines.push("## Time and memory");
  lines.push("");
  lines.push(
    `This table is from **${host}**. Rows from another machine are not comparable. Published figures come from a Benchmark workflow Linux run.`,
  );
  lines.push("");
  lines.push(
    "One spawn per cell on the **shared** tsconfig. Wall clock is spawn → exit (not a ranked throughput number: no warmup, one run, tiny fixtures). RSS uses the same method as `pnpm bench:memory`:",
  );
  lines.push("");
  lines.push("- Linux / macOS: poll `pidTreeRssBytes` (`/proc` or `ps` + children); Linux also folds in `VmHWM`");
  lines.push("- Windows: PowerShell `Process.Start` samples `WorkingSet64` in-process and folds in `PeakWorkingSet64`");
  lines.push("");
  lines.push(
    "FallthroughAttributes retries and other extra-config runs are **not** in this table. Skip cells are –. Do not compare these to the `typecheck` throughput surface in the README.",
  );
  lines.push("");
  lines.push(`| Case | ${TOOLS.map((t) => TOOL_LABEL[t]).join(" | ")} |`);
  lines.push(`| --- | ${TOOLS.map(() => "---").join(" | ")} |`);

  const totals = Object.fromEntries(TOOLS.map((t) => [t, { ms: 0, rssMb: 0, n: 0, nRss: 0 }]));
  for (const meta of metas) {
    const tools = byCase.get(meta.id) || new Map();
    const cells = TOOLS.map((t) => {
      const r = tools.get(t);
      if (r && r.status !== "skip") {
        if (Number.isFinite(r.ms)) {
          totals[t].ms += r.ms;
          totals[t].n += 1;
        }
        if (Number.isFinite(r.rssMb) && r.rssMb > 0) {
          totals[t].rssMb = Math.max(totals[t].rssMb, r.rssMb);
          totals[t].nRss += 1;
        }
      }
      return resourceCell(r);
    });
    lines.push(`| ${caseLink(meta)} | ${cells.join(" | ")} |`);
  }
  const totalCells = TOOLS.map((t) => {
    const tot = totals[t];
    if (!tot.n) return "–";
    const time = `Σ ${formatMs(tot.ms)}`;
    const mem = tot.nRss ? ` · peak ${formatRss(tot.rssMb)}` : "";
    return `${time}${mem}`;
  });
  lines.push(`| **all plants** | ${totalCells.join(" | ")} |`);
  lines.push("");
}

function hostLabel(platform, ci) {
  const os =
    platform === "linux" ? "Linux" : platform === "darwin" ? "macOS" : platform === "win32" ? "Windows" : platform;
  return ci ? `${os} CI` : os;
}

/** Same shape the throughput reports publish (`scripts/bench.mjs` runner). */
export function collectRunner() {
  const env = process.env;
  const server = env.GITHUB_SERVER_URL;
  const repo = env.GITHUB_REPOSITORY;
  const runId = env.GITHUB_RUN_ID;
  return {
    label: env.RUNNER_OS ?? env.VIZE_BENCH_RUNNER ?? "local",
    platform: process.platform,
    arch: process.arch,
    cpuCount: os.cpus().length,
    cpuModel: (os.cpus()[0]?.model ?? "unknown").trim(),
    totalmem: os.totalmem(),
    node: process.version,
    ci: Boolean(env.CI),
    runUrl: server && repo && runId ? `${server}/${repo}/actions/runs/${runId}` : "",
  };
}

export function formatRunnerLine(runner) {
  if (!runner) return "";
  const mem =
    Number.isFinite(runner.totalmem) && runner.totalmem > 0
      ? ` · ${(runner.totalmem / 1024 ** 3).toFixed(1)} GB`
      : "";
  const host = hostLabel(runner.platform, runner.ci);
  const label = runner.label && runner.label !== "local" ? runner.label : host;
  return `- **Runner:** ${label} · ${runner.platform}/${runner.arch} · ${runner.cpuCount} CPUs · ${runner.cpuModel}${mem} · Node ${runner.node}`;
}

/**
 * Compact README block: per-tool pass/warn/fail/skip + warn list + link.
 * Includes the same runner line as the full doc.
 */
export function formatTypecheckReadmeSummary({ results, generatedAt, runner }) {
  const typecheckRows = results.filter((r) => r.suite === "typecheck");
  const plants = new Set(typecheckRows.map((r) => r.caseId)).size;
  const host = hostLabel(runner?.platform ?? process.platform, runner?.ci ?? Boolean(process.env.CI));
  const lines = [];
  lines.push("<!-- TYPECHECK_CONFIRM_START -->");
  lines.push("");
  lines.push("## Typecheck confirmation");
  lines.push("");
  lines.push(
    `Correctness plants (not throughput). **${plants}** plants. Generated ${generatedAt} on **${host}**.`,
  );
  lines.push("");
  const runnerLine = formatRunnerLine(runner);
  if (runnerLine) lines.push(runnerLine);
  if (runner?.runUrl) lines.push(`- **CI run:** ${runner.runUrl}`);
  lines.push("");
  lines.push("Full matrix, plants, documented gaps, and time/memory: [docs/typecheck.md](docs/typecheck.md).");
  lines.push("");
  lines.push("| Tool | pass | warn | fail | skip |");
  lines.push("| --- | ---: | ---: | ---: | ---: |");
  const totals = { pass: 0, warn: 0, fail: 0, skip: 0 };
  for (const t of TOOLS) {
    const rows = typecheckRows.filter((r) => r.tool === t);
    const n = (status) => rows.filter((r) => r.status === status).length;
    const cell = { pass: n("pass"), warn: n("warn"), fail: n("fail"), skip: n("skip") };
    for (const k of Object.keys(totals)) totals[k] += cell[k];
    lines.push(`| ${TOOL_LABEL[t]} | ${cell.pass} | ${cell.warn} | ${cell.fail} | ${cell.skip} |`);
  }
  lines.push(`| **all** | ${totals.pass} | ${totals.warn} | ${totals.fail} | ${totals.skip} |`);
  lines.push("");
  const warns = typecheckRows.filter((r) => r.status === "warn");
  if (warns.length) {
    lines.push("Disclosed extra harness behaviour (warn, not a pass):");
    lines.push("");
    for (const r of warns.sort((a, b) => `${a.caseId}/${a.tool}`.localeCompare(`${b.caseId}/${b.tool}`))) {
      lines.push(`- \`${r.tool}\` / \`${r.caseId}\``);
    }
    lines.push("");
  }
  lines.push("<!-- TYPECHECK_CONFIRM_END -->");
  return lines.join("\n");
}

/**
 * @param {{
 *   results: Array<{ suite: string, caseId: string, tool: string, status: string, message?: string }>,
 *   generatedAt: string,
 *   platform?: string,
 *   ci?: boolean,
 *   runner?: ReturnType<typeof collectRunner>,
 * }} opts
 */
export function formatTypecheckDoc({
  results,
  generatedAt,
  platform,
  ci,
  runner,
}) {
  runner = runner ?? {
    platform: platform ?? process.platform,
    ci: ci ?? Boolean(process.env.CI),
    arch: process.arch,
    cpuCount: 0,
    cpuModel: "",
    totalmem: 0,
    node: process.version,
    label: "local",
    runUrl: "",
  };
  platform = runner.platform;
  ci = Boolean(runner.ci);
  const metas = loadMetas();
  const byCase = resultMap(results);
  const known = loadKnownFailureKeys();

  const lines = [];
  lines.push("# Typecheck confirmation");
  lines.push("");
  lines.push(
    "This is the **correctness** suite for Vue typecheckers, not a throughput benchmark.",
  );
  lines.push(
    "A tool is compatible only if it reports the planted error (or stays clean) on every plant.",
  );
  lines.push(
    "vue-tsc (Volar) is the usual reference, but it is **not assumed perfect** — a plant it fails is a real gap and is listed as such.",
  );
  lines.push("");
  const host = hostLabel(platform, ci);
  lines.push(`Generated from \`pnpm confirm:typecheck\` at ${generatedAt} on **${host}**.`);
  const runnerLine = formatRunnerLine(runner);
  if (runnerLine) lines.push(runnerLine);
  if (runner.runUrl) lines.push(`- **CI run:** ${runner.runUrl}`);
  lines.push("");
  lines.push(
    "On a **Benchmark** dispatch, Linux CI re-runs this and commits the file. Do not hand-edit the results.",
  );
  lines.push("");

  lines.push("## How plants are judged");
  lines.push("");
  lines.push("- Each case is a tiny project under `tests/confirm/fixtures/typecheck/cases/<id>/`.");
  lines.push(
    "- Every tool runs on the **same shared tsconfig** (`strictTemplates: true`). Extra TypeScript flags that only one tool needs are **not** added globally.",
  );
  lines.push(
    "- `expectErrors: false` — the fixture is clean. Any diagnostic is a fail. A diagnostic that names the tool's own virtual code (`__VLS_`, `___VERTER___`, …) is called out as a codegen leak.",
  );
  lines.push(
    "- `expectErrors: true` — at least one error, matching `mustMatch` when set. Missing the plant is a fail.",
  );
  lines.push(
    "- **skip** — the tool does not claim the capability (`meta.requires`), or the binary/engine is missing.",
  );
  lines.push(
    "- **warn** — extra harness behaviour for one tool (today: verter-tsc retried with `allowArbitraryExtensions` + `allowImportingTsExtensions` that the others do not need). A warn is **not** a pass.",
  );
  lines.push(
    "- Known upstream bugs live in `tests/confirm/known-failures.json`. They still show as **✗** here so the gap stays visible; they do not fail the PR gate until they start passing (stale entry) or a new unlisted fail appears.",
  );
  lines.push("");

  lines.push("## Shared vs extra vueCompilerOptions");
  lines.push("");
  lines.push(
    "The shared config does **not** set `fallthroughAttributes`. That flag is a Volar opt-in (default `false`). This suite does not put it in any case `tsconfig.json` — doing so would hide that a tool only types inheritAttrs fallthrough when given a non-default option.",
  );
  lines.push("");
  lines.push(
    "Plants in **inheritAttrs + root shape** run **twice**: once on the shared tsconfig, then on an isolated `tsconfig.fallthrough.json`. Scoring:",
  );
  lines.push("");
  lines.push("- shared ✓ and extra ✓ → **pass** (no opt-in needed, or a dirty plant errors either way)");
  lines.push("- shared ✗ and extra ✓ → **⚠ warn** (needed `fallthroughAttributes`; not a pass)");
  lines.push("- shared ✓ and extra ✗ → **fail** (the opt-in revealed the plant was missed)");
  lines.push("- shared ✗ and extra ✗ → **fail**");
  lines.push("");
  lines.push("What those plants ask (the *correct* inheritAttrs/root-shape answer):");
  lines.push("");
  lines.push("| Root shape | inheritAttrs | Call-site `id=` | Correct answer |");
  lines.push("| --- | --- | --- | --- |");
  lines.push("| Single element | default / true | native `id` | clean (falls through) |");
  lines.push("| Single element | `false` | native `id` | error |");
  lines.push("| Multi-root fragment | default / true | native `id` | error (no single target) |");
  lines.push("| `v-if` / `v-else`, both single-root | default / true | native `id` | clean (always one root) |");
  lines.push("| `v-if` single / `v-else` fragment | default / true | native `id` | error (not always one root) |");
  lines.push("| `v-if=\"true\"` or a literal-`true` prop, single branch | default / true | native `id` | clean if the checker resolves the condition statically |");
  lines.push("| `v-if=\"true\"` but that branch is a fragment | default / true | native `id` | error |");
  lines.push("");
  lines.push(
    "Static resolution (`v-if=\"true\"`, `alwaysOn: true`) is the hard edge. A tool that only counts root nodes syntactically will fail it. That is a finding, including for vue-tsc.",
  );
  lines.push("");

  lines.push("## Status key");
  lines.push("");
  lines.push("| Mark | Meaning |");
  lines.push("| --- | --- |");
  lines.push("| ✓ | pass — plant met on the shared (or disclosed case-local) config |");
  lines.push("| **✗** | fail — plant not met. If listed in known-failures.json it is a documented upstream gap |");
  lines.push("| ⚠ | warn — extra harness behaviour; not scored as a pass |");
  lines.push("| ○ | skip — missing capability or engine |");
  lines.push("| – | no row (tool did not run this case) |");
  lines.push("");

  const typecheckRows = results.filter((r) => r.suite === "typecheck");
  const pass = typecheckRows.filter((r) => r.status === "pass").length;
  const fail = typecheckRows.filter((r) => r.status === "fail").length;
  const skip = typecheckRows.filter((r) => r.status === "skip").length;
  const warn = typecheckRows.filter((r) => r.status === "warn").length;

  lines.push("## Summary");
  lines.push("");
  lines.push(`- plants: **${metas.length}**`);
  lines.push(`- pass: **${pass}** · fail: **${fail}** · skip: **${skip}** · warn: **${warn}**`);
  lines.push("- wall clock + peak RSS per plant × tool: [Time and memory](#time-and-memory)");
  lines.push("");

  for (const [groupId, groupTitle] of GROUPS) {
    const rows = metas.filter((m) => m.group === groupId);
    if (!rows.length) continue;
    lines.push(`## ${groupTitle}`);
    lines.push("");
    lines.push(
      `| Case | Expect | ${TOOLS.map((t) => TOOL_LABEL[t]).join(" | ")} | What it checks |`,
    );
    lines.push(`| --- | --- | ${TOOLS.map(() => "---").join(" | ")} | --- |`);
    for (const meta of rows) {
      const tools = byCase.get(meta.id) || new Map();
      const cells = TOOLS.map((t) => {
        const r = tools.get(t);
        const mark = cell(r?.status);
        const key = `typecheck/${meta.id}/${t}`;
        return known.has(key) && r?.status === "fail" ? `${mark}†` : mark;
      });
      const expect = meta.expectErrors ? "error" : "clean";
      const note = meta.fallthrough
        ? `${meta.description} · *may warn if fallthroughAttributes is required*`
        : meta.description;
      lines.push(
        `| ${caseLink(meta)} | ${expect} | ${cells.join(" | ")} | ${escapeCell(note)} |`,
      );
    }
    lines.push("");
  }

  const documented = typecheckRows.filter(
    (r) => r.status === "fail" && known.has(`typecheck/${r.caseId}/${r.tool}`),
  );
  if (documented.length) {
    lines.push("## Documented gaps (†)");
    lines.push("");
    lines.push(
      "These fails are real. They are allow-listed only so the PR gate stays a useful signal; the cell still shows **✗**.",
    );
    lines.push("");
    for (const r of documented.sort((a, b) => resultKey(a).localeCompare(resultKey(b)))) {
      lines.push(`- \`typecheck/${r.caseId}/${r.tool}\` — ${escapeCell(r.message || known.get(resultKey(r)) || "")}`);
    }
    lines.push("");
  }

  const warns = typecheckRows.filter((r) => r.status === "warn");
  if (warns.length) {
    lines.push("## Disclosed extra harness behaviour");
    lines.push("");
    for (const r of warns) {
      lines.push(`- \`typecheck/${r.caseId}/${r.tool}\` — ${escapeCell(r.message || "")}`);
    }
    lines.push("");
  }

  appendTimeAndMemory(lines, metas, byCase, host);

  lines.push("## Running");
  lines.push("");
  lines.push("```bash");
  lines.push("pnpm confirm:typecheck");
  lines.push("```");
  lines.push("");
  lines.push(
    "Writes `results/confirm.json`, `results/confirm.md`, and refreshes this file. A Benchmark dispatch on `main` commits this file and a README summary (`[skip ci]`).",
  );
  lines.push("");
  return lines.join("\n");
}

function resultKey(r) {
  return `typecheck/${r.caseId}/${r.tool}`;
}

function loadKnownFailureKeys() {
  try {
    const raw = JSON.parse(readFileSync(join(here, "../known-failures.json"), "utf8"));
    return new Map(
      Object.entries(raw).filter(([k]) => k.startsWith("typecheck/") && !k.startsWith("$")),
    );
  } catch {
    return new Map();
  }
}
