#!/usr/bin/env node
/**
 * Pre-install VS Code marketplace extensions into ~/.vscode/extensions
 * (or VSCODE_EXTENSIONS) so e2e can copy them offline/fast.
 *
 * Prefer system `code` CLI when available; else download VSIX via the
 * public Marketplace gallery API and unzip into the extensions folder.
 *
 * Usage:
 *   node scripts/e2e-vscode/install-extensions.mjs
 *   node scripts/e2e-vscode/install-extensions.mjs --ids Vue.volar,ubugeeei.vize,verter.verter-vscode
 */

import { spawnSync } from "node:child_process";
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";
import { tmpdir, homedir } from "node:os";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const rootDir = join(dirname(fileURLToPath(import.meta.url)), "../..");

const DEFAULT_IDS = [
  "Vue.volar",
  "ubugeeei.vize",
  "verter.verter-vscode",
];

function parseArgs(argv) {
  const args = { ids: DEFAULT_IDS.join(",") };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--ids") args.ids = argv[++i];
    else if (argv[i] === "--help" || argv[i] === "-h") args.help = true;
  }
  return args;
}

function extensionsRoot() {
  return (
    process.env.VSCODE_EXTENSIONS ||
    join(process.env.USERPROFILE || process.env.HOME || homedir(), ".vscode", "extensions")
  );
}

function hasExtension(id) {
  const root = extensionsRoot();
  if (!existsSync(root)) return false;
  const needle = id.toLowerCase();
  return readdirSync(root).some((name) => {
    const n = name.toLowerCase();
    return n === needle || n.startsWith(`${needle}-`);
  });
}

function findCodeCli() {
  const candidates = [
    process.env.CODE_CLI,
    "code",
    "code.cmd",
    join(
      process.env.LOCALAPPDATA || "",
      "Programs",
      "Microsoft VS Code",
      "bin",
      "code.cmd",
    ),
    "/usr/bin/code",
    "/usr/local/bin/code",
    "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
  ].filter(Boolean);

  for (const c of candidates) {
    try {
      const r = spawnSync(c, ["--version"], {
        encoding: "utf8",
        shell: process.platform === "win32",
        timeout: 15_000,
      });
      if (r.status === 0) return c;
    } catch {
      /* try next */
    }
  }
  return null;
}

function installViaCodeCli(code, id) {
  console.log(`  code --install-extension ${id}`);
  const r = spawnSync(code, ["--install-extension", id, "--force"], {
    encoding: "utf8",
    shell: process.platform === "win32",
    timeout: 180_000,
    stdio: "inherit",
  });
  return r.status === 0;
}

/**
 * Download VSIX from marketplace (gallery API returns gzip of the vsix).
 */
async function downloadVsix(id, outPath) {
  const [publisher, name] = id.split(".");
  if (!publisher || !name) throw new Error(`bad extension id: ${id}`);
  const url =
    `https://marketplace.visualstudio.com/_apis/public/gallery/publishers/` +
    `${encodeURIComponent(publisher)}/vsextensions/` +
    `${encodeURIComponent(name)}/latest/vspackage`;

  console.log(`  download ${url}`);
  const res = await fetch(url, {
    headers: {
      // Gallery sometimes wants a UA
      "User-Agent": "vue-benchmarks-e2e",
      Accept: "application/octet-stream,*/*",
    },
    redirect: "follow",
  });
  if (!res.ok) {
    throw new Error(`marketplace HTTP ${res.status} for ${id}`);
  }

  mkdirSync(dirname(outPath), { recursive: true });
  // Response is often gzip-compressed VSIX (Content-Encoding: gzip) or raw zip
  const encoding = (res.headers.get("content-encoding") || "").toLowerCase();
  const body = res.body;
  if (!body) throw new Error("empty body");

  const file = createWriteStream(outPath);
  if (encoding.includes("gzip") || encoding.includes("deflate")) {
    // Node fetch may already decompress; if stream is still compressed:
    await pipeline(body, file);
  } else {
    await pipeline(body, file);
  }
  return outPath;
}

/**
 * Unpack vsix (zip) into ~/.vscode/extensions/<publisher>.<name>-<version>
 */
