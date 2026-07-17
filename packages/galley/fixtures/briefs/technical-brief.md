---
title: Reading pane typography, measured
byline: The Console Review
date: 2026-07-17
gist:
  A long technical brief for the pane-width reading case, exercising heading rhythm, lists after
  headings, figures, code, and tables.
---

A console reading pane sits between a chat column and a terminal, and its typography has to survive
both neighbours. This brief is the M3 acceptance fixture: every heading below owns its space above,
binds to its first paragraph below, and the list and figure spacing rides the same ratio-derived
scale step. Nothing here is styled by the host; the register computes all of it.

The measure in an application host runs sixty to ninety characters. That is wider than a phone and
narrower than a print page, which is exactly the band where a dead owl or a flush heading is most
visible: the eye has room to see the rhythm, and any collapsed gap reads as a defect rather than a
quirk.

## Why this composes

- The owl spaces every flow sibling, because the per-element resets are wrapped in a
  zero-specificity `:where()` and can never out-specify it again.
- A heading's air above is the flow gap compounded by the type ratio one step past its own ramp
  step, so display spacing rides the same axis as the type.
- The binding gap below a heading is the rhythm unit, small enough that the heading visibly belongs
  to its section and large enough to clear descenders.

The list above opens the section directly after the heading: the exact case the console diagnosed
live, where the descender of a trimmed heading painted through the first line of the list that
followed it.

## The engine, restated

The proportion engine derives every token from a handful of axes. The type ramp is a geometric
sequence; leading is a function of size and measure; the palette is solved in OKLCH and gated in
sRGB. Inline references like `generateRegister(axes)` read as highlighted text, not chips, and code
blocks keep their own leading:

```ts
import { consoleDark } from "@travis-gilbert/markdown-theory/tokens";

const register = consoleDark();
console.log(register.rhythm.heading);
// { aboveLh: { h2: 2.07, h3: 1.73, h4: 1.44 }, belowLh: 0.5, figureLh: 1.2 }
```

### What the ramp spends

Each heading level owns proportionally less air as it descends, and the ratio that widens the type
widens the air with it. A golden-section register earns a full sectional gap above its h2; a minor
third earns a touch more than two flow gaps. Neither is configured; both fall out of the same axis.

### What the binding keeps

A heading that floats equidistant between two sections belongs to neither. The binding keeps the gap
below at the rhythm unit, so the heading reads as a label for what follows, not a divider between
strangers.

## Typography under load

The pane case carries real apparatus: tables that must scroll rather than push the column, figures
that own their vertical air, and footnotes that stay quiet.

| Token                      | Derivation                     | Default |
| -------------------------- | ------------------------------ | ------: |
| `--gy-space-flow`          | the owl step                   |     1lh |
| `--gy-space-above-h2`      | flow times ratio to the fourth |  2.07lh |
| `--gy-space-above-h3`      | flow times ratio cubed         |  1.73lh |
| `--gy-space-above-h4`      | flow times ratio squared       |  1.44lh |
| `--gy-space-below-heading` | the rhythm unit                |   0.5lh |
| `--gy-space-figure`        | flow times ratio               |   1.2lh |

::figure{src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MDAgMTIwIj48cmVjdCB3aWR0aD0iNDAwIiBoZWlnaHQ9IjEyMCIgZmlsbD0iIzMzMzY0MCIvPjxsaW5lIHgxPSIyMCIgeTE9IjMwIiB4Mj0iMzgwIiB5Mj0iMzAiIHN0cm9rZT0iIzhhOGZhMCIvPjxsaW5lIHgxPSIyMCIgeTE9IjYwIiB4Mj0iMzgwIiB5Mj0iNjAiIHN0cm9rZT0iIzhhOGZhMCIvPjxsaW5lIHgxPSIyMCIgeTE9IjkwIiB4Mj0iMzIwIiB5Mj0iOTAiIHN0cm9rZT0iIzhhOGZhMCIvPjwvc3ZnPg==" caption="A figure owns its air: one ratio step past the flow gap, on the same scale the headings ride."}

## Why the pane is the hard case

At paragraph width the rhythm is a texture; at pane width it is a grid. Sixty to ninety characters
gives the eye a full return sweep, and every gap on the page gets compared against every other gap.
The heading rhythm has to be derived, because a hand-tuned pixel value that looks settled at one
measure reads orphaned at another.

1. Render this brief at 640 pixels and the h2 air reads sectional.
2. Render it at 1040 pixels and the same tokens still hold, because the gaps are expressed in `lh`
   and the leading re-solves with the measure.
3. Change the ratio axis and the whole hierarchy re-derives; nothing is pinned.

## What the host still owns

The bare mount cedes the page: max width, column measure, padding, and the ground are all the
host's. The register still owns everything inside the column, which is what keeps a console pane, a
docs site, and a print export reading as the same publication.

The last word belongs to the gate: a computed margin, measured in a real browser, on every fixture
in this corpus, on every push.
