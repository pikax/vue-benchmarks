/**
 * Per-workspace request budgets, scaled linearly by file count.
 *
 * Every budget in the IDE suites used to be a flat constant sized for the worst
 * case anywhere in the harness: 30s per request, 45-60s for a warm-up, 120s in
 * the scale suite. On a 3-file workspace that is not a budget, it is an absence
 * of one — the slowest thing a 3-file project has ever legitimately made a
 * server do is 1.11s (Volar hover, script setup, 2-core CI runner), so a 30s
 * ceiling meant a wedged server cost 27x what a working one did. Falsified in
 * production: a wedged `textDocument/completion` burned 9 minutes of a
 * 10-minute job (4 warm-ups x 60s + 5 readiness polls x 60s) and the job died
 * with no artifact and no row naming the server that broke.
 *
 * A budget should be a function of how much work the request implies, and in
 * this harness the only thing that varies is project size. Hence: linear in
 * file count, from a small-project floor to a large-project cap.
 *
 *   files <= 20     floor      (every non-scale suite: 1-5 files)
 *   files >= 1000   cap        (deliberately above anything run today)
 *   in between      interpolated
 *
 *   files      20      100      200      500     1000
 *   coldMs     60s    69.8s      82s   118.8s     180s
 *   warmMs      5s       7s     9.6s    17.2s      30s
 *   projectMs  60s    69.8s      82s   118.8s     180s
 *
 * The sizes actually in use — 20/100/500 in the scale suite, 200 in the
 * generated bench corpus — all sit ON the slope, which is the point of putting
 * the cap a size class beyond them.
 *
 * THREE CLASSES, because "warm" is not one thing:
 *
 *   coldMs     Session start and project load. Paid once, before the server can
 *              answer anything. MEASURED: initialize 527ms (Volar), and
 *              time-to-usable 1.88s @20 -> 3.59s @500.
 *
 *   warmMs     A request against an already-loaded project, answered from state
 *              the server holds. MEASURED: the slowest passing ranked op on any
 *              server outside the scale suite is 1.11s; at 500 files, warm
 *              hover is ~1ms and completion ~140ms. Project size barely moves
 *              these, so the ramp is headroom rather than need.
 *
 *   projectMs  A query that touches EVERY file in the project on every call —
 *              references today, workspace symbols and rename when they land.
 *              Not warm work in any useful sense: it does cold-sized work each
 *              time it runs, and it is the one class where project size shows
 *              up directly in the measurement. MEASURED: Volar/TNB
 *              references@500 took 51.13s on a 4-core CI runner, against a
 *              `warmMs` of 17.2s at that size. Folding this into `warmMs`
 *              deletes that row, and a `usable` timeout suppresses every larger
 *              size behind it, so one harness-side overrun erases 12 of a
 *              server's 16 scale rows looking exactly like a tool failure. That
 *              has happened once already; it is why the flat budget was 120s —
 *              and the ramp independently lands on 118.8s at that size, because
 *              it is anchored on the same measurement.
 *
 * Identical for every server, at every size — the fairness rule the rest of
 * this harness runs on. A budget that varied by server would silently subsidise
 * whichever one got the larger one.
 */

/** At or below this, every budget sits at its floor. Covers all non-scale suites. */
export const SMALL_PROJECT_FILES = 20;

/**
 * At or above this, every budget sits at its cap.
 *
 * 1000, deliberately ABOVE anything measured here today — the scale suite's
 * largest corpus is 500 and the generated bench corpus is 200. Anchoring the
 * cap on the current largest size would put today's biggest run at the ceiling,
 * so the next corpus that grows gets no more budget than the one before it and
 * the ramp silently stops being a ramp. Sitting the cap a size class beyond
 * anything in use keeps 500 on the slope (118.8s cold / 17.2s warm) with real
 * room above it.
 */
export const LARGE_PROJECT_FILES = 1000;

/** Floor and cap per class, in ms. */
const RANGES = {
  coldMs: [60_000, 180_000],
  warmMs: [5_000, 30_000],
  projectMs: [60_000, 180_000],
};

/**
 * Fraction of the way from the small-project floor to the large-project cap.
 * Clamped at both ends, and 0 for anything unusable (NaN, negative, undefined)
 * so a suite that forgets to declare a file count gets the floor rather than
 * `NaN` — a `NaN` timeout fires immediately and would read as "every server
 * failed this operation".
 */
function ramp(fileCount) {
  const n = Number(fileCount);
  if (!Number.isFinite(n) || n <= SMALL_PROJECT_FILES) return 0;
  if (n >= LARGE_PROJECT_FILES) return 1;
  return (n - SMALL_PROJECT_FILES) / (LARGE_PROJECT_FILES - SMALL_PROJECT_FILES);
}

/**
 * Budgets for a workspace of `fileCount` files.
 *
 * @param {number} fileCount .vue/.ts files the suite wrote into the workspace
 * @returns {{fileCount: number, coldMs: number, warmMs: number, projectMs: number}}
 */
export function budgetFor(fileCount = 0) {
  const t = ramp(fileCount);
  const at = ([lo, hi]) => Math.round(lo + t * (hi - lo));
  return {
    fileCount: Number.isFinite(Number(fileCount)) ? Number(fileCount) : 0,
    coldMs: at(RANGES.coldMs),
    warmMs: at(RANGES.warmMs),
    projectMs: at(RANGES.projectMs),
  };
}

/**
 * The budget for a suite's measure() context.
 *
 * Prefers what the runner computed and threaded through `createSession`, and
 * falls back to deriving it from the workspace the suite itself built. Those
 * two agree by construction — the runner derives it from the same
 * `ws.fileCount` — so this is not a guess: it states the invariant that a
 * suite's budget is a function of its workspace and nothing else. The fallback
 * is what lets a suite's measure() be driven directly, which every harness test
 * does, without each test fixture having to restate a budget it does not care
 * about. Reading `ctx.budget` bare would hand those callers `undefined`, and an
 * `undefined` timeout is a `NaN` timer that fires immediately — every row would
 * read as "this server failed the operation".
 */
export function budgetOf(ctx) {
  return ctx?.budget ?? budgetFor(ctx?.ws?.fileCount);
}
