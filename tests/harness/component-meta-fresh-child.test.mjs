/**
 * Guards for the component-meta surface's fresh-child (cold) series.
 *
 * The cold number is only meaningful if the child measured THIS row's package
 * building THIS row's workload. Two things can quietly break that: a child that
 * imports every meta package (so the row is timed in a process another tool's
 * native init already touched), and a child handed a different project than the
 * warm pass. Both are invisible in the published table — one row simply looks
 * fast — so each is asserted here rather than trusted.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  applyComponentMetaFreshChildSamples,
  buildComponentMetaVariants,
  componentMetaFreshChildPackageSelection,
} from "../../scripts/lib/surfaces/component-meta.mjs";

const unavailable = { error: "not selected in this fresh child" };

test("a component-meta fresh child loads only the package owned by its exact row", () => {
  assert.deepEqual(componentMetaFreshChildPackageSelection("vue-component-meta"), {
    vueComponentMeta: true,
    verterComponentMeta: false,
    vizeNative: false,
  });
  assert.deepEqual(componentMetaFreshChildPackageSelection("verter-component-meta"), {
    vueComponentMeta: false,
    verterComponentMeta: true,
    vizeNative: false,
  });
  assert.deepEqual(componentMetaFreshChildPackageSelection("vize-component-meta"), {
    vueComponentMeta: false,
    verterComponentMeta: false,
    vizeNative: true,
  });
  // An unknown row selects nothing at all rather than defaulting to a package.
  assert.deepEqual(componentMetaFreshChildPackageSelection("something-else"), {
    vueComponentMeta: false,
    verterComponentMeta: false,
    vizeNative: false,
  });
});

test("the fresh child builds its row through the surface's own adapter builder", () => {
  const child = readFileSync(
    new URL("../../scripts/lib/component-meta-cold-child.mjs", import.meta.url),
    "utf8",
  );
  const surface = readFileSync(
    new URL("../../scripts/lib/surfaces/component-meta.mjs", import.meta.url),
    "utf8",
  );
  // A child-only adapter would be a second benchmark wearing the same row
  // label, and the parity check could not see it: it would be comparing that
  // adapter against itself.
  assert.match(child, /buildComponentMetaVariants/);
  assert.match(child, /componentMetaFreshChildPackageSelection/);
  assert.doesNotMatch(child, /createChecker|openComponentMetaSession/);
  assert.match(surface, /childScript: freshChildScript/);
  // Cold samples must be taken before the warm pass has read the corpus.
  assert.ok(
    surface.indexOf("measureFreshChildVariants(") < surface.indexOf("await measureVariants("),
  );
});

test("an unavailable meta package is skipped, never substituted", () => {
  const variants = buildComponentMetaVariants({
    metaDir: "/tmp/meta",
    files: ["A.vue"],
    vueMeta: unavailable,
    verterMetaPkg: unavailable,
    vizeNative: unavailable,
  });
  assert.deepEqual(
    variants.map((v) => v.id),
    ["vue-component-meta", "verter-component-meta", "vize-component-meta"],
  );
  assert.ok(variants.every((v) => v.skip === true));
  assert.ok(variants.every((v) => typeof v.measure !== "function"));
});

test("fresh-child samples publish alongside warm only when both passes did the same work", () => {
  const warmMeta = [{ artifact: 10, inputCount: 20, adapterOptionsHash: "h" }];
  const agreed = {
    id: "vue-component-meta",
    status: "ok",
    throughput: "20 files/s",
    notes: "adapter",
    metaSamples: warmMeta,
  };
  const disagreed = {
    id: "verter-component-meta",
    status: "ok",
    throughput: "20 files/s",
    notes: "adapter",
    metaSamples: warmMeta,
  };
  applyComponentMetaFreshChildSamples(
    [agreed, disagreed],
    new Map([
      [
        "vue-component-meta",
        {
          freshChildMedianMs: 800,
          freshChildRuns: [800],
          freshChildMetaSamples: warmMeta,
        },
      ],
      [
        "verter-component-meta",
        {
          freshChildMedianMs: 150,
          freshChildRuns: [150],
          // Same options and file count, but it materialised a different
          // amount of metadata than the warm pass — not a cold reading of
          // this row.
          freshChildMetaSamples: [{ artifact: 4, inputCount: 20, adapterOptionsHash: "h" }],
        },
      ],
    ]),
  );

  assert.equal(agreed.status, "ok");
  assert.equal(agreed.freshChildMedianMs, 800);
  assert.deepEqual(agreed.adapterParity, {
    ok: true,
    checks: { adapterOptionsHash: true, inputCount: true, artifact: true },
  });

  assert.equal(disagreed.status, "unranked");
  assert.equal(disagreed.throughput, "n/a");
  // The timings survive — they are still evidence — but stop being ranked.
  assert.equal(disagreed.freshChildMedianMs, 150);
  assert.equal(disagreed.adapterParity.ok, false);
  assert.match(disagreed.notes, /ADAPTER PARITY FAILED/);
  assert.match(disagreed.notes, /artifact/);
});

test("a fresh child that never reported keeps the warm timing and says so", () => {
  const row = { id: "vue-component-meta", status: "ok", notes: "adapter" };
  applyComponentMetaFreshChildSamples(
    [row],
    new Map([
      [
        "vue-component-meta",
        { freshChildRuns: [], freshChildError: "fresh child exited 1: boom" },
      ],
    ]),
  );

  assert.equal(row.status, "ok");
  assert.equal(row.freshChildMedianMs, undefined);
  assert.match(row.notes, /FRESH-CHILD SAMPLE UNAVAILABLE/);
  assert.match(row.notes, /Warm timing remains reported/);
  assert.equal(row.adapterParity, undefined);
});
