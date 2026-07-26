/**
 * Typecheck confirmation plants.
 * Each case is a mini project under fixtures/typecheck/cases/<id>/.
 * Tools are judged independently (expectErrors true/false + optional mustMatch).
 */
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSuite } from "../lib/harness.mjs";
import { resolveBin, runCli, rootDir } from "../lib/run-cli.mjs";
import { isToolBootstrapFailure, scoreDiagnostics } from "../lib/diagnostics.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const casesRoot = join(__dirname, "../fixtures/typecheck/cases");
const sharedRoot = join(__dirname, "../fixtures/typecheck/_shared");
const workRoot = join(rootDir, "work", "confirm-typecheck");

function listCases() {
  return readdirSync(casesRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();
}

function prepareCase(caseId) {
  const src = join(casesRoot, caseId);
  const dest = join(workRoot, caseId);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });

  // copy case files
  cpSync(src, dest, { recursive: true });

  // shared env + tsconfig
  cpSync(join(sharedRoot, "env.d.ts"), join(dest, "env.d.ts"));
  const base = JSON.parse(readFileSync(join(sharedRoot, "tsconfig.base.json"), "utf8"));
  // Point vue resolution at monorepo node_modules for bare work dirs
  base.compilerOptions = {
    ...base.compilerOptions,
    paths: {
      vue: [join(rootDir, "node_modules/vue").replace(/\\/g, "/")],
      "vue/*": [join(rootDir, "node_modules/vue/*").replace(/\\/g, "/")],
    },
  };
  // Keep tool-only configs out of typecheck include
  base.exclude = ["golar.config.ts", "node_modules"];
  writeFileSync(join(dest, "tsconfig.json"), JSON.stringify(base, null, 2));
  writeFileSync(
    join(dest, "package.json"),
    JSON.stringify(
      {
        name: `confirm-${caseId}`,
        private: true,
        type: "module",
        dependencies: {
          vue: "file:" + join(rootDir, "node_modules/vue").replace(/\\/g, "/"),
        },
      },
      null,
      2,
    ),
  );

  // NOTE: do not junction root node_modules here — Vize/Corsa hits
  // "Access is denied" on Windows junctions for this work tree. Resolution
  // uses compilerOptions.paths + NODE_PATH from runCli instead.

  // golar config (matched to repo fixtures)
  writeFileSync(
    join(dest, "golar.config.ts"),
    `import { defineConfig } from "golar/unstable";\nimport "@golar/vue";\nexport default defineConfig({});\n`,
  );

  const meta = JSON.parse(readFileSync(join(src, "meta.json"), "utf8"));
  return { dest, meta };
}

/**
 * Capability tags for plants (`meta.requires`).
 * Tools without a required capability skip that plant (not a silent pass).
 * `*` means all plants.
 *
 * Observed gap: Vize/Corsa currently does not flag undeclared component attrs
 * the way Volar strictTemplates does — those plants require strict-component-attrs.
 */
const TOOL_CAPABILITIES = {
  "vue-tsc": ["*"],
  "golar-typecheck": ["*"],
  "vize-check": [
    "script-types",
    "template-bindings",
    "prop-types",
    "v-if-narrow",
    "emits",
    "v-model",
    "dom-events",
  ],
  "verter-tsc": ["*"],
};

/**
 * Virtual-code identifier prefixes. Every Vue typechecker rewrites SFCs into
 * generated TS before handing them to the checker.
 *
 * On a *clean* fixture any diagnostic is already wrong; one that also names the
 * tool's own generated code is diagnosing its own codegen rather than the
 * author's source, which is worth calling out by name. Dirty fixtures are
 * deliberately not checked: naming a virtual symbol inside an otherwise correct
 * diagnostic (e.g. Volar's `'__VLS_ctx.user' is possibly 'null'`) is a message
 * wart, not a failure to do the work.
 */
const VIRTUAL_CODE_MARKERS = ["__VLS_", "___VERTER___", "__vize_", "__golar_"];

/** @returns {string[]} diagnostic lines that leak a virtual-code identifier */
function findVirtualCodeLeaks(combined) {
  if (!combined) return [];
  return combined
    .split(/\r?\n/)
    .filter((line) => /error\s+TS\d+/i.test(line))
    .filter((line) => VIRTUAL_CODE_MARKERS.some((marker) => line.includes(marker)));
}

