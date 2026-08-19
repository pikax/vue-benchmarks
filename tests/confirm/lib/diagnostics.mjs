/**
 * Parse / score CLI diagnostic output for confirmation plants.
 */

/**
 * Normalize one diagnostic from vue-tsc / golar / verter / vize text.
 * @returns {Array<{ file?: string, line?: number, column?: number, code?: string, message: string, raw: string }>}
 */
export function parseDiagnostics(text) {
  if (!text) return [];
  const out = [];
  const lines = String(text).split(/\r?\n/);
  let lastFile = "";

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) continue;

    // vue-tsc / golar / verter: path(line,col): error TSxxxx: message
    const tsc = t.match(
      /^(?:(?:error|warning)\s+)?(.+?)\((\d+),(\d+)\):\s+(?:error|warning)\s+(TS\d+)\s*:?\s*(.*)$/i,
    );
    if (tsc) {
      out.push({
        file: tsc[1].replace(/\\/g, "/"),
        line: Number(tsc[2]),
        column: Number(tsc[3]),
        code: tsc[4].toUpperCase(),
        message: tsc[5] || t,
        raw: t,
      });
      continue;
    }

    // vize: error:line:col [TSxxxx] message  (file often on the previous line)
    const vize = t.match(/^(?:error|warning):(\d+):(\d+)\s+\[(TS\d+)\]\s*(.*)$/i);
    if (vize) {
      const fileGuess = lastFile && /\.(vue|ts|tsx|js|mts|cts)$/i.test(lastFile) ? lastFile : undefined;
      out.push({
        file: fileGuess,
        line: Number(vize[1]),
        column: Number(vize[2]),
        code: vize[3].toUpperCase(),
        message: vize[4] || t,
        raw: t,
      });
      continue;
    }

    // generic "error TSxxxx: message"
    const loose = t.match(/\berror\s+(TS\d+)\s*:?\s*(.*)$/i);
    if (loose && /error/i.test(t)) {
      out.push({
        file: lastFile || undefined,
        code: loose[1].toUpperCase(),
        message: loose[2] || t,
        raw: t,
      });
      continue;
    }

    const asPath = t.replace(/\\/g, "/");
    if (/\.(vue|ts|tsx|js|mts|cts)$/i.test(asPath)) lastFile = asPath;
  }
  return out;
}

/**
 * Count error-like diagnostic lines across vue-tsc / vize / verter-ish formats.
 * Prefer parsed diagnostics; fall back to a tool summary line when nothing parsed.
 */
export function countErrors(text) {
  if (!text) return 0;
  const parsed = parseDiagnostics(text);
  if (parsed.length) return parsed.length;
  const summary = text.match(/(\d+)\s+error\(s\)/i) || text.match(/Found\s+(\d+)\s+error/i);
  if (summary) return Number(summary[1]);
  return 0;
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

export function fileMatches(diagFile, expectFile) {
  if (!expectFile) return true;
  if (!diagFile) return false;
  const got = diagFile.replace(/\\/g, "/");
  const want = String(expectFile).replace(/\\/g, "/");
  return got === want || got.endsWith(`/${want}`) || got.endsWith(want);
}

function diagHay(d) {
  return `${d.code || ""} ${d.message || ""} ${d.raw || ""}`;
}

function diagOnPin(d, pin) {
  if (!fileMatches(d.file, pin.file)) return false;
  return d.line === pin.targetLine || d.line === pin.commentLine;
}

/**
 * Score a typecheck/lint run against plant expectations.
 *
 * `maxErrors`, when set, is a hard fail — a planted error plus 20 extras is not a pass.
 * Location/code pins (`expectFile` / `expectLine` / `expectCode`) are optional and
 * only applied when parsed diagnostics exist.
 *
 * @param {{
 *   combined: string,
 *   status: number|null,
 *   expectErrors: boolean,
 *   minErrors?: number,
 *   maxErrors?: number,
 *   mustMatch?: string[],
 *   mustNotMatch?: string[],
 *   expectFile?: string,
 *   expectLine?: number,
 *   expectCode?: string,
 *   pins?: Array<{ file: string, commentLine: number, targetLine: number }>,
 *   expectMention?: string[],
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
    expectFile,
    expectLine,
    expectCode,
    pins = [],
    expectMention = [],
  } = opts;

  const diags = parseDiagnostics(combined);
  const errors = countErrors(combined);

  if (mustNotMatch.some((n) => combined.includes(n))) {
    return {
      ok: false,
      errors,
      diagnostics: diags,
      message: `output contained forbidden pattern: ${mustNotMatch.find((n) => combined.includes(n))}`,
    };
  }

  if (expectErrors) {
    if (errors < minErrors) {
      return {
        ok: false,
        errors,
        diagnostics: diags,
        message: `expected ≥${minErrors} error(s), got ${errors}`,
      };
    }
    if (maxErrors != null && errors > maxErrors) {
      return {
        ok: false,
        errors,
        diagnostics: diags,
        message: `expected ≤${maxErrors} error(s), got ${errors}`,
      };
    }
    if (pins.length) {
      for (const pin of pins) {
        const at = diags.filter((d) => diagOnPin(d, pin));
        if (!at.length) {
          return {
            ok: false,
            errors,
            diagnostics: diags,
            message: `no diagnostic at ${pin.file}:${pin.targetLine} (@plant-error)`,
          };
        }
        const hay = at.map(diagHay).join("\n");
        if (mustMatch.length && !matchesAny(hay, mustMatch)) {
          return {
            ok: false,
            errors,
            diagnostics: diags,
            message: `plant at ${pin.file}:${pin.targetLine} did not mention one of: ${mustMatch.join(" | ")}`,
          };
        }
        const missing = expectMention.filter((n) => !hay.includes(n));
        if (missing.length) {
          return {
            ok: false,
            errors,
            diagnostics: diags,
            message: `plant at ${pin.file}:${pin.targetLine} did not mention ${missing.join(", ")}`,
          };
        }
      }
    } else if (mustMatch.length && !matchesAny(combined, mustMatch)) {
      return {
        ok: false,
        errors,
        diagnostics: diags,
        message: `expected diagnostics to match one of: ${mustMatch.join(" | ")} (got ${errors} error lines)`,
      };
    }
    if (diags.length && (expectFile || expectLine != null || expectCode)) {
      const hit = diags.some((d) => {
        if (expectCode && d.code !== String(expectCode).toUpperCase()) return false;
        if (!fileMatches(d.file, expectFile)) return false;
        if (expectLine != null && d.line !== Number(expectLine)) return false;
        return true;
      });
      if (!hit) {
        const want = [
          expectCode,
          expectFile,
          expectLine != null ? `line ${expectLine}` : "",
        ]
          .filter(Boolean)
          .join(" ");
        return {
          ok: false,
          errors,
          diagnostics: diags,
          message: `no diagnostic at ${want}`,
        };
      }
    }
    return {
      ok: true,
      errors,
      diagnostics: diags,
      message: `caught ${errors} error(s)`,
    };
  }

  if (errors > 0) {
    return {
      ok: false,
      errors,
      diagnostics: diags,
      message: `expected clean (0 errors), got ${errors}`,
    };
  }
  return { ok: true, errors: 0, diagnostics: diags, message: "clean" };
}
