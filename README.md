# SKIM Scripting Challenge

The three challenges from the SKIM scripting brief, built as one page in plain HTML, CSS
and JavaScript. No framework, no build step, no dependencies.

- **Challenge 1, Factorial.** A number from 1 to 18 goes in, the product of it and every
  whole number below it comes out. 4 gives 24, 8 gives 40320.
- **Challenge 2, Console logger.** Counts from 1 to the number given, logging `SKIM` for
  multiples of 3, `is a great place to work!!` for multiples of 5, and `SKIM is a great
  place to work!!` for multiples of both. Everything else logs the number itself.
- **Challenge 3, Responsive layout.** The two challenges sit side by side on wide screens
  and stack on narrow ones.

## Getting the code

Clone it:

```
git clone https://github.com/Pranav14777/skim-scripting-challenge.git
cd skim-scripting-challenge
```

Or, without git: on the GitHub page use the green **Code** button, choose **Download ZIP**,
and unzip it anywhere.

## How to run it

Double-click `index.html`, or drag it into a browser. That is the whole process.

To serve it over HTTP instead, either of these works from the project folder:

```
npx serve .
python -m http.server
```

Challenge 2 writes to the browser console, as the brief specifies. Open DevTools with
**F12** and choose the **Console** tab.

## How to run the checks

```
node tests/run.js
```

That runs all three suites and prints a line per check, ending in `All 3 suites passed.`
Node is needed for the checks only. The page itself has no build step and no dependencies.

Each suite also runs on its own, which is more useful when something fails:

```
node tests/behaviour.js
```

## Files

| File | Contents |
|---|---|
| `index.html` | Structure and content |
| `styles.css` | All styling, including both colour themes |
| `script.js` | All behaviour |
| `README.md` | This file |
| `tests/run.js` | Runs every suite below and reports one result |
| `tests/behaviour.js` | Drives `script.js` through a DOM stand-in |
| `tests/wiring.js` | Ids, classes and tokens line up across the three files |
| `tests/contrast.js` | WCAG AA contrast, computed from the CSS tokens |
| `tests/report.js` | Shared pass/fail reporting for the three suites |

## Key decisions

- **The 1 to 18 limit is about correctness, not taste.** JavaScript only promises that
  whole numbers are exact up to 9,007,199,254,740,991. 18! is 6,402,373,705,728,000,
  which is under that line. 19! is over it, so from there the language stops promising
  anything. A few results above 18 do still come out right, but that is luck rather than
  a guarantee, and nothing warns you either way. 18 is where the promise ends, which is
  what makes it a defensible limit. Above it the fix is `BigInt`, which has no ceiling,
  at the cost of a second numeric type to keep consistent everywhere a number is handled.
  Inside 1 to 18 that cost buys nothing, so the page uses ordinary numbers.

- **Challenge 2 is capped at 1 to 100, for a different reason.** The brief sets no range
  here. Each step of the loop writes a console line, so the limit is about how much output
  is produced, not about numeric precision. 100 is well past the sample of 15, runs
  instantly and leaves the console readable, while an uncapped input lets a typo like
  `10000000` freeze the tab. Two panels, two limits, two unrelated reasons.

- **One validation function serves both panels.** `readNumber(input, min, max)` returns
  either `{ ok: true, value }` or `{ ok: false, message }`, and builds its wording from
  the limits it is given. Blank, non-numeric, scientific notation, decimal, zero, negative
  and out-of-range each get their own message.

- **The multiple-of-both case is tested first in Challenge 2.** Testing `% 3` first would
  swallow 15, 30 and 45, which is the one mistake that makes the brief's own sample output
  wrong.

- **Every submit clears the panel's outputs before validating anything.** Without that, an
  error can appear beside a result left over from a previous run, with the two halves of
  the card disagreeing.

