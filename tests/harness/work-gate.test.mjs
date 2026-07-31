/**
 * Work-gate contract: scripts/lib/work-gate.mjs
 *
 * This is where the false-passes lived, so it gets the most coverage. Every
 * "tool" here is a fake CLI (node running a canned-output script), which makes
 * the gate's accept/reject decisions fully deterministic — no real compiler,
 * no timing dependency.
 */
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";

import {
  applyFileCoverageGate,
  applyWorkGate,
  cliReportsPlantedIssue,
  corpusGateFor,
  countCoveredFiles,
  dirtyForCoverage,
  formatterRewritesTemplate,
  plantForCoverage,
  prepareCorpusPlant,
  prepareFormatPlant,
  prepareLintPlant,
  prepareTypecheckPlant,
  typecheckGateDetail,
  typecheckGateFor,
} from "../../scripts/lib/work-gate.mjs";
import { OXLINT_CONFIG, prepareTypecheckDir } from "../../scripts/lib/fixtures.mjs";
import {
  depthOf,
  makeFakeTool,
  makeFixtureDir,
  makeTempDir,
  removeDir,
  repoRoot,
  unresolvableTypePackages,
} from "./helpers.mjs";

// Canned tool output. `Bad.vue` is the filename both typecheck plants use.
const PLANTED_DIAGNOSTIC = "Bad.vue(3,7): error TS2322: Type 'string' is not assignable to type 'number'.";
const PLANTED_TEMPLATE_DIAGNOSTIC =
  "Bad.vue(7,32): error TS2322: Type 'string' is not assignable to type 'boolean'.";
// The exact shape of the false pass that made the gate stop gating: a project
// error that has nothing to do with the plant.
const UNRELATED_PROJECT_ERROR = "golar.config.ts(1,30): error TS2307: Cannot find module 'golar/unstable'.";

describe("cliReportsPlantedIssue", () => {
  let host;

  before(() => {
    host = makeTempDir("cli-gate-");
  });

  after(() => removeDir(host));

  const run = (spec, extra = {}) => {
    const { bin, args } = makeFakeTool(host, spec);
    return cliReportsPlantedIssue({ bin, args, cwd: host, mustMention: "Bad.vue", ...extra });
  };

  test("accepts a real planted diagnostic that names the planted file", () => {
    assert.equal(run({ default: { stdout: PLANTED_DIAGNOSTIC, code: 1 } }), true);
  });

  test("accepts a planted diagnostic reported on stderr", () => {
    assert.equal(run({ default: { stderr: PLANTED_DIAGNOSTIC, code: 2 } }), true);
  });

  test("REJECTS an unrelated project error that never names the planted file", () => {
    // Regression guard: this exact output used to satisfy the gate, so a
    // module-resolution failure in golar.config.ts read as "tool found the bug".
    assert.equal(run({ default: { stdout: UNRELATED_PROJECT_ERROR, code: 1 } }), false);
  });

  test("mustMention is the thing closing that hole", () => {
    // Same output, no mustMention: still accepted. Documents WHY mustMention
    // exists — drop it and the gate silently stops gating.
    const { bin, args } = makeFakeTool(host, { default: { stdout: UNRELATED_PROJECT_ERROR, code: 1 } });
    assert.equal(cliReportsPlantedIssue({ bin, args, cwd: host }), true);
  });

  test("REJECTS clean output", () => {
    assert.equal(run({ default: { code: 0 } }), false);
  });

  test("REJECTS output that names the planted file but reports 0 errors", () => {
    assert.equal(run({ default: { stdout: "Checking Bad.vue\nFound 0 errors.", code: 0 } }), false);
  });

  test("REJECTS a genuine diagnostic raised against some other file", () => {
    assert.equal(
      run({ default: { stdout: "Other.vue(1,1): error TS2322: Type 'x' is not assignable.", code: 1 } }),
      false,
    );
  });

  test("an N-error summary is not misread as '0 errors'", () => {
    // "Found 10 errors" contains the substring "0 errors"; without a word
    // boundary the zero-error guard swallows every count ending in 0.
    assert.equal(run({ default: { stdout: "Bad.vue:3:7 plant found\nFound 10 errors.", code: 0 } }), true);
    assert.equal(run({ default: { stdout: "Bad.vue:3:7 plant found\nFound 20 errors.", code: 0 } }), true);
    assert.equal(run({ default: { stdout: "Bad.vue:3:7 plant found\nFound 3 errors.", code: 0 } }), true);
  });

  test("accepts a lint-style severity marker for the v-html plant", () => {
    const { bin, args } = makeFakeTool(host, {
      default: { stdout: "Dirty.vue:6:8 ⚠ vue/no-v-html", code: 0 },
    });
    assert.equal(cliReportsPlantedIssue({ bin, args, cwd: host, mustMention: "Dirty.vue" }), true);
  });

  test("expectErrors:false inverts the contract to 'must exit clean'", () => {
    assert.equal(run({ default: { code: 0 } }, { expectErrors: false, mustMention: undefined }), true);
    assert.equal(run({ default: { code: 1 } }, { expectErrors: false, mustMention: undefined }), false);
  });

  test("a missing binary is a failure, not a pass", () => {
    assert.equal(cliReportsPlantedIssue({ bin: null, args: [], cwd: host }), false);
    assert.equal(cliReportsPlantedIssue({ bin: "", args: [], cwd: host, mustMention: "Bad.vue" }), false);
  });

  test("a tool that cannot be spawned is a failure, not a pass", () => {
    assert.equal(
      cliReportsPlantedIssue({
        bin: join(host, "definitely-not-a-real-binary"),
        args: [],
        cwd: host,
        mustMention: "Bad.vue",
      }),
      false,
    );
  });
});

