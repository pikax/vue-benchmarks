/**
 * Component-meta confirmation: each tool must report the expected public API
 * (props / events / slots / exposed) for planted SFCs.
 */
import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createSuite } from "../lib/harness.mjs";
import { rootDir } from "../lib/run-cli.mjs";
import { getMetaTools } from "../lib/component-meta-extract.mjs";
import { scoreComponentMeta } from "../lib/component-meta-score.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const casesRoot = join(__dirname, "../fixtures/component-meta/cases");
const workRoot = join(rootDir, "work", "confirm-component-meta");

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
  cpSync(src, dest, { recursive: true });

  const tsconfig = {
    compilerOptions: {
      target: "ESNext",
      module: "ESNext",
      moduleResolution: "bundler",
      strict: true,
      jsx: "preserve",
      noEmit: true,
      skipLibCheck: true,
      lib: ["ESNext", "DOM"],
      paths: {
        vue: [join(rootDir, "node_modules/vue").replace(/\\/g, "/")],
        "vue/*": [join(rootDir, "node_modules/vue/*").replace(/\\/g, "/")],
      },
    },
    include: ["**/*.vue", "**/*.ts"],
  };
  writeFileSync(join(dest, "tsconfig.json"), JSON.stringify(tsconfig, null, 2));
  writeFileSync(join(dest, "env.d.ts"), `/// <reference types="vue/macros-global" />\n`);

  const expect = JSON.parse(readFileSync(join(src, "expect.json"), "utf8"));
  // Prefer Component.vue; allow multi-file later
  const componentFile = readdirSync(dest).find((f) => f.endsWith(".vue"));
  if (!componentFile) {
    throw new Error(`No .vue file in case ${caseId}`);
  }
  const absPath = join(dest, componentFile);
  const source = readFileSync(absPath, "utf8");
  return { dest, expect, absPath, source, componentFile };
}

function applyOverrides(expect, toolId) {
  const override = expect.toolOverrides?.[toolId];
  if (!override) return { expect, skip: null };

  if (override.skip) {
    return { expect, skip: override.reason || "tool override skip" };
  }

  const next = { ...expect };
  if (override.ignoreSections?.length) {
    for (const section of override.ignoreSections) {
      delete next[section];
    }
  }
  if (override.expect) {
    Object.assign(next, override.expect);
  }
  return { expect: next, skip: null };
}

export async function runComponentMetaSuite() {
  const suite = createSuite("component-meta");
  mkdirSync(workRoot, { recursive: true });

  // Prepare first case dir for tool init (vue checker needs a tsconfig path);
  // each case re-prepares tools against its own work dir.
  for (const caseId of listCases()) {
    const { dest, expect, absPath, source } = prepareCase(caseId);
    const tools = getMetaTools({ workDir: dest });

    for (const tool of tools) {
      if (tool.skip) {
        suite.skip(expect.id, tool.id, tool.skip);
        continue;
      }

      const { expect: caseExpect, skip } = applyOverrides(expect, tool.id);
      if (skip) {
        suite.skip(expect.id, tool.id, skip);
        continue;
      }

      try {
        tool.prepare?.();
        const meta = tool.extract(absPath, source);
        const score = scoreComponentMeta(meta, caseExpect, tool);
        if (score.ok) {
          suite.pass(expect.id, tool.id, score.message, score.metaSummary);
        } else {
          suite.fail(expect.id, tool.id, score.message, {
            meta: score.metaSummary,
          });
        }
      } catch (error) {
        suite.fail(expect.id, tool.id, error instanceof Error ? error.message : String(error));
      } finally {
        try {
          tool.dispose?.();
        } catch {
          /* ignore */
        }
      }
    }
  }

  return suite.results;
}
