import { Worker } from "node:worker_threads";
import { join } from "node:path";
import os from "node:os";

/** Exact worker fan-out used by both timing and semantic validation. */
export async function runEslintWorkers(cwd, files, eslintPath) {
  const workerCount = Math.min(os.cpus().length, files.length);
  const chunkSize = Math.ceil(files.length / workerCount);
  const configFile = join(cwd, "eslint.config.mjs");
  const workerCode = `
    const { parentPort, workerData } = require("worker_threads");
    const { ESLint } = require(workerData.eslintPath);
    (async () => {
      const eslint = new ESLint({
        overrideConfigFile: workerData.configFile,
        cwd: workerData.cwd,
      });
      const results = await eslint.lintFiles(workerData.files);
      parentPort.postMessage(results.map((result) => ({
        filePath: result.filePath,
        messages: result.messages.map((message) => ({
          ruleId: message.ruleId,
          message: message.message,
          line: message.line,
          column: message.column,
          endLine: message.endLine,
          endColumn: message.endColumn,
          severity: message.severity,
        })),
      })));
    })().catch((error) => {
      parentPort.postMessage({ error: error && error.stack ? error.stack : String(error) });
    });
  `;

  const workers = [];
  for (let i = 0; i < workerCount; i++) {
    const chunk = files
      .slice(i * chunkSize, Math.min((i + 1) * chunkSize, files.length))
      .map((file) => join(cwd, file));
    if (chunk.length === 0) continue;
    const worker = new Worker(workerCode, {
      eval: true,
      workerData: { cwd, configFile, files: chunk, eslintPath },
    });
    workers.push(
      new Promise((resolve, reject) => {
        let settled = false;
        worker.on("message", (message) => {
          if (settled) return;
          settled = true;
          if (message && message.error) reject(new Error(message.error));
          else resolve(message);
        });
        worker.on("error", reject);
        worker.on("exit", (code) => {
          if (!settled && code !== 0) reject(new Error(`eslint worker exit ${code}`));
        });
      }),
    );
  }
  return (await Promise.all(workers)).flat();
}
