/**
 * Discover runnable test targets inside a cloned project.
 *
 * Nothing here is hard-coded per project, deliberately: a registry of "run this
 * script in this directory" goes stale silently the moment a project reorganises,
 * and a stale entry produces a skipped row that looks like a tool result. The
 * layout is read off the checkout every run instead.
 *
 * What the checkouts actually look like is why this is not a one-liner.
 * Hoppscotch's `hoppscotch-common` package has `vitest.config.mts`, a `test`
 * script, and **no `vite.config`** — its build lives in a sibling package
 * entirely. So "the package that builds" and "the package that tests" are
 * different packages, discovery has to run per workspace package rather than at
 * the repo root, and a project can perfectly well have a test target and no
 * build target.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";

/**
 * What a row should call this package: its package.json name, its path inside
 * the checkout, or — for a NAMELESS ROOT package.json — the checkout's own
 * directory name. `relative(cloneDir, dir)` is "" at the root and `??` does not
 * catch empty strings, so the old `pkg.name ?? relative(...)` rendered
 * element-plus's project-test rows as " — project's own toolchain (baseline)"
 * with no subject at all.
 */
function packageIdentity(pkg, cloneDir, dir) {
  const rel = relative(cloneDir, dir);
  return pkg?.name ?? (rel ? rel.split("\\").join("/") : basename(cloneDir));
}

/** Config filenames Vitest will pick up, in the order we prefer to extend them. */
const CONFIG_CANDIDATES = [
  "vitest.config.mts",
  "vitest.config.ts",
  "vitest.config.mjs",
  "vitest.config.js",
  "vite.config.mts",
  "vite.config.ts",
  "vite.config.mjs",
  "vite.config.js",
];

/**
 * Build configs. Vitest configs are excluded deliberately — a `vitest.config` has
 * no `build` section and building through it would measure a different pipeline
 * from the one the project actually ships.
 */
const BUILD_CONFIG_CANDIDATES = [
  "vite.config.mts",
  "vite.config.ts",
  "vite.config.mjs",
  "vite.config.js",
];

/**
 * Is this a build script this harness can reliably swap a Vue plugin into?
 *
 * Requires a literal `vite build`. That is the filter that keeps this surface
 * honest, and it excludes framework wrappers on purpose:
 *
 * - `nuxt build` and `quasar build` generate their Vite config at runtime, so
 *   there is no config file to import and no `plugins` array to substitute into.
 *   A swap attempt there either silently does nothing or fails for reasons that
 *   have nothing to do with the challenger.
 * - `pnpm -r do-build-prod` fans out to other packages, so timing it measures a
 *   whole workspace including packages with no Vue in them.
 *
 * Better to measure fewer packages truthfully than every package approximately.
 */
function isViteBuildScript(body) {
  if (typeof body !== "string") return false;
  if (/\b(nuxt|quasar|nuxi)\s+(build|generate)\b/.test(body)) return false;
  if (/\bpnpm\s+-r\b|\bnpm-run-all\b|\bturbo\s+run\b/.test(body)) return false;
  return /\bvite\s+build\b/.test(body);
}

function findBuildScript(scripts) {
  if (!scripts) return null;
  const preferred = ["build", "build:app", "build:prod", "do-build-prod", "generate"];
  for (const name of preferred) {
    if (isViteBuildScript(scripts[name])) return name;
  }
  for (const [name, body] of Object.entries(scripts)) {
    if (isViteBuildScript(body)) return name;
  }
  return null;
}

const IGNORE_DIRS = new Set(["node_modules", ".git", "dist", "build", ".nuxt", ".output", "coverage"]);

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Is this a Vitest test script?
 *
 * Matching on the script BODY rather than trusting the name. A `test` script that
 * shells out to jest, playwright or a bespoke node runner is not something this
 * surface can swap a Vue plugin into, and running it anyway would produce a
 * number that has nothing to do with the Vue toolchain.
 */
function isVitestScript(body) {
  return typeof body === "string" && /(^|[\s&|;])vitest(\s|$)/.test(body);
}

