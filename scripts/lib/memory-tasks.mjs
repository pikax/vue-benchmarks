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
  prepareTypecheckDir,
  readSources,
  copyFixtureSubset,
} from "./fixtures.mjs";
import { resolveBin } from "./timing.mjs";
import { resolveJsxFixtureDir } from "./surfaces/jsx-compile.mjs";
import { resolveVizeLsp, resolveVerterLsp } from "./surfaces/lsp.mjs";
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
          kind: "inproc",
          inproc: {
            handler: "vue-compile-sfc",
            payload: {
              packageName: "@vue/compiler-sfc",
              vapor: false,
              isProd,
              sources: vueSources,
            },
          },
        });
        tasks.push({
          id: `mem-vue-3.6-1t-${cell}`,
          label: `@vue/compiler-sfc 3.6 (1T) ${cell}`,
          package: "@vue/compiler-sfc-36",
          surface: "compile",
          kind: "inproc",
          inproc: {
            handler: "vue-compile-sfc",
            payload: {
              packageName: "@vue/compiler-sfc-36",
              vapor,
              isProd,
              sources: vueSources,
            },
          },
        });
      } else {
        tasks.push({
          id: `mem-vue-3.6-1t-${cell}`,
          label: `@vue/compiler-sfc 3.6 vapor (1T) ${cell}`,
          package: "@vue/compiler-sfc-36",
          surface: "compile",
          kind: "inproc",
          inproc: {
            handler: "vue-compile-sfc",
            payload: {
              packageName: "@vue/compiler-sfc-36",
              vapor: true,
              isProd,
              sources: vueSources,
            },
          },
        });
      }

      tasks.push({
        id: `mem-vize-1t-${cell}`,
        label: `Vize native loop (1T) ${cell}`,
        package: "@vizejs/native",
        surface: "compile",
        kind: "inproc",
        inproc: {
          handler: "vize-compile-sfc",
          payload: {
            vapor,
            sourceMap: !isProd,
            sources: vueSources,
          },
        },
      });

      tasks.push({
        id: `mem-vize-batch-${cell}`,
        label: `Vize native batch ${cell}`,
        package: "@vizejs/native",
        surface: "compile",
        kind: "inproc",
        inproc: {
          handler: "vize-compile-batch",
          payload: {
            vapor,
            sources: vueSources,
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
          kind: "inproc",
          inproc: {
            handler: "fervid-compile-sfc",
            payload: {
              isProd,
              sources: vueSources,
            },
          },
        });
      }

      tasks.push({
        id: `mem-verter-stateless-${cell}`,
        label: `Verter compileMany (stateless) ${cell}`,
        package: "@verter/native",
        surface: "compile",
        kind: "inproc",
        inproc: {
          handler: "verter-compile-many",
          payload: {
            vapor,
            isProd,
            sources: vueSources,
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
      const skip =
        !cli
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
              }
            : undefined,
      });
    }
  }

  // --- Format CLIs on a throwaway copy (prepared here so worker only runs the tool) ---
  for (const [id, label, binName, args] of [
    ["mem-prettier", "Prettier", "prettier", ["--write", "**/*.vue"]],
    ["mem-oxfmt", "Oxfmt", "oxfmt", ["--write", "."]],
    ["mem-vize-fmt", "Vize fmt", "vize", ["fmt", "--write"]],
    // Script block only — its footprint is not comparable to a whole-SFC
    // formatter's, for the same reason the format surface leaves it unranked.
    ["mem-biome-fmt", "Biome format", "biome", ["format", "--write", "."]],
  ]) {
    const cli = tryCli(binName);
    const fmtDir = join(workRoot, "fmt-src", id);
    if (cli && vueFiles.length) {
      copyFixtureSubset(fixtureDir, fmtDir, vueFiles, ["package.json", "tsconfig.json"]);
    }
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
            cwd: fmtDir,
            shell: cli.shell,
          }
        : undefined,
    });
  }

  // --- Lint ---
  tasks.push({
    id: "mem-eslint-vue",
    label: "eslint-plugin-vue (1T)",
    package: "eslint-plugin-vue",
    surface: "lint",
    kind: "inproc",
    inproc: {
      handler: "eslint-vue",
      payload: {
        fixtureDir,
        files: vueFiles.map((f) => join(fixtureDir, f)),
      },
    },
  });

  const vizeCli = tryCli("vize");
  tasks.push({
    id: "mem-vize-lint",
    label: "Vize lint",
    package: "vize",
    surface: "lint",
    kind: "cli",
    skip: vizeCli ? undefined : "vize not found",
    cli: vizeCli
      ? {
          bin: vizeCli.bin,
          args: [...vizeCli.argsPrefix, "lint", ".", "--quiet"],
          cwd: fixtureDir,
          shell: vizeCli.shell,
        }
      : undefined,
  });

  const biomeCli = tryCli("biome");
  tasks.push({
    id: "mem-biome-lint",
    label: "Biome lint",
    package: "@biomejs/biome",
    surface: "lint",
    kind: "cli",
    skip: biomeCli ? undefined : "biome not found",
    cli: biomeCli
      ? {
          bin: biomeCli.bin,
          args: [...biomeCli.argsPrefix, "lint", "."],
          cwd: fixtureDir,
          shell: biomeCli.shell,
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
  const metaSources = readSources(fixtureDir, metaFiles);
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
    label: "Verter ComponentMetaHost",
    package: "@verter/native",
    surface: "component-meta",
    kind: "inproc",
    inproc: {
      handler: "verter-component-meta",
      payload: {
        sources: metaSources.map((f) => ({
          path: f.path.replace(/\\/g, "/"),
          source: f.source,
        })),
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
      label: `LSP ${server} (server process${extra ? `, ${extra}` : ""})`,
      package: server,
      surface: "lsp",
      kind: "inproc",
      inproc: { handler: "lsp-session", payload: { server } },
    });
  }

  return tasks.filter((t) => t.id);
}
