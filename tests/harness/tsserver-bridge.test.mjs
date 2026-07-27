/**
 * Volar's tsserver bridge: scripts/lib/tsserver-bridge.mjs
 *
 * Volar is the only two-process server in this harness — a Vue server plus a
 * TypeScript server joined by this bridge — and every defect covered here is one
 * that PENALISED it in a way nothing in the published output revealed.
 *
 *   1. A forwarded tsserver command that exceeded the bridge's budget was
 *      answered `null`, which on the wire is byte-identical to "the TypeScript
 *      server has no answer". The Vue half then replied to the client with an
 *      empty result, the content gate failed it, and the row was published
 *      `valid:false` and unranked. Nothing said a BUDGET had expired, and no
 *      other server here has a per-internal-request budget at all.
 *
 *   2. The TypeScript half's `initialize` budget was the literal `30_000`. It
 *      was not derived from `createSession`'s `initTimeoutMs` and not raised by
 *      `SCALE_PROJECT_LOAD_TIMEOUT_MS`, so on the scale suite the documented way
 *      to give a slow-starting server more time reached the Vue half and never
 *      the TypeScript half — the half most likely to need it on a large project.
 *
 * Both are silent failures: nothing crashes, the run completes, and the table
 * simply states something untrue about a server. That is the class of bug this
 * whole test suite exists for, so the tests are written against the real
 * decision points rather than against a spawned pair of language servers.
 *
 * `createTsRequestForwarder` takes its transport by injection precisely so this
 * file never has to start tsserver.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import {
  DEFAULT_TS_INIT_TIMEOUT_MS,
  DEFAULT_TS_REQUEST_TIMEOUT_MS,
  createBridgeFailureLog,
  createTsRequestForwarder,
  forwardedBudgetMs,
  resolveTsInitTimeoutMs,
  resolveTsRequestTimeoutMs,
  summarizeBridgeFailures,
} from "../../scripts/lib/tsserver-bridge.mjs";

/* -------------------------------------------------------------------------- */
/* Harness                                                                    */
/* -------------------------------------------------------------------------- */

/** Volar's real wire shape: vscode-jsonrpc wraps the tuple one level. */
const tuple = (id, command, args) => [[id, command, args]];

/** A forwarder with the transport, clock output and warnings all captured. */
function makeForwarder({ sendToTs, budgetMs = 25 }) {
  const replies = [];
  const warnings = [];
  const failures = createBridgeFailureLog();
  const forward = createTsRequestForwarder({
    sendToTs,
    replyToVolar: (requestId, body) => replies.push({ requestId, body }),
    budgetMs,
    failures,
    warn: (m) => warnings.push(String(m)),
  });
  return { forward, replies, warnings, failures };
}

const never = () => new Promise(() => {});

/* ═════════════ Defect 1: an expiry must not read as an empty answer ════════ */