function findVitestScript(scripts) {
  if (!scripts) return null;
  // Prefer an explicit non-watch entry point. `test:watch` would never exit.
  const preferred = ["test", "test:unit", "do-test", "vitest"];
  for (const name of preferred) {
    if (isVitestScript(scripts[name]) && !/--watch|(^|\s)vitest\s*$/.test(scripts[name])) {
      return name;
    }
  }
  for (const [name, body] of Object.entries(scripts)) {
    if (name.includes("watch")) continue;
    if (isVitestScript(body)) return name;
  }
  return null;
}

function hasVitest(pkg) {
  return Boolean(pkg?.devDependencies?.vitest || pkg?.dependencies?.vitest);
}

/**
 * Walk workspace packages looking for a Vitest suite.
 *
 * Depth-limited rather than exhaustive: every project in the registry keeps its
 * packages within three levels (`packages/x`, `apps/x`, `packages/@core/x`), and
 * an unbounded walk of a monorepo with dependencies installed is slow enough to
 * dominate the surface's own runtime.
 */
export function discoverTestTargets(cloneDir, { maxDepth = 3, sfcCount } = {}) {
  const targets = [];
  // How many SFCs live under a candidate package. This is the primary ranking
  // signal and a hard filter, for a reason worth stating: the first version
  // sorted alphabetically and picked Hoppscotch's `packages/hoppscotch-cli` — a
  // command-line package containing **no Vue at all** — over
  // `packages/hoppscotch-common` and its 293 SFCs. Swapping a Vue plugin into a
  // suite with no Vue components measures nothing, and the config-override
  // correctly refused because there was no `vite:vue` plugin to replace. A
  // target with no SFCs is not a Vue-toolchain target.
  const countSfcs = sfcCount ?? ((dir) => defaultSfcCount(dir));

  const visit = (dir, depth) => {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = readJson(pkgPath);
      const script = findVitestScript(pkg?.scripts);
      if (script && hasVitest(pkg)) {
        const config = CONFIG_CANDIDATES.find((c) => existsSync(join(dir, c))) ?? null;
        targets.push({
          dir,
          relDir: relative(cloneDir, dir).split("\\").join("/") || ".",
          packageName: packageIdentity(pkg, cloneDir, dir),
          script,
          scriptBody: pkg.scripts[script],
          config,
          sfcs: countSfcs(dir),
          // A target with no importable config cannot take the config-override
          // swap. It is still a valid BASELINE row, and the surface says which
          // mechanism each row used rather than hiding the difference.
          canOverride: Boolean(config),
        });
      }
    }
    if (depth >= maxDepth) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || IGNORE_DIRS.has(entry.name)) continue;
      visit(join(dir, entry.name), depth + 1);
    }
  };

  visit(cloneDir, 0);

  // A suite with no SFCs under it cannot exercise a Vue plugin, so it is not a
  // candidate at all — not merely a lower-ranked one.
  const vueTargets = targets.filter((t) => t.sfcs > 0);

  // Most SFCs first, then an importable config, then path for stability. Ordering
  // matters because the default is to measure ONE target per project, so this
  // choice decides what the published row actually means.
  return vueTargets.sort((a, b) => {
    if (a.sfcs !== b.sfcs) return b.sfcs - a.sfcs;
    if (a.canOverride !== b.canOverride) return a.canOverride ? -1 : 1;
    return a.relDir.localeCompare(b.relDir);
  });
}

/**
 * Discover packages whose production build this harness can run and swap into.
 *
 * Same shape and same rules as `discoverTestTargets`, with a stricter script
 * filter (see `isViteBuildScript`) and build-only configs. Deliberately narrow:
 * the instruction is to cover packages where this is easy and reliable, and a
 * project whose build goes through a framework wrapper is neither.
 */
