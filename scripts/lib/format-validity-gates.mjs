import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  FORMAT_VALIDITY_PLANTS,
  FORMAT_VALIDITY_SUITE_HASH,
  FORMAT_VALIDITY_SUITE_VERSION,
} from "./format-validity-plants.mjs";
import { FORMAT_ROW_IDS } from "./format-row-specs.mjs";

const PREFIX = "@@FORMAT_VALIDITY_JSON@@";
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const childFile = join(dirname(fileURLToPath(import.meta.url)), "format-validity-child.mjs");

function synthetic(entrypoint, status, reason) {
  return {
    schemaVersion: 1,
    suiteVersion: FORMAT_VALIDITY_SUITE_VERSION,
    suiteHash: FORMAT_VALIDITY_SUITE_HASH,
    entrypoint,
    exactPath: "validity child did not return path metadata",
    status,
    reason,
    plantCount: FORMAT_VALIDITY_PLANTS.length,
    passed: 0,
    failed: status === "FAIL" ? FORMAT_VALIDITY_PLANTS.length : 0,
    unknown: status === "UNKNOWN" ? FORMAT_VALIDITY_PLANTS.length : 0,
    results: FORMAT_VALIDITY_PLANTS.map((plant) => ({
      id: plant.id,
      coverage: plant.coverage,
      status,
      detail: reason,
    })),
  };
}

export function runFormatValidityChildren({
  entrypoints = FORMAT_ROW_IDS,
  timeoutMs = 120_000,
} = {}) {
  const results = {};
  for (const entrypoint of entrypoints) {
    const child = spawnSync(process.execPath, [childFile, "--entrypoint", entrypoint], {
      cwd: rootDir,
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    });
    try {
      if (child.error) throw child.error;
      const text = String(child.stdout ?? "");
      const start = text.lastIndexOf(PREFIX);
      if (start < 0)
        throw new Error(
          `child exited ${child.status}: no result marker; ${String(child.stderr).slice(0, 500)}`,
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
    suiteVersion: FORMAT_VALIDITY_SUITE_VERSION,
    suiteHash: FORMAT_VALIDITY_SUITE_HASH,
    plantCount: FORMAT_VALIDITY_PLANTS.length,
    results,
  };
}

export function applyFormatValidityGates(rows, validity) {
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
      row.notes = `${row.notes} | ⚠ FORMAT SEMANTIC VALIDITY ${status} — ${summary}. Full per-plant evidence is retained in validation.formatSemantics.`;
    } else {
      row.notes = `${row.notes} | ✓ format validity ${gate.passed}/${gate.plantCount}: parseable, descriptor/template/script semantics preserved and exact invocation idempotent.`;
    }
  }
  invalidateClassesWithBadReference(rows);
  return rows;
}

function invalidateClassesWithBadReference(rows) {
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
        row.notes = `${row.notes} | ⚠ COMPARISON REFERENCE MISSING — this class has no measured Prettier denominator.`;
      }
      continue;
    }
    if (reference.status === "ok") continue;
    for (const row of members) {
      if (row === reference || row.status === "skipped" || row.status === "error") continue;
      row.status = "unranked";
      row.notes = `${row.notes} | ⚠ COMPARISON REFERENCE INVALID — the declared Prettier reference did not pass mandatory validity.`;
    }
  }
}