describe("prepareTypecheckPlant", () => {
  let workRoot;
  let plant;

  before(() => {
    workRoot = makeTempDir("plant-");
    plant = prepareTypecheckPlant(workRoot);
  });

  after(() => {
    plant?.cleanup();
    removeDir(workRoot);
  });

  test("creates independent script and template plant projects", () => {
    assert.ok(existsSync(plant.scriptDir));
    assert.ok(existsSync(plant.templateDir));
    assert.notEqual(plant.scriptDir, plant.templateDir);
    assert.equal(plant.dir, plant.scriptDir, "back-compat single-dir accessor");

    for (const dir of [plant.scriptDir, plant.templateDir]) {
      for (const file of ["Bad.vue", "tsconfig.json", "env.d.ts", "package.json"]) {
        assert.ok(existsSync(join(dir, file)), `${basename(dir)}/${file} missing`);
      }
    }
  });

  test("the template plant has a clean script block — the error is template-only", () => {
    const scriptPlant = readFileSync(join(plant.scriptDir, "Bad.vue"), "utf8");
    const templatePlant = readFileSync(join(plant.templateDir, "Bad.vue"), "utf8");

    assert.notEqual(scriptPlant, templatePlant, "the two plants must not be the same file");
    assert.match(scriptPlant, /const n: number = "not-a-number"/, "script plant needs a script-level error");
    assert.doesNotMatch(
      templatePlant,
      /: number = "/,
      "template plant must not smuggle in a script-level error",
    );
    assert.match(templatePlant, /:disabled=/, "template plant needs a template-expression error");
  });

  test("both plants enable strictTemplates, without which the template plant is invisible", () => {
    for (const dir of [plant.scriptDir, plant.templateDir]) {
      const tsconfig = JSON.parse(readFileSync(join(dir, "tsconfig.json"), "utf8"));
      assert.equal(tsconfig.vueCompilerOptions?.strictTemplates, true, `${basename(dir)} lost strictTemplates`);
    }
  });

  test("plant tsconfigs request no unresolvable type packages", () => {
    for (const dir of [plant.scriptDir, plant.templateDir]) {
      const tsconfig = JSON.parse(readFileSync(join(dir, "tsconfig.json"), "utf8"));
      assert.deepEqual(
        unresolvableTypePackages(dir, tsconfig.compilerOptions?.types ?? []),
        [],
        `${basename(dir)}/tsconfig.json lists a type package that is not installed`,
      );
    }
  });
});