export function discoverBuildTargets(cloneDir, { maxDepth = 3, sfcCount } = {}) {
  const targets = [];
  const countSfcs = sfcCount ?? ((dir) => defaultSfcCount(dir));

  const visit = (dir, depth) => {
    const pkgPath = join(dir, "package.json");
    if (existsSync(pkgPath)) {
      const pkg = readJson(pkgPath);
      const script = findBuildScript(pkg?.scripts);
      if (script) {
        const config = BUILD_CONFIG_CANDIDATES.find((c) => existsSync(join(dir, c))) ?? null;
        targets.push({
          dir,
          relDir: relative(cloneDir, dir).split("\\").join("/") || ".",
          packageName: packageIdentity(pkg, cloneDir, dir),
          script,
          scriptBody: pkg.scripts[script],
          config,
          sfcs: countSfcs(dir),
          // No importable vite config means no plugins array to substitute into.
          // Such a target is still a valid BASELINE (its own build runs fine), but
          // challengers on it are NOT MEASURED rather than guessed at.
          canOverride: Boolean(config),
        });
      }
    }
    if (depth >= maxDepth) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || IGNORE_DIRS.has(entry.name)) continue;
      visit(join(dir, entry.name), depth + 1);
    }
  };

  visit(cloneDir, 0);

  // A build with no SFCs under it cannot exercise a Vue plugin.
  return targets
    .filter((t) => t.sfcs > 0)
    .sort((a, b) => {
      if (a.canOverride !== b.canOverride) return a.canOverride ? -1 : 1;
      if (a.sfcs !== b.sfcs) return b.sfcs - a.sfcs;
      return a.relDir.localeCompare(b.relDir);
    });
}

/**
 * Discover packages that can be typechecked with their own tsconfig.
 *
 * Requires a real `tsconfig.json` in the package and SFCs beneath it. Unlike the
 * build and test discoveries this does NOT require a script, because every
 * checker here is invoked as `--noEmit -p <tsconfig>` directly rather than through
 * whatever wrapper the project happens to use — several wrap it in a bespoke
 * `type-check.mjs` that shards the work or sets its own flags, which would make
 * the rows measure the wrapper instead of the checker.
 *
 * `tsconfig.json` files that name no root files (`files: []`, `include: []`, or
 * neither key with references) are never `-p` targets themselves: pointing `-p`
 * at one checks nothing, which publishes a very fast row that did no work — and
 * "very fast row" here is not hypothetical, it happened (see namesRootFiles).
 * Solution-style configs are instead followed one reference level, so a repo
 * whose root is `{"files": [], "references": [...]}` is typechecked through the
 * referenced config that actually names its sources.
 */
export function discoverTypecheckTargets(cloneDir, { maxDepth = 3, sfcCount } = {}) {
  const targets = [];
  const countSfcs = sfcCount ?? ((dir) => defaultSfcCount(dir));

  // One entry per config FILE, whichever solution referenced it — the same
  // tsconfig.web.json reachable through two solution files must not become two
  // targets.
  const seenRefs = new Set();

  const visit = (dir, depth) => {
    const tsconfigPath = join(dir, "tsconfig.json");
    if (existsSync(tsconfigPath)) {
      const raw = readJsonLoose(tsconfigPath);
      if (namesRootFiles(raw)) {
        const pkg = readJson(join(dir, "package.json"));
        targets.push({
          dir,
          relDir: relative(cloneDir, dir).split("\\").join("/") || ".",
          packageName: packageIdentity(pkg, cloneDir, dir),
          tsconfig: "tsconfig.json",
          sfcs: countSfcs(dir),
        });
      } else if (Array.isArray(raw?.references)) {
        // Solution-style: `-p` at this file checks NOTHING. The old guard tested
        // `!raw.files`, and element-plus's root is `{"files": [], "references":
        // [...]}` — an empty array is truthy, so the root was accepted, vue-tsc
        // built an empty program in ~0.6 s, and both baseline rows ranked process
        // startup as a full project check while the diagnostic census unranked
        // the checkers that did real work. Follow the references ONE level and
        // target the referenced configs that do name root files instead.
        const pkg = readJson(join(dir, "package.json"));
        for (const ref of raw.references) {
          if (!ref?.path) continue;
          let refFile = join(dir, String(ref.path));
          try {
            if (statSync(refFile).isDirectory()) refFile = join(refFile, "tsconfig.json");
          } catch {
            // Missing path — the existsSync below rejects it.
          }
          if (!existsSync(refFile) || seenRefs.has(refFile)) continue;
          seenRefs.add(refFile);
          const cfg = readJsonLoose(refFile);
          // A referenced config that is itself a solution is not followed
          // further — one level covers every registry project, and unbounded
          // recursion through cyclic references would need real bookkeeping.
          if (!namesRootFiles(cfg)) continue;
          const refDir = dirname(refFile);
          const refPkg = readJson(join(refDir, "package.json"));
          targets.push({
            dir: refDir,
            relDir: relative(cloneDir, refDir).split("\\").join("/") || ".",
            packageName: packageIdentity(refPkg ?? pkg, cloneDir, refDir),
            tsconfig: basename(refFile),
            sfcs: sfcsForConfig(refDir, cfg, countSfcs),
          });
        }
      }
    }
    if (depth >= maxDepth) return;
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || IGNORE_DIRS.has(entry.name)) continue;
      visit(join(dir, entry.name), depth + 1);
    }
  };

  visit(cloneDir, 0);

  // Most SFCs first: the point is to typecheck Vue, so the package with the most
  // Vue in it is the one worth measuring.
  return targets.filter((t) => t.sfcs > 0).sort((a, b) => b.sfcs - a.sfcs || a.relDir.localeCompare(b.relDir));
}