describe("forwarded tsserver commands — expiry vs a genuine empty answer", () => {
  test("a genuine empty answer replies null and is recorded NOWHERE", async () => {
    // `workspace/executeCommand` answering null is what an LSP server sends for
    // a command that produced no result — tsserver legitimately has nothing for
    // this position.
    const h = makeForwarder({ sendToTs: async () => null });
    await h.forward(tuple(1, "quickinfo", { file: "a.vue" }));

    assert.deepEqual(h.replies, [{ requestId: 1, body: null }]);
    assert.equal(h.failures.size, 0, "an empty answer IS an answer and must stay one");
  });

  /**
   * Pinned, not endorsed: `result?.body ?? result` forwards the WHOLE tsserver
   * envelope when `body` is null or absent, because `??` falls through on null.
   * That predates this work and changing it would change what Volar receives on
   * every such command, so it is locked down here rather than quietly altered.
   */
  test("an envelope whose body is null is forwarded whole — pre-existing, pinned", async () => {
    const envelope = { type: "response", command: "quickinfo", success: true, body: null };
    const h = makeForwarder({ sendToTs: async () => envelope });
    await h.forward(tuple(1, "quickinfo", {}));
    assert.deepEqual(h.replies, [{ requestId: 1, body: envelope }]);
    assert.equal(h.failures.size, 0, "still an answer, however oddly shaped");
  });

  test("a budget expiry is recorded as a timeout, naming the command and the budget", async () => {
    const h = makeForwarder({ sendToTs: never, budgetMs: 25 });
    await h.forward(tuple(7, "semanticTokens/full", { file: "a.vue" }));

    assert.equal(h.failures.size, 1);
    const [f] = h.failures.peek();
    assert.equal(f.kind, "timeout");
    assert.equal(f.command, "semanticTokens/full");
    assert.equal(f.budgetMs, 25);
    assert.equal(f.requestId, 7);
    assert.ok(Number.isFinite(f.ms), "the elapsed time is evidence and must be a number");
    assert.match(f.message, /within 25ms/);
  });

  /**
   * THE test. These two situations were indistinguishable, and that is the
   * entire defect: the harness published one as if it were the other.
   */
  test("the two cases are identical on the wire and different in the record", async () => {
    const empty = makeForwarder({ sendToTs: async () => null });
    await empty.forward(tuple(1, "quickinfo", {}));

    const expired = makeForwarder({ sendToTs: never, budgetMs: 25 });
    await expired.forward(tuple(1, "quickinfo", {}));

    assert.deepEqual(
      empty.replies,
      expired.replies,
      "the reply cannot carry the difference — Volar's handler resolves whatever body it is given",
    );
    assert.equal(empty.failures.size, 0);
    assert.equal(expired.failures.size, 1, "…so the record has to carry it");
    assert.equal(
      summarizeBridgeFailures(empty.failures.peek()),
      "",
      "a healthy operation gains no note",
    );
    assert.match(
      summarizeBridgeFailures(expired.failures.peek()),
      /exceeded the bridge budget of 25ms/,
    );
  });

  test("a transport error is recorded as an error, not as a timeout", async () => {
    const h = makeForwarder({
      sendToTs: async () => {
        throw new Error("ts_ls: workspace/executeCommand failed: connection closed");
      },
    });
    await h.forward(tuple(3, "completionInfo", {}));

    const [f] = h.failures.peek();
    assert.equal(f.kind, "error");
    assert.match(f.message, /connection closed/);
    assert.match(summarizeBridgeFailures([f]), /failed \(/);
  });

  /**
   * The invariant the whole bridge rests on. Volar's `sendTsServerRequest` is a
   * bare `new Promise(resolve => …)` with no timeout and no reject path, so a
   * missing reply wedges the Vue half for the rest of the run. Recording the
   * failure must never be traded for staying silent — which is also why the
   * budget cannot simply be removed.
   */
  describe("every request is still answered exactly once", () => {
    for (const [name, sendToTs, budgetMs] of [
      ["a normal answer", async () => ({ body: { ok: true } }), 25],
      ["a null body", async () => ({ body: null }), 25],
      ["a thrown error", async () => { throw new Error("boom"); }, 25],
      ["a budget expiry", never, 25],
      ["an undefined result", async () => undefined, 25],
    ]) {
      test(name, async () => {
        const h = makeForwarder({ sendToTs, budgetMs });
        await h.forward(tuple(42, "quickinfo", {}));
        assert.equal(h.replies.length, 1, "exactly one reply, always");
        assert.equal(h.replies[0].requestId, 42);
      });
    }
  });

  test("an answer arriving AFTER the expiry does not produce a second reply", async () => {
    let land;
    const h = makeForwarder({
      sendToTs: () => new Promise((resolve) => { land = resolve; }),
      budgetMs: 25,
    });
    await h.forward(tuple(9, "quickinfo", {}));
    assert.equal(h.replies.length, 1);

    land({ body: { displayString: "arrived late" } });
    await new Promise((r) => setTimeout(r, 30));

    assert.equal(h.replies.length, 1, "a second reply for one id is a protocol violation");
    assert.equal(h.replies[0].body, null);
  });

  test("a LATE rejection from the transport does not become an unhandled rejection", async () => {
    // Real sequencing: the bridge's timer fires at T, then the transport's own
    // timer fires at T + grace and REJECTS the same request. Nothing is awaiting
    // that promise by then, so it must already be subscribed or the process
    // takes an unhandled rejection mid-benchmark.
    const seen = [];
    const onUnhandled = (reason) => seen.push(reason);
    process.on("unhandledRejection", onUnhandled);
    try {
      const h = makeForwarder({
        sendToTs: () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new Error("ts_ls: timed out after 1025ms")), 20);
          }),
        budgetMs: 5,
      });
      await h.forward(tuple(8, "geterr", {}));
      await new Promise((r) => setTimeout(r, 60));
      assert.equal(h.replies.length, 1);
      assert.deepEqual(seen, [], "the losing leg of the race must still be handled");
    } finally {
      process.off("unhandledRejection", onUnhandled);
    }
  });

  test("a budget expiry is announced even without LSP_BENCH_DEBUG", async () => {
    // A 45s stall that silently becomes a failed row is exactly what happened.
    const h = makeForwarder({ sendToTs: never, budgetMs: 25 });
    await h.forward(tuple(5, "semanticTokens/full", {}));
    assert.match(h.warnings.join("\n"), /BUDGET EXPIRED/);
    assert.match(h.warnings.join("\n"), /NOT a server answer/);
  });

  test("no warning and no record when the server simply answers", async () => {
    const h = makeForwarder({ sendToTs: async () => ({ body: { ok: 1 } }) });
    await h.forward(tuple(5, "quickinfo", {}));
    assert.deepEqual(h.warnings, []);
    assert.equal(h.failures.size, 0);
  });

  test("the tsserver envelope is still unwrapped to its body", async () => {
    const h = makeForwarder({
      sendToTs: async () => ({ type: "response", command: "quickinfo", success: true, body: { displayString: "const x: number" } }),
    });
    await h.forward(tuple(2, "quickinfo", {}));
    assert.deepEqual(h.replies[0].body, { displayString: "const x: number" });
  });

  test("a payload with no id is dropped silently — nothing is waiting on it", async () => {
    const h = makeForwarder({ sendToTs: never });
    await h.forward([[null, "quickinfo", {}]]);
    await h.forward("not a tuple at all");
    assert.equal(h.replies.length, 0);
    assert.equal(h.failures.size, 0);
  });

  test("an id with no command is answered null and is not a failure", async () => {
    const h = makeForwarder({ sendToTs: never });
    await h.forward([[4, "", {}]]);
    assert.deepEqual(h.replies, [{ requestId: 4, body: null }]);
    assert.equal(h.failures.size, 0);
  });

  test("the flat tuple form is accepted too", async () => {
    const h = makeForwarder({ sendToTs: async () => ({ body: 1 }) });
    await h.forward([11, "quickinfo", {}]);
    assert.equal(h.replies[0].requestId, 11);
  });

  test("the budget may be computed per command, not fixed at construction", async () => {
    const seen = [];
    const h = makeForwarder({
      sendToTs: async (command, _args, timeoutMs) => {
        seen.push({ command, timeoutMs });
        return { body: 1 };
      },
      budgetMs: (command) => (command === "geterr" ? 60_000 : 1_000),
    });
    await h.forward(tuple(1, "geterr", {}));
    await h.forward(tuple(2, "quickinfo", {}));
    // The transport gets a slightly later deadline so the bridge's own timer is
    // the one that decides the verdict rather than racing the transport's.
    assert.ok(seen[0].timeoutMs > 60_000, `got ${seen[0].timeoutMs}`);
    assert.ok(seen[1].timeoutMs > 1_000 && seen[1].timeoutMs < 60_000);
  });
});

