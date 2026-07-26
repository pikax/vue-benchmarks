#!/usr/bin/env node
/**
 * Generate Vue SFC fixtures.
 *
 * Default: UNIQUE content per file (uniquify) — required for compile ranking
 * benches against content-hash caches (e.g. Vize).
 *
 * Also emits:
 *   fixtures/{N}-vapor     — unique + <script setup vapor>
 *   fixtures/{N}-repeated  — IDENTICAL body every file (cache-behavior demo only)
 *   fixtures/jsx-{N}       — unique .jsx files for vue-jsx-vapor / babel JSX compile
 */

import { mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { writeEnvDTs, writeGolarConfig, writeTsconfig } from "./lib/fixtures.mjs";
import { createTemplates, uniquify, repeatedBodyTemplate } from "./lib/templates.mjs";
import { createJsxCorpus } from "./lib/jsx-templates.mjs";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function parseArgs(argv) {
  const args = {
    counts: "50,200,1000",
    out: "fixtures",
    withVapor: true,
    withRepeated: true,
    withJsx: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--counts") args.counts = argv[++i];
    else if (a === "--out") args.out = argv[++i];
    else if (a === "--with-vapor") args.withVapor = true;
    else if (a === "--no-vapor") args.withVapor = false;
    else if (a === "--with-repeated") args.withRepeated = true;
    else if (a === "--no-repeated") args.withRepeated = false;
    else if (a === "--with-jsx") args.withJsx = true;
    else if (a === "--no-jsx") args.withJsx = false;
    else if (a === "--help" || a === "-h") args.help = true;
  }
  return args;
}

function contentSha(source) {
  return createHash("sha256").update(source).digest("hex").slice(0, 16);
}

function writeSupportFiles(dir, { name, count, mode, uniqueContents }) {
  writeEnvDTs(dir);
  writeTsconfig(dir);
  writeGolarConfig(dir);
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify({ private: true, type: "module", name }, null, 2)}\n`,
  );
  // eslint flat config for lint surface
  writeFileSync(
    join(dir, "eslint.config.mjs"),
    `import pluginVue from "eslint-plugin-vue";
import tsParser from "@typescript-eslint/parser";

// The corpus is <script setup lang="ts">. Without parserOptions.parser,
// vue-eslint-parser cannot read TypeScript and ESLint emits a fatal parse
// error per file — it was silently skipping ~30% of the corpus (6 of 20
// files), which inflated its measured throughput against tools that parsed
// everything. Wiring the TS parser makes the lint comparison honest.
export default [
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.vue"],
    languageOptions: {
      parserOptions: {
        parser: tsParser,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "vue/multi-word-component-names": "off",
      "vue/require-default-prop": "off",
      "vue/require-explicit-emits": "off",
    },
  },
];
`,
  );
  writeFileSync(
    join(dir, "manifest.json"),
    `${JSON.stringify(
      {
        count,
        mode,
        uniqueContents,
        generatedAt: new Date().toISOString(),
        note:
          mode === "repeated"
            ? "INTENTIONAL identical file bodies (different names) for content-hash cache demos. Do NOT use as primary compile ranking."
            : "Every .vue body is content-unique (uniquify). Safe against Vize-style content-hash caches.",
      },
      null,
      2,
    )}\n`,
  );
}

function writeUniqueCorpus(dir, count, { vapor }) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const templates = createTemplates({ vapor });
  const shas = new Set();
  for (let i = 0; i < count; i++) {
    const base = templates[i % templates.length];
    const source = uniquify(base, i);
    const sha = contentSha(source);
    if (shas.has(sha)) {
      // Extreme collision guard — inject extra salt
      const salted = uniquify(`${base}\n<!-- salt:${i}:${Date.now()} -->\n`, i);
      writeFileSync(join(dir, `Comp${String(i).padStart(5, "0")}.vue`), salted);
      shas.add(contentSha(salted));
    } else {
      shas.add(sha);
      writeFileSync(join(dir, `Comp${String(i).padStart(5, "0")}.vue`), source);
    }
  }
  writeSupportFiles(dir, {
    name: vapor ? `vue-bench-${count}-vapor` : `vue-bench-${count}`,
    count,
    mode: vapor ? "unique-vapor" : "unique",
    uniqueContents: true,
  });
  return shas.size;
}

function writeRepeatedCorpus(dir, count) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const body = repeatedBodyTemplate();
  for (let i = 0; i < count; i++) {
    // Same content, different filenames — content-hash caches treat these as one unit
    writeFileSync(join(dir, `Comp${String(i).padStart(5, "0")}.vue`), body);
  }
  writeSupportFiles(dir, {
    name: `vue-bench-${count}-repeated`,
    count,
    mode: "repeated",
    uniqueContents: false,
  });
}

function writeJsxCorpus(dir, count) {
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const files = createJsxCorpus(count);
  const shas = new Set();
  for (const f of files) {
    shas.add(contentSha(f.source));
    writeFileSync(join(dir, f.filename), f.source);
  }
  writeTsconfig(dir, { include: ["**/*.jsx", "**/*.tsx", "**/*.ts"] });
  writeFileSync(
    join(dir, "package.json"),
    `${JSON.stringify(
      { private: true, type: "module", name: `vue-bench-jsx-${count}` },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(dir, "eslint.config.mjs"),
    `import jsxVapor from "@vue-jsx-vapor/eslint";

export default [
  {
    files: ["**/*.{jsx,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "vue-jsx-vapor": jsxVapor },
  },
];
`,
  );
  writeFileSync(
    join(dir, "manifest.json"),
    `${JSON.stringify(
      {
        count,
        mode: "unique-jsx",
        uniqueContents: true,
        distinctShas: shas.size,
        generatedAt: new Date().toISOString(),
        note: "Unique .jsx files for jsx-compile surface (vue-jsx-vapor / @vue/babel-plugin-jsx). Not SFCs.",
      },
      null,
      2,
    )}\n`,
  );
  return shas.size;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/generate.mjs [options]

Options:
  --counts 50,200,1000   Fixture sizes (default: 50,200,1000)
  --out fixtures         Output root
  --with-vapor / --no-vapor
  --with-repeated / --no-repeated
  --with-jsx / --no-jsx

Outputs per count N:
  fixtures/N              UNIQUE SFC content (primary ranking corpus)
  fixtures/N-vapor        UNIQUE + <script setup vapor>
  fixtures/N-repeated     IDENTICAL bodies (cache demo only)
  fixtures/jsx-N          UNIQUE .jsx files (jsx-compile surface)
`);
    process.exit(0);
  }

  const counts = args.counts
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (counts.length === 0) {
    console.error("No valid counts.");
    process.exit(1);
  }

  const outRoot = join(rootDir, args.out);
  mkdirSync(outRoot, { recursive: true });

  for (const count of counts) {
    const uniqueDir = join(outRoot, String(count));
    const n = writeUniqueCorpus(uniqueDir, count, { vapor: false });
    console.log(`Generated ${count} UNIQUE SFCs (${n} distinct SHAs) → ${uniqueDir}`);

    if (args.withVapor) {
      const vaporDir = join(outRoot, `${count}-vapor`);
      const vn = writeUniqueCorpus(vaporDir, count, { vapor: true });
      console.log(`Generated ${count} UNIQUE vapor SFCs (${vn} SHAs) → ${vaporDir}`);
    }

    if (args.withRepeated) {
      const repDir = join(outRoot, `${count}-repeated`);
      writeRepeatedCorpus(repDir, count);
      console.log(
        `Generated ${count} REPEATED-body SFCs (1 distinct SHA) → ${repDir} [cache demo only]`,
      );
    }

    if (args.withJsx) {
      const jsxDir = join(outRoot, `jsx-${count}`);
      const jn = writeJsxCorpus(jsxDir, count);
      console.log(`Generated ${count} UNIQUE JSX files (${jn} SHAs) → ${jsxDir}`);
    }
  }
}

main();
