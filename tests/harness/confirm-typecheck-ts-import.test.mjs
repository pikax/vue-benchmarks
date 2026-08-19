/**
 * Guards the .ts-imports-.vue confirm plants against silent extra-tsconfig
 * help for one tool.
 *
 * vue-tsc / vize / golar resolve `import "./Child.vue"` from a .ts file on
 * the shared tsconfig. verter-tsc has been observed not to. Adding
 * allowArbitraryExtensions + allowImportingTsExtensions for everyone would
 * hide that. Extra flags, if applied, must be isolated to verter-tsc and
 * scored as warn, never as a silent pass.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { repoRoot } from "./helpers.mjs";
import {
  VERTER_TS_IMPORT_EXTRA_COMPILER_OPTIONS,
  VERTER_TS_IMPORT_EXTRA_KEYS,
  verterExtraTsconfigWarning,
  verterSkippedTsImporter,
} from "../confirm/lib/ts-import-vue.mjs";
import { createSuite, formatReport, summarize } from "../confirm/lib/harness.mjs";
import { countErrors, parseDiagnostics, scoreDiagnostics } from "../confirm/lib/diagnostics.mjs";
import { findExpectErrorPins } from "../confirm/lib/plant-pins.mjs";
import {
  formatMs,
  formatRss,
  formatRunnerLine,
  formatTypecheckDoc,
  formatTypecheckReadmeSummary,
} from "../confirm/lib/typecheck-doc.mjs";
import { runCliMeasured } from "../confirm/lib/run-cli.mjs";
import { scoreFallthroughPair } from "../confirm/lib/fallthrough-attrs.mjs";

const sharedTsconfig = join(
  repoRoot,
  "tests/confirm/fixtures/typecheck/_shared/tsconfig.base.json",
);

describe("shared typecheck tsconfig is not specialised for verter-tsc", () => {
  const cfg = JSON.parse(readFileSync(sharedTsconfig, "utf8"));

  test("does not set allowArbitraryExtensions", () => {
    assert.equal(cfg.compilerOptions.allowArbitraryExtensions, undefined);
  });

  test("does not set allowImportingTsExtensions", () => {
    assert.equal(cfg.compilerOptions.allowImportingTsExtensions, undefined);
  });

  test("does not set fallthroughAttributes (that option is case-local)", () => {
    assert.equal(cfg.vueCompilerOptions?.fallthroughAttributes, undefined);
  });

  test("fallthrough-root cases do not ship a tsconfig that silently enables fallthroughAttributes", () => {
    for (const id of ["fallthrough-mono-ok", "generic-fallthrough-mono-ok"]) {
      assert.equal(
        existsSync(join(repoRoot, "tests/confirm/fixtures/typecheck/cases", id, "tsconfig.json")),
        false,
        `${id}/tsconfig.json would apply fallthroughAttributes without a warn`,
      );
    }
  });

  test("ts-import-vue cases do not ship a tsconfig overlay that would apply extra flags to every tool", () => {
    for (const id of ["ts-import-vue-bad", "ts-import-vue-ok"]) {
      assert.equal(
        existsSync(join(repoRoot, "tests/confirm/fixtures/typecheck/cases", id, "tsconfig.json")),
        false,
        `${id}/tsconfig.json would be merged into the shared config for every tool`,
      );
    }
  });

  test("ts-import-vue cases declare tsImporter so the suite can isolate the verter retry", () => {
    for (const id of ["ts-import-vue-bad", "ts-import-vue-ok"]) {
      const meta = JSON.parse(
        readFileSync(join(repoRoot, "tests/confirm/fixtures/typecheck/cases", id, "meta.json"), "utf8"),
      );
      assert.equal(meta.tsImporter, "main.ts");
    }
  });
});

describe("verterSkippedTsImporter", () => {
  test("true when verter only reports a .vue census and never names the importer", () => {
    assert.equal(
      verterSkippedTsImporter("verter-tsc: checking 1 .vue file(s)...\n", "main.ts"),
      true,
    );
  });

  test("false when the .ts importer appears in the output", () => {
    assert.equal(
      verterSkippedTsImporter(
        "verter-tsc: checking 1 .vue file(s)...\nmain.ts(5,1): error TS2578: Unused '@ts-expect-error' directive.\n",
        "main.ts",
      ),
      false,
    );
  });

  test("false for other tools' silent or named success (not a .vue census)", () => {
    assert.equal(verterSkippedTsImporter("", "main.ts"), false);
    assert.equal(verterSkippedTsImporter("Type checked 4 files\nNo type errors found!\n", "main.ts"), false);
  });
});

describe("verter extra-tsconfig disclosure", () => {
  test("names the flags other tools do not need", () => {
    assert.deepEqual(VERTER_TS_IMPORT_EXTRA_KEYS.sort(), [
      "allowArbitraryExtensions",
      "allowImportingTsExtensions",
    ]);
    assert.equal(VERTER_TS_IMPORT_EXTRA_COMPILER_OPTIONS.allowArbitraryExtensions, true);
    assert.equal(VERTER_TS_IMPORT_EXTRA_COMPILER_OPTIONS.allowImportingTsExtensions, true);
  });

  test("retry-still-skipped says the plant was not exercised", () => {
    const msg = verterExtraTsconfigWarning("main.ts", "retry-still-skipped");
    assert.match(msg, /EXTRA TSCONFIG/);
    assert.match(msg, /allowArbitraryExtensions/);
    assert.match(msg, /allowImportingTsExtensions/);
    assert.match(msg, /other tools do not need these/);
    assert.match(msg, /was not exercised/);
  });

  test("retry-passed is a warn disclosure, not a silent pass", () => {
    const msg = verterExtraTsconfigWarning("main.ts", "retry-passed", "clean");
    assert.match(msg, /Plant scored only after that extra config/);
    assert.match(msg, /clean/);
  });
});

describe("scoreFallthroughPair", () => {
  const ok = { ok: true, message: "clean" };
  const bad = { ok: false, message: "expected ≥1 error(s), got 0" };

  test("shared+extra ok is a pass, not a warn", () => {
    const r = scoreFallthroughPair(ok, ok);
    assert.equal(r.status, "pass");
  });

  test("needing fallthroughAttributes is a warn, not a pass", () => {
    const r = scoreFallthroughPair(bad, ok);
    assert.equal(r.status, "warn");
    assert.match(r.message, /EXTRA VUE COMPILER OPTION/);
    assert.match(r.message, /not default/);
  });

  test("shared pass + extra miss is a fail (opt-in revealed the gap)", () => {
    const r = scoreFallthroughPair(ok, bad);
    assert.equal(r.status, "fail");
    assert.match(r.message, /plant was missed/);
  });

  test("failing both ways is a fail", () => {
    const r = scoreFallthroughPair(bad, bad);
    assert.equal(r.status, "fail");
  });
});

describe("typecheck.md generator", () => {
  test("renders a matrix and does not treat warn as a pass", () => {
    const runner = {
      label: "Linux",
      platform: "linux",
      arch: "x64",
      cpuCount: 4,
      cpuModel: "Test CPU",
      totalmem: 16 * 1024 ** 3,
      node: "v22.0.0",
      ci: true,
      runUrl: "https://github.com/x/y/actions/runs/1",
    };
    const md = formatTypecheckDoc({
      generatedAt: "2026-08-18T00:00:00.000Z",
      runner,
      results: [
        { suite: "typecheck", caseId: "fallthrough-mono-ok", tool: "vue-tsc", status: "pass", message: "clean" },
        { suite: "typecheck", caseId: "fallthrough-mono-ok", tool: "vize-check", status: "fail", message: "expected clean" },
        { suite: "typecheck", caseId: "ts-import-vue-bad", tool: "verter-tsc", status: "warn", message: "EXTRA TSCONFIG" },
      ],
    });
    assert.match(md, /# Typecheck confirmation/);
    assert.match(md, /fallthrough-mono-ok/);
    assert.match(
      md,
      /\[`fallthrough-mono-ok`\]\(\.\.\/tests\/confirm\/fixtures\/typecheck\/cases\/fallthrough-mono-ok\/\)/,
    );
    assert.match(md, /fallthroughAttributes/);
    assert.match(md, /not assumed perfect/);
    assert.match(md, /EXTRA TSCONFIG/);
    assert.match(md, /Do not hand-edit the results/);
    assert.match(md, /## Native events \/ \$event \/ modifiers/);
    assert.match(md, /## Slots/);
    assert.match(md, /## Time and memory/);
    assert.match(md, /\[Time and memory\]\(#time-and-memory\)/);
    assert.match(md, /on \*\*Linux CI\*\*/);
    assert.match(md, /This table is from \*\*Linux CI\*\*/);
    assert.match(md, /Benchmark/);
    assert.match(md, /\*\*Runner:\*\*/);
    assert.match(md, /4 CPUs/);
    assert.match(md, /Test CPU/);
    assert.match(md, /16\.0 GB/);
    assert.match(md, /Node v22\.0\.0/);
    assert.match(md, /actions\/runs\/1/);
    assert.ok(
      md.indexOf("## Time and memory") > md.indexOf("## Template narrowing"),
      "Time and memory stays after the status matrices",
    );
    assert.match(md, /Linux/);
    assert.match(md, /macOS/);
    assert.match(md, /Windows/);
    assert.match(md, /&lt;script setup&gt;/);
    assert.doesNotMatch(
      md,
      /<script setup>/,
      "raw <script setup> in a table cell is eaten by the markdown preview",
    );
  });

  test("README summary is pass/warn counts plus a link, with runner specs", () => {
    const runner = {
      label: "Linux",
      platform: "linux",
      arch: "x64",
      cpuCount: 4,
      cpuModel: "Test CPU",
      totalmem: 16 * 1024 ** 3,
      node: "v22.0.0",
      ci: true,
      runUrl: "https://github.com/x/y/actions/runs/1",
    };
    const md = formatTypecheckReadmeSummary({
      generatedAt: "2026-08-18T00:00:00.000Z",
      runner,
      results: [
        { suite: "typecheck", caseId: "a", tool: "vue-tsc", status: "pass" },
        { suite: "typecheck", caseId: "a", tool: "vize-check", status: "warn", message: "EXTRA" },
        { suite: "typecheck", caseId: "b", tool: "vue-tsc", status: "fail" },
      ],
    });
    assert.match(md, /<!-- TYPECHECK_CONFIRM_START -->/);
    assert.match(md, /docs\/typecheck\.md/);
    assert.match(md, /\*\*Runner:\*\*/);
    assert.match(md, /4 CPUs · Test CPU · 16\.0 GB/);
    assert.match(md, /\| vue-tsc \| 1 \| 0 \| 1 \| 0 \|/);
    assert.match(md, /\| vize \| 0 \| 1 \| 0 \| 0 \|/);
    assert.match(md, /vize-check.*`a`/);
    assert.doesNotMatch(md, /<script setup>/);
  });

  test("formatRunnerLine matches the bench report shape", () => {
    assert.match(
      formatRunnerLine({
        label: "Linux",
        platform: "linux",
        arch: "x64",
        cpuCount: 2,
        cpuModel: "Xeon",
        totalmem: 8 * 1024 ** 3,
        node: "v22.1.0",
        ci: true,
      }),
      /\*\*Runner:\*\* Linux · linux\/x64 · 2 CPUs · Xeon · 8\.0 GB · Node v22\.1\.0/,
    );
  });

  test("formatMs / formatRss are stable across magnitudes", () => {
    assert.equal(formatMs(3.2), "3.2ms");
    assert.equal(formatMs(142.4), "142ms");
    assert.equal(formatMs(1500), "1.50s");
    assert.equal(formatMs(Number.NaN), "–");
    assert.equal(formatRss(4.2), "4.2MB");
    assert.equal(formatRss(48.7), "49MB");
    assert.equal(formatRss(0), "–");
  });
});

