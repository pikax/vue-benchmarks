import assert from "node:assert/strict";
import { describe, test } from "node:test";

import {
  COMPILE_VALIDITY_ENTRYPOINTS,
  COMPILE_VALIDITY_JSON_PREFIX,
  runCompileValidityMatrix,
} from "../../scripts/lib/compile-validity-gates.mjs";

describe("compile semantic validity process isolation", () => {
  test("runs every exact entrypoint in its own child and retains full outcomes", () => {
    const calls = [];
    const report = runCompileValidityMatrix(
      [{ target: "vdom", env: "production", sourceMap: false }],
      {
        spawn(_executable, args) {
          calls.push(args);
          const entrypoint = args[args.indexOf("--entrypoint") + 1];
          const payload = {
            entrypoint,
            target: "vdom",
            env: "production",
            sourceMap: false,
            status: "PASS",
            plantCount: 2,
            passed: 2,
            failed: 0,
            unknown: 0,
            results: [
              { id: "one", status: "PASS", phase: "runtime" },
              { id: "two", status: "PASS", phase: "runtime" },
            ],
          };
          return {
            status: 0,
            stdout: `native noise\n${COMPILE_VALIDITY_JSON_PREFIX}${JSON.stringify(payload)}\n`,
            stderr: "",
          };
        },
      },
    );

    assert.equal(calls.length, COMPILE_VALIDITY_ENTRYPOINTS.length);
    assert.deepEqual(
      calls.map((args) => args[args.indexOf("--entrypoint") + 1]),
      COMPILE_VALIDITY_ENTRYPOINTS,
    );
    const entrypoints = report.matrix["vdom/production/source-map-off"].entrypoints;
    assert.deepEqual(
      entrypoints["vize-batch"].results.map((result) => result.id),
      ["one", "two"],
    );
  });

  test("classifies an abort without a payload as FAIL rather than a pass", () => {
    const report = runCompileValidityMatrix(
      [{ target: "vdom", env: "development", sourceMap: false }],
      {
        spawn() {
          return { status: null, signal: "SIGABRT", stdout: "", stderr: "native abort" };
        },
      },
    );
    const result =
      report.matrix["vdom/development/source-map-off"].entrypoints["verter-compile-many"];
    assert.equal(result.status, "FAIL");
    assert.match(result.reason, /SIGABRT/);
    assert.ok(result.results.every((plant) => plant.status === "FAIL"));
  });
});
