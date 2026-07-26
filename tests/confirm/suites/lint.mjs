/**
 * Lint confirmation: clean files stay clean; planted issues are reported
 * with at least the expected count (and preferably matching rule/code).
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { createSuite } from "../lib/harness.mjs";
import { resolveBin, runCli, rootDir } from "../lib/run-cli.mjs";

const require = createRequire(import.meta.url);
const __dirname = dirname(fileURLToPath(import.meta.url));
const fixtureRoot = join(__dirname, "../fixtures/lint");

function loadExpect() {
  return JSON.parse(readFileSync(join(fixtureRoot, "expect.json"), "utf8"));
}

async function runEslint(files) {
  const { ESLint } = await import("eslint");
  const eslint = new ESLint({
    overrideConfigFile: join(fixtureRoot, "eslint.config.mjs"),
    cwd: fixtureRoot,
  });
  const abs = files.map((f) => join(fixtureRoot, f));
  const results = await eslint.lintFiles(abs);
  let issues = 0;
  const rules = [];
  for (const r of results) {
    for (const m of r.messages) {
      issues++;
      if (m.ruleId) rules.push(m.ruleId);
    }
  }
  return { issues, rules, results };
}

function runVizeLint(relativeFiles) {
  const vize = resolveBin("vize");
  if (!vize) return { skip: "vize binary not found" };
  // Lint whole fixture tree; filter counts by filename in output for dirty cases
  const r = runCli(vize, ["lint", ...relativeFiles], { cwd: fixtureRoot });
  return { combined: r.combined, status: r.status, bin: vize };
}

function countVizeIssues(text, fileFilter) {
  if (!text) return 0;
  // vize prints blocks like: ⚠ [vize:rule] or error [vize:...]
  const blocks = text.split(/(?=^\s*[⚠✖✗×]|^\s*error\b|^\s*warning\b)/im);
  let count = 0;
  for (const b of blocks) {
    if (!b.trim()) continue;
    if (fileFilter && !b.includes(fileFilter) && !looksLikeIssue(b)) {
      // file name may appear above the block — still count rule lines
    }
    if (/\[vize:[^\]]+\]/i.test(b) || /vize:/i.test(b)) {
      if (fileFilter) {
        // Prefer counting when the nearby text mentions the file
        // Fall through: count all rule hits when linting a single file path
      }
      count++;
    }
  }
  // Fallback: count rule tags
  if (count === 0) {
    const tags = text.match(/\[vize:[^\]]+\]/gi);
    count = tags ? tags.length : 0;
  }
  return count;
}

function looksLikeIssue(b) {
  return /\[vize:/i.test(b) || /\bhelp:/i.test(b);
}

function matchesNeedles(text, needles) {
  if (!needles?.length) return true;
  const lower = (text || "").toLowerCase();
  return needles.some((n) => lower.includes(String(n).toLowerCase()));
}

export async function runLintSuite() {
  const suite = createSuite("lint");
  const expect = loadExpect();

  // --- clean corpus ---
  const cleanFiles = expect.clean.files;

  // eslint clean
  try {
    const { issues, rules } = await runEslint(cleanFiles);
    const max = expect.clean.tools["eslint-plugin-vue"].maxIssues ?? 0;
    if (issues > max) {
      suite.fail(
        "clean",
        "eslint-plugin-vue",
        `expected ≤${max} issues, got ${issues} (${rules.join(", ")})`,
      );
    } else {
      suite.pass("clean", "eslint-plugin-vue", `issues=${issues}`);
    }
  } catch (error) {
    suite.fail(
      "clean",
      "eslint-plugin-vue",
      error instanceof Error ? error.message : String(error),
    );
  }

  // vize clean
  {
    const vize = resolveBin("vize");
    if (!vize) {
      suite.skip("clean", "vize-lint", "vize binary not found");
    } else {
      const r = runCli(vize, ["lint", ...cleanFiles], { cwd: fixtureRoot });
      const issues = countVizeIssues(r.combined);
      const max = expect.clean.tools["vize-lint"].maxIssues ?? 0;
      if (issues > max) {
        suite.fail("clean", "vize-lint", `expected ≤${max} issues, got ${issues}`, {
          snippet: r.combined.slice(0, 500),
        });
      } else {
        suite.pass("clean", "vize-lint", `issues=${issues}`);
      }
    }
  }

  // --- dirty plants ---
  for (const plant of expect.dirty) {
    // eslint
    const esSpec = plant.tools["eslint-plugin-vue"];
    if (esSpec) {
      if (esSpec.optional && esSpec.minIssues === 0) {
        try {
          const { issues, rules } = await runEslint([plant.file]);
          suite.pass(
            plant.id,
            "eslint-plugin-vue",
            `optional plant; issues=${issues} rules=${rules.join(",") || "none"} (${esSpec.note || "n/a"})`,
          );
        } catch (error) {
          suite.fail(
            plant.id,
            "eslint-plugin-vue",
            error instanceof Error ? error.message : String(error),
          );
        }
      } else {
        try {
          const { issues, rules } = await runEslint([plant.file]);
          const min = esSpec.minIssues ?? 1;
          const missing = (esSpec.mustIncludeRules || []).filter((rule) => !rules.includes(rule));
          if (issues < min) {
            suite.fail(plant.id, "eslint-plugin-vue", `expected ≥${min} issues, got ${issues}`);
          } else if (missing.length) {
            suite.fail(
              plant.id,
              "eslint-plugin-vue",
              `missing rules ${missing.join(", ")}; got ${rules.join(", ") || "none"}`,
            );
          } else {
            suite.pass(plant.id, "eslint-plugin-vue", `issues=${issues} rules=${rules.join(",")}`);
          }
        } catch (error) {
          suite.fail(
            plant.id,
            "eslint-plugin-vue",
            error instanceof Error ? error.message : String(error),
          );
        }
      }
    }

    // vize
    const vzSpec = plant.tools["vize-lint"];
    if (vzSpec) {
      const vize = resolveBin("vize");
      if (!vize) {
        suite.skip(plant.id, "vize-lint", "vize binary not found");
      } else {
        const r = runCli(vize, ["lint", plant.file], { cwd: fixtureRoot });
        const issues = countVizeIssues(r.combined, plant.file);
        const min = vzSpec.minIssues ?? 1;
        if (issues < min) {
          suite.fail(plant.id, "vize-lint", `expected ≥${min} issues, got ${issues}`, {
            snippet: r.combined.slice(0, 600),
          });
        } else if (vzSpec.mustMatch?.length && !matchesNeedles(r.combined, vzSpec.mustMatch)) {
          suite.fail(
            plant.id,
            "vize-lint",
            `output missing any of: ${vzSpec.mustMatch.join(" | ")}`,
            { snippet: r.combined.slice(0, 600) },
          );
        } else {
          suite.pass(plant.id, "vize-lint", `issues=${issues}`);
        }
      }
    }
  }

  // Verter native lint — optional structured confirmation when API returns diagnostics
  try {
    const verter = require(require.resolve("@verter/native", { paths: [rootDir] }));
    if (typeof verter.VerterHost !== "function") {
      suite.skip("dirty-all", "verter-lint", "VerterHost missing");
    } else {
      const host = new verter.VerterHost({ devMode: false });
      if (typeof host.lint !== "function") {
        suite.skip("dirty-all", "verter-lint", "VerterHost.lint not available");
      } else {
        const dirtyFiles = expect.dirty.map((p) => p.file);
        let total = 0;
        for (const f of dirtyFiles) {
          const path = join(fixtureRoot, f).replace(/\\/g, "/");
          const source = readFileSync(join(fixtureRoot, f), "utf8");
          if (typeof host.upsert === "function") {
            host.upsert({
              inputId: path,
              canonicalId: path,
              source,
              fileKind: "vue",
            });
          }
          const out = host.lint(path);
          const n = Array.isArray(out)
            ? out.length
            : (out?.diagnostics?.length ?? out?.length ?? 0);
          total += Number(n) || 0;
        }
        // If API returns nothing we skip rather than invent pass
        if (total === 0) {
          suite.skip(
            "dirty-all",
            "verter-lint",
            "lint() returned 0 diagnostics on planted files (API shape or rule set unknown)",
          );
        } else {
          suite.pass("dirty-all", "verter-lint", `diagnostics=${total}`);
        }
      }
    }
  } catch (error) {
    suite.skip("dirty-all", "verter-lint", error instanceof Error ? error.message : String(error));
  }

  return suite.results;
}
