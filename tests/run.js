/*
  Runs every check in this folder and reports a single result.

      node tests/run.js

  Each check is run as its own process so that one failing suite cannot stop the
  others, and so that each file can still be run on its own:

      node tests/behaviour.js
*/

const path = require("path");
const { spawnSync } = require("child_process");

/*
  Every suite here asserts something that is true or false in the files
  themselves. Nothing estimates. A check that guessed at, say, rendered text
  heights could report PASS on a broken page or FAIL on a working one, and a
  confident-looking wrong answer is worse than no answer at all. Anything that
  needs a real browser to be judged belongs in the manual list in the README.
*/
const SUITES = [
  ["behaviour.js", "script.js driven through a DOM stub"],
  ["wiring.js", "ids, classes and tokens line up across the three files"],
  ["contrast.js", "WCAG AA contrast, read from the CSS tokens"],
];

let failedSuites = 0;

SUITES.forEach(([file, description], i) => {
  if (i > 0) {
    console.log("");
  }

  console.log("=".repeat(72));
  console.log(`${file}  -  ${description}`);
  console.log("=".repeat(72));

  const result = spawnSync(process.execPath, [path.join(__dirname, file)], {
    stdio: "inherit",
  });

  if (result.status !== 0) {
    failedSuites += 1;
  }
});

console.log("");
console.log("=".repeat(72));

if (failedSuites === 0) {
  console.log(`All ${SUITES.length} suites passed.`);
} else {
  console.log(`${failedSuites} of ${SUITES.length} suites failed.`);
}

process.exit(failedSuites === 0 ? 0 : 1);
