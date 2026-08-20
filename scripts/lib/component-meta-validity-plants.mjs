import { createHash } from "node:crypto";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { scoreComponentMeta } from "../../tests/confirm/lib/component-meta-score.mjs";

const here = dirname(fileURLToPath(import.meta.url));
export const COMPONENT_META_CASES_ROOT = join(
  here,
  "../../tests/confirm/fixtures/component-meta/cases",
);

export const COMPONENT_META_VALIDITY_SUITE_VERSION = "2026-08-20.1";

function coverageFor(expect) {
  const coverage = [];
  for (const section of ["props", "events", "slots", "exposed"]) {
    if (expect[section]?.length) coverage.push(section);
  }
  if (expect.absentProps?.length) coverage.push("absent props");
  const items = [
    ...(expect.props ?? []),
    ...(expect.events ?? []),
    ...(expect.slots ?? []),
    ...(expect.exposed ?? []),
  ];
  if (items.some((item) => typeof item.required === "boolean")) coverage.push("requiredness");
  if (items.some((item) => item.hasDefault === true)) coverage.push("defaults");
  if (items.some((item) => item.typeIncludes?.length)) coverage.push("coarse type facts");
  return coverage;
}

/** The existing eleven source-level cases, loaded as one revisioned manifest. */
export const COMPONENT_META_VALIDITY_PLANTS = Object.freeze(
  readdirSync(COMPONENT_META_CASES_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort()
    .map((id) => {
      const caseDir = join(COMPONENT_META_CASES_ROOT, id);
      const componentFile = readdirSync(caseDir).find((name) => name.endsWith(".vue"));
      if (!componentFile) throw new Error(`component-meta plant ${id} has no .vue source`);
      const expect = JSON.parse(readFileSync(join(caseDir, "expect.json"), "utf8"));
      return Object.freeze({
        id,
        coverage: coverageFor(expect),
        caseDir,
        componentFile,
        source: readFileSync(join(caseDir, componentFile), "utf8"),
        expect,
      });
    }),
);

export const COMPONENT_META_VALIDITY_SUITE_HASH = createHash("sha256")
  .update(
    JSON.stringify(
      COMPONENT_META_VALIDITY_PLANTS.map(({ id, coverage, componentFile, source, expect }) => ({
        id,
        coverage,
        componentFile,
        source,
        expect,
      })),
    ),
  )
  .digest("hex");

const TOOL_NEUTRAL_CAPABILITIES = Object.freeze([
  "props",
  "events",
  "slots",
  "exposed",
  "required",
  "defaults",
  "types",
]);

/**
 * Score named API facts only. Per-tool overrides and total-count thresholds are
 * deliberately discarded: both exact rows face the same expectations, and a
 * tool is never failed merely because its schema includes fewer implicit/global
 * members than another tool.
 */
export function scoreComponentMetaPlant(meta, plant) {
  const expect = { ...plant.expect };
  delete expect.toolOverrides;
  delete expect.minProps;
  return scoreComponentMeta(meta, expect, { capabilities: TOOL_NEUTRAL_CAPABILITIES });
}

export function unknownComponentMetaValidityResults(reason) {
  return COMPONENT_META_VALIDITY_PLANTS.map((plant) => ({
    id: plant.id,
    coverage: plant.coverage,
    status: "UNKNOWN",
    phase: "not-run",
    detail: reason,
  }));
}
