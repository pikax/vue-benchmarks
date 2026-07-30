/**
 * Turn a real-world project selector into a runnable corpus.
 *
 * The generated corpora are a flat directory of `.vue` files that every surface
 * can consume directly. A cloned project is not: its SFCs are nested, they
 * import each other and their own package aliases, and whether their
 * dependencies are on disk depends on whether an install succeeded on this
 * machine. This module is where those differences are resolved once, so each
 * surface gets the same shape it already understands plus an explicit statement
 * of what the corpus can and cannot support.
 */

import { existsSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { collectVueFilesDeep } from "../fixtures.mjs";
import { CORPUS_IGNORE_DIRS, resolveSelector } from "./projects.mjs";
import { readManifest } from "../../fetch-real-world.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const realRoot = join(rootDir, "fixtures", "real");

/**
 * Surfaces that need the project's own `node_modules` to do real work.
 *
 * A typechecker pointed at a corpus whose imports resolve to nothing does not
 * fail — it reports zero diagnostics and finishes quickly, which is
 * indistinguishable in a table from a fast, correct checker on clean code. The
 * generated-fixture path guards against this by refusing to build a tsconfig it
 * cannot aim at `vue` (see `prepareTypecheckDir`); the real-world path guards
 * against it by refusing to RUN these surfaces at all when the install failed.
 */
export const DEPENDENCY_SURFACES = Object.freeze(["typecheck", "component-meta", "lsp", "bundle", "hmr"]);

/** Surfaces that read SFC text and need nothing resolved. */
export const SOURCE_ONLY_SURFACES = Object.freeze(["compile", "format", "lint"]);

/**
 * Surfaces that run INSIDE the checkout against its installed dependency tree.
 *
 * These are the surfaces whose numbers depend on which versions actually got
 * installed, which is why `hasLockfile: false` makes them unreproducible — see
 * `dependenciesReproducible` below. The corpus-copy surfaces (compile, format,
 * lint, bundle, hmr) are deliberately NOT in this list: they copy `.vue` text out
 * and externalise every specifier that is not corpus code, so the project's
 * dependency resolution cannot move their numbers and unranking them would
 * discard sound measurements for no fairness gain.
 */
export const CHECKOUT_DEPENDENCY_SURFACES = Object.freeze([
  "project-test",
  "project-build",
  "project-typecheck",
  // Both read the project's own tsconfig and resolve through its own installed
  // node_modules — a metadata extractor and a language server are as dependent on
  // which versions landed as a typechecker is, and more so than a build, because
  // the types they report come out of those packages.
  "project-component-meta",
  "project-lsp",
]);

/** Does this surface id run against the project's own installed dependencies? */
export function usesCheckoutDependencies(surfaceId) {
  return CHECKOUT_DEPENDENCY_SURFACES.includes(String(surfaceId).split("@")[0]);
}

/**
 * Enforce the no-lockfile rule on a finished surface.
 *
 * The rule has been DECLARED for as long as the registry has carried
 * `hasLockfile` — the methodology, the registry docblock and
 * `unreproducibleReason` above all state that checkout-executing surfaces on a
 * lockfile-less project are unranked for every tool including baselines. Until
 * this function, nothing applied it: `usesCheckoutDependencies` was imported by
 * the orchestrator and never called, and naive-ui's project-test and
 * project-typecheck rows published RANKED — a promise in prose contradicted by
 * every table it appeared under.
 *
 * Applied at the single choke point that sees every (surface, corpus) pair —
 * run-surface.mjs — so no orchestrator can forget it. Rows are measured and
 * UNRANKED, not suppressed: the numbers are real, they are just not
 * reproducible, and the reason is printed on every row rather than only in the
 * provenance line.
 */
export function applyUnreproducibleGate(surface, resolved) {
  if (!surface || !usesCheckoutDependencies(surface.id)) return surface;
  if (resolved?.dependenciesReproducible !== false) return surface;
  const reason =
    resolved.unreproducibleReason ??
    `${resolved.project?.id ?? "this project"} ships no lockfile, so the dependency set these rows executed is not frozen.`;
  for (const row of surface.variants ?? []) {
    // Rows that never produced a measurement have nothing to unrank, and
    // stamping "UNRANKED" on them is a false statement. Both shapes are
    // guarded: pre-measure variants carry `skip: true`, measured results carry
    // `status: "skipped"` / `"error"` (see measureVariants).
    if (row.skip || row.status === "skipped" || row.status === "error") continue;
    if (row.status === "ok") row.status = "unranked";
    row.notes = `${row.notes ?? ""} | ⚠ UNRANKED — NO LOCKFILE: ${reason}`.replace(/^ \| /, "");
  }
  (surface.methodology ??= []).push(`⚠ ${reason}`);
  return surface;
}

/**
 * @typedef {object} ResolvedCorpus
 * @property {import("./projects.mjs").RealWorldProject} project
 * @property {import("./projects.mjs").Corpus} corpus
 * @property {string} selector      `project:corpus`
 * @property {string} dir           clone root (files are relative to this)
 * @property {string[]} files       POSIX-relative `.vue` paths, sorted
 * @property {number} bytes
 * @property {string|null} sha      resolved commit from the fetch manifest
 * @property {boolean} installed    project dependencies present on disk AND the
 *                                  recorded install did not fail
 * @property {string|null} installNote  stated when disk and manifest disagree
 * @property {boolean} hasLockfile  from the registry
 * @property {boolean} dependenciesReproducible  false ⇒ no lockfile, so the
 *                                  installed dependency set is whatever resolved
 *                                  on the day and CHECKOUT_DEPENDENCY_SURFACES
 *                                  rows are unranked
 * @property {string|null} unreproducibleReason  why, in one line
 * @property {{limit: number, truncated: boolean, totalAvailable: number}} truncation
 * @property {string[]} unsupported surface ids this corpus cannot support
 * @property {string|null} reason   why, in one line, when `unsupported` is non-empty
 */

/**
 * Resolve one `project[:corpus]` selector against what is actually on disk.
 *
 * Returns `{ available: false, reason }` rather than throwing when the clone is
 * missing, so a partial fetch degrades to "these projects have no rows and the
 * report says why" instead of aborting the whole benchmark.
 */
export function resolveCorpus(selector, { fileLimit = Infinity } = {}) {
  const { project, corpus } = resolveSelector(selector);
  const dir = join(realRoot, project.id);
  const canonical = `${project.id}:${corpus.id}`;

  if (!existsSync(dir)) {
    return {
      available: false,
      selector: canonical,
      project,
      corpus,
      reason: `not cloned — run: pnpm fetch:real-world --projects ${project.id}`,
    };
  }

  const manifest = readManifest();
  const record = manifest?.projects?.[project.id] ?? null;

  // A corpus whose checkout does not match the pinned commit is not the corpus
  // this registry describes, so it is refused rather than measured under the
  // pinned label. Fetch records the mismatch; this is where it stops a run.
  if (record?.shaMismatch) {
    return {
      available: false,
      selector: canonical,
      project,
      corpus,
      reason: `pinned-commit mismatch — ${record.shaMismatch.message}`,
    };
  }
  // Collected WITHOUT the limit first, so the truncation can be disclosed rather
  // than merely applied. `--file-limit` defaults to 200 and the limit is an
  // alphabetical prefix (see collectVueFilesDeep), so "naive-ui, 200 SFCs" was in
  // fact the first 200 of 1708 files sorted by path — components A through C — and
  // nothing in the published row said so. A reader cannot judge a corpus they
  // think is complete, and the sample is not random: an alphabetical prefix of a
  // component library is a systematically narrower slice than the whole.
  const allFiles = collectVueFilesDeep(dir, {
    roots: corpus.roots,
    ignore: CORPUS_IGNORE_DIRS,
  });
  const files = Number.isFinite(fileLimit) ? allFiles.slice(0, fileLimit) : allFiles;
  const truncation = {
    limit: Number.isFinite(fileLimit) ? fileLimit : null,
    truncated: files.length < allFiles.length,
    totalAvailable: allFiles.length,
  };

  if (files.length === 0) {
    return {
      available: false,
      selector: canonical,
      project,
      corpus,
      reason: `no .vue files under ${corpus.roots.join(", ")} — the clone is incomplete or the project moved its sources at this ref`,
    };
  }

  let bytes = 0;
  for (const f of files) {
    try {
      bytes += statSync(join(dir, f)).size;
    } catch {
      // Counted files are re-stat'd only for the byte total; a race here is not
      // worth failing a benchmark over.
    }
  }

  // BOTH signals must agree, and the filesystem alone is not enough.
  //
  // The previous rule trusted `node_modules` existing, on the reasoning that an
  // install can be run by hand after a fetch recorded a failure. What it also
  // accepted was a HALF-installed tree: `pnpm install` that died partway leaves a
  // populated `node_modules` behind, and a partial tree resolves some imports and
  // not others — which is the exact input that makes a checker report a handful of
  // diagnostics very quickly and look like the fastest honest tool in the table.
  //
  // A manual install is still recognised: re-running fetch (or `pnpm install` plus
  // a fetch) records success. Until then the disagreement is published rather than
  // resolved silently in either direction.
  const modulesOnDisk = existsSync(join(dir, "node_modules"));
  const manifestInstalled = record?.install?.installed;
  const installed = modulesOnDisk && manifestInstalled !== false;

  let installNote = null;
  if (modulesOnDisk && manifestInstalled === false) {
    installNote = record?.install?.skipped
      ? `node_modules is present but the fetch ran with --no-install, so no install outcome was recorded for ${project.id}. Treated as NOT installed: an unverified tree may be partial, and a partial tree resolves some imports and not others. Fix with: pnpm fetch:real-world --projects ${project.id}`
      : `node_modules is present but the recorded install FAILED for ${project.id} (${record?.install?.error ?? "no error recorded"}). Treated as NOT installed: a half-installed tree resolves some imports and not others, which produces a fast, partial pass that is indistinguishable from a fast, correct one.`;
  } else if (!modulesOnDisk && manifestInstalled === true) {
    installNote = `the fetch manifest records a successful install for ${project.id} but node_modules is absent — the tree was removed or is on another machine. Treated as NOT installed.`;
  }

  // No lockfile ⇒ the install could not be frozen, so the dependency set is
  // whatever resolved on the day it ran. The registry has always documented that
  // such a project's dependency-needing surfaces are unranked; this is where the
  // claim becomes something code does (applied by the orchestrator to
  // CHECKOUT_DEPENDENCY_SURFACES) instead of a promise in a JSDoc comment.
  const hasLockfile = project.hasLockfile !== false;
  const unreproducibleReason = hasLockfile
    ? null
    : `${project.id} ships no lockfile at the pinned ref, so its install cannot be frozen and the dependency set is whatever resolved when fetch ran. Timings that execute the project's own installed dependencies are therefore not reproducible, and rows on ${CHECKOUT_DEPENDENCY_SURFACES.join(", ")} are UNRANKED for this corpus. This is a property of the corpus, not of any tool, and it applies to every row equally.`;

  const unsupported = installed ? [] : [...DEPENDENCY_SURFACES];

  return {
    available: true,
    selector: canonical,
    project,
    corpus,
    dir,
    files,
    bytes,
    truncation,
    sha: record?.sha ?? null,
    installed,
    installNote,
    hasLockfile,
    dependenciesReproducible: hasLockfile,
    unreproducibleReason,
    unsupported,
    reason: installed
      ? null
      : (installNote ??
        "project dependencies are not installed — surfaces that must resolve imports would report a fast, empty pass rather than a result"),
  };
}

/** Resolve many selectors, keeping unavailable ones so the report can say why. */
export function resolveCorpora(selectors, options = {}) {
  return selectors.map((s) => resolveCorpus(s, options));
}

/**
 * One-line provenance string for report notes.
 *
 * Every real-world row carries this. A number attached to "Hoppscotch" is not
 * reproducible; a number attached to `hoppscotch:common @ a4395b3 · 293 SFCs ·
 * app-source` is.
 */
export function provenance(resolved) {
  const p = resolved.project;
  const sha = resolved.sha ? resolved.sha.slice(0, 8) : "unknown-sha";
  // Ref AND commit AND when that code was published. The ref alone is a label
  // someone can move; the commit alone says nothing about how old the code is.
  // A reader comparing two runs needs all three to know whether they measured the
  // same thing.
  const dated = p.releasedAt
    ? `released ${p.releasedAt}`
    : p.committedAt
      ? `committed ${p.committedAt}`
      : "date unknown";
  // A truncated corpus says so HERE, in the one string every real-world row
  // carries. "200 SFCs" and "200 of 1708 SFCs, alphabetical prefix" are different
  // claims, and only the second is true of a --file-limit run.
  const t = resolved.truncation;
  const files = t?.truncated
    ? `${resolved.files.length} of ${t.totalAvailable} SFCs (alphabetical prefix, --file-limit ${t.limit})`
    : `${resolved.files.length} SFCs`;
  const lockfile = resolved.hasLockfile === false ? " · NO LOCKFILE (dependency set not frozen)" : "";
  return `${resolved.selector} @ ${p.ref} (${sha}, ${dated}, ${p.releaseKind ?? "unknown"}; pinned ${p.pinnedAt ?? "?"}) · ${files} · ${resolved.corpus.kind} · ${p.license}${lockfile}`;
}
