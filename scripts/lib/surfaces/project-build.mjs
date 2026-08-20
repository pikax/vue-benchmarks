/**
 * Project-build surface — run a real project's OWN production build, once as it
 * ships and once per challenger toolchain.
 *
 * ## How this differs from the `bundle` surface
 *
 * `bundle` builds a generated app shell so the module graph can be held identical
 * while the bundler AND the plugin vary. That is what makes a Rollup number
 * comparable to a webpack number, and it is the right tool for ranking
 * implementations against each other.
 *
 * What it cannot tell you is what a real build costs. A real project's build
 * carries everything the shell deliberately excludes: dependency pre-bundling,
 * chunk splitting across a genuine dependency tree, CSS extraction across a design
 * system, asset pipelines, its own plugin stack. This surface keeps all of it and
 * varies exactly one thing — which plugin compiles the SFCs. The bundler is fixed,
 * because the project's config chose it.
 *
 * So: `bundle` answers "which implementation is faster on equal terms";
 * `project-build` answers "if I swapped this into my actual app, what happens".
 *
 * ## Only where it is reliable
 *
 * Targets must have a literal `vite build` script and an importable `vite.config`.
 * That excludes `nuxt build` and `quasar build` by construction — those generate
 * their Vite config at runtime, so there is no `plugins` array to substitute into,
 * and an attempted swap either silently does nothing or fails for reasons that have
 * nothing to do with the challenger. It also excludes workspace fan-out scripts
 * (`pnpm -r`, `turbo run`), which would time packages with no Vue in them.
 *
 * Fewer packages measured truthfully beats every package measured approximately.
 *
 * ## Output goes to a scratch directory
 *
 * Every build — baseline included — is redirected with `--outDir` to the work tree.
 * The project's own `dist/` is never written, so a benchmark run cannot leave a
 * checkout in a state where the next run measures something different.
 */

import { existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { measureVariants, pathWithNodeBins } from "../timing.mjs";
import { measureCli } from "../measure-cli.mjs";
import { discoverBuildTargets } from "../real-world/test-targets.mjs";
import {
  CHALLENGERS,
  SWAP_MECHANISMS,
  aliasRedirectCensus,
  aliasSwapEnv,
  overrideConfigSource,
  reclassifySwapRefusals,
  resolveChallengerUrl,
} from "../real-world/plugin-swap.mjs";
import { applyAliasVerificationGate } from "./project-test.mjs";
import { stripAnsi } from "../real-world/ansi.mjs";

/** Recursive byte + file census of a build output directory. */
function outputCensus(dir) {
  if (!existsSync(dir)) return { bytes: 0, files: 0 };
  let bytes = 0;
  let files = 0;
  const walk = (d) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, entry.name);
      if (entry.isDirectory()) walk(p);
      else {
        bytes += statSync(p).size;
        files++;
      }
    }
  };
  walk(dir);
  return { bytes, files };
}

