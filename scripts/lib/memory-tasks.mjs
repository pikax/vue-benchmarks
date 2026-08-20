/**
 * Build isolated memory-probe tasks for each tool.
 * Each task is run in its own child process so RSS is not shared with siblings.
 */

import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync, readFileSync } from "node:fs";
import {
  collectJsxFiles,
  collectVueFiles,
  prepareLintDir,
  prepareTypecheckDir,
  readSources,
} from "./fixtures.mjs";
import { resolveBin } from "./timing.mjs";
import { resolveJsxFixtureDir } from "./surfaces/jsx-compile.mjs";
import { resolveVizeLsp, resolveVerterLsp } from "./surfaces/lsp.mjs";
import {
  materializeRawRenderCorpus,
  materializeStyleSfcCorpus,
  prepareRawRenderCorpus,
  prepareStyleSfcCorpus,
} from "./surfaces/compile.mjs";
import { resolveTsgoBin, withTsgoEnv } from "./tsgo.mjs";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

/**
 * Resolve a CLI into a spawnable { bin, prefixArgs, shell } so Windows can
 * execute .js shims via node and native binaries without .cmd wrappers.
 */
function tryCli(name) {
  let pkgDir = join(rootDir, "node_modules", name);
  let pkgPath = join(pkgDir, "package.json");
  if (!existsSync(pkgPath)) {
    try {
      pkgPath = require.resolve(`${name}/package.json`, { paths: [rootDir] });
      pkgDir = dirname(pkgPath);
    } catch {
      pkgPath = null;
    }
  }
  if (pkgPath && existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const binField = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.[name];
      if (binField) {
        const abs = resolve(dirname(pkgPath), binField);
        if (existsSync(abs)) {
          // JS entry (with or without extension) — run under node for portable spawn
          let isNodeScript = /\.(c?js|mjs)$/i.test(abs);
          if (!isNodeScript) {
            try {
              const head = readFileSync(abs, "utf8").slice(0, 80);
              if (/node/i.test(head) && (head.startsWith("#!") || head.includes("import "))) {
                isNodeScript = true;
              }
            } catch {
              /* binary */
            }
          }
          if (isNodeScript) {
            return {
              bin: process.execPath,
              argsPrefix: [abs],
              shell: false,
            };
          }
          // Native binary
          return { bin: abs, argsPrefix: [], shell: false };
        }
      }
    } catch {
      /* fall through */
    }
  }
  try {
    const shim = resolveBin(name, rootDir);
    return {
      bin: shim,
      argsPrefix: [],
      shell: process.platform === "win32" && /\.cmd$/i.test(shim),
    };
  } catch {
    return null;
  }
}

function nodePathEnv() {
  return [join(rootDir, "node_modules"), process.env.NODE_PATH ?? ""]
    .filter(Boolean)
    .join(process.platform === "win32" ? ";" : ":");
}

/**
 * @returns {Array<{
 *   id: string,
 *   label: string,
 *   package: string,
 *   surface: string,
 *   kind: 'cli'|'inproc',
 *   skip?: string,
 *   cli?: { bin: string, args: string[], cwd: string, env?: object },
 *   inproc?: { handler: string, payload: object },
 * }>}
 */