describe("typecheckGateDetail — both halves are required", () => {
  let workRoot;
  let host;
  let plant;

  before(() => {
    workRoot = makeTempDir("gate-");
    host = makeTempDir("gate-host-");
    plant = prepareTypecheckPlant(workRoot);
  });

  after(() => {
    plant?.cleanup();
    removeDir(host);
    removeDir(workRoot);
  });

  const gate = (spec) => {
    const { bin, args } = makeFakeTool(host, spec);
    return typecheckGateDetail(bin, args, plant);
  };

  // Template capability is gated as two independent single-error plants, so a
  // tool must find EVERY planted error rather than whichever half it supports.
  const ALL_PLANTS = [
    { cwdBasename: "script", stdout: PLANTED_DIAGNOSTIC, code: 1 },
    { cwdBasename: "template-prop", stdout: PLANTED_TEMPLATE_DIAGNOSTIC, code: 1 },
    { cwdBasename: "template-event", stdout: PLANTED_TEMPLATE_DIAGNOSTIC, code: 1 },
  ];

  test("a tool that reports on every plant passes", () => {
    const detail = gate({ rules: ALL_PLANTS, default: { code: 0 } });

    assert.deepEqual(detail, {
      ok: true,
      script: true,
      template: true,
      templateProp: true,
      templateEvent: true,
    });
  });

  test("finding only ONE of the two template errors fails the gate", () => {
    // The real case this guards: a checker that reports the @click handler
    // mismatch but silently misses the :disabled prop-type mismatch. Under a
    // gate that accepted "at least one diagnostic" it earned a ✓ and was
    // ranked ~10x faster than vue-tsc while doing strictly less checking.
    const detail = gate({
      rules: [
        { cwdBasename: "script", stdout: PLANTED_DIAGNOSTIC, code: 1 },
        { cwdBasename: "template-event", stdout: PLANTED_TEMPLATE_DIAGNOSTIC, code: 1 },
      ],
      default: { stdout: "No issues found.", code: 0 },
    });

    assert.equal(detail.templateEvent, true);
    assert.equal(detail.templateProp, false);
    assert.equal(detail.template, false);
    assert.equal(detail.ok, false);
  });

  test("a tool that only reports the SCRIPT plant fails the gate", () => {
    // This is the tool that extracts <script> blocks and shells out to tsc:
    // it looks like a Vue typechecker on the script plant and does none of the
    // template work that dominates real vue-tsc cost.
    const detail = gate({
      rules: [{ cwdBasename: "script", stdout: PLANTED_DIAGNOSTIC, code: 1 }],
      default: { stdout: "No issues found.", code: 0 },
    });

    assert.equal(detail.script, true);
    assert.equal(detail.template, false);
    assert.equal(detail.ok, false);
  });

  test("a tool that only reports the TEMPLATE plants fails the gate", () => {
    const detail = gate({
      rules: [
        { cwdBasename: "template-prop", stdout: PLANTED_TEMPLATE_DIAGNOSTIC, code: 1 },
        { cwdBasename: "template-event", stdout: PLANTED_TEMPLATE_DIAGNOSTIC, code: 1 },
      ],
      default: { stdout: "No issues found.", code: 0 },
    });

    assert.equal(detail.script, false);
    assert.equal(detail.template, true);
    assert.equal(detail.ok, false);
  });

  test("an unrelated project error in every plant fails the gate", () => {
    const detail = gate({ default: { stdout: UNRELATED_PROJECT_ERROR, code: 1 } });

    assert.deepEqual(detail, {
      ok: false,
      script: false,
      template: false,
      templateProp: false,
      templateEvent: false,
    });
  });

  test("a missing binary or missing plant dirs fail closed", () => {
    assert.equal(typecheckGateDetail(null, [], plant).ok, false);
    assert.equal(
      typecheckGateDetail(process.execPath, ["-e", ""], {
        scriptDir: join(host, "nope"),
        templateDir: join(host, "nope"),
      }).ok,
      false,
    );
  });

  test("typecheckGateFor is the boolean projection of typecheckGateDetail", () => {
    const { bin, args } = makeFakeTool(host, { rules: ALL_PLANTS, default: { code: 0 } });

    assert.equal(typecheckGateFor(bin, args, plant), typecheckGateDetail(bin, args, plant).ok);
    assert.equal(typecheckGateFor(bin, args, plant), true);
  });
});

