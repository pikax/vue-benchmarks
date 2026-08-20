#!/usr/bin/env node
/**
 * Process-isolated fervid CSS feature probe.
 *
 * fervid may signal unsupported compiler constructs with a Rust panic that
 * aborts Node instead of throwing through NAPI. The parent benchmark must not
 * risk losing every compiler row merely to validate this optional candidate.
 */
import { Compiler } from "@fervid/napi";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { assertOnlyAllowedFervidDiagnostics } from "./fervid-diagnostics.mjs";
import {
  STYLE_FEATURE_CASES,
  assertStyleFeature,
  cssModuleMapping,
} from "./style-feature-gates.mjs";

function check(feature, result) {
  assertOnlyAllowedFervidDiagnostics(result, `fervid style gate ${feature}`);
  const css = (result.styles ?? []).map((style) => style.code ?? "").join("\n");
  assertStyleFeature(feature, {
    css,
    js: result?.code ?? "",
    modules: cssModuleMapping(result),
  });
}

async function main() {
  try {
    const entrypoint = process.argv.includes("--async") ? "async" : "sync";
    const compiler = new Compiler({ isProduction: true });
    const results = [];
    const compiled =
      entrypoint === "async"
        ? await Promise.allSettled(
            STYLE_FEATURE_CASES.map((feature) =>
              compiler.compileAsync(feature.source, {
                id: "abc12345",
                filename: `/style-gate/${feature.id}.vue`,
              }),
            ),
          )
        : STYLE_FEATURE_CASES.map((feature) => {
            try {
              return {
                status: "fulfilled",
                value: compiler.compileSync(feature.source, {
                  id: "abc12345",
                  filename: `/style-gate/${feature.id}.vue`,
                }),
              };
            } catch (error) {
              return { status: "rejected", reason: error };
            }
          });
    for (let index = 0; index < STYLE_FEATURE_CASES.length; index++) {
      const feature = STYLE_FEATURE_CASES[index];
      try {
        const settled = compiled[index];
        if (settled.status === "rejected") throw settled.reason;
        const result = settled.value;
        check(feature.id, result);
        results.push({ id: feature.id, ok: true });
      } catch (error) {
        results.push({
          id: feature.id,
          ok: false,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    const ok = results.every((result) => result.ok);
    process.stdout.write(`${JSON.stringify({ ok, entrypoint, results })}\n`);
    if (!ok) process.exitCode = 1;
  } catch (error) {
    process.stdout.write(
      `${JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : String(error),
      })}\n`,
    );
    process.exitCode = 1;
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  await main();
}
