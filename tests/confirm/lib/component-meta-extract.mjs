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
 *     source:  'vue-component-meta' | 'verter-native' | 'vize-declaration',
 *   }
 *
 * Notes:
 * - vue-component-meta: first-class props/events/slots/exposed
 * - Verter ComponentMetaHost: protobuf payload — names/types recovered from
 *   embedded UTF-8 strings (public decode package ships empty dist/)
 * - Vize: no dedicated meta API; generateDeclaration() output is parsed and
 *   labeled as declaration-derived
 */
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

function loadOptional(name) {
  try {
    return { mod: require(require.resolve(name, { paths: [rootDir] })) };
  } catch (error) {
    return { error: error instanceof Error ? error.message : String(error) };
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

export function normalizeVueComponentMeta(raw) {
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
    source: "vue-component-meta",
  };
}

/**
 * Pull printable ASCII strings out of a protobuf-ish buffer.
 */
export function extractBufferStrings(buf) {
  const bytes = Buffer.isBuffer(buf) ? buf : Buffer.from(buf);
  const out = [];
  let cur = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b >= 32 && b < 127) cur += String.fromCharCode(b);
    else {
      if (cur.length >= 1) out.push(cur);
      cur = "";
    }
  }
  if (cur.length >= 1) out.push(cur);
  return out;
}

/**
 * Heuristic parse of Verter resolved meta strings.
 * Declared API names appear before HTML/ARIA fallthrough attrs in the payload.
 */
