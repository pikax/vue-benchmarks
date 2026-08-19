/**
 * REFERENCE SUITE — copy this shape.
 *
 * Deliberately small: one script hover and one template hover, both gated. It
 * exists to prove the harness end-to-end and to show suite authors the exact
 * contract, including the part that matters most — every timed operation
 * carries a content gate, and the gate is written so that a *correct* server
 * cannot fail it by formatting its payload unusually.
 */

import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { contentText, mergeHover, shouldMeasure, timedColdWarm } from "../context.mjs";
import { positionOf, scaffold } from "../workspace.mjs";

const SOURCE = `<template>
  <p>{{ marker }}</p>
</template>

<script setup lang="ts">
import { ref } from 'vue'

/** Stable hover target — do not rename. */
const marker = ref('smoke-probe')
</script>
`;

/**
 * Join the two hover probes, as the LSP surface does.
 *
 * Ranked independently, a server that leaks the <script setup> type into
 * template context still takes #1 on the script probe — and the script probe
 * is satisfiable by a pattern-matcher, which is the entire reason the template
 * probe exists. Failing either means the hover answers are not trustworthy, so
 * neither row is ranked.
 *
 * Called from measure() when both ops share a session, and from the runner
 * after isolated-cold sessions are merged.
 */
export function pairHoverOps(ops) {
  const failed = ops.filter((o) => o.valid === false);
  if (failed.length && failed.length < ops.length) {
    for (const op of ops) {
      if (op.valid === false) continue;
      op.valid = false;
      op.reason = `unranked because the paired probe failed (${failed
        .map((f) => f.id)
        .join(", ")}) — a hover that is right in one context and wrong in the other is not a comparable measurement`;
    }
  }
  return ops;
}

export const SUITE = {
  id: "smoke",
  label: "Smoke (reference suite)",
  // Template hover is the second request of a shared session unless isolated.
  isolatedColdOps: [{ id: "hover-template", after: "hover-script" }],
  pairOps: pairHoverOps,

  buildWorkspace(dir) {
    scaffold(dir);
    writeFileSync(join(dir, "Smoke.vue"), SOURCE);
    return {
      dir,
      fileCount: 1,
      file: join(dir, "Smoke.vue"),
      fileRel: "Smoke.vue",
      source: SOURCE,
      scriptProbe: positionOf(SOURCE, "marker", 2), // `const marker`
      templateProbe: positionOf(SOURCE, "marker", 1), // `{{ marker }}`
    };
  },

  async measure(ctx) {
    const { ask, openDoc, ws, pathToFileUri } = ctx;
    const uri = pathToFileUri(ws.file);
    openDoc(uri, ws.source);
    await new Promise((r) => setTimeout(r, 50));

    // No discarded settle: the first request of each probe is COLD (project
    // load + empty caches) and the second is WARM. Both are published. The
    // template probe is isolated into its own session by the runner so it is
    // not measured against a server the script probe already warmed.

    const ops = [];

    if (shouldMeasure(ctx, "hover-script")) {
      ops.push(
        await timedColdWarm("hover-script", "Hover (script setup)", async () => {
          const text = contentText(
            await ask(
              "textDocument/hover",
              { textDocument: { uri }, position: ws.scriptProbe },
              30_000,
              mergeHover,
            ),
          );
          // Script position: the symbol is a Ref there.
          const ok = /\bmarker\s*:\s*(Ref\s*<|string)/.test(text);
          return {
            valid: ok,
            reason: ok ? "" : "no type for `marker` at the script position",
            sample: text,
            artifact: Buffer.byteLength(text, "utf8"),
          };
        }),
      );
    }

    if (shouldMeasure(ctx, "hover-template")) {
      ops.push(
        await timedColdWarm("hover-template", "Hover (template interpolation)", async () => {
          const text = contentText(
            await ask(
              "textDocument/hover",
              { textDocument: { uri }, position: ws.templateProbe },
              30_000,
              mergeHover,
            ),
          );
          // Template position: refs auto-unwrap, so `string` is correct and
          // `Ref<...>` is the script type leaking in.
          const leaked = /\bmarker\s*:\s*Ref\s*</.test(text);
          const ok = !leaked && /\bmarker\s*:\s*string/.test(text);
          return {
            valid: ok,
            reason: leaked
              ? "returned Ref<...> — script type leaked into template context"
              : ok
                ? ""
                : "no unwrapped `string` type at the template position",
            sample: text,
            artifact: Buffer.byteLength(text, "utf8"),
          };
        }),
      );
    }

    if (!ctx.only) pairHoverOps(ops);
    return ops;
  },
};
