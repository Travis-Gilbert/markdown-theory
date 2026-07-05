/**
 * Page shape.
 *
 * The Van de Graaf canon places the text block with margins in a 2:3:4:6 ratio
 * (inner : top : outer : bottom), which is why old books feel settled. On a
 * screen there is no spine and no facing page, so we keep the *proportions* but
 * lift the block optically high: the eye reads a screen from a bit above center,
 * and a page pinned to true-center reads as sagging.
 */

import type { Axes, PageShape } from "./types.js";

/**
 * Derive page margins as fractions of viewport width.
 *
 * We keep the canon's ratio family (2:3:4:6) but compress the top so content
 * sits high, and let reference density pull the margins in for a denser page.
 */
export function buildPage(axes: Axes): PageShape {
  const measureCh = clamp(axes.measure, 45, 75);

  // Van de Graaf units, screen-adapted: top compressed relative to bottom.
  const inner = 2;
  const top = axes.density === "reference" ? 2.4 : 3; // reference reads denser
  const outer = 4;
  const bottom = 6;
  const total = inner + top + outer + bottom;

  return {
    measureCh,
    marginTop: round(top / total, 4),
    marginBottom: round(bottom / total, 4),
    marginInner: round(inner / total, 4),
    marginOuter: round(outer / total, 4),
  };
}

const clamp = (x: number, lo: number, hi: number): number =>
  x < lo ? lo : x > hi ? hi : x;

function round(x: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}
