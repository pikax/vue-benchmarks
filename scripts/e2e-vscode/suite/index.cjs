/**
 * Mocha entrypoint loaded by @vscode/test-electron inside VS Code.
 */
const path = require("path");
const Mocha = require("mocha");

function run() {
  const mocha = new Mocha({
    ui: "tdd",
    color: true,
    timeout: 180_000,
  });
  mocha.addFile(path.join(__dirname, "bench.test.cjs"));
  return new Promise((resolve, reject) => {
    mocha.run((failures) => {
      if (failures > 0) reject(new Error(`${failures} tests failed`));
      else resolve();
    });
  });
}

module.exports = { run };
