/**
 * Format confirmation: formatters must not break Vue SFCs.
 * Exit 0 is not enough — output must still parse, stay idempotent when
 * required, and keep planted comments / v-for bindings / generic=.
 */
import { cpSync, mkdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { createSuite } from "../lib/harness.mjs";
import { resolveSpawnable, runCli, rootDir } from "../lib/run-cli.mjs";

const require = createRequire(import.meta.url);
const { parse: parseSfc } = require("@vue/compiler-sfc");

const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(__dirname, "../fixtures/format");
const workRoot = join(rootDir, "work", "confirm-format");

const TOOLS = [
  { id: "prettier", bin: "prettier", args: (file) => ["--write", file] },
  { id: "oxfmt", bin: "oxfmt", args: (file) => ["--write", file] },
  { id: "vize-fmt", bin: "vize", args: (file) => ["fmt", "--write", file] },
  { id: "biome-fmt", bin: "biome", args: (file) => ["format", "--write", file] },
];

const PLANTS = [
  {
    id: "format-idempotent",
    file: "format-idempotent.vue",
    idempotent: true,
  },
  {
    id: "format-parseable",
    file: "format-parseable.vue",
  },
  {
    id: "format-comments-preserved",
    file: "format-comments-preserved.vue",
    mustInclude: [
      "CONFIRM_HTML_COMMENT",
      "CONFIRM_SCRIPT_COMMENT",
      "CONFIRM_STYLE_COMMENT",
    ],
  },
  {
    id: "format-v-for-expression-preserved",
    file: "format-v-for-expression-preserved.vue",
    requireVForBindings: true,
  },
  {
    id: "format-generic-script-setup",
    file: "format-generic-script-setup.vue",
    mustInclude: ["generic="],
  },
];

function parseVue(source, filename) {
  try {
    const { errors } = parseSfc(source, { filename });
    const msgs = (errors || []).map((e) => e.message || String(e));
    return msgs.length ? { ok: false, message: msgs.join("; ") } : { ok: true };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

function hasVForBindings(source) {
  if (!/\bv-for\b/.test(source)) return false;
  return /\bitem\b/.test(source) && /\bindex\b/.test(source);
}

function prepareWork(caseId, toolId, srcFile) {
  const dest = join(workRoot, caseId, toolId);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  // Repo-boundary marker so walk tools that honour ancestor .gitignore
  // (oxfmt 0.63+) do not inherit this repo's exclusion of work/.
  mkdirSync(join(dest, ".git"));
  const destFile = join(dest, srcFile);
  cpSync(join(fixtureRoot, srcFile), destFile);
  return { dest, destFile, relFile: srcFile };
}

function formatOnce(spec, args, cwd) {
  return runCli(spec.bin, [...(spec.argsPrefix || []), ...args], { cwd });
}

function failDetail(run, extra = {}) {
  const detail = { ...extra };
  if (Number.isFinite(run?.ms)) detail.ms = run.ms;
  if (run?.combined) detail.snippet = run.combined.slice(0, 500);
  return detail;
}

/**
 * @returns {string | null} failure message, or null when the plant holds
 */
function judge(plant, original, formatted, firstRun, second = null) {
  if (firstRun.status !== 0) {
    const err = firstRun.error ? ` (${firstRun.error.message || firstRun.error})` : "";
    return `formatter exited ${firstRun.status}${err}`;
  }

  const origParse = parseVue(original, plant.file);
  if (!origParse.ok) return `original SFC does not parse: ${origParse.message}`;

  const fmtParse = parseVue(formatted, plant.file);
  if (!fmtParse.ok) return `formatted SFC does not parse: ${fmtParse.message}`;

  if (plant.idempotent) {
    if (!second) return "idempotent plant missing second format pass";
    if (second.run.status !== 0) {
      const err = second.run.error ? ` (${second.run.error.message || second.run.error})` : "";
      return `second format exited ${second.run.status}${err}`;
    }
    if (formatted !== second.formatted) {
      return "format(format(x)) !== format(x)";
    }
  }

  for (const needle of plant.mustInclude || []) {
    if (!formatted.includes(needle)) {
      return `formatted output missing ${JSON.stringify(needle)}`;
    }
  }

  if (plant.requireVForBindings && !hasVForBindings(formatted)) {
    return "v-for item/index identifiers were not preserved";
  }

  return null;
}

export async function runFormatSuite() {
  const suite = createSuite("format");
  mkdirSync(workRoot, { recursive: true });

  const resolved = TOOLS.map((tool) => ({
    ...tool,
    spec: resolveSpawnable(tool.bin),
  }));

  for (const plant of PLANTS) {
    const original = readFileSync(join(fixtureRoot, plant.file), "utf8");

    for (const tool of resolved) {
      if (!tool.spec) {
        suite.skip(plant.id, tool.id, `${tool.bin} binary not found`);
        continue;
      }

      const { dest, destFile, relFile } = prepareWork(plant.id, tool.id, plant.file);
      const first = formatOnce(tool.spec, tool.args(relFile), dest);
      const formatted = readFileSync(destFile, "utf8");

      let second = null;
      if (plant.idempotent && first.status === 0) {
        const again = formatOnce(tool.spec, tool.args(relFile), dest);
        second = { run: again, formatted: readFileSync(destFile, "utf8") };
      }

      const message = judge(plant, original, formatted, first, second);
      if (message) {
        suite.fail(
          plant.id,
          tool.id,
          message,
          failDetail(first, { formatted: formatted.slice(0, 240) }),
        );
      } else {
        const notes = [`${original.length}→${formatted.length}B`];
        if (plant.idempotent) notes.push("idempotent");
        notes.push(original === formatted ? "unchanged" : "rewrote");
        suite.pass(plant.id, tool.id, notes.join(" "), { ms: first.ms });
      }
    }
  }

  return suite.results;
}
