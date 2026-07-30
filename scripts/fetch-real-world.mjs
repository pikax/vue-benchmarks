#!/usr/bin/env node
/**
 * Fetch and install the real-world Vue projects benchmarked by
 * `scripts/bench-real-world.mjs`.
 *
 *   node scripts/fetch-real-world.mjs                       # every project
 *   node scripts/fetch-real-world.mjs --projects hoppscotch,nuxt-ui
 *   node scripts/fetch-real-world.mjs --no-install          # sources only
 *
 * Clones land in `fixtures/real/<project-id>/` (gitignored) at the ref pinned in
 * `scripts/lib/real-world/projects.mjs`, and every run writes
 * `fixtures/real/manifest.json` recording the ref, the RESOLVED COMMIT SHA, the
 * install outcome and the per-corpus file counts.
 *
 * The resolved SHA is the point of the manifest. A tag can be moved and a branch
 * always moves, so "we benchmarked Hoppscotch" is not a reproducible statement
 * and "we benchmarked hoppscotch@a4395b3" is. Every published real-world row is
 * traceable to a line in that file.
 *
 * Install failures are recorded, never fatal. These are large third-party
 * monorepos with native optional dependencies; one of them failing to install on
 * a given runner must degrade that project's surface coverage (source-only
 * surfaces still run, dependency-needing surfaces are skipped and say why)
 * rather than abort the fetch of the other eight.
 *
 * A MOVED PIN is fatal: it exits non-zero. The fetch continues to the end and
 * records everything first, but a ref that no longer points at its pinned commit
 * has to fail the step it ran in, or CI goes green while the checked-out corpus is
 * not the one the registry describes.
 */

import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { collectVueFilesDeep } from "./lib/fixtures.mjs";
import {
  CORPUS_IGNORE_DIRS,
  REAL_WORLD_PROJECTS,
  findProject,
} from "./lib/real-world/projects.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
export const REAL_ROOT = join(rootDir, "fixtures", "real");
export const MANIFEST_PATH = join(REAL_ROOT, "manifest.json");

