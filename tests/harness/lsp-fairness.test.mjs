/**
 * LSP surface fairness invariants: scripts/lib/surfaces/lsp.mjs
 *
 * Three defects lived here at once, and each of them distorted the published
 * ranking in a way nothing in the output revealed:
 *
 *   1. Vize was benchmarked through the npm package's Node shim (a two-line
 *      loader for a ~34MB NAPI addon) while the shipped product is a standalone
 *      native executable — measured at the same version, ~35ms of Node bootstrap
 *      per spawn that the product does not pay, and the surface spawns a fresh
 *      server for every measured run.
 *   2. Exactly one server (Verter) had its workspace load moved OUT of the
 *      primary ranked metric by an `await waitForNotification($/verter/ready)`
 *      placed between `initialize` and the start of the timed didOpen→hover
 *      window. Every other server's equivalent work stayed inside it.
 *   3. All four variants declared only `threading: "lsp"`, so `classKey()` put
 *      one JavaScript-TypeScript row and three native-tsgo rows in a single
 *      table sharing one `vs fastest` baseline — the published "Verter 1.00x,
 *      Volar 2.20x, Volar/TNB 2.27x" was a ranking across TypeScript engines,
 *      which this repo already forbids on the typecheck surface for exactly
 *      that reason.
 *
 * Each block below fails against the corresponding old behaviour.
 */
import { describe, test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  applyLspEngineAxis,
  findVizeNativeServer,
  lspVariantEngine,
  resolveVizeLsp,
  runLspSession,
  vsCodeGlobalStorageRoots,
} from "../../scripts/lib/surfaces/lsp.mjs";
import { renderSurfaceMarkdown } from "../../scripts/lib/report.mjs";
import { classTitles, collectMarkdownTables, makeTempDir, removeDir } from "./helpers.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const STUB_SERVER = join(here, "lsp-stub-server.mjs");
const LSP_SURFACE = join(here, "..", "..", "scripts", "lib", "surfaces", "lsp.mjs");

/**
 * The surface's source with comments removed.
 *
 * The source tripwires below look for constructs that must not come back. The
 * comments explaining why they must not come back quote those very constructs,
 * so a naive grep matches its own documentation and the guard never fails.
 */
