import assert from "node:assert/strict";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import {
  COMPILER_RESULTS_END,
  COMPILER_RESULTS_START,
  compilerMarkdownSection,
  compilerMemoryMarkdownSection,
  formatCompilerDoc,
  formatCompilerLanding,
  updateCompilerDoc,
  wrapCompilerLanding,
} from "../../scripts/update-compiler-doc.mjs";

const benchmarkMarkdown = `## Benchmark Results

- **Generated:** now
- **Benchmark commit:** \`abc\` · **DIRTY WORKTREE**

### Tool versions

| Package | Version |
| --- | --- |
| @vue/compiler-sfc | 3.5.41 |
| @vizejs/native | 1.2.3 |
| unrelated | 9.9.9 |

### Compiler

Files: **2**

#### VDOM · production · sourcemap off

##### Raw SFC compilation — identical changed inputs; no output-cache reuse

| Tool | Fresh child | Fresh min | Fresh stddev | Fresh CV% | vs Vue fresh child | **Warm (primary)** | Warm min | Warm stddev | Warm CV% | vs Vue warm | Code bytes | Throughput |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference | 10 ms | 9 ms | 1 ms | 10% | 1.00x | **5 ms** | 4 ms | 1 ms | 20% | 1.00x | 200 | 400 files/s |

<details><summary>Raw runs</summary>

- **Vue compiler-sfc 3.5 reference**: Fresh child: 9 ms, 11 ms · Warm: 4 ms, 6 ms

</details>

### Typecheck

SHOULD NOT ENTER THE COMPILER DOCUMENT
`;

const memoryMarkdown = `# Resource probe results (memory + allocations + CPU)

### Metrics

| Column | Meaning |
| --- | --- |
| Peak RSS | true maximum |

### compile

#### Raw SFC compilation — identical style-free inputs

| Tool | RSS min / max / avg | Peak RSS | Alloc min / max / avg | CPU ms | CPU % | Wall ms | Samples |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Vue compiler-sfc 3.5 reference | 10 / 12 / 11 | 14 MB | 1 / 2 / 1.5 | 2 | 100 | 2 | 3 |

### lint

SHOULD NOT ENTER COMPILER RESOURCE DATA
`;

const benchmarkData = {
  schemaVersion: 2,
  generatedAt: "now",
  fixture: "fixtures/2",
  fileCount: 2,
  settings: { runs: 2, warmups: 1 },
  runner: { platform: "win32" },
  commit: { sha: "abc", dirty: true },
  versions: { "@vue/compiler-sfc": "3.5.41" },
  methodology: ["compiler-methodology-sentinel"],
  surfaces: [
    {
      id: "compile",
      freshChildMeasurement: { executedOrder: [["vue"]] },
      validation: {
        compileSemantics: {
          results: [{ id: "runtime-plant-sentinel", status: "pass" }],
        },
      },
      variants: [
        {
          id: "vue",
          runs: [4, 6],
          freshChildRuns: [9, 11],
          adapterParity: { ok: true },
        },
      ],
    },
    { id: "lint", secret: "unrelated-surface-sentinel" },
  ],
};

const memoryData = {
  kind: "resource-probe",
  generatedAt: "later",
  fixture: "fixtures/2",
  settings: { samples: 3 },
  versions: { node: "v1" },
  validation: { compileSemantics: { sentinel: "resource-validation-sentinel" } },
  results: [
    {
      id: "mem-vue",
      surface: "compile",
      peakMaxMb: 14,
      raw: [{ maxRssMb: 14, baselineRssMb: 40 }],
    },
    { id: "mem-lint", surface: "lint", raw: ["unrelated-memory-sentinel"] },
  ],
};

