import { test } from "node:test";
import assert from "node:assert/strict";
import { LspClient } from "../../scripts/lib/lsp-client.mjs";

const server = `
let buffer = Buffer.alloc(0);
let request;
function send(message) {
  const body = JSON.stringify({ jsonrpc: '2.0', ...message });
  process.stdout.write('Content-Length: ' + Buffer.byteLength(body) + '\\r\\n\\r\\n' + body);
}
process.stdin.on('data', chunk => {
  buffer = Buffer.concat([buffer, chunk]);
  for (;;) {
    const end = buffer.indexOf('\\r\\n\\r\\n');
    if (end < 0) return;
    const size = Number(/Content-Length: (\\d+)/i.exec(buffer.subarray(0, end).toString())[1]);
    if (buffer.length < end + 4 + size) return;
    const message = JSON.parse(buffer.subarray(end + 4, end + 4 + size));
    buffer = buffer.subarray(end + 4 + size);
    if (message.method === 'trigger') {
      request = message.id;
      send({ id: 'apply', method: 'workspace/applyEdit', params: { edit: { changes: {} } } });
    } else if (message.id === 'apply') {
      send({ id: request, result: message.error ? { error: message.error } : message.result });
    }
  }
});
`;

test("LSP server-request handlers await results, report errors and restore scoped overrides", async () => {
  const client = new LspClient("request-handler-test", process.execPath, ["-e", server]);
  try {
    const restore = client.setServerRequestHandler("workspace/applyEdit", async ({ edit }) => {
      assert.deepEqual(edit, { changes: {} });
      await Promise.resolve();
      return { applied: true };
    });
    assert.deepEqual(await client.sendRequest("trigger", {}, 5000), { applied: true });
    const undoError = client.setServerRequestHandler("workspace/applyEdit", () => { throw new Error("invalid edit"); });
    assert.deepEqual(await client.sendRequest("trigger", {}, 5000), { error: { code: -32603, message: "invalid edit" } });
    undoError();
    assert.deepEqual(await client.sendRequest("trigger", {}, 5000), { applied: true });
    restore();
    assert.equal(await client.sendRequest("trigger", {}, 5000), null);
  } finally { client.kill(); }
});
