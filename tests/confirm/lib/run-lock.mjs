/**
 * Single-run lock for the confirmation suite.
 *
 * Every confirm suite prepares fixed scratch trees under `work/` (e.g.
 * `work/confirm-typecheck-all`) starting with an rmSync of the previous tree.
 * Two concurrent runs therefore delete each other's trees out from under
 * in-flight tool spawns, which does not crash — it silently records wrong
 * scores ("expected ≥1 error(s), got 0" on plants every tool catches, golar
 * skipping on a vanished golar.config). One run at a time, enforced here;
 * a second run fails fast with a message instead of corrupting the first.
 *
 * CI is unaffected: each job runs one confirm process, so the lock is always
 * free. Staleness (dead PID, or an ancient lock from a hard power-off) is
 * detected so a crashed run never wedges the next one.
 */
import { mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

/** A lock older than this is stale regardless of PID (PIDs get reused). */
export const MAX_LOCK_AGE_MS = 6 * 60 * 60 * 1000;

/** Best-effort liveness probe. EPERM means "exists but not ours" → alive. */
export function pidAlive(pid, kill = process.kill) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    kill(pid, 0);
    return true;
  } catch (error) {
    return error?.code === "EPERM";
  }
}

/**
 * @param {{ pid?: number, startedAt?: string }} info parsed lock contents
 * @param {{ now?: number, isPidAlive?: (pid: number) => boolean }} opts
 */
export function isLockStale(info, { now = Date.now(), isPidAlive = pidAlive } = {}) {
  if (!info || typeof info !== "object") return true;
  const started = Date.parse(info.startedAt || "");
  if (!Number.isFinite(started) || now - started > MAX_LOCK_AGE_MS) return true;
  return !isPidAlive(info.pid);
}

function readLock(lockPath) {
  try {
    return JSON.parse(readFileSync(lockPath, "utf8"));
  } catch {
    // Unreadable/garbled lock (crash mid-write) — treat as stale.
    return null;
  }
}

/**
 * Try to take the lock. Returns `{ ok: true, release }` on success;
 * `{ ok: false, holder }` when a live run already holds it.
 *
 * `release` only removes the lock if it is still ours, so a successor that
 * legitimately stole a stale lock is never unlocked by the dead run's
 * exit handler.
 */
export function acquireRunLock(
  lockPath,
  { pid = process.pid, argv = process.argv.slice(2), now = Date.now, isPidAlive = pidAlive } = {},
) {
  mkdirSync(dirname(lockPath), { recursive: true });
  const payload = () =>
    JSON.stringify({ pid, startedAt: new Date(now()).toISOString(), argv }, null, 2);

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      writeFileSync(lockPath, payload(), { flag: "wx" });
      const release = () => {
        const current = readLock(lockPath);
        if (current?.pid !== pid) return;
        try {
          unlinkSync(lockPath);
        } catch {
          /* already gone */
        }
      };
      return { ok: true, release };
    } catch (error) {
      if (error?.code !== "EEXIST") throw error;
      const holder = readLock(lockPath);
      if (holder?.pid === pid) {
        // Our own lock (re-entrant acquire in-process) — keep it.
        return { ok: true, release: () => {} };
      }
      if (!isLockStale(holder, { now: now(), isPidAlive })) {
        return { ok: false, holder };
      }
      try {
        unlinkSync(lockPath);
      } catch {
        /* raced with the holder's own cleanup — retry the create */
      }
    }
  }
  // Two stale-steal attempts failed — someone live keeps recreating it.
  return { ok: false, holder: readLock(lockPath) };
}

/** Human message for a refused acquire. */
export function lockConflictMessage(lockPath, holder) {
  const who = holder?.pid ? `pid ${holder.pid}` : "an unknown process";
  const since = holder?.startedAt ? ` since ${holder.startedAt}` : "";
  const what = Array.isArray(holder?.argv) && holder.argv.length ? ` (${holder.argv.join(" ")})` : "";
  return [
    `Another confirm run is already in progress — ${who}${since}${what}.`,
    "Concurrent runs share the same work/ scratch trees and silently corrupt",
    "each other's scores, so this run is refusing to start.",
    `Wait for it to finish, or delete ${lockPath} if that process is gone.`,
  ].join("\n");
}