describe("prepareCorpusPlant", () => {
  let fixture;
  let workRoot;
  let host;
  let checkDir;
  let corpusPlant;

  before(() => {
    fixture = makeFixtureDir(3);
    workRoot = makeTempDir("corpus-");
    host = makeTempDir("corpus-host-");
    checkDir = prepareTypecheckDir(fixture.dir, fixture.files, workRoot, `n${fixture.files.length}`);
    corpusPlant = prepareCorpusPlant(checkDir);
  });

  after(() => {
    corpusPlant?.cleanup();
    removeDir(host);
    removeDir(workRoot);
    removeDir(fixture.dir);
  });

  test("the plant copy sits at the SAME directory depth as the source project", () => {
    // Regression guard: the copy used to land at a different depth. Because
    // prepareTypecheckDir writes a RELATIVE compilerOptions.paths.vue, the
    // depth change broke `vue` resolution, template typechecking silently
    // degraded to nothing, and every tool failed the gate for the wrong reason.
    assert.equal(dirname(corpusPlant.dir), dirname(checkDir), "plant must be a sibling of checkDir");
    assert.equal(depthOf(corpusPlant.dir), depthOf(checkDir), "plant must be at the same path depth");
    assert.notEqual(corpusPlant.dir, checkDir, "plant must be a copy, not the timed project itself");
  });

  test("the copied relative paths.vue still resolves to the real node_modules/vue", () => {
    const sourceConfig = JSON.parse(readFileSync(join(checkDir, "tsconfig.json"), "utf8"));
    const plantConfig = JSON.parse(readFileSync(join(corpusPlant.dir, "tsconfig.json"), "utf8"));

    const relativeVue = plantConfig.compilerOptions?.paths?.vue?.[0];
    assert.ok(relativeVue, "the copied tsconfig lost compilerOptions.paths.vue");
    assert.equal(relativeVue, sourceConfig.compilerOptions.paths.vue[0], "paths.vue was rewritten by the copy");
    assert.ok(relativeVue.startsWith("."), `paths.vue should stay relative, got ${relativeVue}`);

    const resolved = resolve(corpusPlant.dir, relativeVue);
    assert.ok(existsSync(resolved), `paths.vue does not resolve from the plant dir: ${resolved}`);
    assert.ok(existsSync(join(resolved, "package.json")), "paths.vue must point at a real vue package");
    assert.equal(resolved, join(repoRoot, "node_modules", "vue"));
  });

  test("the planted file is written and added to tsconfig.include", () => {
    assert.equal(corpusPlant.plantedFile, "__WorkGatePlant.vue");
    const planted = join(corpusPlant.dir, corpusPlant.plantedFile);
    assert.ok(existsSync(planted));
    assert.match(readFileSync(planted, "utf8"), /const n: number = "not-a-number"/);

    const tsconfig = JSON.parse(readFileSync(join(corpusPlant.dir, "tsconfig.json"), "utf8"));
    assert.ok(
      tsconfig.include.includes(corpusPlant.plantedFile),
      `include ${JSON.stringify(tsconfig.include)} is missing the plant`,
    );
  });

  test("strictTemplates is forced on the copied tsconfig", () => {
    const tsconfig = JSON.parse(readFileSync(join(corpusPlant.dir, "tsconfig.json"), "utf8"));
    assert.equal(tsconfig.vueCompilerOptions?.strictTemplates, true);
  });

  test("the whole timed corpus travels with the plant", () => {
    for (const file of fixture.files) {
      assert.ok(existsSync(join(corpusPlant.dir, file)), `${file} missing from the corpus copy`);
    }
    assert.ok(existsSync(join(corpusPlant.dir, "env.d.ts")));
    assert.ok(existsSync(join(corpusPlant.dir, "package.json")));
  });

  test("corpusGateFor requires the diagnostic to name the planted file", () => {
    const found = makeFakeTool(host, {
      default: { stdout: `${corpusPlant.plantedFile}(2,7): error TS2322: not assignable`, code: 1 },
    });
    const unrelated = makeFakeTool(host, { default: { stdout: UNRELATED_PROJECT_ERROR, code: 1 } });
    const otherCorpusFile = makeFakeTool(host, {
      default: { stdout: `${fixture.files[0]}(1,1): error TS2322: not assignable`, code: 1 },
    });

    assert.equal(corpusGateFor(found.bin, found.args, corpusPlant), true);
    assert.equal(corpusGateFor(unrelated.bin, unrelated.args, corpusPlant), false);
    assert.equal(
      corpusGateFor(otherCorpusFile.bin, otherCorpusFile.args, corpusPlant),
      false,
      "a diagnostic on some other corpus file must not satisfy the corpus gate",
    );
  });

  test("corpusGateFor fails closed on a missing bin or missing dir", () => {
    assert.equal(corpusGateFor(null, [], corpusPlant), false);
    assert.equal(corpusGateFor(process.execPath, ["-e", ""], { dir: join(host, "nope"), plantedFile: "x.vue" }), false);
    assert.equal(corpusGateFor(process.execPath, ["-e", ""], null), false);
  });

  test("cleanup removes the plant copy but leaves the timed project alone", () => {
    const scratchFixture = makeFixtureDir(1);
    const scratchWork = makeTempDir("corpus-cleanup-");
    try {
      const dir = prepareTypecheckDir(scratchFixture.dir, scratchFixture.files, scratchWork, "n1");
      const plant = prepareCorpusPlant(dir);
      assert.ok(existsSync(plant.dir));
      plant.cleanup();
      assert.ok(!existsSync(plant.dir), "cleanup must remove the plant copy");
      assert.ok(existsSync(dir), "cleanup must not touch the timed project");
    } finally {
      removeDir(scratchWork);
      removeDir(scratchFixture.dir);
    }
  });
});

