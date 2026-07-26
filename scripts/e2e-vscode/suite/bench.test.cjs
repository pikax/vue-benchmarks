/**
 * Runs *inside* VS Code via @vscode/test-electron.
 * Measures extension-host language features for one enabled Vue extension.
 *
 * Env (set by run.mjs):
 *   E2E_WORKSPACE   absolute workspace path
 *   E2E_EXTENSION   marketplace id (Vue.volar | ubugeeei.vize | verter.verter-vscode)
 *   E2E_LABEL       display label
 *   E2E_RESULTS     path to write JSON results
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

function findSymbolPosition(source, symbol) {
  if (!symbol) {
    // Mid-file word token
    const lines = source.split(/\r?\n/);
    for (let i = Math.floor(lines.length * 0.3); i < lines.length; i++) {
      const m = lines[i].match(/\b([A-Za-z_][A-Za-z0-9_]{3,})\b/);
      if (m) return new vscode.Position(i, m.index);
    }
    return new vscode.Position(0, 0);
  }
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const idx = lines[i].indexOf(`const ${symbol}`);
    if (idx !== -1) return new vscode.Position(i, idx + "const ".length);
    const idx2 = lines[i].indexOf(symbol);
    if (idx2 !== -1) return new vscode.Position(i, idx2);
  }
  return new vscode.Position(0, 0);
}

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

async function waitForExtension(id, timeoutMs = 60_000) {
  if (!id) return null;
  const ext = vscode.extensions.getExtension(id);
  if (!ext) {
    // list for debug
    const vueish = vscode.extensions.all
      .filter((e) => /vue|volar|vize|verter/i.test(e.id))
      .map((e) => e.id);
    throw new Error(
      `Extension not found: ${id}. Vue-related loaded: ${vueish.join(", ") || "(none)"}`,
    );
  }
  if (!ext.isActive) {
    const t0 = performance.now();
    await Promise.race([
      ext.activate(),
      new Promise((_, rej) =>
        setTimeout(() => rej(new Error(`activate timeout ${id}`)), timeoutMs),
      ),
    ]);
    return { ext, activateMs: performance.now() - t0 };
  }
  return { ext, activateMs: 0 };
}

async function waitForDiagnostics(uri, timeoutMs = 30_000) {
  const t0 = performance.now();
  // First check existing
  let diags = vscode.languages.getDiagnostics(uri);
  if (diags.length > 0) {
    return { waitMs: performance.now() - t0, count: diags.length };
  }
  return await new Promise((resolve) => {
    const timer = setTimeout(() => {
      sub.dispose();
      const d = vscode.languages.getDiagnostics(uri);
      resolve({ waitMs: performance.now() - t0, count: d.length, timedOut: true });
    }, timeoutMs);
    const sub = vscode.languages.onDidChangeDiagnostics((e) => {
      if (e.uris.some((u) => u.toString() === uri.toString())) {
        clearTimeout(timer);
        sub.dispose();
        const d = vscode.languages.getDiagnostics(uri);
        resolve({ waitMs: performance.now() - t0, count: d.length });
      }
    });
  });
}

suite("VS Code E2E Vue language extension", function () {
  this.timeout(180_000);

  test("open + hover + completion latency", async () => {
    const workspacePath = process.env.E2E_WORKSPACE;
    const extensionId = process.env.E2E_EXTENSION || "";
    const label = process.env.E2E_LABEL || extensionId || "none";
    const resultsPath = process.env.E2E_RESULTS;

    assert.ok(workspacePath, "E2E_WORKSPACE required");
    assert.ok(resultsPath, "E2E_RESULTS required");

    const probePath = path.join(workspacePath, "e2e-probe.json");
    assert.ok(fs.existsSync(probePath), `missing e2e-probe.json in ${workspacePath}`);
    const probe = JSON.parse(fs.readFileSync(probePath, "utf8"));
    const fileRel = probe.file;
    assert.ok(fileRel, "probe.file required");
    const fileAbs = path.join(workspacePath, fileRel);
    assert.ok(fs.existsSync(fileAbs), `probe file missing: ${fileAbs}`);
    const source = fs.readFileSync(fileAbs, "utf8");
    const position = findSymbolPosition(source, probe.symbol);

    const result = {
      label,
      extensionId: extensionId || null,
      workspace: workspacePath,
      kind: probe.kind,
      file: fileRel,
      position: { line: position.line, character: position.character },
      platform: process.platform,
      vscodeVersion: vscode.version,
      phases: {},
      timestamp: new Date().toISOString(),
    };

    // Activate target extension
    if (extensionId) {
      const act = await waitForExtension(extensionId);
      result.phases.activateMs = act.activateMs;
    } else {
      result.phases.activateMs = null;
      result.notes = "No extension id — baseline vscode only";
    }

    // Open document
    const uri = vscode.Uri.file(fileAbs);
    const tOpen0 = performance.now();
    const doc = await vscode.workspace.openTextDocument(uri);
    await vscode.window.showTextDocument(doc, { preview: false });
    result.phases.openDocumentMs = performance.now() - tOpen0;

    // Diagnostics settle (language service warm path)
    const diag = await waitForDiagnostics(uri, 45_000);
    result.phases.diagnosticsWaitMs = diag.waitMs;
    result.phases.diagnosticsCount = diag.count;
    result.phases.diagnosticsTimedOut = !!diag.timedOut;

    // First hover (cold after open)
    const tHover0 = performance.now();
    let hovers = await vscode.commands.executeCommand("vscode.executeHoverProvider", uri, position);
    result.phases.hoverColdMs = performance.now() - tHover0;
    result.phases.hoverColdCount = Array.isArray(hovers) ? hovers.length : 0;

    // Warm hover median
    const warm = [];
    for (let i = 0; i < 5; i++) {
      const t0 = performance.now();
      await vscode.commands.executeCommand("vscode.executeHoverProvider", uri, position);
      warm.push(performance.now() - t0);
    }
    result.phases.hoverWarmMedianMs = median(warm);
    result.phases.hoverWarmRuns = warm;

    // Completion
    try {
      const tC0 = performance.now();
      const comps = await vscode.commands.executeCommand(
        "vscode.executeCompletionItemProvider",
        uri,
        position.translate(0, 2),
      );
      result.phases.completionMs = performance.now() - tC0;
      result.phases.completionCount = comps?.items?.length ?? 0;
    } catch (e) {
      result.phases.completionMs = null;
      result.phases.completionError = String(e.message || e);
    }

    // Definition
    try {
      const tD0 = performance.now();
      const defs = await vscode.commands.executeCommand(
        "vscode.executeDefinitionProvider",
        uri,
        position,
      );
      result.phases.definitionMs = performance.now() - tD0;
      result.phases.definitionCount = Array.isArray(defs) ? defs.length : 0;
    } catch (e) {
      result.phases.definitionMs = null;
      result.phases.definitionError = String(e.message || e);
    }

    // Primary metric for ranking tables
    result.primaryMs = result.phases.hoverColdMs;
    result.primaryMetric = "hoverColdMs";

    fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2) + "\n");

    // Soft asserts — we still write results on partial failure
    assert.ok(doc.lineCount > 0, "document empty");
  });
});
