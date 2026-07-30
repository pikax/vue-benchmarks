/**
 * HMR / dev-server surface — what the toolchain costs while you are working.
 *
 * Two questions, measured separately because they are different costs:
 *
 * - **Dev cold start** — `createServer()` + `listen()` + serving the entry
 *   module. What you wait for when you run `vite dev`.
 * - **HMR turnaround** — edit one SFC, wait for the update to be announced and
 *   the new module to come back. What you wait for on every keystroke-to-save.
 *
 * ## Why this is Vite-family only
 *
 * HMR is not a portable concept. Vite serves ONE re-transformed module over its
 * own WebSocket protocol; webpack and Rspack rebuild an incremental chunk and
 * ship a `.hot-update.json` through a different client. Those two numbers are
 * not the same measurement, and putting them in one table would rank a protocol
 * difference while appearing to rank Vue plugins. The webpack-family rows are
 * therefore absent rather than approximated — see the surface methodology.
 *
 * ## Why the filesystem watcher is bypassed
 *
 * The change is written to disk (so the content the plugin re-reads is real) and
 * then handed to the watcher directly via `watcher.emit("change", …)`. Waiting
 * for chokidar to notice would fold the OS's file-watch debounce — tens to
 * hundreds of milliseconds, wildly different across platforms and unrelated to
 * any tool here — into every row. The measured region starts when the toolchain
 * is told about the change.
 */

import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { GATE_IS_THE_WARM_PASS, measureVariants } from "../timing.mjs";
import { corpusOnlyResolver, customBlockSink } from "../real-world/app-shell.mjs";
import { stripAnsi } from "../real-world/ansi.mjs";
import { VUE_PLUGINS, enabledBundlers, prepareBundleApp } from "./bundle.mjs";

/**
 * The integration that is the BASELINE for the Vite family on this surface.
 *
 * Not a favourite: it is the reference each group is read against, and it is
 * gated and bracketed on exactly the same terms as the challengers. Its identity
 * matters here because a table whose baseline row is missing still prints a
 * "vs fastest" of 1.00x for whatever did run, and that reads as "beat the
 * official plugin" when the official plugin never produced a row.
 */
const BASELINE_PLUGIN_ID = "plugin-vue";

/** A dev server that never comes up must not hang the whole benchmark. */
const READY_TIMEOUT_MS = 60_000;
const HMR_TIMEOUT_MS = 30_000;

function withTimeout(promise, ms, what) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${what} exceeded ${ms} ms`)), ms);
    }),
  ]);
}

/**
 * Normalise a probe failure for publication.
 *
 * Goes through the shared `stripAnsi` rather than a local pattern. The local one
 * was a hand-written regex with a raw ESC byte in the source — invisible in
 * review, silently mangled by anything that rewrites the file, and the same shape
 * that once collapsed to matching a bare `m` and deleted characters from the very
 * diagnostics these rows quote verbatim.
 */
function cleanProbeError(error) {
  return stripAnsi(String(error instanceof Error ? error.message : error))
    .split("\n")
    .slice(0, 3)
    .join(" ")
    .slice(0, 400);
}

export async function startServer({ createServer, factory, appDir }) {
  const server = await createServer({
    root: appDir,
    configFile: false,
    logLevel: "silent",
    // Same custom-block sink as the bundle surface: a dev server asked for a
    // <markdown> or <playground-*> block the shell has no consumer for must not
    // blame the Vue plugin for the parse error.
    plugins: [corpusOnlyResolver(appDir), factory(), customBlockSink()],
    // Everything outside the corpus is external, so there is nothing to
    // pre-bundle. Leaving discovery on would time esbuild/rolldown scanning a
    // dependency tree this app does not have.
    optimizeDeps: { noDiscovery: true, include: [] },
    server: {
      host: "127.0.0.1",
      port: 0,
      strictPort: false,
      // Watching is driven manually (see the docblock) — so watch NOTHING,
      // literally. With warm per-row sessions, several servers are alive over
      // the SAME staged directory, and native fs events delivered one row's
      // edits and restores to every OTHER row's server: background invalidations
      // raced the manual emit, and unplugin-vue and vize rows timed out waiting
      // for updates their server had already spent on someone else's write. A
      // chokidar that matches no files keeps the watcher object (and the manual
      // `watcher.emit("change", …)` path) fully functional while making each
      // session hermetic.
      watch: { usePolling: false, ignored: ["**/*"] },
    },
  });
  await server.listen();
  const address = server.httpServer?.address();
  const port = typeof address === "object" && address ? address.port : null;
  return { server, port };
}

/** Open Vite's HMR WebSocket and resolve once the server says `connected`. */
export async function connectHmr(port) {
  const socket = new WebSocket(`ws://127.0.0.1:${port}/`, "vite-hmr");
  const queue = [];
  let notify = null;

  socket.addEventListener("message", (event) => {
    let payload;
    try {
      payload = JSON.parse(String(event.data));
    } catch {
      return;
    }
    queue.push(payload);
    if (notify) {
      const fn = notify;
      notify = null;
      fn();
    }
  });

  const next = async (predicate) => {
    for (;;) {
      const index = queue.findIndex(predicate);
      if (index !== -1) return queue.splice(index, 1)[0];
      await new Promise((resolve) => {
        notify = resolve;
      });
    }
  };

  await withTimeout(
    new Promise((resolve, reject) => {
      if (socket.readyState === WebSocket.OPEN) return resolve();
      socket.addEventListener("open", () => resolve(), { once: true });
      socket.addEventListener("error", () => reject(new Error("HMR socket error")), { once: true });
    }),
    READY_TIMEOUT_MS,
    "HMR socket open",
  );

  return {
    socket,
    next,
    /** Drop anything buffered so one measurement cannot read another's update. */
    drain: () => {
      queue.length = 0;
    },
    close: () => {
      try {
        socket.close();
      } catch {
        // A socket that is already gone is the desired state.
      }
    },
  };
}

