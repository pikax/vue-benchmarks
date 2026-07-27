/**
 * Runs *inside* VS Code via @vscode/test-electron.
 * Measures extension-host language features for one enabled Vue extension.
 *
 * Env (set by run.mjs):
 *   E2E_WORKSPACE   absolute workspace path
 *   E2E_EXTENSION   marketplace id (Vue.volar | ubugeeei.vize | verter.verter-vscode)
 *   E2E_LABEL       display label
 *   E2E_RESULTS     path to write JSON results
 *
 * This file does the measuring and the gating and writes the raw result. It
 * does NOT decide what ranks — scripts/e2e-vscode/report.mjs does, from the
 * JSON, so those rules are testable without Electron.
 *
 * Everything with a decision in it lives in a sibling module for the same
 * reason: suite/measure.cjs (activation, diagnostics), suite/probe-positions.cjs
 * (where to hover), suite/hover-gate.cjs (whether the answer was right).
 */

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vscode = require("vscode");

const { activateSubject, waitForFirstDiagnostics } = require("./measure.cjs");
const {
  findScriptPosition,
  findTemplatePosition,
  findFallbackPosition,
} = require("./probe-positions.cjs");
const { classifyHover, classifyTemplateHover, hoverText } = require("./hover-gate.cjs");

const DIAGNOSTICS_TIMEOUT_MS = 45_000;
/** Bound the payload kept in the result file — it is there to audit the gate. */
const PAYLOAD_KEEP_BYTES = 2000;

function median(values) {
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function toPosition(p) {
  return new vscode.Position(p.line, p.character);
}

async function hoverAt(uri, position) {
  const t0 = performance.now();
  const hovers = await vscode.commands.executeCommand(
    "vscode.executeHoverProvider",
    uri,
    position,
  );
  return {
    ms: performance.now() - t0,
    count: Array.isArray(hovers) ? hovers.length : 0,
    text: hoverText(hovers),
  };
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

    // Where to hover, and whether the answer can be checked at all.
    //
    // `probe.symbol` is the planted marker. When it is present the probe has a
    // known-correct answer at two positions and the row can be gated; when it
    // is absent (a real cloned project) it cannot, and the row is measured but
    // never ranked — see classifyRow in ../report.mjs.
    const symbol = probe.symbol || null;
    const templatePos = symbol ? findTemplatePosition(source, symbol) : null;
    const scriptPos = symbol ? findScriptPosition(source, symbol) : null;
    const gateable = Boolean(symbol && templatePos && scriptPos);
    const position = toPosition(templatePos ?? findFallbackPosition(source));

    const result = {
      label,
      extensionId: extensionId || null,
      workspace: workspacePath,
      kind: probe.kind,
      file: fileRel,
      symbol,
      position: { line: position.line, character: position.character },
      scriptPosition: scriptPos,
      templatePosition: templatePos,
      platform: process.platform,
      vscodeVersion: vscode.version,
      phases: {},
      timestamp: new Date().toISOString(),
    };

    // Activate target extension. Reported only when this run performed it.
    if (extensionId) {
      const ext = vscode.extensions.getExtension(extensionId);
      if (!ext) {
        const vueish = vscode.extensions.all
          .filter((e) => /vue|volar|vize|verter/i.test(e.id))
          .map((e) => e.id);
        throw new Error(
          `Extension not found: ${extensionId}. Vue-related loaded: ${vueish.join(", ") || "(none)"}`,
        );
      }
      const activation = await activateSubject({ extension: ext, label: extensionId });
      result.phases.activateMs = activation.activateMs;
      result.phases.activateOutcome = activation.activateOutcome;
    } else {
      result.phases.activateMs = null;
      result.phases.activateOutcome = "no-extension";
      result.notes = "No extension id — baseline vscode only";
    }

    // Open + diagnostics share ONE timeline with a common origin: the
    // subscription is registered and the clock started before the open, so a
    // server that publishes during the open is timed instead of scoring zero.
    const uri = vscode.Uri.file(fileAbs);
    const diag = await waitForFirstDiagnostics({
      languages: vscode.languages,
      uri,
      timeoutMs: DIAGNOSTICS_TIMEOUT_MS,
      openDocument: async () => {
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false });
        return doc;
      },
    });
    result.phases.openDocumentMs = diag.openMs;
    result.phases.diagnosticsWaitMs = diag.waitMs;
    result.phases.diagnosticsCount = diag.count;
    result.phases.diagnosticsOutcome = diag.outcome;
    result.phases.diagnosticsTimeoutMs = diag.timeoutMs;
    result.phases.diagnosticsTimedOut = diag.outcome === "timeout";

    // First hover after open — the ranked measurement, taken at the template
    // position because that is the Vue-specific one.
    const cold = await hoverAt(uri, position);
    result.phases.hoverColdMs = cold.ms;
    result.phases.hoverColdCount = cold.count;

    // Content gate. Both halves required, mirroring the LSP surface.
    if (gateable) {
      const scriptHover = await hoverAt(uri, toPosition(scriptPos));
      // Recorded but never published as a latency: it is taken after the cold
      // hover has already warmed the server, so it is not a cold number and
      // must not be read as one. It exists to be classified.
      result.phases.gateScriptHoverWarmMs = scriptHover.ms;
      result.gate = {
        applicable: true,
        symbol,
        template: classifyTemplateHover(cold.text),
        script: classifyHover(scriptHover.text),
        payloads: {
          template: cold.text.slice(0, PAYLOAD_KEEP_BYTES),
          script: scriptHover.text.slice(0, PAYLOAD_KEEP_BYTES),
        },
      };
    } else {
      result.gate = {
        applicable: false,
        symbol,
        reason: symbol
          ? `probe symbol \`${symbol}\` has no ${templatePos ? "script" : "template"} position in ${fileRel} — nothing to validate the hover answer against`
          : "no planted marker in this workspace — the hover position has no known-correct answer, so latency here cannot be validated or compared",
        payloads: { template: cold.text.slice(0, PAYLOAD_KEEP_BYTES) },
      };
    }

    // Warm hover median at the same position as the cold one.
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

    // Primary metric for ranking tables. Whether it is ALLOWED to rank is
    // decided in ../report.mjs from the gate above — writing a number here is
    // not the same as claiming it is comparable.
    result.primaryMs = result.phases.hoverColdMs;
    result.primaryMetric = "hoverColdMs";

    fs.mkdirSync(path.dirname(resultsPath), { recursive: true });
    fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2) + "\n");

    // Soft asserts — we still write results on partial failure. A failed gate
    // is NOT a failed test: it is an unranked row, which is the report's job.
    const doc = await vscode.workspace.openTextDocument(uri);
    assert.ok(doc.lineCount > 0, "document empty");
  });
});
