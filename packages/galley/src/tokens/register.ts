/**
 * `generateRegister(axes)` -- the whole engine in one call.
 *
 * It derives the ramp, leading, rhythm, page shape, palette, and detailing,
 * then runs the contrast gate. If any ink or accent role could not be solved to
 * its WCAG-AA target, it throws `RegisterContrastError` here, at generation
 * time, so an inaccessible register can never reach a page.
 */

import { apcaLc, oklchCss, wcagContrast } from "./color.js";
import { buildDetailing } from "./detailing.js";
import { buildPage } from "./page.js";
import {
  type Band,
  buildPalette,
  DEFAULT_TARGETS,
  defaultBands,
  type Targets,
} from "./palette.js";
import { buildRamp, buildRhythm, HEADING_LEADING, solveLeading } from "./scale.js";
import {
  type Axes,
  type ContrastReport,
  type Palette,
  type Register,
  RegisterContrastError,
  RATIOS,
} from "./types.js";

/** The default point in axis space: a warm, comfortable light reading page. */
export const DEFAULT_AXES: Axes = {
  base: 17,
  ratio: RATIOS.minorThird,
  measure: 68,
  hue: 70, // warm paper
  chroma: 0.008,
  signalHue: 25, // oxblood family
  signalChroma: 0.11,
  linkHue: 220, // teal family
  linkChroma: 0.06,
  mode: "light",
  density: "reading",
};

export interface GenerateOptions {
  /** Override per-role contrast targets. */
  targets?: Targets;
  /** Override the ink lightness search band (used by the CI contrast gate). */
  inkBand?: Band;
  /** Override the accent lightness search band. */
  accentBand?: Band;
  /** Prose / ui / mono font stacks. Fonts are chosen by the host, not derived. */
  fonts?: Partial<Register["fonts"]>;
}

const DEFAULT_FONTS: Register["fonts"] = {
  prose: "'Vollkorn', Georgia, 'Times New Roman', serif",
  ui: "'IBM Plex Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, 'SF Mono', monospace",
};

/** Fill a partial axis set from the defaults. */
export function resolveAxes(partial: Partial<Axes> = {}): Axes {
  const measure = clamp(partial.measure ?? DEFAULT_AXES.measure, 45, 75);
  return { ...DEFAULT_AXES, ...partial, measure };
}

export function generateRegister(
  partial: Partial<Axes> = {},
  opts: GenerateOptions = {},
): Register {
  const axes = resolveAxes(partial);
  const targets = opts.targets ?? DEFAULT_TARGETS;
  const base = defaultBands(axes.mode);
  const bands = {
    ink: opts.inkBand ?? base.ink,
    accent: opts.accentBand ?? base.accent,
  };

  const ramp = buildRamp(axes);
  const bodyStep = ramp.find((s) => s.step === 0);
  const bodyLeading = bodyStep ? bodyStep.leading : solveLeading(axes.base, axes.measure);

  const solved = buildPalette(axes, targets, bands);

  // Contrast gate: fail loudly if any role is unsolved, before assembling colors.
  const failures = solved.solved.filter((s) => s.lightness === null);
  const surfacesForReport = [solved.ground, solved.surface, solved.top];
  const report: ContrastReport[] = [];
  for (const entry of solved.solved) {
    const color =
      entry.role === "ink"
        ? solved.ink
        : entry.role === "ink2"
          ? solved.ink2
          : entry.role === "ink3"
            ? solved.ink3
            : entry.role === "signal"
              ? solved.signal
              : solved.link;
    const worst = Math.min(...surfacesForReport.map((s) => wcagContrast(color, s)));
    report.push({
      pair: `${entry.role} on surface`,
      wcag: round(worst, 3),
      apcaLc: round(Math.abs(apcaLc(color, solved.surface)), 1),
      passesAA: entry.lightness !== null && worst >= entry.target,
    });
  }

  if (failures.length > 0) {
    const failing = report.filter((r) => !r.passesAA);
    throw new RegisterContrastError(
      `Register is unsolvable: ${failures
        .map((f) => `${f.role} could not reach ${f.target}:1 within its lightness band`)
        .join("; ")}.`,
      failing,
    );
  }

  const palette: Palette = {
    ground: oklchCss(solved.ground),
    surface: oklchCss(solved.surface),
    top: oklchCss(solved.top),
    ink: oklchCss(solved.ink),
    ink2: oklchCss(solved.ink2),
    ink3: oklchCss(solved.ink3),
    hairline: solved.hairline,
    signal: oklchCss(solved.signal),
    signalPressed: oklchCss(solved.signalPressed),
    link: oklchCss(solved.link),
  };

  return {
    axes,
    ramp,
    headingLeading: HEADING_LEADING,
    bodyLeading,
    palette,
    page: buildPage(axes),
    rhythm: buildRhythm(axes.base, bodyLeading),
    detailing: buildDetailing(axes),
    fonts: { ...DEFAULT_FONTS, ...opts.fonts },
    contrast: report,
  };
}

const clamp = (x: number, lo: number, hi: number): number =>
  x < lo ? lo : x > hi ? hi : x;

function round(x: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}
