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
 * nobody is launched through a shell, and nothing depends on `exports`.
 *
 * SCOPE NOTE. The rule these tests originally stated was "everyone is launched
 * as `node <entry>`", because at the time every server WAS a Node program.
 * That is no longer the shape of the question: the Vize resolver now prefers
 * the standalone native server the VS Code extension ships, which is the
 * process the product actually runs (see lsp-fairness.test.mjs). The invariant
 * that mattered survives unchanged and is what is asserted below — a resolver
 * must never silently fall through to a platform shell shim, because that cost
 * lands on one tool for reasons that have nothing to do with the tool.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";

import { resolveVolarServer, resolveVizeLsp } from "../../scripts/lib/surfaces/lsp.mjs";

const RESOLVERS = [
  ["Volar", resolveVolarServer],
  ["Vize", resolveVizeLsp],
];

/** `node <entry>` puts the entry in args[0]; a native binary is the command. */
function launchTarget(spec) {
  return spec.command === process.execPath ? spec.args[0] : spec.command;
}

describe("LSP spawn parity", () => {
  for (const [name, resolve] of RESOLVERS) {
    test(`${name} resolves to a real entry point`, () => {
      const spec = resolve();
      assert.ok(spec, `${name} did not resolve — is it installed?`);
      assert.ok(
        existsSync(launchTarget(spec)),
        `${name} entry does not exist on disk: ${launchTarget(spec)}`,
      );
    });

    test(`${name} is spawned directly, never through a shell shim`, () => {
      const spec = resolve();
      assert.ok(spec, `${name} did not resolve`);
      assert.notEqual(
        spec.shell,
        true,
        `${name} is spawned through a shell while its peers are not — that is ` +
          `cmd.exe startup on every spawn, charged to one tool by a packaging accident`,
      );
      assert.ok(
        !/\.(cmd|bat|ps1)$/i.test(spec.command),
        `${name} fell back to the platform shim (${spec.command})`,
      );
    });
  }

  test("a Node-hosted server is launched as `node <entry>`, not via .bin", () => {
    // Volar has no native distribution, so its launch shape is fixed and this
    // still states the original rule for it exactly.
    const spec = resolveVolarServer();
    assert.ok(spec, "Volar did not resolve");
    assert.equal(spec.command, process.execPath);
  });

  test("no resolver depends on a package exporting ./package.json", () => {
    // The precondition that made the two resolvers diverge. If this ever starts
    // succeeding for vize, the guards above still hold the real invariant --
    // but this documents WHY the shared resolvePackageDir() helper exists.
    let vizeExportsPkgJson = true;
    try {
      import.meta.resolve("vize/package.json");
    } catch {
      vizeExportsPkgJson = false;
    }

    // The packaging detail must not change how anything is launched. Pinned to
    // the Node path for both, so this asserts resolution, not the machine's
    // VS Code install.
    const shapes = [
      resolveVolarServer(),
      resolveVizeLsp({ env: {}, roots: [] }),
    ].map((spec) =>
      spec ? `${spec.command === process.execPath ? "node" : "shim"}${spec.shell ? "+shell" : ""}` : "null",
    );
    assert.equal(
      new Set(shapes).size,
      1,
      `servers are launched differently (${shapes.join(" vs ")}); ` +
        `vize exports ./package.json = ${vizeExportsPkgJson}`,
    );
  });
});
