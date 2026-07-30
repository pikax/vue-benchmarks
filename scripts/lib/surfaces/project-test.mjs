/**
 * Project-test surface — run a real project's OWN Vitest suite, once as it ships
 * and once per challenger toolchain.
 *
 * ## Why this exists alongside the bundle surface
 *
 * The `bundle` surface builds a generated app shell so the module graph can be
 * held identical while the bundler and plugin vary. That isolates the Vue layer,
 * but it only ever asks whether an SFC can be *resolved and transformed*. A test
 * suite **executes** the compiled component: it mounts it, renders it, and asserts
 * on the output. So it catches a class of defect a build cannot — codegen that
 * parses perfectly and behaves wrongly.
 *
 * It is also the only surface here that answers the practical question: if you
 * dropped Vize or Verter into a real project, would the project still work?
 *
 * ## Baseline is the project's own toolchain
 *
 * The first row is the suite run completely unmodified — whatever the project
 * ships, which for every project in the registry is `@vitejs/plugin-vue`. That is
 * the **baseline**, meaning the reference the others are read against. It is not
 * protected: it is gated on tests-executed exactly like every challenger, and if
 * the project's own suite fails on this machine that is what the row says.
 *
 * ## The swap, and how each row says which one it got
 *
 * - **config override** (preferred) — a generated config imports the project's
 *   real Vitest config, resolves it, and replaces only the Vue plugin in its
 *   `plugins` array. Everything else the project configured — aliases, setup
 *   files, environment, coverage — is untouched, which is the whole point: a
 *   challenger that fails here failed on the project's real terms.
 * - **alias fallback** — for targets whose config cannot be imported. The timed
 *   process runs with a Node resolve hook that redirects `@vitejs/plugin-vue` to
 *   the challenger, so a config generated at runtime picks it up without being
 *   imported or edited. Preferred only when `override` is unavailable: the
 *   override changes one entry of one array, this changes what a specifier means
 *   for the whole process. The hook records every redirect it makes and the row is
 *   ⏭ NOT MEASURED if it recorded none — an unfired hook leaves the project's own
 *   plugin compiling everything, and the run would be published under the
 *   challenger's name with nothing in the output to show it.
 *
 * ## This surface writes into the checkout, and cleans up
 *
 * Every other real-world surface copies the corpus out and never touches the
 * clone. This one cannot: running the project's own suite means running inside
 * the project, with its `node_modules` and its relative config paths. So it writes
 * one clearly-namespaced config file into the target package and removes it in a
 * `finally`. The clone is pinned and re-fetchable, so residue from a hard kill is
 * recoverable with `pnpm fetch:real-world --force`.
 */

import { existsSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { measureVariants, pathWithNodeBins } from "../timing.mjs";
import { spawnSync } from "node:child_process";
import { discoverTestTargets, parseVitestSummary } from "../real-world/test-targets.mjs";
import {
  CHALLENGERS,
  SWAP_MECHANISMS,
  aliasRedirectCensus,
  aliasSwapEnv,
  overrideConfigSource,
  resolveChallengerUrl,
} from "../real-world/plugin-swap.mjs";

// Re-exported because the harness tests assert these are documented, and because
// the project-build surface shares them — one definition, so the two surfaces
// cannot drift apart on what a "swap" means.
export { SWAP_MECHANISMS };

function runVitest(target, { configFile, cwd, timeoutMs, env = {} }) {
  // Invoke vitest directly rather than through the project's npm script: the
  // script may wrap it in cross-env, npm-run-all or a pre-step, and `--config`
  // has to reach vitest itself. The script body is still reported so a reader can
  // see what was bypassed.
  const args = ["run", "--reporter", "default"];
  if (configFile) args.push("--config", configFile);

  const started = performance.now();
  const result = spawnSync("vitest", args, {
    cwd,
    encoding: "utf8",
    maxBuffer: 128 * 1024 * 1024,
    timeout: timeoutMs,
    shell: process.platform === "win32",
    env: {
      ...process.env,
      CI: "1",
      NO_COLOR: "1",
      FORCE_COLOR: "0",
      PATH: pathWithNodeBins(cwd),
      // Last, so an alias swap's NODE_OPTIONS reaches the child. It is built by
      // appending to the inherited value rather than replacing it — see
      // `aliasSwapEnv`.
      ...env,
    },
  });
  const ms = performance.now() - started;
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  return { ms, output, status: result.status, timedOut: result.error?.code === "ETIMEDOUT" };
}

/**
 * Alias-verification gate: a row whose resolution hook never fired is withdrawn.
 *
 * The failure this prevents is the worst one available on these surfaces. A hook
 * that matched nothing leaves the project running its OWN `@vitejs/plugin-vue`
 * from end to end; the run succeeds, the timings look ordinary, and the harness
 * publishes the baseline's number under a challenger's name. Nothing in the output
 * differs, so there is no way to notice it after the fact.
 *
 * `skipped` rather than `unranked`, because an unranked row still shows a
 * bracketed time and this row's time is not a measurement of the tool named on it.
 * Every measured run must have fired, not merely one: a series in which the
 * redirect happened once is a series of mixed toolchains.
 *
 * Exported and pure so it can be tested against synthetic rows — the runtime
 * symptom of getting it wrong is a plausible number, not a crash.
 *
 * @param {Array<object>} results rows from `measureVariants`, mutated in place
 */
export function applyAliasVerificationGate(results) {
  for (const row of results) {
    if (!String(row.id).startsWith("alias-")) continue;
    if (row.status !== "ok" && row.status !== "unranked") continue;
    const samples = row.metaSamples ?? [];
    if (samples.length > 0 && samples.every((m) => m.aliasFired)) continue;
    const fired = samples.filter((m) => m.aliasFired).length;
    row.status = "skipped";
    row.notes = `${row.notes} | ${SWAP_MECHANISMS.aliasNotFired} (the redirect fired on ${fired} of ${samples.length} measured run(s)).`;
  }
  return results;
}

/**
 * Row metadata for one Vitest run.
 *
 * The published artifact is tests PASSED, and it is deliberately the same
 * quantity the work gate is computed on — when the two disagreed, the table
 * showed one number and the ranking decision was made on another. A parsed
 * census with no `passed` clause means zero passed (Vitest omits the clause
 * rather than printing `0 passed`), so it coerces to 0 here; the raw census
 * fields ride along untouched so the gate can still tell "zero" from "absent".
 */
function testMeta(census, status) {
  return { artifact: census.testsPassed ?? 0, ...census, exit: status };
}

function firstFailure(output) {
  const line = String(output)
    .split("\n")
    .find((l) => /FAIL|Error:|Cannot find|SyntaxError/.test(l));
  return (line ?? "").trim().slice(0, 300);
}

/**
 * Work gate: a challenger that PASSED fewer tests than the baseline did less, and
 * doing less is not being faster.
 *
 * Applied after measurement, because the count comes out of the run itself.
 * Exported so it can be tested against synthetic rows: this gate decides whether
 * a row is published as a speed result, and its failure modes are the silent kind
 * — a wrong answer in a table, not a crash.
 *
 * Gated on tests PASSED, not tests COLLECTED, which the first version got wrong in
 * two ways at once. A toolchain whose codegen mounts a broken component still
 * *collects* every test and then fails them, so it cleared a collection gate with
 * the suite entirely red; and the artifact column already published `testsPassed`,
 * so the table showed one number while the ranking decision was made on another.
 *
 * @param {Array<object>} results rows from `measureVariants`, mutated in place
 */
export function applyTestCountGate(results) {
  // Collection census, on EVERY row including the baseline's.
  //
  // A test FILE that fails to collect executes none of its tests, and Vitest
  // still prints a clean-looking file total: `Test Files 31 failed | 31 passed
  // (62)` is the real summary for Hoppscotch's `hoppscotch-common`, where half
  // the 62 spec files cannot even be imported (`@hoppscotch/data` is built by a
  // postinstall the fetch step skips). Reported for the baseline too, because
  // when it is the baseline that is half-collapsed, the number every challenger
  // is measured against covers half the suite — and that is a fact about the
  // corpus on this machine, not about any tool.
  for (const row of results) {
    if (row.status === "skipped" || row.status === "error") continue;
    const sample = row.metaSamples?.[0] ?? null;
    const filesFailed = sample?.filesFailed ?? 0;
    if (filesFailed) {
      row.notes = `${row.notes} | ⓘ ${filesFailed} of ${sample?.files ?? "?"} test FILES failed to collect under this toolchain, so their tests never ran. The gate below compares tests PASSED, which is the quantity that shrinks when a file collapses; this line is here so a half-collected suite is visible rather than inferred from a file total that looks whole.`;
    }
    // The run printed more than one summary block, so the census is the LAST
    // one. Said on the row because the alternative readings differ: a blended
    // census describes no single run, and a reader has no way to know which
    // block a number came from unless the row says.
    if ((sample?.summaryBlocks ?? 1) > 1) {
      row.notes = `${row.notes} | ⓘ vitest printed ${sample.summaryBlocks} summary blocks; the census above is read from the LAST (the aggregate the process exits on), never blended across blocks.`;
    }
  }

  const baselineRow = results.find((r) => r.id === "baseline");
  const baselineSample = baselineRow?.metaSamples?.[0] ?? null;
  const baselinePassed = baselineSample?.testsPassed ?? null;

  for (const row of results) {
    if (row.id === "baseline" || row.status !== "ok") continue;
    const sample = row.metaSamples?.[0] ?? null;
    const collected = sample?.tests ?? null;
    // Vitest omits the `n passed` clause entirely when nothing passed, so a
    // parsed census with `testsPassed: null` means zero passed, not unknown.
    // Only a missing TOTAL means "no census" — see parseVitestSummary.
    const passed = sample?.testsPassed ?? (collected === null ? null : 0);
    const failed = sample?.testsFailed ?? 0;
    const exit = sample?.exit ?? null;

    // Every reason this row is not competing on equal terms, collected before any
    // is applied, so a row that fails two of them says both.
    const reasons = [];

    // A run with no census at all is a gate FAILURE, not a gate that does not
    // apply. `continue`ing over the null was how a run that executed ZERO tests
    // reached the table as `ok` and ranked first.
    if (passed === null || collected === null) {
      reasons.push(
        "no test census could be read from this run — Vitest printed no test total, so there is nothing to compare against the baseline",
      );
    } else if (baselinePassed !== null && passed < baselinePassed) {
      reasons.push(`passed ${passed} tests where the project's own toolchain passed ${baselinePassed}`);
    }
    // A non-zero exit with nothing passing is a suite that collapsed. It is the
    // cheapest possible run and must never be ranked, even when the baseline
    // census is missing and the comparison above could not be made.
    if (exit !== null && exit !== 0 && (passed === null || passed === 0)) {
      reasons.push(`vitest exited ${exit} having passed no tests at all`);
    }

    if (reasons.length > 0) {
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ FAILED TEST-COUNT GATE — ${reasons.join("; ")}. Measured but UNRANKED: a suite that passes fewer tests finishes sooner, and that is not a speed result.`;
    } else if (baselinePassed === null) {
      // The row was not compared to anything. Say so on the row rather than
      // letting it render identically to a row that cleared the gate — an
      // unstated ungated row silently favours whichever tool the harness failed
      // to measure a baseline for.
      row.notes = `${row.notes} | ⓘ TEST-COUNT GATE NOT RUN — the baseline row produced no test census, so this row's test count was never compared against the project's own toolchain. Ranked, but unverified rather than verified-equal.`;
    }

    // Reported whether or not the row was unranked above, and worded as a plain
    // fact. It must not read as an argument for keeping a red suite in the
    // ranking: the count gate decides that, on passes.
    if (failed > 0) {
      row.notes = `${row.notes} | ⚠ ${failed} test(s) FAILED under this toolchain that the project's own toolchain passes — a correctness finding about ${row.package}.`;
    }
  }
  return results;
}

/**
 * @param {import("../real-world/corpus.mjs").ResolvedCorpus} resolved
 */
export async function runProjectTestSurface(resolved, options) {
  const targets = discoverTestTargets(resolved.dir);
  const target = targets[0] ?? null;

  if (!target) {
    return {
      id: "project-test",
      label: `Project test suite — ${resolved.selector}`,
      files: resolved.files.length,
      bytes: resolved.bytes,
      variants: [],
      methodology: [
        `No Vitest target found in ${resolved.project.id} at ${resolved.project.ref}. Discovery looks for a package with a non-watch script that invokes vitest AND vitest as a dependency; a suite driven by jest, playwright or a bespoke runner is not something a Vue plugin can be swapped into, so it is not run rather than run meaninglessly.`,
      ],
    };
  }

  if (!resolved.installed) {
    return {
      id: "project-test",
      label: `Project test suite — ${resolved.selector}`,
      files: resolved.files.length,
      bytes: resolved.bytes,
      variants: [],
      methodology: [
        `Skipped: ${resolved.project.id} has no node_modules. This surface runs the project's own suite inside the project, so its dependencies must be installed — run: pnpm fetch:real-world --projects ${resolved.project.id}`,
      ],
    };
  }

  // A real suite on a real project can be slow; a hung one must not take the run
  // down. Scaled from the caller's budget rather than a bare constant so a quick
  // local pass and a CI pass do not need different code.
  const timeoutMs = Math.max(120_000, (options.testTimeoutMs ?? 0) || 600_000);
  const generated = [];
  // Redirect markers live in the WORK tree, never in the checkout — the alias
  // mechanism's whole appeal over a dependency override is that it leaves the
  // third-party clone untouched.
  const aliasRoot = join(options.workRoot ?? ".", "alias-markers");

  const variants = [
    {
      id: "baseline",
      label: `${target.packageName} — project's own toolchain (baseline)`,
      package: "@vitejs/plugin-vue",
      target: "project-test",
      invocation: "vitest CLI",
      artifactLabel: "tests executed",
      notes: `${SWAP_MECHANISMS.none} · package ${target.relDir} · script "${target.script}": ${target.scriptBody}${target.config ? ` · config ${target.config}` : " · no config file found"}`,
      measure: () => {
        const r = runVitest(target, { configFile: null, cwd: target.dir, timeoutMs });
        const census = parseVitestSummary(r.output);
        if (!census.parsed) {
          throw new Error(
            `vitest produced no summary (exit ${r.status}${r.timedOut ? ", timed out" : ""}): ${firstFailure(r.output)}`,
          );
        }
        return {
          ms: r.ms,
          meta: testMeta(census, r.status),
        };
      },
    },
  ];

  for (const challenger of CHALLENGERS) {
    const base = {
      id: `swap-${challenger.id}`,
      label: `${target.packageName} — ${challenger.label}`,
      package: challenger.package,
      target: "project-test",
      invocation: "vitest CLI",
      artifactLabel: "tests executed",
    };

    // No importable config ⇒ nothing to substitute into, so fall back to the
    // resolution-hook swap. `override` is preferred whenever it is available: it
    // changes exactly one entry of one array, while the alias mechanism changes
    // what a specifier resolves to for the whole process.
    if (!target.canOverride) {
      const resolved = resolveChallengerUrl(challenger.spec);
      if (!resolved.url) {
        variants.push({
          ...base,
          notes: `⏭ NOT MEASURED — ${target.relDir} has no importable Vitest config, so only the alias fallback could apply, and ${resolved.notes}. This is a harness/installation gap, NOT a statement about ${challenger.label}.`,
          skip: true,
        });
        continue;
      }
      const markerPath = join(aliasRoot, `test-${challenger.id}.redirects.txt`);
      variants.push({
        ...base,
        id: `alias-${challenger.id}`,
        notes: `${SWAP_MECHANISMS.alias} · ${resolved.notes} · ${challenger.notes}`,
        measure: () => {
          // Built per run so the marker is cleared each time: a marker left over
          // from the previous iteration would report a redirect THIS run did not
          // make, which is precisely the evidence the gate relies on.
          const swap = aliasSwapEnv({ challengerSpec: challenger.spec, markerPath });
          const r = runVitest(target, {
            configFile: null,
            cwd: target.dir,
            timeoutMs,
            env: swap.env,
          });
          const census = parseVitestSummary(r.output);
          const redirect = aliasRedirectCensus(markerPath);
          if (!census.parsed) {
            throw new Error(
              `vitest produced no summary (exit ${r.status}${r.timedOut ? ", timed out" : ""}): ${firstFailure(r.output)}`,
            );
          }
          return {
            ms: r.ms,
            meta: {
              ...testMeta(census, r.status),
              aliasFired: redirect.fired,
              aliasRedirects: redirect.count,
            },
          };
        },
      });
      continue;
    }

    const configName = `vitest.bench-${challenger.id}.config.mjs`;
    const configPath = join(target.dir, configName);
    generated.push(configPath);
    writeFileSync(
      configPath,
      overrideConfigSource({
        baseConfigFile: target.config,
        challengerSpec: challenger.spec,
        // `vitest run` resolves a function-form config in serve/test mode, which
        // is what the BASELINE row gets. Resolving it as build/production here
        // would hand the challengers a different config — a different plugin
        // list and different aliases — while the table claims one variable
        // changed.
        configEnv: { command: "serve", mode: "test" },
      }),
    );

    variants.push({
      ...base,
      notes: `${SWAP_MECHANISMS.override} · extends ${target.config} · resolved with ConfigEnv {command:'serve', mode:'test'}, matching how vitest resolves it for the baseline · ${challenger.notes} · ${SWAP_MECHANISMS.optionsDropped}`,
      measure: () => {
        const r = runVitest(target, { configFile: configName, cwd: target.dir, timeoutMs });
        const census = parseVitestSummary(r.output);
        if (!census.parsed) {
          throw new Error(
            `vitest produced no summary (exit ${r.status}${r.timedOut ? ", timed out" : ""}): ${firstFailure(r.output)}`,
          );
        }
        return {
          ms: r.ms,
          meta: testMeta(census, r.status),
        };
      },
    });
  }

  let results;
  try {
    results = await measureVariants(variants, {
      runs: options.runs,
      warmups: options.warmups,
      fileCount: resolved.files.length,
    });
  } finally {
    // The clone must not keep a generated config. `finally` rather than a tidy-up
    // at the end, so an aborted run still cleans up.
    for (const path of generated) rmSync(path, { force: true });
    rmSync(aliasRoot, { recursive: true, force: true });
  }

  // Before the count gate: an alias row whose redirect never fired must not be
  // compared against the baseline at all, because it may BE the baseline.
  applyAliasVerificationGate(results);
  applyTestCountGate(results);

  return {
    id: "project-test",
    label: `Project test suite — ${resolved.selector}`,
    files: resolved.files.length,
    bytes: resolved.bytes,
    variants: results,
    methodology: [
      `Target: ${target.packageName} (${target.relDir}) at ${resolved.project.ref}${resolved.sha ? ` / ${resolved.sha.slice(0, 8)}` : ""} — the project's own Vitest suite, unmodified test code.`,
      "This surface EXECUTES compiled components rather than only bundling them, so it catches codegen that parses correctly and behaves wrongly — a class of defect no build surface can reach. It is also the only surface that answers whether a challenger would actually work in a real project.",
      "The first row is the project's suite run completely unmodified. That is the BASELINE — the reference the others are read against — and it is gated on tests-executed exactly like every challenger. If the project's own suite fails on this machine, the row says so.",
      `Swap mechanism is stated per row. Preferred: ${SWAP_MECHANISMS.override}. The generated config replaces ONLY the plugin named 'vite:vue', at that plugin's own index in the array, and throws if it cannot find it — adding a second Vue plugin beside the original would have both compiling every SFC and report a number that means nothing, and hoisting the replacement to the front would change which other plugins see an .vue file first.`,
      `KNOWN INEQUALITY, published on every override row: ${SWAP_MECHANISMS.optionsDropped}. The direction of the resulting error is not measured, so it is not claimed to cancel out.`,
      "The project's config is resolved with the same ConfigEnv vitest uses ({command:'serve', mode:'test'}). A function-form config branches on it, so resolving it as build/production — as an earlier revision did — gave the challengers a different plugin list and different aliases from the baseline while the table claimed one variable changed.",
      `Fallback, used only where a target has no importable config: ${SWAP_MECHANISMS.alias}.`,
      "Alias-verification gate: an alias row is ⏭ NOT MEASURED unless the resolution hook recorded a redirect on EVERY measured run. A hook that matched nothing leaves the project running its own @vitejs/plugin-vue, and the run would be published under a challenger's name with nothing in the output to distinguish it — the worst failure available on this surface, and the only one that cannot be spotted after the fact.",
      "The census is read from the LAST summary block vitest prints, and the file and test lines are always taken from the SAME block. A run can print more than one (a reporter list naming `default` twice, a merged blob report), and the label lines are matched anchored at the start of a line — the previous parser matched each label anywhere in the output with `\\s` able to span newlines, so it could pair a file count from one block with a test count from another and publish a census that describes no single run.",
      "The file census publishes files FAILED as well as the total, because the total alone is misleading. On Hoppscotch's `hoppscotch-common` vitest prints `Test Files 31 failed | 31 passed (62)`: half its 62 spec files never collect, because `@hoppscotch/data` is built by a postinstall that `pnpm fetch:real-world` skips. That is a property of the corpus on this machine and it hits the baseline too, so it is stated on every row rather than only where a challenger loses tests.",
      "Test-count gate: a challenger that PASSES fewer tests than the baseline is UNRANKED, as is one that produced no test census at all or exited non-zero having passed nothing. A suite that fails to collect — or collects and then fails — is faster, and rewarding that would invert the measurement. Passes, not collections, is the gated quantity, and it is the same number the artifact column publishes.",
      "Failing tests are reported as a correctness finding about the tool. The timing of a row that passed fewer tests than the baseline is bracketed and excluded from ranking by the gate above; the failure count is published next to it so the reader sees both.",
      "vitest is invoked directly rather than through the project's npm script, because --config must reach vitest itself; the script that was bypassed is named in the baseline row's notes.",
      "This is the ONE real-world surface that writes into the checkout — running a project's own suite means running inside it. One namespaced config file per challenger is written and removed in a finally; the clone is pinned, so residue from a hard kill clears with `pnpm fetch:real-world --force`.",
      "Vitest starts a fresh process per run, so no run inherits another's transform cache. Tool order is rotated on every warmup and measured run.",
    ],
  };
}
