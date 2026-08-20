#!/usr/bin/env node
/**
 * Single-file SFC compile microbench (tinybench) — Verter-style size ladder.
 *
 * Like packages/benchmark apple-to-apple:
 *   - A few fixtures spanning tiny → xlarge
 *   - Same tools, same machine, one file at a time
 *
 * Critical fairness rules:
 *   - every tool receives the same style-free render corpus (Verter's
 *     runtime-render lane does not compile CSS);
 *   - every cell/iteration changes fixed-width comments in both script and
 *     template, preventing cross-cell whole-source reuse;
 *   - Verter uses a fresh workspace-backed host/project per timed iteration.
 *
 * Usage:
 *   pnpm bench:compile:single
 *   node scripts/bench-compile-single.mjs --iterations 100 --warmup-iterations 20
 *   node scripts/bench-compile-single.mjs --files tiny,small,medium --targets vdom
 */

import { createRequire } from "node:module";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createHash } from "node:crypto";
import os from "node:os";
import { Bench } from "tinybench";
import {
  compileValidityConfigKey,
  runCompileValidityMatrix,
} from "./lib/compile-validity-gates.mjs";
import { prepareRawRenderCorpus } from "./lib/surfaces/compile.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const samplesDir = join(rootDir, "fixtures", "compile-single");

/** Preferred size ladder (Verter apple-to-apple style). Unknown files sort after. */
const SIZE_ORDER = ["tiny", "small", "medium", "large", "xlarge"];

