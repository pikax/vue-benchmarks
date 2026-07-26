/**
 * Corpus-preparation contract: scripts/lib/fixtures.mjs
 *
 * Everything a tool sees on disk comes from here, so a defect in this file
 * silently changes what is being measured rather than failing loudly.
 */
import { after, before, describe, test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

import {
  collectJsxFiles,
  collectVueFiles,
  copyFixtureSubset,
  prepareFormatCopy,
  prepareLintDir,
  prepareTypecheckDir,
  readSources,
  totalBytes,
  writeTsconfig,
} from "../../scripts/lib/fixtures.mjs";
import { listDir, makeFixtureDir, makeTempDir, removeDir, repoRoot, unresolvableTypePackages } from "./helpers.mjs";

const PRETTIERRC = `${JSON.stringify({ semi: true, singleQuote: true }, null, 2)}\n`;

describe("writeTsconfig", () => {
  let dir;

  before(() => {
    dir = makeTempDir("tsconfig-");
  });

  after(() => removeDir(dir));

  const read = () => JSON.parse(readFileSync(join(dir, "tsconfig.json"), "utf8"));

  test("never requests a type package that is not installed", () => {
    // Regression guard: `types: ["node"]` while @types/node is not a dependency
    // made every typechecker abort at program construction with TS2688 and
    // check nothing at all — a config failure that timed like a fast benchmark.
    writeTsconfig(dir);
    const types = read().compilerOptions.types;

    assert.ok(Array.isArray(types), "compilerOptions.types must be present and explicit");
    assert.deepEqual(
      unresolvableTypePackages(dir, types),
      [],
      "every entry in compilerOptions.types must resolve under node_modules/@types",
    );
  });

  test("does not reintroduce types: [\"node\"]", () => {
    writeTsconfig(dir);
    assert.ok(!read().compilerOptions.types.includes("node"), "@types/node is not a dependency of this repo");
  });

  test("writes the compiler options the surfaces rely on", () => {
    writeTsconfig(dir);
    const { compilerOptions } = read();

    assert.equal(compilerOptions.noEmit, true, "benchmarks must never emit output");
    assert.equal(compilerOptions.strict, true);
    assert.equal(compilerOptions.jsx, "preserve");
    assert.equal(compilerOptions.skipLibCheck, true);
  });

  test("honours a custom include list", () => {
    writeTsconfig(dir, { include: ["A.vue", "B.vue"] });
    assert.deepEqual(read().include, ["A.vue", "B.vue"]);
  });

  test("normalises extends to posix separators", () => {
    writeTsconfig(dir, { extendsPath: join("..", "shared", "base.json") });
    assert.equal(read().extends, "../shared/base.json", "a Windows-separator extends path breaks tsc");
  });
});

describe("copyFixtureSubset", () => {
  let fixture;
  let work;

  before(() => {
    fixture = makeFixtureDir(4, { ".prettierrc.json": PRETTIERRC });
    work = makeTempDir("copy-");
  });

  after(() => {
    removeDir(work);
    removeDir(fixture.dir);
  });

  test("copies exactly the requested files plus the extras that exist", () => {
    const out = copyFixtureSubset(fixture.dir, join(work, "subset"), fixture.files.slice(0, 2), [
      ".prettierrc.json",
      "does-not-exist.json",
    ]);

    assert.deepEqual(listDir(out), [".prettierrc.json", ...fixture.files.slice(0, 2)].sort());
  });

  test("wipes the destination first so a stale file cannot join the corpus", () => {
    const out = join(work, "stale");
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, "Leftover.vue"), "<template><i/></template>\n");

    copyFixtureSubset(fixture.dir, out, fixture.files.slice(0, 1), []);

    assert.deepEqual(listDir(out), [fixture.files[0]]);
  });
});

describe("prepareTypecheckDir", () => {
  let fixture;
  let work;
  let out;

  before(() => {
    fixture = makeFixtureDir(3);
    work = makeTempDir("typecheck-");
    out = prepareTypecheckDir(fixture.dir, fixture.files, work, `n${fixture.files.length}`);
  });

  after(() => {
    removeDir(work);
    removeDir(fixture.dir);
  });

  test("contains exactly the measured corpus plus the project scaffolding", () => {
    assert.deepEqual(listDir(out), [...fixture.files, "env.d.ts", "golar.config.ts", "package.json", "tsconfig.json"].sort());
  });

  test("the tsconfig lists every measured file explicitly", () => {
    const tsconfig = JSON.parse(readFileSync(join(out, "tsconfig.json"), "utf8"));
    assert.deepEqual(tsconfig.include, [...fixture.files, "env.d.ts"]);
  });

  test("requests no unresolvable type packages", () => {
    const tsconfig = JSON.parse(readFileSync(join(out, "tsconfig.json"), "utf8"));
    assert.deepEqual(unresolvableTypePackages(out, tsconfig.compilerOptions.types ?? []), []);
  });

  test("the relative paths.vue resolves to the repo's real vue package", () => {
    const tsconfig = JSON.parse(readFileSync(join(out, "tsconfig.json"), "utf8"));
    const relativeVue = tsconfig.compilerOptions.paths?.vue?.[0];

    assert.ok(relativeVue, "paths.vue is what makes `vue` resolve from the work dir");
    assert.ok(!relativeVue.includes("\\"), "paths entries must use posix separators");

    const resolved = resolve(out, relativeVue);
    assert.equal(resolved, join(repoRoot, "node_modules", "vue"));
    assert.ok(existsSync(join(resolved, "package.json")), `paths.vue does not resolve: ${resolved}`);
  });
});