describe("prepareLintPlant", () => {
  let workRoot;
  let plant;

  before(() => {
    workRoot = makeTempDir("lint-plant-");
    plant = prepareLintPlant(workRoot);
  });

  after(() => {
    plant?.cleanup();
    removeDir(workRoot);
  });

  test("writes a dirty SFC and a config that makes the plant an error", () => {
    assert.ok(existsSync(plant.dirtyFile));
    assert.match(readFileSync(plant.dirtyFile, "utf8"), /v-html/);

    const config = readFileSync(join(plant.dir, "eslint.config.mjs"), "utf8");
    assert.match(config, /"vue\/no-v-html": "error"/);
  });

  test("carries the same oxlint config the timed corpus uses", () => {
    // The gate must judge the configuration that is measured. Run the plant on
    // oxlint's stock defaults and "misses the plant" becomes a statement about
    // the gate (vue plugin off) rather than about the tool.
    const gate = readFileSync(join(plant.dir, ".oxlintrc.json"), "utf8");
    assert.equal(gate, OXLINT_CONFIG);
    assert.ok(JSON.parse(gate).plugins.includes("vue"));
  });
});

describe("prepareFormatPlant + formatterRewritesTemplate", () => {
  let workRoot;
  let plant;

  /**
   * A fake formatter that rewrites the plant file in cwd according to `mode`.
   * The real distinction the gate exists to draw — whole-SFC vs script-only —
   * is reproduced here without depending on any installed formatter.
   */
  function fakeFormatter(mode) {
    const script = join(workRoot, `fake-fmt-${mode}.cjs`);
    writeFileSync(
      script,
      `const { readFileSync, writeFileSync, readdirSync, statSync } = require("node:fs");
const { join } = require("node:path");
// RECURSIVE, like a well-behaved formatter: the plant nests its probe so a
// non-recursive tool invocation fails the gate instead of "formatting" an
// empty match set (the fault that ranked Prettier 1.00x on every nested
// corpus while it formatted zero files).
function find(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      const hit = find(p);
      if (hit) return hit;
    } else if (entry === "Messy.vue") return p;
  }
  return null;
}
const target = find(process.cwd());
const src = readFileSync(target, "utf8");
const mode = ${JSON.stringify(mode)};
if (mode === "crash") process.exit(3);
if (mode === "noop") process.exit(0);
// Script-only: collapse runs of spaces INSIDE <script> and nowhere else.
let out = src.replace(/<script([^>]*)>([\\s\\S]*?)<\\/script>/i, (m, attrs, body) =>
  "<script" + attrs + ">" + body.replace(/[ \\t]{2,}/g, " ") + "</script>");
if (mode === "whole") {
  // Whole-SFC: also normalise the template block.
  out = out.replace(/<template([^>]*)>([\\s\\S]*?)<\\/template>/i, (m, attrs, body) =>
    "<template" + attrs + ">" + body.replace(/[ \\t]{2,}/g, " ") + "</template>");
}
writeFileSync(target, out);
`,
    );
    return { bin: process.execPath, args: [script] };
  }

  before(() => {
    workRoot = makeTempDir("format-plant-");
    plant = prepareFormatPlant(workRoot);
  });

  after(() => {
    plant?.cleanup();
    removeDir(workRoot);
  });

  test("the plant dir is created and the probe is NESTED", () => {
    assert.ok(existsSync(plant.dir));
    // Nested on purpose: real corpora are nested, and a formatter invoked with
    // a non-recursive pattern matches nothing there — a root-level probe still
    // passed it while it formatted zero timed files (2026-07-30 audit,
    // finding 1). Verified live: with this layout `prettier --write *.vue`
    // fails the gate and `prettier --write **/*.vue` passes it.
    assert.equal(plant.file, join("nested", "Messy.vue"));
  });

  test("a whole-SFC formatter passes the gate", () => {
    const tool = fakeFormatter("whole");
    assert.equal(
      formatterRewritesTemplate(plant, { bin: tool.bin, args: tool.args, label: "whole" }),
      true,
    );
  });

  test("a script-only formatter FAILS the gate even though it did rewrite the file", () => {
    const tool = fakeFormatter("script");
    // The script block really is reformatted — this is exactly the tool shape
    // (Biome) that would otherwise rank fastest for doing less work.
    const dir = join(plant.dir, "script");
    assert.equal(
      formatterRewritesTemplate(plant, { bin: tool.bin, args: tool.args, label: "script" }),
      false,
    );
    const after = readFileSync(join(dir, plant.file), "utf8");
    assert.match(after, /const msg = 'hello'/, "the script block was rewritten");
    assert.match(after, /<div {4}class="a"/, "the template block was left untouched");
  });

  test("a no-op tool fails closed", () => {
    const tool = fakeFormatter("noop");
    assert.equal(
      formatterRewritesTemplate(plant, { bin: tool.bin, args: tool.args, label: "noop" }),
      false,
    );
  });

  test("a crashing tool fails closed rather than throwing", () => {
    const tool = fakeFormatter("crash");
    assert.equal(
      formatterRewritesTemplate(plant, { bin: tool.bin, args: tool.args, label: "crash" }),
      false,
    );
  });

  test("a missing bin fails closed", () => {
    assert.equal(formatterRewritesTemplate(plant, { bin: null, args: [], label: "none" }), false);
  });

  test("configFiles are written next to the plant so the gate uses the timed config", () => {
    const tool = fakeFormatter("whole");
    formatterRewritesTemplate(plant, {
      bin: tool.bin,
      args: tool.args,
      label: "cfg",
      configFiles: { "biome.json": '{"formatter":{"enabled":true}}\n' },
    });
    assert.ok(existsSync(join(plant.dir, "cfg", "biome.json")));
  });

  test("each label gets an isolated run dir, so one tool cannot see another's output", () => {
    const whole = fakeFormatter("whole");
    formatterRewritesTemplate(plant, { bin: whole.bin, args: whole.args, label: "iso-a" });
    // A second tool must still meet a pristine messy plant, not the formatted
    // leftovers of the first — otherwise gate order would decide the verdict.
    const noop = fakeFormatter("noop");
    assert.equal(
      formatterRewritesTemplate(plant, { bin: noop.bin, args: noop.args, label: "iso-b" }),
      false,
    );
    assert.match(readFileSync(join(plant.dir, "iso-b", plant.file), "utf8"), /<div {4}class="a"/);
  });
});