async function runViteBuild({ cwd, configFile, outDir, timeoutMs, env = {} }) {
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });

  // `vite build` invoked directly rather than through the project's npm script:
  // the script may wrap it in cross-env or chain a typecheck, and --config/--outDir
  // have to reach vite itself. The bypassed script is named in the row's notes.
  const args = ["build", "--outDir", outDir, "--emptyOutDir"];
  if (configFile) args.push("--config", configFile);

  const result = await measureCli({
    bin: "vite",
    args,
    cwd,
    timeoutMs,
    shell: process.platform === "win32",
    sampleRss: true,
    env: {
      CI: "1",
      NODE_ENV: "production",
      NO_COLOR: "1",
      FORCE_COLOR: "0",
      PATH: pathWithNodeBins(cwd),
      // Last, so an alias swap's NODE_OPTIONS reaches the child. It is built by
      // appending to the inherited value rather than replacing it — see
      // `aliasSwapEnv`.
      ...env,
    },
  });
  const output = result.combined ?? `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return {
    ms: result.ms,
    output,
    status: result.status,
    timedOut: Boolean(result.error && /timeout/i.test(result.error.message)),
    rssBytes: result.rssBytes,
    ...outputCensus(outDir),
  };
}

/**
 * Pull the meaningful diagnostic out of a Vite build's output.
 *
 * Ordered patterns rather than one regex: the naive version matched the first
 * line containing "Transform" and reported `transforming...` — Vite's progress
 * spinner — as the cause of every failure. That is worse than no message,
 * because it looks like one.
 */
function firstFailure(output) {
  const lines = String(output)
    .split("\n")
    .map((l) => stripAnsi(l).trim())
    .filter(Boolean)
    // Progress chatter is never a cause.
    .filter((l) => !/^(transforming|rendering|computing|building|vite v)/i.test(l));

  const ranked = [
    /UNLOADABLE_DEPENDENCY|Could not load|Could not resolve|cannot find the file/i,
    /PARSE_ERROR|SyntaxError|Unexpected token|Expected /i,
    /Transform failed|Module (parse|build) failed/i,
    /\berror\b/i,
    /\bfailed\b/i,
  ];
  for (const pattern of ranked) {
    const index = lines.findIndex((l) => pattern.test(l));
    if (index === -1) continue;
    let hit = lines[index];
    // A bare header ("error during build:") is content-free — the cause is on
    // the next line, and publishing the header alone turned naive-ui's
    // project-build rejection into a reason that explained nothing.
    if (/:$/.test(hit) && lines[index + 1]) hit = `${hit} ${lines[index + 1]}`;
    return hit.slice(0, 300);
  }
  return (lines[lines.length - 1] ?? "").slice(0, 300);
}

/**
 * Find a target whose OWN build actually succeeds here, before measuring anything.
 *
 * This is what "easy and reliable" has to mean in practice. Hoppscotch's
 * `hoppscotch-sh-admin` passes every static check — a literal `vite build` script,
 * a real `vite.config.ts`, 56 SFCs — and still cannot build in this environment,
 * because it imports `src/helpers/backend/graphql`: a GraphQL-codegen artifact
 * produced by a `postinstall` script that the fetch step skips with
 * `--ignore-scripts`.
 *
 * Without this pre-flight the surface published four ❌ rows for that package,
 * baseline included, which reads as "all three challengers failed" when in fact
 * nothing could build at all. A target whose own build fails is not a measurement
 * of any tool, so candidates are tried in order and the first that genuinely
 * builds is the one measured. What was rejected, and why, is reported.
 */
async function selectBuildableTarget(targets, { outRoot, timeoutMs }) {
  const rejected = [];
  for (const target of targets) {
    const outDir = join(outRoot, `preflight-${target.packageName.replace(/[^a-z0-9]+/gi, "-")}`);
    try {
      const r = await runViteBuild({ cwd: target.dir, configFile: null, outDir, timeoutMs });
      if (r.status === 0 && r.files > 0) return { target, rejected };
      rejected.push({
        target,
        reason: `own build exited ${r.status}${r.timedOut ? " (timed out)" : ""} with ${r.files} output files — ${firstFailure(r.output)}`,
      });
    } catch (error) {
      rejected.push({
        target,
        reason: String(error instanceof Error ? error.message : error).slice(0, 300),
      });
    } finally {
      rmSync(outDir, { recursive: true, force: true });
    }
  }
  return { target: null, rejected };
}

/**
 * @param {import("../real-world/corpus.mjs").ResolvedCorpus} resolved
 */
export async function runProjectBuildSurface(resolved, options) {
  const label = `Project build (own config) — ${resolved.selector}`;
  const base = {
    id: "project-build",
    label,
    files: resolved.files.length,
    bytes: resolved.bytes,
  };

  if (!resolved.installed) {
    return {
      ...base,
      variants: [],
      methodology: [
        `Skipped: ${resolved.project.id} has no node_modules. This surface runs the project's own build inside the project, so its dependencies must be installed — run: pnpm fetch:real-world --projects ${resolved.project.id}`,
      ],
    };
  }

  const candidates = discoverBuildTargets(resolved.dir);
  const timeoutMs = Math.max(180_000, (options.buildTimeoutMs ?? 0) || 900_000);
  const outRoot = join(options.workRoot, "project-build");
  const generated = [];
  // Redirect markers live in the WORK tree, never in the checkout — the alias
  // mechanism's whole appeal over a dependency override is that it leaves the
  // third-party clone untouched.
  const aliasRoot = join(options.workRoot, "alias-markers");

  if (candidates.length === 0) {
    return {
      ...base,
      variants: [],
      methodology: [
        `No reliably swappable build target in ${resolved.project.id} at ${resolved.project.ref}. A target needs a literal \`vite build\` script, an importable vite.config, and SFCs beneath it. Excluded by design: \`nuxt build\` / \`quasar build\` (Vite config generated at runtime, so there is no plugins array to substitute into) and workspace fan-out scripts (\`pnpm -r\`, \`turbo run\`, which would time packages containing no Vue). Measuring those approximately would be worse than not measuring them.`,
      ],
    };
  }

  // Pre-flight before building the variant list, so a target that cannot build at
  // all never produces challenger rows. See selectBuildableTarget.
  const { target, rejected } = await selectBuildableTarget(candidates, { outRoot, timeoutMs });
  const rejectedNotes = rejected.map(
    (r) =>
      `Candidate ${r.target.packageName} (${r.target.relDir}, ${r.target.sfcs} SFCs) was REJECTED before measurement: ${r.reason}. No challenger rows are emitted for a target whose own build fails — that would report a broken target as three tool failures.`,
  );

  if (!target) {
    return {
      ...base,
      variants: [],
      methodology: [
        `No build target in ${resolved.project.id} could build with its OWN toolchain in this environment, so there is no baseline to compare anything against and no rows are published.`,
        ...rejectedNotes,
        'A common cause is code generation: several projects import files produced by a `postinstall` script, and `pnpm fetch:real-world` installs with `--ignore-scripts` because postinstall scripts in this set download browsers and build native modules that no surface here uses. Such a package is not "easy and reliable" to build, which is the bar this surface holds itself to.',
      ],
    };
  }

  const variants = [
    {
      id: "baseline",
      label: `${target.packageName} — project's own toolchain (baseline)`,
      package: "@vitejs/plugin-vue",
      baseline: true,
      baselineLabel: "project Vue toolchain",
      target: "project-build",
      invocation: "vite build CLI",
      artifactLabel: "output bytes",
      notes: `${SWAP_MECHANISMS.none} · package ${target.relDir} · script "${target.script}": ${target.scriptBody} · config ${target.config ?? "none found"}`,
      measure: async ({ phase, iteration }) => {
        const outDir = join(outRoot, `baseline-${phase}-${iteration}`);
        try {
          const r = await runViteBuild({ cwd: target.dir, configFile: null, outDir, timeoutMs });
          if (r.status !== 0 || r.files === 0) {
            throw new Error(
              `vite build exited ${r.status}${r.timedOut ? " (timed out)" : ""} with ${r.files} output files: ${firstFailure(r.output)}`,
            );
          }
          return {
            ms: r.ms,
            meta: { artifact: r.bytes, outputFiles: r.files, exit: r.status, rssBytes: r.rssBytes },
          };
        } finally {
          rmSync(outDir, { recursive: true, force: true });
        }
      },
    },
  ];

  for (const challenger of CHALLENGERS) {
    const row = {
      id: `swap-${challenger.id}`,
      label: `${target.packageName} — ${challenger.label}`,
      package: challenger.package,
      target: "project-build",
      invocation: "vite build CLI",
      artifactLabel: "output bytes",
    };

    // No importable config ⇒ nothing to substitute into, so fall back to the
    // resolution-hook swap. `override` is preferred whenever it is available: it
    // changes exactly one entry of one array, while the alias mechanism changes
    // what a specifier resolves to for the whole process.
    if (!target.canOverride) {
      const resolved = resolveChallengerUrl(challenger.spec);
      if (!resolved.url) {
        variants.push({
          ...row,
          notes: `⏭ NOT MEASURED — ${target.relDir} has no importable vite.config, so only the alias fallback could apply, and ${resolved.notes}. This is a harness/installation gap, NOT a statement about ${challenger.label}.`,
          skip: true,
        });
        continue;
      }
      const markerPath = join(aliasRoot, `build-${challenger.id}.redirects.txt`);
      variants.push({
        ...row,
        id: `alias-${challenger.id}`,
        notes: `${SWAP_MECHANISMS.alias} · ${resolved.notes} · ${challenger.notes}`,
        measure: async ({ phase, iteration }) => {
          const outDir = join(outRoot, `alias-${challenger.id}-${phase}-${iteration}`);
          try {
            // Built per run so the marker is cleared each time: a marker left
            // over from the previous iteration would report a redirect THIS run
            // did not make, and the gate reads it as evidence.
            const swap = aliasSwapEnv({ challengerSpec: challenger.spec, markerPath });
            const r = await runViteBuild({
              cwd: target.dir,
              configFile: null,
              outDir,
              timeoutMs,
              env: swap.env,
            });
            const redirect = aliasRedirectCensus(markerPath);
            if (r.status !== 0 || r.files === 0) {
              throw new Error(
                `vite build exited ${r.status}${r.timedOut ? " (timed out)" : ""} with ${r.files} output files${
                  redirect.fired
                    ? ""
                    : " AND the alias redirect never fired, so this may not be this tool's failure at all"
                }: ${firstFailure(r.output)}`,
              );
            }
            return {
              ms: r.ms,
              meta: {
                artifact: r.bytes,
                outputFiles: r.files,
                exit: r.status,
                rssBytes: r.rssBytes,
                aliasFired: redirect.fired,
                aliasRedirects: redirect.count,
              },
            };
          } finally {
            rmSync(outDir, { recursive: true, force: true });
          }
        },
      });
      continue;
    }

    const configName = `vite.bench-${challenger.id}.config.mjs`;
    const configPath = join(target.dir, configName);
    generated.push(configPath);
    writeFileSync(
      configPath,
      overrideConfigSource({
        baseConfigFile: target.config,
        challengerSpec: challenger.spec,
        // `vite build` resolves a function-form config as build/production, which
        // is what the BASELINE row gets. Stated explicitly rather than inherited
        // from a default, because project-test needs serve/test and a shared
        // default would be wrong for one of the two surfaces.
        configEnv: { command: "build", mode: "production" },
      }),
    );

    variants.push({
      ...row,
      notes: `${SWAP_MECHANISMS.override} · extends ${target.config} · resolved with ConfigEnv {command:'build', mode:'production'}, matching how vite build resolves it for the baseline · ${challenger.notes} · ${SWAP_MECHANISMS.optionsDropped}`,
      measure: async ({ phase, iteration }) => {
        const outDir = join(outRoot, `${challenger.id}-${phase}-${iteration}`);
        try {
          const r = await runViteBuild({
            cwd: target.dir,
            configFile: configName,
            outDir,
            timeoutMs,
          });
          if (r.status !== 0 || r.files === 0) {
            throw new Error(
              `vite build exited ${r.status}${r.timedOut ? " (timed out)" : ""} with ${r.files} output files: ${firstFailure(r.output)}`,
            );
          }
          return {
            ms: r.ms,
            meta: { artifact: r.bytes, outputFiles: r.files, exit: r.status, rssBytes: r.rssBytes },
          };
        } finally {
          rmSync(outDir, { recursive: true, force: true });
        }
      },
    });
  }

  let results;
  try {
    results = await measureVariants(variants, {
      runs: options.runs,
      warmups: options.warmups,
      fileCount: target.sfcs,
    });
  } finally {
    // The checkout must not keep a generated config, even if the run is aborted.
    for (const path of generated) rmSync(path, { force: true });
    rmSync(outRoot, { recursive: true, force: true });
    rmSync(aliasRoot, { recursive: true, force: true });
  }

  reclassifySwapRefusals(results);

  // Before the output-size gate: an alias row whose redirect never fired must not
  // be compared against the baseline at all, because it may BE the baseline.
  applyAliasVerificationGate(results);

  // Output-size gate. A challenger that emits materially less than the project's
  // own toolchain did less work, and doing less is not being faster. The 5%
  // tolerance is not slack for the tools — it absorbs legitimate codegen
  // differences (helper naming, hoisting choices) that do not change what the
  // bundle contains. A tool that drops a chunk is far outside it.
  const baselineRow = results.find((r) => r.id === "baseline");
  const baselineBytes = baselineRow?.artifactMedian ?? null;
  for (const row of results) {
    if (row.id === "baseline" || row.status !== "ok") continue;
    if (!baselineRow || baselineRow.status !== "ok") {
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ PROJECT VUE REFERENCE INVALID — the project's own Vue build did not produce a valid measured result, so this candidate timing remains visible but cannot rank.`;
      continue;
    }
    const bytes = row.artifactMedian ?? null;
    if (baselineBytes === null || bytes === null || baselineBytes === 0) {
      // Say the gate did not run, on the row. An ungated row rendered
      // identically to a gated one, which quietly favours whichever tool the
      // harness failed to produce a baseline artifact for — the same reasoning
      // `applyCodegenGates` uses on the compile surface.
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ OUTPUT-SIZE GATE UNKNOWN — ${
        baselineBytes === null || baselineBytes === 0
          ? "the baseline row produced no output-byte census to anchor against"
          : "this row produced no output-byte census"
      }, so its output size was never compared with the project's own toolchain. Measured but UNRANKED.`;
      continue;
    }
    const ratio = bytes / baselineBytes;
    if (ratio < 0.95) {
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ FAILED OUTPUT-SIZE GATE — emitted ${bytes.toLocaleString()} bytes against the project's own ${baselineBytes.toLocaleString()} (${Math.round((1 - ratio) * 100)}% less). Measured but UNRANKED: a build that emits materially less is not a faster build until the difference is explained.`;
    } else if (ratio > 1.25) {
      // Not a gate failure — more output is not cheating — but a 25%+ swing is a
      // fact a reader needs, since it changes what shipped.
      row.notes = `${row.notes} | ⓘ emitted ${Math.round((ratio - 1) * 100)}% MORE than the project's own toolchain (${bytes.toLocaleString()} vs ${baselineBytes.toLocaleString()} bytes) — same corpus, different codegen size.`;
    }
  }

  return {
    ...base,
    variants: results,
    methodology: [
      `Target: ${target.packageName} (${target.relDir}) at ${resolved.project.ref}${resolved.sha ? ` / ${resolved.sha.slice(0, 8)}` : ""} — ${target.sfcs} SFCs, built with the project's OWN vite.config and its own plugin stack.`,
      "The target was pre-flighted: its own build was run untimed first, and it is measured only because that succeeded. A target whose own build fails publishes no rows at all, because four failing rows with a failing baseline reads as three tool failures when nothing could build.",
      ...rejectedNotes,
      "Unlike the `bundle` surface, nothing here is held constant except the corpus and the bundler: dependency pre-bundling, chunk splitting, CSS extraction and the project's other plugins are all in the measurement, because they are all in a real build. The single variable is which plugin compiles the SFCs.",
      "Read this surface for 'what would swapping this cost me in my app'. Read `bundle` for 'which implementation is faster on equal terms'. They are not comparable to each other and neither supersedes the other.",
      `Only reliably swappable targets are measured: a literal \`vite build\` script plus an importable vite.config plus SFCs beneath it. \`nuxt build\` and \`quasar build\` are excluded because they generate their Vite config at runtime, leaving no plugins array to substitute into; workspace fan-out scripts are excluded because they would time packages with no Vue in them.`,
      "The first row is the project's own build, unmodified. That is the BASELINE — the reference the others are read against — and it is gated on output size exactly like every challenger. If the project's own build fails on this machine, the row says so.",
      `Fallback, used only where a target has no importable vite.config: ${SWAP_MECHANISMS.alias}.`,
      "Alias-verification gate: an alias row is ⏭ NOT MEASURED unless the resolution hook recorded a redirect on EVERY measured run. A hook that matched nothing leaves the project running its own @vitejs/plugin-vue, and the run would be published under a challenger's name with nothing in the output to distinguish it. The hook's own reach was measured rather than assumed: matching only the bare specifier intercepted a real `vite build` NOT AT ALL, because Vite resolves a bundled config's externalised imports to absolute paths before evaluating it, so the rule matches the package's path segment as well.",
      `Swap mechanism is stated per row. Preferred: ${SWAP_MECHANISMS.override}. It replaces ONLY the plugin named 'vite:vue', at that plugin's own index in the array, and throws if it cannot find it — adding a second Vue plugin beside the original would have both compiling every SFC and report a number that means nothing, and hoisting the replacement to the front would change which other plugins see an .vue file first.`,
      `KNOWN INEQUALITY, published on every override row: ${SWAP_MECHANISMS.optionsDropped}. The direction of the resulting error is not measured, so it is not claimed to cancel out.`,
      "The project's config is resolved with the same ConfigEnv the timed tool uses ({command:'build', mode:'production'} here). A function-form config branches on it, so resolving it any other way would give the challengers a different config from the baseline's while the table claims one variable changed.",
      "Output-size gate: a challenger emitting more than 5% fewer bytes than the baseline is UNRANKED. The tolerance absorbs legitimate codegen differences, not a dropped chunk. Emitting materially MORE is annotated rather than gated — more output is not cheating, but it changes what shipped.",
      "Every build, baseline included, is redirected with --outDir into the work tree. The project's own dist/ is never written, so no run can leave the checkout in a state that changes the next run.",
      "vite is invoked directly rather than through the project's npm script, because --config and --outDir must reach vite itself; the bypassed script is named in the baseline row's notes.",
      "One namespaced config file per challenger is written into the target package and removed in a finally. The clone is pinned, so residue from a hard kill clears with `pnpm fetch:real-world --force`.",
      "Each measured run is a fresh vite process with an empty output directory, so no run inherits another's cache. Tool order is rotated on every warmup and measured run.",
    ],
  };
}