/**
 * Choose the SFC to edit.
 *
 * It must have a `<template>` block: editing the template is what produces a
 * genuine hot *update*. A change confined to `<script setup>` makes Vue's plugin
 * decide the component cannot be patched and issue a full reload instead, which
 * is a different — and much cheaper on the server — code path. Measuring a mix
 * of the two across cells would compare code paths, not implementations.
 */
function pickProbeFiles(appDir, files, count = 2) {
  const probes = [];
  for (const rel of files) {
    try {
      const source = readFileSync(join(appDir, rel), "utf8");
      if (source.includes("<template>")) probes.push({ rel, original: source });
      if (probes.length >= count) break;
    } catch {
      // Unreadable file: try the next one.
    }
  }
  return probes;
}

/**
 * Close a dev server without letting it hold the cell hostage.
 *
 * `server.close()` was the one unbounded await on this surface — every other
 * step is wrapped in withTimeout. A server whose watcher or esbuild service
 * refuses to die is abandoned: the child process exits at the end of the cell
 * and takes it along, which is cheaper than a wedged cell burning its 45-minute
 * budget on a teardown nobody measures.
 */
async function closeServer(server) {
  try {
    await withTimeout(Promise.resolve(server.close()), 10_000, "dev server close");
  } catch {
    // Abandoned to child-process exit, see above.
  }
}

function editTemplate(source, iteration) {
  // A comment immediately inside <template> changes the template block's content
  // without changing what the component renders, so repeated iterations stay
  // equivalent in cost rather than growing the component.
  return source.replace("<template>", `<template>\n  <!-- hmr-probe-${iteration} -->`);
}

/**
 * Load the modules an editor would already have open before measuring an edit.
 *
 * Vite is lazy: `transformRequest('/bench-entry.js')` compiles the entry and
 * nothing it imports. The probe SFC is therefore absent from the module graph,
 * and a change to a module the server has never seen affects nothing, so no
 * update is sent at all — the first version of this surface timed out after 30 s
 * on three of four plugins and attributed it to them. Warming the probe module
 * is also the honest starting state: nobody hot-reloads a file they have not
 * loaded.
 */