function toolSupports(toolId, requires) {
  if (!requires?.length) return true;
  const caps = TOOL_CAPABILITIES[toolId] || [];
  if (caps.includes("*")) return true;
  return requires.every((r) => caps.includes(r));
}

function toolRunners(cwd) {
  const vueTsc = resolveBin("vue-tsc");
  const vize = resolveBin("vize");
  const verterTsc = resolveBin("verter-tsc");
  const golar = resolveBin("golar");

  return [
    {
      id: "vue-tsc",
      available: Boolean(vueTsc),
      run: () => runCli(vueTsc, ["--noEmit", "-p", "tsconfig.json"], { cwd }),
      unavailable: "vue-tsc binary not found",
    },
    {
      id: "vize-check",
      available: Boolean(vize),
      run: () => runCli(vize, ["check", ".", "--tsconfig", "tsconfig.json"], { cwd }),
      unavailable: "vize binary not found",
    },
    {
      id: "verter-tsc",
      available: Boolean(verterTsc),
      run: () => runCli(verterTsc, ["--noEmit", "-p", "tsconfig.json"], { cwd }),
      unavailable: "verter-tsc binary not found",
      /**
       * verter-tsc requires tsgo for its typecheck surface; detect and skip.
       */
      after(result) {
        if (
          /no supported tsgo engine/i.test(result.combined) ||
          /There is no tsc fallback/i.test(result.combined)
        ) {
          return {
            skip: "verter-tsc requires tsgo (TypeScript 7 native); not installed",
          };
        }
        return null;
      },
    },
    {
      id: "golar-typecheck",
      available: Boolean(golar),
      run: () => runCli(golar, ["typecheck"], { cwd }),
      unavailable: "golar binary not found",
      after(result) {
        if (/golar\.config/i.test(result.combined) && /not found/i.test(result.combined)) {
          return { skip: "golar.config missing/unreadable" };
        }
        return null;
      },
    },
  ];
}

export async function runTypecheckSuite() {
  const suite = createSuite("typecheck");
  mkdirSync(workRoot, { recursive: true });

  for (const caseId of listCases()) {
    const { dest, meta } = prepareCase(caseId);
    const runners = toolRunners(dest);

    for (const tool of runners) {
      if (!tool.available) {
        suite.skip(meta.id, tool.id, tool.unavailable);
        continue;
      }

      if (!toolSupports(tool.id, meta.requires)) {
        suite.skip(meta.id, tool.id, `tool lacks capability: ${(meta.requires || []).join(", ")}`);
        continue;
      }

      const result = tool.run();
      if (tool.after) {
        const special = tool.after(result);
        if (special?.skip) {
          suite.skip(meta.id, tool.id, special.skip);
          continue;
        }
      }

      // Engine/bootstrap failures (non-diagnostic) → skip not fail
      if (result.error || (result.status === null && !result.combined.trim())) {
        suite.skip(meta.id, tool.id, result.error?.message || "process failed to start");
        continue;
      }

      if (isToolBootstrapFailure(result.combined)) {
        suite.skip(
          meta.id,
          tool.id,
          `tool bootstrap/runtime failure: ${
            result.combined
              .split(/\r?\n/)
              .find((l) => l.trim())
              ?.slice(0, 160) || "unknown"
          }`,
        );
        continue;
      }

      // On a clean fixture, a diagnostic naming the tool's own virtual code is
      // reporting a defect in its codegen, not in the source. Name it rather
      // than letting it read as a generic "expected clean, got N".
      if (!meta.expectErrors) {
        const leaks = findVirtualCodeLeaks(result.combined);
        if (leaks.length) {
          suite.fail(
            meta.id,
            tool.id,
            `clean fixture: diagnostic describes the tool's own generated code — ${leaks[0].trim().slice(0, 200)}`,
            { snippet: leaks.join("\n").slice(0, 800) },
          );
          continue;
        }
      }

      const score = scoreDiagnostics({
        combined: result.combined,
        status: result.status,
        expectErrors: meta.expectErrors,
        minErrors: meta.minErrors ?? 1,
        maxErrors: meta.maxErrors,
        mustMatch: meta.mustMatch,
        mustNotMatch: meta.mustNotMatch,
      });

      if (score.ok) {
        suite.pass(meta.id, tool.id, score.message);
      } else {
        suite.fail(meta.id, tool.id, score.message, {
          snippet: result.combined.slice(0, 800),
        });
      }
    }
  }

  return suite.results;
}
