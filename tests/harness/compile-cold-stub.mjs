import { readFileSync, writeFileSync } from "node:fs";

const [, , payloadPath, variantId, rawIteration, outputPath] = process.argv;
const payload = JSON.parse(readFileSync(payloadPath, "utf8"));
const iteration = Number(rawIteration);

if (variantId === payload.failId) {
  writeFileSync(
    outputPath,
    JSON.stringify({ error: `planted failure for ${variantId}` }),
  );
  process.exit(1);
}

const base = variantId === "a" ? 10 : 20;
writeFileSync(
  outputPath,
  JSON.stringify({
    ok: true,
    ms: base + iteration,
    meta: { adapterOptionsHash: `options-${variantId}`, inputCount: 2 },
  }),
);
