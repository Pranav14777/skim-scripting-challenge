/*
  Shared reporting for the checks in this folder.

  Every check prints one line, and finish() sets the process exit code so that
  `node tests/run.js` can tell pass from fail without reading the output.
*/

const fs = require("fs");
const path = require("path");

// The project root is one level up from this folder, so the checks can be run
// from anywhere: `node tests/run.js` and `cd tests && node run.js` both work.
const root = path.join(__dirname, "..");

const readProjectFile = (name) => fs.readFileSync(path.join(root, name), "utf8");

let passed = 0;
let failed = 0;

function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);

  if (ok) {
    passed += 1;
  } else {
    failed += 1;
  }

  console.log(`${ok ? "PASS" : "FAIL"}  ${name}`);

  if (!ok) {
    console.log(`        expected: ${JSON.stringify(expected)}`);
    console.log(`        actual:   ${JSON.stringify(actual)}`);
  }

  return ok;
}

// For lines that report a measurement rather than assert anything.
function info(line) {
  console.log(`INFO  ${line}`);
}

function finish() {
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

module.exports = { root, readProjectFile, check, info, finish };
