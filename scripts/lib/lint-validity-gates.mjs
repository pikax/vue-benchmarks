import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { LINT_ROW_IDS } from "./lint-row-specs.mjs";
import {
  LINT_VALIDITY_PLANTS,
  LINT_VALIDITY_SUITE_HASH,
  LINT_VALIDITY_SUITE_VERSION,
} from "./lint-validity-plants.mjs";

const PREFIX = "@@LINT_VALIDITY_JSON@@";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const childFile = join(dirname(fileURLToPath(import.meta.url)), "lint-validity-child.mjs");

function synthetic(entrypoint, status, reason) {
  return {
    schemaVersion: 1,
    suiteVersion: LINT_VALIDITY_SUITE_VERSION,
    suiteHash: LINT_VALIDITY_SUITE_HASH,
    entrypoint,
    exactPath: "validity child did not return path metadata",
    status,
    reason,
    plantCount: LINT_VALIDITY_PLANTS.length,
    passed: 0,
    failed: status === "FAIL" ? LINT_VALIDITY_PLANTS.length : 0,
    unknown: status === "UNKNOWN" ? LINT_VALIDITY_PLANTS.length : 0,
    results: LINT_VALIDITY_PLANTS.map((plant) => ({
      id: plant.id,
      coverage: plant.coverage,
      status,
      detail: reason,
    })),
  };
}

export function runLintValidityChildren({
  configRoot,
  entrypoints = LINT_ROW_IDS,
  timeoutMs = 120_000,
} = {}) {
  const results = {};
  for (const entrypoint of entrypoints) {
    const child = spawnSync(
      process.execPath,
      [childFile, "--entrypoint", entrypoint, "--config-root", configRoot],
      {
        cwd: rootDir,
        encoding: "utf8",
        timeout: timeoutMs,
        maxBuffer: 32 * 1024 * 1024,
        windowsHide: true,
      },
    );
    try {
      if (child.error) throw child.error;
      const text = String(child.stdout ?? "");
      const start = text.lastIndexOf(PREFIX);
      if (start < 0)
        throw new Error(
          `child exited ${child.status}: no result marker; ${String(child.stderr).slice(0, 600)}`,
        );
      const parsed = JSON.parse(text.slice(start + PREFIX.length).split(/\r?\n/, 1)[0]);
      results[entrypoint] = Array.isArray(parsed.results)
        ? parsed
        : synthetic(
            entrypoint,
            parsed.status ?? "UNKNOWN",
            parsed.reason ?? "validity child returned no plant results",
          );
    } catch (error) {
      results[entrypoint] = synthetic(
        entrypoint,
        "FAIL",
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  return {
    schemaVersion: 1,
    suiteVersion: LINT_VALIDITY_SUITE_VERSION,
    suiteHash: LINT_VALIDITY_SUITE_HASH,
    plantCount: LINT_VALIDITY_PLANTS.length,
    results,
  };
}

export function applyLintValidityGates(rows, validity) {
  for (const row of rows) {
    if (row.status === "skipped" || row.status === "error") continue;
    const gate = validity?.results?.[row.id];
    if (!gate || gate.status !== "PASS") {
      row.status = "unranked";
      const status = gate?.status ?? "UNKNOWN";
      const summary =
        gate?.results
          ?.filter((result) => result.status !== "PASS")
          .map((r) => `${r.id}: ${r.detail}`)
          .slice(0, 2)
          .join("; ") ||
        gate?.reason ||
        "no exact-row verdict";
      const contextualNote =
        row.id.startsWith("biome-lint") || row.id.startsWith("oxlint")
          ? "This exact row is script-block-only on the planted Vue template capabilities and remains contextual/unranked"
          : "Rows missing any mandatory planted capability remain contextual/unranked";
      row.notes = `${row.notes} | ⚠ VUE TEMPLATE-LINT VALIDITY ${status} — ${summary}. ${contextualNote}; all results are retained in validation.lintSemantics.`;
    } else {
      row.notes = `${row.notes} | ✓ Vue template-lint validity ${gate.passed}/${gate.plantCount}: exact-row dirty/clean diagnostics were file, line and rule/concept attributed.`;
    }
  }
  const classes = new Map();
  for (const row of rows) {
    if (!row.comparisonClass) continue;
    if (!classes.has(row.comparisonClass)) classes.set(row.comparisonClass, []);
    classes.get(row.comparisonClass).push(row);
  }
  for (const members of classes.values()) {
    const reference = members.find((row) => row.baseline);
    if (!reference) {
      for (const row of members) {
        if (row.status === "skipped" || row.status === "error") continue;
        row.status = "unranked";
        row.notes = `${row.notes} | ⚠ COMPARISON REFERENCE MISSING — this invocation class has no measured eslint-plugin-vue denominator.`;
      }
      continue;
    }
    if (reference.status === "ok") continue;
    for (const row of members) {
      if (row === reference || row.status === "skipped" || row.status === "error") continue;
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ COMPARISON REFERENCE INVALID — the eslint-plugin-vue denominator in this invocation class did not pass mandatory validity.`;
    }
  }
  return rows;
}