describe("createBridgeFailureLog", () => {
  test("take() drains so a failure is attributed to ONE operation, not to all of them", () => {
    const log = createBridgeFailureLog();
    log.record({ kind: "timeout", command: "a" });
    assert.equal(log.take().length, 1);
    assert.equal(log.size, 0, "operation 6 must not inherit operation 1's failures");
    assert.deepEqual(log.take(), []);
  });

  test("peek() reads without draining", () => {
    const log = createBridgeFailureLog();
    log.record({ kind: "timeout", command: "a" });
    assert.equal(log.peek().length, 1);
    assert.equal(log.size, 1);
  });

  test("it is bounded — a wedged server must not become a memory leak mid-benchmark", () => {
    const log = createBridgeFailureLog(3);
    for (let i = 0; i < 50; i++) log.record({ kind: "timeout", command: `c${i}` });
    const kept = log.peek();
    assert.equal(kept.length, 3);
    assert.equal(kept.at(-1).command, "c49", "the most recent are the ones kept");
  });
});

describe("summarizeBridgeFailures", () => {
  test("repeats of one command collapse to a count", () => {
    const failures = Array.from({ length: 4 }, () => ({
      kind: "timeout",
      command: "semanticTokens/full",
      budgetMs: 45_000,
    }));
    const text = summarizeBridgeFailures(failures);
    assert.match(text, /4x tsserver `semanticTokens\/full` exceeded the bridge budget of 45000ms/);
    // An Op reason is capped at 240 chars; four copies of one fact would push
    // the actual gate reason out of the row.
    assert.ok(text.length < 120, text);
  });

  test("different commands and different kinds stay separate", () => {
    const text = summarizeBridgeFailures([
      { kind: "timeout", command: "geterr", budgetMs: 30_000 },
      { kind: "error", command: "quickinfo", message: "closed" },
    ]);
    assert.match(text, /geterr/);
    assert.match(text, /quickinfo/);
    assert.match(text, /closed/);
  });

  test("nothing to report is the empty string, never a stray note", () => {
    assert.equal(summarizeBridgeFailures([]), "");
    assert.equal(summarizeBridgeFailures(null), "");
    assert.equal(summarizeBridgeFailures(undefined), "");
  });
});

/* ═══════ Defect 2: the escape hatch must reach the process that needs it ═══ */

