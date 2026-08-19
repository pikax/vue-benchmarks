/**
 * LSP confirmation plants — protocol answers, not latency.
 *
 * One small workspace, one session per server:
 *   hover-template-binding      hover {{ greeting }} mentions a type
 *   definition-component        go-to-definition on <Child /> lands in Child.vue
 *   diagnostics-template        publishDiagnostics (or pull) names plantedBadProp
 *   diagnostics-clear-after-fix didChange to App.fixed.vue clears that plant
 *
 * Missing server binary → skip, same as typecheck. Bootstrap failure → skip.
 */
import { mkdirSync, readFileSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSuite } from "../lib/harness.mjs";
import { rootDir } from "../lib/run-cli.mjs";
import { LspClient, pathToFileUri } from "../../../scripts/lib/lsp-client.mjs";
import {
  resolveTsdk,
  resolveVerterLsp,
  resolveVizeLsp,
  resolveVolarServer,
} from "../../../scripts/lib/surfaces/lsp.mjs";
import { attachVolarHybridBridge } from "../../../scripts/lib/tsserver-bridge.mjs";
import { withTsgoEnv } from "../../../scripts/lib/tsgo.mjs";
import { contentText, mergeHover, removeWorkspace } from "../../../scripts/lib/ide-ops/context.mjs";
import {
  mergeLocations,
  toLocations,
  uriMatchesPath,
} from "../../../scripts/lib/ide-ops/suites/navigation.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "../fixtures/lsp");
const workRoot = join(rootDir, "work", "confirm-lsp");

const CASES = [
  "hover-template-binding",
  "definition-component",
  "diagnostics-template",
  "diagnostics-clear-after-fix",
];

const BINDING = "greeting";
const BINDING_VALUE = "confirm-lsp";
const PLANTED_PROP = "plantedBadProp";

const INIT_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 15_000;
const DIAG_WAIT_MS = 20_000;
const HOVER_ATTEMPTS = 6;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function positionOf(source, needle, occurrence = 1) {
  const lines = source.split(/\r?\n/);
  let seen = 0;
  for (let i = 0; i < lines.length; i++) {
    let from = 0;
    while (true) {
      const idx = lines[i].indexOf(needle, from);
      if (idx === -1) break;
      seen += 1;
      if (seen === occurrence) return { line: i, character: idx };
      from = idx + 1;
    }
  }
  throw new Error(`Could not locate ${JSON.stringify(needle)} in fixture`);
}

function templateBindingProbe(source, symbol) {
  const lines = source.split(/\r?\n/);
  const re = new RegExp(`\\{\\{\\s*${symbol}\\b`);
  for (let i = 0; i < lines.length; i++) {
    if (!re.test(lines[i])) continue;
    const idx = lines[i].indexOf(symbol, lines[i].indexOf("{{"));
    if (idx !== -1) return { line: i, character: idx };
  }
  throw new Error(`Could not locate {{ ${symbol} }} in fixture`);
}

function hoverMentionsType(text) {
  if (!text) return false;
  if (/\bstring\b/i.test(text) || /\bnumber\b/i.test(text)) return true;
  return new RegExp(`['"]${BINDING_VALUE}['"]`).test(text);
}

function diagnosticText(d) {
  if (!d || typeof d !== "object") return "";
  const bits = [d.message, d.source, d.code];
  if (d.codeDescription?.href) bits.push(d.codeDescription.href);
  for (const rel of d.relatedInformation ?? []) {
    if (rel?.message) bits.push(rel.message);
  }
  return bits.filter((x) => x != null && x !== "").join(" ");
}

function mentionsPlant(diags) {
  return (Array.isArray(diags) ? diags : []).some((d) =>
    diagnosticText(d).includes(PLANTED_PROP),
  );
}

function sampleDiags(diags) {
  return (Array.isArray(diags) ? diags : [])
    .map((d) => diagnosticText(d).replace(/\s+/g, " ").trim().slice(0, 160))
    .filter(Boolean)
    .slice(0, 4)
    .join(" | ");
}

function pullItems(report) {
  if (!report || typeof report !== "object") return [];
  if (Array.isArray(report.items)) return report.items;
  if (Array.isArray(report)) return report;
  return [];
}

