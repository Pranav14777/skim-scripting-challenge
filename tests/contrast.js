/*
  WCAG AA contrast, computed from the colour tokens in styles.css.

  Reading the values out of the stylesheet rather than listing them here means
  the numbers in the README cannot drift from the colours the page actually uses:
  change a token, run this, and the figures move with it.

  AA asks for 4.5:1 on normal text and 3:1 on interface elements such as focus
  rings and borders.
*/

const { readProjectFile, check, info, finish } = require("./report");

const css = readProjectFile("styles.css");

const AA_TEXT = 4.5;
const AA_UI = 3.0;

// WCAG 2.1 relative luminance: each channel is linearised, then weighted by how
// much the eye responds to it.
function luminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
    .map((v) => v / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function ratio(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

// Pull one block of token declarations out of the stylesheet.
function tokensIn(pattern) {
  const body = css.match(pattern)[0];
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

const light = tokensIn(/^:root \{[\s\S]*?\n\}/m);
const dark = tokensIn(/^:root\[data-theme="dark"\] \{[\s\S]*?\n\}/m);
const darkFromMediaQuery = tokensIn(/:root:not\(\[data-theme="light"\]\) \{[\s\S]*?\n  \}/);

// Dark mode is declared twice, once for the system preference and once for the
// explicit toggle. If the two ever disagree, the toggle and the system setting
// would render differently, which is the kind of thing nobody notices by eye.
check("both dark mode blocks declare identical values",
  Object.keys(dark).filter((k) => dark[k] !== darkFromMediaQuery[k]), []);

const pairs = [];
const add = (theme, label, fg, bg, needs) =>
  pairs.push({ theme, label, value: ratio(fg, bg), needs });

for (const [theme, t] of [["light", light], ["dark", dark]]) {
  add(theme, "body text on page background", t["--text"], t["--bg"], AA_TEXT);
  add(theme, "body text on card surface", t["--text"], t["--surface"], AA_TEXT);
  add(theme, "body text on inset block", t["--text"], t["--inset"], AA_TEXT);
  add(theme, "muted text (labels) on card", t["--text-muted"], t["--surface"], AA_TEXT);
  add(theme, "muted text on inset block", t["--text-muted"], t["--inset"], AA_TEXT);
  add(theme, "button label on accent", t["--on-accent"], t["--accent"], AA_TEXT);
  add(theme, "button label on accent hover", t["--on-accent"], t["--accent-hover"], AA_TEXT);
  add(theme, "accent focus ring on card", t["--accent"], t["--surface"], AA_UI);
  add(theme, "error text on card surface", t["--error-text"], t["--surface"], AA_TEXT);
  add(theme, "error rule on card surface", t["--error-border"], t["--surface"], AA_UI);
  add(theme, "invalid input border on card", t["--error-border"], t["--surface"], AA_UI);
}

pairs.forEach((p) => {
  check(`${p.theme.padEnd(5)} ${p.label.padEnd(30)} ` +
        `${p.value.toFixed(2).padStart(6)}:1 (needs ${p.needs})`,
    p.value >= p.needs, true);
});

// Not a WCAG rule, but it is the thing being tuned: how far the card stands off
// the page, and the result block back off the card.
for (const [theme, t] of [["light", light], ["dark", dark]]) {
  info(`${theme.padEnd(5)} separation: card against page ` +
       `${ratio(t["--surface"], t["--bg"]).toFixed(3)}:1, ` +
       `inset against card ${ratio(t["--inset"], t["--surface"]).toFixed(3)}:1`);
}

finish();
