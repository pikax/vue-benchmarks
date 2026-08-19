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
  test("clears the dest snapshot then copies only the latest Linux leaves", () => {
    const root = mkdtempSync(join(tmpdir(), "vue-bench-pub-"));
    try {
      const from = join(root, "dl");
      mkdirSync(join(from, "results-bench-linux"), { recursive: true });
      touch(join(from, "results-bench-linux"), "bench-Linux-200-bench.md", "# bench");
      touch(join(from, "results-bench-linux"), "bench-Linux-200-bench.json");
      mkdirSync(join(from, "results-real-world-naive-ui", "results"), { recursive: true });
      touch(join(from, "results-real-world-naive-ui", "results"), "real-world-Linux-naive-ui.md", "# naive");
      touch(from, "bench-win32-200.md", "# win");
      touch(from, "confirm.json", JSON.stringify({ runner: { platform: "win32" } }));

      const staleBench = join(root, "results", "benchmarks");
      const staleReal = join(root, "results", "real_world");
      mkdirSync(staleBench, { recursive: true });
      mkdirSync(staleReal, { recursive: true });
      touch(staleBench, "old-Linux.md", "# gone");
      touch(staleReal, "old-project.md", "# gone");

      const { copied } = publishCiResults({ fromDir: from, root, scope: "all" });
      assert.equal(copied, 3);
      assert.deepEqual(readdirSync(staleBench).sort(), [
        "bench-Linux-200-bench.json",
        "bench-Linux-200-bench.md",
      ]);
      assert.deepEqual(readdirSync(staleReal), ["real-world-Linux-naive-ui.md"]);
      assert.equal(existsSync(join(staleBench, "old-Linux.md")), false);
      assert.equal(existsSync(join(staleReal, "old-project.md")), false);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  test("scope=bench does not wipe real_world", () => {
    const root = mkdtempSync(join(tmpdir(), "vue-bench-pub-"));
    try {
      const from = join(root, "dl");
      mkdirSync(from, { recursive: true });
      touch(from, "bench-Linux-200-bench.md", "# bench");
      const realDest = join(root, "results", "real_world");
      mkdirSync(realDest, { recursive: true });
      touch(realDest, "keep-me.md", "# keep");

      publishCiResults({ fromDir: from, root, scope: "bench" });
      assert.equal(existsSync(join(realDest, "keep-me.md")), true);
      assert.equal(existsSync(join(root, "results", "benchmarks", "bench-Linux-200-bench.md")), true);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
