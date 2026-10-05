/* ==========================================================================
   SKIM Scripting Challenge — behaviour

   Loaded with `defer`, so the whole document is parsed before any of this runs
   and the elements below are guaranteed to exist.

   Sections:
     1. Constants
     2. Shared helpers
     3. Challenge 1 — factorial
     4. Challenge 2 — console logger
     5. Theme toggle
     6. Start everything
   ========================================================================== */

"use strict";


/* 1. Constants
   -------------------------------------------------------------------------- */

const FACTORIAL_MIN = 1;
const FACTORIAL_MAX = 18;

const LOGGER_MIN = 1;
const LOGGER_MAX = 100;

const THEME_STORAGE_KEY = "skim-theme";
const EMPTY_RESULT = "-"; // placeholder shown before anything is calculated


/* 2. Shared helpers */

function readNumber(input, min, max) {
  const range = "between " + min + " and " + max;
  const raw = input.value.trim();

  if (input.validity.badInput) {
    return { ok: false, message: "That isn't a number. Enter a whole number " + range + "." };
  }

  if (raw === "") {
    return { ok: false, message: "Enter a number " + range + "." };
  }

  
  if (/[eE]/.test(raw)) {
    return { ok: false, message: "Scientific notation isn't accepted - enter a plain whole number." };
  }

  const value = Number(raw);

  if (!Number.isInteger(value)) {
    return { ok: false, message: "Whole numbers only - no decimals." };
  }

  // Zero and negatives are both out of range, but each gets its own wording:
  // a generic "out of range" is unhelpful when the mistake is a stray minus sign.
  if (value === 0) {
    return { ok: false, message: "0 is below the minimum - enter a number " + range + "." };
  }

  if (value < 0) {
    return { ok: false, message: "Negative numbers aren't accepted - enter a number " + range + "." };
  }

  if (value < min || value > max) {
    return { ok: false, message: value + " is out of range - enter a number " + range + "." };
  }

  return { ok: true, value: value };
}


function focusInputOnCardClick(input) {
  if (!window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  const card = input.closest(".card");

  card.addEventListener("click", function (event) {
    if (event.target.closest(".result, button")) {
      return;
    }

    // Focusing an input collapses whatever is selected, so a click that ends a
    // drag across the heading is ignored rather than wiping the selection.
    if (window.getSelection().toString() !== "") {
      return;
    }

    input.focus();
  });
}


/* 3. Challenge 1 — factorial
   -------------------------------------------------------------------------- */

function factorial(n) {
  let result = 1;

  for (let i = 2; i <= n; i += 1) {
    result *= i;
  }

  return result;
}

function setUpFactorialCard() {
  const form = document.getElementById("factorial-form");
  const input = document.getElementById("factorial-input");
  const message = document.getElementById("factorial-message");
  const output = document.getElementById("factorial-output");

  
  function resetOutputs() {
    message.textContent = "";
    output.textContent = EMPTY_RESULT;
    input.removeAttribute("aria-invalid");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault(); // stop the browser reloading the page; we render the answer ourselves
    resetOutputs();

    const reading = readNumber(input, FACTORIAL_MIN, FACTORIAL_MAX);

    if (!reading.ok) {
      message.textContent = reading.message;
      input.setAttribute("aria-invalid", "true"); // tells assistive tech the field itself is the problem
      return;
    }

    output.textContent = factorial(reading.value);
  });

  // Editing the field invalidates whatever is on screen: the old error no longer
  // applies, and the old answer no longer belongs to what the field now says.
  input.addEventListener("input", resetOutputs);

  focusInputOnCardClick(input);
}


/* 4. Challenge 2 — console logger
   -------------------------------------------------------------------------- */


function logSkimSequence(limit) {
  for (let i = 1; i <= limit; i += 1) {
    if (i % 3 === 0 && i % 5 === 0) {
      console.log("SKIM is a great place to work!!");
    } else if (i % 3 === 0) {
      console.log("SKIM");
    } else if (i % 5 === 0) {
      console.log("is a great place to work!!");
    } else {
      console.log(i);
    }
  }
}

function setUpLoggerCard() {
  const form = document.getElementById("logger-form");
  const input = document.getElementById("logger-input");
  const message = document.getElementById("logger-message");
  const output = document.getElementById("logger-output");

  const idleText = output.textContent.trim();

  function resetOutputs() {
    message.textContent = "";
    output.textContent = idleText;
    input.removeAttribute("aria-invalid");
  }

  form.addEventListener("submit", function (event) {
    event.preventDefault();
    resetOutputs();

    const reading = readNumber(input, LOGGER_MIN, LOGGER_MAX);

    if (!reading.ok) {
      message.textContent = reading.message;
      input.setAttribute("aria-invalid", "true");
      // Nothing is logged on a bad input: a half-written sequence in the console
      // would be more confusing than none at all.
      return;
    }

    logSkimSequence(reading.value);

    // The output of this challenge is the console, as specified. This line is on
    // the page only so nobody thinks the button did nothing.
    const lineWord = reading.value === 1 ? "line" : "lines";
    output.textContent =
      "Logged " + reading.value + " " + lineWord + " to the console - " +
      "press F12 and choose the Console tab to see them.";
  });

  input.addEventListener("input", resetOutputs);

  focusInputOnCardClick(input);
}


/* 5. Theme toggle
   -------------------------------------------------------------------------- */

function setUpThemeToggle() {
  const toggle = document.getElementById("theme-toggle");
  const root = document.documentElement;

  function currentTheme() {
    const chosen = root.getAttribute("data-theme");
    if (chosen) {
      return chosen;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  // The button is labelled with what it will do, not with the current state.
  function updateLabel() {
    toggle.textContent = currentTheme() === "dark" ? "Light mode" : "Dark mode";
  }

  toggle.addEventListener("click", function () {
    const next = currentTheme() === "dark" ? "light" : "dark";

    root.setAttribute("data-theme", next);
    updateLabel();

    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch (error) {
    }
  });

  updateLabel();
}


/* 6. Start everything
   -------------------------------------------------------------------------- */

setUpFactorialCard();
setUpLoggerCard();
setUpThemeToggle();
