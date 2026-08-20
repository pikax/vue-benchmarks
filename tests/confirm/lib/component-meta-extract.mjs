/**
 * Extractors that normalize each tool's component-meta surface into a common shape
 * for correctness comparison.
 *
 * Normalized:
 *   {
 *     props:   [{ name, type?, required?, hasDefault?, global? }],
 *     events:  [{ name, type? }],
 *     slots:   [{ name, type? }],
 *     exposed: [{ name, type? }],
 *     source:  'vue-component-meta' | 'verter-component-meta' | 'vize-declaration',
 *   }
 *
 * Notes:
 * - vue-component-meta: first-class props/events/slots/exposed
 * - @verter/component-meta: first-class props/events/slots/exposed via the
 *   package's own session API (openComponentMetaSession → getComponentMeta)
 * - Vize: no dedicated meta API; generateDeclaration() output is parsed and
 *   labeled as declaration-derived
 *
 * Every tool is driven through its own published entry point, on the same
 * prepared work dir, with no hand-decoding of any tool's internal payload.
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function loadOptional(name) {
  try {
    return { mod: require(require.resolve(name, { paths: [rootDir] })) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * ESM-only packages cannot be `require`d on every Node the suite runs on.
 * Resolve with CJS semantics (honours `exports`), then import the resolved
 * file, so availability detection and loading both stay accurate.
 */