/**
 * Does this tsconfig NAME any root files? TypeScript applies its wildcard
 * include default only when BOTH `files` and `include` are absent — `files: []` and
 * `include: []` each pin the root set to exactly nothing. A config with zero
 * root files checks nothing, so it must never become a `-p` target, however many
 * other keys (`references`, `compilerOptions`) it carries. An unparseable config
 * answers true, matching readJsonLoose's "kept, not silently dropped" contract.
 */
function namesRootFiles(raw) {
  if (raw == null) return true;
  if (raw.files == null && raw.include == null) return true;
  return (
    (Array.isArray(raw.files) && raw.files.length > 0) ||
    (Array.isArray(raw.include) && raw.include.length > 0)
  );
}

/**
 * SFC count for a config that was reached through a solution reference.
 *
 * Counting the whole config directory would tie every referenced config at the
 * same number (they usually all sit in the repo root beside the solution file),
 * and the ranking would then pick between tsconfig.web.json and
 * tsconfig.node.json alphabetically. Count under the include entries' first
 * path segments instead, so the config that includes `packages` outranks the
 * one that includes `play` or nothing but buildfiles.
 */
function sfcsForConfig(configDir, cfg, countSfcs) {
  const includes = Array.isArray(cfg?.include) ? cfg.include : null;
  if (!includes) {
    // `files`-only program: the roots are exactly those files.
    if (Array.isArray(cfg?.files) && cfg.files.length > 0) {
      return cfg.files.filter((f) => String(f).endsWith(".vue")).length;
    }
    return countSfcs(configDir);
  }
  // Dedupe on the counted prefix, or `["packages", "packages/x"]` counts the
  // packages subtree twice and the ranking rewards redundant include lists.
  const counted = new Set();
  let total = 0;
  for (const inc of includes) {
    const { dir: incDir, whole } = includeCountBase(configDir, inc);
    if (incDir == null) continue;
    if (counted.has(incDir)) continue;
    counted.add(incDir);
    total += whole ? 1 : countSfcsAt(incDir, countSfcs);
  }
  return total;
}

function countSfcsAt(dir, countSfcs) {
  try {
    return statSync(dir).isDirectory() ? countSfcs(dir) : 0;
  } catch {
    // Include entries may name paths that do not exist; they contribute 0.
    return 0;
  }
}

