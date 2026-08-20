/** Parent-side launcher and row gate for component-meta plants. */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  COMPONENT_META_VALIDITY_PLANTS,
  COMPONENT_META_VALIDITY_SUITE_HASH,
  COMPONENT_META_VALIDITY_SUITE_VERSION,
} from "./component-meta-validity-plants.mjs";

export const COMPONENT_META_VALIDITY_JSON_PREFIX = "@@COMPONENT_META_VALIDITY_JSON@@";
export const COMPONENT_META_VALIDITY_ENTRYPOINTS = Object.freeze([
  "vue-component-meta",
  "verter-component-meta",
]);

const childFile = join(
  dirname(fileURLToPath(import.meta.url)),
  "component-meta-validity-child.mjs",
);

function synthetic(entrypoint, status, detail) {
  const results = COMPONENT_META_VALIDITY_PLANTS.map((plant) => ({
    id: plant.id,
    coverage: plant.coverage,
    status,
    phase: status === "UNKNOWN" ? "not-run" : "child",
    detail,
  }));
  return {
    schemaVersion: 1,
    suiteVersion: COMPONENT_META_VALIDITY_SUITE_VERSION,
    suiteHash: COMPONENT_META_VALIDITY_SUITE_HASH,
    entrypoint,
    exactPath: "child process did not return exact-path metadata",
    status,
    reason: detail,
    plantCount: results.length,
    passed: 0,
    failed: status === "FAIL" ? results.length : 0,
    unknown: status === "UNKNOWN" ? results.length : 0,
    results,
  };
}

function parsePayload(stdout) {
  const text = String(stdout ?? "");
  const start = text.lastIndexOf(COMPONENT_META_VALIDITY_JSON_PREFIX);
  if (start < 0) throw new Error("validity child emitted no JSON marker");
  return JSON.parse(
    text.slice(start + COMPONENT_META_VALIDITY_JSON_PREFIX.length).split(/\r?\n/, 1)[0],
  );
}

export function runComponentMetaValidityChildren({ timeoutMs = 120_000, spawn = spawnSync } = {}) {
  const results = {};
  for (const entrypoint of COMPONENT_META_VALIDITY_ENTRYPOINTS) {
    const child = spawn(process.execPath, [childFile, "--entrypoint", entrypoint], {
      cwd: process.cwd(),
      encoding: "utf8",
      timeout: timeoutMs,
      maxBuffer: 32 * 1024 * 1024,
      windowsHide: true,
      env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" },
    });
    try {
      const payload = parsePayload(child.stdout);
      if (child.status !== 0 || child.signal || child.error) {
        throw new Error(
          child.error?.message ??
            `validity child exited ${child.status ?? child.signal ?? "without a status"}`,
        );
      }
      results[entrypoint] = payload;
    } catch (error) {
      const stderr = String(child.stderr ?? "").trim();
      const detail = `${error instanceof Error ? error.message : String(error)}${stderr ? `: ${stderr.slice(0, 1000)}` : ""}`;
      results[entrypoint] = synthetic(entrypoint, "FAIL", detail);
    }
  }
  return {
    schemaVersion: 1,
    suiteVersion: COMPONENT_META_VALIDITY_SUITE_VERSION,
    suiteHash: COMPONENT_META_VALIDITY_SUITE_HASH,
    plantCount: COMPONENT_META_VALIDITY_PLANTS.length,
    status: Object.values(results).some((result) => result.status === "FAIL")
      ? "FAIL"
      : Object.values(results).some((result) => result.status === "UNKNOWN")
        ? "UNKNOWN"
        : "PASS",
    results,
  };
}

function unrank(row) {
  if (row.status === "ok") row.status = "unranked";
  row.throughput = "n/a";
}

function summary(gate) {
  const failures = (gate?.results ?? []).filter((result) => result.status !== "PASS");
  return failures
    .slice(0, 2)
    .map((result) => `${result.id}: ${result.detail ?? result.status}`)
    .join("; ");
}

export function applyComponentMetaValidityGates(rows, validity) {
  for (const row of rows) {
    if (row.status === "skipped" || row.status === "error") continue;
    const gate = validity?.results?.[row.id];
    if (!gate || gate.status !== "PASS") {
      unrank(row);
      const status = gate?.status ?? "UNKNOWN";
      row.notes = `${row.notes ?? ""} ⚠ COMPONENT-META SEMANTIC VALIDITY ${status}${gate ? ` (${gate.passed}/${gate.plantCount} passed)` : ""} — ${summary(gate) || gate?.reason || "no exact disk-backed entrypoint verdict"}.`;
    } else {
      row.notes = `${row.notes ?? ""} ✓ COMPONENT-META SEMANTIC VALIDITY: ${gate.passed}/${gate.plantCount} named-API plants passed through ${gate.exactPath}.`;
    }
  }

  const baseline = rows.find((row) => row.baseline && row.status !== "skipped");
  if (baseline && baseline.status !== "ok") {
    for (const row of rows) {
      if (row === baseline || row.status === "skipped" || row.status === "error") continue;
      unrank(row);
      row.notes = `${row.notes ?? ""} ⚠ COMPARISON REFERENCE INVALID: the official Vue component-meta baseline did not pass mandatory validation.`;
    }
  }
  return rows;
}
