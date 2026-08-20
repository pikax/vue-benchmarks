#!/usr/bin/env node
import { runCompileValidityMatrix } from "./lib/compile-validity-gates.mjs";

const configurations = [];
for (const target of ["vdom", "vapor"]) {
  for (const env of ["production", "development"]) {
    configurations.push({ target, env, sourceMap: false });
  }
}

const report = runCompileValidityMatrix(configurations);
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