function surfaceCode() {
  return readFileSync(LSP_SURFACE, "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "");
}

/* ────────────────────────────────────────────────────────────────────────────
 * 1. The ready signal must not be a gate for anybody
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Long enough that the shared hover-retry backoff (50ms yield, then 200/400ms)
 * needs its third attempt, so the measured window is ~650ms when project load
 * is inside it and ~55ms when it has been waited out beforehand. A ~600ms gap
 * leaves the assertions plenty of room on a contended runner while still
 * failing loudly against the old behaviour.
 */
const PROJECT_LOAD_MS = 450;

describe("workspace-ready signal (fairness of the primary metric)", () => {
  let dir;
  /** @type {{withNotification: any, withoutNotification: any}} */
  let sessions;

  before(async () => {
    dir = makeTempDir("lsp-ready-");
    const file = join(dir, "LspTarget.vue");
    const source = "<script setup lang=\"ts\">\nconst benchMarker = ref('x')\n</script>\n";
    writeFileSync(file, source);

    const run = (readyNotification) =>
      runLspSession({
        name: `stub${readyNotification ? "+ready" : ""}`,
        command: process.execPath,
        args: [STUB_SERVER],
        shell: false,
        rootDir: dir,
        filePath: file,
        source,
        probe: { line: 1, character: 6 },
        initializationOptions: {},
        readyNotifications: readyNotification ? [readyNotification] : [],
        env: {
          STUB_PROJECT_LOAD_MS: String(PROJECT_LOAD_MS),
          STUB_READY_NOTIFICATION: readyNotification ?? "",
        },
      });

    // Two servers doing IDENTICAL work; one announces when it is ready and one
    // stays quiet. The announcement is the only difference between them.
    sessions = {
      withNotification: await run("$/verter/ready"),
      withoutNotification: await run(null),
    };
  });

  after(() => removeDir(dir));

  test("a server's project load is inside the ranked open→hover window even when it announces readiness", () => {
    // The old code awaited the notification before `tOpen0`, so this metric was
    // ~55ms — the 50ms yield and one immediate hover — with the whole project
    // load billed to nobody.
    assert.ok(
      sessions.withNotification.didOpenToHoverMs >= PROJECT_LOAD_MS,
      `didOpen→hover was ${sessions.withNotification.didOpenToHoverMs.toFixed(0)}ms for a server ` +
        `that could not answer for ${PROJECT_LOAD_MS}ms — its project load was excluded from the ranked metric`,
    );
  });

  test("declaring a ready notification does not change the ranked number", () => {
    // The like-for-like invariant, stated directly: two servers that become
    // usable at the same instant must measure the same, whether or not one of
    // them documents a vendor notification. Under the old behaviour these two
    // differed by ~600ms.
    const { withNotification: a, withoutNotification: b } = sessions;
    const delta = Math.abs(a.didOpenToHoverMs - b.didOpenToHoverMs);
    assert.ok(
      delta < 200,
      `emitting $/verter/ready moved the ranked metric by ${delta.toFixed(0)}ms ` +
        `(${a.didOpenToHoverMs.toFixed(0)}ms with, ${b.didOpenToHoverMs.toFixed(0)}ms without) — ` +
        `the harness is measuring the announcement, not the work`,
    );
  });

  test("the ready signal is still reported as a diagnostic", () => {
    // Dropping the wait must not drop the observation: workspaceReady is the
    // only place a server's own view of project load is published.
    assert.ok(
      Number.isFinite(sessions.withNotification.workspaceReadyMs),
      "workspaceReadyMs must still be recorded when the server emits the notification",
    );
    assert.ok(
      sessions.withNotification.workspaceReadyMs >= PROJECT_LOAD_MS,
      "workspaceReadyMs is measured from session start, so it covers the project load",
    );
    assert.equal(
      sessions.withoutNotification.workspaceReadyMs,
      null,
      "a server that emits nothing reports n/a, never 0",
    );
  });

  test("the ready notification is observed, never awaited", () => {
    // Source tripwire for the exact shape of the defect. The behavioural tests
    // above cannot see a re-introduced wait that happens to be short, and this
    // one names the line that must never come back.
    const code = surfaceCode();
    assert.ok(
      !/await\s+client\.waitForNotification/.test(code),
      "runLspSession awaits a ready notification again — that moves one vendor's project load out of the ranked window",
    );
    assert.ok(
      /client\.on\(\s*"notification"/.test(code),
      "the ready signal must still be observed passively so workspaceReadyMs survives",
    );
  });

  test("no LSP variant is given a ready-wait budget of its own", () => {
    // A ready-wait budget only ever existed to size a blocking wait; its return
    // would mean the wait returned with it. Asymmetric budgets are the thing
    // this surface has been bitten by twice — see the hover-retry note.
    assert.ok(
      !/^\s*readyTimeoutMs\s*[:=]/m.test(surfaceCode()),
      "a per-server ready-wait budget is back in the LSP surface",
    );
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * 2. Comparison classes: engines are never ranked against each other
 * ──────────────────────────────────────────────────────────────────────── */

describe("LSP comparison classes (TypeScript engine axis)", () => {
  test("each variant reports the engine its typecheck peer reports", () => {
    // Resolved through resolveToolEngine() so the LSP and typecheck surfaces
    // cannot drift into using different names for the same engine.
    assert.equal(lspVariantEngine("volar-language-server").engine, "tsc-js");
    assert.equal(lspVariantEngine("volar-language-server-tnb").engine, "tsgo");
    assert.equal(lspVariantEngine("vize-lsp").engine, "tsgo");
    assert.equal(lspVariantEngine("verter-lsp").engine, "tsgo");
  });

  test("an unrecognised server is its own class rather than silently pooled", () => {
    assert.equal(lspVariantEngine("some-new-server").engine, "unknown");
  });

  test("the axis is applied to every row, skipped ones included", () => {
    // Skipped rows carry it too: `classKey()` groups them like any other row,
    // and a "Package not installed" line landing in the wrong table is a
    // smaller bug than a ranked row but the same bug.
    const variants = [
      { id: "volar-language-server", notes: "" },
      { id: "vize-lsp", notes: "", skip: true },
    ];
    applyLspEngineAxis(variants);
    assert.equal(variants[0].engine, "tsc-js");
    assert.equal(variants[1].engine, "tsgo");
    for (const v of variants) {
      assert.match(v.notes, /engine: /, "the engine must be printed on the row, not just grouped by");
    }
  });

  test("the four LSP variants do not collapse into one cross-engine table", () => {
    // Rows carry the axes the SURFACE assigns (via applyLspEngineAxis, not a
    // value restated by the test) and are rendered by the real renderer.
    // Medians are the published ones, so the old behaviour reproduces the exact
    // defect: one table, Verter the baseline, Volar 2.20x.
    const row = (label, id, medianMs) => ({
      id,
      label,
      status: "ok",
      medianMs,
      minMs: medianMs - 1,
      stddevMs: 1,
      cvPct: 2,
      runs: [medianMs],
      throughput: "n/a",
      notes: "",
      threading: "lsp",
      files: 1,
    });

    const md = renderSurfaceMarkdown({
      id: "lsp",
      label: "LSP",
      files: 1,
      bytes: 1024,
      methodology: [],
      variants: applyLspEngineAxis([
        row("Volar (@vue/language-server)", "volar-language-server", 703.77),
        row("Volar (TNB / tsgo tsdk)", "volar-language-server-tnb", 726.752),
        row("Vize LSP", "vize-lsp", 53.776),
        row("Verter LSP", "verter-lsp", 319.605),
      ]),
    });

    const tables = collectMarkdownTables(md);
    assert.equal(tables.length, 2, "one table per engine, not one table for the surface");

    const titles = classTitles(md);
    assert.ok(
      titles.some((t) => t.startsWith("TypeScript")),
      `expected a JS-engine class heading, got: ${titles.join(" | ")}`,
    );
    assert.ok(
      titles.some((t) => t.startsWith("tsgo")),
      `expected a native-engine class heading, got: ${titles.join(" | ")}`,
    );

    const labelsOf = (t) => t.body.map((cells) => cells[0]);
    const jsTable = tables.find((t) => labelsOf(t).some((l) => l.startsWith("Volar (@vue")));
    assert.deepEqual(
      labelsOf(jsTable),
      ["Volar (@vue/language-server)"],
      "the JavaScript-engine server must not share a table with the native-engine servers",
    );

    // The concrete published bug: Volar was rated against Verter's baseline.
    const VS_FASTEST = 6;
    assert.equal(
      jsTable.body[0][VS_FASTEST],
      "1.00x",
      "Volar's baseline must be its own engine class, not a tsgo server",
    );
  });

  test("runLspSurface applies the axis before the rows are measured", () => {
    // The tests above prove the rule and prove the renderer honours it. Only
    // the surface itself can prove the rule is actually reached: measureVariants
    // copies `engine` onto the result rows, so an axis stamped afterwards (or
    // not at all) never reaches the report and the table silently re-merges.
    // Scoped to runLspSurface's body, otherwise the function's own declaration
    // satisfies the search and the guard passes with the call deleted.
    const whole = surfaceCode();
    const bodyStart = whole.indexOf("export async function runLspSurface");
    assert.ok(bodyStart !== -1, "runLspSurface not found");
    const code = whole.slice(bodyStart);
    const applied = code.indexOf("applyLspEngineAxis(variants)");
    const measured = code.indexOf("measureVariants(variants");
    assert.ok(applied !== -1, "runLspSurface no longer applies the engine axis");
    assert.ok(measured !== -1, "expected measureVariants(variants, ...) in runLspSurface");
    assert.ok(
      applied < measured,
      "the engine axis must be stamped before measureVariants copies it onto the result rows",
    );
  });

  test("process host is NOT a comparison-class axis — that would leave every table with one row", () => {
    // A native-process server and a Node-process server stay comparable on this
    // surface: there is no native Volar and no Node-hosted Verter, so splitting
    // on `invocation` would delete the comparison the surface exists to make,
    // and would make the table layout depend on whether the machine happens to
    // have a VS Code install. The distinction is published on the row instead.
    assert.ok(
      !/^\s*invocation\s*:/m.test(surfaceCode()),
      "the LSP surface set an `invocation` axis — see the note on ENGINE_PEER before changing this",
    );
  });
});

/* ────────────────────────────────────────────────────────────────────────────
 * 3. Vize is launched the way the product ships it — and says which
 * ──────────────────────────────────────────────────────────────────────── */

describe("Vize language-server entry point", () => {
  let dir;
  before(() => {
    dir = makeTempDir("vize-native-");
  });
  after(() => removeDir(dir));

  /** A fake VS Code globalStorage tree, matching the extension's real layout. */
  function plantNativeServer(root, version, triple, exe) {
    const serverDir = join(root, "ubugeeei.vize", "servers", version, triple);
    mkdirSync(serverDir, { recursive: true });
    const bin = join(serverDir, exe);
    writeFileSync(bin, "#!/bin/sh\n");
    return bin;
  }

  test("discovers the extension-downloaded native server under globalStorage", () => {
    const root = join(dir, "gs-found");
    const bin = plantNativeServer(root, "0.291.0", "x86_64-pc-windows-msvc", "vize.exe");
    const found = findVizeNativeServer({
      version: "0.291.0",
      roots: [root],
      platform: "win32",
    });
    assert.equal(found?.bin, bin);
    assert.equal(found?.triple, "x86_64-pc-windows-msvc");
  });

  test("the platform triple directory is discovered, not reconstructed", () => {
    // Any triple works, so a new target does not need a harness change.
    const root = join(dir, "gs-triple");
    plantNativeServer(root, "1.2.3", "aarch64-apple-darwin", "vize");
    const found = findVizeNativeServer({ version: "1.2.3", roots: [root], platform: "darwin" });
    assert.equal(found?.triple, "aarch64-apple-darwin");
  });

  test("a native server of a DIFFERENT version is never used", () => {
    // Otherwise the row would compare the extension's build against the repo's
    // pinned package and publish a version delta as a product delta.
    const root = join(dir, "gs-mismatch");
    plantNativeServer(root, "0.290.0", "x86_64-pc-windows-msvc", "vize.exe");
    assert.equal(
      findVizeNativeServer({ version: "0.291.0", roots: [root], platform: "win32" }),
      null,
    );
  });

  test("a missing globalStorage tree resolves to null instead of throwing", () => {
    assert.equal(
      findVizeNativeServer({ version: "0.291.0", roots: [join(dir, "does-not-exist")] }),
      null,
    );
  });

  test("a version-matched native server is preferred over the npm Node entry", () => {
    // The defect itself: without this the surface benchmarks a two-line Node
    // shim loading a ~34MB NAPI addon while the shipped product is a standalone
    // executable — ~35ms of Node bootstrap per spawn that the product does not
    // pay, on a surface that spawns a fresh server for every measured run.
    const installed = JSON.parse(
      readFileSync(join(here, "..", "..", "node_modules", "vize", "package.json"), "utf8"),
    ).version;

    const root = join(dir, "gs-preferred");
    const exe = process.platform === "win32" ? "vize.exe" : "vize";
    const bin = plantNativeServer(root, installed, "harness-target-triple", exe);

    const spec = resolveVizeLsp({ env: {}, roots: [root] });
    assert.equal(spec.command, bin, "the native server must win over bin/vize");
    assert.equal(spec.entry, "native");
    assert.deepEqual(spec.args, ["lsp", "--stdio"], "same command line the extension uses");
    assert.notEqual(spec.command, process.execPath, "must not be launched through Node");
  });

  test("VIZE_LSP_BIN overrides discovery, mirroring VERTER_LSP_BIN", () => {
    const bin = join(dir, "pinned-vize.exe");
    writeFileSync(bin, "");
    const spec = resolveVizeLsp({ env: { VIZE_LSP_BIN: bin }, roots: [] });
    assert.equal(spec.command, bin);
    assert.deepEqual(spec.args, ["lsp", "--stdio"]);
    assert.equal(spec.entry, "native");
    assert.ok(spec.labelExtra, "an overridden binary must still label itself");
  });

  test("VIZE_LSP_ARGS and VIZE_LSP_LABEL are honoured", () => {
    const bin = join(dir, "pinned-args.exe");
    writeFileSync(bin, "");
    const spec = resolveVizeLsp({
      env: { VIZE_LSP_BIN: bin, VIZE_LSP_ARGS: "lsp --port 0", VIZE_LSP_LABEL: "nightly" },
      roots: [],
    });
    assert.deepEqual(spec.args, ["lsp", "--port", "0"]);
    assert.equal(spec.labelExtra, "nightly");
  });

  test("with no native server and no override it falls back to the npm Node entry", () => {
    // The CI path. No runner has a VS Code install, so this branch must keep
    // working or the Vize row disappears from published CI results entirely.
    const spec = resolveVizeLsp({ env: {}, roots: [] });
    assert.ok(spec, "Vize must still resolve without a native server");
    assert.equal(spec.command, process.execPath, "falls back to `node <entry>`");
    assert.equal(spec.entry, "node");
    assert.ok(/vize/.test(spec.args[0]), `expected the vize entry, got ${spec.args[0]}`);
    assert.notEqual(spec.shell, true, "the fallback must not go through a shell shim");
  });

  test("every resolution branch labels which entry point it picked", () => {
    // Without this a local run and a CI run publish different measurements
    // under the same row name.
    const pinned = join(dir, "labelled.exe");
    writeFileSync(pinned, "");
    const nativeRoot = join(dir, "gs-label");
    plantNativeServer(nativeRoot, "0.291.0", "x86_64-pc-windows-msvc", "vize.exe");

    for (const spec of [
      resolveVizeLsp({ env: { VIZE_LSP_BIN: pinned }, roots: [] }),
      resolveVizeLsp({ env: {}, roots: [] }),
    ]) {
      assert.ok(spec.labelExtra, `no labelExtra on ${spec.command}`);
      assert.ok(["native", "node"].includes(spec.entry), `unexpected entry kind ${spec.entry}`);
    }
  });

  test("globalStorage roots cover stable and Insiders on every platform", () => {
    for (const [platform, env] of [
      ["win32", { APPDATA: join("C:", "Users", "u", "AppData", "Roaming") }],
      ["darwin", { HOME: join("/Users", "u") }],
      ["linux", { HOME: join("/home", "u") }],
    ]) {
      const roots = vsCodeGlobalStorageRoots(env, platform);
      assert.equal(roots.length, 2, `${platform} should search stable + Insiders`);
      assert.ok(roots.some((r) => r.includes("Code - Insiders")), `${platform}: no Insiders root`);
      assert.ok(
        roots.every((r) => r.endsWith(join("User", "globalStorage"))),
        `${platform}: ${roots.join(" | ")}`,
      );
    }
  });

  test("an environment with no home directory yields no roots rather than bogus ones", () => {
    assert.deepEqual(vsCodeGlobalStorageRoots({}, "linux"), []);
    assert.deepEqual(vsCodeGlobalStorageRoots({}, "darwin"), []);
  });
});
