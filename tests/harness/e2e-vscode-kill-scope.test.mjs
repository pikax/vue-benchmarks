/**
 * The VS Code E2E launch budget kills a wedged Electron process when it
 * expires. WHICH processes it kills is the whole test.
 *
 * The Windows branch was `taskkill /IM Code.exe /F /T` — match by image name,
 * kill every VS Code on the machine. On a developer box that includes the
 * editor they are working in, with whatever is unsaved in it, terminated by a
 * timeout in a background benchmark. The POSIX branch never had the bug: it
 * already matched the full executable path.
 */
import { describe, test } from "node:test";
import assert from "node:assert/strict";

import { killLaunchCommand } from "../../scripts/e2e-vscode/run.mjs";

const TEST_BUILD =
  "D:\\dev\\personal\\vue-benchmarks\\.vscode-test\\vscode-win32-x64-archive-1.130.0\\Code.exe";
const USER_INSTALL = "C:\\Users\\dev\\AppData\\Local\\Programs\\Microsoft VS Code\\Code.exe";

describe("killLaunchCommand on win32", () => {
  const { command, args } = killLaunchCommand(TEST_BUILD, "win32");
  const script = args.join(" ");

  test("does not kill by image name", () => {
    assert.notEqual(command, "taskkill");
    assert.doesNotMatch(script, /\/IM\b/);
  });

  test("matches the full path of the downloaded test build", () => {
    assert.ok(script.includes(TEST_BUILD), "kill is not scoped to the test build path");
    assert.match(script, /ExecutablePath -eq/);
  });

  test("the user's own VS Code install is not matched", () => {
    // The two paths share an image name and differ only by directory, which is
    // exactly the case the old command could not distinguish.
    assert.ok(!script.includes(USER_INSTALL));
    const pathLiteral = script.match(/-eq '([^']+)'/)?.[1];
    assert.equal(pathLiteral, TEST_BUILD);
    assert.notEqual(pathLiteral, USER_INSTALL);
  });

  test("still narrows by image name as a cheap prefilter", () => {
    assert.match(script, /Name='Code\.exe'/);
  });

  test("quotes in a path cannot break out of the PowerShell string", () => {
    const nasty = "C:\\a'; Stop-Process -Name explorer; '\\Code.exe";
    const { args: a } = killLaunchCommand(nasty, "win32");
    const s = a.join(" ");
    // The apostrophe is doubled, so the injected text stays inside the literal.
    assert.match(s, /-eq 'C:\\a''; Stop-Process -Name explorer; ''\\Code\.exe'/);
  });

  test("runs non-interactively without loading a profile", () => {
    assert.equal(command, "powershell");
    assert.ok(args.includes("-NoProfile"));
    assert.ok(args.includes("-NonInteractive"));
  });
});

describe("killLaunchCommand on posix", () => {
  test("is unchanged — it already matched the full path", () => {
    const posix = "/home/dev/project/.vscode-test/vscode-linux-x64-1.130.0/code";
    assert.deepEqual(killLaunchCommand(posix, "linux"), {
      command: "pkill",
      args: ["-f", posix],
    });
    assert.deepEqual(killLaunchCommand(posix, "darwin"), {
      command: "pkill",
      args: ["-f", posix],
    });
  });
});
