/**
 * The two extension-host measurements that had a sentinel where a number
 * should have been. Both take their VS Code dependencies as arguments so the
 * harness can drive them without launching Electron
 * (tests/harness/e2e-vscode-measure.test.mjs).
 */

const TIMED_OUT = Symbol("timed-out");
const DEFAULT_ACTIVATE_TIMEOUT_MS = 60_000;
const DEFAULT_DIAGNOSTICS_TIMEOUT_MS = 45_000;

const defaultNow = () => performance.now();

/**
 * Activate the subject extension, and report activation ONLY when this run
 * performed it.
 *
 * The bug this replaces: the previous version returned `activateMs: 0` when
 * `ext.isActive` was already true, and that zero was published in the Activate
 * column next to real measurements. Volar activates eagerly on a Vue workspace,
 * so it reported 0 ms in every single cell while Vize reported 198 ms and
 * Verter 2.21 s — a reader sees one extension activating infinitely fast. It
 * was never a measurement of anything; it was the absence of one.
 *
 * `null` is the honest value, and it is what the surrounding report renders as
 * "n/a (pre-activated)". A pre-activated extension is NOT slower or faster than
 * the others here — the comparison simply does not exist, because the work
 * happened before the clock could start. Making it rank in either direction
 * would be inventing a result.
 *
 * @returns {Promise<{activateMs: number|null, activateOutcome: string}>}
 */
async function activateSubject({
  extension,
  timeoutMs = DEFAULT_ACTIVATE_TIMEOUT_MS,
  now = defaultNow,
  label = "extension",
}) {
  if (extension == null) {
    return { activateMs: null, activateOutcome: "no-extension" };
  }
  if (extension.isActive) {
    return { activateMs: null, activateOutcome: "already-active" };
  }

  const t0 = now();
  let timer;
  try {
    await Promise.race([
      extension.activate(),
      new Promise((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error(`activate timeout ${label}`)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
  return { activateMs: now() - t0, activateOutcome: "measured" };
}

/**
 * Time from a COMMON origin to the first diagnostics publish for `uri`.
 *
 * The bug this replaces: the previous version called `getDiagnostics(uri)`
 * first and returned immediately if anything was already there. Because it was
 * called after the document had been opened, a server that published during the
 * open scored ~0 ms while a server that published on a later event scored its
 * real latency. One recorded run put 0 ms (2 diagnostics) beside 1.47 s
 * (0 diagnostics) in the same column — a ~17,000x spread produced entirely by
 * when each clock happened to start.
 *
 * The origin is now the same for everyone and it is EARLIER than the open: the
 * subscription is registered and the clock started before `openDocument()` is
 * called, so a publish that lands during the open is timed rather than missed.
 * Open time is measured on the same timeline and returned here, so the two
 * numbers cannot drift apart.
 *
 * Three outcomes, and only one of them is a duration:
 *
 *   measured  — a publish arrived after the origin. `waitMs` is a real wait.
 *   pre-open  — diagnostics for this URI already existed before the file was
 *               opened (an eager workspace scan). Real, and not comparable to a
 *               wait this run timed, so `waitMs` is null rather than 0.
 *   timeout   — nothing arrived inside the budget. `waitMs` is null rather than
 *               the budget: publishing the timeout as the wait would put a
 *               constant in a measurement column, which is the same class of
 *               bug in the other direction.
 *
 * An EMPTY publish counts as a publish. The probe workspaces are clean, so
 * "this file has no problems" is the correct answer and arriving at it is the
 * work being timed. A server that never answers at all is the `timeout` case,
 * which is visibly different in the table.
 *
 * @returns {Promise<{waitMs: number|null, openMs: number, count: number,
 *                    outcome: "measured"|"pre-open"|"timeout", timeoutMs: number}>}
 */
async function waitForFirstDiagnostics({
  languages,
  uri,
  openDocument,
  timeoutMs = DEFAULT_DIAGNOSTICS_TIMEOUT_MS,
  now = defaultNow,
}) {
  const key = uri.toString();
  const before = languages.getDiagnostics(uri) ?? [];

  let resolveFirst;
  const firstPublish = new Promise((resolve) => {
    resolveFirst = resolve;
  });

  // Origin. Everything below is measured from here, for every server.
  const t0 = now();
  const subscription = languages.onDidChangeDiagnostics((event) => {
    const uris = event?.uris ?? [];
    if (uris.some((u) => u.toString() === key)) resolveFirst(now() - t0);
  });

  let timer;
  const budget = new Promise((resolve) => {
    timer = setTimeout(() => resolve(TIMED_OUT), timeoutMs);
  });

  try {
    const openStart = now();
    await openDocument();
    const openMs = now() - openStart;

    if (before.length > 0) {
      return { waitMs: null, openMs, count: before.length, outcome: "pre-open", timeoutMs };
    }

    const raced = await Promise.race([firstPublish, budget]);
    const after = languages.getDiagnostics(uri) ?? [];
    if (raced === TIMED_OUT) {
      return { waitMs: null, openMs, count: after.length, outcome: "timeout", timeoutMs };
    }
    return { waitMs: raced, openMs, count: after.length, outcome: "measured", timeoutMs };
  } finally {
    clearTimeout(timer);
    subscription.dispose();
  }
}

module.exports = {
  DEFAULT_ACTIVATE_TIMEOUT_MS,
  DEFAULT_DIAGNOSTICS_TIMEOUT_MS,
  activateSubject,
  waitForFirstDiagnostics,
};
