/**
 * The publish path must not contradict the document it publishes into.
 *
 * README says twice that published numbers are Linux only, and that local runs
 * on other platforms are for comparison on your own box rather than against
 * published figures. Nothing enforced it. Running `pnpm update-readme` on a
 * developer machine spliced `#### Windows · bench` sections straight in — 218
 * lines of them, measured on hardware nobody else has, under a heading that
 * says the opposite two screens further down.
 *
 * It was never silent: the tables carry a platform heading. But "labelled" and
 * "correct" are different things, and the numbers most likely to be published
 * by accident are exactly the ones taken on an unreproducible machine.
 *
 * The guard is a filter, not a wall — PUBLISH_ANY_PLATFORM=1 allows it and
 * says so on stdout, because it exists to stop an accident rather than someone
 * who means it.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { filterPublishable } from "../../scripts/update-readme.mjs";

const LINUX_CI = "results/bench-Linux-200-bench.md";
const LINUX_LOCAL = "results/bench-linux-50-bench.md";
const UBUNTU = "results/bench-ubuntu-latest-200-bench.md";
const WINDOWS = "results/bench-win32-50.md";
const MACOS = "results/bench-darwin-50-bench.md";

describe("publish platform guard", () => {
  test("Linux artifacts publish — CI must keep working", () => {
    // The whole point of benchmark.yml. If this ever fails, the guard has
    // broken the only path that is supposed to produce published numbers.
    const { publish, rejected } = filterPublishable([LINUX_CI, LINUX_LOCAL, UBUNTU]);
    assert.deepEqual(publish, [LINUX_CI, LINUX_LOCAL, UBUNTU]);
    assert.deepEqual(rejected, []);
  });

  test("Windows and macOS artifacts are refused", () => {
    const { publish, rejected } = filterPublishable([WINDOWS, MACOS]);
    assert.deepEqual(publish, []);
    assert.deepEqual(
      rejected.map((r) => r.platform),
      ["Windows", "macOS"],
    );
  });

  test("a mixed results directory publishes only the Linux half", () => {
    // The real local situation: CI artifacts downloaded next to local runs.
    // Publishing the whole directory is how the two get mixed in one table.
    const { publish, rejected } = filterPublishable([WINDOWS, LINUX_CI, MACOS]);
    assert.deepEqual(publish, [LINUX_CI]);
    assert.equal(rejected.length, 2);
  });

  test("the rejection names the file, so the skip is not mysterious", () => {
    const { rejected } = filterPublishable([WINDOWS]);
    assert.equal(rejected[0].file, "bench-win32-50.md");
    assert.doesNotMatch(rejected[0].file, /[/\\]/, "should be the leaf, not a full path");
  });

  test("PUBLISH_ANY_PLATFORM=1 publishes everything", () => {
    // Passing `null` is what publishablePlatforms() returns under the override.
    const { publish, rejected } = filterPublishable([WINDOWS, LINUX_CI, MACOS], null);
    assert.deepEqual(publish, [WINDOWS, LINUX_CI, MACOS]);
    assert.deepEqual(rejected, []);
  });

  test("an empty input is not an error", () => {
    const { publish, rejected } = filterPublishable([]);
    assert.deepEqual(publish, []);
    assert.deepEqual(rejected, []);
  });
});
