/** Source-based oracles for navigation edits. All changes stay in disposable strings. */
import { createRequire } from "node:module";
import { isDeepStrictEqual } from "node:util";
import { descriptorProjection, semanticProjection } from "../format-validity-plants.mjs";

const require = createRequire(import.meta.url);
const ts = require("typescript");
const { parse, compileScript, compileTemplate } = require("@vue/compiler-sfc");

export function positionAt(source, offset) {
  const lines = source.slice(0, offset).split("\n");
  return { line: lines.length - 1, character: lines.at(-1).length };
}

export function rangeOf(source, start, end) {
  return { start: positionAt(source, start), end: positionAt(source, end) };
}

/** LSP positions are UTF-16. CRLF belongs to the line ending, not its text. */
export function rangeOffsets(source, range) {
  const lines = source.split("\n");
  const offset = (position) => {
    if (!Number.isInteger(position?.line) || !Number.isInteger(position?.character)) return null;
    if (position.line < 0 || position.line >= lines.length || position.character < 0) return null;
    const length = lines[position.line].replace(/\r$/, "").length;
    if (position.character > length) return null;
    let result = position.character;
    for (let i = 0; i < position.line; i++) result += lines[i].length + 1;
    return result;
  };
  const start = offset(range?.start);
  const end = offset(range?.end);
  return start === null || end === null || end < start ? null : { start, end };
}

export function applyCheckedTextEdits(source, edits) {
  if (!Array.isArray(edits)) throw new Error("TextEdits must be an array");
  const resolved = edits.map((edit, index) => {
    const span = rangeOffsets(source, edit?.range);
    if (!span || typeof edit?.newText !== "string") throw new Error("invalid or out-of-bounds edit range");
    return { ...span, newText: edit.newText, index };
  }).sort((a, b) => a.start - b.start || a.end - b.end || a.index - b.index);
  for (let i = 1; i < resolved.length; i++) {
    if (resolved[i].start < resolved[i - 1].end) throw new Error("overlapping edit ranges");
  }
  let result = source;
  for (const edit of resolved.reverse()) {
    result = result.slice(0, edit.start) + edit.newText + result.slice(edit.end);
  }
  return result;
}

function parsed(source) {
  const result = parse(source, { filename: "NavigationPlant.vue" });
  if (result.errors.length) throw new Error(`SFC parse: ${result.errors.map(String).join("; ")}`);
  return result.descriptor;
}