- **One breakpoint, at 768px.** The single-column stack is the default, so narrow screens
  need no override at all and the breakpoint only switches the two-up on. 768px is the
  conventional tablet-portrait boundary rather than a number worked out from this content,
  though it was checked against it: narrowing the viewport, that is where two columns stop
  having enough room, so the convention and the content agree here. With two cards there
  is exactly one point where the layout needs to change, and a breakpoint is only worth
  having where something actually changes.

- **Clicking anywhere on a card focuses its input, on mouse and trackpad only.** Each card
  gets its own click listener, so the whole card is the target rather than just the one
  line of label text. Clicks on the result block and the button are ignored, since both
  have their own job. It is switched off on touch screens, where focusing a field raises
  the keyboard over half the display and a stray tap while scrolling would do that
  unasked. The test is `(pointer: fine)` in `script.js`, which asks whether the main
  pointing device is a precise one.

- **The theme follows the operating system until the user overrides it.** The toggle beats
  the system setting, and the choice is saved in `localStorage`.

---

# Detailed reasoning

## Validation

**The forms carry `novalidate`.** Left alone, the browser shows its own error bubble and
the submit handler never runs, so none of the messages below would ever be seen.
`novalidate` turns the bubble off without disabling the constraint API, so
`input.validity` is still readable from JavaScript.

**The inputs carry `min`, `max` and `step`, and the range is also enforced in
JavaScript.** The attributes are mainly there for assistive technology. A number input is
a spinbutton, so `min` and `max` are read out as the permitted range, which the visible
label alone does not do. They also record the rule in the markup. `readNumber` is what
actually rejects a value and writes the message, so the two can never disagree.

The attributes have nothing to do with the stepper arrows. Those come from
`type="number"` itself and are hidden in the CSS. Keeping the number type matters for the
numeric keypad on mobile and for the `validity` object, which is what makes the next point
possible.

**Non-numeric input is checked before blank input.** A number field hands back an empty
string for text it cannot parse, so typing `abc` and typing nothing both leave
`input.value` empty. `validity.badInput` is the only thing that separates them. Without
it, "that isn't a number" and "you didn't enter anything" would be the same message.

**Scientific notation is checked on the raw text, before `Number()` runs.** `1e2` is a
valid floating-point number as far as the HTML specification is concerned, so the field
keeps it and `Number("1e2")` returns `100`: a whole number, inside the range, and not what
anyone typed. The only way to catch it is to look at the characters rather than the
converted value. A lone `e` is not valid, so the field blanks it and the `badInput` check
picks it up instead.

**Zero and negatives get their own messages** rather than a shared "out of range". A
general message is not much help when the real mistake is a stray minus sign.

**The spinner arrows are hidden.** They are the browser's default control for stepping the
value, and they pushed the centred number off to one side. Nothing is lost: the numeric
keypad and the validity object come from the input type, not from the arrows, and Up and
Down still step the value from the keyboard. It takes two declarations because browsers
expose the control differently, Firefox through `appearance` and Chrome and Safari through
`::-webkit-inner-spin-button`.

## Challenge 1

The factorial is a plain loop rather than recursion. It reads more simply and it cannot
run out of stack. The loop starts at 2, because multiplying by 1 changes nothing.

**Why not `BigInt`.** It would be the right tool for an open-ended range, since it is
exact at any size and has no safe-integer limit at all. Three reasons it is not used here.
The brief fixes the range at 1 to 18, so the problem it solves does not arise. `BigInt`
will not mix with ordinary numbers in arithmetic, so the type would have to be carried
through everywhere the value goes. And it would not remove the need for a ceiling, only
the reason behind the one we have: something would still have to stop a huge input hanging
the tab, and that number would be chosen by feel rather than by where exactness ends.

## Challenge 2

The condition is written `i % 3 === 0 && i % 5 === 0` rather than `i % 15 === 0`, because
it states the same rule the brief states.

Nothing is logged when the input is invalid. A half-written sequence in the console is
more confusing than no sequence at all.

## Error states