describe("prepareLintDir", () => {
  let fixture;
  let work;

  before(() => {
    fixture = makeFixtureDir(5);
    work = makeTempDir("lint-");
  });

  after(() => {
    removeDir(work);
    removeDir(fixture.dir);
  });

  test("copies exactly the requested subset and no stray .vue files", () => {
    const subset = fixture.files.slice(0, 2);
    const out = prepareLintDir(fixture.dir, subset, work, "subset");

    const vue = listDir(out).filter((f) => f.endsWith(".vue"));
    assert.deepEqual(vue, [...subset].sort(), "the lint corpus must be exactly the measured subset");
    assert.equal(vue.length, subset.length);
  });

  test("always leaves an eslint.config.mjs next to the corpus", () => {
    const out = prepareLintDir(fixture.dir, fixture.files.slice(0, 1), work, "config");

    assert.ok(existsSync(join(out, "eslint.config.mjs")));
    assert.match(readFileSync(join(out, "eslint.config.mjs"), "utf8"), /eslint-plugin-vue/);
    assert.ok(existsSync(join(out, "package.json")));
  });

  test("prefers a config shipped with the fixture over the generated fallback", () => {
    const marked = makeFixtureDir(1, { "eslint.config.mjs": "// fixture-owned config\nexport default [];\n" });
    try {
      const out = prepareLintDir(marked.dir, marked.files, work, "fixture-config");
      assert.match(readFileSync(join(out, "eslint.config.mjs"), "utf8"), /fixture-owned config/);
    } finally {
      removeDir(marked.dir);
    }
  });
});

describe("prepareFormatCopy", () => {
  let fixture;
  let work;

  before(() => {
    fixture = makeFixtureDir(3, { ".prettierrc.json": PRETTIERRC });
    work = makeTempDir("format-");
  });

  after(() => {
    removeDir(work);
    removeDir(fixture.dir);
  });

  test("carries .prettierrc.json into the work copy", () => {
    // Prettier resolves config by walking UP from the file. The work dir is not
    // under the fixture dir, so a config left in the fixture root would never
    // apply and Prettier would silently format with different options.
    const out = prepareFormatCopy(fixture.dir, fixture.files, work, "prettier", 1);

    assert.ok(existsSync(join(out, ".prettierrc.json")), ".prettierrc.json must travel with the copy");
    assert.equal(readFileSync(join(out, ".prettierrc.json"), "utf8"), PRETTIERRC);
  });

  test("copies exactly the measured corpus", () => {
    const out = prepareFormatCopy(fixture.dir, fixture.files, work, "prettier", 2);
    assert.deepEqual(listDir(out), [".prettierrc.json", ...fixture.files].sort());
  });

  test("every invocation gets its own fresh directory", () => {
    const a = prepareFormatCopy(fixture.dir, fixture.files, work, "oxfmt", 3);
    const b = prepareFormatCopy(fixture.dir, fixture.files, work, "oxfmt", 4);

    assert.notEqual(a, b, "formatters rewrite files — each run needs a clean copy");
    assert.ok(existsSync(a) && existsSync(b));
  });
});

describe("corpus collectors", () => {
  let fixture;

  before(() => {
    fixture = makeFixtureDir(4, {
      "notes.txt": "ignored\n",
      "Widget.jsx": "export default () => <div />\n",
      "Widget.tsx": "export default () => <div />\n",
    });
  });

  after(() => removeDir(fixture.dir));

  test("collectVueFiles is sorted, filtered and limitable", () => {
    const all = collectVueFiles(fixture.dir);
    assert.deepEqual(all, [...fixture.files].sort());
    assert.deepEqual(collectVueFiles(fixture.dir, 2), all.slice(0, 2), "the limit must take a stable prefix");
    assert.deepEqual(collectVueFiles(join(fixture.dir, "nope")), [], "a missing dir yields no corpus");
  });

  test("collectJsxFiles picks up .jsx and .tsx only", () => {
    assert.deepEqual(collectJsxFiles(fixture.dir), ["Widget.jsx", "Widget.tsx"]);
  });

  test("totalBytes and readSources agree with the files on disk", () => {
    const files = collectVueFiles(fixture.dir);
    const sources = readSources(fixture.dir, files);

    assert.equal(sources.length, files.length);
    assert.equal(
      totalBytes(fixture.dir, files),
      sources.reduce((n, s) => n + Buffer.byteLength(s.source, "utf8"), 0),
    );
    for (const source of sources) {
      assert.ok(source.source.includes("<template>"), `${source.filename} was not read`);
      assert.ok(existsSync(source.path));
    }
  });
});