export async function warmProbeModule(server, probe) {
  const url = `/${probe.rel.split("\\").join("/")}`;
  await withTimeout(server.transformRequest(url), READY_TIMEOUT_MS, "probe module transform");

  // Transforming the SFC is not enough on every Vite major. An SFC compiles to a
  // module that *imports* its own template and style blocks
  // (`…?vue&type=template&…`), and on Vite 7 the template sub-module has to be in
  // the graph before a template edit produces an `update` — without this, Vite 7
  // × @vitejs/plugin-vue and × unplugin-vue both sat until the 30 s timeout and
  // were reported as tool failures, while Vite 8 passed. That asymmetry was the
  // harness, not the plugins.
  //
  // The sub-request query differs per plugin, so they are discovered from the
  // module graph rather than constructed. Best-effort throughout: Vite 8 already
  // works without it, and `moduleGraph` is legacy API there.
  try {
    const graph = server.moduleGraph;
    const mod = graph?.getModuleByUrl ? await graph.getModuleByUrl(url) : null;
    const imported = mod?.importedModules;
    if (!imported) return;
    for (const child of imported) {
      // Only this component's own sub-blocks — not everything it imports, which
      // would warm half the corpus and change what "cold" means.
      if (child?.url && child.url.split("?")[0] === url) {
        await server.transformRequest(child.url).catch(() => {});
      }
    }
  } catch {
    // A Vite build without the legacy module graph loses only the extra warm.
  }
}

/**
 * One HMR round trip: announce the change, wait for the update message, then
 * fetch the module the server says changed.
 *
 * Both halves are reported. The WebSocket notification alone is the server
 * deciding *what* changed; the fetch is it actually re-compiling the SFC. A
 * plugin can be quick at the first and slow at the second, and a single number
 * would hide that.
 */
export async function hmrRoundTrip({ server, hmr, appDir, probe, iteration, port }) {
  const abs = join(appDir, probe.rel);
  hmr.drain();
  writeFileSync(abs, editTemplate(probe.original, iteration));

  const started = performance.now();
  server.watcher.emit("change", abs);

  const message = await withTimeout(
    hmr.next((m) => m.type === "update" || m.type === "full-reload"),
    HMR_TIMEOUT_MS,
    // Worded so the report cannot turn a harness gap into a tool verdict. No
    // message arriving means the server did not consider the module dirty; with
    // no browser executing the app, whether that happens depends on the Vite
    // major as much as on the plugin. Observed: Vite 8 answers for all four
    // plugins, Vite 7 answers only for @vizejs/vite-plugin. That asymmetry is
    // the probe's, and a row saying so is worth more than a row blaming
    // @vitejs/plugin-vue for not supporting HMR.
    "no HMR message (headless probe limitation, not a tool result)",
  );
  const notifyMs = performance.now() - started;

  let fetchedBytes = 0;
  const update = message.type === "update" ? message.updates?.[0] : null;
  if (update?.path) {
    const url = `http://127.0.0.1:${port}${update.path}${update.path.includes("?") ? "&" : "?"}t=${Date.now()}`;
    const response = await withTimeout(fetch(url), HMR_TIMEOUT_MS, "HMR module fetch");
    fetchedBytes = (await response.text()).length;
  }
  const totalMs = performance.now() - started;

  return { notifyMs, totalMs, kind: message.type, fetchedBytes };
}