**Every submit starts by wiping the panel's outputs.** Each panel has a `resetOutputs()`
that clears the message, resets the result and removes `aria-invalid`, and it runs before
validation. Clearing only on the path that happens to need it is how a panel ends up
showing an out-of-range error next to a leftover "Logged 90 lines to the console" from an
earlier run. Resetting first rules out the whole class of problem instead of fixing it one
case at a time. Editing the field runs the same reset, since a result that no longer
matches what the field says is as misleading as a stale error.

**Red is used for errors and nothing else.** Red text and a 4px red rule down the left
edge, with no box and no fill. An earlier version had a tinted background and a full
border, but the card is already a box, and nesting another one inside it made the error
look like a panel rather than a remark about the field above it. The rule stays because
colour on its own is not enough: anyone who cannot pick the red out of the surrounding
text still sees a marked line. Dropping the tint also raised the text contrast, since the
card surface is a lighter background than the tint was.

**The message sits in the same 16rem column as the input and button,** so the left edge of
the red rule lines up with the left edge of the field it is talking about. Left to
stretch, it ran the full width of the card and overhung the controls above it.

**The space for the message is always reserved.** `.message` has a `min-height` of 5rem
whether or not it holds anything, so the card does not jump as an error appears or clears.
5rem covers three lines plus the padding: inside a 16rem column the longest messages wrap
to two lines, but only just, and a slightly wider font would tip them onto a third. A
single-line message is centred in that space rather than sitting at the top.

**`aria-invalid` goes on the input, not just on the message,** and is removed once
validation passes. The same attribute drives the field's red border through
`.field__input[aria-invalid="true"]`, so what announces the problem to assistive
technology is also what shows it on screen, with no separate CSS class to keep in step.
The message container has `role="alert"`, so it is read out as soon as it is filled.

## Layout

**Grid outside, flexbox inside.** Grid handles the two-up in two lines of CSS. Flexbox
handles the vertical stack of label, input, button and result inside each card.

**Mobile-first, so the one media query only adds things.** The single-column stack is the
default and the breakpoint at 768px switches the two-up on. Nothing has to be undone for
small screens.

**The cards are the separation the bonus asks for:** surface colour, a 1px border, rounded
corners, a soft shadow, and the grid gap between them.

**The content is anchored to the top.** An earlier version centred it vertically, which
split the spare height above and below and pushed everything too far down. Ordinary block
flow does what is wanted, with no alignment property to reason about and no way for the
top of the page to end up out of reach on a short screen.

Above the header is a deliberate gap, `padding-top: clamp(1.5rem, 8vw, 3.5rem)`. That
works out at 56px on anything wider than about 700px and 29px at 360px. Those two figures
come straight from the clamp, so they are exact. Where that leaves the bottom of the first
card depends on how text actually renders, so it is checked in a browser rather than
claimed here.

Because the desktop figure comes from the clamp's upper limit and the phone figure from
its `8vw` term, the two can be adjusted independently.

`min-height` is given as `100vh` and then `100dvh`, so browsers without `dvh` still get a
usable value and newer ones get the height excluding mobile browser chrome. It is there so
the background covers the viewport when the content is short, not to position anything.

**The page title uses `clamp(1.5rem, 1.15rem + 1.2vw, 1.75rem)`,** which is 24px on a
phone reaching 28px at about 1030px wide. Big enough to read as the page heading against
the 18px card titles without competing with them.

**Clicking a card focuses its input.** The `<label>` already does this for its own text;
this extends it to the rest of the card. Each input finds its own card with
`input.closest(".card")` at startup and attaches one listener there, so there are two
listeners, one per panel.

Inside the handler, `event.target.closest(".result, button")` skips clicks that landed in
the result block or on the button. `closest` is used rather than a direct comparison
because you rarely click the element you mean: click the number inside the result and the
target is the `<output>`, not the `.result` around it. A click that ends a text selection
is skipped too, since focusing an input would wipe the selection.

The whole thing is behind `window.matchMedia("(pointer: fine)")`, checked once at startup,
so on a touch device no listener is attached at all. Because the input is focused from
script rather than by a direct click on it, its focus ring uses `:focus` rather than
`:focus-visible`.

## Styling and theming

