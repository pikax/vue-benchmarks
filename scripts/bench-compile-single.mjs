#!/usr/bin/env node
/**
 * Single-file SFC compile microbench (tinybench) — Verter-style size ladder.
 *
 * Like packages/benchmark apple-to-apple:
 *   - A few fixtures spanning tiny → xlarge
 *   - Same tools, same machine, one file at a time
 *
 * Critical fairness rule:
 *   Every timed iteration compiles a **unique content body** (nonce inject).
 *   Vize content-hash caching otherwise makes repeated identical sources nearly free
 *   while Verter / Vue still pay real compile cost.
 *
 * Usage:
 *   pnpm bench:compile:single
 *   node scripts/bench-compile-single.mjs --iterations 100 --warmup-iterations 20
 *   node scripts/bench-compile-single.mjs --files tiny,small,medium --targets vdom
 */

import { createRequire } from "node:module";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import os from "node:os";
import { Bench } from "tinybench";

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
    verterMode: "stateless", // stateless | session | fresh-host
    mutate: true, // uniquify each iteration (disable with --no-mutate for cache demos)
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
    else if (a === "--verter-session") args.verterMode = "session";
    else if (a === "--verter-fresh-host") args.verterMode = "fresh-host";
    else if (a === "--no-mutate") args.mutate = false;
    else if (a === "--json") args.json = next();
    else if (a === "--out") args.out = next();
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

/**
 * Make source unique per iteration so content-hash / body caches cannot skip work.
 * Touches template (HTML comment) and script (const) when present.
 */
