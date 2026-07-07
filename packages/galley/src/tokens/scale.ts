/**
 * Type ramp, leading solve, and vertical rhythm.
 *
 * The ramp is a geometric sequence. Leading is the interesting part: it is a
 * function of size AND measure, because a long line needs more leading to keep
 * the eye's return sweep from landing on the wrong row, and a large size needs
 * less. The spec pins the band to [1.3, 1.75] for body and 1.15 for headings.
 */

import type { Axes, RampStep, Rhythm } from "./types.js";

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

/**
 * Vertical rhythm. The unit is 0.5lh; the scale climbs from a tight 0.5 to a
 * sectional 3. Because margins are expressed in `lh`, re-solving leading
 * re-derives every gap for free.
 */
export function buildRhythm(base: number, bodyLeading: number): Rhythm {
  return {
    unitLh: 0.5,
    scaleLh: [0.5, 0.75, 1, 1.5, 2, 3],
    rhythmPx: round(base * bodyLeading, 3),
  };
}

function round(x: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}
