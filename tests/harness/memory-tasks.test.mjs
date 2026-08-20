import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";
import test from "node:test";

import { buildMemoryTasks } from "../../scripts/lib/memory-tasks.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

test("memory tasks preserve the timed corpus/config and exact public entrypoints", () => {
  const workRoot = mkdtempSync(join(tmpdir(), "vue-bench-memory-tasks-"));
  try {
    const fixtureDir = join(rootDir, "fixtures", "20");
    const tasks = buildMemoryTasks(fixtureDir, {
      fileLimit: 2,
      checkFileLimit: 2,
      metaFileLimit: 2,
      compileTargets: ["vdom"],
      compileEnvs: ["production"],
      workRoot,
    });
    const byId = new Map(tasks.map((task) => [task.id, task]));

    for (const id of ["mem-prettier", "mem-oxfmt", "mem-vize-fmt", "mem-biome-fmt"]) {
      const fresh = byId.get(id).cli.freshCopy;
      assert.deepEqual(fresh.files, ["Comp00000.vue", "Comp00001.vue"]);
      assert.ok(fresh.extraFiles.includes(".prettierrc.json"));
      assert.ok(fresh.extraFiles.includes("biome.json"));
    }
    assert.ok(!byId.get("mem-vize-fmt").cli.args.includes("--quiet"));

    const lintCwds = ["mem-vize-lint", "mem-biome-lint", "mem-oxlint"].map(
      (id) => byId.get(id).cli.cwd,
    );
    assert.equal(
      new Set(lintCwds).size,
      1,
      "walk linters must receive one identical isolated corpus",
    );
    assert.notEqual(lintCwds[0], fixtureDir, "a file-limited run must not walk the whole fixture");
    assert.ok(!byId.get("mem-vize-lint").cli.args.includes("--quiet"));
    assert.equal(byId.get("mem-vize-lint").cli.validation.expectedMinimumFiles, 2);
    assert.equal(byId.get("mem-biome-lint").cli.validation.expectedMinimumFiles, 2);
    assert.equal(byId.get("mem-oxlint").cli.validation.silentExitZero, "unknown");

    for (const id of ["mem-verter-raw-render-vdom-prod", "mem-verter-render-style-vdom-prod"]) {
      assert.equal(byId.get(id).inproc.payload.workspaceRoot, fixtureDir);
    }
    assert.equal(byId.get("mem-verter-component-meta").inproc.handler, "verter-component-meta");
    assert.ok(!("sources" in byId.get("mem-verter-component-meta").inproc.payload));
    assert.match(byId.get("mem-lsp-volar").label, /Vue server process only/);
  } finally {
    rmSync(workRoot, { recursive: true, force: true });
  }
});