function unpackVsix(vsixPath, id) {
  const AdmZip = tryAdmZip();
  if (!AdmZip) {
    // Fallback: use system tar/PowerShell Expand-Archive after renaming to .zip
    return unpackVsixShell(vsixPath, id);
  }
  const zip = new AdmZip(vsixPath);
  const entry = zip.getEntry("extension/package.json");
  if (!entry) throw new Error(`no extension/package.json in ${vsixPath}`);
  const pkg = JSON.parse(entry.getData().toString("utf8"));
  const version = pkg.version || "0.0.0";
  const folderName = `${pkg.publisher || id.split(".")[0]}.${pkg.name || id.split(".")[1]}-${version}`;
  const dest = join(extensionsRoot(), folderName);
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  // Extract only extension/* into dest root
  for (const e of zip.getEntries()) {
    if (!e.entryName.startsWith("extension/") || e.isDirectory) continue;
    const rel = e.entryName.slice("extension/".length);
    const out = join(dest, rel);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, e.getData());
  }
  console.log(`  unpacked → ${dest}`);
  return dest;
}

function tryAdmZip() {
  try {
    return require("adm-zip");
  } catch {
    return null;
  }
}

function unpackVsixShell(vsixPath, id) {
  const work = join(tmpdir(), `vsix-unpack-${Date.now()}`);
  mkdirSync(work, { recursive: true });
  const zipPath = join(work, "ext.zip");
  // copy as zip
  writeFileSync(zipPath, readFileSync(vsixPath));

  if (process.platform === "win32") {
    const r = spawnSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${work.replace(/'/g, "''")}\\out' -Force`,
      ],
      { encoding: "utf8" },
    );
    if (r.status !== 0) {
      throw new Error(`Expand-Archive failed: ${r.stderr || r.stdout}`);
    }
  } else {
    const r = spawnSync("unzip", ["-q", zipPath, "-d", join(work, "out")], {
      encoding: "utf8",
    });
    if (r.status !== 0) {
      // try tar
      const r2 = spawnSync("tar", ["-xf", zipPath, "-C", join(work, "out")], {
        encoding: "utf8",
      });
      if (r2.status !== 0) {
        throw new Error(`unzip/tar failed for ${vsixPath}`);
      }
    }
  }

  const extRoot = join(work, "out", "extension");
  if (!existsSync(extRoot)) throw new Error("unpacked extension/ missing");
  const pkg = JSON.parse(readFileSync(join(extRoot, "package.json"), "utf8"));
  const folderName = `${pkg.publisher}.${pkg.name}-${pkg.version}`;
  const dest = join(extensionsRoot(), folderName);
  rmSync(dest, { recursive: true, force: true });
  // recursive copy
  spawnSync(
    process.platform === "win32" ? "powershell.exe" : "cp",
    process.platform === "win32"
      ? [
          "-NoProfile",
          "-Command",
          `Copy-Item -Recurse -Force '${extRoot.replace(/'/g, "''")}' '${dest.replace(/'/g, "''")}'`,
        ]
      : ["-a", extRoot, dest],
    { encoding: "utf8" },
  );
  if (!existsSync(dest)) {
    // node fallback
    const { cpSync } = require("node:fs");
    cpSync(extRoot, dest, { recursive: true });
  }
  console.log(`  unpacked → ${dest}`);
  rmSync(work, { recursive: true, force: true });
  return dest;
}

async function installOne(id, codeCli) {
  if (hasExtension(id)) {
    console.log(`✓ already installed: ${id}`);
    return true;
  }
  console.log(`→ install ${id}`);
  if (codeCli && installViaCodeCli(codeCli, id) && hasExtension(id)) {
    console.log(`✓ installed via code CLI: ${id}`);
    return true;
  }

  const vsix = join(tmpdir(), `vue-bench-${id.replace(/\W+/g, "_")}.vsix`);
  try {
    await downloadVsix(id, vsix);
    unpackVsix(vsix, id);
    if (hasExtension(id)) {
      console.log(`✓ installed via marketplace VSIX: ${id}`);
      return true;
    }
  } catch (e) {
    console.error(`  VSIX path failed: ${e.message}`);
  } finally {
    try {
      rmSync(vsix, { force: true });
    } catch {
      /* ignore */
    }
  }
  return false;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(`Usage: node scripts/e2e-vscode/install-extensions.mjs [--ids a,b,c]`);
    process.exit(0);
  }
  const ids = args.ids
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  mkdirSync(extensionsRoot(), { recursive: true });
  const code = findCodeCli();
  if (code) console.log(`code CLI: ${code}`);
  else console.log("code CLI: not found (will try marketplace VSIX download)");

  let failed = 0;
  for (const id of ids) {
    const ok = await installOne(id, code);
    if (!ok) {
      console.error(`✗ failed: ${id}`);
      failed += 1;
    }
  }
  if (failed) process.exit(1);
  console.log("All extensions ready.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
