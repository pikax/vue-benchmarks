import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  displayName,
  formatToolTable,
  formatToolTables,
  githubForLabel,
  linkToolLabel,
  urlFor,
  versionsFromTableRows,
  resolvePublishDates,
} from "../../scripts/lib/tool-catalog.mjs";
import { timedColdWarm } from "../../scripts/lib/ide-ops/context.mjs";

describe("tool catalog", () => {
  test("links Vue official packages at language-tools / core", () => {
    assert.match(urlFor("vue-tsc"), /github\.com\/vuejs\/language-tools/);
    assert.match(urlFor("@vue/compiler-sfc"), /github\.com\/vuejs\/core/);
    assert.equal(displayName("@vue/compiler-sfc-36"), "@vue/compiler-sfc 3.6");
  });

  test("Volar (N) and vue-tsc (N) share the native-bridge GitHub link", () => {
    assert.match(githubForLabel("Volar (N)"), /typescript-native-bridge/);
    assert.match(githubForLabel("vue-tsc (N)"), /typescript-native-bridge/);
    assert.match(githubForLabel("Volar (JS)"), /language-tools/);
    assert.match(linkToolLabel("Volar (N) ⚠"), /\[Volar \(N\)\]\(https:\/\/github.com\/johnsoncodehk\/typescript-native-bridge\) ⚠/);
  });

  test("formatToolTables groups by section, npm-links versions, sorts date desc", () => {
    const md = formatToolTables(
      ["compile", "typecheck"],
      {
        "@vue/compiler-sfc": "3.5.41",
        vize: "0.347.7",
        "vue-tsc": "3.3.10",
      },
      { "@vue/compiler-sfc@3.5.41": "2026-01-15", "vue-tsc@3.3.10": "2026-02-01", "vize@0.347.7": "2026-01-20" },
    );
    assert.match(md, /### Tools/);
    assert.match(md, /#### SFC compile/);
    assert.match(md, /#### Typecheck/);
    assert.match(md, /\[@vue\/compiler-sfc\]\(https:\/\/github.com\/vuejs\/core\)/);
    assert.match(md, /\[3\.5\.41\]\(https:\/\/www.npmjs.com\/package\/@vue\/compiler-sfc\/v\/3.5.41\)/);
    assert.match(md, /2026-01-15/);
    const typecheck = md.slice(md.indexOf("#### Typecheck"));
    const vueTsc = typecheck.indexOf("vue-tsc");
    const vize = typecheck.indexOf("[vize]");
    assert.ok(vueTsc >= 0 && vize >= 0 && vueTsc < vize, "newer publish date sorts first");
    assert.doesNotMatch(md, /eslint-plugin-vue/);
  });

  test("formatToolTable is one surface with no Tools heading", () => {
    const md = formatToolTable("typecheck", { "vue-tsc": "3.3.10" }, { "vue-tsc@3.3.10": "2026-02-01" });
    assert.match(md, /\| Tool \| Version \|/);
    assert.match(md, /vue-tsc/);
    assert.doesNotMatch(md, /### Tools/);
    assert.doesNotMatch(md, /#### Typecheck/);
    assert.doesNotMatch(md, /@vue\/compiler-sfc/);
  });

  test("versionsFromTableRows drops cli: aliases", () => {
    const map = versionsFromTableRows(["| vue | 3.5.41 |", "| cli:vize | 0.347.7 |"]);
    assert.equal(map.vue, "3.5.41");
    assert.equal(map["cli:vize"], undefined);
  });

  test("resolvePublishDates uses cache / fetch and does not throw offline", async () => {
    const dates = await resolvePublishDates(
      [{ name: "vue-bench-test-pkg", version: "0.0.0-test" }],
      {
        persist: false,
        fetchImpl: async () => ({
          ok: true,
          json: async () => ({ time: { "0.0.0-test": "2026-01-20T00:00:00.000Z" } }),
        }),
      },
    );
    assert.equal(dates["vue-bench-test-pkg@0.0.0-test"], "2026-01-20");
  });
});

describe("timedColdWarm", () => {
  test("first call is cold, second is warm, ranking ms is warm", async () => {
    let n = 0;
    const op = await timedColdWarm("hover", "Hover", async () => {
      n += 1;
      return { valid: true, sample: `n=${n}` };
    });
    assert.equal(n, 2);
    assert.equal(op.valid, true);
    assert.equal(typeof op.coldMs, "number");
    assert.equal(typeof op.warmMs, "number");
    assert.equal(op.ms, op.warmMs);
  });
});
