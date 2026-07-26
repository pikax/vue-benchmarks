/**
 * Minimal confirmation harness (not a benchmark).
 * Collects PASS / FAIL / SKIP with structured notes for a tool × case matrix.
 */

export function createSuite(name) {
  /** @type {Array<{ suite: string, caseId: string, tool: string, status: 'pass'|'fail'|'skip', message?: string, detail?: object }>} */
  const results = [];

  return {
    name,
    results,
    pass(caseId, tool, message = "", detail) {
      results.push({ suite: name, caseId, tool, status: "pass", message, detail });
    },
    fail(caseId, tool, message, detail) {
      results.push({ suite: name, caseId, tool, status: "fail", message, detail });
    },
    skip(caseId, tool, message, detail) {
      results.push({ suite: name, caseId, tool, status: "skip", message, detail });
    },
    /**
     * @param {string} caseId
     * @param {string} tool
     * @param {() => void | Promise<void>} fn
     */
    async run(caseId, tool, fn) {
      try {
        await fn();
        this.pass(caseId, tool);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.fail(caseId, tool, message);
      }
    },
  };
}

export function summarize(allResults) {
  const pass = allResults.filter((r) => r.status === "pass").length;
  const fail = allResults.filter((r) => r.status === "fail").length;
  const skip = allResults.filter((r) => r.status === "skip").length;
  return { pass, fail, skip, total: allResults.length };
}

export function formatReport(allResults) {
  const lines = [];
  lines.push("# Confirmation suite (correctness, not performance)");
  lines.push("");
  lines.push(
    "Tools are checked against planted expectations (compile → mount, lint counts, type diagnostics, component-meta shapes).",
  );
  lines.push("Skip = missing API/binary or out of scope. Fail = plant expectation not met.");
  lines.push("");

  const bySuite = new Map();
  for (const r of allResults) {
    if (!bySuite.has(r.suite)) bySuite.set(r.suite, []);
    bySuite.get(r.suite).push(r);
  }

  for (const [suite, rows] of bySuite) {
    lines.push(`## ${suite}`);
    lines.push("");
    lines.push("| Case | Tool | Status | Notes |");
    lines.push("| --- | --- | --- | --- |");
    for (const r of rows) {
      const icon = r.status === "pass" ? "pass" : r.status === "fail" ? "**FAIL**" : "skip";
      const notes = (r.message || "").replace(/\|/g, "\\|").replace(/\n/g, " ");
      lines.push(`| ${r.caseId} | ${r.tool} | ${icon} | ${notes} |`);
    }
    lines.push("");
  }

  const s = summarize(allResults);
  lines.push("## Summary");
  lines.push("");
  lines.push(`- pass: **${s.pass}**`);
  lines.push(`- fail: **${s.fail}**`);
  lines.push(`- skip: **${s.skip}**`);
  lines.push(`- total: ${s.total}`);
  lines.push("");
  return lines.join("\n");
}

export function printConsole(allResults) {
  for (const r of allResults) {
    const mark = r.status === "pass" ? "✓" : r.status === "fail" ? "✗" : "○";
    const msg = r.message ? ` — ${r.message}` : "";
    console.log(`${mark} [${r.suite}] ${r.caseId} · ${r.tool}${msg}`);
  }
  const s = summarize(allResults);
  console.log("");
  console.log(`Summary: ${s.pass} pass · ${s.fail} fail · ${s.skip} skip (${s.total} total)`);
}
