/**
 * Detailing defaults baked into the emitted properties.
 *
 * These are the small typographic truths the spec asks the engine to carry so
 * components never have to remember them: optical sizing on, oldstyle figures
 * in prose and tabular in tables, pretty body wrapping, balanced short
 * headings, hanging punctuation, and hyphenation only when the measure is
 * narrow enough to need it.
 */

import type { Axes, Detailing } from "./types.js";

export function buildDetailing(axes: Axes): Detailing {
  // Hyphenate when lines are short enough that rags get ugly, per the spec.
  const narrow = axes.measure <= 55;

  return {
    // Prose wants oldstyle numerals so digits sit in the text like lowercase.
    featProse: "'kern' 1, 'liga' 1, 'calt' 1, 'onum' 1",
    featUi: "'kern' 1, 'liga' 1, 'calt' 1",
    // Tables want lining tabular figures so columns align.
    featTabular: "'kern' 1, 'tnum' 1, 'lnum' 1",
    textWrapBody: "pretty",
    textWrapHeading: "balance",
    hangingPunctuation: "first last",
    hyphens: narrow ? "auto" : "manual",
    opticalSizing: "auto",
  };
}