**One accent colour, `#1f7a8c`, on buttons and focus rings only.** Everything else is
neutral grey. A single accent used sparingly keeps attention on the two things the user is
meant to click.

**A lighter teal, `#4db6c9`, in dark mode.** `#1f7a8c` is too dark to read against a dark
surface, so one value for both themes would have failed contrast in one of them.

**Three steps of neutral, not two.** The page sits behind the cards, the cards sit on top
of it, and the result block is recessed back into the card with `--inset`. An earlier
version had a near-white page behind white cards, which left the cards almost nothing to
stand out against and made the 1px border do all the work. Widening the gap between page
and card took the separation from 1.09:1 to 1.18:1. That is not a WCAG number, but it is
the one being tuned.

The greys carry a slight blue cast so they sit with the teal. Pure neutral grey next to a
teal accent reads as faintly warm by comparison.

**Dark mode is declared twice.** The `prefers-color-scheme` media query handles a dark
operating system. The `:root:not([data-theme="light"])` guard inside it is what lets the
toggle win: someone on a dark system who picks light mode sets `data-theme="light"` and is
excluded from the block. A second rule, `:root[data-theme="dark"]`, covers a light system
with dark mode chosen. Without the guard the system setting would always override the
user's explicit choice.

**One small inline script sits in `<head>`.** It applies the saved theme before the page
paints. `script.js` is deferred until after parsing, which is too late to choose a colour
scheme, so without it a dark-mode user sees a white flash on every load. It is the only
JavaScript outside `script.js`.

**Every `localStorage` call is wrapped in `try`/`catch`.** It throws in private windows and
when site data is blocked, and a theme toggle should not be able to take the page down
with it.

**`rem` for spacing and type, `px` only for borders,** so the layout scales with the
reader's own font-size setting.

## Accessibility

Labels are tied to inputs with `for` and `id`, and state the accepted range in words.
Error messages sit in a `role="alert"` region and results in an `aria-live="polite"` one,
so both are read out without the user hunting for them. Every interactive element has a
visible focus ring, and inputs and buttons are at least 44px tall.

Clicking anywhere on a card focuses its input, which makes the target far bigger than the
label alone. That is for mouse and trackpad only, for the reason given under Layout.

## Contrast

Checked against WCAG AA: 4.5:1 for normal text, 3:1 for interface elements such as focus
rings. The ratios are computed from the token values in `styles.css` rather than measured
by eye, so they cannot drift from the colours the page actually uses. All 22 pairs pass
and most clear AAA.

| Pair | Light | Dark | Needs |
|---|---|---|---|
| Body text on page background | 13.59:1 | 15.58:1 | 4.5 |
| Body text on card surface | 16.04:1 | 14.78:1 | 4.5 |
| Body text on inset block | 14.64:1 | 15.58:1 | 4.5 |
| Muted text (labels) on card | 6.08:1 | 7.64:1 | 4.5 |
| Muted text on inset block | 5.55:1 | 8.05:1 | 4.5 |
| Button label on accent | 4.98:1 | 7.92:1 | 4.5 |
| Button label on accent hover | 7.14:1 | 9.77:1 | 4.5 |
| Accent focus ring on card | 4.98:1 | 7.52:1 | 3.0 |
| Error text on card surface | 8.15:1 | 9.05:1 | 4.5 |
| Error rule on card surface | 5.44:1 | 5.55:1 | 3.0 |
| Invalid input border on card | 5.44:1 | 5.55:1 | 3.0 |

Token values: accent `#1f7a8c` light and `#4db6c9` dark, with hover states `#19606e` and
`#6ec8d8`; error text `#9b1c1c` and `#f5a3a3`; error border `#c0392b` and `#e06c6c`. One
accent value per theme covers button fill, button label and focus ring, so no separate
text-safe variant is needed. The same check confirms the two dark blocks hold identical
values, since a drift between them would make the toggle and the system preference render
differently.

The hover state is a real token rather than a `brightness()` filter. A filter lightens the
button, which is the wrong direction for a light theme, and the colour it produces exists
nowhere in the file, so its contrast cannot be checked. Both hover states are in the table
above.