describe("applyWorkGate", () => {
  test("marks failing variants unranked (NOT skipped) and annotates the notes", () => {
    const variants = [
      { id: "pass", label: "Pass", notes: "original note" },
      { id: "fail", label: "Fail", notes: "original note" },
    ];

    const out = applyWorkGate(variants, (v) => v.id === "pass");

    assert.equal(out, variants, "applyWorkGate mutates and returns the same array");
    const [pass, fail] = variants;

    assert.equal(pass.unranked, undefined, "a passing variant must stay ranked");
    assert.equal(pass.notes, "original note", "a passing variant's notes must be untouched");

    assert.equal(fail.unranked, true);
    // Must NOT be skipped: a gate failure still gets measured so its time can
    // be shown in brackets beside the reason. Skipping it hid the trade-off.
    assert.notEqual(fail.skip, true, "a gate failure must still be measured");
    assert.match(fail.notes, /FAILED VALIDATION/);
    assert.match(fail.notes, /original note/, "the original note must be preserved");
  });

  test("a gate function that throws is a failure, not a pass", () => {
    const variants = [
      {
        id: "boom",
        label: "Boom",
        notes: "",
      },
    ];

    applyWorkGate(variants, () => {
      throw new Error("gate exploded");
    });

    assert.equal(variants[0].unranked, true);
    assert.match(variants[0].notes, /FAILED VALIDATION/);
  });

  test("already-skipped variants are left alone and never re-gated", () => {
    let calls = 0;
    const variants = [{ id: "missing", label: "Missing", skip: true, notes: "Binary not found" }];

    applyWorkGate(variants, () => {
      calls += 1;
      return true;
    });

    assert.equal(calls, 0, "a pre-skipped variant must not be gated");
    assert.equal(variants[0].notes, "Binary not found", "its note must not be rewritten");
  });

  test("a falsy gate result (undefined) is treated as a failure", () => {
    const variants = [{ id: "x", label: "X", notes: "" }];

    applyWorkGate(variants, () => undefined);

    assert.equal(variants[0].unranked, true);
  });
});

