/** Parent-side launcher and row gate for JSX semantic plants. */
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  JSX_VALIDITY_PLANTS,
  JSX_VALIDITY_SUITE_HASH,
  JSX_VALIDITY_SUITE_VERSION,
} from "./jsx-validity-plants.mjs";

export const JSX_VALIDITY_JSON_PREFIX = "@@JSX_VALIDITY_JSON@@";
export const JSX_VALIDITY_ENTRYPOINTS = Object.freeze([
  "compiler-rs-vapor",
  "compiler-rs-vdom",
  "vue-jsx-vapor-api",
  "babel-vdom",
]);

const childFile = join(dirname(fileURLToPath(import.meta.url)), "jsx-validity-child.mjs");

const EXACT_PATHS = Object.freeze({
  "compiler-rs-vapor": "transform(source)",
  "compiler-rs-vdom": "transform(source, { interop: true })",
  "vue-jsx-vapor-api": "transformVueJsxVapor(source)",
  "babel-vdom": "@babel/core transformSync(source, @vue/babel-plugin-jsx options)",
});

function synthetic(entrypoint, status, detail) {
  const results = JSX_VALIDITY_PLANTS.map((plant) => ({
    id: plant.id,
    coverage: plant.coverage,
    status,
    phase: status === "UNKNOWN" ? "not-run" : "child",
    detail,
  }));
  return {
    schemaVersion: 1,
    suiteVersion: JSX_VALIDITY_SUITE_VERSION,
    suiteHash: JSX_VALIDITY_SUITE_HASH,
    entrypoint,
    label: entrypoint,
    exactPath: EXACT_PATHS[entrypoint] ?? "child process did not return exact-path metadata",
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
  const start = text.lastIndexOf(JSX_VALIDITY_JSON_PREFIX);
  if (start < 0) throw new Error("validity child emitted no JSON marker");
  return JSON.parse(text.slice(start + JSX_VALIDITY_JSON_PREFIX.length).split(/\r?\n/, 1)[0]);
}

export function runJsxValidityChildren({ timeoutMs = 120_000, spawn = spawnSync } = {}) {
  const results = {};
  for (const entrypoint of JSX_VALIDITY_ENTRYPOINTS) {
    if (entrypoint === "compiler-rs-vapor" || entrypoint === "vue-jsx-vapor-api") {
      results[entrypoint] = synthetic(
        entrypoint,
        "UNKNOWN",
        "Exact Vapor runtime mounting is not available with the benchmark's Vue 3.5 runtime; VDOM evidence and code-shape regexes are not borrowed",
      );
      continue;
    }
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
    suiteVersion: JSX_VALIDITY_SUITE_VERSION,
    suiteHash: JSX_VALIDITY_SUITE_HASH,
    plantCount: JSX_VALIDITY_PLANTS.length,
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
    .map((result) => `${result.id} [${result.phase}]: ${result.detail ?? result.status}`)
    .join("; ");
}

/** Attach exact-row verdicts, then invalidate a class whose Vue baseline failed. */
export function applyJsxValidityGates(rows, validity) {
  const entrypointByRow = {
    "vue-jsx-vapor-rs-vapor": "compiler-rs-vapor",
    "vue-jsx-vapor-rs-vdom": "compiler-rs-vdom",
    "vue-jsx-vapor-api": "vue-jsx-vapor-api",
    "vue-babel-plugin-jsx": "babel-vdom",
  };
  for (const row of rows) {
    if (row.status === "skipped" || row.status === "error") continue;
    const entrypoint = entrypointByRow[row.id];
    const gate = entrypoint ? validity?.results?.[entrypoint] : null;
    if (!gate || gate.status !== "PASS") {
      unrank(row);
      const status = gate?.status ?? "UNKNOWN";
      row.notes = `${row.notes ?? ""} ⚠ JSX RUNTIME SEMANTIC VALIDITY ${status}${gate ? ` (${gate.passed}/${gate.plantCount} passed)` : ""} — ${summary(gate) || gate?.reason || "no exact-entrypoint verdict"}.`;
    } else {
      row.notes = `${row.notes ?? ""} ✓ JSX RUNTIME SEMANTIC VALIDITY: ${gate.passed}/${gate.plantCount} observable-behaviour plants passed through ${gate.exactPath}.`;
    }
  }

  const classes = new Map();
  for (const row of rows) {
    if (!row.comparisonClass) continue;
    if (!classes.has(row.comparisonClass)) classes.set(row.comparisonClass, []);
    classes.get(row.comparisonClass).push(row);
  }
  for (const members of classes.values()) {
    const baseline = members.find((row) => row.baseline && row.status !== "skipped");
    if (!baseline || baseline.status === "ok") continue;
    for (const row of members) {
      if (row === baseline || row.status === "skipped" || row.status === "error") continue;
      unrank(row);
      row.notes = `${row.notes ?? ""} ⚠ COMPARISON REFERENCE INVALID: the Vue baseline for this JSX target did not pass mandatory validation.`;
    }
  }
  return rows;
}
