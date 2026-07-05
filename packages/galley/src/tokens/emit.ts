/**
 * Register -> CSS custom properties.
 *
 * Every token galley/css and galley/react consume is emitted here under the
 * `--gy-` prefix. Downstream code references `var(--gy-*)` and never a literal;
 * that single rule is what makes changing one axis re-derive the whole sheet.
 */

import type { Register } from "./types.js";

const STEP_NAME: Record<number, string> = {
  [-2]: "n2",
  [-1]: "n1",
  0: "0",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
};

/** Semantic size aliases mapped onto ramp steps. */
const HEADING_STEP: Record<string, number> = {
  h1: 4,
  h2: 3,
  h3: 2,
  h4: 1,
  h5: 0,
  h6: -1,
};

/** Return the token map (name -> value) without any selector wrapper. */
export function emitRegisterVars(reg: Register): Record<string, string> {
  const v: Record<string, string> = {};

  // Type ramp, in rem so it rides the cascade.
  for (const s of reg.ramp) {
    v[`--gy-size-${STEP_NAME[s.step]}`] = `${s.rem}rem`;
  }
  // Semantic size aliases.
  v["--gy-text-body"] = "var(--gy-size-0)";
  v["--gy-text-small"] = "var(--gy-size-n1)";
  v["--gy-text-caption"] = "var(--gy-size-n2)";
  for (const [name, step] of Object.entries(HEADING_STEP)) {
    v[`--gy-text-${name}`] = `var(--gy-size-${STEP_NAME[step]})`;
  }

  // Leading.
  v["--gy-leading-body"] = `${reg.bodyLeading}`;
  v["--gy-leading-heading"] = `${reg.headingLeading}`;

  // Measure.
  v["--gy-measure"] = `${reg.page.measureCh}ch`;

  // Rhythm: spacing in lh, with a precomputed px fallback for calc contexts.
  v["--gy-space-unit"] = `${reg.rhythm.unitLh}lh`;
  reg.rhythm.scaleLh.forEach((lh, i) => {
    v[`--gy-space-${i + 1}`] = `${lh}lh`;
  });
  v["--gy-rhythm-px"] = `${reg.rhythm.rhythmPx}px`;

  // Page shape (fractions; the layout layer decides how to spend them).
  v["--gy-page-margin-top"] = `${reg.page.marginTop}`;
  v["--gy-page-margin-bottom"] = `${reg.page.marginBottom}`;
  v["--gy-page-margin-inner"] = `${reg.page.marginInner}`;
  v["--gy-page-margin-outer"] = `${reg.page.marginOuter}`;

  // Shape: radii and the hairline width, derived from base so they scale with
  // the register. Emitted as px here (this is the token file); galley/css only
  // ever references them as var(--gy-radius) etc., never a literal.
  const base = reg.axes.base;
  v["--gy-radius"] = `${Math.round(base * 0.45)}px`;
  v["--gy-radius-lg"] = `${Math.round(base * 0.85)}px`;
  v["--gy-border-width"] = "1px";

  // Color ladders.
  v["--gy-ground"] = reg.palette.ground;
  v["--gy-surface"] = reg.palette.surface;
  v["--gy-top"] = reg.palette.top;
  v["--gy-ink"] = reg.palette.ink;
  v["--gy-ink-2"] = reg.palette.ink2;
  v["--gy-ink-3"] = reg.palette.ink3;
  v["--gy-hairline"] = reg.palette.hairline;
  v["--gy-signal"] = reg.palette.signal;
  v["--gy-signal-pressed"] = reg.palette.signalPressed;
  v["--gy-link"] = reg.palette.link;

  // Fonts.
  v["--gy-font-prose"] = reg.fonts.prose;
  v["--gy-font-ui"] = reg.fonts.ui;
  v["--gy-font-mono"] = reg.fonts.mono;

  // OpenType feature sets.
  v["--gy-feat-prose"] = reg.detailing.featProse;
  v["--gy-feat-ui"] = reg.detailing.featUi;
  v["--gy-feat-tabular"] = reg.detailing.featTabular;

  // Detailing flags.
  v["--gy-text-wrap-body"] = reg.detailing.textWrapBody;
  v["--gy-text-wrap-heading"] = reg.detailing.textWrapHeading;
  v["--gy-hanging-punctuation"] = reg.detailing.hangingPunctuation;
  v["--gy-hyphens"] = reg.detailing.hyphens;
  v["--gy-optical-sizing"] = reg.detailing.opticalSizing;

  return v;
}

/**
 * Emit the register as a CSS rule. `selector` defaults to `:root`; pass a class
 * like `.gy-substrate` to scope a register (the dark/print swap pattern).
 */
export function emitCss(reg: Register, selector = ":root"): string {
  const vars = emitRegisterVars(reg);
  const body = Object.entries(vars)
    .map(([k, val]) => `  ${k}: ${val};`)
    .join("\n");
  return `${selector} {\n${body}\n}\n`;
}
