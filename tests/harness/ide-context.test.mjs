/**
 * Session-context helpers: scripts/lib/ide-ops/context.mjs
 *
 * Two small pure functions that both exist because a published number was
 * wrong, and both fail silently when they regress — nothing in a run crashes,
 * the report simply states something untrue:
 *
 *   normalizeUri()          keying diagnostics on the raw URI string dropped
 *                           every diagnostic published by one half of Volar,
 *                           which reads exactly like "this server publishes no
 *                           diagnostics" rather than like a bug in the harness.
 *
 *   detectBackendFallback() Vize drives tsgo out-of-process as "Corsa"; when
 *                           that session fails to spawn it says so on stderr
 *                           and silently answers from its own analysis. Nothing
 *                           in the LSP traffic shows it, so without this the
 *                           server is ranked first on exactly the questions its
 *                           type backend never started to answer.
 *
 * Neither can be covered by an end-to-end run: the failures they detect are the
 * ones where everything appears to work.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { detectBackendFallback, normalizeUri } from "../../scripts/lib/ide-ops/context.mjs";

/* ═══════════════════════════════ normalizeUri ═══════════════════════════════ */

describe("normalizeUri — one file, one key", () => {
  /**
   * The three spellings that genuinely arrive in a single session for a single
   * file: this client's `pathToFileUri`, Volar's tsserver half (which
   * percent-encodes the colon), and servers that lower-case the drive letter.
   */
  const SAME_FILE = [
    "file:///D:/repo/src/Host.vue",
    "file:///d%3A/repo/src/Host.vue",
    "file:///d:/repo/src/Host.vue",
  ];

  test("all three real spellings of one Windows path collapse to one key", () => {
    const keys = new Set(SAME_FILE.map(normalizeUri));
    assert.equal(keys.size, 1, `expected one key, got ${[...keys].join(" | ")}`);
    assert.equal([...keys][0], "file:///d:/repo/src/Host.vue");
  });

  test("a percent-encoded drive colon is decoded, not compared raw", () => {
    // Dropping the decode step is the exact bug: `%3A` never equals `:`, so the
    // tsserver half's diagnostics land under a key nobody ever looks up.
    assert.equal(normalizeUri("file:///d%3A/repo/src/Host.vue"), "file:///d:/repo/src/Host.vue");
    assert.notEqual(normalizeUri("file:///d%3A/repo/src/Host.vue"), "file:///d%3A/repo/src/Host.vue");
  });

  test("an upper-case drive letter is folded but nothing else is", () => {
    // Windows drive letters are case-insensitive. The rest of a path is not —
    // on the POSIX CI runner `Host.vue` and `host.vue` are two different files,
    // so a whole-string toLowerCase() would merge two servers' answers about
    // two different files into one.
    assert.equal(normalizeUri("file:///D:/Repo/Src/Host.vue"), "file:///d:/Repo/Src/Host.vue");
    assert.notEqual(normalizeUri("file:///D:/Repo/Src/Host.vue"), "file:///d:/repo/src/host.vue");
    assert.notEqual(
      normalizeUri("file:///d:/repo/Host.vue"),
      normalizeUri("file:///d:/repo/host.vue"),
      "case-differing file names are different files and must keep different keys",
    );
  });

  test("genuinely different files keep genuinely different keys", () => {
    const distinct = [
      "file:///d:/repo/src/Host.vue",
      "file:///d:/repo/src/ChildCard.vue",
      "file:///d:/repo/src/nested/Host.vue",
      "file:///c:/repo/src/Host.vue",
      "file:///d:/repo/src/Host.ts",
    ];
    const keys = distinct.map(normalizeUri);
    assert.equal(new Set(keys).size, distinct.length, `collapsed: ${keys.join(" | ")}`);
  });

  test("percent-encoded path segments normalise to the same key as the plain form", () => {
    // tsserver escapes spaces; this client does not. Both name one file.
    assert.equal(
      normalizeUri("file:///d%3A/my%20repo/Host.vue"),
      normalizeUri("file:///D:/my repo/Host.vue"),
    );
  });

  test("a POSIX URI is left alone — there is no drive letter to fold", () => {
    assert.equal(normalizeUri("file:///home/runner/repo/Host.vue"), "file:///home/runner/repo/Host.vue");
    // A leading path segment that merely looks like a drive is not one.
    assert.equal(normalizeUri("file:///Users/x/D:/Host.vue"), "file:///Users/x/D:/Host.vue");
  });

  test("it is idempotent — a normalized key normalizes to itself", () => {
    for (const uri of [...SAME_FILE, "file:///home/x/A.vue", "file:///d%3A/a%20b/A.vue"]) {
      const once = normalizeUri(uri);
      assert.equal(normalizeUri(once), once, uri);
    }
  });

  test("a malformed percent escape falls through instead of throwing", () => {
    // `%ZZ` is not a valid escape; decodeURIComponent throws on it. Throwing
    // here would take down the diagnostics listener for the whole session.
    assert.doesNotThrow(() => normalizeUri("file:///D:/repo/a%ZZb/Host.vue"));
    assert.equal(normalizeUri("file:///D:/repo/a%ZZb/Host.vue"), "file:///d:/repo/a%ZZb/Host.vue");
  });

  test("a non-string is returned unchanged rather than stringified", () => {
    assert.equal(normalizeUri(undefined), undefined);
    assert.equal(normalizeUri(null), null);
    for (const value of [undefined, null, 7]) {
      assert.equal(normalizeUri(value), value);
    }
  });
});

