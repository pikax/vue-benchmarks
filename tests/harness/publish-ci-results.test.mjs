import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, writeFileSync, existsSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

import { publishCiResults } from "../../scripts/publish-ci-results.mjs";

function touch(dir, name, body = "{}") {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), body);
}

describe("publishCiResults", () => {
  test("clears the dest snapshot then copies only the latest Linux JSON leaves", () => {
    const root = mkdtempSync(join(tmpdir(), "vue-bench-pub-"));
    try {
      const from = join(root, "dl");
      mkdirSync(join(from, "results-bench-linux"), { recursive: true });
      // Markdown artifacts are run-local conveniences — the snapshot is JSON
      // only, because docs are generated from the JSON.
      touch(join(from, "results-bench-linux"), "bench-Linux-200-bench.md", "# bench");
      touch(join(from, "results-bench-linux"), "bench-Linux-200-bench.json");
      mkdirSync(join(from, "results-real-world-naive-ui", "results"), { recursive: true });
      touch(join(from, "results-real-world-naive-ui", "results"), "real-world-Linux-naive-ui.json");
      touch(from, "bench-win32-200.json", "{}");
      touch(from, "confirm.json", JSON.stringify({ runner: { platform: "win32" } }));

      const staleBench = join(root, "results", "benchmarks");
      const staleReal = join(root, "results", "real_world");
      mkdirSync(staleBench, { recursive: true });
      mkdirSync(staleReal, { recursive: true });
      touch(staleBench, "old-Linux.json", "{}");
      touch(staleReal, "old-project.json", "{}");

      const { copied } = publishCiResults({ fromDir: from, root, scope: "all" });
      assert.equal(copied, 2);
      assert.deepEqual(readdirSync(staleBench), ["bench-Linux-200-bench.json"]);
      assert.deepEqual(readdirSync(staleReal), ["real-world-Linux-naive-ui.json"]);
      assert.equal(existsSync(join(staleBench, "old-Linux.json")), false);
      assert.equal(existsSync(join(staleReal, "old-project.json")), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("scope=bench does not wipe real_world", () => {
    const root = mkdtempSync(join(tmpdir(), "vue-bench-pub-"));
    try {
      const from = join(root, "dl");
      mkdirSync(from, { recursive: true });
      touch(from, "bench-Linux-200-bench.json", "{}");
      const realDest = join(root, "results", "real_world");
      mkdirSync(realDest, { recursive: true });
      touch(realDest, "keep-me.json", "{}");

      publishCiResults({ fromDir: from, root, scope: "bench" });
      assert.equal(existsSync(join(realDest, "keep-me.json")), true);
      assert.equal(existsSync(join(root, "results", "benchmarks", "bench-Linux-200-bench.json")), true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