describe("resolveTsInitTimeoutMs — threading the project-load budget", () => {
  test("an explicit budget from the caller wins", () => {
    // This is the channel createSession should use: it already computes 45s by
    // default and hands the scale suite's PROJECT_LOAD_TIMEOUT_MS through.
    assert.equal(resolveTsInitTimeoutMs(45_000, {}), 45_000);
    assert.equal(
      resolveTsInitTimeoutMs(90_000, { SCALE_PROJECT_LOAD_TIMEOUT_MS: "10000" }),
      90_000,
      "an explicit caller budget outranks the environment",
    );
  });

  test("SCALE_PROJECT_LOAD_TIMEOUT_MS raises it — the documented hatch, honoured", () => {
    // The defect verbatim: this env var moved the Vue half's budget and never
    // the TypeScript half's, i.e. never the half that loads the project.
    assert.equal(
      resolveTsInitTimeoutMs(undefined, { SCALE_PROJECT_LOAD_TIMEOUT_MS: "120000" }),
      120_000,
    );
    assert.notEqual(
      resolveTsInitTimeoutMs(undefined, { SCALE_PROJECT_LOAD_TIMEOUT_MS: "120000" }),
      30_000,
      "the hard-coded 30s must no longer be the ceiling",
    );
  });

  test("VOLAR_TS_INIT_TIMEOUT_MS outranks the suite-wide hatch", () => {
    assert.equal(
      resolveTsInitTimeoutMs(undefined, {
        VOLAR_TS_INIT_TIMEOUT_MS: "70000",
        SCALE_PROJECT_LOAD_TIMEOUT_MS: "120000",
      }),
      70_000,
    );
  });

  test("nothing set falls back to the documented default", () => {
    assert.equal(resolveTsInitTimeoutMs(undefined, {}), DEFAULT_TS_INIT_TIMEOUT_MS);
  });

  test("junk, empty and non-positive values fall through instead of becoming the budget", () => {
    // A `timeoutMs: 0` or `timeoutMs: NaN` would make every init fail instantly
    // and read as "this server cannot start".
    for (const bad of ["", "0", "-1", "abc", null, undefined, NaN, 0, -5]) {
      assert.equal(
        resolveTsInitTimeoutMs(bad, {}),
        DEFAULT_TS_INIT_TIMEOUT_MS,
        `explicit ${JSON.stringify(bad)}`,
      );
    }
    for (const bad of ["", "0", "-1", "not-a-number"]) {
      assert.equal(
        resolveTsInitTimeoutMs(undefined, { SCALE_PROJECT_LOAD_TIMEOUT_MS: bad }),
        DEFAULT_TS_INIT_TIMEOUT_MS,
        `env ${JSON.stringify(bad)}`,
      );
    }
  });

  test("a lower explicit budget is respected too — threading is not 'only raise'", () => {
    assert.equal(resolveTsInitTimeoutMs(5_000, {}), 5_000);
  });
});

describe("resolveTsRequestTimeoutMs — the per-command floor", () => {
  test("caller, then env, then the default", () => {
    assert.equal(resolveTsRequestTimeoutMs(50_000, {}), 50_000);
    assert.equal(
      resolveTsRequestTimeoutMs(undefined, { VOLAR_TS_REQUEST_TIMEOUT_MS: "90000" }),
      90_000,
    );
    assert.equal(resolveTsRequestTimeoutMs(undefined, {}), DEFAULT_TS_REQUEST_TIMEOUT_MS);
  });

  test("the floor is no longer the old 15s", () => {
    // 15s was SHORTER than the outer budget the suites give the request it
    // belongs to (45s in background, 60s in scale), which made a cap only this
    // server has the binding constraint.
    assert.ok(
      DEFAULT_TS_REQUEST_TIMEOUT_MS > 15_000,
      `floor is ${DEFAULT_TS_REQUEST_TIMEOUT_MS}`,
    );
  });
});

describe("forwardedBudgetMs — the internal cap must never bind tighter than the harness's", () => {
  test("with nothing in flight the floor applies", () => {
    assert.equal(forwardedBudgetMs(30_000, [], 1_000), 30_000);
  });

  test("an outer request with a larger budget raises it", () => {
    // The background suite asks with 45s; a command forwarded during that
    // question must answer to 45s, not to the bridge's private floor.
    assert.equal(forwardedBudgetMs(30_000, [1_000 + 45_000], 1_000), 45_000);
    // The scale suite asks with 60s.
    assert.equal(forwardedBudgetMs(30_000, [1_000 + 60_000], 1_000), 60_000);
  });

  test("it only ever RAISES — a nearly-expired outer request cannot shrink it", () => {
    assert.equal(forwardedBudgetMs(30_000, [1_050], 1_000), 30_000);
    assert.equal(forwardedBudgetMs(30_000, [500], 1_000), 30_000, "an overdue deadline is ignored");
  });

  test("the largest of several in-flight budgets wins", () => {
    assert.equal(
      forwardedBudgetMs(30_000, [1_000 + 8_000, 1_000 + 60_000, 1_000 + 40_000], 1_000),
      60_000,
    );
  });
});