describe("scoreDiagnostics oracle", () => {
  const dirty = "App.vue(10,18): error TS2322: Type 'number' is not assignable to type 'string'.\n";
  const extra = `${dirty}App.vue(11,1): error TS2339: Property 'nope' does not exist.\n`;

  test("parseDiagnostics reads vue-tsc / golar file(line,col) lines", () => {
    const d = parseDiagnostics(dirty);
    assert.equal(d.length, 1);
    assert.equal(d[0].code, "TS2322");
    assert.equal(d[0].line, 10);
    assert.equal(d[0].column, 18);
    assert.match(d[0].file, /App\.vue$/);
  });

  test("parseDiagnostics reads vize error:line:col [TSxxxx] after a file line", () => {
    const d = parseDiagnostics("D:/x/App.vue\nerror:9:4 [TS2345] Argument of type 'string' is not assignable.\n");
    assert.equal(d.length, 1);
    assert.equal(d[0].code, "TS2345");
    assert.equal(d[0].line, 9);
    assert.match(d[0].file, /App\.vue$/);
  });

  test("countErrors prefers parsed diagnostics over a lying summary", () => {
    assert.equal(countErrors(`${dirty}Found 99 errors\n`), 1);
  });

  test("maxErrors is a hard fail, not a note on an ok score", () => {
    const r = scoreDiagnostics({
      combined: extra,
      expectErrors: true,
      minErrors: 1,
      maxErrors: 1,
    });
    assert.equal(r.ok, false);
    assert.match(r.message, /≤1/);
    assert.equal(r.errors, 2);
  });

  test("without maxErrors, extra diagnostics still pass a dirty plant", () => {
    const r = scoreDiagnostics({
      combined: extra,
      expectErrors: true,
      minErrors: 1,
    });
    assert.equal(r.ok, true);
  });

  test("expectLine / expectCode fail when the planted error is on the wrong line", () => {
    const r = scoreDiagnostics({
      combined: dirty,
      expectErrors: true,
      expectCode: "TS2322",
      expectFile: "App.vue",
      expectLine: 99,
    });
    assert.equal(r.ok, false);
    assert.match(r.message, /line 99/);
  });

  test("expectLine / expectCode pass when a diagnostic hits the pin", () => {
    const r = scoreDiagnostics({
      combined: dirty,
      expectErrors: true,
      expectCode: "TS2322",
      expectFile: "App.vue",
      expectLine: 10,
    });
    assert.equal(r.ok, true);
  });

  test("@plant-error pin requires a diagnostic on the target line that mentions the plant", () => {
    const pins = [{ file: "App.vue", commentLine: 9, targetLine: 10 }];
    const miss = scoreDiagnostics({
      combined: "Other.vue(1,1): error TS2322: nope\n",
      expectErrors: true,
      pins,
      expectMention: ["count"],
    });
    assert.equal(miss.ok, false);
    assert.match(miss.message, /App\.vue:10/);

    const wrongMsg = scoreDiagnostics({
      combined: dirty,
      expectErrors: true,
      pins,
      expectMention: ["count"],
    });
    assert.equal(wrongMsg.ok, false);
    assert.match(wrongMsg.message, /did not mention count/);

    const ok = scoreDiagnostics({
      combined: "App.vue(10,18): error TS2322: Type 'string' is not assignable to type 'number' for prop 'count'.\n",
      expectErrors: true,
      pins,
      expectMention: ["count"],
    });
    assert.equal(ok.ok, true);
  });

  test("findExpectErrorPins reads script and template plant pins", () => {
    const dir = join(repoRoot, "tests/confirm/fixtures/typecheck/cases/wrong-prop-type");
    const pins = findExpectErrorPins(dir);
    assert.ok(pins.some((p) => p.file === "App.vue" && p.targetLine > p.commentLine));
  });
});

