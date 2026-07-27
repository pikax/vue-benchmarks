#!/usr/bin/env node
/**
 * VS Code headless E2E orchestrator.
 *
 * For each (workspace × extension) pair:
 *   1. Download/cache a stable VS Code build (@vscode/test-electron)
 *   2. Launch headless with only that Vue extension enabled
 *   3. Run suite/bench.test.cjs inside the extension host
 *   4. Collect JSON results
 *
 * Setup:
 *   - Same VS Code version for every cell
 *   - --disable-extensions then enable only the subject under test
 *   - Same workspaces (regular / monorepo / optional nuxt-ui)
 *   - Tables sort by measured primary metric
 *
 * Extensions (defaults — all on Marketplace):
 *   Vue.volar              Official Volar
 *   ubugeeei.vize          Vize
 *   verter.verter-vscode   Verter
 *
 * Override with --extensions id=Label,... or env VIZE_EXTENSION_ID / VERTER_EXTENSION_ID.
 * Optional: --verter-vsix for a local .vsix instead of marketplace.
 *
 * Usage:
 *   node scripts/e2e-vscode/setup-workspaces.mjs
 *   node scripts/e2e-vscode/run.mjs
 *   node scripts/e2e-vscode/run.mjs --workspaces regular,monorepo
 *   node scripts/e2e-vscode/run.mjs --workspaces nuxt-ui --with-setup-nuxt-ui
 */

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  readdirSync,
  cpSync,
  rmSync,
} from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createRequire } from "node:module";
import os from "node:os";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, "../..");
const e2eRoot = join(rootDir, "fixtures", "e2e");
const resultsRoot = join(rootDir, "results", "e2e-vscode");

// Published marketplace IDs (alphabetical by label; ranking is by measured metric).
const DEFAULT_EXTENSIONS = [
  { id: "Vue.volar", label: "Volar" },
  { id: "ubugeeei.vize", label: "Vize" },
  { id: "verter.verter-vscode", label: "Verter" },
];