async function loadOptionalEsm(name) {
  try {
    const entry = require.resolve(name, { paths: [rootDir] });
    return { mod: await import(pathToFileURL(entry).href) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * `@verter/component-meta` pools its native runtime process-globally, so the
 * module is loaded once and torn down once (see `shutdownMetaRuntimes`).
 */
let verterMetaModule = null;
function loadVerterComponentMeta() {
  if (!verterMetaModule) verterMetaModule = loadOptionalEsm("@verter/component-meta");
  return verterMetaModule;
}

/**
 * Stop every pooled Verter meta engine. Call once after a run: the runtime is
 * process-global, and a leaked engine would keep native memory (and its
 * sweep timer) alive past the suite that created it.
 */
export async function shutdownMetaRuntimes() {
  if (!verterMetaModule) return;
  const { mod } = await verterMetaModule;
  try {
    mod?.shutdownMetaRuntime?.();
  } catch {
    /* ignore */
  }
}

/** Strip Vue runtime global props from comparison. */
const GLOBAL_PROP_NAMES = new Set(["key", "ref", "ref_for", "ref_key", "class", "style"]);

function isGlobalPropName(name) {
  if (GLOBAL_PROP_NAMES.has(name)) return true;
  if (name.startsWith("onVue:")) return true;
  if (name.startsWith("onVnode")) return true;
  return false;
}

/**
 * Normalize the Volar `ComponentMeta` shape — `{ props, events, slots, exposed }`
 * of `{ name, type, required, default, global }` — into the harness shape.
 *
 * Both `vue-component-meta` and `@verter/component-meta` publish this shape, so
 * one normalizer serves both and neither gets tool-specific handling.
 */
export function normalizeVolarComponentMeta(raw, source) {
  const props = (raw.props || [])
    .filter((p) => !p.global && !isGlobalPropName(p.name))
    .map((p) => ({
      name: p.name,
      type: String(p.type ?? ""),
      required: Boolean(p.required),
      hasDefault: p.default !== undefined && p.default !== null && p.default !== "",
      default: p.default,
      global: false,
    }));

  return {
    props,
    events: (raw.events || []).map((e) => ({
      name: e.name,
      type: String(e.type ?? ""),
    })),
    slots: (raw.slots || []).map((s) => ({
      name: s.name,
      type: String(s.type ?? ""),
    })),
    exposed: (raw.exposed || []).map((e) => ({
      name: e.name,
      type: String(e.type ?? ""),
    })),
    source,
  };
}

/**
 * Extract `export type Name = { ... }` body with nested-brace awareness.
 * Tolerates a generic parameter list on the alias (`export type Props<T> = {`).
 *
 * The parameter list is skipped by BALANCED scanning rather than by the
 * `<[^=]*>` character class this used to use. A generic <script setup>
 * component compiles to a declaration whose parameter list carries both a
 * brace-bearing constraint and a DEFAULT — `export type Slots<TRow extends
 * { id: number } = any> = { ... }` — and an `=`-excluding class cannot match
 * across that `= any`, so the whole alias silently failed to match and the
 * section came back empty. That turned a HARNESS parse miss into what looked
 * like a tool that reported no props/slots at all, which would then have been
 * recorded against the tool in known-failures.json. The declaration is the
 * tool's answer; only a real gap in it may be scored as one.
 */
function extractExportTypeBody(text, typeName) {
  const head = new RegExp(`export\\s+type\\s+${typeName}(?![\\w$])`);
  const m = head.exec(text);
  if (!m) return null;
  let i = m.index + m[0].length;

  const skipSpace = () => {
    while (i < text.length && /\s/.test(text[i])) i++;
  };

  skipSpace();
  if (text[i] === "<") {
    let angle = 0;
    while (i < text.length) {
      // An arrow inside a default type (`<T = () => void>`) is not a closing
      // bracket; consuming it as one would end the parameter list early.
      if (text[i] === "=" && text[i + 1] === ">") {
        i += 2;
        continue;
      }
      if (text[i] === "<") angle++;
      else if (text[i] === ">") {
        angle--;
        if (angle === 0) {
          i++;
          break;
        }
      }
      i++;
    }
  }

  skipSpace();
  if (text[i] !== "=") return null;
  i++;
  skipSpace();
  // A declaration that aliases a NAMED type (`export type Props = FieldProps;`)
  // has no inline body to enumerate; returning null is the honest answer and
  // the caller reports the section as unextracted.
  if (text[i] !== "{") return null;
  i++;

  let depth = 1;
  const start = i;
  while (i < text.length && depth > 0) {
    const ch = text[i++];
    if (ch === "{") depth++;
    else if (ch === "}") depth--;
  }
  return text.slice(start, i - 1);
}

/**
 * A `.d.ts` emitter must emit parseable TypeScript. Returns the first few
 * syntax errors, or [] when the source parses (or TypeScript is unavailable).
 */
export function findDeclarationSyntaxErrors(code) {
  const ts = loadOptional("typescript");
  if (ts.error) return [];
  const sourceFile = ts.mod.createSourceFile(
    "declaration.d.ts",
    code,
    ts.mod.ScriptTarget.ESNext,
    true,
    ts.mod.ScriptKind.TS,
  );
  const diagnostics = sourceFile.parseDiagnostics || [];
  return diagnostics.slice(0, 3).map((d) => {
    const message = ts.mod.flattenDiagnosticMessageText(d.messageText, " ");
    const near = code.slice(Math.max(0, d.start - 40), d.start + 40).replace(/\s+/g, " ");
    return `${message} (near "${near.trim()}")`;
  });
}

/**
 * Parse Vize generateDeclaration code for Props / Emits / Slots type aliases.
 */
export function normalizeVizeDeclaration(code) {
  const text = typeof code === "string" ? code : code?.code || "";
  const props = [];
  const events = [];
  const slots = [];

  const propsBody = extractExportTypeBody(text, "Props");
  if (propsBody) {
    for (const line of propsBody.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][\w-]*)(\?)?\s*:\s*(.+?)\s*;?\s*$/);
      if (!m) continue;
      props.push({
        name: m[1],
        type: m[3].replace(/;?\s*$/, "").trim(),
        required: m[2] !== "?",
        hasDefault: undefined,
        global: false,
      });
    }
  }

  const emitsBody = extractExportTypeBody(text, "Emits");
  if (emitsBody) {
    for (const line of emitsBody.split(/\r?\n/)) {
      // Call-signature form: `(event: "save", id: number): void;`
      const call = line.match(
        /^\s*\(\s*[A-Za-z_]\w*\s*:\s*(?:'([^']+)'|"([^"]+)")\s*(?:,\s*(.*?))?\)\s*:\s*(.+?)\s*;?\s*$/,
      );
      if (call) {
        events.push({
          name: call[1] || call[2],
          type: (call[3] || "").trim(),
        });
        continue;
      }
      // Tuple/property form: `save: [id: number];`
      const m = line.match(/^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w:.-]*))\s*:\s*(.+?)\s*;?\s*$/);
      if (!m) continue;
      const name = m[1] || m[2] || m[3];
      events.push({
        name,
        type: m[4].replace(/;?\s*$/, "").trim(),
      });
    }
    // Overloaded event names collapse to one entry, widest payload wins
    const merged = new Map();
    for (const e of events.splice(0)) {
      const prev = merged.get(e.name);
      if (!prev || (e.type || "").length > (prev.type || "").length) merged.set(e.name, e);
    }
    events.push(...merged.values());
  }

  const slotsBody = extractExportTypeBody(text, "Slots");
  if (slotsBody) {
    // Split on top-level newlines; each slot is `name(...): ret`.
    //
    // The `\??` accepts the OPTIONAL-member form `empty?(): any;`, which
    // `defineSlots<{ empty?(): any }>()` compiles to. Without it the marker sat
    // between the name and the `(` and neither pattern matched, so a slot the
    // tool had emitted correctly was scored as missing — a harness miss wearing
    // a tool's name. Optionality itself is not scored for slots; only presence.
    for (const line of slotsBody.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][\w-]*)\s*\??\s*\((.*)\)\s*:\s*(.+?)\s*;?\s*$/);
      if (m) {
        slots.push({
          name: m[1],
          type: `(${m[2]}): ${m[3].replace(/;?\s*$/, "").trim()}`,
        });
        continue;
      }
      const m2 = line.match(/^\s*([A-Za-z_][\w-]*)\s*\??\s*\(/);
      if (m2) {
        slots.push({ name: m2[1], type: line.trim() });
      }
    }
  }

  // expose is not in generateDeclaration output currently
  return {
    props,
    events,
    slots,
    exposed: [],
    source: "vize-declaration",
  };
}

