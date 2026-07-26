/**
 * Shared workspace scaffolding for IDE operation suites.
 *
 * Every suite builds its own purpose-built workspace, but they must all agree
 * on tsconfig, `strictTemplates`, the Volar tsserver plugin and the Vize
 * backend switches. If two suites differed there, their servers would be doing
 * different amounts of work and the numbers would not be comparable across
 * suites — so the scaffolding lives here rather than in each suite.
 */

import { existsSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../../..");

/**
 * Create the common files a Vue LSP workspace needs.
 *
 * @param {string} dir
 * @param {object} [opts]
 * @param {boolean} [opts.strictTemplates] leave true unless the suite is
 *   specifically measuring non-strict behaviour — with it off, unknown props
 *   and prop-type mismatches are not errors for ANY server, which silently
 *   removes most of the work a template gate is trying to observe.
 * @param {Record<string, unknown>} [opts.extraCompilerOptions]
 * @param {Record<string, unknown>} [opts.extraVueCompilerOptions]
 */
export function scaffold(dir, {
  strictTemplates = true,
  extraCompilerOptions = {},
  extraVueCompilerOptions = {},
} = {}) {
  mkdirSync(dir, { recursive: true });

  writeFileSync(
    join(dir, "tsconfig.json"),
    `${JSON.stringify(
      {
        compilerOptions: {
          target: "ESNext",
          module: "ESNext",
          moduleResolution: "bundler",
          strict: true,
          jsx: "preserve",
          noEmit: true,
          skipLibCheck: true,
          lib: ["ESNext", "DOM"],
          // Must stay empty: @types/node is not a dependency of this repo and
          // `types: ["node"]` makes every checker abort at TS2688 instead of
          // checking the corpus.
          types: [],
          // Required for the Volar hybrid tsserver path, same as a real project.
          plugins: [{ name: "@vue/typescript-plugin" }],
          ...extraCompilerOptions,
        },
        vueCompilerOptions: { target: 3.5, strictTemplates, ...extraVueCompilerOptions },
        include: ["**/*.vue", "**/*.ts", "env.d.ts"],
      },
      null,
      2,
    )}\n`,
  );

  writeFileSync(
    join(dir, "env.d.ts"),
    `declare module '*.vue' {\n  import type { DefineComponent } from 'vue'\n  const c: DefineComponent<{}, {}, any>\n  export default c\n}\n`,
  );

  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name: "ide-bench-ws" }, null, 2)}\n`,
  );

  // Vize's tsgo/Corsa IDE backend is opt-in. Measuring the default would
  // measure a subset of the product its extension ships.
  writeFileSync(
    join(dir, "vize.config.json"),
    `${JSON.stringify(
      {
        languageServer: {
          enabled: true,
          corsa: true,
          tsgo: true,
          typecheck: true,
          editor: true,
          hover: true,
          lint: true,
          completion: true,
          definition: true,
          references: true,
          rename: true,
          codeActions: true,
          semanticTokens: true,
          inlayHints: true,
          documentSymbols: true,
          formatting: true,
        },
        typeChecker: { enabled: true, strict: true, checkTemplateBindings: true },
      },
      null,
      2,
    )}\n`,
  );

  // Point node_modules at the repo root so `vue` resolves without a second
  // install. Removed by removeWorkspace(), which must unlink it rather than
  // recurse into it.
  const nm = join(dir, "node_modules");
  try {
    if (existsSync(nm)) rmSync(nm, { recursive: true, force: true });
    symlinkSync(
      join(rootDir, "node_modules"),
      nm,
      process.platform === "win32" ? "junction" : "dir",
    );
  } catch {
    // Non-fatal: resolution may still walk up to the repo root.
  }
}

/**
 * 0-based line/character of the Nth occurrence of `needle`.
 *
 * Positions must be derived from the source rather than hard-coded: a
 * hard-coded line number silently points somewhere else the moment a fixture
 * gains a line, and the suite then measures a hover on whitespace.
 */
export function positionOf(text, needle, occurrence = 1) {
  const lines = text.split(/\r?\n/);
  let seen = 0;
  for (let i = 0; i < lines.length; i++) {
    let from = 0;
    for (;;) {
      const idx = lines[i].indexOf(needle, from);
      if (idx === -1) break;
      if (++seen === occurrence) return { line: i, character: idx };
      from = idx + 1;
    }
  }
  throw new Error(`positionOf: not found (${JSON.stringify(needle)} #${occurrence})`);
}

/** Position just AFTER the Nth occurrence — the usual completion trigger point. */
export function positionAfter(text, needle, occurrence = 1) {
  const p = positionOf(text, needle, occurrence);
  return { line: p.line, character: p.character + needle.length };
}