/* ═══════════════════════════ detectBackendFallback ══════════════════════════ */

describe("detectBackendFallback — a degraded backend must never be invisible", () => {
  /**
   * Shaped like the real stderr tail: Vize logs to stderr throughout startup
   * and the bridge failure is one line among many, not the whole buffer.
   * `corsa bridge`, `spawn failed`, `not available` and `typecheck-unavailable`
   * are all strings present in the shipped binary.
   */
  const VIZE_SPAWN_FAILED = [
    "[info] vize_maestro::server starting, protocol 3.17",
    "[info] vize_maestro::server::state workspace root D:\\repo",
    "[warn] vize_maestro::server::state::corsa corsa bridge spawn failed: No such file or directory (os error 2)",
    "[info] vize_maestro::server::state falling back to internal semantic analysis",
    "[info] vize_maestro::server initialized in 214ms",
  ].join("\n");

  const VIZE_HEALTHY = [
    "[info] vize_maestro::server starting, protocol 3.17",
    "[info] vize_maestro::server::state::corsa corsa bridge acquired",
    "[info] vize_maestro::server::state::corsa corsa bridge initialized successfully",
    "[info] vize_maestro::server::doc opened file:///d:/repo/Host.vue",
    "[debug] vize_maestro::server::doc diagnostics published in 31ms",
    "[info] vize_maestro::server initialized in 189ms",
  ].join("\n");

  test("a real `corsa bridge spawn failed` tail is reported", () => {
    const reason = detectBackendFallback(VIZE_SPAWN_FAILED);
    assert.equal(typeof reason, "string");
    assert.match(reason, /tsgo\/Corsa backend did not start/);
    // The reason must name what DID answer, not only what failed to start —
    // otherwise a reader cannot tell why the row is fast. Asserted on the
    // substance rather than a particular adjective: this string is published
    // in result tables, so it states the condition and draws no conclusion.
    assert.match(
      reason,
      /answered from its own semantic analysis/,
      "the reason must say what produced the answers instead",
    );
  });

  test("`corsa bridge not available` is the same fallback", () => {
    assert.ok(
      detectBackendFallback("[warn] vize_maestro::state corsa bridge not available, using fallback"),
    );
  });

  test("ordinary server chatter — including a HEALTHY corsa bridge — reports nothing", () => {
    // The trap: the healthy log mentions `corsa bridge` twice. A detector
    // matching the subsystem name rather than the failure would flag every
    // successful run, which is how a real warning stops being read.
    assert.equal(detectBackendFallback(VIZE_HEALTHY), null);
    for (const chatter of [
      "corsa bridge acquired",
      "corsa bridge initialized successfully",
      "Skipping Corsa bridge initialization because LSP typecheck is disabled",
      "[info] tsserver: Starting TS Server",
      "[error] textDocument/typeDefinition failed: Unhandled method",
      "warning: 1 problem found",
      "",
    ]) {
      assert.equal(detectBackendFallback(chatter), null, `false positive on: ${chatter}`);
    }
  });

  test("a missing or empty stderr tail is not a fallback", () => {
    assert.equal(detectBackendFallback(), null);
    assert.equal(detectBackendFallback(""), null);
    assert.equal(detectBackendFallback(undefined), null);
  });

  test("the detector is case-insensitive — the log level does not change the meaning", () => {
    assert.ok(detectBackendFallback("CORSA BRIDGE SPAWN FAILED"));
    assert.ok(detectBackendFallback("Corsa Bridge Not Available"));
  });

  test("a panic accompanying the failure is quoted, bounded to 120 chars", () => {
    const short = detectBackendFallback(
      "corsa bridge spawn failed\npanic: called `Option::unwrap()` on a `None` value\nbacktrace omitted",
    );
    assert.match(short, /\(called `Option::unwrap\(\)` on a `None` value\)$/);

    const long = detectBackendFallback(`corsa bridge spawn failed\npanic: ${"x".repeat(500)}`);
    const quoted = /\((x+)\)$/.exec(long);
    assert.ok(quoted, `panic text was not quoted: ${long}`);
    assert.equal(quoted[1].length, 120, "panic text must be bounded — stderr tails are unbounded");
  });

  test("without a panic line the reason carries no empty parenthetical", () => {
    const reason = detectBackendFallback("corsa bridge spawn failed: os error 2");
    assert.ok(!reason.includes("("), reason);
  });

  test("`typecheck-unavailable` is reported as its own, different reason", () => {
    const reason = detectBackendFallback(
      "typecheck-unavailable: Type checking is unavailable in this workspace.",
    );
    assert.match(reason, /type checking unavailable/i);
    assert.ok(
      !reason.includes("Corsa"),
      "a workspace with type checking off is not a crashed bridge — the two must not share a message",
    );
  });
});
