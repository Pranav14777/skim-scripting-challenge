/*
  Behaviour checks for script.js.

  There is no browser here, so this file builds a small stand-in for the handful
  of DOM objects script.js touches, loads the real script.js against it, and then
  drives the two forms by calling the submit handlers it registered.

  The point of loading the real file rather than copying its logic: if script.js
  breaks, these checks break with it.
*/

const vm = require("vm");
const { readProjectFile, check, finish } = require("./report");

const code = readProjectFile("script.js");
const indexHtml = readProjectFile("index.html");

// A stand-in for one DOM element: enough of the surface for script.js to run.
function makeEl() {
  return {
    value: "",
    // Real textContent turns whatever it is given into a string. The stub has to
    // do the same, or it would not show what the browser actually renders.
    _text: "",
    get textContent() { return this._text; },
    set textContent(v) { this._text = String(v); },
    validity: { badInput: false },
    handlers: {},
    attrs: {},
    addEventListener(type, fn) { this.handlers[type] = fn; },
    getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    removeAttribute(k) { delete this.attrs[k]; },
  };
}

const ELEMENT_IDS = [
  "factorial-form", "factorial-input", "factorial-message", "factorial-output",
  "logger-form", "logger-input", "logger-message", "logger-output",
  "theme-toggle",
];

const els = {};
ELEMENT_IDS.forEach((id) => { els[id] = makeEl(); });

// script.js reads the logger's standing instruction out of the DOM at startup,
// so the stub has to ship the same text index.html does.
const IDLE_TEXT = indexHtml
  .match(/id="logger-output"[^>]*>([\s\S]*?)<\/output>/)[1]
  .trim();
els["logger-output"].textContent = IDLE_TEXT;

const logged = [];

vm.runInNewContext(code, {
  document: {
    getElementById: (id) => els[id],
    documentElement: { getAttribute: () => null, setAttribute: () => {} },
  },
  window: { matchMedia: () => ({ matches: false }) },
  localStorage: { getItem: () => null, setItem: () => {} },
  console: { log: (v) => logged.push(v) },
});


/* --- Challenge 1: factorial ---------------------------------------------- */

function submitFactorial(raw, badInput = false) {
  els["factorial-input"].value = raw;
  els["factorial-input"].validity.badInput = badInput;
  els["factorial-message"].textContent = "";
  els["factorial-form"].handlers.submit({ preventDefault() {} });
  return {
    out: els["factorial-output"].textContent,
    msg: els["factorial-message"].textContent,
  };
}

check("Ch1 4 -> 24", submitFactorial("4").out, "24");
check("Ch1 8 -> 40320", submitFactorial("8").out, "40320");
check("Ch1 1 -> 1", submitFactorial("1").out, "1");
check("Ch1 18 is exact", submitFactorial("18").out, "6402373705728000");
check("Ch1 18! is within the safe-integer range",
  6402373705728000 <= Number.MAX_SAFE_INTEGER, true);

const r19 = submitFactorial("19");
check("Ch1 19 rejected", [r19.out, /out of range/.test(r19.msg)], ["-", true]);
check("Ch1 0 message", /below the minimum/.test(submitFactorial("0").msg), true);
check("Ch1 -3 message", /Negative numbers/.test(submitFactorial("-3").msg), true);
check("Ch1 2.5 message", /Whole numbers only/.test(submitFactorial("2.5").msg), true);
check("Ch1 blank message",
  /^Enter a number between 1 and 18\.$/.test(submitFactorial("").msg), true);
