import assert from "node:assert/strict";
import { test } from "node:test";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { rootDir } from "../confirm/lib/run-cli.mjs";
import { toolRunners } from "../confirm/suites/typecheck.mjs";
import {
  parseDiagnostics,
  diagsForCase,
  combinedFromDiags,
  scoreDiagnostics,
} from "../confirm/lib/diagnostics.mjs";
import { findExpectErrorPins, stripExpectErrorDirectives } from "../confirm/lib/plant-pins.mjs";

test("Vue typecheck accepts shadow/restoration twins and pins only invalid inner expressions in both project modes", async () => {
  const fixtures = join(rootDir, "tests/confirm/fixtures/typecheck");
  mkdirSync(join(rootDir, "work"), { recursive: true });
  const work = mkdtempSync(join(rootDir, "work", "typecheck-shadow-"));
  try {
    const cases = [];
    for (const kind of ["v-for", "slot"])
      for (const polarity of ["ok", "bad"]) {
        const id = `${kind}-shadow-restoration-${polarity}`;
        const src = join(fixtures, "cases", id),
          dest = join(work, "cases", id);
        cpSync(src, dest, { recursive: true });
        const meta = JSON.parse(readFileSync(join(src, "meta.json"), "utf8"));
        const pins = findExpectErrorPins(src);
        stripExpectErrorDirectives(dest);
        cases.push({ id, dest, meta, pins });
      }
    const config = JSON.parse(readFileSync(join(fixtures, "_shared/tsconfig.base.json"), "utf8"));
    config.compilerOptions.paths = {
      vue: [join(rootDir, "node_modules/vue").replaceAll("\\", "/")],
    };
    config.exclude = ["golar.config.ts", "node_modules"];
    writeFileSync(join(work, "tsconfig.json"), JSON.stringify(config));
    cpSync(join(fixtures, "_shared/env.d.ts"), join(work, "env.d.ts"));
    writeFileSync(join(work, "package.json"), '{"type":"module","private":true}');
    const tool = toolRunners(work).find((tool) => tool.id === "vue-tsc");
    assert.ok(tool.available, "pinned vue-tsc reference must be installed");
    const combined = await tool.run();
    assert.equal(combined.status, 2, combined.combined);
    const diagnostics = parseDiagnostics(combined.combined);
    assert.equal(diagnostics.length, 2, combined.combined);
    for (const { id, dest, meta, pins } of cases) {
      const diags = diagsForCase(diagnostics, id);
      const score = scoreDiagnostics({ ...meta, combined: combinedFromDiags(diags), diags, pins });
      assert.equal(score.ok, true, `${id} combined: ${score.message}`);
      writeFileSync(
        join(dest, "tsconfig.json"),
        JSON.stringify({
          extends: "../../tsconfig.json",
          include: ["./**/*.vue", "../../env.d.ts"],
        }),
      );
      const run = await tool.runProject(`cases/${id}/tsconfig.json`);
      assert.equal(run.status, meta.expectErrors ? 2 : 0, run.combined);
      const isolated = scoreDiagnostics({ ...meta, combined: run.combined, pins });
      assert.equal(isolated.ok, true, `${id} per-case: ${isolated.message}`);
    }
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
});