/**
 * Where (and whether) an include entry can contribute SFCs.
 *
 * The first heuristic here credited every entry's first path segment with the
 * whole subtree, which ranked element-plus's tsconfig.node.json — includes like
 * `packages/theme-chalk/...` and `scripts/...`, ALL buildfiles — at the same
 * 1004 SFCs as tsconfig.web.json's plain `packages`. A config whose include
 * patterns cannot match `.vue` files must contribute nothing, however deep its
 * directory prefixes reach:
 *
 * - a plain path (no glob) counts its subtree (or itself, if it IS a .vue file);
 * - a globbed pattern counts the subtree under its deepest non-glob prefix,
 *   but ONLY when the final segment could match a .vue filename — a bare `*`,
 *   a `.vue`-pinned glob, or an extension-less segment. `vite.config.*` and
 *   `buildfile.ts` are pinned to other extensions and contribute 0.
 */
function includeCountBase(configDir, inc) {
  const segs = String(inc).split(/[\\/]/).filter(Boolean);
  if (segs.length === 0) return { dir: configDir, whole: false };
  const globAt = segs.findIndex((s) => /[*?{]/.test(s));
  if (globAt === -1) {
    const p = join(configDir, ...segs);
    if (segs[segs.length - 1].endsWith(".vue")) return { dir: p, whole: true };
    return { dir: p, whole: false };
  }
  const last = segs[segs.length - 1];
  const couldMatchVue =
    last === "*" || last === "**" || last.endsWith("*.vue") || !last.includes(".");
  if (!couldMatchVue) return { dir: null, whole: false };
  return { dir: join(configDir, ...segs.slice(0, globAt)), whole: false };
}

/**
 * tsconfig files legitimately contain comments and trailing commas, which
 * `JSON.parse` rejects. A parse failure here must not silently drop a target, so
 * comments and trailing commas are stripped before parsing and a still-unparseable
 * file yields `null` (treated as "not a solution file", i.e. kept).
 *
 * Comments are stripped with a STRING-AWARE walk, not a regex: include patterns
 * such as `"internal/**${""}/*"` contain the block-comment delimiters, and the old
 * `\/\*[\s\S]*?\*\//` regex ate the middle of the string — which then made every
 * glob-bearing include list unrecognisable to the SFC ranking above.
 */
function readJsonLoose(path) {
  try {
    const text = stripJsonComments(readFileSync(path, "utf8")).replace(/,(\s*[}\]])/g, "$1");
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function stripJsonComments(text) {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      out += c;
      if (c === "\\") {
        out += text[++i] ?? "";
        continue;
      }
      if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      out += c;
      continue;
    }
    if (c === "/" && text[i + 1] === "/") {
      while (i < text.length && text[i] !== "\n") i++;
      out += "\n";
      continue;
    }
    if (c === "/" && text[i + 1] === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i++;
      i++;
      continue;
    }
    out += c;
  }
  return out;
}

/** Count `.vue` files under a package, bounded so a monorepo walk stays cheap. */
function defaultSfcCount(dir, depth = 0) {
  if (depth > 6) return 0;
  let count = 0;
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return 0;
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORE_DIRS.has(entry.name)) continue;
      count += defaultSfcCount(join(dir, entry.name), depth + 1);
    } else if (entry.name.endsWith(".vue")) {
      count++;
    }
  }
  return count;
}

/**
 * One summary clause line, e.g. `31 failed | 31 passed (62)`.
 *
 * Anchored at the START of a line (`m` flag, no `s`), which the previous version
 * was not. It built `new RegExp(label + "\\s+(.+)")` and matched anywhere in the
 * output — and `\s` matches newlines, so the label could pair with numbers from a
 * different line entirely. The text this runs over is a third-party test suite's
 * console output: arbitrary test names, arbitrary error messages, arbitrary file
 * paths. Letting a label match mid-line means any of that can be read as the
 * census the work gate then rules on.
 */
function summaryClauseLines(text, label) {
  const re = new RegExp(`^[ \\t]*${label}[ \\t]+(\\S.*)$`, "gm");
  const out = [];
  for (const m of text.matchAll(re)) {
    out.push({ index: m.index ?? 0, body: m[1] });
  }
  return out;
}