function parseArgs(argv) {
  const args = {
    workspaces: "regular,monorepo",
    extensions: "",
    verterVsix: process.env.VERTER_VSIX || "",
    // Env overrides replace marketplace id when set (for forks / prereleases)
    vizeExtension: process.env.VIZE_EXTENSION_ID || "ubugeeei.vize",
    verterExtension: process.env.VERTER_EXTENSION_ID || "verter.verter-vscode",
    volarExtension: process.env.VOLAR_EXTENSION_ID || "Vue.volar",
    withSetup: false,
    withSetupNuxtUi: false,
    nuxtUiRef: process.env.NUXT_UI_REF || "v3.1.3",
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--workspaces") args.workspaces = argv[++i];
    else if (a === "--extensions") args.extensions = argv[++i];
    else if (a === "--verter-vsix") args.verterVsix = argv[++i];
    else if (a === "--vize-extension") args.vizeExtension = argv[++i];
    else if (a === "--verter-extension") args.verterExtension = argv[++i];
    else if (a === "--volar-extension") args.volarExtension = argv[++i];
    else if (a === "--with-setup") args.withSetup = true;
    else if (a === "--with-setup-nuxt-ui") {
      args.withSetup = true;
      args.withSetupNuxtUi = true;
    } else if (a === "--nuxt-ui-ref") args.nuxtUiRef = argv[++i];
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function buildExtensionList(args) {
  if (args.extensions) {
    return args.extensions.split(",").map((s) => {
      const [id, label] = s.trim().split("=");
      return { id, label: label || id };
    });
  }

  // Local vsix replaces marketplace Verter when provided
  if (args.verterVsix) {
    return [
      { id: args.volarExtension, label: "Volar" },
      { id: args.vizeExtension, label: "Vize" },
      {
        id: "verter.local-vsix",
        label: "Verter (vsix)",
        vsix: resolve(args.verterVsix),
      },
    ];
  }

  return [
    { id: args.volarExtension, label: "Volar" },
    { id: args.vizeExtension, label: "Vize" },
    { id: args.verterExtension, label: "Verter" },
  ];
}

function ensureWorkspaces(args) {
  if (!args.withSetup && existsSync(join(e2eRoot, "regular"))) return;
  const setupArgs = [];
  if (args.withSetupNuxtUi) {
    setupArgs.push("--with-nuxt-ui", "--nuxt-ui-ref", args.nuxtUiRef);
  }
  const r = spawnSync(process.execPath, [join(__dirname, "setup-workspaces.mjs"), ...setupArgs], {
    cwd: rootDir,
    stdio: "inherit",
  });
  if (r.status !== 0) throw new Error("setup-workspaces failed");
}

/**
 * List installed extension folders that match publisher.name or id prefix.
 */
function listInstalledExtensionDirs(extensionsRoot, extensionId) {
  if (!existsSync(extensionsRoot)) return [];
  // Marketplace folder names are lowercased (e.g. vue.volar-3.3.8 vs Vue.volar)
  const id = String(extensionId).toLowerCase();
  const prefix = `${id}-`;
  return readdirSync(extensionsRoot, { withFileTypes: true })
    .filter((d) => {
      if (!d.isDirectory()) return false;
      const name = d.name.toLowerCase();
      return name === id || name.startsWith(prefix);
    })
    .map((d) => join(extensionsRoot, d.name));
}

function readExtensionId(extDir) {
  try {
    const pkg = JSON.parse(readFileSync(join(extDir, "package.json"), "utf8"));
    if (pkg.publisher && pkg.name) return `${pkg.publisher}.${pkg.name}`;
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * Ensure marketplace/vsix subject is present under isolated extensions-dir.
 * VS Code CLI install needs a private --user-data-dir; marketplace can fail offline
 * so we fall back to copying from the developer's ~/.vscode/extensions when present.
 */
/**
 * @returns {{ extension: object, developmentPath: string }}
 * developmentPath is used as --extensionDevelopmentPath so the subject
 * actually loads under @vscode/test-electron (extensions-dir alone is flaky).
 */
function ensureSubjectExtension({ vscodeExecutablePath, extDir, extension }) {
  const userDataDir = join(
    os.tmpdir(),
    `vue-bench-e2e-userdata-${extension.label.replace(/\W+/g, "_")}-${process.pid}`,
  );
  mkdirSync(userDataDir, { recursive: true });

  const installArgs = (target) => [
    "--user-data-dir",
    userDataDir,
    "--extensions-dir",
    extDir,
    "--install-extension",
    target,
    "--force",
    "--disable-gpu",
    "--skip-welcome",
    "--skip-release-notes",
  ];

  let installed = [];

  if (extension.vsix) {
    if (!existsSync(extension.vsix)) {
      throw new Error(`vsix not found: ${extension.vsix}`);
    }
    const r = spawnSync(vscodeExecutablePath, installArgs(extension.vsix), {
      stdio: "inherit",
      shell: false,
      encoding: "utf8",
    });
    if (r.status !== 0) {
      throw new Error(`vsix install failed (exit ${r.status}): ${extension.vsix}`);
    }
    // After vsix install, pick whatever landed
    installed = readdirSync(extDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => join(extDir, d.name));
  } else if (extension.id && !extension.id.endsWith(".local-vsix")) {
    // Prefer a machine-local install (fast, offline). Marketplace CLI often
    // hangs minutes under headless Code.exe on Windows.
    const homeExt =
      process.env.VSCODE_EXTENSIONS ||
      join(
        process.env.USERPROFILE || process.env.HOME || "",
        ".vscode",
        "extensions",
      );
    const local = listInstalledExtensionDirs(homeExt, extension.id);
    if (local.length > 0) {
      const src = local.sort().at(-1);
      const dest = join(extDir, src.split(/[/\\]/).pop());
      console.log(`  install: local copy ${src} → ${dest}`);
      cpSync(src, dest, { recursive: true });
      installed = [dest];
    } else {
      console.log(`  install: marketplace ${extension.id}…`);
      const r = spawnSync(vscodeExecutablePath, installArgs(extension.id), {
        stdio: "inherit",
        shell: false,
        encoding: "utf8",
        timeout: 120_000,
      });
      installed = listInstalledExtensionDirs(extDir, extension.id);
      if (installed.length === 0) {
        throw new Error(
          `Could not install ${extension.id} (cli exit ${r.status}). ` +
            `Install it once in VS Code, or pass --verter-vsix / --extensions.`,
        );
      }
    }

    const realId = readExtensionId(installed[0]);
    if (realId && realId !== extension.id) {
      console.log(`  extension id resolved: ${extension.id} → ${realId}`);
      extension = { ...extension, id: realId };
    }
  }

  try {
    rmSync(userDataDir, { recursive: true, force: true });
  } catch {
    /* ignore */
  }

  if (!installed.length) {
    // Re-scan extDir as last resort
    installed = readdirSync(extDir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => join(extDir, d.name));
  }
  if (!installed.length) {
    throw new Error(`No extension package found under ${extDir}`);
  }

  const developmentPath = installed.sort().at(-1);
  const realId = readExtensionId(developmentPath);
  if (realId) {
    extension = { ...extension, id: realId };
  }

  return { extension, developmentPath };
}

/**
 * Per-launch budget for one VS Code subject, in ms.
 *
 * Sized from what a launch has to do: Electron cold start, extension
 * activation, workspace open, language-server spawn and project load, then the
 * hover probe. Generous enough that a slow-but-working subject is measured
 * rather than cut off — a truncated slow result would be worse than useless —
 * and short enough that six of them fit comfortably inside a 30-minute job.
 *
 * IDENTICAL for every extension. An asymmetric budget silently subsidises
 * whichever subject got the larger one, which is the same mistake the LSP
 * surface's retry budget already had to have corrected.
 */
const LAUNCH_TIMEOUT_MS = Number(process.env.E2E_LAUNCH_TIMEOUT_MS ?? 240_000);

/**
 * Race a VS Code launch against the budget.
 *
 * On timeout the Electron process is killed rather than merely abandoned:
 * `runTests()` gives us no handle on the child, so an orphan would keep holding
 * the display and could make every LATER subject fail too — turning one bad
 * result into a bad run.
 */
async function withLaunchTimeout(promise, label, vscodeExecutablePath) {
  let timer;
  const budget = new Promise((_resolve, reject) => {
    timer = setTimeout(() => {
      const seconds = Math.round(LAUNCH_TIMEOUT_MS / 1000);
      try {
        const exe = vscodeExecutablePath.split(/[/\\]/).pop();
        if (process.platform === "win32") {
          spawnSync("taskkill", ["/IM", exe, "/F", "/T"], { stdio: "ignore" });
        } else {
          spawnSync("pkill", ["-f", vscodeExecutablePath], { stdio: "ignore" });
        }
      } catch {
        // Best effort — the rejection below is what matters.
      }
      reject(new Error(`launch exceeded ${seconds}s budget (killed): ${label}`));
    }, LAUNCH_TIMEOUT_MS);
  });
  try {
    return await Promise.race([promise, budget]);
  } finally {
    clearTimeout(timer);
  }
}

async function runOne({ workspaceName, extension, resultsDir }) {
  const workspacePath = join(e2eRoot, workspaceName);
  if (!existsSync(workspacePath)) {
    console.warn(`Skip missing workspace: ${workspacePath}`);
    return null;
  }
  if (!existsSync(join(workspacePath, "e2e-probe.json"))) {
    console.warn(`Skip workspace without e2e-probe.json: ${workspacePath}`);
    return null;
  }

  const { runTests, downloadAndUnzipVSCode } = await import("@vscode/test-electron");

  const resultFile = join(
    resultsDir,
    `${workspaceName}__${extension.label.replace(/[^\w.-]+/g, "_")}.json`,
  );

  // Isolate extensions dir per subject so only one Vue LS is active
  const extDir = join(
    os.tmpdir(),
    `vue-bench-e2e-exts-${extension.label.replace(/\W+/g, "_")}`,
  );
  rmSync(extDir, { recursive: true, force: true });
  mkdirSync(extDir, { recursive: true });

  const vscodeExecutablePath = await downloadAndUnzipVSCode("stable");

  let subject = extension;
  let developmentPath = join(__dirname, "stub-extension");
  try {
    const ensured = ensureSubjectExtension({
      vscodeExecutablePath,
      extDir,
      extension,
    });
    subject = ensured.extension;
    // Load the subject as the development extension so it is guaranteed active.
    // (Relying only on --extensions-dir under test-electron is unreliable.)
    developmentPath = ensured.developmentPath;
  } catch (e) {
    console.error(`  INSTALL FAILED: ${e.message}`);
    writeFileSync(
      resultFile,
      `${JSON.stringify(
        {
          label: extension.label,
          extensionId: extension.id,
          workspace: workspacePath,
          kind: workspaceName,
          status: "error",
          error: e.message,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
    return resultFile;
  }

  const launchArgs = [
    workspacePath,
    "--disable-workspace-trust",
    "--skip-welcome",
    "--skip-release-notes",
  ];

  console.log(`\n→ E2E ${subject.label} × ${workspaceName}`);
  console.log(`  workspace: ${workspacePath}`);
  console.log(`  extension: ${subject.id}`);
  console.log(`  developmentPath: ${developmentPath}`);
  console.log(`  results:   ${resultFile}`);

  try {
    // BOUNDED. `runTests()` has no timeout of its own, so a launch that wedges
    // — an extension that never activates, a language server that never answers
    // — blocks this loop forever and the only thing that ends it is the CI job
    // ceiling. That is the entire reason the job was allowed 90 minutes.
    //
    // A per-launch budget turns a hang into ONE failed row (recorded below with
    // its reason) instead of a dead job, which is what makes a tight job ceiling
    // safe. Identical for every subject: whichever extension needs the time pays
    // for it, and none gets a larger allowance than the others.
    await withLaunchTimeout(
      runTests({
        vscodeExecutablePath,
        extensionDevelopmentPath: developmentPath,
        extensionTestsPath: join(__dirname, "suite", "index.cjs"),
        launchArgs,
        extensionTestsEnv: {
          E2E_WORKSPACE: workspacePath,
          E2E_EXTENSION: subject.id.endsWith(".local-vsix") ? "" : subject.id,
          E2E_LABEL: subject.label,
          E2E_RESULTS: resultFile,
        },
      }),
      `${workspaceName} · ${subject.label}`,
      vscodeExecutablePath,
    );
  } catch (e) {
    console.error(`  FAILED: ${e.message}`);
    writeFileSync(
      resultFile,
      `${JSON.stringify(
        {
          label: subject.label,
          extensionId: subject.id,
          workspace: workspacePath,
          kind: workspaceName,
          status: "error",
          error: e.message,
          timestamp: new Date().toISOString(),
        },
        null,
        2,
      )}\n`,
    );
    return resultFile;
  }

  return resultFile;
}

function renderMarkdown(resultFiles) {
  const rows = [];
  for (const f of resultFiles) {
    if (!f || !existsSync(f)) continue;
    try {
      const j = JSON.parse(readFileSync(f, "utf8"));
      rows.push(j);
    } catch {
      // ignore
    }
  }

  const lines = [];
  lines.push("## VS Code E2E results");
  lines.push("");
  lines.push(
    "Headless `@vscode/test-electron` runs. Primary metric: **hover cold** after open. Sorted within each workspace.",
  );
  lines.push("");
  lines.push(
    "Setup: same VS Code stable build; isolated `--extensions-dir` per subject; only that Vue extension installed.",
  );
  lines.push("");

  const byWs = new Map();
  for (const r of rows) {
    const k = r.kind || r.workspace || "?";
    if (!byWs.has(k)) byWs.set(k, []);
    byWs.get(k).push(r);
  }

  for (const [ws, list] of byWs) {
    lines.push(`### Workspace: ${ws}`);
    lines.push("");
    lines.push(
      "| Extension | Status | Activate | Open | Diag wait | Hover cold | Hover warm | Completion | Definition |",
    );
    lines.push("| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |");
    const ok = list
      .filter((r) => r.status !== "error" && r.phases)
      .sort((a, b) => (a.primaryMs ?? 1e12) - (b.primaryMs ?? 1e12));
    const bad = list.filter((r) => r.status === "error" || !r.phases);
    const fmt = (ms) =>
      ms == null || !Number.isFinite(ms)
        ? "n/a"
        : ms >= 1000
          ? `${(ms / 1000).toFixed(2)} s`
          : `${ms.toFixed(0)} ms`;
    for (const r of [...ok, ...bad]) {
      if (r.status === "error") {
        lines.push(`| ${r.label} | error | n/a | n/a | n/a | n/a | n/a | n/a | n/a |`);
        continue;
      }
      const p = r.phases || {};
      lines.push(
        `| ${r.label} | ok | ${fmt(p.activateMs)} | ${fmt(p.openDocumentMs)} | ${fmt(p.diagnosticsWaitMs)} | ${fmt(p.hoverColdMs)} | ${fmt(p.hoverWarmMedianMs)} | ${fmt(p.completionMs)} | ${fmt(p.definitionMs)} |`,
      );
    }
    lines.push("");
  }

  lines.push("<details><summary>Methodology</summary>");
  lines.push("");
  lines.push("- VS Code launched headless via `@vscode/test-electron` (stable channel).");
  lines.push("- One subject extension per run in an isolated extensions directory.");
  lines.push(
    "- Workspaces: regular (single app), monorepo (shared package + app), optional real Nuxt UI clone.",
  );
  lines.push(
    "- Primary ranking metric: first `vscode.executeHoverProvider` after open (hover cold).",
  );
  lines.push(
    "- Diagnostics wait is time-to-first-publish or timeout — not identity of diagnostics.",
  );
  lines.push("- Marketplace defaults: Vue.volar, ubugeeei.vize, verter.verter-vscode.");
  lines.push("- typescript-native-bridge is not an extension under test here.");
  lines.push("");
  lines.push("</details>");
  lines.push("");
  return lines.join("\n");
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/e2e-vscode/run.mjs [options]

Options:
  --workspaces regular,monorepo,nuxt-ui
  --extensions id=Label,id2=Label2   (override full matrix)
  --volar-extension  <id>            (default: Vue.volar)
  --vize-extension   <id>            (default: ubugeeei.vize)
  --verter-extension <id>            (default: verter.verter-vscode)
  --verter-vsix <path-to.vsix>       (replaces marketplace Verter)
  --with-setup
  --with-setup-nuxt-ui
  --nuxt-ui-ref <tag|sha>
`);
    process.exit(0);
  }

  ensureWorkspaces(args);
  mkdirSync(resultsRoot, { recursive: true });

  const workspaces = args.workspaces
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const extensions = buildExtensionList(args);
  if (extensions.length === 0) {
    console.error("No extensions configured");
    process.exit(1);
  }

  console.log("Workspaces:", workspaces.join(", "));
  console.log("Extensions:", extensions.map((e) => e.label).join(", "));

  const resultFiles = [];
  for (const ws of workspaces) {
    for (const ext of extensions) {
      const f = await runOne({ workspaceName: ws, extension: ext, resultsDir: resultsRoot });
      if (f) resultFiles.push(f);
    }
  }

  const md = renderMarkdown(resultFiles);
  const mdPath = join(resultsRoot, "summary.md");
  writeFileSync(mdPath, md);
  console.log("\n" + md);
  console.log(`Wrote ${mdPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
