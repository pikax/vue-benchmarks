/**
 * LSP confirmation plants — protocol answers, not latency.
 *
 * One small workspace, one session per server:
 *   hover-template-binding      hover {{ greeting }} mentions a type
 *   definition-component        go-to-definition on <Child /> lands in Child.vue
 *   document-symbol-structure   documentSymbol on App.vue names the `greeting` binding
 *   completion-prop-template    completion inside <Child …> offers the epilogueText prop
 *   definition-prop-attr        definition on the :title attr lands on Child.vue's prop decl
 *   references-prop-template    references from the prop decl reach App.vue's template use
 *   rename-prop-template        rename of the prop returns edits in App.vue's TEMPLATE too
 *   diagnostics-template        publishDiagnostics (or pull) names the extra-prop plant
 *   diagnostics-clear-after-fix didChange to App.fixed.vue clears that plant
 *
 * The five middle cases fire BEFORE the didChange to App.fixed.vue, so every
 * probe position is computed against the original App.vue text. Rename edits
 * are INSPECTED, never applied — the document the diagnostics cases watch is
 * untouched.
 *
 * Missing server binary → skip, same as typecheck. Bootstrap failure → skip.
 * Vize with Corsa unreachable degrades type-backed answers; those cases skip
 * (same policy as hover) instead of failing on a downed backend.
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
import {
  contentText,
  mergeCompletions,
  mergeHover,
  removeWorkspace,
} from "../../../scripts/lib/ide-ops/context.mjs";
import {
  gateReferences,
  gateRename,
  mergeLocations,
  mergeWorkspaceEdits,
  normalizeUri,
  textInRange,
  toLocations,
  uriMatchesPath,
} from "../../../scripts/lib/ide-ops/suites/navigation.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixturesDir = join(__dirname, "../fixtures/lsp");
const workRoot = join(rootDir, "work", "confirm-lsp");

const CASES = [
  "hover-template-binding",
  "definition-component",
  "document-symbol-structure",
  "completion-prop-template",
  "definition-prop-attr",
  "references-prop-template",
  "rename-prop-template",
  "diagnostics-template",
  "diagnostics-clear-after-fix",
];

const BINDING = "greeting";
const BINDING_VALUE = "confirm-lsp";
/** Declared prop bound in App.vue's template (`:title="greeting"`). */
const PROP_NAME = "title";
/** Distinctive optional prop of Child.vue — the completion plant's answer.
 *  Deliberately NOT a standard HTML attribute, so global attribute data
 *  (`title`, `class`, …) cannot satisfy the gate by accident. */
const COMPLETION_PROP = "epilogueText";
/** Rename target. Edits are inspected in memory, never applied. */
const RENAME_NEW_NAME = "renamedTitle";
// Vue templates write extra attrs in kebab-case. CamelCase (`plantedBadProp`)
// trips vize's vue/attribute-hyphenation lint, whose message does not name the
// attribute, so the plant never matches even when the server is otherwise
// healthy. Volar/Verter still report the camelized TypeScript name.
const PLANTED_ATTR = "planted-bad-prop";
const PLANTED_PROP = "plantedBadProp";

const INIT_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 15_000;
const DIAG_WAIT_MS = 20_000;
/**
 * Readiness budget, shared by every server, as wall clock rather than a retry
 * count — the number that matters is how long a server is given, not how many
 * times it is asked.
 *
 * Measured on this workspace, time to the first non-empty answer:
 *
 *            4 CPUs            1 CPU
 *   volar     619ms            1373 / 4934 / 1457 ms
 *   vize      582ms            1181 / 1301 / 1289 ms
 *   verter    317ms             280 /  230 /  288 ms
 *
 * The suite used to allow 50ms. Every server needs 6-12x that on a healthy
 * box, and volar needed 4.9s once under contention — 100x. Nothing was wrong
 * with the servers; the budget was never large enough, and passing depended on
 * the first request's own round-trip absorbing the wait. 30s is ~6x the worst
 * figure above and matches INIT_TIMEOUT_MS, which is the other "how long may a
 * server take to come up" number in this file.
 *
 * Note which server was fastest to answer: the flake was reported against
 * verter, the one that becomes ready first. Any of the three could lose that
 * coin flip, which is what makes it the harness's problem and not a tool's.
 */
