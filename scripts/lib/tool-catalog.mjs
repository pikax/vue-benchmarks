/**
 * Tools shown on the README, grouped by surface.
 *
 * Each row is the package the tables name, a link to the project, the version
 * used in the published run, and that version's npm (or crates.io) publish date.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");
const CACHE_PATH = join(rootDir, "docs", "results", "npm-times.json");

function pkgJson(name) {
  const direct = join(rootDir, "node_modules", ...name.split("/"), "package.json");
  if (!existsSync(direct)) return null;
  try {
    return JSON.parse(readFileSync(direct, "utf8"));
  } catch {
    return null;
  }
}

function gitUrl(raw) {
  if (!raw) return "";
  let u = String(raw);
  if (typeof raw === "object") u = raw.url || "";
  u = u.replace(/^git\+/, "").replace(/^git@github\.com:/, "https://github.com/").replace(/\.git$/, "");
  if (u.startsWith("git://")) u = `https://${u.slice(6)}`;
  const gh = /github\.com[:/]([^/\s]+\/[^/\s#?]+)/i.exec(u);
  return gh ? `https://github.com/${gh[1].replace(/\.git$/i, "")}` : "";
}

function projectUrl(name, fallback = "") {
  const json = pkgJson(name);
  if (json) {
    const fromRepo = gitUrl(json.repository) || gitUrl(json.homepage);
    if (fromRepo) return fromRepo;
  }
  return fallback;
}

/** Registry package for a harness alias (`@vue/compiler-sfc-36` → `@vue/compiler-sfc`). */
export function registryName(name) {
  if (name === "@vue/compiler-sfc-36") return "@vue/compiler-sfc";
  if (name.startsWith("cli:")) return name.slice(4);
  return name;
}

export function npmUrl(name, version) {
  const pkg = registryName(name);
  if (!pkg || !version) return "";
  const base = `https://www.npmjs.com/package/${pkg}`;
  return version ? `${base}/v/${encodeURIComponent(version)}` : base;
}

export function tnbVersion() {
  const p = join(rootDir, "envs", "tnb", "package.json");
  if (!existsSync(p)) return "";
  try {
    const spec = JSON.parse(readFileSync(p, "utf8")).dependencies?.typescript ?? "";
    return /typescript-native-bridge@(.+)$/.exec(spec)?.[1] ?? "";
  } catch {
    return "";
  }
}

export const TOOL_SECTIONS = [
  {
    id: "compile",
    title: "SFC compile",
    names: [
      "@vue/compiler-sfc",
      "@vue/compiler-sfc-36",
      "vize",
      "@vizejs/native",
      "@verter/native",
      "@fervid/napi",
    ],
  },
  {
    id: "typecheck",
    title: "Typecheck",
    names: [
      "vue-tsc",
      "verter-tsc",
      "vize",
      "golar",
      "@golar/vue",
      "typescript",
      "typescript-native-bridge",
    ],
  },
  {
    id: "format",
    title: "Format",
    names: ["prettier", "oxfmt", "vize", "@biomejs/biome"],
  },
  {
    id: "lint",
    title: "Lint",
    names: ["eslint-plugin-vue", "vize", "@verter/native", "oxlint", "@biomejs/biome"],
  },
  {
    id: "component-meta",
    title: "Component-meta",
    names: ["vue-component-meta", "@verter/component-meta", "vize"],
  },
  {
    id: "lsp",
    title: "LSP / IDE",
    names: [
      "@vue/language-server",
      "@vue/typescript-plugin",
      "typescript-language-server",
      "vize",
      "verter-lsp",
      "typescript-native-bridge",
    ],
  },
];

