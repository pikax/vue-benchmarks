import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";
import { compileScript, compileTemplate, parse, rewriteDefault } from "@vue/compiler-sfc";
import {
  SUPPLEMENTAL_COMPILE_VALIDITY_PLANTS,
  SUPPLEMENTAL_COMPILE_VALIDITY_SUITE_HASH,
  SUPPLEMENTAL_COMPILE_VALIDITY_SUITE_VERSION,
} from "../../scripts/lib/compile-validity-supplemental-plants.mjs";
import { ensureDom } from "../confirm/lib/dom.mjs";

function compilerMessages(errors) {
  return errors.map((error) => String(error?.message ?? error)).join("; ");
}

function compileOfficialVue(plant, filename) {
  const parsed = parse(plant.source, { filename, sourceMap: false });
  assert.deepEqual(
    parsed.errors,
    [],
    `${plant.id} parse errors: ${compilerMessages(parsed.errors)}`,
  );
  const { descriptor } = parsed;
  let bindings = {};
  let rewrittenScript = "const __sfc__ = {}";
  if (descriptor.script || descriptor.scriptSetup) {
    const script = compileScript(descriptor, {
      id: filename,
      inlineTemplate: false,
      isProd: true,
      sourceMap: false,
    });
    bindings = script.bindings || {};
    rewrittenScript = rewriteDefault(script.content, "__sfc__");
  }
  assert.ok(descriptor.template, `${plant.id} has no template`);
  const template = compileTemplate({
    source: descriptor.template.content,
    filename,
    id: filename,
    isProd: true,
    compilerOptions: {
      bindingMetadata: bindings,
      mode: "module",
      hoistStatic: true,
      cacheHandlers: true,
      prefixIdentifiers: true,
      sourceMap: false,
    },
  });
  assert.deepEqual(
    template.errors,
    [],
    `${plant.id} template errors: ${compilerMessages(template.errors)}`,
  );
  return `${rewrittenScript}\n${template.code}\n__sfc__.render = render\nexport default __sfc__\n`;
}

test("supplemental compile plant manifest is independent, extensive, and revisioned", () => {
  assert.ok(SUPPLEMENTAL_COMPILE_VALIDITY_PLANTS.length >= 12);
  assert.equal(
    new Set(SUPPLEMENTAL_COMPILE_VALIDITY_PLANTS.map((plant) => plant.id)).size,
    SUPPLEMENTAL_COMPILE_VALIDITY_PLANTS.length,
  );
  assert.match(SUPPLEMENTAL_COMPILE_VALIDITY_SUITE_VERSION, /^\d{4}-\d{2}-\d{2}\.\d+$/);
  assert.match(SUPPLEMENTAL_COMPILE_VALIDITY_SUITE_HASH, /^[a-f0-9]{64}$/);
  for (const plant of SUPPLEMENTAL_COMPILE_VALIDITY_PLANTS) {
    assert.ok(plant.coverage.length > 0, `${plant.id} has no coverage declaration`);
    assert.equal(typeof plant.assert, "function", `${plant.id} has no runtime oracle`);
    assert.match(plant.source, /<template\b/i, `${plant.id} has no template`);
    assert.doesNotMatch(plant.source, /<script\b[^>]*\blang=["']ts["']/i, `${plant.id} uses TS`);
  }
});

test("official Vue 3.5 passes every supplemental compiler runtime plant", async () => {
  ensureDom();
  const { mount } = await import("@vue/test-utils");
  const workDir = join(process.cwd(), "work");
  mkdirSync(workDir, { recursive: true });
  const outputDir = mkdtempSync(join(workDir, "vue-compile-supplemental-"));
  mkdirSync(outputDir, { recursive: true });
  try {
    for (const [index, plant] of SUPPLEMENTAL_COMPILE_VALIDITY_PLANTS.entries()) {
      const sourceFilename = join(outputDir, `${plant.id}.vue`).replaceAll("\\", "/");
      const moduleFilename = join(outputDir, `${String(index).padStart(2, "0")}-${plant.id}.mjs`);
      writeFileSync(moduleFilename, compileOfficialVue(plant, sourceFilename), "utf8");
      const loaded = await import(`${pathToFileURL(moduleFilename).href}?case=${index}`);
      assert.ok(loaded.default, `${plant.id} generated no default component export`);
      await plant.assert({ mount, component: loaded.default });
    }
  } finally {
    rmSync(outputDir, { recursive: true, force: true });
  }
});
