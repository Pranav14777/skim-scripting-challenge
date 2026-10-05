/*
  Cross-file consistency.

  The three files refer to each other by name: script.js looks up ids that have
  to exist in the HTML, the HTML uses classes that have to exist in the CSS, and
  the CSS uses custom properties that have to be declared. None of that is
  checked by anything at runtime, and a rename that misses one file fails
  silently in the browser. This catches it.
*/

const { readProjectFile, check, info, finish } = require("./report");

const html = readProjectFile("index.html");
const js = readProjectFile("script.js");

// Comments are stripped before anything is extracted. A comment mentioning
// "script.js" otherwise reads as a class called .js, and a filename is not a
// selector.
const css = readProjectFile("styles.css").replace(/\/\*[\s\S]*?\*\//g, "");

const uniq = (a) => [...new Set(a)];
const grab = (s, re, g = 1) => [...s.matchAll(re)].map((m) => m[g]);

const htmlIds = uniq(grab(html, /\bid="([^"]+)"/g));
const jsIds = uniq(grab(js, /getElementById\("([^"]+)"\)/g));
const htmlClasses = uniq(
  grab(html, /\bclass="([^"]+)"/g).flatMap((c) => c.split(/\s+/))
);
const cssClasses = uniq(grab(css, /\.([a-zA-Z][\w-]*)/g));
const htmlFor = uniq(grab(html, /\bfor="([^"]+)"/g));
const labelledBy = uniq(grab(html, /aria-labelledby="([^"]+)"/g));

const declaredVars = uniq(grab(css, /^\s*(--[\w-]+):/gm));
const usedVars = uniq(grab(css, /var\((--[\w-]+)\)/g));


/* --- References that have to resolve -------------------------------------- */

check("every id script.js looks up exists in the HTML",
  jsIds.filter((i) => !htmlIds.includes(i)), []);
check("every class the HTML uses is defined in the CSS",
  htmlClasses.filter((c) => !cssClasses.includes(c)), []);
check("every label and output for= points at a real element",
  htmlFor.filter((f) => !htmlIds.includes(f)), []);
check("every aria-labelledby points at a real element",
  labelledBy.filter((f) => !htmlIds.includes(f)), []);
check("no duplicate ids",
  htmlIds.filter((v, i, a) => a.indexOf(v) !== i), []);


/* --- Dead code, in both directions ---------------------------------------- */

// This is the direction that matters most: a style for something that no longer
// exists in the markup. It is how a rule for a deleted footer survived once.
check("no CSS class that the HTML never uses",
  cssClasses.filter((c) => !htmlClasses.includes(c)), []);
check("every custom property used is declared",
  usedVars.filter((v) => !declaredVars.includes(v)), []);
check("every custom property declared is used",
  declaredVars.filter((v) => !usedVars.includes(v)), []);


/* --- Requirements taken straight from the brief --------------------------- */

const requirements = [
  ["viewport meta tag present",
    /<meta name="viewport" content="width=device-width, initial-scale=1">/],
  ["one layout breakpoint, at 768px", /@media \(min-width: 768px\)/],
  ["grid for the outer layout", /\.layout \{[^}]*display: grid/],
  ["flexbox inside the card", /\.card \{[^}]*display: flex/],
  ["min, max and step on both inputs",
    /min="1"[\s\S]*max="18"[\s\S]*step="1"[\s\S]*min="1"[\s\S]*max="100"[\s\S]*step="1"/],
  ["dark mode override guard present", /:root:not\(\[data-theme="light"\]\)/],
];

requirements.forEach(([name, pattern]) => {
  check(name, pattern.test(html) || pattern.test(css), true);
});

info(`@media blocks in the CSS: ${(css.match(/@media/g) || []).length} ` +
     `(the 768px breakpoint and dark mode)`);

finish();
