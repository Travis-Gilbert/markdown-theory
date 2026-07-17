/**
 * Type ramp, leading solve, and vertical rhythm.
 *
 * The ramp is a geometric sequence. Leading is the interesting part: it is a
 * function of size AND measure, because a long line needs more leading to keep
 * the eye's return sweep from landing on the wrong row, and a large size needs
 * less. The spec pins the band to [1.3, 1.75] for body and 1.15 for headings.
 */

import type { Axes, HeadingRhythm, RampStep, Rhythm } from "./types.js";

/** Snap to the nearest quarter-pixel; sub-pixel type sizes render fuzzy. */
export function quarterPixel(px: number): number {
  return Math.round(px * 4) / 4;
}

const clamp = (x: number, lo: number, hi: number): number => (x < lo ? lo : x > hi ? hi : x);

/**
 * Solve body leading for a given size against the active measure.
 *
 * Monotonic in both inputs: wider measure raises leading, larger size lowers it.
 * Anchored so the default axes (base 17px, measure 68ch) land near 1.44, the
 * classic reading value.
 */
export function solveLeading(sizePx: number, measureCh: number): number {
  const measureFactor = clamp((measureCh - 45) / (75 - 45), 0, 1); // 0..1 over the ch band
  const sizeFactor = clamp((sizePx - 12) / (28 - 12), 0, 1); // 0..1 over a 12..28px band
  const lh = 1.32 + measureFactor * 0.28 - sizeFactor * 0.3;
  return round(clamp(lh, 1.3, 1.75), 4);
}

/** Build the -2..5 ramp, quarter-pixel snapped, each step carrying its leading. */
export function buildRamp(axes: Axes): RampStep[] {
  const steps: RampStep[] = [];
  for (let i = -2; i <= 5; i++) {
    const raw = axes.base * Math.pow(axes.ratio, i);
    const px = quarterPixel(raw);
    steps.push({
      step: i,
      px,
      rem: round(px / axes.base, 4),
      leading: solveLeading(px, axes.measure),
    });
  }
  return steps;
}

/** Heading leading is fixed and tight; text-box trimming reclaims the extra band. */
export const HEADING_LEADING = 1.15;

/** The flow gap (the owl) in lh: scaleLh[2], the space between plain siblings. */
const FLOW_LH = 1;
/** The sectional ceiling in lh: scaleLh[5], the largest gap the rhythm allows. */
const SECTION_MAX_LH = 3;

/**
 * Ratio-derived heading rhythm (M3, the pane-width reading pass).
 *
 * A heading owns its space above: the flow gap compounded by the type ratio one
 * step past the heading's own ramp step (h2 sits at ramp step 3, so its air is
 * ratio^4 flow gaps), clamped into [flow, sectional]. The gap below stays the
 * rhythm unit, so a heading binds to its first paragraph. A figure takes one
 * ratio step past the flow gap. Everything falls out of the same two numbers
 * the ramp already uses: the flow gap and the ratio.
 */
export function headingRhythm(ratio: number): HeadingRhythm {
  const above = (rampStep: number): number =>
    round(clampLh(FLOW_LH * Math.pow(ratio, rampStep + 1)), 2);
  return {
    aboveLh: { h2: above(3), h3: above(2), h4: above(1) },
    belowLh: 0.5,
    figureLh: round(clampLh(FLOW_LH * ratio), 2),
  };
}

const clampLh = (lh: number): number =>
  lh < FLOW_LH ? FLOW_LH : lh > SECTION_MAX_LH ? SECTION_MAX_LH : lh;

/**
 * Vertical rhythm. The unit is 0.5lh; the scale climbs from a tight 0.5 to a
 * sectional 3. Because margins are expressed in `lh`, re-solving leading
 * re-derives every gap for free. The heading block carries the ratio-derived
 * heading and figure air (see `headingRhythm`).
 */
export function buildRhythm(base: number, bodyLeading: number, ratio = 1.2): Rhythm {
  return {
    unitLh: 0.5,
    scaleLh: [0.5, 0.75, 1, 1.5, 2, 3],
    rhythmPx: round(base * bodyLeading, 3),
    heading: headingRhythm(ratio),
  };
}

function round(x: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}
