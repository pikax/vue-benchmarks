/** Exact source-coordinate evidence for the artifacts returned by compiler APIs. */
import { pathToFileURL } from "node:url";
import { AnyMap, originalPositionFor, sourceContentFor, traceSegment } from "@jridgewell/trace-mapping";

function fileUrl(filename) {
  const path = String(filename ?? "").replaceAll("\\", "/");
  if (/^[a-z]:\//i.test(path)) return new URL(`file:///${path}`).href;
  if (path.startsWith("//")) return new URL(`file:${path}`).href;
  if (path.startsWith("/")) return new URL(`file://${path}`).href;
  if (/^[a-z][a-z\d+.-]*:/i.test(path)) return new URL(path).href;
  return new URL(path, pathToFileURL(`${process.cwd()}/`).href).href;
}

function sourceIdentity(filename) {
  const url = new URL(fileUrl(filename));
  if (url.protocol !== "file:") return url.href;
  const path = decodeURIComponent(url.pathname).replaceAll("\\", "/");
  if (url.hostname) return `//${url.hostname}${path}`;
  // Drive paths are Windows paths even if the oracle is running on Linux.
  // A POSIX path keeps its case; merely sharing a basename is never enough.
  return /^[\/]?[a-z]:\//i.test(path) ? path.toLowerCase() : path;
}

function normalizeWindowsSources(map) {
  const absolute = (value) => typeof value === "string" && /^[a-z]:[\\/]/i.test(value) ? fileUrl(value) : value;
  return {
    ...map,
    ...(map.sources ? { sources: map.sources.map(absolute) } : {}),
    ...(map.sourceRoot ? { sourceRoot: absolute(map.sourceRoot) } : {}),
    ...(map.sections ? { sections: map.sections.map((section) => ({ ...section, map: normalizeWindowsSources(section.map) })) } : {}),
  };
}

/** Source-map lines are one-based and columns count UTF-16 code units. */
function positionAt(source, offset) {
  const lines = source.slice(0, offset).split("\n");
  return { line: lines.length, column: lines.at(-1).length };
}

function generatedOffset(code, anchor) {
  const token = anchor.generatedToken;
  if (typeof token !== "string" || !token.length) throw new Error("generatedToken must be nonempty");
  if (anchor.generatedOffset !== undefined) {
    const offset = anchor.generatedOffset;
    if (!Number.isInteger(offset) || offset < 0 || !code.startsWith(token, offset)) {
      throw new Error("generatedOffset does not identify generatedToken");
    }
    return offset;
  }
  const first = code.indexOf(token);
  if (first < 0) throw new Error(`generated token ${JSON.stringify(token)} is missing`);
  if (code.indexOf(token, first + 1) >= 0) {
    throw new Error(`generated token ${JSON.stringify(token)} is ambiguous; select its AST occurrence with generatedOffset`);
  }
  return first;
}

/**
 * anchors: [{ id, generatedToken, originalOffset, generatedOffset? }].
 * Offsets refer to UTF-16 code units in the exact supplied strings. An adapter
 * should select a concrete generated AST node when a token appears repeatedly;
 * this oracle never searches multiple mappings for whichever one passes.
 * No block-offset repair or sourcesContent replacement happens here: composing
 * intermediate maps is part of the compiler artifact's declared pipeline.
 */
export function judgeSourceMapArtifact({ code, map, source, filename, anchors }) {
  const failures = [];
  const traces = [];
  let traced;
  let expectedSource;
  try {
    if (typeof code !== "string" || !code.length) throw new Error("generated code is missing");
    if (typeof source !== "string" || !source.length) throw new Error("original source is missing");
    if (typeof filename !== "string" || !filename.length) throw new Error("source filename is missing");
    if (!Array.isArray(anchors) || !anchors.length) throw new Error("no source-map anchors were supplied");
    const raw = typeof map === "string" ? JSON.parse(map) : map?.toJSON ? map.toJSON() : map;
    if (!raw || typeof raw !== "object" || raw.version !== 3) throw new Error("missing or invalid version-3 source map");
    if (!raw.sections && (!Array.isArray(raw.sources) || !(typeof raw.mappings === "string" || Array.isArray(raw.mappings)))) {
      throw new Error("source map has no sources/mappings");
    }
    expectedSource = sourceIdentity(filename);
    // URI resolution treats `D:/...` as a relative source, despite this being
    // the absolute filename emitted by several Windows compiler APIs.
    traced = new AnyMap(normalizeWindowsSources(raw), fileUrl(filename));
  } catch (error) {
    return { ok: false, failures: [error.message], traces };
  }
  for (const anchor of anchors) {
    const trace = { id: anchor?.id ?? "unnamed", ok: false };
    traces.push(trace);
    try {
      if (!Number.isInteger(anchor?.originalOffset) || anchor.originalOffset < 0 || anchor.originalOffset >= source.length) {
        throw new Error("originalOffset is outside the full source");
      }
      const offset = generatedOffset(code, anchor);
      trace.generatedOffset = offset;
      trace.generated = positionAt(code, offset);
      trace.expected = { source: filename, ...positionAt(source, anchor.originalOffset) };
      const segment = traceSegment(traced, trace.generated.line - 1, trace.generated.column);
      // A stale map shifted before the token can otherwise pass via the
      // consumer's greatest-lower-bound fallback. These anchors deliberately
      // select token/declaration starts for which the reference emits segments.
      if (!segment || segment[0] !== trace.generated.column) {
        throw new Error("no mapping segment starts at the selected generated token");
      }
      trace.original = originalPositionFor(traced, trace.generated);
      if (trace.original.source == null || trace.original.line == null || trace.original.column == null) {
        throw new Error("generated token has no original mapping");
      }
      if (sourceIdentity(trace.original.source) !== expectedSource) {
        throw new Error(`mapped to ${JSON.stringify(trace.original.source)} instead of ${JSON.stringify(filename)}`);
      }
      if (sourceContentFor(traced, trace.original.source) !== source) {
        throw new Error("sourcesContent does not equal the complete original SFC");
      }
      if (trace.original.line !== trace.expected.line || trace.original.column !== trace.expected.column) {
        throw new Error(`mapped to ${trace.original.line}:${trace.original.column}; expected ${trace.expected.line}:${trace.expected.column}`);
      }
      trace.ok = true;
    } catch (error) {
      trace.failure = error.message;
      failures.push(`${trace.id}: ${error.message}`);
    }
  }
  return { ok: failures.length === 0, failures, traces };
}
