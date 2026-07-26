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
import { contentText, mergeHover, timed } from "../context.mjs";
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

export const SUITE = {
  id: "smoke",
  label: "Smoke (reference suite)",

  buildWorkspace(dir) {
    scaffold(dir);
    writeFileSync(join(dir, "Smoke.vue"), SOURCE);
    return {
      dir,
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

    const ops = [];

    ops.push(
      await timed("hover-script", "Hover (script setup)", async () => {
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

    ops.push(
      await timed("hover-template", "Hover (template interpolation)", async () => {
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

    return ops;
  },
};