/**
 * Same-file-set enforcement. Tools processing different file sets are not
 * apples-to-apples — Prettier's non-recursive glob formatted ZERO files on
 * every nested corpus and ranked 1.00x. The census plants an issue every tool
 * must react to in EVERY corpus file, so "never named / never rewritten"
 * means "never visited".
 */
describe("file-coverage census", () => {
  test("dirtyForCoverage makes every non-blank line non-conformant", () => {
    const out = dirtyForCoverage("<template>\n  <div/>\n\n</template>\n");
    assert.match(out, /<div\/> {3}\n/, "trailing spaces on content lines");
    assert.match(out, /\n\n\n\n<\/template>/, "blank-line stack before the closing tag");
    assert.doesNotMatch(out, /^ {3}$/m, "blank lines stay blank — some formatters preserve them");
  });

  test("plantForCoverage reaches script-only, template-only and full SFCs", () => {
    const full = plantForCoverage("<template><a/></template>\n<script>x</script>");
    assert.match(full, /<script>\ndebugger;/);
    assert.match(full, /v-html/);

    const scriptOnly = plantForCoverage("<script setup>const a = 1</script>");
    assert.match(scriptOnly, /<script setup>\ndebugger;/);
    assert.doesNotMatch(scriptOnly, /v-html/);

    const templateOnly = plantForCoverage("<template><a/></template>");
    assert.match(templateOnly, /v-html/);
    assert.match(templateOnly, /<script>\ndebugger;\n<\/script>/, "gains a script block so no file is plant-free");
  });

  test("countCoveredFiles survives ANSI-wrapped names and JSON-escaped absolute paths", () => {
    const rels = ["Comp0.vue", "nested/Comp1.vue"];
    // vize colours filenames; the escape sequence ends in a word char right
    // before the name.
    const ansi = "\u001b[38;2;92;157;255;1mComp0.vue\u001b[0m:3:6\n╭─[\u001b[1mnested/Comp1.vue\u001b[0m:1:1]";
    assert.equal(countCoveredFiles(ansi, rels).covered, 2);

    // eslint --format json escapes backslashes, leaving "//" after naive
    // normalisation.
    const json = String.raw`[{"filePath":"D:\\work\\lint\\cov\\Comp0.vue"},{"filePath":"D:\\work\\lint\\cov\\nested\\Comp1.vue"}]`;
    assert.equal(countCoveredFiles(json, rels, { absPrefix: String.raw`D:\work\lint\cov` }).covered, 2);
  });

  test("a nested mention does not satisfy a root file of the same basename", () => {
    // Real corpora repeat basenames constantly (index.vue everywhere); a
    // substring match would mark the root file covered because a NESTED one
    // was mentioned, and the gate would sleep through a skipped file.
    const { covered, missing } = countCoveredFiles("warning at nested/index.vue:1:1", [
      "index.vue",
      "nested/index.vue",
    ]);
    assert.equal(covered, 1);
    assert.deepEqual(missing, ["index.vue"]);
  });

  test("the gate unranks partial coverage, keeps earlier verdicts, discloses the rest", () => {
    const rows = [
      { id: "full", status: "ok", notes: "n" },
      { id: "partial", status: "ok", notes: "n" },
      { id: "already-unranked", status: "unranked", notes: "n" },
      { id: "constructed", status: "ok", notes: "n" },
      { id: "unprobed", status: "ok", notes: "n" },
    ];
    const coverage = new Map([
      ["full", { covered: 50, corpus: 50, extras: ["biome.json"] }],
      ["partial", { covered: 33, corpus: 50 }],
      ["already-unranked", { covered: 0, corpus: 50 }],
      ["constructed", { covered: 50, corpus: 50, byConstruction: true }],
      ["unprobed", { covered: null, corpus: 50, error: "spawn failed" }],
    ]);
    applyFileCoverageGate(rows, coverage, { verb: "named", what: "planted corpus files" });

    assert.equal(rows[0].status, "ok");
    assert.match(rows[0].notes, /file coverage verified: named 50\/50/);
    assert.match(rows[0].notes, /also touched: biome\.json/, "walk extras disclosed, not gated");

    assert.equal(rows[1].status, "unranked");
    assert.match(rows[1].notes, /FAILED FILE-COVERAGE GATE — named 33 of 50/);

    assert.equal(rows[2].status, "unranked", "an earlier verdict stands");
    assert.match(rows[2].notes, /file-coverage census: named 0 of 50/);
    assert.doesNotMatch(rows[2].notes, /FAILED FILE-COVERAGE GATE/, "no second gate verdict on top");

    assert.match(rows[3].notes, /by construction/);
    assert.match(rows[4].notes, /FILE COVERAGE UNVERIFIED/);
    assert.equal(rows[4].status, "ok", "unverified warns, it does not convict");
  });
});
