/**
 * Minimal JSON-RPC 2.0 LSP client over stdio.
 * Stdio LSP client harness.
 */

import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";

/** Cap on retained stderr per server — enough for a startup failure trace. */
const STDERR_TAIL_BYTES = 16_384;

export class LspClient extends EventEmitter {
  #proc;
  #procError = null;
  #buffer = Buffer.alloc(0);
  #nextId = 1;
  #pending = new Map();
  #name;
  #configuration;
  positionEncoding = "utf-16";

  constructor(name, command, args = [], options = {}) {
    super();
    this.#name = name;
    this.#configuration = options.configuration ?? {};
    this.#proc = spawn(command, args, {
      stdio: ["pipe", "pipe", options.inheritStderr ? "inherit" : "pipe"],
      env: { ...process.env, ...(options.env ?? {}) },
      cwd: options.cwd,
      shell: options.shell ?? false,
    });

    /** PID of the language server, for resource sampling. */
    this.pid = this.#proc.pid;

    this.#proc.stdout.on("data", (chunk) => this.#onData(chunk));
    // A spawn failure (EACCES, ENOENT) must cost ONE failed row, not the whole
    // benchmark process: `emit("error")` with no listener throws, and nothing
    // here listens. Reject every in-flight request instead — the callers
    // already treat a rejected request as that server's failure — and only
    // re-emit for callers that opted in.
    this.#proc.on("error", (err) => {
      this.#procError = err;
      for (const [id, pending] of this.#pending) {
        this.#pending.delete(id);
        pending.reject(new Error(`${this.#name}: server process failed: ${err.message}`));
      }
      if (this.listenerCount("error") > 0) this.emit("error", err);
    });
    this.#proc.on("exit", (code, signal) => this.emit("exit", { code, signal }));

    /**
     * Bounded tail of the server's stderr.
     *
     * Kept because a server can come up, answer every request, and still be
     * running a degraded backend — Vize logs `corsa bridge spawn failed` to
     * stderr and then silently answers hovers from its own semantic analysis
     * instead of tsgo. That distinction does not appear anywhere in the LSP
     * traffic, so without stderr the row would report a fast, healthy-looking
     * result with no indication that its type backend never started.
     */
    this.stderrTail = "";

    if (this.#proc.stderr && !options.inheritStderr) {
      this.#proc.stderr.on("data", (chunk) => {
        const s = chunk.toString();
        this.stderrTail = (this.stderrTail + s).slice(-STDERR_TAIL_BYTES);
        if (process.env.LSP_BENCH_DEBUG) {
          process.stderr.write(`[${this.#name}:stderr] ${chunk}`);
        }
      });
    }
  }

  get name() {
    return this.#name;
  }

  #onData(chunk) {
    this.#buffer = Buffer.concat([this.#buffer, chunk]);
    while (true) {
      const headerEnd = this.#buffer.indexOf("\r\n\r\n");
      if (headerEnd === -1) return;
      const header = this.#buffer.subarray(0, headerEnd).toString("utf8");
      const match = header.match(/Content-Length:\s*(\d+)/i);
      if (!match) {
        this.#buffer = this.#buffer.subarray(headerEnd + 4);
        continue;
      }
      const length = Number.parseInt(match[1], 10);
      const bodyStart = headerEnd + 4;
      if (this.#buffer.length < bodyStart + length) return;
      const body = this.#buffer.subarray(bodyStart, bodyStart + length).toString("utf8");
      this.#buffer = this.#buffer.subarray(bodyStart + length);
      let msg;
      try {
        msg = JSON.parse(body);
      } catch {
        continue;
      }
      this.#dispatch(msg);
    }
  }

  #dispatch(msg) {
    if (msg.id != null && (msg.result !== undefined || msg.error !== undefined)) {
      const pending = this.#pending.get(msg.id);
      if (pending) {
        this.#pending.delete(msg.id);
        if (msg.error) pending.reject(new Error(JSON.stringify(msg.error)));
        else pending.resolve(msg.result);
      }
      return;
    }
    if (msg.method) {
      this.emit("notification", msg.method, msg.params);
      this.emit(`notify:${msg.method}`, msg.params);
      // Respond to server → client requests
      if (msg.id != null) {
        const result = this.#handleServerRequest(msg.method, msg.params);
        this.#write({ jsonrpc: "2.0", id: msg.id, result });
      }
    }
  }

  #handleServerRequest(method, params) {
    if (method === "workspace/configuration") {
      const items = params?.items ?? [];
      return items.map((item) => this.#lookupConfiguration(item.section ?? ""));
    }
    if (method === "workspace/workspaceFolders") {
      return this.#configuration.workspaceFolders ?? null;
    }
    if (method === "client/registerCapability" || method === "client/unregisterCapability") {
      return null;
    }
    if (method === "window/workDoneProgress/create") {
      return null;
    }
    if (method === "window/showMessageRequest") {
      return null;
    }
    // Default empty success
    return null;
  }

  /**
   * Resolve a dotted configuration section ("vue.hover.rich", "css.customData")
   * against the configured settings.
   *
   * Unknown sections return `null`, which the LSP spec defines as "the client
   * has no value for this". Returning `{}` instead is actively harmful: servers
   * read a section expecting an array or a scalar and get an object, e.g.
   * Volar asks for `css.customData` and its CSS service does `for (… of value)`
   * — `{}` is not iterable and the feature throws, while `null` falls through
   * to the server's own default.
   */
  #lookupConfiguration(section) {
    if (!section) return this.#configuration;
    let value = this.#configuration;
    for (const key of section.split(".")) {
      if (value == null || typeof value !== "object" || !(key in value)) return null;
      value = value[key];
    }
    return value ?? null;
  }

  #write(msg) {
    // A failed spawn leaves stdin destroyed; writing would throw a second,
    // unrelated error on top of the one already reported via #procError.
    if (this.#procError || !this.#proc.stdin?.writable) return;
    const json = JSON.stringify(msg);
    const payload = `Content-Length: ${Buffer.byteLength(json, "utf8")}\r\n\r\n${json}`;
    this.#proc.stdin.write(payload);
  }

  sendNotification(method, params) {
    this.#write({ jsonrpc: "2.0", method, params });
  }

  sendRequest(method, params, timeoutMs = 30_000) {
    if (this.#procError) {
      return Promise.reject(
        new Error(`${this.#name}: server process failed: ${this.#procError.message}`),
      );
    }
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

  /**
   * Wait for a notification method (or any of methods[]).
   */
  waitForNotification(methods, timeoutMs = 60_000) {
    const set = new Set(Array.isArray(methods) ? methods : [methods]);
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.off("notification", onNotify);
        reject(
          new Error(`${this.#name}: timeout waiting for ${[...set].join("|")} (${timeoutMs}ms)`),
        );
      }, timeoutMs);
      const onNotify = (method, params) => {
        if (set.has(method)) {
          clearTimeout(timer);
          this.off("notification", onNotify);
          resolve({ method, params });
        }
      };
      this.on("notification", onNotify);
    });
  }

  async initialize(rootUri, { initializationOptions, timeoutMs = 30_000 } = {}) {
    const result = await this.sendRequest(
      "initialize",
      {
        processId: process.pid,
        rootUri,
        rootPath: null,
        capabilities: {
          workspace: {
            configuration: true,
            workspaceFolders: true,
          },
          textDocument: {
            synchronization: { dynamicRegistration: false, didSave: true },
            hover: { contentFormat: ["markdown", "plaintext"] },
            completion: {
              completionItem: { snippetSupport: true },
            },
            definition: { linkSupport: true },
            publishDiagnostics: { relatedInformation: true },
          },
          general: {
            positionEncodings: ["utf-16"],
          },
        },
        initializationOptions: initializationOptions ?? {},
        workspaceFolders: [{ uri: rootUri, name: "bench" }],
      },
      timeoutMs,
    );

    const encodings = result?.capabilities?.positionEncoding;
    if (typeof encodings === "string") this.positionEncoding = encodings;
    else if (result?.capabilities?.general?.positionEncodings?.[0]) {
      this.positionEncoding = result.capabilities.general.positionEncodings[0];
    }

    this.sendNotification("initialized", {});
    return result;
  }

  async shutdown() {
    try {
      await this.sendRequest("shutdown", null, 5_000);
      this.sendNotification("exit");
    } catch {
      // ignore
    }
    await this.kill();
  }

  kill() {
    return new Promise((resolve) => {
      // A spawn-failed process never emits 'exit', so waiting for it here
      // would ride the 2s fallback timer for a process that does not exist.
      if (!this.#proc || this.#proc.killed || this.#procError) {
        resolve();
        return;
      }
      this.#proc.once("exit", () => resolve());
      this.#proc.kill();
      setTimeout(() => {
        try {
          this.#proc.kill("SIGKILL");
        } catch {
          // ignore
        }
        resolve();
      }, 2000).unref?.();
    });
  }
}

export function pathToFileUri(absPath) {
  let p = absPath.replace(/\\/g, "/");
  if (!p.startsWith("/")) p = `/${p}`;
  // Windows drive letter
  if (/^\/[A-Za-z]:/.test(p)) {
    return `file://${p}`;
  }
  return `file://${p}`;
}
