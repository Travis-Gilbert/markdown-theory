/**
 * OKLCH color ladders with a WCAG-AA contrast solver.
 *
 * The surface is one hue at fixed lightness steps (ground, surface +1, top +2).
 * The ink ladder is a warm near-neutral. Signal and link come from the axes.
 *
 * The solver is the point of the module: for each ink/accent role it searches
 * for the *quietest* lightness that still clears the role's contrast target
 * against every surface it might sit on. "Quietest" means closest to the
 * surface, so hierarchy (ink darkest, ink3 lightest) falls out of the target
 * ladder rather than being hand-tuned. If no lightness in the role's band
 * passes, the whole register is unsolvable and generation throws -- it never
 * ships a page that fails AA.
 */

import { inGamut, type Oklch, wcagContrast } from "./color.js";
import type { Axes, Mode } from "./types.js";

export interface Band {
  lo: number;
  hi: number;
}

/** Per-role contrast targets (WCAG ratio). Primary ink aims high; apparatus lower. */
export interface Targets {
  ink: number;
  ink2: number;
  ink3: number;
  signal: number;
  link: number;
}

export interface PaletteBands {
  ink: Band;
  accent: Band;
}

export const DEFAULT_TARGETS: Targets = {
  ink: 4.5, // hard AA floor for primary text (the gate); it aims far higher (see INK_AIM)
  ink2: 4.5, // AA normal, secondary body
  ink3: 3.0, // AA large / faint apparatus
  signal: 4.5,
  link: 4.5,
};

/**
 * Preferred primary-ink contrast: ink should be a *confident* off-black/off-white,
 * not the barely-passing minimum, so it aims high and only falls back to the floor
 * when a tight register cannot reach the aim. Dark registers have narrower bands,
 * so their aim is a touch lower.
 */
export function inkAim(mode: Mode): number {
  return mode === "dark" ? 8.5 : 10;
}

export function defaultBands(mode: Mode): PaletteBands {
  if (mode === "dark") {
    return { ink: { lo: 0.62, hi: 0.95 }, accent: { lo: 0.55, hi: 0.82 } };
  }
  // light and print share the off-black ink discipline (no harsh pure #000).
  return { ink: { lo: 0.18, hi: 0.56 }, accent: { lo: 0.38, hi: 0.64 } };
}

/** Lightness anchors for ground / surface / top, by mode. */
function surfaceLightness(mode: Mode): [number, number, number] {
  switch (mode) {
    case "dark":
      return [0.165, 0.2, 0.245];
    case "print":
      return [1.0, 0.997, 0.994];
    default:
      return [0.945, 0.967, 0.989];
  }
}

export interface SolvedPalette {
  ground: Oklch;
  surface: Oklch;
  top: Oklch;
  ink: Oklch;
  ink2: Oklch;
  ink3: Oklch;
  signal: Oklch;
  signalPressed: Oklch;
  link: Oklch;
  hairline: string;
  /** Pairings the solver produced, for the advisory report. */
  solved: Array<{ role: string; lightness: number | null; target: number }>;
}

/**
 * Search a role's lightness band for the quietest value clearing `target`
 * against all `surfaces`. Returns the lightness or null when nothing passes.
 */
export function solveLightness(
  surfaces: Oklch[],
  hue: number,
  chroma: number,
  target: number,
  mode: Mode,
  band: Band,
): number | null {
  const step = 0.0025;
  const candidates: number[] = [];
  for (let l = band.lo; l <= band.hi + 1e-9; l += step) {
    candidates.push(Math.round(l * 10000) / 10000);
  }
  // "Quietest" = nearest the surface: descend from the light end (light/print),
  // ascend from the dark end (dark mode).
  if (mode !== "dark") candidates.reverse();

  for (const l of candidates) {
    const color: Oklch = { l, c: chroma, h: hue };
    if (!inGamut(color)) continue;
    const worst = Math.min(...surfaces.map((s) => wcagContrast(color, s)));
    if (worst >= target) return l;
  }
  return null;
}

