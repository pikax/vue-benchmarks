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
  {
    // <pre> content is rendering-significant byte-for-byte, with one HTML
    // exception: a single newline right after the <pre> start tag is ignored
    // by rendering, so the regex tolerates it (Prettier/oxfmt insert one).
    // Inline runs: a glued </b><i> pair must not gain whitespace (that adds a
    // rendered space) and a spaced </span> <span> pair must not lose it.
    id: "format-pre-whitespace",
    file: "format-pre-whitespace.vue",
    idempotent: true,
    mustMatch: [
      /<pre>\r?\n?PRE_LINE_ONE {2}double {2}spaced\r?\n {4}PRE_INDENTED_LINE\r?\nPRE_FLUSH_LINE<\/pre>/,
      /<\/b\s*><i/, // allows the inside-tag line break trick (</b\n><i)
    ],
    mustNotMatch: [/<\/span><span>/],
  },
  {
    // Inside v-pre the mustache is literal rendered text, not an expression.
    // A formatter that parses it as JS crashes or rewrites rendered output.
    id: "format-v-pre-content",
    file: "format-v-pre-content.vue",
    mustInclude: [
      "v-pre",
      "{{ this is not an expression }}",
      "RAW_VPRE_TOKEN",
      "notEvaluated",
    ],
  },
  {
    // <style> v-bind() expressions must survive exactly (compiler-sfc hashes
    // the expression text into the CSS var name). Quote style inside
    // v-bind('...') may legally flip — both quote chars are accepted.
    id: "format-style-v-bind",
    file: "format-style-v-bind.vue",
    mustMatch: [
      /color:\s*v-bind\(themeColor\)/,
      /padding:\s*v-bind\(spacing\)/,
      /border-color:\s*v-bind\(\s*['"]theme\.accent['"]\s*\)/,
    ],
  },
  {
    // An <i18n lang="json"> custom block: reformatting the JSON is fine
    // (Prettier does), but the parsed messages must be deep-equal and the
    // block + its lang attr must survive.
    id: "format-i18n-custom-block",
    file: "format-i18n-custom-block.vue",
    mustInclude: ["CONFIRM_I18N_EN", "こんにちは CONFIRM_I18N_JA"],
    verify: verifyI18nBlock,
  },
  {
    // Pug is indentation-significant and none of the tools parse pug, so the
    // block must pass through byte-identical (modulo CRLF). Uniformly
    // re-indenting the block is NOT safe: pug rejects a document whose first
    // line is indented (`unexpected token "indent"`).
    id: "format-pug-template",
    file: "format-pug-template.vue",
    mustMatch: [
      /(^|[\r\n])\.wrapper\r?\n {2}h1\.title CONFIRM_PUG_TITLE\r?\n {2}ul\r?\n {4}li\(v-for="item in items" :key="item"\) \{\{ item \}\}/,
    ],
  },
  {
    // Long :class/:style object expressions and a multi-statement v-on
    // handler: re-wrapping is fine, but every token must survive and the
    // wrapping must be stable (attribute re-wrap is a classic idempotence
    // bug). Quote style may legally flip, so needles avoid quotes.
    id: "format-multiline-expressions",
    file: "format-multiline-expressions.vue",
    idempotent: true,
    mustInclude: [
      "has-error",
      "is-wide-layout-with-a-really-long-name",
      "--custom-gap",
      "clicked-with-a-fairly-long-reason-string",
      "count++",
      "MULTILINE_ATTR_PLANT",
    ],
    mustMatch: [/fontSize\s*\/\s*2/, /count:\s*count/],
  },
  {
    // Void elements written without a slash (<br>, <img>, <input>) plus a
    // self-closing component. Normalising to <br /> is fine; output must
    // still parse, stay stable, and <textarea></textarea> must not gain
    // inner whitespace (that changes its rendered default value).
    id: "format-void-self-closing",
    file: "format-void-self-closing.vue",
    idempotent: true,
    mustInclude: ["<img", "<br", "<input", "MyWidget"],
    mustMatch: [/<textarea[^>]*><\/textarea>/],
  },
  {
    // Comments at the SFC top level: before the first block, between blocks,
    // and after the last block. All three are valid and must survive.
    id: "format-top-level-comments",
    file: "format-top-level-comments.vue",
    mustInclude: [
      "CONFIRM_TOP_BEFORE_TEMPLATE",
      "CONFIRM_TOP_BETWEEN_BLOCKS",
      "CONFIRM_TOP_AFTER_LAST_BLOCK",
    ],
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

/** JSON with object keys sorted, so key order never affects equality. */
function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value && typeof value === "object") {
    const body = Object.keys(value)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonicalJson(value[k])}`)
      .join(",");
    return `{${body}}`;
  }
  return JSON.stringify(value);
}

/**
 * The <i18n> block may be reformatted, but must still exist, keep lang=json,
 * parse as JSON, and carry deep-equal messages.
 * @returns {string | null} failure message, or null when semantics held
 */
function verifyI18nBlock(formatted, original, plant) {
  const findBlock = (source) => {
    const { descriptor } = parseSfc(source, { filename: plant.file });
    return (descriptor.customBlocks || []).find((b) => b.type === "i18n");
  };
  const origBlock = findBlock(original);
  if (!origBlock) return "fixture bug: original has no <i18n> block";
  const fmtBlock = findBlock(formatted);
  if (!fmtBlock) return "<i18n> custom block was dropped";
  if (fmtBlock.attrs?.lang !== "json") {
    return `<i18n> lang attr changed: ${JSON.stringify(fmtBlock.attrs?.lang)}`;
  }
  let origJson;
  let fmtJson;
  try {
    origJson = JSON.parse(origBlock.content);
  } catch (error) {
    return `fixture bug: original i18n JSON invalid: ${error.message}`;
  }
  try {
    fmtJson = JSON.parse(fmtBlock.content);
  } catch (error) {
    return `<i18n> JSON no longer parses: ${error.message}`;
  }
  if (canonicalJson(origJson) !== canonicalJson(fmtJson)) {
    return "<i18n> messages changed after formatting";
  }
  return null;
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

  for (const re of plant.mustMatch || []) {
    if (!re.test(formatted)) {
      return `formatted output does not match ${re}`;
    }
  }

  for (const re of plant.mustNotMatch || []) {
    if (re.test(formatted)) {
      return `formatted output matches forbidden ${re}`;
    }
  }

  if (plant.requireVForBindings && !hasVForBindings(formatted)) {
    return "v-for item/index identifiers were not preserved";
  }

  if (plant.verify) {
    const message = plant.verify(formatted, original, plant);
    if (message) return message;
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
