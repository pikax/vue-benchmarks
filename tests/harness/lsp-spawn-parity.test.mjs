/**
 * Spawn parity — every language server must be launched the same way.
 *
 * The bug worth never repeating: both resolvers were written to prefer a direct
 * `node <entry>` spawn and to fall back to the `.bin` shim only if that failed.
 * They looked identical. They did not behave identically, because both located
 * the package with `require.resolve("<pkg>/package.json")` — which throws
 * ERR_PACKAGE_PATH_NOT_EXPORTED when a package's `exports` map omits
 * "./package.json". @vue/language-server exports it; vize does not.
 *
 * So Volar took the fast path and Vize silently took the fallback: spawned
 * through cmd.exe with `shell: true`, measured at ~15ms slower per spawn
 * (60/59/45ms direct vs 76/65/67ms via .cmd). One tool paid a startup tax on
 * every LSP measurement because of an unrelated packaging choice, and nothing
 * in the output said so.
 *
 * A benchmark that charges one competitor for its package metadata is not
 * measuring what it claims to measure. These tests assert the rule directly:
 * same launch shape for everyone, and no dependence on `exports`.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import { resolveVolarServer, resolveVizeLsp } from "../../scripts/lib/surfaces/lsp.mjs";

const RESOLVERS = [
  ["Volar", resolveVolarServer],
  ["Vize", resolveVizeLsp],
];

describe("LSP spawn parity", () => {
  for (const [name, resolve] of RESOLVERS) {
    test(`${name} resolves to a real entry point`, () => {
      const spec = resolve();
      assert.ok(spec, `${name} did not resolve — is it installed?`);
      assert.ok(
        existsSync(spec.args[0]),
        `${name} entry does not exist on disk: ${spec.args[0]}`,
      );
    });

    test(`${name} is spawned as node <entry>, not via a shell shim`, () => {
      const spec = resolve();
      assert.ok(spec, `${name} did not resolve`);
      assert.equal(
        spec.command,
        process.execPath,
        `${name} is not launched with node — it fell back to the platform shim, ` +
          `which costs it cmd.exe startup on every spawn that its peers do not pay`,
      );
      assert.notEqual(
        spec.shell,
        true,
        `${name} is spawned through a shell while its peers are not`,
      );
    });
  }

  test("no resolver depends on a package exporting ./package.json", () => {
    // The precondition that made the two resolvers diverge. If this ever starts
    // succeeding for vize, the guard above still holds the real invariant --
    // but this documents WHY the shared resolvePackageDir() helper exists.
    let vizeExportsPkgJson = true;
    try {
      import.meta.resolve("vize/package.json");
    } catch {
      vizeExportsPkgJson = false;
    }

    // Whatever the answer, both servers must land on the same launch shape.
    const shapes = RESOLVERS.map(([, resolve]) => {
      const spec = resolve();
      return spec ? `${spec.command === process.execPath ? "node" : "shim"}${spec.shell ? "+shell" : ""}` : "null";
    });
    assert.equal(
      new Set(shapes).size,
      1,
      `servers are launched differently (${shapes.join(" vs ")}); ` +
        `vize exports ./package.json = ${vizeExportsPkgJson}`,
    );
  });
});
