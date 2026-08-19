import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { spawn, spawnSync } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

import {
  isTypeScriptEngineProcess,
  listPidTreeMembers,
  pidTreeRssBreakdown,
} from "../../scripts/lib/memory.mjs";
import { typecheckAllLanding, barChartSvg } from "../../scripts/lib/readme-charts.mjs";

describe("isTypeScriptEngineProcess", () => {
  test("names native tsgo / tsc / corsa as the engine", () => {
    assert.equal(isTypeScriptEngineProcess({ name: "tsgo" }), true);
    assert.equal(isTypeScriptEngineProcess({ name: "tsgo.exe" }), true);
    assert.equal(isTypeScriptEngineProcess({ name: "tsc.exe" }), true);
    assert.equal(isTypeScriptEngineProcess({ name: "corsa" }), true);
  });

  test("tsserver on a Node cmdline is the Volar TypeScript half", () => {
    assert.equal(
      isTypeScriptEngineProcess({
        name: "node",
        cmdline: "node /path/typescript/lib/tsserver.js --stdio",
      }),
      true,
    );
  });

  test("vue-tsc, verter-tsc, and vize are the tool, not the engine", () => {
    assert.equal(
      isTypeScriptEngineProcess({
        name: "node",
        cmdline: "node /path/vue-tsc/bin/vue-tsc.js --noEmit -p tsconfig.json",
      }),
      false,
    );
    assert.equal(isTypeScriptEngineProcess({ name: "verter-tsc.exe" }), false);
    assert.equal(isTypeScriptEngineProcess({ name: "vize", cmdline: "vize check ." }), false);
  });
});

describe("pid tree walks descendants", () => {
  test("a grandchild is in the tree, not only the direct child", async () => {
    const child = spawn(
      process.execPath,
      [
        "-e",
        `const {spawn}=require("node:child_process");
         spawn(process.execPath,["-e","setInterval(()=>{},50)"],{stdio:"ignore"});
         setInterval(()=>{},50);`,
      ],
      { stdio: "ignore" },
    );
    try {
      await delay(250);
      const members = listPidTreeMembers(child.pid);
      const b = pidTreeRssBreakdown(child.pid);
      assert.ok(b.totalBytes > 0);
      if (process.platform === "win32") {
        assert.equal(b.engineBytes, 0, `win32 must not attribute unrelated tsc/tsgo; engineBytes=${b.engineBytes}`);
      } else {
        assert.ok(
          members.length >= 2,
          `expected parent + grandchild, got ${members.length} pids: ${members.map((m) => m.pid).join(",")}`,
        );
        assert.equal(b.engineBytes, 0, "plain node children are not tsgo");
        assert.equal(b.toolBytes, b.totalBytes);
      }
    } finally {
      if (process.platform === "win32") {
        spawnSync("taskkill", ["/pid", String(child.pid), "/T", "/F"], { windowsHide: true });
      } else {
        try {
          child.kill("SIGKILL");
        } catch {
          /* gone */
        }
      }
    }
  });
});

describe("typecheck all-plants RSS split", () => {
  test("table has Tool / tsgo tsc / Total columns and a stacked chart", () => {
    const charts = [];
    const md = typecheckAllLanding(
      [
        {
          suite: "typecheck-all",
          tool: "vue-tsc",
          status: "pass",
          ms: 2000,
          rssMb: 350,
          rssToolMb: 350,
          detail: { passPct: 80, pass: 80, scored: 100, ms: 2000, rssMb: 350, rssToolMb: 350 },
        },
        {
          suite: "typecheck-all",
          tool: "vize-check",
          status: "pass",
          ms: 1200,
          rssMb: 300,
          rssToolMb: 90,
          rssEngineMb: 210,
          detail: {
            passPct: 50,
            pass: 50,
            scored: 100,
            ms: 1200,
            rssMb: 300,
            rssToolMb: 90,
            rssEngineMb: 210,
          },
        },
      ],
      { writeChart: (file, svg) => charts.push({ file, svg }) },
    );
    assert.match(md, /\| Tool \| Tool \| tsgo \/ tsc \| \*\*Total\*\* \|/);
    assert.match(md, /vize \| 90\.0 MB \| 210\.0 MB \| \*\*300\.0 MB\*\*/);
    assert.match(md, /vue-tsc \| 350\.0 MB \| — \| \*\*350\.0 MB\*\*/);
    const rss = charts.find((c) => c.file.includes("rss"));
    assert.ok(rss, "rss chart");
    assert.match(rss.svg, /tsgo \/ tsc/);
    assert.match(rss.svg, /90\.0 MB \+ 210\.0 MB = 300\.0 MB/);
  });
});

describe("barChartSvg RSS stack", () => {
  test("tool + engine series add, they do not take max like cold/warm", () => {
    const svg = barChartSvg({
      title: "peak RSS",
      unit: "MB",
      bars: [
        { label: "vize", series: "tool", value: 80 },
        { label: "vize", series: "engine", value: 220 },
      ],
    });
    assert.match(svg, /80\.0 MB \+ 220\.0 MB = 300\.0 MB/);
    assert.match(svg, />tool</);
    assert.match(svg, /tsgo \/ tsc/);
  });
});