function parseArgs(argv) {
  const args = {
    // Prefer fixed iterations (apple-to-apple); --time overrides if set alone
    time: 0,
    warmupTime: 0,
    iterations: 100,
    warmupIterations: 20,
    targets: "vdom,vapor",
    env: "production",
    files: "",
    json: "",
    out: "",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === "--time") args.time = Number(next());
    else if (a === "--warmup-time") args.warmupTime = Number(next());
    else if (a === "--iterations") args.iterations = Number(next());
    else if (a === "--warmup-iterations") args.warmupIterations = Number(next());
    else if (a === "--targets") args.targets = next();
    else if (a === "--env") args.env = next();
    else if (a === "--files") args.files = next();
    else if (a === "--json") args.json = next();
    else if (a === "--out") args.out = next();
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

/**
 * Change script/template source on every iteration with fixed-width comments.
 * The comments are semantically neutral, but force source/slice invalidation.
 */
export function uniquifySfc(source, nonce, cellSalt = "00000000") {
  let out = source;
  const n = Number(nonce) >>> 0;
  const token = `${cellSalt}-${String(n).padStart(10, "0")}`;

  const templateClose = out.lastIndexOf("</template>");
  if (templateClose !== -1) {
    out = out.slice(0, templateClose) + `<!--bench-n:${token}-->\n` + out.slice(templateClose);
  }

  const hadScript = out.includes("</script>");
  if (hadScript) {
    out = out.replaceAll("</script>", `\n/*bench-n:${token}*/\n</script>`);
  }

  if (templateClose === -1 && !hadScript) {
    out = `${out}\n<!--bench-n:${token}-->\n`;
  }

  return out;
}

function vueCompileSfc(compiler, source, filename, { vapor, isProd }) {
  const { descriptor } = compiler.parse(source, { filename });
  let bindings = {};
  let work = 1;
  const scriptOpts = {
    id: filename,
    inlineTemplate: false,
    isProd,
  };
  if (vapor) {
    scriptOpts.vapor = true;
    scriptOpts.templateOptions = { vapor: true, isProd };
  }
  if (descriptor.scriptSetup || descriptor.script) {
    const scriptResult = compiler.compileScript(descriptor, scriptOpts);
    bindings = scriptResult.bindings || {};
    work += scriptResult.content?.length ?? 1;
  }
  if (descriptor.template) {
    const templateOpts = {
      source: descriptor.template.content,
      filename,
      id: filename,
      isProd,
      compilerOptions: {
        bindingMetadata: bindings,
        mode: "module",
        hoistStatic: isProd,
        cacheHandlers: isProd,
        prefixIdentifiers: true,
      },
    };
    if (vapor) templateOpts.vapor = true;
    const tpl = compiler.compileTemplate(templateOpts);
    work += tpl?.code?.length ?? descriptor.template.content.length;
  }
  if (work < 2) throw new Error(`insufficient compile work for ${filename}`);
  return work;
}

function loadOptional(name) {
  try {
    return { mod: require(require.resolve(name, { paths: [rootDir] })) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

function loadSamples(filter) {
  if (!existsSync(samplesDir)) {
    throw new Error(`Missing ${samplesDir}`);
  }
  let names = readdirSync(samplesDir)
    .filter((f) => f.endsWith(".vue"))
    .sort((a, b) => {
      const ia = SIZE_ORDER.indexOf(basename(a, ".vue"));
      const ib = SIZE_ORDER.indexOf(basename(b, ".vue"));
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
  if (filter) {
    const want = new Set(filter.split(",").map((s) => s.trim().replace(/\.vue$/i, "")));
    names = names.filter((f) => want.has(basename(f, ".vue")));
  }
  return names.map((filename) => {
    const buf = readFileSync(join(samplesDir, filename));
    return {
      id: basename(filename, ".vue"),
      filename,
      path: join(samplesDir, filename),
      source: buf.toString("utf8"),
      bytes: buf.length,
    };
  });
}

/**
 * Shared mutable counter so each tool's iterations get distinct nonces
 * (and tools don't share the same sequence mid-run in a way that collides).
 */
function makeSourceFactory(baseSource, cellSalt) {
  let seq = 0;
  return () => {
    seq += 1;
    return { source: uniquifySfc(baseSource, seq, cellSalt), nonce: seq };
  };
}

function buildTools({ isProd, vapor }) {
  const tools = [];
  const compiler35 = require(
    require.resolve("@vue/compiler-sfc", {
      paths: [rootDir],
    }),
  );
  let compiler36 = null;
  try {
    compiler36 = require(
      require.resolve("@vue/compiler-sfc-36", {
        paths: [rootDir],
      }),
    );
  } catch {
    compiler36 = null;
  }
  const vize = loadOptional("@vizejs/native");
  const verter = loadOptional("@verter/native");

  if (!vapor) {
    tools.push({
      id: "vue-3.5",
      label: "@vue/compiler-sfc 3.5",
      compile: (source, filename) => {
        vueCompileSfc(compiler35, source, filename, { vapor: false, isProd });
      },
    });
  }

  if (compiler36) {
    tools.push({
      id: "vue-3.6",
      label: `@vue/compiler-sfc 3.6${vapor ? " vapor" : ""}`,
      compile: (source, filename) => {
        vueCompileSfc(compiler36, source, filename, { vapor, isProd });
      },
    });
  }

  if (!vize.error && typeof vize.mod.compileSfc === "function") {
    tools.push({
      id: "vize",
      label: "Vize compileSfc (style-free render)",
      notes: "Changing script/template source every iteration; full parse/compile/codegen",
      compile: (source, filename) => {
        const result = vize.mod.compileSfc(source, {
          filename,
          vapor,
          sourceMap: false,
          isTs: true,
          templateHoistStatic: isProd,
          templateCacheHandlers: isProd,
        });
        if (result?.errors?.length) {
          throw new Error(result.errors.join("; "));
        }
        if (!(result?.code?.length > 0)) {
          throw new Error("vize empty code");
        }
      },
    });
  }

  if (!verter.error && typeof verter.mod.VerterHost === "function") {
    const VerterHost = verter.mod.VerterHost;
    const renderProfile = {
      isProduction: isProd,
      customElement: false,
      ssr: false,
      forceJs: false, // one TS-passthrough standard for every compiler — see compile.mjs renderProfile
      forceVapor: vapor,
      sourceMap: false,
      hmrStrategy: isProd ? "none" : "vite",
      runtimeModuleName: "vue",
    };

    const runCompile = (host, source, filename) => {
      // Stable identity is retained, but the host/project is fresh for every
      // call. The timed work is first source admission, not an incremental edit.
      const id = filename.replace(/\\/g, "/");
      const results = host.compileMany([{ canonicalId: id, source, requestedMode: "stateless" }], {
        target: "runtime-render",
        defaultMode: "stateless",
        priority: "interactive",
        compileProfile: renderProfile,
      });
      if (results[0]?.errors?.length) {
        throw new Error(String(results[0].errors[0]));
      }
      if (!(results[0]?.code?.length > 0)) {
        throw new Error("verter empty code");
      }
      if (results[0].cacheHit) {
        throw new Error("runtime-render unexpectedly returned cached generated output");
      }
      if (results[0].actualMode !== "stateless") {
        throw new Error(`verter requested stateless but ran ${results[0].actualMode}`);
      }
    };

    let host = null;
    const prepareFreshHost = () => {
      const config = { devMode: !isProd, analysisLevel: "full" };
      if (
        typeof verter.mod.Workspace === "function" &&
        typeof VerterHost.withWorkspace === "function"
      ) {
        const workspaceRoot = samplesDir.replace(/\\/g, "/");
        const workspace = new verter.mod.Workspace([workspaceRoot]);
        workspace.configureProjects([{ root: workspaceRoot, workspaceRoot }]);
        host = VerterHost.withWorkspace(config, workspace);
      } else {
        host = new VerterHost(config);
      }
    };
    tools.push({
      id: "verter-stateless",
      label: "Verter runtime-render (first-admission stateless raw render)",
      notes:
        "requestedMode=stateless, analysisLevel=full; a fresh workspace-backed host/project is prepared before every timed iteration, so compileMany measures first source admission. Host construction is excluded by tinybench beforeEach",
      beforeEach: prepareFreshHost,
      afterEach: () => {
        host?.close?.();
        host = null;
      },
      compile: (source, filename) => {
        if (!host) prepareFreshHost();
        runCompile(host, source, filename);
      },
    });
  }

  return tools;
}

function taskStats(task) {
  const r = task.result;
  if (!r || r.state === "errored" || r.error) {
    return {
      ok: false,
      error: r?.error ? String(r.error.message || r.error) : "no result",
    };
  }
  const meanMs = r.latency?.mean ?? r.mean ?? null;
  const hz = r.throughput?.mean ?? r.hz ?? null;
  const rme = r.latency?.rme ?? r.rme ?? null;
  const samples = r.latency?.samplesCount ?? r.samples?.length ?? null;
  return { ok: true, meanMs, hz, rme, samples };
}

function fmtMs(ms) {
  if (!Number.isFinite(ms)) return "n/a";
  if (ms < 0.001) return `${(ms * 1e6).toFixed(0)} ns`;
  if (ms < 0.01) return `${(ms * 1000).toFixed(1)} µs`;
  if (ms < 1) return `${ms.toFixed(3)} ms`;
  return `${ms.toFixed(2)} ms`;
}

function fmtHz(hz) {
  if (!Number.isFinite(hz)) return "n/a";
  if (hz >= 1e6) return `${(hz / 1e6).toFixed(2)}M`;
  if (hz >= 1e3) return `${(hz / 1e3).toFixed(2)}k`;
  return hz.toFixed(1);
}

function fmtBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

const SINGLE_VALIDITY_ENTRYPOINT = Object.freeze({
  "vue-3.5": "vue-3.5",
  "vue-3.6": "vue-3.6",
  vize: "vize-single",
  "verter-stateless": "verter-compile-many",
});

export function applySingleCompileValidity(suites, validity) {
  for (const suite of suites) {
    const key = compileValidityConfigKey({
      target: suite.target,
      env: suite.env,
      sourceMap: false,
    });
    const entrypoints = validity?.matrix?.[key]?.entrypoints ?? {};
    const referenceId = suite.target === "vdom" ? "vue-3.5" : "vue-3.6";
    const referencePass = entrypoints[referenceId]?.status === "PASS";
    for (const row of suite.rows) {
      const first = suite.firstCalls.find((call) => call.tool === row.tool);
      const entrypoint = SINGLE_VALIDITY_ENTRYPOINT[first?.id];
      const gate = entrypoint ? entrypoints[entrypoint] : null;
      if (gate?.status !== "PASS" || !referencePass) {
        row.unranked = true;
        const why = !referencePass
          ? `official ${referenceId} reference validity is ${entrypoints[referenceId]?.status ?? "UNKNOWN"}`
          : `${entrypoint ?? first?.id ?? row.tool} validity is ${gate?.status ?? "UNKNOWN"}`;
        row.notes = `${row.notes || ""}${row.notes ? " | " : ""}⚠ UNRANKED: ${why}; time remains visible.`;
      } else {
        row.validationStatus = "PASS";
        row.notes = `${row.notes || ""}${row.notes ? " | " : ""}✓ ${gate.passed}/${gate.plantCount} exact-entrypoint runtime plants passed.`;
      }
    }
  }
  return suites;
}

async function runSuite({ sample, target, isProd, tools, benchOpts }) {
  const vapor = target === "vapor";
  const filename = sample.filename;
  const cellSalt = createHash("sha256")
    .update(`${sample.id}:${target}:${isProd ? "production" : "development"}`)
    .digest("hex")
    .slice(0, 8);

  // Per-tool source factories so each tool has its own nonce stream
  const factories = new Map(tools.map((t) => [t.id, makeSourceFactory(sample.source, cellSalt)]));

  const firstCalls = [];
  for (const tool of tools) {
    if (vapor && tool.id === "vue-3.5") continue;
    const { source } = factories.get(tool.id)();
    tool.beforeEach?.();
    const t0 = performance.now();
    try {
      tool.compile(source, filename);
      firstCalls.push({
        tool: tool.label,
        id: tool.id,
        firstCallMs: performance.now() - t0,
        ok: true,
        notes: tool.notes || "",
      });
    } catch (e) {
      firstCalls.push({
        tool: tool.label,
        id: tool.id,
        firstCallMs: null,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        notes: tool.notes || "",
      });
    } finally {
      tool.afterEach?.();
    }
  }

  const benchConfig = {
    name: `${sample.id} · ${target} · ${isProd ? "prod" : "dev"}`,
  };
  if (benchOpts.time > 0) {
    benchConfig.time = benchOpts.time;
    benchConfig.warmupTime = benchOpts.warmupTime || 50;
  } else {
    benchConfig.iterations = benchOpts.iterations;
    benchConfig.warmupIterations = benchOpts.warmupIterations;
  }

  const bench = new Bench(benchConfig);

  for (const tool of tools) {
    if (vapor && tool.id === "vue-3.5") continue;
    if (firstCalls.find((c) => c.id === tool.id && !c.ok)) continue;
    const next = factories.get(tool.id);
    bench.add(
      tool.label,
      () => {
        const { source } = next();
        tool.compile(source, filename);
      },
      { beforeEach: tool.beforeEach, afterEach: tool.afterEach },
    );
  }

  await bench.run();

  const rows = bench.tasks.map((task) => {
    const stats = taskStats(task);
    const firstCallRow = firstCalls.find((c) => c.tool === task.name);
    if (!stats.ok) {
      return {
        tool: task.name,
        status: "error",
        firstCallMs: firstCallRow?.firstCallMs ?? null,
        meanMs: null,
        hz: null,
        samples: null,
        rme: null,
        error: stats.error,
        notes: firstCallRow?.notes || "",
      };
    }
    return {
      tool: task.name,
      status: "ok",
      firstCallMs: firstCallRow?.firstCallMs ?? null,
      meanMs: stats.meanMs,
      hz: stats.hz,
      samples: stats.samples,
      rme: stats.rme,
      error: null,
      notes: firstCallRow?.notes || "",
    };
  });

  for (const c of firstCalls) {
    if (!c.ok && !rows.some((r) => r.tool === c.tool)) {
      rows.push({
        tool: c.tool,
        status: "error",
        firstCallMs: null,
        meanMs: null,
        hz: null,
        samples: null,
        rme: null,
        error: c.error,
        notes: c.notes,
      });
    }
  }

  return {
    file: sample.id,
    filename: sample.filename,
    bytes: sample.bytes,
    target,
    env: isProd ? "production" : "development",
    firstCalls,
    rows,
  };
}

function renderMarkdown(data) {
  const lines = [];
  lines.push("## Single-file raw render compile (size ladder · changed source)");
  lines.push("");
  lines.push(`- **Generated:** ${data.generatedAt}`);
  lines.push(
    `- **Runner:** ${data.runner.platform}/${data.runner.arch} · ${data.runner.cpuCount} CPUs · ${data.runner.cpuModel}`,
  );
  lines.push(`- **Node:** ${data.versions.node}`);
  if (data.settings.time > 0) {
    lines.push(
      `- **tinybench:** time=${data.settings.time}ms warmupTime=${data.settings.warmupTime}ms`,
    );
  } else {
    lines.push(
      `- **tinybench:** iterations=${data.settings.iterations} warmupIterations=${data.settings.warmupIterations}`,
    );
  }
  lines.push(`- **Env:** ${data.settings.env}`);
  lines.push("- **Body mutation:** ON (changed source every iteration)");
  lines.push("");
  lines.push("### Notes");
  lines.push("");
  for (const n of data.notes) lines.push(`- ${n}`);
  lines.push("");

  // Summary table per target (apple-to-apple style)
  for (const target of data.settings.targets) {
    const suites = data.suites.filter((s) => s.target === target);
    if (!suites.length) continue;
    lines.push(`### Summary · ${target} · ${data.settings.env}`);
    lines.push("");
    lines.push("| Fixture | Size | Tool | First call* | Mean | ops/s | ±% |");
    lines.push("| --- | ---: | --- | ---: | ---: | ---: | ---: |");
    for (const suite of suites) {
      const sorted = [...suite.rows]
        .filter((r) => r.status === "ok")
        .sort(
          (a, b) =>
            Number(a.unranked) - Number(b.unranked) || (a.meanMs ?? 1e99) - (b.meanMs ?? 1e99),
        );
      for (const r of sorted) {
        const rme = r.rme != null && Number.isFinite(r.rme) ? r.rme.toFixed(1) : "n/a";
        lines.push(
          `| \`${suite.file}\` | ${fmtBytes(suite.bytes)} | ${r.unranked ? `[${r.tool}]` : r.tool} | ${fmtMs(r.firstCallMs)} | ${fmtMs(r.meanMs)} | ${fmtHz(r.hz)} | ${rme} |`,
        );
      }
    }
    lines.push("");
    lines.push(
      "\\* First compiler invocation after modules were loaded; Verter's fresh host/project setup is excluded from the timed call. Not a fresh-process cold start.",
    );
    lines.push("");
  }

  for (const suite of data.suites) {
    lines.push(
      `### \`${suite.file}.vue\` · ${fmtBytes(suite.bytes)} · ${suite.target} · ${suite.env}`,
    );
    lines.push("");
    lines.push("| Tool | Status | First call* | Mean | ops/s | ±% | Notes |");
    lines.push("| --- | --- | ---: | ---: | ---: | ---: | --- |");

    const sorted = [...suite.rows].sort((a, b) => {
      if (a.status !== "ok") return 1;
      if (b.status !== "ok") return -1;
      return (a.meanMs ?? 1e99) - (b.meanMs ?? 1e99);
    });

    for (const r of sorted) {
      if (r.status === "ok") {
        const rme = r.rme != null && Number.isFinite(r.rme) ? r.rme.toFixed(1) : "n/a";
        lines.push(
          `| ${r.tool} | ${r.unranked ? "unranked" : "ok"} | ${fmtMs(r.firstCallMs)} | ${fmtMs(r.meanMs)} | ${fmtHz(r.hz)} | ${rme} | ${r.notes || ""} |`,
        );
      } else {
        lines.push(`| ${r.tool} | error | n/a | n/a | n/a | n/a | ${r.error || r.notes || ""} |`);
      }
    }
    lines.push("");
    lines.push(
      "\\* First compiler invocation after modules were loaded; Verter's fresh host/project setup is excluded from the timed call. Not a fresh-process cold start.",
    );
    lines.push("");
  }

  lines.push("### Tool versions");
  lines.push("");
  lines.push("| Package | Version |");
  lines.push("| --- | --- |");
  for (const [k, v] of Object.entries(data.versions)) {
    if (k === "node") continue;
    lines.push(`| ${k} | ${v} |`);
  }
  lines.push("");
  return `${lines.join("\n")}\n`;
}

function readPkgVersion(name) {
  try {
    const pkgPath = require.resolve(`${name}/package.json`, {
      paths: [rootDir],
    });
    return JSON.parse(readFileSync(pkgPath, "utf8")).version;
  } catch {
    try {
      const pkg = JSON.parse(
        readFileSync(join(rootDir, "node_modules", name, "package.json"), "utf8"),
      );
      return pkg.version;
    } catch {
      return "n/a";
    }
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/bench-compile-single.mjs [options]

  --iterations <n>          measured iters per task (default 100)
  --warmup-iterations <n>   warmup iters (default 20)
  --time <ms>               time-budget mode (disables fixed iterations)
  --warmup-time <ms>        warmup time when using --time
  --targets vdom,vapor      (default both)
  --env production|development
  --files tiny,small,...    size-tier basenames (default: all)
  --json / --out            output paths
`);
    process.exit(0);
  }

  const loadedSamples = loadSamples(args.files);
  const normalizationCompiler = require(require.resolve("@vue/compiler-sfc", { paths: [rootDir] }));
  const samples = prepareRawRenderCorpus(loadedSamples, normalizationCompiler).map(
    ({ revisionSites: _revisionSites, ...sample }, index) => ({
      ...sample,
      originalBytes: loadedSamples[index].bytes,
      bytes: Buffer.byteLength(sample.source),
    }),
  );
  if (samples.length === 0) {
    console.error("No sample .vue files found");
    process.exit(1);
  }

  const targets = args.targets
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const isProd = args.env !== "development";
  const benchOpts = {
    time: args.time,
    warmupTime: args.warmupTime,
    iterations: args.iterations,
    warmupIterations: args.warmupIterations,
  };

  console.log("Single-file raw render compile · style-free · changing source each iter");
  console.log(`  fixtures: ${samples.map((s) => `${s.id}(${fmtBytes(s.bytes)})`).join(" · ")}`);
  console.log(`  targets=${targets.join(",")} env=${args.env}`);
  if (benchOpts.time > 0) {
    console.log(`  tinybench time=${benchOpts.time}ms warmupTime=${benchOpts.warmupTime || 50}ms`);
  } else {
    console.log(
      `  tinybench iterations=${benchOpts.iterations} warmupIterations=${benchOpts.warmupIterations}`,
    );
  }
  console.log("");

  // Sanity: uniquify must change bytes
  const a = uniquifySfc(samples[0].source, 1);
  const b = uniquifySfc(samples[0].source, 2);
  if (a === b || a === samples[0].source) {
    throw new Error("uniquifySfc failed to produce distinct sources");
  }

  const suites = [];
  for (const sample of samples) {
    for (const target of targets) {
      const tools = buildTools({
        isProd,
        vapor: target === "vapor",
      });
      console.log(`→ ${sample.id}.vue (${fmtBytes(sample.bytes)}) · ${target}`);
      const suite = await runSuite({
        sample,
        target,
        isProd,
        tools,
        benchOpts,
      });
      suites.push(suite);
      const ranked = [...suite.rows]
        .filter((r) => r.status === "ok")
        .sort((a, b) => (a.meanMs ?? 1e99) - (b.meanMs ?? 1e99));
      for (const r of ranked) {
        console.log(
          `  ${r.tool.padEnd(32)} first=${fmtMs(r.firstCallMs).padStart(10)}  mean=${fmtMs(r.meanMs).padStart(10)}  ${fmtHz(r.hz)} ops/s`,
        );
      }
      for (const r of suite.rows.filter((x) => x.status !== "ok")) {
        console.log(`  ${r.tool.padEnd(32)} ERROR ${r.error}`);
      }
      console.log("");
    }
  }

  // Certification is deliberately last and process-isolated. It cannot warm
  // any tinybench iteration, and VDOM evidence is never borrowed for Vapor.
  const compileValidity = runCompileValidityMatrix(
    targets.map((target) => ({ target, env: args.env, sourceMap: false })),
    {
      entrypoints: ["vue-3.5", "vue-3.6", "vize-single", "verter-compile-many"],
    },
  );
  applySingleCompileValidity(suites, compileValidity);

  const data = {
    generatedAt: new Date().toISOString(),
    kind: "compile-single",
    runner: {
      platform: process.platform,
      arch: process.arch,
      cpuCount: os.cpus().length,
      cpuModel: os.cpus()[0]?.model?.trim() || "unknown",
    },
    versions: {
      node: process.version,
      "@vue/compiler-sfc": readPkgVersion("@vue/compiler-sfc"),
      "@vue/compiler-sfc-36": readPkgVersion("@vue/compiler-sfc-36"),
      "vue-36": readPkgVersion("vue-36"),
      "@vizejs/native": readPkgVersion("@vizejs/native"),
      "@verter/native": readPkgVersion("@verter/native"),
      tinybench: readPkgVersion("tinybench"),
    },
    settings: {
      time: benchOpts.time,
      warmupTime: benchOpts.warmupTime,
      iterations: benchOpts.iterations,
      warmupIterations: benchOpts.warmupIterations,
      env: args.env,
      targets,
    },
    notes: [
      "Size ladder fixtures: tiny → small → medium → large → xlarge (see fixtures/compile-single/).",
      "Every compiler receives the same STYLE-FREE render corpus by definition of this raw-render microbenchmark; style removal happens before timing.",
      "Each cell and iteration uses fixed-width, semantically neutral comments in every present template and script block, preventing cross-cell whole-source reuse while preserving identical candidate inputs.",
      "Verter gets a fresh workspace-backed host/project in tinybench beforeEach; the timed compileMany call measures first source admission. requestedMode=stateless, analysisLevel=full and cacheHit=false are asserted.",
      "Vize receives the same per-iteration revised source as Vue and Verter, so a prior generated artifact cannot satisfy a measured call even if a future release adds caching.",
      "Source maps are disabled for every tool in this microbenchmark; map generation is a separate bulk-matrix dimension.",
      "First call is not a fresh-process cold metric: modules are loaded and Verter host/project construction is excluded; use diagnose:compile-warmth for fresh-child comparisons.",
      "Mean sorted ascending within each fixture × target; bracketed/unranked rows retain measurements but do not support a comparison claim.",
      "Default: 20 warmup + 100 measured iterations (Verter apple-to-apple style).",
      "Host/session/identical-source experiments are intentionally excluded; use diagnose:compile-warmth for those diagnostics.",
      `Post-timing exact-entrypoint runtime validity: suite ${compileValidity.suiteVersion}, ${compileValidity.plantCount} plants. FAIL/UNKNOWN stays visible but unranked. Supported Vapor output executes against the pinned, version-matched Vue 3.6 runtime; unavailable backends remain individually UNKNOWN.`,
      "Vue 3.5 omitted from vapor suites. Not comparable to bulk fixtures/N throughput.",
    ],
    validation: { compileSemantics: compileValidity },
    suites,
  };

  const md = renderMarkdown(data);
  process.stdout.write("\n");
  process.stdout.write(md);

  const resultsDir = join(rootDir, "results");
  mkdirSync(resultsDir, { recursive: true });
  const defaultJson = join(resultsDir, `compile-single-${process.platform}.json`);
  const defaultMd = join(resultsDir, `compile-single-${process.platform}.md`);
  const jsonPath = args.json ? join(rootDir, args.json) : defaultJson;
  const mdPath = args.out ? join(rootDir, args.out) : defaultMd;
  writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(mdPath, md);
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.stack || err.message : String(err));
    process.exit(1);
  });
}