test("compiler document retains every compiler-owned timing and resource payload", () => {
  const markdown = formatCompilerDoc({
    benchmarkMarkdown,
    benchmarkData,
    memoryMarkdown,
    memoryData,
  });
  assert.match(markdown, /runtime-plant-sentinel/);
  assert.match(markdown, /"freshChildRuns": \[\s*9,\s*11/);
  assert.match(markdown, /"adapterParity": \{\s*"ok": true/);
  assert.match(markdown, /"executedOrder"/);
  assert.match(markdown, /"baselineRssMb": 40/);
  assert.match(markdown, /"peakMaxMb": 14/);
  assert.match(markdown, /resource-validation-sentinel/);
  assert.match(markdown, /Peak RSS and complete resource-probe results/);
  assert.doesNotMatch(markdown, /unrelated-surface-sentinel/);
  assert.doesNotMatch(markdown, /unrelated-memory-sentinel/);
});

test("section extraction stops at the next peer surface", () => {
  assert.match(compilerMarkdownSection(benchmarkMarkdown), /Raw runs/);
  assert.doesNotMatch(compilerMarkdownSection(benchmarkMarkdown), /Typecheck/);
  assert.match(compilerMemoryMarkdownSection(memoryMarkdown), /Peak RSS/);
  assert.doesNotMatch(compilerMemoryMarkdownSection(memoryMarkdown), /lint/);
});

test("Compiler README landing contains timings, true Peak RSS and stable markers", () => {
  const chartsDir = mkdtempSync(join(tmpdir(), "vue-bench-compiler-doc-"));
  try {
    const landing = formatCompilerLanding({
      benchmarkMarkdown,
      memoryMarkdown,
      benchmarkLeaf: "bench-linux.md",
      memoryLeaf: "memory-linux.md",
      chartsDir,
    });
    assert.match(landing, new RegExp(COMPILER_RESULTS_START));
    assert.match(landing, new RegExp(COMPILER_RESULTS_END));
    assert.match(landing, /Complete Compiler data/);
    assert.match(landing, /#### Peak RSS/);
    assert.match(landing, /Fresh and Warm share one combined bar per tool/);
    assert.match(landing, /14\.0 MB/);
    assert.match(landing, /\*\*Warm \(primary\)\*\*/);
    assert.equal(wrapCompilerLanding(landing), landing);
  } finally {
    rmSync(chartsDir, { recursive: true, force: true });
  }
});

test("automatic publication requires complete clean current-format artifact pairs", () => {
  const dir = mkdtempSync(join(tmpdir(), "vue-bench-compiler-publish-"));
  try {
    const benchBase = join(dir, "bench-Linux-2-bench");
    const memoryBase = join(dir, "memory-linux-2");
    writeFileSync(`${benchBase}.md`, benchmarkMarkdown.replace(" · **DIRTY WORKTREE**", ""));
    writeFileSync(
      `${benchBase}.json`,
      JSON.stringify({
        ...benchmarkData,
        generatedAt: "2026-08-20T00:00:00.000Z",
        commit: { sha: "clean", dirty: false },
      }),
    );
    writeFileSync(`${memoryBase}.md`, memoryMarkdown);
    writeFileSync(
      `${memoryBase}.json`,
      JSON.stringify({ ...memoryData, generatedAt: "2026-08-20T00:01:00.000Z" }),
    );
    const output = join(dir, "compiler.md");
    const result = updateCompilerDoc({ dir, output });
    assert.equal(result.updated, true);
    assert.match(readFileSync(output, "utf8"), /runtime-plant-sentinel/);

    const dirtyDir = join(dir, "dirty");
    mkdirSync(dirtyDir, { recursive: true });
    const dirtyBench = join(dirtyDir, "bench-Linux-2-bench.md");
    const dirtyMemory = join(dirtyDir, "memory-linux-2.md");
    writeFileSync(dirtyBench, benchmarkMarkdown);
    writeFileSync(dirtyBench.replace(/\.md$/, ".json"), JSON.stringify(benchmarkData));
    writeFileSync(dirtyMemory, memoryMarkdown);
    writeFileSync(dirtyMemory.replace(/\.md$/, ".json"), JSON.stringify(memoryData));
    const dirtyOutput = join(dirtyDir, "compiler.md");
    const refused = updateCompilerDoc({ dir: dirtyDir, output: dirtyOutput });
    assert.equal(refused.updated, false);
    assert.equal(existsSync(dirtyOutput), false);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
