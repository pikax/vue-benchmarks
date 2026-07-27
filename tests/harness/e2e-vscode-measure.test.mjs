/**
 * The two VS Code E2E measurements that used to publish a sentinel where a
 * number belongs. Both are driven here with fake VS Code objects and a fake
 * clock, so the rules are tested without launching Electron.
 *
 * Each test names the old behaviour it rules out. Against the previous
 * implementation (suite/bench.test.cjs before the split):
 *
 *   waitForExtension  returned `{activateMs: 0}` when ext.isActive was already
 *                     true. Volar activates eagerly, so it reported 0 ms in
 *                     every cell, published beside Vize's 198 ms and Verter's
 *                     2.21 s.
 *   waitForDiagnostics started its clock AFTER the document was open and
 *                     returned immediately if anything had already been
 *                     published, scoring ~0 ms for a server that published
 *                     during the open and a real latency for one that did not.
 *                     Recorded: 0 ms (2 diagnostics) beside 1.47 s (0).
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { activateSubject, waitForFirstDiagnostics } = require(
  "../../scripts/e2e-vscode/suite/measure.cjs",
);

/** Monotonic fake clock, advanced explicitly by the test. */
function fakeClock(start = 1000) {
  let t = start;
  return {
    now: () => t,
    advance(ms) {
      t += ms;
    },
  };
}

function fakeUri(value) {
  return { toString: () => value };
}

/** Minimal stand-in for `vscode.languages`. */
function fakeLanguages() {
  const listeners = new Set();
  const byUri = new Map();
  return {
    getDiagnostics(uri) {
      return byUri.get(uri.toString()) ?? [];
    },
    onDidChangeDiagnostics(fn) {
      listeners.add(fn);
      return { dispose: () => listeners.delete(fn) };
    },
    /** Simulate a server publishing (possibly empty) diagnostics for a URI. */
    publish(uri, diagnostics) {
      byUri.set(uri.toString(), diagnostics);
      for (const fn of [...listeners]) fn({ uris: [uri] });
    },
    /** Publish for an unrelated file — must not end the wait. */
    publishOther(uri, diagnostics) {
      byUri.set(uri.toString(), diagnostics);
      for (const fn of [...listeners]) fn({ uris: [uri] });
    },
    listenerCount: () => listeners.size,
  };
}

describe("activateSubject", () => {
  test("an already-active extension reports n/a, NOT zero", async () => {
    // Old behaviour: { activateMs: 0 } — published as an infinitely fast
    // activation for the one extension that activates eagerly.
    const r = await activateSubject({ extension: { isActive: true } });
    assert.equal(r.activateMs, null);
    assert.equal(r.activateOutcome, "already-active");
    assert.notEqual(r.activateMs, 0, "0 is the sentinel this replaces");
  });

  test("an activation this run performed is measured", async () => {
    const clock = fakeClock();
    const extension = {
      isActive: false,
      activate: async () => {
        clock.advance(210);
      },
    };
    const r = await activateSubject({ extension, now: clock.now });
    assert.equal(r.activateMs, 210);
    assert.equal(r.activateOutcome, "measured");
  });

  test("no extension under test is its own outcome", async () => {
    const r = await activateSubject({ extension: null });
    assert.equal(r.activateMs, null);
    assert.equal(r.activateOutcome, "no-extension");
  });

  test("an activation that never resolves rejects rather than reporting a number", async () => {
    const extension = { isActive: false, activate: () => new Promise(() => {}) };
    await assert.rejects(
      () => activateSubject({ extension, timeoutMs: 20, label: "stuck.ext" }),
      /activate timeout stuck\.ext/,
    );
  });
});