async function loadCell(bundler, plugin) {
  try {
    const b = await import(bundler.spec);
    if (typeof b.createServer !== "function") {
      // Worded as the harness's boundary, not a tool capability claim: webpack
      // and Rspack HAVE dev servers, just not an in-process createServer() this
      // probe can drive — and the row must not read as "<plugin> lacks HMR".
      return {
        error: `⏭ NOT MEASURED — ${bundler.spec} exposes no in-process createServer() API for this probe to drive (its dev server lives in a separate package with a different protocol; see methodology: this surface is Vite-family only). Not a statement about ${plugin.label}.`,
      };
    }
    const p = await import(plugin.spec);
    if (typeof p.default !== "function") return { error: `${plugin.spec} exports no default factory` };
    return { createServer: b.createServer, factory: p.default };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Say so, on every surviving row, when a ranked table has no baseline row.
 *
 * The report ranks within a comparison class, one class per bundler. If the
 * baseline row for that bundler did not produce a ranked measurement — skipped,
 * errored, or bracketed by a gate — then the "vs fastest" column of the rows that
 * survived is computed among challengers only, and the top one prints **1.00x**.
 * Read normally, that says "fastest here", which a reader will take as "at least
 * as fast as the official plugin". It is not: the official plugin is absent.
 *
 * Observed on this surface, so this is not hypothetical: on Vite 7 the headless
 * probe receives an update message only for one plugin, so its HMR table could
 * show a single challenger row at 1.00x with @vitejs/plugin-vue nowhere in it.
 *
 * The rows are labelled rather than suppressed: the measurement is real and worth
 * publishing, it just cannot be read as a comparison against the reference.
 */
function labelBaselinelessTables(rows, tableName) {
  const byBundler = new Map();
  for (const row of rows) {
    if (!byBundler.has(row.target)) byBundler.set(row.target, []);
    byBundler.get(row.target).push(row);
  }
  for (const [, group] of byBundler) {
    const baseline = group.find((r) => String(r.id).endsWith(`__${BASELINE_PLUGIN_ID}`));
    if (baseline && baseline.status === "ok") continue;
    const why = !baseline
      ? "it produced no row at all"
      : baseline.status === "unranked"
        ? "its row failed a gate and is unranked"
        : `its row is ${baseline.status}`;
    for (const row of group) {
      if (row.status !== "ok") continue;
      row.notes = `${row.notes} | ⚠ NO BASELINE IN THIS TABLE — @vitejs/plugin-vue, the reference implementation for this bundler, is not ranked here (${why}), so the ${tableName} "vs fastest" column compares the challengers with each other ONLY. A 1.00x here means "fastest of the rows that ran", NOT "faster than the official plugin".`;
    }
  }
}

/**
 * @param {import("../real-world/corpus.mjs").ResolvedCorpus} resolved
 */
export async function runHmrSurface(resolved, options) {
  const workRoot = options.workRoot;
  const label = resolved.selector.replace(/[^a-z0-9]+/gi, "-");
  // prepareBundleApp writes the entry itself, over the preflight-surviving file
  // list — re-writing it here with the RAW corpus put the staged-out files back
  // into every cell's graph and re-created the ❌ rows the preflight exists to
  // prevent. Its exclusions and closure counts are disclosed in the methodology.
  const { appDir, entryFiles, excludedFiles, closureCopied } = await prepareBundleApp(
    resolved,
    workRoot,
    `${label}-hmr`,
  );
  const fileCount = entryFiles.length;

  // A COUPLE of probe files, not one: each measured run does one round trip per
  // probe and reports the mean, so the number is not the personality of a single
  // component. The gate still qualifies cells on the first probe only — a gate
  // per probe would double the untimed setup for no extra verdict.
  const probes = pickProbeFiles(appDir, entryFiles);
  const probe = probes[0] ?? null;
  if (!probe) {
    return {
      id: "hmr",
      label: `HMR / dev server — ${resolved.selector}`,
      files: fileCount,
      bytes: resolved.bytes,
      variants: [],
      methodology: [
        "Skipped: no corpus SFC contains a <template> block, so there is no change that produces a hot update rather than a full reload.",
      ],
    };
  }

  const startVariants = [];
  const hmrVariants = [];
  // Warm sessions opened by the HMR rows, closed after the LAST measured run —
  // measureVariants rotates tool order across runs, so a row cannot close its
  // own server until the whole table is done with it.
  const hmrSessions = [];

  for (const bundler of enabledBundlers()) {
    for (const plugin of VUE_PLUGINS) {
      const id = `${bundler.id}__${plugin.id}`;
      const rowLabel = `${bundler.label} × ${plugin.label}`;
      const cell = await loadCell(bundler, plugin);
      const base = {
        package: plugin.package,
        target: bundler.id,
        engine: bundler.engine,
        invocation: "in-process dev server",
        threading: "bundler default",
      };

      if (cell.error) {
        startVariants.push({ ...base, id: `start__${id}`, label: rowLabel, notes: cell.error, skip: true });
        hmrVariants.push({ ...base, id: `hmr__${id}`, label: rowLabel, notes: cell.error, skip: true });
        continue;
      }

      // One untimed probe run per cell: a server that cannot start, or a plugin
      // that cannot compile this third-party corpus, is excluded before the
      // timing loop rather than producing five identical stack traces.
      //
      // TWO gates, deliberately independent. They used to be one, so any failure
      // in the HMR round trip skipped the dev-cold-start row as well. That threw
      // away a measurement that had already succeeded — the server DID start and
      // the entry DID transform — and it did so asymmetrically: whether this
      // headless probe ever receives an update message depends on the Vite major,
      // so a probe limitation deleted cold-start rows for three plugins on Vite 7
      // while leaving the fourth's standing, ranked 1.00x against nothing.
      let startGate = { ok: false, error: "not attempted" };
      let hmrGate = { ok: false, error: "not attempted" };
      try {
        const { server, port } = await withTimeout(
          startServer({ createServer: cell.createServer, factory: cell.factory, appDir }),
          READY_TIMEOUT_MS,
          "dev server start",
        );
        try {
          await withTimeout(
            server.transformRequest("/bench-entry.js"),
            READY_TIMEOUT_MS,
            "entry transform",
          );
          // Everything the cold-start row measures has now succeeded, whatever
          // happens to the HMR probe below.
          startGate = { ok: true };
          try {
            await warmProbeModule(server, probe);
            const hmr = await connectHmr(port);
            try {
              const r = await hmrRoundTrip({ server, hmr, appDir, probe, iteration: 0, port });
              hmrGate = { ok: true, kind: r.kind, fetchedBytes: r.fetchedBytes };
            } finally {
              hmr.close();
            }
          } catch (error) {
            hmrGate = { ok: false, error: cleanProbeError(error) };
          }
        } finally {
          await closeServer(server);
        }
      } catch (error) {
        // Raised before startGate.ok, so this genuinely is both rows' failure: no
        // server means no cold start and no HMR either.
        const detail = cleanProbeError(error);
        startGate = { ok: false, error: detail };
        hmrGate = { ok: false, error: detail };
      } finally {
        writeFileSync(join(appDir, probe.rel), probe.original);
      }

      if (!startGate.ok) {
        startVariants.push({
          ...base,
          id: `start__${id}`,
          label: rowLabel,
          notes: `❌ dev server failed to start or serve the entry on this corpus — ${startGate.error}`,
          skip: true,
        });
      }

      if (!hmrGate.ok) {
        // "No message arrived" is this probe's limitation and is never published
        // as a plugin verdict — see hmrRoundTrip. Anything else is attributable.
        const unattributed = hmrGate.error.includes("headless probe limitation");
        hmrVariants.push({
          ...base,
          id: `hmr__${id}`,
          label: rowLabel,
          notes: unattributed
            ? `⏭ NOT MEASURED — ${hmrGate.error}. This is the harness declining to publish a number, not a statement about ${plugin.label}.${
                startGate.ok
                  ? " The dev cold-start row for this cell is published regardless: that measurement succeeded, and discarding it would hide a working result behind a probe limitation."
                  : ""
              }`
            : `❌ HMR probe failed on this corpus — ${hmrGate.error}. The probe file compiles under the reference compiler in this same staged app (the staging preflight excludes files that need project context), so this is attributable to the integration rather than to the staging.`,
          skip: true,
        });
      }

      if (startGate.ok) {
        startVariants.push({
          ...base,
          id: `start__${id}`,
          label: rowLabel,
          notes: `createServer + listen + transformRequest('/bench-entry.js') — the ENTRY MODULE only: lazy plugins defer per-SFC compilation to first request, which is untimed here, while an eager plugin (Vize) pays its full ${fileCount}-SFC batch inside this window. That strategy difference is the point of this table, not noise in it · ${plugin.strategy}`,
          measure: async () => {
            const started = performance.now();
            const { server } = await withTimeout(
              startServer({ createServer: cell.createServer, factory: cell.factory, appDir }),
              READY_TIMEOUT_MS,
              "dev server start",
            );
            try {
              await withTimeout(
                server.transformRequest("/bench-entry.js"),
                READY_TIMEOUT_MS,
                "entry transform",
              );
              return performance.now() - started;
            } finally {
              await server.close();
            }
          },
        });
      }

      if (hmrGate.ok) {
        // A cell that full-reloads is doing materially less server-side work than
        // one that patches a module, so it is measured and left unranked rather
        // than compared against the patchers.
        const patched = hmrGate.kind === "update";
        // ONE warm server per row, shared across warmup and measured runs.
        // Restarting per run was harness ceremony, not workflow: real HMR only
        // ever happens against a long-lived server, and the restart re-paid a
        // full corpus-scale startup to measure a milliseconds-long round trip —
        // on naive-ui that ceremony was ~31 minutes of an 89-minute project.
        // What a fresh server costs is the dev-cold-start table's own question.
        // Run independence is preserved where it matters: each round trip edits
        // from the pristine source with a unique marker and restores the file,
        // so no run compounds another's edit.
        let session = null;
        const openSession = async () => {
          const { server, port } = await withTimeout(
            startServer({ createServer: cell.createServer, factory: cell.factory, appDir }),
            READY_TIMEOUT_MS,
            "dev server start",
          );
          try {
            await withTimeout(
              server.transformRequest("/bench-entry.js"),
              READY_TIMEOUT_MS,
              "entry transform",
            );
            for (const p of probes) await warmProbeModule(server, p);
            const hmr = await connectHmr(port);
            return { server, port, hmr };
          } catch (error) {
            await closeServer(server);
            throw error;
          }
        };
        hmrVariants.push({
          ...base,
          id: `hmr__${id}`,
          label: rowLabel,
          artifactLabel: "module bytes",
          unranked: !patched,
          notes: [
            `edit <template> of ${probes.map((p) => p.rel).join(" and ")} → ${hmrGate.kind} · ${plugin.strategy} · one warm server per row (cold start is the other table's question), ms = mean of ${probes.length} round trip(s) per run`,
            patched
              ? "measured region: change announced → update message → updated module fetched over HTTP"
              : "⚠ FULL RELOAD, not a hot update — the server discarded the module instead of patching it, which is much less work. Measured but UNRANKED.",
          ].join(" | "),
          measure: async ({ iteration, phase }) => {
            if (!session) {
              session = await openSession();
              hmrSessions.push(session);
            }
            try {
              let totalMs = 0;
              let notifyMs = 0;
              let bytes = 0;
              const kinds = new Set();
              for (const [pi, p] of probes.entries()) {
                const r = await hmrRoundTrip({
                  server: session.server,
                  hmr: session.hmr,
                  appDir,
                  probe: p,
                  iteration: `${phase}-${iteration}-${pi}`,
                  port: session.port,
                });
                totalMs += r.totalMs;
                notifyMs += r.notifyMs;
                bytes += r.fetchedBytes;
                kinds.add(r.kind);
              }
              return {
                ms: totalMs / probes.length,
                meta: {
                  artifact: bytes,
                  notifyMs: Number((notifyMs / probes.length).toFixed(3)),
                  kind: [...kinds].join("+"),
                  probeFiles: probes.length,
                },
              };
            } finally {
              for (const p of probes) writeFileSync(join(appDir, p.rel), p.original);
            }
          },
        });
      }
    }
  }

  const [startResults, hmrResults] = [
    await measureVariants(startVariants, {
      runs: options.runs,
      // The gate probe already started a server and transformed the entry for
      // every surviving cell, untimed, on the identical code path — that is the
      // discarded warm pass for the cold-start rows. See the methodology.
      warmups: GATE_IS_THE_WARM_PASS,
      fileCount,
    }),
    await measureVariants(hmrVariants, {
      runs: options.runs,
      warmups: options.warmups,
      fileCount,
    }),
  ];

  for (const session of hmrSessions) {
    session.hmr.close();
    await closeServer(session.server);
  }

  labelBaselinelessTables(startResults, "dev cold start");
  labelBaselinelessTables(hmrResults, "HMR turnaround");

  rmSync(join(workRoot, "hmr-tmp"), { recursive: true, force: true });

  return {
    id: "hmr",
    label: `HMR / dev server — ${resolved.selector}`,
    files: fileCount,
    bytes: resolved.bytes,
    groups: [
      { id: "dev-start", label: "Dev server cold start", variants: startResults },
      { id: "hmr-update", label: "HMR update turnaround", variants: hmrResults },
    ],
    groupingNote:
      "Two independent measurements. Cold start is paid once per session; HMR turnaround is paid on every save. Do not compare a row across the two tables.",
    variants: [...startResults, ...hmrResults],
    methodology: [
      `Corpus: ${resolved.selector} @ ${resolved.sha ? resolved.sha.slice(0, 8) : "unknown"} — ${fileCount} SFCs, third-party and unmodified.`,
      excludedFiles.length > 0
        ? `⚠ ${excludedFiles.length} of ${resolved.files.length} corpus SFCs are EXCLUDED from this surface's app for every cell alike (workspace-context prop types, plus transitive relative importers). Judged untimed by @vue/compiler-sfc; challenger compilers were not consulted — a tool that handles these files shows it on the compile surface, which reads the real checkout with no exclusions. First: ${excludedFiles[0].rel} (${excludedFiles[0].reason})`
        : null,
      `The staged copy carries the corpus SFCs' relative import closure (${closureCopied} extra source files) for @vue/compiler-sfc's type resolution; the resolver still externalises them, so the module graph is exactly the corpus.`,
      `HMR probes: a comment is inserted inside the <template> block of ${probes.map((p) => p.rel).join(" and then ")} — genuine template changes, one round trip per probe per run, ms = the mean. A <script setup> edit would make Vue issue a full page reload instead of a hot update — a different and cheaper server path.`,
      "The change is written to disk and then handed to the watcher directly. Waiting for chokidar would fold the OS file-watch debounce (platform-dependent, unrelated to any tool here) into every row.",
      "HMR turnaround is measured from the change being announced to the updated module being fetched over HTTP — the same two steps a browser performs. The WebSocket-notification half is reported separately in the run metadata, because a plugin can be quick to decide what changed and slow to recompile it.",
      "A cell whose edit produces a full reload rather than an update is measured but UNRANKED: discarding a module is much less work than patching one.",
      "Dev cold start is createServer + listen + transformRequest of the generated entry, so it includes the plugin's initialisation. Vize pre-compiles the whole corpus at plugin-init, so its cold-start row carries work the lazy plugins defer to first request — that is the real trade-off, and it is why both tables exist.",
      "Dependency pre-bundling is disabled (optimizeDeps.noDiscovery). Everything outside the corpus is external, so there is nothing to pre-bundle, and leaving discovery on would time a dependency scan this app does not have.",
      "Vite-family only. Webpack and Rspack implement HMR with a different protocol and a different unit of work (an incremental chunk, not a re-transformed module); those rows are absent rather than approximated.",
      enabledBundlers().some((b) => b.id === "vite7")
        ? null
        : "Vite 7 (Rollup) is an OPT-IN study, not part of the default matrix — enable with BENCH_BUNDLERS=vite8,vite7. Its known limitation here (the headless probe receives no HMR message from most plugins on Vite 7) is documented on the probe branch.",
      "SFC custom blocks are consumed by the same inert harness-side sink the bundle surface uses, so a dev server asked for a <markdown> or <playground-*> block the shell has no consumer for does not fail the probe against the Vue plugin.",
      "There is no browser executing the app, so no client-side `import.meta.hot.accept` handler is ever registered. Whether the server still announces an update in that state varies by Vite major AND plugin — observed: all four plugins answer on Vite 8; on Vite 7 some answer only with a full reload and some not at all. Rows where nothing arrived are marked ⏭ NOT MEASURED and are a limitation of this headless probe — they are not evidence that a plugin lacks HMR support.",
      "The two tables are gated INDEPENDENTLY. An HMR probe that produces no update does not remove that cell's dev-cold-start row: the server started and the entry transformed, which is the whole of what cold start measures. Previously one probe limitation deleted both rows, which on Vite 7 removed three plugins' cold-start numbers and left the fourth ranked against nothing.",
      "Where the baseline (@vitejs/plugin-vue) is not ranked in a bundler's table, every surviving row in that table says so: the vs-fastest column then compares challengers with each other only, and its 1.00x must not be read as beating the reference implementation.",
      "Dev cold start: each measured run starts a FRESH server — that row's question is what a cold session costs, so no run may inherit another's module graph. The DISCARDED WARM PASS is the gate probe, which already started a server and transformed the entry for every surviving cell on the identical code path. The probe runs in fixed cell order and so does measured run 0, so probe-to-first-measure distance is identical per cell; later runs rotate. Run 0 is each cell's second in-process execution and may carry a small JIT residual JS plugins feel more than native ones; the median over measured runs absorbs it.",
      "HMR turnaround: ONE WARM server per row, shared across warmup and measured runs. Real HMR only happens against a long-lived server; the per-run restart this replaced re-paid a corpus-scale startup to measure a milliseconds-long round trip (~31 of naive-ui's 89 sweep minutes were that ceremony). Each round trip edits from the pristine source with a unique marker and restores the file, so no run compounds another's edit.",
    ].filter(Boolean),
  };
}