export function uniquifySfc(source, nonce) {
  let out = source;
  const n = Number(nonce) >>> 0;

  if (out.includes("</template>")) {
    out = out.replace("</template>", `<!--bench-n:${n}-->\n</template>`);
  } else {
    out = `${out}\n<!--bench-n:${n}-->\n`;
  }

  const scriptClose = out.indexOf("</script>");
  if (scriptClose !== -1) {
    // Detect lang=ts on the opening script tag that owns this close
    const open = out.lastIndexOf("<script", scriptClose);
    const openTagEnd = out.indexOf(">", open);
    const openTag = open >= 0 && openTagEnd > open ? out.slice(open, openTagEnd) : "";
    const isTs = /\blang\s*=\s*["']ts["']/i.test(openTag);
    const line = isTs
      ? `\nconst __benchNonce = ${n} as const\n`
      : `\nconst __benchNonce = ${n}\n`;
    out = out.slice(0, scriptClose) + line + out.slice(scriptClose);
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
    const want = new Set(
      filter.split(",").map((s) => s.trim().replace(/\.vue$/i, "")),
    );
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
function makeSourceFactory(baseSource, { mutate }) {
  let seq = 0;
  return () => {
    seq += 1;
    if (!mutate) return { source: baseSource, nonce: 0 };
    return { source: uniquifySfc(baseSource, seq), nonce: seq };
  };
}

function buildTools({ isProd, vapor, verterMode }) {
  const tools = [];
  const compiler35 = require(require.resolve("@vue/compiler-sfc", {
    paths: [rootDir],
  }));
  let compiler36 = null;
  try {
    compiler36 = require(require.resolve("@vue/compiler-sfc-36", {
      paths: [rootDir],
    }));
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
      label: "Vize compileSfc",
      notes: "Per-iter unique source (content-hash cannot skip)",
      compile: (source, filename) => {
        const result = vize.mod.compileSfc(source, {
          filename,
          vapor,
          sourceMap: !isProd,
          isTs: true,
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
      sourceMap: !isProd,
      hmrStrategy: isProd ? "none" : "vite",
      runtimeModuleName: "vue",
    };

    const runCompile = (host, source, filename, mode) => {
      // Unique canonical id per body avoids identity-based reuse of prior source
      const id = `${filename.replace(/\\/g, "/")}#${Buffer.byteLength(source)}:${source.length}`;
      const results = host.compileMany(
        [{ canonicalId: id, source, requestedMode: mode }],
        {
          target: "runtime-render",
          defaultMode: mode,
          priority: "interactive",
          compileProfile: renderProfile,
        },
      );
      if (results[0]?.errors?.length) {
        throw new Error(String(results[0].errors[0]));
      }
      if (!(results[0]?.code?.length > 0)) {
        throw new Error("verter empty code");
      }
    };

    if (verterMode === "fresh-host") {
      tools.push({
        id: "verter-fresh-host",
        label: "Verter (fresh host)",
        notes: "New VerterHost every call",
        compile: (source, filename) => {
          const host = new VerterHost({ devMode: !isProd });
          runCompile(host, source, filename, "stateless");
        },
      });
    } else if (verterMode === "session") {
      const host = new VerterHost({ devMode: !isProd });
      tools.push({
        id: "verter-session",
        label: "Verter (session)",
        notes: "One host; session mode; unique body/id per iter",
        compile: (source, filename) => {
          runCompile(host, source, filename, "session");
        },
      });
    } else {
      const host = new VerterHost({ devMode: !isProd });
      tools.push({
        id: "verter-stateless",
        label: "Verter (stateless)",
        notes: "One host; stateless; unique body/id per iter",
        compile: (source, filename) => {
          runCompile(host, source, filename, "stateless");
        },
      });
    }
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

async function runSuite({
  sample,
  target,
  isProd,
  tools,
  benchOpts,
  mutate,
}) {
  const vapor = target === "vapor";
  const filename = sample.filename;

  // Per-tool source factories so each tool has its own nonce stream
  const factories = new Map(
    tools.map((t) => [t.id, makeSourceFactory(sample.source, { mutate })]),
  );

  const cold = [];
  for (const tool of tools) {
    if (vapor && tool.id === "vue-3.5") continue;
    const { source } = factories.get(tool.id)();
    const t0 = performance.now();
    try {
      tool.compile(source, filename);
      cold.push({
        tool: tool.label,
        id: tool.id,
        coldMs: performance.now() - t0,
        ok: true,
        notes: tool.notes || "",
      });
    } catch (e) {
      cold.push({
        tool: tool.label,
        id: tool.id,
        coldMs: null,
        ok: false,
        error: e instanceof Error ? e.message : String(e),
        notes: tool.notes || "",
      });
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
    if (cold.find((c) => c.id === tool.id && !c.ok)) continue;
    const next = factories.get(tool.id);
    bench.add(tool.label, () => {
      const { source } = next();
      tool.compile(source, filename);
    });
  }

  await bench.run();

  const rows = bench.tasks.map((task) => {
    const stats = taskStats(task);
    const coldRow = cold.find((c) => c.tool === task.name);
    if (!stats.ok) {
      return {
        tool: task.name,
        status: "error",
        coldMs: coldRow?.coldMs ?? null,
        meanMs: null,
        hz: null,
        samples: null,
        rme: null,
        error: stats.error,
        notes: coldRow?.notes || "",
      };
    }
    return {
      tool: task.name,
      status: "ok",
      coldMs: coldRow?.coldMs ?? null,
      meanMs: stats.meanMs,
      hz: stats.hz,
      samples: stats.samples,
      rme: stats.rme,
      error: null,
      notes: coldRow?.notes || "",
    };
  });

  for (const c of cold) {
    if (!c.ok && !rows.some((r) => r.tool === c.tool)) {
      rows.push({
        tool: c.tool,
        status: "error",
        coldMs: null,
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
    mutate,
    cold,
    rows,
  };
}

function renderMarkdown(data) {
  const lines = [];
  lines.push("## Single-file compile (size ladder · unique bodies)");
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
  lines.push(
    `- **Body mutation:** ${data.settings.mutate ? "ON (unique source every iteration)" : "OFF (identical source — cache-demo only)"}`,
  );
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
    lines.push(
      "| Fixture | Size | Tool | Cold | Mean | ops/s | ±% |",
    );
    lines.push("| --- | ---: | --- | ---: | ---: | ---: | ---: |");
    for (const suite of suites) {
      const sorted = [...suite.rows]
        .filter((r) => r.status === "ok")
        .sort((a, b) => (a.meanMs ?? 1e99) - (b.meanMs ?? 1e99));
      for (const r of sorted) {
        const rme =
          r.rme != null && Number.isFinite(r.rme) ? r.rme.toFixed(1) : "n/a";
        lines.push(
          `| \`${suite.file}\` | ${fmtBytes(suite.bytes)} | ${r.tool} | ${fmtMs(r.coldMs)} | ${fmtMs(r.meanMs)} | ${fmtHz(r.hz)} | ${rme} |`,
        );
      }
    }
    lines.push("");
  }

  for (const suite of data.suites) {
    lines.push(
      `### \`${suite.file}.vue\` · ${fmtBytes(suite.bytes)} · ${suite.target} · ${suite.env}`,
    );
    lines.push("");
    lines.push(
      "| Tool | Status | Cold (1st unique) | Mean | ops/s | ±% | Notes |",
    );
    lines.push("| --- | --- | ---: | ---: | ---: | ---: | --- |");

    const sorted = [...suite.rows].sort((a, b) => {
      if (a.status !== "ok") return 1;
      if (b.status !== "ok") return -1;
      return (a.meanMs ?? 1e99) - (b.meanMs ?? 1e99);
    });

    for (const r of sorted) {
      if (r.status === "ok") {
        const rme =
          r.rme != null && Number.isFinite(r.rme) ? r.rme.toFixed(1) : "n/a";
        lines.push(
          `| ${r.tool} | ok | ${fmtMs(r.coldMs)} | ${fmtMs(r.meanMs)} | ${fmtHz(r.hz)} | ${rme} | ${r.notes || ""} |`,
        );
      } else {
        lines.push(
          `| ${r.tool} | error | n/a | n/a | n/a | n/a | ${r.error || r.notes || ""} |`,
        );
      }
    }
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
  --verter-session          Verter session mode
  --verter-fresh-host       new VerterHost every call
  --no-mutate               identical source each iter (cache-demo only; unfair vs Vize)
  --json / --out            output paths
`);
    process.exit(0);
  }

  const samples = loadSamples(args.files);
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

  console.log("Single-file compile · size ladder · unique bodies each iter");
  console.log(
    `  fixtures: ${samples.map((s) => `${s.id}(${fmtBytes(s.bytes)})`).join(" · ")}`,
  );
  console.log(`  targets=${targets.join(",")} env=${args.env} mutate=${args.mutate}`);
  if (benchOpts.time > 0) {
    console.log(
      `  tinybench time=${benchOpts.time}ms warmupTime=${benchOpts.warmupTime || 50}ms`,
    );
  } else {
    console.log(
      `  tinybench iterations=${benchOpts.iterations} warmupIterations=${benchOpts.warmupIterations}`,
    );
  }
  console.log("");

  // Sanity: uniquify must change bytes
  if (args.mutate) {
    const a = uniquifySfc(samples[0].source, 1);
    const b = uniquifySfc(samples[0].source, 2);
    if (a === b || a === samples[0].source) {
      throw new Error("uniquifySfc failed to produce distinct sources");
    }
  }

  const suites = [];
  for (const sample of samples) {
    for (const target of targets) {
      const tools = buildTools({
        isProd,
        vapor: target === "vapor",
        verterMode: args.verterMode,
      });
      console.log(`→ ${sample.id}.vue (${fmtBytes(sample.bytes)}) · ${target}`);
      const suite = await runSuite({
        sample,
        target,
        isProd,
        tools,
        benchOpts,
        mutate: args.mutate,
      });
      suites.push(suite);
      const ranked = [...suite.rows]
        .filter((r) => r.status === "ok")
        .sort((a, b) => (a.meanMs ?? 1e99) - (b.meanMs ?? 1e99));
      for (const r of ranked) {
        console.log(
          `  ${r.tool.padEnd(32)} cold=${fmtMs(r.coldMs).padStart(10)}  mean=${fmtMs(r.meanMs).padStart(10)}  ${fmtHz(r.hz)} ops/s`,
        );
      }
      for (const r of suite.rows.filter((x) => x.status !== "ok")) {
        console.log(`  ${r.tool.padEnd(32)} ERROR ${r.error}`);
      }
      console.log("");
    }
  }

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
      verterMode: args.verterMode,
      mutate: args.mutate,
    },
    notes: [
      "Size ladder fixtures: tiny → small → medium → large → xlarge (see fixtures/compile-single/).",
      "Each timed iteration compiles a **unique** SFC body (nonce in template + script) so Vize content-hash cannot free-ride.",
      "Verter also gets a unique canonicalId suffix derived from body length/identity.",
      "Cold = first unique compile before the measured loop.",
      "Mean ranked ascending (lower latency better) within each fixture × target.",
      "Default: 20 warmup + 100 measured iterations (Verter apple-to-apple style).",
      "Use --no-mutate only to demo cache effects — not for ranking.",
      "Vue 3.5 omitted from vapor suites. Not comparable to bulk fixtures/N throughput.",
    ],
    suites,
  };

  const md = renderMarkdown(data);
  process.stdout.write("\n");
  process.stdout.write(md);

  const resultsDir = join(rootDir, "results");
  mkdirSync(resultsDir, { recursive: true });
  const defaultJson = join(
    resultsDir,
    `compile-single-${process.platform}.json`,
  );
  const defaultMd = join(resultsDir, `compile-single-${process.platform}.md`);
  const jsonPath = args.json ? join(rootDir, args.json) : defaultJson;
  const mdPath = args.out ? join(rootDir, args.out) : defaultMd;
  writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
  writeFileSync(mdPath, md);
  console.log(`Wrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
}

main().catch((err) => {
  console.error(err instanceof Error ? err.stack || err.message : String(err));
  process.exit(1);
});