const GITHUB = {
  vue: "https://github.com/vuejs/core",
  "@vue/compiler-sfc": "https://github.com/vuejs/core",
  "@vue/compiler-sfc-36": "https://github.com/vuejs/core",
  vize: "https://github.com/ubugeeei-prod/vize",
  "@vizejs/native": "https://github.com/ubugeeei-prod/vize",
  "@verter/native": "https://github.com/pikax/verter",
  "@verter/component-meta": "https://github.com/pikax/verter",
  "verter-tsc": "https://github.com/pikax/verter",
  "verter-lsp": "https://github.com/pikax/verter",
  "@fervid/napi": "https://github.com/phoenix-ru/fervid",
  "vue-tsc": "https://github.com/vuejs/language-tools",
  "vue-component-meta": "https://github.com/vuejs/language-tools",
  "@vue/language-server": "https://github.com/vuejs/language-tools",
  "@vue/typescript-plugin": "https://github.com/vuejs/language-tools",
  golar: "https://github.com/auvred/golar",
  "@golar/vue": "https://github.com/auvred/golar",
  prettier: "https://github.com/prettier/prettier",
  oxfmt: "https://github.com/oxc-project/oxc",
  oxlint: "https://github.com/oxc-project/oxc",
  "@biomejs/biome": "https://github.com/biomejs/biome",
  typescript: "https://github.com/microsoft/TypeScript",
  "typescript-language-server": "https://github.com/typescript-language-server/typescript-language-server",
  "eslint-plugin-vue": "https://github.com/vuejs/eslint-plugin-vue",
  "typescript-native-bridge": "https://github.com/johnsoncodehk/typescript-native-bridge",
};

const DISPLAY = {
  "@vue/compiler-sfc-36": "@vue/compiler-sfc 3.6",
  "typescript-native-bridge": "typescript-native-bridge (TNB)",
};

