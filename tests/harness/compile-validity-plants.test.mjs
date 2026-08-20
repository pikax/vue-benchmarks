import test from "node:test";
import assert from "node:assert/strict";
import {
  COMPILE_VALIDITY_PLANTS,
  COMPILE_VALIDITY_SUITE_HASH,
  COMPILE_VALIDITY_SUITE_VERSION,
} from "../../scripts/lib/compile-validity-plants.mjs";
import {
  COMPILE_VALIDITY_ENTRYPOINTS,
  runCompileValidityChildren,
} from "../../scripts/lib/compile-validity-gates.mjs";

test("compile semantic plant manifest is extensive, unique, JS-source, and revisioned", () => {
  assert.ok(COMPILE_VALIDITY_PLANTS.length >= 31);
  assert.equal(
    new Set(COMPILE_VALIDITY_PLANTS.map((plant) => plant.id)).size,
    COMPILE_VALIDITY_PLANTS.length,
  );
  assert.match(COMPILE_VALIDITY_SUITE_VERSION, /^\d{4}-\d{2}-\d{2}\.\d+$/);
  assert.match(COMPILE_VALIDITY_SUITE_HASH, /^[a-f0-9]{64}$/);
  for (const plant of COMPILE_VALIDITY_PLANTS) {
    assert.ok(plant.coverage.length > 0, `${plant.id} has no coverage declaration`);
    assert.equal(typeof plant.assert, "function", `${plant.id} has no semantic oracle`);
    assert.doesNotMatch(
      plant.source,
      /<script\b[^>]*\blang=["']ts["']/i,
      `${plant.id} is not JS-source`,
    );
    assert.match(plant.source, /<template\b/i, `${plant.id} has no template`);
  }
});

test("compile validity entrypoint keys distinguish single, batch, sync, and async APIs", () => {
  assert.deepEqual(COMPILE_VALIDITY_ENTRYPOINTS, [
    "vue-3.5",
    "vue-3.6",
    "vize-single",
    "vize-batch",
    "verter-compile-many",
    "fervid-sync",
    "fervid-async",
  ]);
});

test("Vapor validity executes against the exact pinned Vue 3.6 runtime", () => {
  const suite = runCompileValidityChildren({
    target: "vapor",
    env: "production",
    entrypoints: ["vue-3.6"],
  });
  const result = suite.results["vue-3.6"];
  assert.ok(["PASS", "FAIL"].includes(result.status));
  assert.equal(result.unknown, 0);
  assert.equal(result.plantCount, COMPILE_VALIDITY_PLANTS.length);
  assert.ok(result.results.every((plant) => ["PASS", "FAIL"].includes(plant.status)));
  assert.equal(result.entrypointMetadata.vaporRuntime.version, "3.6.0-rc.4");
  assert.equal(
    result.entrypointMetadata.vaporRuntime.compilerVersion,
    result.entrypointMetadata.vaporRuntime.version,
  );
  assert.equal(
    result.entrypointMetadata.vaporRuntime.artifact,
    "dist/vue.runtime-with-vapor.esm-browser.js",
  );
});
