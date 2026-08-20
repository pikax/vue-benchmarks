import { describe, test, afterEach } from "node:test";
import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import {
  MAX_LOCK_AGE_MS,
  acquireRunLock,
  isLockStale,
  lockConflictMessage,
  pidAlive,
} from "../confirm/lib/run-lock.mjs";

const dirs = [];
function lockPath() {
  const dir = mkdtempSync(join(tmpdir(), "confirm-lock-"));
  dirs.push(dir);
  return join(dir, "confirm.lock");
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop(), { recursive: true, force: true });
});

const alive = () => true;
const dead = () => false;

describe("acquireRunLock", () => {
  test("first acquire wins; a second live run is refused with the holder", () => {
    const path = lockPath();
    const first = acquireRunLock(path, { pid: 100, argv: ["--all"], isPidAlive: alive });
    assert.equal(first.ok, true);
    assert.equal(JSON.parse(readFileSync(path, "utf8")).pid, 100);

    const second = acquireRunLock(path, { pid: 200, isPidAlive: alive });
    assert.equal(second.ok, false);
    assert.equal(second.holder.pid, 100);
    assert.deepEqual(second.holder.argv, ["--all"]);
  });

  test("a dead holder's lock is stolen", () => {
    const path = lockPath();
    acquireRunLock(path, { pid: 100, isPidAlive: alive });
    const second = acquireRunLock(path, { pid: 200, isPidAlive: dead });
    assert.equal(second.ok, true);
    assert.equal(JSON.parse(readFileSync(path, "utf8")).pid, 200);
  });

  test("an ancient lock is stolen even if the PID reads as alive (PID reuse)", () => {
    const path = lockPath();
    const past = Date.now() - MAX_LOCK_AGE_MS - 1000;
    acquireRunLock(path, { pid: 100, now: () => past, isPidAlive: alive });
    const second = acquireRunLock(path, { pid: 200, isPidAlive: alive });
    assert.equal(second.ok, true);
  });

  test("a garbled lock (crash mid-write) is treated as stale", () => {
    const path = lockPath();
    writeFileSync(path, "{not json");
    const got = acquireRunLock(path, { pid: 200, isPidAlive: alive });
    assert.equal(got.ok, true);
  });

  test("re-entrant acquire by the same pid keeps the lock", () => {
    const path = lockPath();
    acquireRunLock(path, { pid: 100, isPidAlive: alive });
    const again = acquireRunLock(path, { pid: 100, isPidAlive: alive });
    assert.equal(again.ok, true);
    assert.equal(JSON.parse(readFileSync(path, "utf8")).pid, 100);
  });

  test("release removes only its own lock, never a successor's", () => {
    const path = lockPath();
    const first = acquireRunLock(path, { pid: 100, isPidAlive: alive });
    // First run dies; a successor steals the stale lock.
    const second = acquireRunLock(path, { pid: 200, isPidAlive: dead });
    assert.equal(second.ok, true);
    // Dead run's exit handler fires late — must not unlock the successor.
    first.release();
    assert.equal(existsSync(path), true);
    assert.equal(JSON.parse(readFileSync(path, "utf8")).pid, 200);
    second.release();
    assert.equal(existsSync(path), false);
  });
});

describe("isLockStale / pidAlive", () => {
  test("live + fresh is not stale; missing/expired/dead is", () => {
    const fresh = { pid: 1, startedAt: new Date().toISOString() };
    assert.equal(isLockStale(fresh, { isPidAlive: alive }), false);
    assert.equal(isLockStale(fresh, { isPidAlive: dead }), true);
    assert.equal(isLockStale(null), true);
    assert.equal(
      isLockStale(
        { pid: 1, startedAt: new Date(Date.now() - MAX_LOCK_AGE_MS - 1).toISOString() },
        { isPidAlive: alive },
      ),
      true,
    );
    assert.equal(isLockStale({ pid: 1 }, { isPidAlive: alive }), true, "no startedAt → stale");
  });

  test("pidAlive: own process is alive, EPERM counts as alive, bad pids are not", () => {
    assert.equal(pidAlive(process.pid), true);
    assert.equal(
      pidAlive(1, () => {
        const e = new Error("denied");
        e.code = "EPERM";
        throw e;
      }),
      true,
    );
    assert.equal(pidAlive(-1), false);
    assert.equal(pidAlive(NaN), false);
  });
});

describe("lockConflictMessage", () => {
  test("names the holder and the lock path", () => {
    const msg = lockConflictMessage("work/confirm.lock", {
      pid: 4242,
      startedAt: "2026-08-20T12:00:00.000Z",
      argv: ["--surfaces", "typecheck", "--all"],
    });
    assert.match(msg, /pid 4242/);
    assert.match(msg, /--surfaces typecheck --all/);
    assert.match(msg, /work[\/\\]confirm\.lock/);
    assert.match(msg, /refusing to start/);
  });
});