export function buildPalette(
  axes: Axes,
  targets: Targets = DEFAULT_TARGETS,
  bands: PaletteBands = defaultBands(axes.mode),
): SolvedPalette {
  const [groundL, surfaceL, topL] = surfaceLightness(axes.mode);
  const tint = axes.mode === "print" ? 0 : axes.chroma;

  const ground: Oklch = { l: groundL, c: tint, h: axes.hue };
  const surface: Oklch = { l: surfaceL, c: tint, h: axes.hue };
  const top: Oklch = { l: topL, c: tint, h: axes.hue };
  const surfaces = [ground, surface, top];

  // Ink is a warm near-neutral: it takes the surface hue but almost no chroma.
  const inkHue = axes.hue;
  const inkChroma = axes.mode === "print" ? 0 : 0.012;

  const passesAt = (l: number, target: number): boolean =>
    Math.min(...surfaces.map((s) => wcagContrast({ l, c: inkChroma, h: inkHue }, s))) >= target;

  // The ink ladder anchors its ends and interpolates the middle, so the three
  // inks are perceptually *spaced* rather than three minimum-solves that cluster
  // on a light surface. ink = confident dark (aims high, falls back to floor);
  // ink3 = the quietest legible tone (its AA-large floor); ink2 = the midpoint,
  // nudged darker until it clears its own AA floor.
  const inkL =
    solveLightness(surfaces, inkHue, inkChroma, inkAim(axes.mode), axes.mode, bands.ink) ??
    solveLightness(surfaces, inkHue, inkChroma, targets.ink, axes.mode, bands.ink);
  const ink3L = solveLightness(surfaces, inkHue, inkChroma, targets.ink3, axes.mode, bands.ink);

  let ink2L: number | null = null;
  if (inkL !== null && ink3L !== null) {
    let mid = (inkL + ink3L) / 2;
    const towardInk = inkL < mid ? -0.005 : 0.005; // step from the midpoint toward the dark anchor
    for (let guard = 0; guard < 400 && !passesAt(mid, targets.ink2); guard++) {
      mid += towardInk;
      if ((towardInk < 0 && mid <= inkL) || (towardInk > 0 && mid >= inkL)) {
        mid = inkL;
        break;
      }
    }
    ink2L = passesAt(mid, targets.ink2) ? mid : null;
  }
  const signalL = solveLightness(
    surfaces,
    axes.signalHue,
    axes.signalChroma,
    targets.signal,
    axes.mode,
    bands.accent,
  );
  const linkL = solveLightness(
    surfaces,
    axes.linkHue,
    axes.linkChroma,
    targets.link,
    axes.mode,
    bands.accent,
  );

  const solved: SolvedPalette["solved"] = [
    { role: "ink", lightness: inkL, target: targets.ink },
    { role: "ink2", lightness: ink2L, target: targets.ink2 },
    { role: "ink3", lightness: ink3L, target: targets.ink3 },
    { role: "signal", lightness: signalL, target: targets.signal },
    { role: "link", lightness: linkL, target: targets.link },
  ];

  // Provisional colors; unsolved roles fall back to the band extreme so the
  // caller can still read the report before deciding to throw.
  const extreme = axes.mode === "dark" ? bands.ink.hi : bands.ink.lo;
  const accentExtreme = axes.mode === "dark" ? bands.accent.hi : bands.accent.lo;

  const ink: Oklch = { l: inkL ?? extreme, c: inkChroma, h: inkHue };
  const ink2: Oklch = { l: ink2L ?? extreme, c: inkChroma, h: inkHue };
  const ink3: Oklch = { l: ink3L ?? extreme, c: inkChroma, h: inkHue };
  const signal: Oklch = {
    l: signalL ?? accentExtreme,
    c: axes.signalChroma,
    h: axes.signalHue,
  };
  const link: Oklch = { l: linkL ?? accentExtreme, c: axes.linkChroma, h: axes.linkHue };

  // Pressed signal: one step "into" the surface's opposite, gamut-guarded.
  const pressedL = axes.mode === "dark" ? signal.l + 0.06 : signal.l - 0.06;
  let signalPressed: Oklch = { l: clamp01(pressedL), c: axes.signalChroma, h: axes.signalHue };
  if (!inGamut(signalPressed)) {
    signalPressed = { ...signalPressed, c: axes.signalChroma * 0.85 };
  }

  const hairline =
    axes.mode === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(20, 20, 19, 0.10)";

  return {
    ground,
    surface,
    top,
    ink,
    ink2,
    ink3,
    signal,
    signalPressed,
    link,
    hairline,
    solved,
  };
}

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);