/** `31 failed | 31 passed (62)` → totals. A missing clause is null, not zero. */
function parseClause(body) {
  const line = body ?? "";
  const total = line.match(/\((\d+)\)/)?.[1];
  const passed = line.match(/(\d+)\s+passed/)?.[1];
  const failed = line.match(/(\d+)\s+failed/)?.[1];
  return {
    total: total ? Number(total) : null,
    passed: passed ? Number(passed) : null,
    failed: failed ? Number(failed) : 0,
  };
}

/**
 * Parse Vitest's summary into a census.
 *
 * This is the surface's work gate. Wall-clock alone cannot tell a faster
 * toolchain from one that made half the suite fail to collect — and a suite that
 * collapses early is *quicker*, which is exactly the wrong thing to reward. A row
 * that ran fewer tests than the baseline is unranked.
 *
 * Vitest prints, e.g.:
 *   Test Files  10 passed (10)
 *        Tests  123 passed | 2 skipped (125)
 *
 * ## The LAST block, not the first, and one block rather than two blended
 *
 * A run can print more than one summary block — a reporter list naming `default`
 * twice, a merged blob report, a watch-mode pass that re-summarises. The old
 * parser matched each label independently and un-anchored, so with two blocks it
 * could take the file line from one and the test line from the other and publish
 * the pair as one census. That is not a number that describes any single run, and
 * nothing downstream could tell: the gate would simply rule on the blend.
 *
 * The final block is the authoritative one (it is the aggregate Vitest exits on),
 * so the `Test Files` line is anchored on its LAST occurrence and the `Tests`
 * line is taken from AFTER it. Independently taking each label's last occurrence
 * would still blend when the trailing block is partial.
 *
 * A run that prints a `Tests` line with no `Test Files` line at all still parses
 * from the `Tests` line alone — that is the shape a single-file invocation emits,
 * and refusing it would turn a readable census into a ❌.
 */
export function parseVitestSummary(output) {
  const text = String(output ?? "");
  const fileLines = summaryClauseLines(text, "Test Files");
  const testLines = summaryClauseLines(text, "Tests");

  const lastFile = fileLines.length > 0 ? fileLines[fileLines.length - 1] : null;
  // The `Tests` line belonging to the SAME block: the first one after the chosen
  // `Test Files` line. With no file line at all, fall back to the last test line.
  const pairedTest = lastFile
    ? (testLines.find((t) => t.index > lastFile.index) ?? null)
    : (testLines[testLines.length - 1] ?? null);

  const tests = parseClause(pairedTest?.body);
  const files = parseClause(lastFile?.body);
  return {
    tests: tests.total,
    testsPassed: tests.passed,
    testsFailed: tests.failed,
    files: files.total,
    filesPassed: files.passed,
    // Published alongside `files` because the total alone is misleading on a real
    // project. Hoppscotch's `hoppscotch-common` prints
    // `Test Files  31 failed | 31 passed (62)`: half its 62 spec files never
    // collect at all, because `@hoppscotch/data` is built by a postinstall the
    // fetch step skips. A census reading "62 files" with no failure count reads
    // as a suite that ran, and the reader cannot see that half of it did not.
    filesFailed: files.failed,
    // How many summary blocks were found. Recorded so a surface can say the
    // census came from the last of several rather than silently picking one.
    summaryBlocks: fileLines.length || (testLines.length > 0 ? 1 : 0),
    // `parsed` gates the whole surface, so it requires the TEST total — not the
    // file total, and not either-or.
    //
    // The failure mode that forced this: when every test file fails to collect
    // (a plugin that cannot compile the project's SFCs does exactly that),
    // Vitest still prints a file line — `Test Files  3 failed (3)` — while the
    // test line reads `Tests  no tests`, which carries no `(n)`. With
    // `tests.total !== null || files.total !== null` that combination parsed
    // "successfully" with `tests: null`, the surface recorded the row as `ok`,
    // and the downstream count gate `continue`d over the null instead of
    // failing it. The result was a challenger that executed ZERO tests
    // published as the fastest row in the table.
    //
    // Requiring the test total means such a run throws out of `measure()` and
    // becomes a visible ❌ instead.
    parsed: tests.total !== null,
  };
}