## The mobile layout

The mobile layout follows SKIM's own principle that an exercise should fit on one screen,
since scrolling to find the submit button is friction that costs completions.

At 375px wide the page as a whole scrolls, because two stacked cards are taller than the
viewport. Neither card scrolls on its own, which is the part that matters: the submit
button is never below the fold of the card it belongs to.

The card was laid out to a height budget. These are the targets it was designed against,
added up from the values in the stylesheet, not a measurement of the rendered page:

| Part | Height |
|---|---|
| Card padding, top and bottom | 40px |
| Heading | 23px |
| Label | 21px |
| Input | 44px |
| Button | 44px |
| Message area, reserved whether or not it is filled | 80px |
| Result block | 76px |
| Gaps between them | 60px |
| **Total** | **~388px against a 667px viewport** |

Most of those come straight from the CSS. The result block is the one that depends on how
the status line wraps, so the total is a close estimate rather than a measured height, and
the browser check below is what actually confirms it.

The reserved message area is the one deliberate piece of unused space. It costs 80px that
is usually empty and buys a card that does not move under the cursor on submit.

Both cards carry a heading, one label, one input, one button and one result block, and
nothing else. An earlier version put a line of explanatory text under each heading. It was
cut because the label already said what to type.

One caveat: this is the card at rest. Focusing an input raises the on-screen keyboard and
roughly halves the available height, which no layout survives without scrolling. Avoiding
that would mean tap targets below 44px, which is the worse trade.

---

## Testing

`node tests/run.js` runs three suites, **83 assertions in total**, all passing.

| Suite | Assertions | What it checks |
|---|---|---|
| `behaviour.js` | 46 | Both challenges, every validation case, stale output, `aria-invalid`, click-to-focus |
| `wiring.js` | 14 | Cross-file references resolve, no dead CSS, requirements from the brief are present |
| `contrast.js` | 23 | Every colour pair against WCAG AA, in both themes |

Every one of these asserts something that is true or false in the files themselves: a
returned value, a reference that does or does not resolve, a contrast ratio computed from
the declared colours. None of them estimate.

An earlier version included a fourth suite that worked out where cards land on screen by
estimating rendered text heights. It was cut. Because the numbers were approximations, it
could have reported `PASS` on a page that was visibly broken, or `FAIL` on one that was
fine, in exactly the same confident format as a real assertion. That is the same failure
the 18 limit exists to avoid: an answer that looks right, isn't, and does not announce
itself. Anything that needs a browser to judge is in the manual list below, where its
status is honest.

Nothing in JavaScript checks itself, so these are ordinary scripts that call the code with
known inputs and compare the result. They load the real `script.js` rather than a copy of
its logic: there is no browser in Node, so `behaviour.js` builds a small stand-in for the
few DOM objects the file touches, then drives the forms by calling the submit handlers
`script.js` registered. If `script.js` breaks, these break with it.

The table below lists the 34 scenarios behind `behaviour.js`. Some carry more than one
assertion, either because they check a message and an output together or because they
apply to both panels, which is why the two counts differ.

Challenge 2 has fewer validation scenarios than Challenge 1, deliberately. Both panels call
the same `readNumber()`, so the decimal, negative and non-numeric checks are the same lines
of code either way. What is checked on Challenge 2 is what actually differs: its 1 to 100
limits, and that nothing reaches the console when validation fails. The same note appears
in the test file.

Scenario 12 is compared item by item against the sample output printed in the brief.