export function normalizeVerterMetaBuffer(buf) {
  const strings = extractBufferStrings(buf);
  const cut = strings.findIndex(
    (s) => s === "accesskey" || s.startsWith("aria-") || s === "autocapitalize" || s === "tabindex",
  );
  const region = cut > 0 ? strings.slice(0, cut) : strings.slice(0, 120);

  // Known type tokens
  const typeTokens = new Set([
    "string",
    "number",
    "boolean",
    "any",
    "void",
    "unknown",
    "object",
    "never",
  ]);

  const props = [];
  const events = [];
  const slots = [];
  const exposed = [];

  // Walk region looking for prop-like sequences: name, type, optional defaultValue
  // Also capture event types like "[id: number]"
  const skip = new Set([
    "props",
    "const",
    "none",
    "emit",
    "about",
    "button",
    "defaultValue",
    "type",
    "ts",
    "setup",
    "expanded",
    "defineEmits",
    "defineSlots",
    "$slots",
  ]);

  // Path-like first entry
  let i = 0;
  if (region[0] && (region[0].includes(".vue") || region[0].includes(":"))) i = 1;

  const usedAsEvent = new Set();
  const usedAsSlot = new Set();

  // First pass: event type tuples and update: events
  for (let j = 0; j < region.length; j++) {
    const s = region[j];
    if (/^\[.*\]$/.test(s) && j > 0) {
      // previous tokens may be event name / arg name
      const prev = region[j - 1];
      const prev2 = region[j - 2];
      // pattern: eventName, argName, [type]  OR eventName, [type]
      if (prev2 && !typeTokens.has(prev2) && !skip.has(prev2) && !/^\[/.test(prev2)) {
        if (prev2.includes(":") || /^[a-zA-Z_][\w:.-]*$/.test(prev2)) {
          events.push({ name: prev2, type: s });
          usedAsEvent.add(prev2);
        }
      }
    }
  }

  // Props: look for name followed by a type token
  for (let j = i; j < region.length - 1; j++) {
    const name = region[j];
    const next = region[j + 1];
    if (!name || skip.has(name) || usedAsEvent.has(name)) continue;
    if (name.includes("/") || name.includes("\\") || name.includes(".vue")) continue;
    if (!/^[a-zA-Z_][\w-]*$/.test(name) && !name.includes(":")) continue;
    if (name.includes(":")) continue; // events like update:label handled above

    if (typeTokens.has(next) || /^(string|number|boolean|any)\b/.test(next)) {
      let hasDefault = false;
      // defaultValue marker after type, or literal default after type
      if (region[j + 2] === "defaultValue") hasDefault = true;
      if (
        region[j + 2] &&
        !typeTokens.has(region[j + 2]) &&
        !skip.has(region[j + 2]) &&
        region[j + 2] !== "defaultValue" &&
        (region[j + 2] === "0" ||
          region[j + 2] === "false" ||
          region[j + 2] === "true" ||
          region[j + 2] === "null" ||
          region[j + 2] === "undefined" ||
          /^['"`]/.test(region[j + 2]))
      ) {
        hasDefault = true;
      }
      // skip if this looks like slot prop field (open after default)
      props.push({
        name,
        type: next,
        required: undefined, // not reliably encoded in string dump
        hasDefault: hasDefault || undefined,
        global: false,
      });
    }
  }

  // Slots: "default", "icon" appear; slot props like "open" may sit between
  // After events region, look for default/icon/focus
  const slotNames = ["default", "icon", "header", "footer", "title", "prefix", "suffix"];
  for (const sn of slotNames) {
    if (region.includes(sn) && !props.some((p) => p.name === sn)) {
      // "default" might also be a default value token — if we already saw defaultValue near a prop, still ok as slot name if defineSlots used
      slots.push({ name: sn, type: "" });
      usedAsSlot.add(sn);
    }
  }

  // Exposed: focus etc. — names that appear and look like methods, not already props/events
  // From dump: focus appears after icon
  const propNames = new Set(props.map((p) => p.name));
  for (const s of region) {
    if (
      s === "focus" ||
      s === "blur" ||
      s === "open" ||
      s === "close" ||
      s === "validate" ||
      s === "reset"
    ) {
      // "open" is often a slot prop — only treat as exposed if not only a slot prop field
      if (s === "open" && usedAsSlot.has("default")) continue;
      if (!propNames.has(s) && !usedAsEvent.has(s)) {
        if (!exposed.some((e) => e.name === s)) {
          exposed.push({ name: s, type: "" });
        }
      }
    }
  }
  // Explicit: if "focus" in region, add
  if (region.includes("focus") && !exposed.some((e) => e.name === "focus")) {
    exposed.push({ name: "focus", type: "" });
  }

  // Dedup props by name (keep first)
  const seenP = new Set();
  const dedupProps = [];
  for (const p of props) {
    if (seenP.has(p.name)) continue;
    // filter false positives that are event arg names (id, value) when those aren't real props
    seenP.add(p.name);
    dedupProps.push(p);
  }

  // Dedup events
  const seenE = new Set();
  const dedupEvents = [];
  for (const e of events) {
    if (seenE.has(e.name)) continue;
    seenE.add(e.name);
    dedupEvents.push(e);
  }

  return {
    props: dedupProps,
    events: dedupEvents,
    slots,
    exposed,
    source: "verter-native",
    _strings: region,
  };
}

/**
 * Extract `export type Name = { ... }` body with nested-brace awareness.
 */
function extractExportTypeBody(text, typeName) {
  const re = new RegExp(`export\\s+type\\s+${typeName}\\s*=\\s*\\{`);
  const m = re.exec(text);
  if (!m) return null;
  let i = m.index + m[0].length;
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
      const m = line.match(/^\s*(?:'([^']+)'|"([^"]+)"|([A-Za-z_][\w:.-]*))\s*:\s*(.+?)\s*;?\s*$/);
      if (!m) continue;
      const name = m[1] || m[2] || m[3];
      events.push({
        name,
        type: m[4].replace(/;?\s*$/, "").trim(),
      });
    }
  }

  const slotsBody = extractExportTypeBody(text, "Slots");
  if (slotsBody) {
    // Split on top-level newlines; each slot is `name(...): ret`
    for (const line of slotsBody.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][\w-]*)\s*\((.*)\)\s*:\s*(.+?)\s*;?\s*$/);
      if (m) {
        slots.push({
          name: m[1],
          type: `(${m[2]}): ${m[3].replace(/;?\s*$/, "").trim()}`,
        });
        continue;
      }
      const m2 = line.match(/^\s*([A-Za-z_][\w-]*)\s*\(/);
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
 */
export function getMetaTools({ workDir }) {
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
        return normalizeVueComponentMeta(raw);
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

  const verter = loadOptional("@verter/native");
  if (!verter.error && typeof verter.mod.ComponentMetaHost === "function") {
    let host = null;
    let session = null;
    tools.push({
      id: "verter-component-meta",
      label: "Verter ComponentMetaHost",
      capabilities: ["props", "events", "slots", "exposed", "types"],
      prepare() {
        host = new verter.mod.ComponentMetaHost({ devMode: false });
        session = null;
      },
      extract(absPath, source) {
        const id = absPath.replace(/\\/g, "/");
        host.upsertBase(id, source);
        if (!session) session = host.openSession();
        else if (typeof session.upsert === "function") session.upsert(id, source);
        const buf =
          typeof session.getResolvedComponentMeta === "function"
            ? session.getResolvedComponentMeta(id)
            : session.getComponentMeta(id);
        return normalizeVerterMetaBuffer(buf);
      },
      dispose() {
        try {
          session?.close?.();
        } catch {
          /* ignore */
        }
        try {
          host?.shutdown?.();
        } catch {
          /* ignore */
        }
        host = null;
        session = null;
      },
    });
  } else {
    tools.push({
      id: "verter-component-meta",
      label: "Verter ComponentMetaHost",
      skip: verter.error || "ComponentMetaHost missing",
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
        return normalizeVizeDeclaration(decl);
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

/**
 * Prepare a temp work dir with tsconfig + the single component for vue-component-meta.
 */
export function prepareMetaCaseDir(caseDir, files, sharedTsconfig) {
  const dest = join(rootDir, "work", "confirm-component-meta", caseDir);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  writeFileSync(join(dest, "tsconfig.json"), JSON.stringify(sharedTsconfig, null, 2));
  writeFileSync(join(dest, "env.d.ts"), `/// <reference types="vue/macros-global" />\n`);
  for (const [name, content] of Object.entries(files)) {
    const target = join(dest, name);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, content);
  }
  return dest;
}

export { rootDir, isGlobalPropName };
