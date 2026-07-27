/**
 * Minimal MCP (Model Context Protocol) client over stdio.
 *
 * Deliberately NOT built on LspClient. Both are JSON-RPC 2.0, but the framing
 * differs: LSP uses `Content-Length` headers, MCP stdio uses newline-delimited
 * JSON. Sharing a transport would mean a mode flag threaded through every read,
 * and the two protocols' handshakes have nothing in common either.
 *
 * A server is expected to keep stdout clean — every line must be JSON. Anything
 * else is a protocol violation worth reporting rather than swallowing, because
 * a banner printed to stdout will corrupt a real agent's session too.
 */

import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";

/** Cap on retained stderr — enough for a startup failure trace. */
const STDERR_TAIL_BYTES = 16_384;

/** The protocol revision this client speaks. */
export const MCP_PROTOCOL_VERSION = "2024-11-05";

export class McpClient extends EventEmitter {
  #proc;
  #buffer = "";
  #nextId = 1;
  #pending = new Map();
  #name;

  constructor(name, command, args = [], options = {}) {
    super();
    this.#name = name;
    this.#proc = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: { ...process.env, ...(options.env ?? {}) },
      cwd: options.cwd,
      shell: options.shell ?? false,
    });

    this.pid = this.#proc.pid;
    this.stderrTail = "";
    /** Lines a server wrote to stdout that were not JSON — a protocol fault. */
    this.nonJsonStdout = [];

    this.#proc.stdout.on("data", (chunk) => this.#onData(chunk));
    this.#proc.stderr.on("data", (chunk) => {
      this.stderrTail = (this.stderrTail + chunk.toString()).slice(-STDERR_TAIL_BYTES);
    });
    this.#proc.on("error", (err) => this.emit("error", err));
    this.#proc.on("exit", (code, signal) => this.emit("exit", { code, signal }));
  }

  get name() {
    return this.#name;
  }

  #onData(chunk) {
    this.#buffer += chunk.toString();
    let nl;
    while ((nl = this.#buffer.indexOf("\n")) !== -1) {
      const line = this.#buffer.slice(0, nl).trim();
      this.#buffer = this.#buffer.slice(nl + 1);
      if (!line) continue;
      let msg;
      try {
        msg = JSON.parse(line);
      } catch {
        if (this.nonJsonStdout.length < 20) this.nonJsonStdout.push(line.slice(0, 200));
        continue;
      }
      this.#dispatch(msg);
    }
  }

  #dispatch(msg) {
    if (msg.id != null && (msg.result !== undefined || msg.error !== undefined)) {
      const pending = this.#pending.get(msg.id);
      if (!pending) return;
      this.#pending.delete(msg.id);
      if (msg.error) pending.reject(new Error(JSON.stringify(msg.error)));
      else pending.resolve(msg.result);
      return;
    }
    if (msg.method) this.emit("notification", msg.method, msg.params);
  }

  #write(msg) {
    this.#proc.stdin.write(`${JSON.stringify(msg)}\n`);
  }

  notify(method, params) {
    this.#write({ jsonrpc: "2.0", method, params });
  }

  request(method, params, timeoutMs = 30_000) {
    const id = this.#nextId++;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`${this.#name}: ${method} timed out after ${timeoutMs}ms`));
      }, timeoutMs);
      this.#pending.set(id, {
        resolve: (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        reject: (e) => {
          clearTimeout(timer);
          reject(e);
        },
      });
      this.#write({ jsonrpc: "2.0", id, method, params });
    });
  }

  /** Full handshake. Returns the server's initialize result. */
  async initialize({ timeoutMs = 30_000 } = {}) {
    const result = await this.request(
      "initialize",
      {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: {},
        clientInfo: { name: "vue-benchmarks", version: "0.1.0" },
      },
      timeoutMs,
    );
    this.serverInfo = result?.serverInfo ?? null;
    this.notify("notifications/initialized", {});
    return result;
  }

  /** @returns {Promise<Array<{name:string, description?:string}>>} */
  async listTools(timeoutMs = 30_000) {
    const r = await this.request("tools/list", {}, timeoutMs);
    return r?.tools ?? [];
  }

  /**
   * Call a tool. Returns the raw result — callers gate on its CONTENT, so this
   * deliberately does not throw on `isError`: a tool reporting a failure is a
   * result to be judged, not an exception to be swallowed.
   */
  callTool(name, args = {}, timeoutMs = 60_000) {
    return this.request("tools/call", { name, arguments: args }, timeoutMs);
  }

  kill() {
    try {
      this.#proc.kill();
    } catch {
      // Already gone.
    }
  }
}

/**
 * Flatten an MCP tool result's content blocks into plain text.
 *
 * Servers may answer with several blocks, and text may carry JSON. Gates need
 * one string to search and one optional parsed object, so produce both rather
 * than making every gate re-implement this.
 *
 * @returns {{ text: string, json: any, isError: boolean }}
 */
export function toolText(result) {
  const blocks = Array.isArray(result?.content) ? result.content : [];
  const text = blocks
    .map((b) => (typeof b === "string" ? b : (b?.text ?? "")))
    .filter(Boolean)
    .join("\n")
    .trim();
  let json = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      json = null;
    }
  }
  return { text, json, isError: Boolean(result?.isError) };
}
