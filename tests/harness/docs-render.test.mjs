/**
 * JSON → docs rendering: bars and compact tables come straight from result
 * variants (no markdown re-parsing), memory joins the timing tables as a
 * column, and comparison classes never mix in a chart.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  barsFromVariants,
  compactTable,
  confirmMatrix,
  memoryProbeTable,
  renderGroupDoc,
  variantClasses,
} from "../../scripts/lib/docs/render.mjs";
import { attachMemoryToBench, GROUPS } from "../../scripts/lib/docs/data.mjs";

describe("barsFromVariants", () => {
  test("plain median bars; error/skip rows have nothing to draw", () => {
    const bars = barsFromVariants([
      { label: "Vize check", status: "ok", medianMs: 100 },
      { label: "verter-tsc", status: "unranked", medianMs: 50 },
      { label: "golar", status: "error" },
      { label: "vue-tsc", status: "skipped" },
    ]);
    assert.deepEqual(
      bars.map((b) => [b.label, b.value, b.ranked]),
      [
        ["Vize", 100, true],
        ["verter-tsc", 50, false],
      ],
    );
  });

  test("fresh child + warm become a range pair", () => {
    const bars = barsFromVariants([
      { label: "x", status: "ok", freshChildMedianMs: 20, medianMs: 30 },
    ]);
    assert.deepEqual(
      bars.map((b) => [b.series, b.value]),
      [
        ["fresh", 20],
        ["warm", 30],
      ],
    );
  });
});

describe("variantClasses", () => {
  test("jsx targets are separate classes; single-class lists carry no label", () => {
    const split = variantClasses([
      { label: "a", target: "vapor" },
      { label: "b", target: "vdom" },
    ]);
    assert.equal(split.length, 2);
    assert.ok(split.every((c) => c.label.includes("ranked alone")));
    const single = variantClasses([{ label: "a" }, { label: "b" }]);
    assert.equal(single.length, 1);
    assert.equal(single[0].label, "");
  });
});

describe("compactTable", () => {
  test("median, ratio and Peak RSS columns; unranked bracketed below", () => {
    const out = compactTable(
      [
        { label: "verter-tsc", status: "ok", medianMs: 1000, rssMaxMb: 216.5 },
        { label: "vue-tsc", status: "ok", medianMs: 4000, engine: "tsc-js", rssMaxMb: 353.9 },
        { label: "fervid compileSync (1T)", status: "unranked", medianMs: 57 },
        { label: "golar", status: "error" },
      ],
      { docHref: "docs/typecheck.md" },
    );
    assert.match(out, /\| Tool \| \*\*Median\*\* \| vs fastest \| Peak RSS \|/);
    assert.match(out, /verter-tsc[^\n]*\*\*1\.00 s\*\*[^\n]*1\.00x[^\n]*216\.5 MB/);
    assert.match(out, /vue-tsc \(JS\)[^\n]*4\.00x[^\n]*353\.9 MB/);
    assert.match(out, /fervid[^\n]*\(57\.0 ms\)[^\n]*not ranked/);
    assert.doesNotMatch(out, /golar/);
    assert.match(out, /⚠ rows failed a validation gate/);
    assert.match(out, /docs\/typecheck\.md/);
  });

  test("a baseline flag never pins the row — sorting and ratio are vs fastest", () => {
    const out = compactTable([
      { label: "candidate", status: "ok", medianMs: 10 },
      { label: "Vue ref", status: "ok", medianMs: 20, baseline: true, baselineLabel: "Vue" },
    ]);
    assert.match(out, /vs fastest/);
    assert.doesNotMatch(out, /vs Vue/);
    const rows = out.split("\n").filter((l) => /^\| [^-T]/.test(l));
    assert.match(rows[0], /candidate[^\n]*1\.00x/);
    assert.match(rows[1], /Vue ref[^\n]*2\.00x/);
  });

  test("clean tables get the plain footnote, not the gate warning", () => {
    const out = compactTable(
      [{ label: "a", status: "ok", medianMs: 5 }],
      { docHref: "docs/x.md" },
    );
    assert.doesNotMatch(out, /⚠ rows failed/);
    assert.match(out, /per-row notes: \[full results\]\(docs\/x\.md\)/);
  });
});

describe("attachMemoryToBench", () => {
  test("probe rows join bench variants by id (mem- prefix and aliases)", () => {
    const bench = {
      surfaces: [
        {
          id: "typecheck",
          variants: [
            { id: "vue-tsc", label: "vue-tsc", status: "ok", medianMs: 1 },
            { id: "vue-tsc-tnb", label: "vue-tsc (TNB)", status: "ok", medianMs: 1 },
          ],
        },
        {
          id: "lint",
          variants: [
            { id: "vize-lint-max", label: "Vize lint (max threads)", status: "ok", medianMs: 1 },
            { id: "vize-lint-1t", label: "Vize lint (1T)", status: "ok", medianMs: 1 },
          ],
        },
        {
          id: "lsp",
          variants: [
            {
              id: "volar-language-server",
              label: "Volar",
              status: "ok",
              medianMs: 1,
              rssMaxMb: 999, // measured in the timed session — probe must not clobber it
            },
          ],
        },
      ],
    };
    const memory = {
      results: [
        { id: "mem-vue-tsc", surface: "typecheck", maxMb: 353.8, peakMaxMb: 354.8 },
        { id: "mem-vize-lint", surface: "lint", maxMb: 68.4 },
        { id: "mem-lsp-volar", surface: "lsp", maxMb: 140.2 },
      ],
    };
    const attached = attachMemoryToBench(bench, memory);
    assert.equal(attached, 2);
    const tc = bench.surfaces[0].variants;
    assert.equal(tc[0].rssMaxMb, 354.8);
    assert.equal(tc[0].rssSource, "memory-probe");
    assert.equal(tc[1].rssMaxMb, undefined, "TNB row has no probe measurement");
    assert.equal(bench.surfaces[1].variants[0].rssMaxMb, 68.4, "alias vize-lint → max threads row");
    assert.equal(bench.surfaces[1].variants[1].rssMaxMb, undefined);
    assert.equal(bench.surfaces[2].variants[0].rssMaxMb, 999, "session measurement wins");
  });
});

describe("memoryProbeTable", () => {
  test("renders min/max/avg, CPU and samples with notes collapsed", () => {
    const out = memoryProbeTable([
      {
        label: "vue-tsc",
        status: "ok",
        minMb: 12.96,
        maxMb: 353.81,
        avgMb: 263.79,
        cpuTotalMs: 6450,
        cpuPercent: 220,
        wallMs: 2932,
        samples: 3,
        note: "RSS = child tree",
      },
    ]);
    assert.match(out, /12\.96 \/ 353\.81 \/ 263\.79/);
    assert.match(out, /6450/);
    assert.match(out, /<details><summary>Notes<\/summary>/);
    assert.match(out, /RSS = child tree/);
  });
});

describe("confirmMatrix", () => {
  test("one row per case, one column per tool, fails detailed", () => {
    const out = confirmMatrix([
      { suite: "lint", caseId: "planted-error", tool: "vize", status: "pass" },
      { suite: "lint", caseId: "planted-error", tool: "biome", status: "fail", message: "missed rule" },
      { suite: "lint", caseId: "clean", tool: "vize", status: "pass" },
      { suite: "typecheck-all", caseId: "all-plants", tool: "vue-tsc", status: "pass" },
    ]);
    assert.match(out, /\| Case \| vize \| biome \|/);
    assert.match(out, /`planted-error` \| ✓ \| \*\*✗\*\* \|/);
    assert.match(out, /missed rule/);
    assert.doesNotMatch(out, /all-plants/, "the combined run has its own landing");
  });
});

describe("renderGroupDoc", () => {
  test("group page carries results, memory probe and versions from the model", () => {
    const chartsDir = mkdtempSync(join(tmpdir(), "vue-bench-charts-"));
    try {
      const group = GROUPS.find((g) => g.id === "typecheck");
      const model = {
        bench: {
          name: "bench-Linux-200-bench.json",
          data: {
            generatedAt: "2026-08-19T00:00:00.000Z",
            fixture: "fixtures/200",
            fileCount: 200,
            settings: { runs: 5, warmups: 1 },
            runner: { platform: "linux", arch: "x64", cpuCount: 4, cpuModel: "Test", node: "v22" },
            versions: { "vue-tsc": "3.3.10" },
            surfaces: [
              {
                id: "typecheck",
                label: "Typecheck",
                files: 200,
                bytes: 1000,
                methodology: ["note"],
                variants: [
                  {
                    id: "vue-tsc",
                    label: "vue-tsc",
                    status: "ok",
                    medianMs: 5000,
                    runs: [5000],
                    rssMaxMb: 354.8,
                    rssSource: "memory-probe",
                    throughput: "40 files/s",
                  },
                ],
              },
            ],
          },
        },
        ide: null,
        ideScale: null,
        confirm: null,
        memory: {
          name: "memory-linux-100.json",
          data: {
            results: [
              { id: "mem-vue-tsc", label: "vue-tsc", surface: "typecheck", status: "ok", minMb: 13, maxMb: 353.8, avgMb: 263, samples: 3 },
            ],
          },
        },
        realWorld: [],
      };
      const md = renderGroupDoc(group, model, { chartsDir, chartsHref: "charts" });
      assert.match(md, /^# Typecheck/);
      assert.match(md, /## Results/);
      assert.match(md, /Peak RSS/);
      assert.match(md, /354\.8 MB/);
      assert.match(md, /## Memory \(isolated probe\)/);
      assert.match(md, /## Tool versions/);
      assert.match(md, /<source media="\(prefers-color-scheme: dark\)" srcset="charts\/[\w.-]+-dark\.svg">/);
      assert.match(md, /<img alt="Typecheck" src="charts\/[\w.-]+\.svg">/);
      const written = readdirSync(chartsDir);
      assert.ok(written.some((f) => f.endsWith("-dark.svg")), "dark chart written");
      assert.ok(written.some((f) => f.endsWith(".svg") && !f.endsWith("-dark.svg")), "light chart written");
    } finally {
      rmSync(chartsDir, { recursive: true, force: true });
    }
  });
});