describe("runCliMeasured", () => {
  test("records wall-clock ms and an RSS peak on this platform", async () => {
    // File spawn (no spaces in args) — same shape as vue-tsc --noEmit -p …
    const dir = join(repoRoot, "work");
    mkdirSync(dir, { recursive: true });
    const script = join(dir, "confirm-measure-probe.mjs");
    writeFileSync(script, "console.log(42);\n");
    const r = await runCliMeasured(process.execPath, [script]);
    assert.equal(r.status, 0, r.stderr || r.error?.message || "exit");
    assert.match(r.stdout, /42/);
    assert.ok(Number.isFinite(r.ms) && r.ms >= 0);
    assert.ok(
      Number.isFinite(r.rssBytes) && r.rssBytes > 1024 * 1024,
      `rssBytes=${r.rssBytes} (linux=/proc VmHWM, darwin=ps, win=PeakWorkingSet64)`,
    );
  });
});

describe("confirm harness warn status", () => {
  test("warn is counted separately from pass/fail/skip and is not a pass", () => {
    const suite = createSuite("typecheck");
    suite.pass("a", "vue-tsc", "clean");
    suite.warn("a", "verter-tsc", "EXTRA TSCONFIG — isolated retry");
    suite.fail("b", "x", "nope");
    suite.skip("c", "y", "missing");
    const s = summarize(suite.results);
    assert.equal(s.pass, 1);
    assert.equal(s.warn, 1);
    assert.equal(s.fail, 1);
    assert.equal(s.skip, 1);
    assert.equal(s.total, 4);
    const md = formatReport(suite.results);
    assert.match(md, /⚠ warn/);
    assert.match(md, /warn: \*\*1\*\*/);
  });
});
