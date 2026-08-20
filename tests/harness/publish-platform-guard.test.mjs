/**
 * The publish path must not contradict the document it publishes into.
 *
 * README says published numbers are Linux CI only, and that local runs on
 * other platforms are for comparison on your own box rather than against
 * published figures. `loadPublished` is what enforces it now: docs generation
 * reads only the JSON snapshots, and a snapshot from another platform — or
 * from a dirty worktree — never enters the model that renders README/docs.
 *
 * The guard is a filter, not a wall — PUBLISH_ANY_PLATFORM=1 admits everything,
 * because it exists to stop an accident rather than someone who means it.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { loadPublished, publishablePlatform } from "../../scripts/lib/docs/data.mjs";

function makeRoot(files) {
  const root = mkdtempSync(join(tmpdir(), "vue-bench-guard-"));
  mkdirSync(join(root, "results", "benchmarks"), { recursive: true });
  mkdirSync(join(root, "results", "real_world"), { recursive: true });
  for (const [rel, data] of Object.entries(files)) {
    writeFileSync(join(root, "results", rel), `${JSON.stringify(data)}\n`);
  }
  return root;
}

const bench = (platform, { dirty = false } = {}) => ({
  schemaVersion: 2,
  generatedAt: "2026-08-19T00:00:00.000Z",
  runner: { platform },
  commit: { sha: "abc", dirty },
  surfaces: [],
});

describe("publishablePlatform", () => {
  test("linux and ubuntu pass; win32/darwin do not", () => {
    assert.equal(publishablePlatform("linux", {}), true);
    assert.equal(publishablePlatform("ubuntu", {}), true);
    assert.equal(publishablePlatform("Linux", {}), true);
    assert.equal(publishablePlatform("win32", {}), false);
    assert.equal(publishablePlatform("darwin", {}), false);
  });

  test("PUBLISH_ANY_PLATFORM=1 admits everything, deliberately", () => {
    assert.equal(publishablePlatform("win32", { PUBLISH_ANY_PLATFORM: "1" }), true);
  });
});

describe("loadPublished platform guard", () => {
  test("a Linux bench snapshot publishes — CI must keep working", () => {
    const root = makeRoot({
      "benchmarks/bench-Linux-200-bench.json": bench("linux"),
    });
    try {
      const model = loadPublished(root, {});
      assert.equal(model.bench?.name, "bench-Linux-200-bench.json");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a Windows bench snapshot is refused even when it is the only one", () => {
    const root = makeRoot({
      "benchmarks/bench-win32-50.json": bench("win32"),
    });
    try {
      assert.equal(loadPublished(root, {}).bench, null);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a mixed snapshot directory publishes only the Linux half", () => {
    const root = makeRoot({
      "benchmarks/bench-Linux-200-bench.json": bench("linux"),
      "benchmarks/bench-win32-50.json": bench("win32"),
      "real_world/real-world-Linux-hoppscotch.json": { runner: { platform: "linux" }, surfaces: [] },
      "real_world/real-world-win32-hoppscotch.json": { runner: { platform: "win32" }, surfaces: [] },
    });
    try {
      const model = loadPublished(root, {});
      assert.equal(model.bench?.name, "bench-Linux-200-bench.json");
      assert.deepEqual(
        model.realWorld.map((e) => e.name),
        ["real-world-Linux-hoppscotch.json"],
      );
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("a dirty-worktree bench cannot enter the publication set", () => {
    const root = makeRoot({
      "benchmarks/bench-Linux-200-bench.json": bench("linux", { dirty: true }),
    });
    try {
      assert.equal(loadPublished(root, {}).bench, null);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("PUBLISH_ANY_PLATFORM=1 publishes a local Windows run and a dirty tree", () => {
    const root = makeRoot({
      "benchmarks/bench-win32-50.json": bench("win32", { dirty: true }),
    });
    try {
      const model = loadPublished(root, { PUBLISH_ANY_PLATFORM: "1" });
      assert.equal(model.bench?.name, "bench-win32-50.json");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("an empty snapshot is not an error — every slot is just absent", () => {
    const root = makeRoot({});
    try {
      const model = loadPublished(root, {});
      assert.equal(model.bench, null);
      assert.equal(model.memory, null);
      assert.deepEqual(model.realWorld, []);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("the repeated-input study lands in its own slot, never as the ranking bench", () => {
    const root = makeRoot({
      "benchmarks/bench-Linux-200-bench.json": bench("linux"),
      "benchmarks/bench-Linux-200-repeated-cache-demo.json": bench("linux"),
    });
    try {
      const model = loadPublished(root, {});
      assert.equal(model.bench?.name, "bench-Linux-200-bench.json");
      assert.equal(model.repeated?.name, "bench-Linux-200-repeated-cache-demo.json");
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