/**
 * List available meta tools with extract(path, source) → normalized meta.
 *
 * `prepare` / `extract` / `dispose` may be async; callers must await them.
 */
export async function getMetaTools({ workDir }) {
  const tools = [];

  const vueMeta = loadOptional("vue-component-meta");
  if (!vueMeta.error && typeof vueMeta.mod.createChecker === "function") {
    let checker = null;
    tools.push({
      id: "vue-component-meta",
      label: "vue-component-meta",
      capabilities: ["props", "events", "slots", "exposed", "required", "defaults", "types"],
      prepare() {
        const tsconfig = join(workDir, "tsconfig.json");
        checker = vueMeta.mod.createChecker(tsconfig, { forceUseTs: true });
      },
      extract(absPath) {
        const raw = checker.getComponentMeta(absPath);
        return normalizeVolarComponentMeta(raw, "vue-component-meta");
      },
      dispose() {
        checker = null;
      },
    });
  } else {
    tools.push({
      id: "vue-component-meta",
      label: "vue-component-meta",
      skip: vueMeta.error || "createChecker missing",
    });
  }

  // Driven through the package's own documented entry point — the same
  // `openComponentMetaSession(...)` → `getComponentMeta(file)` a consumer
  // writes — so the row measures the shipped API, not a decoding of its
  // internal transport.
  const verterMeta = await loadVerterComponentMeta();
  if (!verterMeta.error && typeof verterMeta.mod.openComponentMetaSession === "function") {
    const { openComponentMetaSession, evictComponentMetaSession } = verterMeta.mod;
    const sessionConfig = {
      root: workDir.replace(/\\/g, "/"),
      tsconfig: join(workDir, "tsconfig.json").replace(/\\/g, "/"),
    };
    let session = null;
    tools.push({
      id: "verter-component-meta",
      label: "@verter/component-meta",
      capabilities: ["props", "events", "slots", "exposed", "types", "required", "defaults"],
      async prepare() {
        session = await openComponentMetaSession(sessionConfig);
      },
      async extract(absPath, source) {
        const id = absPath.replace(/\\/g, "/");
        // The file is on disk in the work dir and resolves without this, but
        // the harness holds the exact bytes under test; the documented
        // overlay API pins the session to them so the row can never be
        // scored against a stale read.
        session.updateFile(id, source);
        const raw = await session.getComponentMeta(id);
        return normalizeVolarComponentMeta(raw, "verter-component-meta");
      },
      dispose() {
        try {
          session?.close();
        } catch {
          /* ignore */
        }
        // Engines are pooled per root+tsconfig. Each case gets its own work
        // dir, so without this every case would leave a live native engine
        // behind for the rest of the run.
        try {
          evictComponentMetaSession(sessionConfig);
        } catch {
          /* ignore */
        }
        session = null;
      },
    });
  } else {
    tools.push({
      id: "verter-component-meta",
      label: "@verter/component-meta",
      skip: verterMeta.error || "openComponentMetaSession missing",
    });
  }

  const vize = loadOptional("@vizejs/native");
  if (!vize.error && typeof vize.mod.generateDeclaration === "function") {
    tools.push({
      id: "vize-declaration-meta",
      label: "Vize generateDeclaration (parsed)",
      capabilities: ["props", "events", "slots", "types", "required"],
      // not exposed
      prepare() {},
      extract(_absPath, source) {
        const decl = vize.mod.generateDeclaration(source, {
          filename: "Component.vue",
        });
        const text = typeof decl === "string" ? decl : (decl?.code ?? "");
        const syntaxErrors = findDeclarationSyntaxErrors(text);
        if (syntaxErrors.length) {
          throw new Error(
            `generateDeclaration emitted unparseable TypeScript: ${syntaxErrors.join("; ")}`,
          );
        }
        return normalizeVizeDeclaration(text);
      },
      dispose() {},
    });
  } else {
    tools.push({
      id: "vize-declaration-meta",
      label: "Vize generateDeclaration",
      skip: vize.error || "generateDeclaration missing",
    });
  }

  return tools;
}

export { rootDir, isGlobalPropName };
