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

  // Heading rhythm (M3): fixture-level, ratio-derived. The flow gap is the owl
  // step (space-3); a heading owns ratio-compounded air above, binds below with
  // the rhythm unit, and a figure takes one ratio step past the flow gap.
  // galley/css consumes these (with the legacy scale steps as fallbacks), so
  // pane-scale heading spacing is a register decision, never a consumer override.
  const hr = reg.rhythm.heading;
  v["--gy-space-flow"] = "var(--gy-space-3)";
  v["--gy-space-above-h2"] = `${hr.aboveLh.h2}lh`;
  v["--gy-space-above-h3"] = `${hr.aboveLh.h3}lh`;
  v["--gy-space-above-h4"] = `${hr.aboveLh.h4}lh`;
  v["--gy-space-below-heading"] = `${hr.belowLh}lh`;
  v["--gy-space-figure"] = `${hr.figureLh}lh`;

  // Page shape (fractions; the raw canon, kept for callers that want it).
  v["--gy-page-margin-top"] = `${reg.page.marginTop}`;
  v["--gy-page-margin-bottom"] = `${reg.page.marginBottom}`;
  v["--gy-page-margin-inner"] = `${reg.page.marginInner}`;
  v["--gy-page-margin-outer"] = `${reg.page.marginOuter}`;

  // The page object: the canon spent into an actual page. `.galley` is the page
  // (galley/css), bounded to `measure + 2*pad-inline` and centered on the host
  // ground. Pads are computed in px here -- this is the token file, not a
  // lint-gated surface -- so they never depend on `lh`-inside-calc, which is
  // uneven across the browser matrix.
  const rp = reg.rhythm.rhythmPx;
  const px = (n: number) => `${Math.round(n)}px`;
  // Inline gutter: floored at a space-4 equivalent so a phone keeps a real
  // margin; fluid through the tablet band at a quarter of the canon outer
  // margin; capped near a space-8 equivalent so a wide page is bounded, not
  // floating in padding. (The rhythm scale itself tops out at space-6 = 3lh.)
  const padVw = Math.round(reg.page.marginOuter * 2500) / 100; // outer fraction -> vw
  v["--gy-page-pad-inline"] = `clamp(${px(1.5 * rp)}, ${padVw}vw, ${px(4 * rp)})`;
  // Block pads carry the canon's top<bottom relationship directly, so content
  // sits optically high with more breathing room below than above.
  const blockScale = 12 * rp;
  v["--gy-page-pad-block-start"] = px(reg.page.marginTop * blockScale);
  v["--gy-page-pad-block-end"] = px(reg.page.marginBottom * blockScale);

  // Elevation, register-differentiated. Parchment and print float on the ground
  // with a hairline perimeter and a faint two-layer shadow; substrate separates
  // by its surface step alone (drop shadows read as grime on a dark UI).
  if (reg.axes.mode === "dark") {
    v["--gy-page-border"] = "none";
    v["--gy-shadow"] = "none";
  } else {
    v["--gy-page-border"] = "var(--gy-border-width) solid var(--gy-hairline)";
    v["--gy-shadow"] = "0 1px 2px rgba(20, 20, 19, 0.05), 0 10px 30px rgba(20, 20, 19, 0.07)";
  }

  // Shape: radii and the hairline width, derived from base so they scale with
  // the register. Emitted as px here (this is the token file); galley/css only
  // ever references them as var(--gy-radius) etc., never a literal. radius-sm is
  // hairline-adjacent (capped 2-3px) for the inline-code highlight and callout
  // perimeter -- nothing inline is a pill; --gy-radius / -lg are for cards + pre.
  const base = reg.axes.base;
  v["--gy-radius-sm"] = `${Math.max(2, Math.min(3, Math.round(base * 0.16)))}px`;
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
  v["--gy-tint"] = reg.palette.tint;
  v["--gy-signal"] = reg.palette.signal;
  v["--gy-signal-pressed"] = reg.palette.signalPressed;
  v["--gy-link"] = reg.palette.link;

  // Fonts.
  v["--gy-font-prose"] = reg.fonts.prose;
  v["--gy-font-title"] = reg.fonts.title;
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