check("Ch1 abc message", /isn't a number/.test(submitFactorial("", true).msg), true);

// 1e2 parses to 100, which is an integer and in range, so only the raw string
// can catch it. This is the check that would break if that guard were removed.
const e2 = submitFactorial("1e2");
check("Ch1 1e2 rejected, not read as 100",
  [e2.out, /Scientific notation/.test(e2.msg)], ["-", true]);

submitFactorial("99");
check("Ch1 recovers after an error", submitFactorial("5").out, "120");


/* --- Challenge 2: console logger ----------------------------------------- */

function submitLogger(raw, badInput = false) {
  logged.length = 0;
  els["logger-input"].value = raw;
  els["logger-input"].validity.badInput = badInput;
  els["logger-message"].textContent = "";
  els["logger-form"].handlers.submit({ preventDefault() {} });
  return {
    logged: logged.slice(),
    msg: els["logger-message"].textContent,
    out: els["logger-output"].textContent,
  };
}

/*
  Fewer validation cases here than in Challenge 1, and that is deliberate.

  Both panels call the same readNumber(), so the decimal, negative, non-numeric
  and scientific-notation checks are the same lines of code either way, and they
  are covered above. Repeating them here would re-run proven lines and make the
  count look bigger without making anything safer.

  What is tested here is what actually differs between the two panels: the 1 to
  100 bounds, and that nothing reaches the console when validation fails.
*/

// Transcribed by hand from the sample test case in the brief.
const BRIEF_15 = [
  1, 2, "SKIM", 4, "is a great place to work!!", "SKIM", 7, 8, "SKIM",
  "is a great place to work!!", 11, "SKIM", 13, 14,
  "SKIM is a great place to work!!",
];

check("Ch2 15 matches the brief exactly", submitLogger("15").logged, BRIEF_15);
check("Ch2 3", submitLogger("3").logged, [1, 2, "SKIM"]);
check("Ch2 5", submitLogger("5").logged,
  [1, 2, "SKIM", 4, "is a great place to work!!"]);
check("Ch2 1", submitLogger("1").logged, [1]);
check("Ch2 100 logs 100 lines", submitLogger("100").logged.length, 100);
check("Ch2 30 is the combined case",
  submitLogger("30").logged[29], "SKIM is a great place to work!!");

const over = submitLogger("101");
check("Ch2 101 logs nothing",
  [over.logged.length, /out of range/.test(over.msg)], [0, true]);
check("Ch2 blank logs nothing", submitLogger("").logged.length, 0);
check("Ch2 1 reads as singular",
  /Logged 1 line to the console/.test(submitLogger("1").out), true);
check("Ch2 2 reads as plural",
  /Logged 2 lines to the console/.test(submitLogger("2").out), true);


/* --- Stale output, in both directions ------------------------------------ */

// A good run followed by a rejected one: the old status must not survive.
submitLogger("90");
const stale = submitLogger("120");
check("Ch2 120 after 90 clears the status line", stale.out, IDLE_TEXT);
check("Ch2 120 after 90 shows the error", /out of range/.test(stale.msg), true);
check("Ch2 120 after 90 logs nothing", stale.logged.length, 0);

// And the reverse: a good run after a rejected one must clear the error.
submitLogger("120");
const recovered = submitLogger("15");
check("Ch2 valid after invalid clears the error", recovered.msg, "");
check("Ch2 valid after invalid writes the status",
  /Logged 15 lines/.test(recovered.out), true);

submitFactorial("8");
const staleF = submitFactorial("19");
check("Ch1 19 after 8 clears the result", staleF.out, "-");
check("Ch1 19 after 8 shows the error", /out of range/.test(staleF.msg), true);

submitFactorial("19");
const recoveredF = submitFactorial("6");
check("Ch1 valid after invalid clears the error", recoveredF.msg, "");
check("Ch1 valid after invalid shows the result", recoveredF.out, "720");

submitFactorial("8");
els["factorial-input"].handlers.input();
check("Ch1 editing clears the result", els["factorial-output"].textContent, "-");
submitLogger("15");
els["logger-input"].handlers.input();
check("Ch2 editing restores the idle text",
  els["logger-output"].textContent, IDLE_TEXT);


/* --- aria-invalid --------------------------------------------------------- */

submitFactorial("19");
check("Ch1 aria-invalid set on failure",
  els["factorial-input"].getAttribute("aria-invalid"), "true");
submitFactorial("4");
check("Ch1 aria-invalid removed on success",
  els["factorial-input"].getAttribute("aria-invalid"), null);
submitLogger("120");
check("Ch2 aria-invalid set on failure",
  els["logger-input"].getAttribute("aria-invalid"), "true");
submitLogger("15");
check("Ch2 aria-invalid removed on success",
  els["logger-input"].getAttribute("aria-invalid"), null);


/* --- No long dashes in anything the user reads ---------------------------- */

const screenText = [
  ...["", "0", "-3", "2.5", "1e2", "19", "120"].map((v) => submitFactorial(v).msg),
  ...["", "0", "-3", "2.5", "1e2", "101"].map((v) => submitLogger(v).msg),
  submitFactorial("", true).msg,
  submitFactorial("8").out,
  submitLogger("15").out,
  IDLE_TEXT,
];
check("no em or en dashes in any on-screen string",
  screenText.filter((t) => /[–—]/.test(t)), []);

// The same check against the markup, ignoring comments, which are not on screen.
const visibleHtml = indexHtml.replace(/<!--[\s\S]*?-->/g, "");
check("no em or en dashes in the visible markup",
  visibleHtml.split("\n").filter((l) => /&[mn]dash;|[–—]/.test(l)), []);


/* --- Click anywhere on a card to focus its input -------------------------- */

/*
  This behaviour is gated on the pointer type, and the sandbox above reports a
  coarse pointer, so no listener was attached there. These checks build their own
  sandbox per pointer type.
*/
function runWithPointer(pointerFine, selectionText) {
  const e = {};
  ELEMENT_IDS.forEach((id) => { e[id] = makeEl(); });
  e["logger-output"].textContent = IDLE_TEXT;

  // One card per input. The two panels are separate elements in the real DOM,
  // and sharing one stub would let the second panel's listener replace the
  // first's, which is a bug in the test rather than in the page.
  const cards = { "factorial-input": makeEl(), "logger-input": makeEl() };
  Object.keys(cards).forEach((id) => {
    e[id].focused = false;
    e[id].focus = function () { this.focused = true; };
    e[id].closest = () => cards[id];
  });

  vm.runInNewContext(code, {
    document: {
      getElementById: (id) => e[id],
      documentElement: { getAttribute: () => null, setAttribute: () => {} },
    },
    window: {
      matchMedia: (q) => ({ matches: q === "(pointer: fine)" ? pointerFine : false }),
      getSelection: () => ({ toString: () => selectionText }),
    },
    localStorage: { getItem: () => null, setItem: () => {} },
    console: { log: () => {} },
  });

  return { card: cards["factorial-input"], input: e["factorial-input"] };
}

// A click target that reports which ancestors it sits inside, the way closest()
// would in a real document.
const target = (...inside) => ({
  closest: (sel) => (inside.some((n) => sel.includes(n)) ? {} : null),
});

const fine = runWithPointer(true, "");
check("fine pointer attaches the card listener",
  typeof fine.card.handlers.click, "function");

fine.card.handlers.click({ target: target() });
check("click on the card body focuses the input", fine.input.focused, true);

fine.input.focused = false;
fine.card.handlers.click({ target: target(".result") });
check("click on the result leaves focus alone", fine.input.focused, false);

fine.card.handlers.click({ target: target("button") });
check("click on the button leaves focus alone", fine.input.focused, false);

const dragging = runWithPointer(true, "Challenge 1");
dragging.card.handlers.click({ target: target() });
check("click that ends a text selection leaves focus alone",
  dragging.input.focused, false);

const coarse = runWithPointer(false, "");
check("touch device attaches no card listener",
  coarse.card.handlers.click, undefined);

finish();