function parseArgs(argv) {
  const args = { projects: "", install: true, force: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--projects") args.projects = argv[++i];
    else if (a.startsWith("--projects=")) args.projects = a.slice("--projects=".length);
    else if (a === "--no-install") args.install = false;
    else if (a === "--force") args.force = true;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function run(
  cmd,
  cmdArgs,
  cwd,
  { allowFailure = false, timeoutMs = 20 * 60 * 1000, shell = false } = {},
) {
  const result = spawnSync(cmd, cmdArgs, {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    timeout: timeoutMs,
    // Only the package managers need a shell, and only on Windows, where they
    // are `.cmd` shims. `git` is a real executable everywhere, and spawning it
    // through a shell means its arguments get concatenated rather than escaped
    // (Node DEP0190) — a repo URL or ref with a shell metacharacter would then
    // be interpreted rather than passed through.
    shell,
    env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", CI: "1" },
  });
  const ok = !result.error && result.status === 0;
  if (!ok && !allowFailure) {
    const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`.trim();
    throw new Error(
      `${cmd} ${cmdArgs.join(" ")} failed (${result.error?.message ?? `exit ${result.status}`})\n${output.slice(0, 4000)}`,
    );
  }
  return {
    ok,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    error: result.error?.message ?? null,
  };
}

/**
 * Fetch exactly one ref at depth 1.
 *
 * `git clone` cannot clone a bare commit SHA, and Hoppscotch is pinned to one
 * (its newest tag predates the rewrite). init + fetch handles tags and SHAs with
 * the same code path, and `--filter=blob:none` keeps history blobs off the disk —
 * these repos are large enough that a full clone of all nine is the dominant
 * cost of the whole benchmark.
 */
function fetchRepo(project, dir) {
  mkdirSync(dir, { recursive: true });
  if (!existsSync(join(dir, ".git"))) run("git", ["init", "--quiet"], dir);

  const remotes = run("git", ["remote"], dir, { allowFailure: true });
  if (!remotes.stdout.split(/\s+/).includes("origin")) {
    run("git", ["remote", "add", "origin", project.repo], dir);
  } else {
    run("git", ["remote", "set-url", "origin", project.repo], dir);
  }

  const fetched = run(
    "git",
    ["fetch", "--depth", "1", "--filter=blob:none", "--force", "origin", project.ref],
    dir,
    { allowFailure: true },
  );
  if (!fetched.ok) {
    // Some servers refuse a depth-1 fetch of an arbitrary SHA. Fall back to
    // fetching everything rather than failing the project outright.
    run("git", ["fetch", "--filter=blob:none", "--force", "--tags", "origin"], dir);
    run("git", ["checkout", "--force", project.ref], dir);
  } else {
    run("git", ["checkout", "--force", "FETCH_HEAD"], dir);
  }

  const sha = run("git", ["rev-parse", "HEAD"], dir).stdout.trim();
  return sha;
}

/**
 * Install with the project's own package manager.
 *
 * `--ignore-scripts` is deliberate and is stated in the report: postinstall
 * scripts in this set build native binaries (better-sqlite3, electron, playwright
 * browsers) that no surface here uses, and that fail routinely on CI runners. The
 * cost is that a project whose *source layout* depends on a postinstall codegen
 * step would be incomplete — none in this registry are, and the corpus file count
 * recorded in the manifest is what would reveal it if that changed.
 */
function installProject(project, dir) {
  const pm = project.packageManager;
  const attempts =
    pm === "pnpm"
      ? [
          project.hasLockfile
            ? ["install", "--frozen-lockfile", "--ignore-scripts", "--config.confirmModulesPurge=false"]
            : null,
          // Several projects pin a `packageManager` version, which makes pnpm
          // hand off to that exact release from the store. When that hand-off is
          // broken the install fails before it starts, and the error names a
          // mangled store path rather than anything about the project — nuxt-ui
          // pins pnpm@11.13.0 and failed here with a malformed
          // `bin\\..\node_modules` shim path from a corrupted local store. Running
          // with the harness's own pnpm instead is a fidelity trade (the pinned
          // manager is what the project tests with) but it is a far better outcome
          // than losing the project, and which strategy succeeded is recorded.
          project.hasLockfile
            ? [
                "install",
                "--frozen-lockfile",
                "--ignore-scripts",
                "--config.confirmModulesPurge=false",
                "--config.manage-package-manager-versions=false",
              ]
            : null,
          ["install", "--no-frozen-lockfile", "--ignore-scripts", "--config.confirmModulesPurge=false"],
        ].filter(Boolean)
      : pm === "yarn"
        ? [["install", "--ignore-scripts"]]
        : [
            project.hasLockfile ? ["ci", "--ignore-scripts"] : null,
            ["install", "--ignore-scripts", "--no-audit", "--no-fund"],
          ].filter(Boolean);

  const tried = [];
  for (const argv of attempts) {
    const r = run(pm, argv, dir, { allowFailure: true, shell: process.platform === "win32" });
    tried.push({
      command: `${pm} ${argv.join(" ")}`,
      ok: r.ok,
      status: r.status,
      // The failure OUTPUT, not just the exit code. Without it a failed install is
      // an unexplained `installed: false` that silently removes a project from
      // three surfaces, and the reader cannot tell a broken lockfile from an
      // offline runner from an unsupported Node version. nuxt-ui failed both
      // strategies with nothing recorded but `status: 1`.
      failure: r.ok ? null : `${r.stderr || r.stdout || r.error || ""}`.trim().slice(-1500),
    });
    if (r.ok) {
      return { installed: true, command: `${pm} ${argv.join(" ")}`, attempts: tried, error: null };
    }
  }
  const last = tried[tried.length - 1];
  return {
    installed: false,
    command: last?.command ?? null,
    attempts: tried,
    error: `all ${pm} install strategies failed — last output: ${last?.failure || "(no output captured)"}`,
  };
}

function measureCorpus(project, dir, corpus) {
  const files = collectVueFilesDeep(dir, {
    roots: corpus.roots,
    ignore: CORPUS_IGNORE_DIRS,
  });
  let bytes = 0;
  for (const f of files) {
    try {
      bytes += statSync(join(dir, f)).size;
    } catch {
      // A file that vanished between walk and stat is not worth failing a fetch.
    }
  }
  // Drift check. `approxFiles` is quoted in the registry docblock table and in
  // docs/methodology.md as the size of each corpus, so a stale value is a
  // published claim that is simply wrong — and nothing used to compare it against
  // the walk. Eight of sixteen were wrong when this check was added, two badly
  // (ant-design-vue's demos 560→695 and its site 130→37), because the original
  // figures came from prefix-aggregated tree listings rather than from the same
  // ignore-rules walk the benchmark actually uses.
  const drift =
    Number.isFinite(corpus.approxFiles) && corpus.approxFiles !== files.length
      ? {
          declared: corpus.approxFiles,
          actual: files.length,
          message: `corpus ${corpus.id}: registry declares approxFiles ${corpus.approxFiles} but the walk found ${files.length}. Update approxFiles in scripts/lib/real-world/projects.mjs — the declared count is quoted as fact in the registry docblock and the methodology.`,
        }
      : null;
  if (drift) console.warn(`  ⚠ ${drift.message}`);

  return {
    id: corpus.id,
    kind: corpus.kind,
    roots: corpus.roots,
    files: files.length,
    bytes,
    ...(drift ? { drift } : {}),
  };
}

export function readManifest() {
  if (!existsSync(MANIFEST_PATH)) return null;
  try {
    return JSON.parse(readFileSync(MANIFEST_PATH, "utf8"));
  } catch {
    return null;
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/fetch-real-world.mjs [options]

Options:
  --projects a,b,c   Only these project ids (default: all)
  --no-install       Clone sources only; skip dependency install
  --force            Re-clone from scratch instead of updating in place

Projects:
${REAL_WORLD_PROJECTS.map((p) => `  ${p.id.padEnd(16)} ${p.repo} @ ${p.ref}`).join("\n")}

Clones land in fixtures/real/<id>/ and are gitignored.
fixtures/real/manifest.json records the resolved SHA of every clone — that file,
not the tag, is what makes a published real-world number reproducible.
`);
    process.exit(0);
  }

  const selected = args.projects
    ? args.projects
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .map((id) => {
          const p = findProject(id);
          if (!p) {
            console.error(
              `unknown project "${id}" — known: ${REAL_WORLD_PROJECTS.map((x) => x.id).join(", ")}`,
            );
            process.exit(1);
          }
          return p;
        })
    : REAL_WORLD_PROJECTS;

  mkdirSync(REAL_ROOT, { recursive: true });
  const previous = readManifest();
  const entries = new Map(Object.entries(previous?.projects ?? {}));

  for (const project of selected) {
    const dir = join(REAL_ROOT, project.id);
    console.log(`\n=== ${project.label} (${project.id}) @ ${project.ref} ===`);
    if (args.force && existsSync(dir)) rmSync(dir, { recursive: true, force: true });

    const record = {
      id: project.id,
      label: project.label,
      repo: project.repo,
      ref: project.ref,
      refKind: project.refKind,
      license: project.license,
      packageManager: project.packageManager,
      hasLockfile: project.hasLockfile,
      dir: `fixtures/real/${project.id}`,
      fetchedAt: new Date().toISOString(),
    };

    try {
      record.sha = fetchRepo(project, dir);
      record.expectedSha = project.sha ?? null;
      record.releasedAt = project.releasedAt ?? null;
      record.committedAt = project.committedAt ?? null;
      record.releaseKind = project.releaseKind ?? null;
      record.pinnedAt = project.pinnedAt ?? null;

      // The pin guarantee. A tag can be moved and a branch always moves, so
      // "we benchmarked Element Plus 2.14.3" is only true if 2.14.3 still points
      // where it did when it was pinned. Comparing against the registry's
      // recorded commit turns a moved ref into a loud, refusable error instead of
      // a silently different corpus that would still publish numbers under the
      // old label — and every real-world result is supposed to be re-runnable
      // against exactly the code that produced it.
      if (record.expectedSha && record.sha !== record.expectedSha) {
        record.shaMismatch = {
          expected: record.expectedSha,
          actual: record.sha,
          message:
            `ref "${project.ref}" now points at ${record.sha} but was pinned at ${record.expectedSha}. ` +
            `Refusing to treat this as the pinned corpus. If the move is intended, update sha/committedAt/` +
            `releasedAt for "${project.id}" in scripts/lib/real-world/projects.mjs deliberately — pins are ` +
            `updated by hand on purpose, so that a benchmark never silently changes what it measures.`,
        };
        console.error(`  ✗ SHA MISMATCH — ${record.shaMismatch.message}`);
      } else {
        const age = project.releasedAt ?? project.committedAt;
        console.log(
          `  fetched → ${record.sha}${record.expectedSha ? " (matches pin)" : ""}${age ? ` · ${project.releaseKind} ${age}` : ""}`,
        );
      }
    } catch (error) {
      record.sha = null;
      record.fetchError = error instanceof Error ? error.message : String(error);
      console.error(`  ✗ fetch failed: ${record.fetchError.split("\n")[0]}`);
      entries.set(project.id, record);
      continue;
    }

    record.corpora = project.corpora.map((c) => measureCorpus(project, dir, c));
    for (const c of record.corpora) {
      console.log(`  corpus ${c.id.padEnd(12)} ${String(c.files).padStart(5)} .vue  (${c.kind})`);
    }

    if (args.install) {
      console.log(`  installing with ${project.packageManager}...`);
      const install = installProject(project, dir);
      record.install = install;
      console.log(
        install.installed
          ? `  ✓ installed (${install.command})`
          : `  ⚠ install failed — dependency-needing surfaces will be skipped for ${project.id}`,
      );
    } else {
      record.install = { installed: false, skipped: true, error: null, command: null };
      console.log("  (install skipped)");
    }

    entries.set(project.id, record);
  }

  const manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    projects: Object.fromEntries(entries),
  };
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`\nWrote ${MANIFEST_PATH}`);

  const failures = [...entries.values()].filter((r) => !r.sha);
  if (failures.length) {
    console.warn(`\n⚠ ${failures.length} project(s) failed to fetch: ${failures.map((f) => f.id).join(", ")}`);
  }

  // A MOVED PIN is a hard failure, not a warning.
  //
  // The mismatch was already detected, recorded and printed — and then the
  // process exited 0, so a CI job containing this step went green while the
  // corpus it had just checked out was not the corpus the registry describes.
  // The bench step refuses such a corpus (see resolveCorpus), so the published
  // report would simply be missing that project, with the reason buried in the
  // fetch log of a passing job. Exiting non-zero puts the decision in front of
  // the person who has to make it: pins in this repository are updated by hand,
  // deliberately, so that a benchmark never silently changes what it measures.
  const moved = [...entries.values()].filter((r) => r.shaMismatch);
  if (moved.length > 0) {
    console.error(
      `\n✗ ${moved.length} project(s) no longer point at their pinned commit: ${moved.map((m) => m.id).join(", ")}`,
    );
    console.error(
      "  Nothing is benchmarked from a moved pin. Update sha/committedAt/releasedAt for those projects in " +
        "scripts/lib/real-world/projects.mjs if the move is intended.",
    );
    process.exitCode = 1;
  }
}

// Only run when executed directly — the harness tests import this module for
// readManifest()/REAL_ROOT and must not trigger nine clones as a side effect.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? (error.stack ?? error.message) : String(error));
    process.exit(1);
  });
}