/** Ranking-table labels → GitHub. More specific rules first. */
const LABEL_GITHUB = [
  { re: /\(N\)|\(TNB|tsgo tsdk/i, and: /volar|vue-tsc/i, url: GITHUB["typescript-native-bridge"] },
  { re: /typescript-native-bridge|\btnb\b/i, url: GITHUB["typescript-native-bridge"] },
  { re: /volar|vue-tsc|vue-component-meta|@vue\/language-server|@vue\/typescript-plugin/i, url: GITHUB["vue-tsc"] },
  { re: /verter/i, url: GITHUB["verter-tsc"] },
  { re: /vize/i, url: GITHUB.vize },
  { re: /golar/i, url: GITHUB.golar },
  { re: /compiler-sfc|@vue\/compiler/i, url: GITHUB["@vue/compiler-sfc"] },
  { re: /fervid/i, url: GITHUB["@fervid/napi"] },
  { re: /prettier/i, url: GITHUB.prettier },
  { re: /oxfmt|oxlint/i, url: GITHUB.oxlint },
  { re: /biome/i, url: GITHUB["@biomejs/biome"] },
  { re: /eslint-plugin-vue|eslint-plugin-vue/i, url: GITHUB["eslint-plugin-vue"] },
  { re: /typescript-language-server/i, url: GITHUB["typescript-language-server"] },
];

function loadCache() {
  if (!existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(cache) {
  mkdirSync(dirname(CACHE_PATH), { recursive: true });
  writeFileSync(CACHE_PATH, `${JSON.stringify(cache, null, 2)}\n`);
}

async function fetchNpmTime(pkg, version) {
  const url = `https://registry.npmjs.org/${encodeURIComponent(pkg)}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) return "";
  const data = await res.json();
  const iso = data?.time?.[version];
  return iso ? String(iso).slice(0, 10) : "";
}

async function fetchCrateTime(crate, version) {
  const url = `https://crates.io/api/v1/crates/${encodeURIComponent(crate)}`;
  const res = await fetch(url, { headers: { accept: "application/json", "user-agent": "vue-benchmarks" } });
  if (!res.ok) return "";
  const data = await res.json();
  const ver = (data?.versions || []).find((v) => v.num === version);
  const iso = ver?.created_at;
  return iso ? String(iso).slice(0, 10) : "";
}

/**
 * Resolve publish dates for `name@version` keys. npm first; crates.io for
 * known Rust packages when npm has no time.
 */
export async function resolvePublishDates(entries, { fetchImpl = fetch, persist = true } = {}) {
  const cache = loadCache();
  const origFetch = globalThis.fetch;
  globalThis.fetch = fetchImpl;
  try {
    const pending = [];
    for (const { name, version } of entries) {
      if (!name || !version || version === "unknown" || version === "unavailable") continue;
      const key = `${registryName(name)}@${version}`;
      if (cache[key]) continue;
      pending.push(
        (async () => {
          try {
            let day = await fetchNpmTime(registryName(name), version);
            if (!day && name === "@fervid/napi") day = await fetchCrateTime("fervid", version);
            if (day) cache[key] = day;
          } catch {
            // Offline / registry blip: leave the cell empty rather than fail the README.
          }
        })(),
      );
    }
    if (pending.length) await Promise.all(pending);
    if (persist) saveCache(cache);
    return cache;
  } finally {
    globalThis.fetch = origFetch;
  }
}

export function urlFor(name) {
  return projectUrl(name, GITHUB[name] || "");
}

export function displayName(name) {
  return DISPLAY[name] || name;
}

export function githubForLabel(label) {
  const n = String(label ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s*[⚠❌⏭]+\s*$/u, "")
    .trim();
  if (!n) return "";
  for (const rule of LABEL_GITHUB) {
    if (rule.and && !rule.and.test(n)) continue;
    if (rule.re.test(n)) return rule.url;
  }
  return "";
}

/** Wrap a ranking-table tool cell with the shared GitHub link; keep ⚠/❌/⏭ outside. */
export function linkToolLabel(raw) {
  const text = String(raw ?? "");
  if (/\]\([^)]+\)/.test(text)) return text;
  const m = /^(.*?)(\s*[⚠❌⏭]+)?\s*$/u.exec(text.trim());
  const name = (m?.[1] ?? text).trim();
  const mark = m?.[2] ?? "";
  const url = githubForLabel(name);
  if (!url) return text;
  return `[${name}](${url})${mark}`;
}

export function plainToolName(cell) {
  return String(cell ?? "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s*[⚠❌⏭]+\s*$/u, "")
    .trim();
}

/**
 * One surface's Tool / Version table (no heading). Empty string if nothing
 * resolved. Landing pages put this under the matching `### Typecheck` (etc.).
 */
export function formatToolTable(sectionId, versions, dates = {}) {
  return formatToolTables([sectionId], versions, dates, { wrap: false });
}

/**
 * `versions` is `{ name: version }` from a bench artifact (or collectVersions).
 * `dates` is `{ "pkg@version": "YYYY-MM-DD" }`.
 * `wrap: true` (default) emits `### Tools` + `#### <surface>` around each table.
 */
export function formatToolTables(sectionIds, versions, dates = {}, { wrap = true } = {}) {
  const wanted = new Set(sectionIds);
  const tnb = tnbVersion();
  const vers = { ...versions };
  if (tnb && !vers["typescript-native-bridge"]) vers["typescript-native-bridge"] = tnb;
  const lines = wrap ? ["### Tools", ""] : [];
  let any = false;
  for (const section of TOOL_SECTIONS) {
    if (!wanted.has(section.id)) continue;
    const rows = [];
    for (const name of section.names) {
      const version = vers[name];
      if (!version || version === "unknown" || version === "unavailable") continue;
      const gh = urlFor(name);
      const label = displayName(name);
      const tool = gh ? `[${label}](${gh})` : label;
      const npm = npmUrl(name, version);
      const day = dates[`${registryName(name)}@${version}`] || "";
      const verCell = npm
        ? `[${version}](${npm})${day ? ` · ${day}` : ""}`
        : day
          ? `${version} · ${day}`
          : version;
      rows.push({ day, line: `| ${tool} | ${verCell} |` });
    }
    if (!rows.length) continue;
    rows.sort((a, b) => (b.day || "").localeCompare(a.day || "") || a.line.localeCompare(b.line));
    any = true;
    if (wrap) lines.push(`#### ${section.title}`, "");
    lines.push("| Tool | Version |");
    lines.push("| --- | --- |");
    lines.push(...rows.map((r) => r.line), "");
  }
  return any ? lines.join("\n") : "";
}

/** Parse `| pkg | ver |` rows from a report Tool versions table into a map. */
export function versionsFromTableRows(rows) {
  const out = {};
  for (const row of rows || []) {
    const m = /^\| ([^|]+) \| ([^|]+) \|/.exec(row);
    if (!m) continue;
    const name = m[1].trim();
    const version = m[2].trim();
    if (!name || name === "Package" || name.startsWith("---") || name.startsWith("cli:")) continue;
    out[name] = version;
  }
  return out;
}
