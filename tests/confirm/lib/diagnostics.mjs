/**
 * Parse / score CLI diagnostic output for confirmation plants.
 */

/**
 * Count error-like diagnostic lines across vue-tsc / vize / verter-ish formats.
 * Intentionally loose: we care that *some* error was raised for planted bugs,
 * and zero for clean cases.
 */
export function countErrors(text) {
  if (!text) return 0;
  // Prefer summary lines when tools print them
  const summary = text.match(/(\d+)\s+error\(s\)/i) || text.match(/Found\s+(\d+)\s+error/i);
  if (summary) {
    return Number(summary[1]);
  }

  const lines = text.split(/\r?\n/);
  let count = 0;
  for (const line of lines) {
    const t = line.trim();
    if (!t) continue;
    // vue-tsc / golar: file(line,col): error TSxxxx:
    if (/:\s*error\s+TS\d+/i.test(t)) {
      count++;
      continue;
    }
    // vize: error:line:col [TSxxxx]
    if (/\berror:\d+:\d+\s+\[TS\d+\]/i.test(t)) {
      count++;
      continue;
    }
    if (/\berror\b.*\[TS\d+\]/i.test(t)) {
      count++;
      continue;
    }
    // generic "error TS"
    if (/\berror TS\d+/i.test(t)) {
      count++;
      continue;
    }
  }
  return count;
}

/** Detect tool bootstrap failures that should be skip, not diagnostic fail. */
export function isToolBootstrapFailure(text) {
  if (!text) return false;
  return (
    /Access is denied/i.test(text) ||
    /IO error/i.test(text) ||
    /no supported tsgo engine/i.test(text) ||
    /ERR_PACKAGE_PATH_NOT_EXPORTED/i.test(text) ||
    /Cannot find module ['"]golar/i.test(text)
  );
}

/**
 * True if any of the needles appear in the combined output (case-sensitive by default).
 */
export function matchesAny(text, needles) {
  if (!needles?.length) return true;
  const hay = text || "";
  return needles.some((n) => hay.includes(n));
}

/**
 * Score a typecheck/lint run against plant expectations.
 *
 * @param {{
 *   combined: string,
 *   status: number|null,
 *   expectErrors: boolean,
 *   minErrors?: number,
 *   maxErrors?: number,
 *   mustMatch?: string[],
 *   mustNotMatch?: string[],
 * }} opts
 */
export function scoreDiagnostics(opts) {
  const {
    combined,
    expectErrors,
    minErrors = 1,
    maxErrors,
    mustMatch = [],
    mustNotMatch = [],
  } = opts;

  const errors = countErrors(combined);
  const notes = [];

  if (mustNotMatch.some((n) => combined.includes(n))) {
    return {
      ok: false,
      errors,
      message: `output contained forbidden pattern: ${mustNotMatch.find((n) => combined.includes(n))}`,
    };
  }

  if (expectErrors) {
    if (errors < minErrors) {
      return {
        ok: false,
        errors,
        message: `expected ≥${minErrors} error(s), got ${errors}`,
      };
    }
    if (maxErrors != null && errors > maxErrors) {
      notes.push(`error count ${errors} > max ${maxErrors}`);
    }
    if (mustMatch.length && !matchesAny(combined, mustMatch)) {
      return {
        ok: false,
        errors,
        message: `expected diagnostics to match one of: ${mustMatch.join(" | ")} (got ${errors} error lines)`,
      };
    }
    return {
      ok: true,
      errors,
      message: `caught ${errors} error(s)`,
    };
  }

  // expect clean
  if (errors > 0) {
    return {
      ok: false,
      errors,
      message: `expected clean (0 errors), got ${errors}`,
    };
  }
  return { ok: true, errors: 0, message: "clean" };
}