| # | Panel | Input | Expected |
|---|---|---|---|
| 1 | Challenge 1 | `4` | `24`, the brief's sample |
| 2 | Challenge 1 | `8` | `40320`, the brief's sample |
| 3 | Challenge 1 | `1` | `1`, lower bound |
| 4 | Challenge 1 | `18` | `6402373705728000`, upper bound, exact |
| 5 | Challenge 1 | `19` | out-of-range message, result cleared |
| 6 | Challenge 1 | `0` | "0 is below the minimum" |
| 7 | Challenge 1 | `-3` | "negative numbers aren't accepted" |
| 8 | Challenge 1 | `2.5` | "whole numbers only" |
| 9 | Challenge 1 | `abc` | "that isn't a number" |
| 10 | Challenge 1 | `1e2` | "scientific notation isn't accepted", not `100` |
| 11 | Challenge 1 | blank | "enter a number between 1 and 18" |
| 12 | Challenge 2 | `15` | the brief's exact 15-line console sequence |
| 13 | Challenge 2 | `3` | `1`, `2`, `SKIM` |
| 14 | Challenge 2 | `5` | `1`, `2`, `SKIM`, `4`, `is a great place to work!!` |
| 15 | Challenge 2 | `1` | one line, and singular wording in the status |
| 16 | Challenge 2 | `30` | line 30 is the combined message |
| 17 | Challenge 2 | `100` | upper bound, exactly 100 lines |
| 18 | Challenge 2 | `101` | out-of-range message, nothing logged |
| 19 | Challenge 2 | blank | message shown, nothing logged |
| 20 | Both | invalid, then valid | the error clears when the field is edited |
| 21 | Challenge 2 | `90`, then `120` | status line resets, no leftover "Logged 90 lines" |
| 22 | Challenge 2 | `120`, then `15` | error clears, new status written |
| 23 | Challenge 1 | `8`, then `19` | result resets to `-`, no stale `40320` |
| 24 | Challenge 1 | `19`, then `6` | error clears, `720` shown |
| 25 | Both | run, then edit the field | result and status reset on the first keystroke |
| 26 | Both | invalid input | `aria-invalid="true"` set on the input |
| 27 | Both | valid input after invalid | `aria-invalid` removed again |
| 28 | Both | every message and label | no em or en dash in any on-screen string |
| 29 | Both | mouse or trackpad | the card gets a click listener |
| 30 | Both | click on the card body | the input is focused |
| 31 | Both | click on the result block | focus is left alone |
| 32 | Both | click on the submit button | focus is left alone |
| 33 | Both | click that ends a text selection | focus is left alone |
| 34 | Both | touch device | no click listener is attached at all |

`wiring.js` covers the references the browser never checks for you: every id `script.js`
looks up exists in the HTML, every class the HTML uses is defined in the CSS, every `for`
and `aria-labelledby` points at a real element, and every custom property is both declared
and used. It also checks the reverse direction, a CSS rule for something the markup no
longer contains, which is how a rule for a deleted footer survived unnoticed once.

### Checks that need a browser

These are visual, or depend on how text actually renders, so none of them can be asserted
by a script. They are run by hand against any change:

1. At 375x667 and 360x800 in the DevTools device toolbar, each card is fully visible from
   its heading to its result without scrolling within the card, and no width produces a
   horizontal scrollbar. This is the check that replaced a calculated one: where a card
   ends depends on how text renders, which only a browser can answer.
2. Dragging the window from wide to narrow collapses the two-up into a stack at 768px.
   Check both sides of the boundary: at 767px the cards should stack cleanly, and at 769px
   each column should still be wide enough that nothing wraps awkwardly.
3. Clicking a card's padding, away from any control, focuses that card's input on a
   desktop, and does nothing on a touch device.
4. Dark mode three ways: system dark via *Emulate CSS prefers-color-scheme*; the toggle
   overriding the system setting in both directions; a reload confirming the choice
   persisted. Then clear site data and confirm the page still renders.
5. Keyboard only: Tab reaches every control with a visible focus ring, and Enter submits
   each form.
6. The console is free of errors on load and after every interaction.

## Scope

No framework, build tooling or dependencies, as the brief asks: `index.html` opens
straight from disk. Node is used only to run the checks in `tests/`, which are plain
scripts with no test framework behind them.

No `BigInt` and no support above 18, for the reason given under Key decisions. No SKIM
logo or branding asset is reproduced; the accent colour alone carries the visual nod.