const READY_BUDGET_MS = 30_000;
const READY_BACKOFF_MS = (attempt) => Math.min(1_000, 200 * (attempt + 1));

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
  return (Array.isArray(diags) ? diags : []).some((d) => {
    const text = diagnosticText(d);
    return text.includes(PLANTED_PROP) || text.includes(PLANTED_ATTR);
  });
}

function typecheckUnavailable(diags) {
  return (Array.isArray(diags) ? diags : []).some((d) =>
    /type checking is unavailable/i.test(diagnosticText(d)),
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

/** Case/punctuation-insensitive identity, so `epilogue-text` matches `epilogueText`. */
function squash(s) {
  return String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** DocumentSymbol[] (nested) | SymbolInformation[] (flat) → every symbol name. */
function collectSymbolNames(list, out = []) {
  for (const s of Array.isArray(list) ? list : []) {
    if (!s || typeof s !== "object") continue;
    if (typeof s.name === "string") out.push(s.name);
    if (Array.isArray(s.children)) collectSymbolNames(s.children, out);
  }
  return out;
}

/** Union of documentSymbol answers from both halves of a hybrid server. */
function mergeSymbolLists(...results) {
  const out = [];
  for (const r of results) if (Array.isArray(r)) out.push(...r);
  return out.length ? out : null;
}

/** Every text an editor would match a CompletionItem by. Label may be a
 *  string or a CompletionItemLabel object per LSP 3.17. */
function completionLabelBits(item) {
  const bits = [];
  if (typeof item?.label === "string") bits.push(item.label);
  else if (typeof item?.label?.label === "string") bits.push(item.label.label);
  if (typeof item?.insertText === "string") bits.push(item.insertText);
  if (typeof item?.filterText === "string") bits.push(item.filterText);
  return bits;
}

function completionItemsOf(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result;
  if (Array.isArray(result.items)) return result.items;
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
    // Cursor in the attribute area of `<Child |:title=…` — before the colon,
    // empty prefix, i.e. where an editor invokes attribute completion.
    completionProbe: positionOf(appSource, `:${PROP_NAME}`, 1),
    // On the attribute NAME (`t` of `:title=`), past the v-bind colon.
    propAttrProbe: positionOf(appSource, `${PROP_NAME}="`, 1),
    // The prop declaration inside defineProps<{…}>() in Child.vue.
    propDeclProbe: positionOf(childSource, `${PROP_NAME}: string`, 1),
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
          // Recorded for the report, never awaited — see the readiness note on
          // hoverWithRetry. Volar and vize document no equivalent, and waiting
          // on this one would hand verter a different protocol than they get.
          readyNotifications: ["$/verter/ready"],
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
  // Attached BEFORE initialize: the notification can arrive during it.
  const tSession = performance.now();
  let readySignalMs = null;
  const readySet = new Set(server.readyNotifications ?? []);
  client.on("notification", (method, params) => {
    if (method === "textDocument/publishDiagnostics") diags.onPublish("server", params);
    if (readySignalMs == null && readySet.has(method)) readySignalMs = performance.now() - tSession;
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

    // Readiness gate for the WHOLE session, not just the case that happened to
    // run first. Every later case — definition, completion, references, rename,
    // diagnostics — has the same "answers nothing while loading" exposure; they
    // survived only because hover went first and absorbed the wait. Paid once,
    // here, on one code path with one budget for every server.
    const tReady = performance.now();
    const firstHover = await hoverWithRetry(ask, appUri, ws.hoverProbe);
    const readyMs = Number((performance.now() - tReady).toFixed(1));

    return {
      client,
      hybrid,
      ask,
      changeDoc,
      appUri,
      childUri,
      diags,
      close,
      firstHover,
      readyMs,
      // Observed, never awaited: only verter documents one, so waiting on
      // signals would hand it a different protocol than the others get.
      readySignalMs: readySignalMs == null ? null : Number(readySignalMs.toFixed(1)),
    };
  } catch (error) {
    await close();
    throw error;
  }
}

/**
 * Establish that the session can answer at all, before anything is scored.
 *
 * THE FLAKE THIS EXISTS FOR. `openSession` used to return 50ms after didOpen
 * and the first scored case asked immediately. LSP has no standard readiness
 * signal, and a server still loading its project answers a request with NOTHING
 * and raises no error — so "not yet" was recorded as "wrong answer". One
 * Benchmark run failed `hover-template-binding · verter — empty hover payload`
 * while definition, documentSymbol, completion, definition-prop-attr and both
 * diagnostics cases on that same session passed, and the Test workflow passed
 * on the identical commit. That is a race in the harness, not a defect in the
 * server: answering null while loading is protocol-legal, and a real editor
 * retries too.
 *
 * Readiness is established on CONTENT, through one code path every server
 * takes, with one budget for all of them — the same rule the timed LSP surface
 * and the ide-ops suites already follow, and for the same reason: exactly one
 * server documents a ready notification ($/verter/ready), so waiting on
 * signals would give that server a different protocol than the rest. The
 * notification is still observed, passively, because it is useful to report.
 *
 * What counts as an answer is deliberately narrow: ANY non-empty payload. Not
 * "a payload with a type" — waiting for that would launder a real "this server
 * has no type here" verdict into a pass, which is the one thing this suite
 * exists to catch. And a server that never answers is never skipped on that
 * basis: the budget expires, the empty payload is scored, and the failure is
 * then a finding rather than a coin flip.
 */
export async function hoverWithRetry(
  ask,
  uri,
  position,
  { budgetMs = READY_BUDGET_MS, maxAttempts = Infinity } = {},
) {
  const deadline = performance.now() + budgetMs;
  let lastErr = null;
  let lastHover = null;
  let answered = false;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const hover = await ask(
        "textDocument/hover",
        { textDocument: { uri }, position },
        REQUEST_TIMEOUT_MS,
        mergeHover,
      );
      if (contentText(hover).trim()) return hover;
      lastHover = hover;
      answered = true;
    } catch (error) {
      lastErr = error;
    }
    if (performance.now() >= deadline) break;
    await sleep(READY_BACKOFF_MS(attempt));
  }
  if (answered) return lastHover;
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
      // The readiness gate already asked this exact question and kept the
      // answer; asking again would only add a second, warmer sample and hide
      // how long the first one took.
      const hover = session.firstHover;
      const text = contentText(hover);
      const typed = hoverMentionsType(text);
      // Corsa-down is a degraded backend, not a hover-content bug. Linux CI
      // reaches Corsa and 0.350.2 now answers with a type; Windows often
      // publishes "Type checking is unavailable" and the generic binding prose.
      if (!typed) {
        const until = performance.now() + 2_000;
        while (
          performance.now() < until &&
          !typecheckUnavailable(session.diags.merged())
        ) {
          await sleep(100);
        }
      }
      if (!typed && typecheckUnavailable(session.diags.merged())) {
        suite.skip(
          "hover-template-binding",
          server.id,
          "type checking unavailable (Corsa not reachable) — hover has no TypeScript type",
        );
      } else {
        record(
          suite,
          "hover-template-binding",
          server.id,
          typed,
          typed
            ? `template hover mentions a type (${text.replace(/\s+/g, " ").trim().slice(0, 120)})`
            : text
              ? `template hover has no type (string/number): ${text.replace(/\s+/g, " ").trim().slice(0, 160)}`
              : `empty hover payload at {{ greeting }} after ${session.readyMs}ms of readiness retries`,
          {
            snippet: text.slice(0, 400),
            ms: Number((performance.now() - t0).toFixed(1)),
            readyMs: session.readyMs,
            readySignalMs: session.readySignalMs,
          },
        );
      }
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

    // Vize without Corsa has no type backend; a type-backed answer it cannot
    // give is a degraded-backend skip (same policy as hover), not a content bug.
    const corsaDown = () => typecheckUnavailable(session.diags.merged());
    const CORSA_SKIP = "type checking unavailable (Corsa not reachable) — type-backed answer cannot be confirmed";

    // --- document-symbol-structure ---
    // Syntactic outline: no type backend involved, so no Corsa guard.
    try {
      const result = await session.ask(
        "textDocument/documentSymbol",
        { textDocument: { uri: session.appUri } },
        REQUEST_TIMEOUT_MS,
        mergeSymbolLists,
      );
      const names = collectSymbolNames(result);
      const hit = names.some((n) => squash(n).includes(squash(BINDING)));
      const seen = [...new Set(names)].slice(0, 8).join(", ");
      record(
        suite,
        "document-symbol-structure",
        server.id,
        hit,
        hit
          ? `documentSymbol names the ${BINDING} binding (${names.length} symbols)`
          : names.length
            ? `documentSymbol never names ${BINDING} — saw: ${seen}`
            : "documentSymbol returned no symbols for the SFC",
        { snippet: seen || JSON.stringify(result ?? null).slice(0, 200) },
      );
    } catch (error) {
      suite.fail(
        "document-symbol-structure",
        server.id,
        `documentSymbol request failed: ${error.message}`,
      );
    }

    // --- completion-prop-template ---
    try {
      const result = await session.ask(
        "textDocument/completion",
        {
          textDocument: { uri: session.appUri },
          position: ws.completionProbe,
          context: { triggerKind: 1 },
        },
        REQUEST_TIMEOUT_MS,
        mergeCompletions,
      );
      const items = completionItemsOf(result);
      const matches = items.filter((i) =>
        completionLabelBits(i).some((b) => squash(b).includes(squash(COMPLETION_PROP))),
      );
      const hit = matches.length > 0;
      if (!hit && corsaDown()) {
        suite.skip("completion-prop-template", server.id, CORSA_SKIP);
      } else {
        const sampleLabels = items
          .slice(0, 8)
          .map((i) => completionLabelBits(i)[0] ?? "")
          .filter(Boolean)
          .join(", ");
        record(
          suite,
          "completion-prop-template",
          server.id,
          hit,
          hit
            ? `attribute completion offers ${COMPLETION_PROP} (${matches
                .slice(0, 2)
                .map((i) => completionLabelBits(i)[0])
                .join(", ")}; ${items.length} items)`
            : items.length
              ? `${items.length} completion items, none offering ${COMPLETION_PROP} — saw: ${sampleLabels}`
              : "completion returned no items inside the component tag",
          { snippet: sampleLabels || JSON.stringify(result ?? null).slice(0, 200) },
        );
      }
    } catch (error) {
      suite.fail(
        "completion-prop-template",
        server.id,
        `completion request failed: ${error.message}`,
      );
    }

    // --- definition-prop-attr ---
    try {
      const result = await session.ask(
        "textDocument/definition",
        { textDocument: { uri: session.appUri }, position: ws.propAttrProbe },
        REQUEST_TIMEOUT_MS,
        mergeLocations,
      );
      const locs = toLocations(result);
      const inChild = locs.filter((l) => uriMatchesPath(l.uri, ws.childFile));
      // A location in the REAL Child.vue must cover the prop identifier; a
      // generated twin (Child.vue.ts) has ranges in virtual code we cannot
      // check against the fixture, so the file-level hit stands for it.
      const exact = inChild.filter((l) => normalizeUri(l.uri) === normalizeUri(ws.childFile));
      const covered = exact.map((l) => textInRange(ws.childSource, l.range));
      const exactOk = exact.length
        ? covered.some((t) => squash(t).includes(squash(PROP_NAME)))
        : inChild.length > 0;
      const hit = inChild.length > 0 && exactOk;
      const seen = [...new Set(locs.map((l) => l.uri.split("/").pop()))].join(", ");
      if (!hit && corsaDown()) {
        suite.skip("definition-prop-attr", server.id, CORSA_SKIP);
      } else {
        record(
          suite,
          "definition-prop-attr",
          server.id,
          hit,
          hit
            ? `:${PROP_NAME} attr resolves to Child.vue prop declaration`
            : inChild.length
              ? `landed in Child.vue but range covers ${JSON.stringify(
                  covered[0] ?? "",
                )} — expected the ${PROP_NAME} declaration`
              : locs.length
                ? `definition resolved to ${seen} — expected Child.vue`
                : "definition on the prop attribute returned no location",
          { snippet: JSON.stringify(locs).slice(0, 400) },
        );
      }
    } catch (error) {
      suite.fail(
        "definition-prop-attr",
        server.id,
        `definition request failed: ${error.message}`,
      );
    }

    // --- references-prop-template ---
    try {
      const result = await session.ask(
        "textDocument/references",
        {
          textDocument: { uri: session.childUri },
          position: ws.propDeclProbe,
          context: { includeDeclaration: true },
        },
        REQUEST_TIMEOUT_MS,
        mergeLocations,
      );
      const gate = gateReferences(result, { declPath: ws.childFile, usePath: ws.appFile });
      if (!gate.valid && corsaDown()) {
        suite.skip("references-prop-template", server.id, CORSA_SKIP);
      } else {
        record(
          suite,
          "references-prop-template",
          server.id,
          gate.valid,
          gate.valid
            ? `references from the ${PROP_NAME} declaration reach App.vue's template`
            : gate.reason,
          { snippet: gate.sample?.slice(0, 400) },
        );
      }
    } catch (error) {
      suite.fail(
        "references-prop-template",
        server.id,
        `references request failed: ${error.message}`,
      );
    }

    // --- rename-prop-template ---
    // Edits are INSPECTED in memory, never applied: the open documents the
    // diagnostics cases watch are untouched.
    try {
      const result = await session.ask(
        "textDocument/rename",
        {
          textDocument: { uri: session.childUri },
          position: ws.propDeclProbe,
          newName: RENAME_NEW_NAME,
        },
        REQUEST_TIMEOUT_MS,
        mergeWorkspaceEdits,
      );
      const gate = gateRename(result, {
        templatePath: ws.appFile,
        declPath: ws.childFile,
        newName: RENAME_NEW_NAME,
      });
      if (!gate.valid && corsaDown()) {
        suite.skip("rename-prop-template", server.id, CORSA_SKIP);
      } else {
        record(
          suite,
          "rename-prop-template",
          server.id,
          gate.valid,
          gate.valid
            ? `rename of ${PROP_NAME} edits App.vue's template usage (${gate.sample?.slice(0, 120)})`
            : gate.reason,
          { snippet: gate.sample?.slice(0, 400) },
        );
      }
    } catch (error) {
      suite.fail("rename-prop-template", server.id, `rename request failed: ${error.message}`);
    }

    // --- diagnostics-template ---
    if (typecheckUnavailable(session.diags.merged())) {
      const why =
        "type checking unavailable (Corsa not reachable) — extra-prop plant cannot be confirmed";
      suite.skip("diagnostics-template", server.id, why);
      suite.skip("diagnostics-clear-after-fix", server.id, why);
      return;
    }
    const dirty = await waitForPlant(session, { wantPresent: true, timeoutMs: DIAG_WAIT_MS });
    const sawPlant = mentionsPlant(dirty);
    if (!sawPlant && typecheckUnavailable(dirty)) {
      const why =
        "type checking unavailable (Corsa not reachable) — extra-prop plant cannot be confirmed";
      suite.skip("diagnostics-template", server.id, why);
      suite.skip("diagnostics-clear-after-fix", server.id, why);
      return;
    }
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