function prepareWorkspace() {
  removeWorkspace(workRoot);
  mkdirSync(workRoot, { recursive: true });

  const appSource = readFileSync(join(fixturesDir, "App.vue"), "utf8");
  const fixedSource = readFileSync(join(fixturesDir, "App.fixed.vue"), "utf8");
  const childSource = readFileSync(join(fixturesDir, "Child.vue"), "utf8");
  writeFileSync(join(workRoot, "App.vue"), appSource);
  writeFileSync(join(workRoot, "Child.vue"), childSource);

  const vueDir = join(rootDir, "node_modules", "vue").replace(/\\/g, "/");
  writeFileSync(
    join(workRoot, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          jsx: "preserve",
          noEmit: true,
          skipLibCheck: true,
          lib: ["ESNext", "DOM"],
          types: [],
          plugins: [{ name: "@vue/typescript-plugin" }],
          paths: {
            vue: [vueDir],
            "vue/*": [`${vueDir}/*`],
          },
        },
        vueCompilerOptions: { target: 3.5, strictTemplates: true },
        include: ["**/*.vue", "**/*.ts", "env.d.ts"],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(workRoot, "env.d.ts"),
    `declare module '*.vue' {\n  import type { DefineComponent } from 'vue'\n  const c: DefineComponent<{}, {}, any>\n  export default c\n}\n`,
  );
  writeFileSync(
    join(workRoot, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name: "confirm-lsp" }, null, 2)}\n`,
  );
  writeFileSync(
    join(workRoot, "vize.config.json"),
    `${JSON.stringify(
      {
        languageServer: {
          enabled: true,
          corsa: true,
          tsgo: true,
          typecheck: true,
          editor: true,
          hover: true,
          lint: true,
          definition: true,
        },
        typeChecker: { enabled: true, strict: true, checkTemplateBindings: true },
      },
      null,
      2,
    )}\n`,
  );

  try {
    symlinkSync(
      join(rootDir, "node_modules"),
      join(workRoot, "node_modules"),
      process.platform === "win32" ? "junction" : "dir",
    );
  } catch {
    // Resolution may still walk up to the repo root / use compilerOptions.paths.
  }

  const childTag = positionOf(appSource, "<Child", 1);
  return {
    dir: workRoot,
    appFile: join(workRoot, "App.vue"),
    childFile: join(workRoot, "Child.vue"),
    appSource,
    fixedSource,
    childSource,
    hoverProbe: templateBindingProbe(appSource, BINDING),
    componentProbe: { line: childTag.line, character: childTag.character + 1 },
  };
}

function resolveServers() {
  const tsdk = resolveTsdk();
  const out = [];

  const volar = resolveVolarServer();
  out.push(
    volar
      ? {
          id: "volar",
          available: true,
          command: volar.command,
          args: volar.args,
          shell: false,
          hybrid: true,
          tsdk,
          env: {},
          initializationOptions: { typescript: { tsdk } },
        }
      : { id: "volar", available: false, unavailable: "@vue/language-server not installed" },
  );

  const vize = resolveVizeLsp();
  out.push(
    vize
      ? {
          id: "vize",
          available: true,
          command: vize.command,
          args: vize.args,
          shell: vize.shell ?? false,
          hybrid: false,
          env: {},
          // Flat keys — Vize ignores a `languageServer: {…}` wrapper.
          initializationOptions: { lint: true, typecheck: true, editor: true, ecosystem: true },
        }
      : { id: "vize", available: false, unavailable: "vize binary not found" },
  );

  const verter = resolveVerterLsp();
  out.push(
    verter
      ? {
          id: "verter",
          available: true,
          command: verter.command,
          args: [...(verter.args ?? [])],
          shell: verter.shell ?? false,
          hybrid: false,
          env: withTsgoEnv({}, rootDir),
          initializationOptions: {},
        }
      : { id: "verter", available: false, unavailable: "verter-lsp not installed" },
  );

  return out;
}

function createDiagStore(appFile) {
  const latest = new Map();

  const onPublish = (half, params) => {
    if (!params?.uri || !uriMatchesPath(params.uri, appFile)) return;
    latest.set(half, Array.isArray(params.diagnostics) ? params.diagnostics : []);
  };

  const ingestPull = (half, report) => {
    const items = pullItems(report);
    // An "unchanged" pull has no items — keep whatever push already stored.
    if (report?.kind === "unchanged") return;
    latest.set(half, items);
  };

  const merged = () => {
    const out = [];
    for (const list of latest.values()) out.push(...list);
    return out;
  };

  return { onPublish, ingestPull, merged, latest };
}

async function openSession(server, ws) {
  const rootUri = pathToFileUri(ws.dir);
  const appUri = pathToFileUri(ws.appFile);
  const childUri = pathToFileUri(ws.childFile);
  const args =
    server.id === "verter" ? [...server.args, ws.dir] : server.args;

  const client = new LspClient(server.id, server.command, args, {
    cwd: ws.dir,
    shell: server.shell,
    env: server.env,
    configuration: {
      typescript: { tsdk: server.tsdk },
      vue: {},
      volar: {},
      workspaceFolders: [{ uri: rootUri, name: "confirm-lsp" }],
    },
  });

  const diags = createDiagStore(ws.appFile);
  client.on("notification", (method, params) => {
    if (method === "textDocument/publishDiagnostics") diags.onPublish("server", params);
  });

  let hybrid = null;
  const close = async () => {
    try {
      await client.shutdown();
    } catch {
      // already gone
    }
    try {
      await hybrid?.close?.();
    } catch {
      // already gone
    }
  };

  try {
    if (server.hybrid) {
      hybrid = await attachVolarHybridBridge(client, {
        workspaceDir: ws.dir,
        rootDir,
        tsdkDir: server.tsdk,
        initTimeoutMs: INIT_TIMEOUT_MS,
      });
      hybrid.onDiagnostics((params) => diags.onPublish("tsserver", params));
    }

    await client.initialize(rootUri, {
      initializationOptions: server.initializationOptions,
      timeoutMs: INIT_TIMEOUT_MS,
    });

    const ask = async (method, params, timeoutMs = REQUEST_TIMEOUT_MS, merge) => {
      if (!hybrid) return client.sendRequest(method, params, timeoutMs);
      const settled = await Promise.allSettled([
        client.sendRequest(method, params, timeoutMs),
        hybrid.request(method, params, timeoutMs),
      ]);
      if (settled.every((s) => s.status === "rejected")) throw settled[0].reason;
      const [a, b] = settled.map((s) => (s.status === "fulfilled" ? s.value : null));
      if (merge) return merge(a, b);
      return b ?? a;
    };

    const openDoc = (uri, text, languageId = "vue", version = 1) => {
      const textDocument = { uri, languageId, version, text };
      client.sendNotification("textDocument/didOpen", { textDocument });
      if (hybrid) hybrid.openDocument(textDocument);
    };

    const changeDoc = (uri, text, version) => {
      const params = {
        textDocument: { uri, version },
        contentChanges: [{ text }],
      };
      client.sendNotification("textDocument/didChange", params);
      if (hybrid) hybrid.changeDocument(uri, text, version);
    };

    openDoc(appUri, ws.appSource);
    openDoc(childUri, ws.childSource);
    await sleep(50);

    return { client, hybrid, ask, changeDoc, appUri, childUri, diags, close };
  } catch (error) {
    await close();
    throw error;
  }
}

async function hoverWithRetry(ask, uri, position) {
  let lastErr = null;
  for (let attempt = 0; attempt < HOVER_ATTEMPTS; attempt++) {
    try {
      return await ask(
        "textDocument/hover",
        { textDocument: { uri }, position },
        REQUEST_TIMEOUT_MS,
        mergeHover,
      );
    } catch (error) {
      lastErr = error;
      await sleep(200 * (attempt + 1));
    }
  }
  throw lastErr ?? new Error("hover failed");
}

async function waitForPlant(session, { wantPresent, timeoutMs }) {
  const deadline = performance.now() + timeoutMs;
  let last = session.diags.merged();
  while (performance.now() < deadline) {
    last = session.diags.merged();
    if (mentionsPlant(last) === wantPresent) return last;
    try {
      const pulled = await session.ask(
        "textDocument/diagnostic",
        { textDocument: { uri: session.appUri } },
        Math.min(4_000, Math.max(500, deadline - performance.now())),
      );
      session.diags.ingestPull("pull", pulled);
      last = session.diags.merged();
      if (mentionsPlant(last) === wantPresent) return last;
    } catch {
      // Pull is optional — many servers only push.
    }
    await sleep(150);
  }
  return last;
}

function record(suite, caseId, tool, ok, message, detail) {
  if (ok) suite.pass(caseId, tool, message, detail);
  else suite.fail(caseId, tool, message, detail);
}

async function runServerCases(suite, server, ws) {
  const t0 = performance.now();
  let session;
  try {
    session = await openSession(server, ws);
  } catch (error) {
    const message = `tool bootstrap/runtime failure: ${(error?.message || String(error)).slice(0, 200)}`;
    for (const caseId of CASES) suite.skip(caseId, server.id, message);
    return;
  }

  try {
    // --- hover-template-binding ---
    try {
      const hover = await hoverWithRetry(session.ask, session.appUri, ws.hoverProbe);
      const text = contentText(hover);
      record(
        suite,
        "hover-template-binding",
        server.id,
        hoverMentionsType(text),
        hoverMentionsType(text)
          ? `template hover mentions a type (${text.replace(/\s+/g, " ").trim().slice(0, 120)})`
          : text
            ? `template hover has no type (string/number): ${text.replace(/\s+/g, " ").trim().slice(0, 160)}`
            : "empty hover payload at {{ greeting }}",
        { snippet: text.slice(0, 400), ms: Number((performance.now() - t0).toFixed(1)) },
      );
    } catch (error) {
      suite.fail("hover-template-binding", server.id, `hover request failed: ${error.message}`);
    }

    // --- definition-component ---
    try {
      const result = await session.ask(
        "textDocument/definition",
        { textDocument: { uri: session.appUri }, position: ws.componentProbe },
        REQUEST_TIMEOUT_MS,
        mergeLocations,
      );
      const locs = toLocations(result);
      const hit = locs.some((l) => uriMatchesPath(l.uri, ws.childFile));
      const seen = [...new Set(locs.map((l) => l.uri.split("/").pop()))].join(", ");
      record(
        suite,
        "definition-component",
        server.id,
        hit,
        hit
          ? `definition landed in Child.vue (${locs.length} location${locs.length === 1 ? "" : "s"})`
          : locs.length
            ? `definition resolved to ${seen} — expected Child.vue`
            : "definition returned no location",
        { snippet: JSON.stringify(locs).slice(0, 400) },
      );
    } catch (error) {
      suite.fail("definition-component", server.id, `definition request failed: ${error.message}`);
    }

    // --- diagnostics-template ---
    const dirty = await waitForPlant(session, { wantPresent: true, timeoutMs: DIAG_WAIT_MS });
    const sawPlant = mentionsPlant(dirty);
    record(
      suite,
      "diagnostics-template",
      server.id,
      sawPlant,
      sawPlant
        ? `publishDiagnostics names ${PLANTED_PROP}`
        : `no diagnostic mentioning ${PLANTED_PROP} within ${DIAG_WAIT_MS}ms` +
            (sampleDiags(dirty) ? ` — saw: ${sampleDiags(dirty)}` : " — no diagnostics published"),
      { snippet: sampleDiags(dirty) },
    );

    // --- diagnostics-clear-after-fix ---
    session.changeDoc(session.appUri, ws.fixedSource, 2);
    const cleared = await waitForPlant(session, { wantPresent: false, timeoutMs: DIAG_WAIT_MS });
    const stillPlanted = mentionsPlant(cleared);
    const clearOk = sawPlant && !stillPlanted;
    record(
      suite,
      "diagnostics-clear-after-fix",
      server.id,
      clearOk,
      !sawPlant
        ? `cannot confirm clear: planted ${PLANTED_PROP} never appeared`
        : stillPlanted
          ? `${PLANTED_PROP} still present after fix — ${sampleDiags(cleared)}`
          : `planted ${PLANTED_PROP} diagnostic cleared after didChange`,
      { snippet: sampleDiags(cleared) },
    );
  } finally {
    await session.close();
  }
}

export async function runLspConfirmSuite() {
  const suite = createSuite("lsp");
  const ws = prepareWorkspace();
  const servers = resolveServers();

  for (const server of servers) {
    if (!server.available) {
      for (const caseId of CASES) suite.skip(caseId, server.id, server.unavailable);
      continue;
    }
    await runServerCases(suite, server, ws);
  }

  return suite.results;
}