function scriptFile(content) {
  const file = ts.createSourceFile("NavigationPlant.ts", content, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  if (file.parseDiagnostics.length) {
    throw new Error(`script parse: ${ts.flattenDiagnosticMessageText(file.parseDiagnostics[0].messageText, " ")}`);
  }
  return file;
}

/** Exact identifier occurrences, excluding strings/comments and longer identifiers. */
function identifiers(content, name, base, source, ranges) {
  const file = scriptFile(content);
  const visit = (node) => {
    if (ts.isIdentifier(node) && node.text === name) {
      ranges.push(rangeOf(source, base + node.getStart(file), base + node.end));
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
}

/** The planted prop's declaration, script accesses, interpolation uses and bound attrs. */
export function propRanges(source, name) {
  const descriptor = parsed(source);
  const ranges = [];
  for (const block of [descriptor.script, descriptor.scriptSetup].filter(Boolean)) {
    identifiers(block.content, name, block.loc.start.offset, source, ranges);
  }
  const expression = (node) => {
    if (!node?.content || node.isStatic) return;
    // A wrapper gives object literals and other expression syntax its JS meaning.
    identifiers(`(${node.content})`, name, node.loc.start.offset - 1, source, ranges);
  };
  const visit = (node) => {
    if (node.type === 5) expression(node.content);
    if (node.type === 1) {
      for (const prop of node.props ?? []) {
        if (prop.type !== 7) continue;
        if (prop.arg?.isStatic && prop.arg.content === name) {
          ranges.push(rangeOf(source, prop.arg.loc.start.offset, prop.arg.loc.end.offset));
        }
        expression(prop.exp);
      }
    }
    for (const child of node.children ?? []) visit(child);
  };
  if (descriptor.template?.ast) visit(descriptor.template.ast);
  return ranges;
}

/** A named TS declaration may be returned as its identifier or its full declaration. */
export function declarationTarget(source, name) {
  const file = scriptFile(source);
  let result;
  const visit = (node) => {
    if (node.name && ts.isIdentifier(node.name) && node.name.text === name) {
      result = { range: rangeOf(source, node.name.getStart(file), node.name.end), container: rangeOf(source, node.getStart(file), node.end) };
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  if (!result) throw new Error(`fixture declaration ${name} was not found`);
  return result;
}

function canonicalTemplate(node) {
  if (!Array.isArray(node)) return node;
  // Vue component prop names accept camelCase and kebab-case in bound attrs.
  if (node[0] === 7 && ["bind", "model"].includes(node[1]) && node[3] === true) {
    return node.map((value, index) => index === 2 && typeof value === "string"
      ? value.replace(/-([a-z])/g, (_, character) => character.toUpperCase())
      : canonicalTemplate(value));
  }
  return node.map(canonicalTemplate);
}

export function sourceEvidence(source, { canonicalProps = false } = {}) {
  const descriptor = parsed(source);
  for (const block of [descriptor.script, descriptor.scriptSetup].filter(Boolean)) scriptFile(block.content);
  const script = descriptor.script || descriptor.scriptSetup
    ? compileScript(descriptor, { id: "navigation-plant" }) : null;
  if (descriptor.template && !descriptor.template.lang) {
    const compiled = compileTemplate({
      source: descriptor.template.content,
      filename: "NavigationPlant.vue",
      id: "navigation-plant",
      compilerOptions: { bindingMetadata: script?.bindings },
    });
    if (compiled.errors.length) throw new Error(`template parse: ${compiled.errors.map(String).join("; ")}`);
  }
  const semantic = semanticProjection(descriptor);
  if (canonicalProps) semantic.template = canonicalTemplate(semantic.template);
  const comments = [];
  for (const block of [descriptor.script, descriptor.scriptSetup].filter(Boolean)) {
    const scanner = ts.createScanner(ts.ScriptTarget.Latest, false, ts.LanguageVariant.Standard, block.content);
    for (let token = scanner.scan(); token !== ts.SyntaxKind.EndOfFileToken; token = scanner.scan()) {
      if (token === ts.SyntaxKind.SingleLineCommentTrivia || token === ts.SyntaxKind.MultiLineCommentTrivia) {
        comments.push(scanner.getTokenText().replace(/\s+/g, " ").trim());
      }
    }
  }
  return { descriptor: descriptorProjection(descriptor), semantic, comments };
}

export function assertSameSemantics(expected, actual, options) {
  if (!isDeepStrictEqual(sourceEvidence(expected, options), sourceEvidence(actual, options))) {
    throw new Error("applied edits changed unrelated SFC semantics or failed to perform the intended edit");
  }
}

/** Check the real TypeScript binding diagnostic, independent of the LSP's own answer. */
export function typoDiagnostic(source, typo) {
  const descriptor = parsed(source);
  const content = [descriptor.script?.content, descriptor.scriptSetup?.content].filter(Boolean).join("\n");
  const file = scriptFile(content);
  // Imports/libs are irrelevant to this local name-resolution plant. Keeping
  // them out makes this an untimed, small TypeScript check, not a project run.
  const options = { noResolve: true, noLib: true, noEmit: true, types: [], target: ts.ScriptTarget.Latest };
  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) => name === file.fileName ? file : undefined;
  host.fileExists = (name) => name === file.fileName;
  const program = ts.createProgram([file.fileName], options, host);
  return program.getSemanticDiagnostics(file).filter((diagnostic) =>
    [2304, 2552].includes(diagnostic.code) &&
    content.slice(diagnostic.start, diagnostic.start + diagnostic.length) === typo,
  );
}