describe("waitForFirstDiagnostics", () => {
  test("a publish landing DURING the open is timed, not scored zero", async () => {
    // The defect in one test: the old clock started after the open, so this
    // server measured ~0 ms. The origin is now before the open, so the 120 ms
    // it actually took is what gets reported.
    const clock = fakeClock();
    const languages = fakeLanguages();
    const uri = fakeUri("file:///probe.vue");

    const r = await waitForFirstDiagnostics({
      languages,
      uri,
      now: clock.now,
      timeoutMs: 5000,
      openDocument: async () => {
        clock.advance(120);
        languages.publish(uri, ["a", "b"]);
      },
    });

    assert.equal(r.outcome, "measured");
    assert.equal(r.waitMs, 120);
    assert.equal(r.openMs, 120);
    assert.equal(r.count, 2);
  });

  test("two servers publishing at the same instant get the same number", async () => {
    // The point of a common origin. Under the old code, whether a server
    // scored 0 ms or its real latency depended only on whether its publish
    // landed before or after the clock started.
    const run = async (publishDuringOpen) => {
      const clock = fakeClock();
      const languages = fakeLanguages();
      const uri = fakeUri("file:///probe.vue");
      return waitForFirstDiagnostics({
        languages,
        uri,
        now: clock.now,
        timeoutMs: 5000,
        openDocument: async () => {
          clock.advance(90);
          if (publishDuringOpen) languages.publish(uri, ["x"]);
          else {
            queueMicrotask(() => languages.publish(uri, ["x"]));
          }
        },
      });
    };

    const during = await run(true);
    const after = await run(false);
    assert.equal(during.waitMs, 90);
    assert.equal(after.waitMs, 90);
    assert.equal(during.waitMs, after.waitMs);
  });

  test("diagnostics that existed before the open are a distinct outcome, not a 0 ms wait", async () => {
    const clock = fakeClock();
    const languages = fakeLanguages();
    const uri = fakeUri("file:///probe.vue");
    languages.publish(uri, ["pre", "existing"]);

    const r = await waitForFirstDiagnostics({
      languages,
      uri,
      now: clock.now,
      timeoutMs: 5000,
      openDocument: async () => clock.advance(40),
    });

    assert.equal(r.outcome, "pre-open");
    assert.equal(r.waitMs, null, "a wait this run did not time must not be reported as one");
    assert.equal(r.count, 2);
    assert.equal(r.openMs, 40);
  });

  test("nothing published inside the budget reports the outcome, not the budget", async () => {
    // Old behaviour returned waitMs = the timeout, putting a constant in a
    // measurement column.
    const clock = fakeClock();
    const languages = fakeLanguages();
    const uri = fakeUri("file:///probe.vue");

    const r = await waitForFirstDiagnostics({
      languages,
      uri,
      now: clock.now,
      timeoutMs: 25,
      openDocument: async () => clock.advance(5),
    });

    assert.equal(r.outcome, "timeout");
    assert.equal(r.waitMs, null);
    assert.equal(r.timeoutMs, 25);
    assert.notEqual(r.waitMs, 25, "the budget is not a measurement");
  });

  test("an EMPTY publish counts as an answer", async () => {
    // Deliberate: the probe workspaces are clean, so "no problems here" is the
    // correct result and reaching it is the work being timed. Requiring a
    // non-empty set would time out every correct server and reward a noisy one.
    const clock = fakeClock();
    const languages = fakeLanguages();
    const uri = fakeUri("file:///probe.vue");

    const r = await waitForFirstDiagnostics({
      languages,
      uri,
      now: clock.now,
      timeoutMs: 5000,
      openDocument: async () => {
        clock.advance(300);
        languages.publish(uri, []);
      },
    });

    assert.equal(r.outcome, "measured");
    assert.equal(r.waitMs, 300);
    assert.equal(r.count, 0);
  });

  test("a publish for a different file does not end the wait", async () => {
    const clock = fakeClock();
    const languages = fakeLanguages();
    const uri = fakeUri("file:///probe.vue");
    const other = fakeUri("file:///elsewhere.vue");

    const r = await waitForFirstDiagnostics({
      languages,
      uri,
      now: clock.now,
      timeoutMs: 30,
      openDocument: async () => {
        clock.advance(10);
        languages.publishOther(other, ["noise"]);
      },
    });

    assert.equal(r.outcome, "timeout");
    assert.equal(r.waitMs, null);
  });

  test("the subscription is always disposed", async () => {
    const clock = fakeClock();
    const languages = fakeLanguages();
    const uri = fakeUri("file:///probe.vue");

    await waitForFirstDiagnostics({
      languages,
      uri,
      now: clock.now,
      timeoutMs: 20,
      openDocument: async () => clock.advance(1),
    });
    assert.equal(languages.listenerCount(), 0);

    await assert.rejects(() =>
      waitForFirstDiagnostics({
        languages,
        uri,
        now: clock.now,
        timeoutMs: 20,
        openDocument: async () => {
          throw new Error("open blew up");
        },
      }),
    );
    assert.equal(languages.listenerCount(), 0, "leaked a listener on the error path");
  });
});
