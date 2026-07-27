#!/usr/bin/env node
/**
 * A deliberately dumb LSP server, used to test the HARNESS's timing protocol.
 *
 * Not a Vue tool and not a mock of one: it exists so that `runLspSession` can
 * be measured against a server whose project-load time is a known constant.
 * Real servers cannot answer that question — their load time is exactly the
 * thing under measurement, so a test built on one could only assert tautologies.
 *
 * It models the single behaviour the ready-signal fairness rule is about: a
 * workspace that is NOT usable for the first `STUB_PROJECT_LOAD_MS` after
 * `initialize`, and that may or may not announce when it becomes usable. Both
 * configurations become usable at the same instant; the only difference is
 * whether a notification is emitted. Any measurement that changes between them
 * is measuring the announcement rather than the work.
 *
 * Environment:
 *   STUB_PROJECT_LOAD_MS    ms after `initialize` before requests are answered
 *                           (before that, every feature request returns an
 *                           error, which is how a real server behaves while its
 *                           project service is still spinning up)
 *   STUB_READY_NOTIFICATION notification method to emit at that instant;
 *                           empty/unset means the server announces nothing
 */

const LOAD_MS = Number(process.env.STUB_PROJECT_LOAD_MS ?? 0);
const READY_METHOD = process.env.STUB_READY_NOTIFICATION || "";

let loaded = LOAD_MS <= 0;
let buffer = Buffer.alloc(0);

function send(message) {
  const body = Buffer.from(JSON.stringify({ jsonrpc: "2.0", ...message }), "utf8");
  process.stdout.write(`Content-Length: ${body.length}\r\n\r\n`);
  process.stdout.write(body);
}

/** Hover payload shaped to satisfy the surface's content gate. */
const HOVER = {
  contents: { kind: "markdown", value: "```typescript\nconst benchMarker: Ref<string>\n```" },
};

function onMessage(msg) {
  if (msg.method === "initialize") {
    send({ id: msg.id, result: { capabilities: { hoverProvider: true } } });
    if (!loaded) {
      setTimeout(() => {
        loaded = true;
        // Announced (or not) at the instant the work actually finishes, so the
        // two configurations differ in the announcement alone.
        if (READY_METHOD) send({ method: READY_METHOD, params: {} });
      }, LOAD_MS);
    } else if (READY_METHOD) {
      send({ method: READY_METHOD, params: {} });
    }
    return;
  }
  if (msg.method === "shutdown") {
    send({ id: msg.id, result: null });
    return;
  }
  if (msg.method === "exit") {
    process.exit(0);
  }
  // Notifications (initialized, didOpen, ...) need no reply.
  if (msg.id == null) return;

  if (!loaded) {
    send({
      id: msg.id,
      error: { code: -32803, message: "stub: project not loaded yet" },
    });
    return;
  }
  if (msg.method === "textDocument/hover") send({ id: msg.id, result: HOVER });
  else if (msg.method === "textDocument/completion") {
    send({ id: msg.id, result: { isIncomplete: false, items: [{ label: "benchMarker" }] } });
  } else if (msg.method === "textDocument/definition") send({ id: msg.id, result: [] });
  else send({ id: msg.id, result: null });
}

process.stdin.on("data", (chunk) => {
  buffer = Buffer.concat([buffer, chunk]);
  for (;;) {
    const headerEnd = buffer.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;
    const header = buffer.subarray(0, headerEnd).toString("utf8");
    const length = Number.parseInt(/Content-Length:\s*(\d+)/i.exec(header)?.[1] ?? "", 10);
    if (!Number.isFinite(length)) {
      buffer = buffer.subarray(headerEnd + 4);
      continue;
    }
    const start = headerEnd + 4;
    if (buffer.length < start + length) return;
    const body = buffer.subarray(start, start + length).toString("utf8");
    buffer = buffer.subarray(start + length);
    try {
      onMessage(JSON.parse(body));
    } catch {
      // Malformed frame — nothing useful to answer.
    }
  }
});