export function buildMemoryTasks(fixtureDir, options = {}) {
  const fileLimit = options.fileLimit ?? 50;
  const checkLimit = options.checkFileLimit ?? Math.min(50, fileLimit);
  const metaLimit = options.metaFileLimit ?? Math.min(30, fileLimit);
  const workRoot = options.workRoot ?? join(rootDir, "work", "memory");

  const vueFiles = collectVueFiles(fixtureDir, fileLimit);
  const vueSources = readSources(fixtureDir, vueFiles).map((f) => ({
    filename: f.filename,
    path: f.path,
    source: f.source,
  }));
  const corpusCompiler = require(require.resolve("@vue/compiler-sfc", { paths: [rootDir] }));
  const rawRenderSources = materializeRawRenderCorpus(
    prepareRawRenderCorpus(vueSources, corpusCompiler),
    { phase: "measure", iteration: 0 },
  ).map(({ filename, path, source }) => ({ filename, path, source }));
  const styleSources = materializeStyleSfcCorpus(
    prepareStyleSfcCorpus(vueSources, corpusCompiler),
    { phase: "measure", iteration: 0 },
  ).map(({ filename, path, source, componentId, styles }) => ({
    filename,
    path,
    source,
    componentId,
    styles,
  }));

  const tasks = [];

  // --- SFC compile (vdom prod only by default for memory — expand via options) ---
  const compileTargets = String(options.compileTargets || "vdom").split(",");
  const compileEnvs = String(options.compileEnvs || "production").split(",");

  for (const target of compileTargets) {
    for (const env of compileEnvs) {
      const vapor = target.trim() === "vapor";
      const isProd = env.trim() === "production";
      const cell = `${target.trim()}-${isProd ? "prod" : "dev"}`;

      if (!vapor) {
        tasks.push({
          id: `mem-vue-3.5-1t-${cell}`,
          label: `@vue/compiler-sfc 3.5 (1T) ${cell}`,
          package: "@vue/compiler-sfc",
          surface: "compile",
          comparisonClass: "raw-render",
          kind: "inproc",
          inproc: {
            handler: "vue-compile-sfc",
            payload: {
              packageName: "@vue/compiler-sfc",
              vapor: false,
              isProd,
              sources: rawRenderSources,
            },
          },
        });
        tasks.push({
          id: `mem-vue-3.6-1t-${cell}`,
          label: `@vue/compiler-sfc 3.6 (1T) ${cell}`,
          package: "@vue/compiler-sfc-36",
          surface: "compile",
          comparisonClass: "raw-render",
          kind: "inproc",
          inproc: {
            handler: "vue-compile-sfc",
            payload: {
              packageName: "@vue/compiler-sfc-36",
              vapor,
              isProd,
              sources: rawRenderSources,
            },
          },
        });
      } else {
        tasks.push({
          id: `mem-vue-3.6-1t-${cell}`,
          label: `@vue/compiler-sfc 3.6 vapor (1T) ${cell}`,
          package: "@vue/compiler-sfc-36",
          surface: "compile",
          comparisonClass: "raw-render",
          kind: "inproc",
          inproc: {
            handler: "vue-compile-sfc",
            payload: {
              packageName: "@vue/compiler-sfc-36",
              vapor: true,
              isProd,
              sources: rawRenderSources,
            },
          },
        });
      }

      tasks.push({
        id: `mem-vue-style-reference-${cell}`,
        label: `Vue compiler-sfc ${vapor ? "3.6" : "3.5"} reference (render + CSS, 1T) ${cell}`,
        package: vapor ? "@vue/compiler-sfc-36" : "@vue/compiler-sfc",
        surface: "compile",
        comparisonClass: "sfc-with-style",
        kind: "inproc",
        inproc: {
          handler: "vue-compile-sfc",
          payload: {
            packageName: vapor ? "@vue/compiler-sfc-36" : "@vue/compiler-sfc",
            vapor,
            isProd,
            includeStyles: true,
            sources: styleSources,
          },
        },
      });

      tasks.push({
        id: `mem-vize-1t-${cell}`,
        label: `Vize compileSfc loop (render + CSS, 1T) ${cell}`,
        package: "@vizejs/native",
        surface: "compile",
        comparisonClass: "sfc-with-style",
        kind: "inproc",
        inproc: {
          handler: "vize-compile-sfc",
          payload: {
            vapor,
            isProd,
            sourceMap: false,
            sources: styleSources,
          },
        },
      });

      tasks.push({
        id: `mem-vize-full-sfc-batch-${cell}`,
        label: `Vize compileSfcBatchWithResults (render + CSS, Rayon global pool) ${cell}`,
        package: "@vizejs/native",
        surface: "compile",
        comparisonClass: "sfc-with-style",
        kind: "inproc",
        inproc: {
          handler: "vize-compile-batch",
          payload: {
            vapor,
            isProd,
            sources: styleSources,
          },
        },
      });

      tasks.push({
        id: `mem-vize-raw-render-batch-${cell}`,
        label: `Vize compileSfcBatchWithResults (raw style-free render, Rayon global pool) ${cell}`,
        package: "@vizejs/native",
        surface: "compile",
        comparisonClass: "raw-render",
        kind: "inproc",
        inproc: {
          handler: "vize-compile-batch",
          payload: {
            vapor,
            isProd,
            sources: rawRenderSources,
          },
        },
      });

      // fervid is VDOM-only — no vapor task, matching the timing surface.
      if (!vapor) {
        tasks.push({
          id: `mem-fervid-1t-${cell}`,
          label: `fervid compileSync (1T) ${cell}`,
          package: "@fervid/napi",
          surface: "compile",
          comparisonClass: "sfc-with-style",
          kind: "inproc",
          inproc: {
            handler: "fervid-compile-sfc",
            payload: {
              isProd,
              sources: styleSources,
            },
          },
        });
      }

      tasks.push({
        id: `mem-verter-raw-render-${cell}`,
        label: `Verter compileMany (stateless raw render) ${cell}`,
        package: "@verter/native",
        surface: "compile",
        comparisonClass: "raw-render",
        kind: "inproc",
        inproc: {
          handler: "verter-compile-many",
          payload: {
            vapor,
            isProd,
            workspaceRoot: fixtureDir,
            sources: rawRenderSources,
          },
        },
      });

      tasks.push({
        id: `mem-verter-render-style-${cell}`,
        label: `Verter compileMany + processStyle (render + CSS) ${cell}`,
        package: "@verter/native",
        surface: "compile",
        comparisonClass: "sfc-with-style",
        kind: "inproc",
        inproc: {
          handler: "verter-compile-many",
          payload: {
            vapor,
            isProd,
            includeStyles: true,
            workspaceRoot: fixtureDir,
            sources: styleSources,
          },
        },
      });
    }
  }

  // --- JSX compile ---
  const jsxDir = resolveJsxFixtureDir(fixtureDir);
  if (jsxDir && existsSync(jsxDir)) {
    const jsxFiles = collectJsxFiles(jsxDir, fileLimit);
    const jsxSources = readSources(jsxDir, jsxFiles).map((f) => ({
      filename: f.filename,
      source: f.source,
    }));
    if (jsxSources.length) {
      tasks.push({
        id: "mem-jsx-vapor-rs-vapor",
        label: "@vue-jsx-vapor/compiler-rs (vapor)",
        package: "@vue-jsx-vapor/compiler-rs",
        surface: "jsx-compile",
        kind: "inproc",
        inproc: {
          handler: "jsx-compiler-rs",
          payload: { interop: false, sources: jsxSources },
        },
      });
      tasks.push({
        id: "mem-jsx-vapor-rs-vdom",
        label: "@vue-jsx-vapor/compiler-rs (interop VDOM)",
        package: "@vue-jsx-vapor/compiler-rs",
        surface: "jsx-compile",
        kind: "inproc",
        inproc: {
          handler: "jsx-compiler-rs",
          payload: { interop: true, sources: jsxSources },
        },
      });
      tasks.push({
        id: "mem-jsx-babel-vue",
        label: "@vue/babel-plugin-jsx",
        package: "@vue/babel-plugin-jsx",
        surface: "jsx-compile",
        kind: "inproc",
        inproc: {
          handler: "jsx-babel-vue",
          payload: { sources: jsxSources },
        },
      });
    }
  }

  // --- Typecheck CLIs ---
  if (vueFiles.length) {
    const checkDir = prepareTypecheckDir(
      fixtureDir,
      vueFiles.slice(0, checkLimit),
      workRoot,
      `mem-tc-${checkLimit}`,
    );
    const np = nodePathEnv();
    const tsgo = resolveTsgoBin(rootDir);
    for (const [id, label, binName, args] of [
      ["mem-vue-tsc", "vue-tsc", "vue-tsc", ["--noEmit", "-p", "tsconfig.json"]],
      ["mem-vize-check", "Vize check", "vize", ["check", ".", "--tsconfig", "tsconfig.json"]],
      ["mem-verter-tsc", "verter-tsc", "verter-tsc", ["--noEmit", "-p", "tsconfig.json"]],
      ["mem-golar-typecheck", "Golar typecheck", "golar", ["typecheck"]],
    ]) {
      const cli = tryCli(binName);
      const needsTsgo = binName === "verter-tsc";
      const skip = !cli
        ? `${binName} not found`
        : needsTsgo && !tsgo.bin
          ? `tsgo not found (${tsgo.notes})`
          : undefined;
      tasks.push({
        id,
        label,
        package: binName,
        surface: "typecheck",
        kind: "cli",
        skip,
        cli:
          cli && !skip
            ? {
                bin: cli.bin,
                args: [...cli.argsPrefix, ...args],
                cwd: checkDir,
                env: withTsgoEnv({ NODE_PATH: np }, rootDir),
                shell: cli.shell,
                // prepareTypecheckDir builds the same clean corpus used by the
                // timing row. Diagnostics are not an expected-success exit.
                validation: { kind: "typecheck-clean" },
              }
            : undefined,
      });
    }
  }

  // --- Format CLIs on a fresh throwaway copy for every resource sample ---
  for (const [id, label, binName, args] of [
    ["mem-prettier", "Prettier", "prettier", ["--write", "**/*.vue", "--log-level", "error"]],
    ["mem-oxfmt", "Oxfmt", "oxfmt", [".", "--write"]],
    ["mem-vize-fmt", "Vize fmt", "vize", ["fmt", "--write", "."]],
    // Script block only — its footprint is not comparable to a whole-SFC
    // formatter's, for the same reason the format surface leaves it unranked.
    ["mem-biome-fmt", "Biome format", "biome", ["format", "--write", "."]],
  ]) {
    const cli = tryCli(binName);
    tasks.push({
      id,
      label,
      package: binName,
      surface: "format",
      kind: "cli",
      skip: cli ? undefined : `${binName} not found`,
      cli: cli
        ? {
            bin: cli.bin,
            args: [...cli.argsPrefix, ...args],
            // Each sample gets a pristine copy inside memory-worker. Reusing one
            // directory made sample 1 format dirty files and samples 2/3 measure
            // already-formatted inputs.
            cwd: fixtureDir,
            shell: cli.shell,
            validation: { kind: "exit-zero" },
            freshCopy: {
              id,
              fixtureDir,
              files: vueFiles,
              extraFiles: [".prettierrc.json", "biome.json", "package.json"],
              workRoot: join(workRoot, "fmt-samples"),
            },
          }
        : undefined,
    });
  }

  // --- Lint ---
  // Match the timing surface's isolated, repo-bounded corpus and configs. The
  // old CLI rows walked fixtureDir directly: at --file-limit=2 Vize processed
  // all 20 fixture SFCs, while Biome processed zero because its project/config
  // discovery rejected the directory. Those were not resource measurements of
  // the named two-file workload.
  const lintDir = prepareLintDir(fixtureDir, vueFiles, workRoot, `mem-n${vueFiles.length}`);
  tasks.push({
    id: "mem-eslint-vue",
    label: "eslint-plugin-vue (1T)",
    package: "eslint-plugin-vue",
    surface: "lint",
    kind: "inproc",
    inproc: {
      handler: "eslint-vue",
      payload: {
        fixtureDir: lintDir,
        files: vueFiles.map((f) => join(lintDir, f)),
      },
    },
  });

  const vizeCli = tryCli("vize");
  tasks.push({
    id: "mem-vize-lint",
    label: "Vize lint (default threads)",
    package: "vize",
    surface: "lint",
    kind: "cli",
    skip: vizeCli ? undefined : "vize not found",
    cli: vizeCli
      ? {
          bin: vizeCli.bin,
          args: [...vizeCli.argsPrefix, "lint", "."],
          cwd: lintDir,
          shell: vizeCli.shell,
          validation: {
            kind: "lint-scan",
            findingExitCodes: [1],
            expectedMinimumFiles: vueFiles.length,
          },
        }
      : undefined,
  });

  const biomeCli = tryCli("biome");
  tasks.push({
    id: "mem-biome-lint",
    label: "Biome lint (default threads)",
    package: "@biomejs/biome",
    surface: "lint",
    kind: "cli",
    skip: biomeCli ? undefined : "biome not found",
    cli: biomeCli
      ? {
          bin: biomeCli.bin,
          args: [...biomeCli.argsPrefix, "lint", "."],
          cwd: lintDir,
          shell: biomeCli.shell,
          validation: {
            kind: "lint-scan",
            findingExitCodes: [1],
            expectedMinimumFiles: vueFiles.length,
          },
        }
      : undefined,
  });

  // prepareLintDir places .oxlintrc.json beside this shared isolated corpus.
  // Without it the Vue plugin is off and the resource row measures fewer rules
  // than the timing row with the same name.
  const oxlintCli = tryCli("oxlint");
  tasks.push({
    id: "mem-oxlint",
    // The entry point is in the label for the same reason the LSP rows carry
    // theirs. oxlint ships no standalone binary — it is a NAPI addon inside a
    // Node process (`@oxlint/binding-*`), so this row includes a V8 heap that
    // the Biome row above, a native executable, does not. Measured on 20 SFCs:
    // 73 MiB against Biome's 8 MiB. That IS what running `oxlint` costs, but a
    // row labelled plain "Oxlint" would read as a linter being 9x heavier.
    label: "Oxlint (default threads; Node host + NAPI addon)",
    package: "oxlint",
    surface: "lint",
    kind: "cli",
    skip: oxlintCli ? undefined : "oxlint not found",
    cli: oxlintCli
      ? {
          bin: oxlintCli.bin,
          args: [...oxlintCli.argsPrefix, "."],
          cwd: lintDir,
          shell: oxlintCli.shell,
          validation: {
            kind: "lint-scan",
            findingExitCodes: [1],
            silentExitZero: "unknown",
          },
        }
      : undefined,
  });

  tasks.push({
    id: "mem-verter-lint",
    label: "Verter host lint",
    package: "@verter/native",
    surface: "lint",
    kind: "inproc",
    inproc: {
      handler: "verter-lint",
      payload: { sources: vueSources },
    },
  });

  // --- Component-meta ---
  const metaFiles = vueFiles.slice(0, metaLimit);
  const metaDir = prepareTypecheckDir(fixtureDir, metaFiles, workRoot, `mem-meta-${metaLimit}`);

  tasks.push({
    id: "mem-vue-component-meta",
    label: "vue-component-meta",
    package: "vue-component-meta",
    surface: "component-meta",
    kind: "inproc",
    inproc: {
      handler: "vue-component-meta",
      payload: {
        tsconfig: join(metaDir, "tsconfig.json"),
        files: metaFiles.map((f) => join(metaDir, f)),
      },
    },
  });

  tasks.push({
    id: "mem-verter-component-meta",
    label: "@verter/component-meta",
    package: "@verter/component-meta",
    surface: "component-meta",
    kind: "inproc",
    inproc: {
      handler: "verter-component-meta",
      payload: {
        root: metaDir,
        tsconfig: join(metaDir, "tsconfig.json"),
        files: metaFiles.map((f) => join(metaDir, f)),
      },
    },
  });

  // Language servers.
  //
  // Every surface follows the same split: bench.mjs measures speed, this file
  // measures memory, and neither samples the other. The LSP surface previously
  // had no memory coverage at all, so the one tool class that stays resident in
  // an editor was the one whose footprint went unmeasured.
  // The label must name the ENTRY POINT, not just the tool. Vize resolves to
  // either the standalone native server its extension ships or the npm
  // package's Node entry, and the two have very different footprints — the Node
  // path carries a 34MB NAPI addon inside a V8 heap. A row labelled only
  // "LSP vize" would silently mean different things on a machine with VS Code
  // installed and on CI, and two such rows are not comparable.
  const lspEntryLabel = { volar: null, vize: resolveVizeLsp, verter: resolveVerterLsp };
  for (const server of ["volar", "vize", "verter"]) {
    const extra = lspEntryLabel[server]?.()?.labelExtra ?? null;
    tasks.push({
      id: `mem-lsp-${server}`,
      label:
        server === "volar"
          ? "LSP Volar — Vue server process only (TypeScript half not sampled)"
          : `LSP ${server} (server process${extra ? `, ${extra}` : ""})`,
      package: server,
      surface: "lsp",
      kind: "inproc",
      inproc: { handler: "lsp-session", payload: { server } },
    });
  }

  return tasks.filter((t) => t.id);
}
