import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import assert from "node:assert/strict";
import test from "node:test";

import { buildMemoryTasks } from "../../scripts/lib/memory-tasks.mjs";
import { createTemplates, uniquify } from "../../scripts/lib/templates.mjs";

/**
 * A throwaway corpus in the generator's own shape and naming.
 *
 * This test used to point at `fixtures/20`, which is gitignored and which no CI
 * job generates: it passed on a developer machine that had run `pnpm generate`
 * and failed on a clean checkout with `files: []`. The harness suite is meant to
 * run in seconds against nothing but the repo, so the corpus is built here.
 *
 * THREE files with `fileLimit: 2`, so the limit is proven to truncate rather
 * than being satisfied by a corpus that was that size anyway.
 */
function makeCorpus() {
  const dir = mkdtempSync(join(tmpdir(), "vue-bench-memory-corpus-"));
  const templates = createTemplates();
  for (let i = 0; i < 3; i++) {
    writeFileSync(
      join(dir, `Comp${String(i).padStart(5, "0")}.vue`),
      uniquify(templates[i % templates.length], i),
    );
  }
  return dir;
}

test("memory tasks preserve the timed corpus/config and exact public entrypoints", () => {
  const workRoot = mkdtempSync(join(tmpdir(), "vue-bench-memory-tasks-"));
  const fixtureDir = makeCorpus();
  try {
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
    rmSync(fixtureDir, { recursive: true, force: true });
  }
});
