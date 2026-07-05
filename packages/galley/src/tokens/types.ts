/**
 * The axis space and the Register it derives.
 *
 * The whole claim of galley is that beauty is *computed*: you supply a handful
 * of axes, the engine derives every token, and no component ever holds a
 * literal. `Axes` is that handful. `Register` is everything that falls out.
 */

export type Mode = "light" | "dark" | "print";
export type Density = "reading" | "reference";

/** The selectable modular-scale ratios named in the spec (G1). */
export const RATIOS = {
  minorThird: 1.2,
  majorThird: 1.25,
  perfectFourth: 1.333,
  augmentedFourth: 1.414,
  goldenSection: 1.618,
} as const;

/**
 * The input axes. Every field has a sane default (see `DEFAULT_AXES`); a caller
 * typically overrides one or two and lets the rest ride.
 */
export interface Axes {
  /** Body font size in px. Default 17. */
  base: number;
  /** Modular scale ratio. Default 1.2 (minor third). */
  ratio: number;
  /** Optimal line length in ch. Clamped to [45, 75]. Default 68. */
  measure: number;
  /** Surface hue seed, OKLCH degrees [0, 360). */
  hue: number;
  /** Surface chroma seed (the near-neutral tint of the paper). */
  chroma: number;
  /** Signal (accent) hue in OKLCH degrees. */
  signalHue: number;
  /** Signal chroma. */
  signalChroma: number;
  /** Link hue in OKLCH degrees. */
  linkHue: number;
  /** Link chroma. */
  linkChroma: number;
  /** Render mode. Default "light". */
  mode: Mode;
  /** Reading vs reference density. Default "reading". */
  density: Density;
}

/** A single step of the type ramp. */
export interface RampStep {
  /** The ramp index, -2 through 5. */
  step: number;
  /** Size in px, snapped to quarter-pixel. */
  px: number;
  /** Size in rem (px / base), for cascade-friendly output. */
  rem: number;
  /** Solved body leading for this size (unitless). */
  leading: number;
}

/** The OKLCH color ladders. Values are emitted as `oklch(L C H)` strings. */
export interface Palette {
  /** Base canvas, one lightness step below surface. */
  ground: string;
  /** The reading plane. */
  surface: string;
  /** Popovers / raised, one step above surface. */
  top: string;
  /** Primary ink (solved for WCAG AA against surface). */
  ink: string;
  /** Secondary ink. */
  ink2: string;
  /** Tertiary ink / faint apparatus. */
  ink3: string;
  /** Hairline color (the one literal the spec permits). */
  hairline: string;
  /** Signal / accent, AA-solved. */
  signal: string;
  /** Pressed signal, one step darker/lighter. */
  signalPressed: string;
  /** Link color, AA-solved. */
  link: string;
}

/** Van de Graaf-derived page margins, expressed as fractions of viewport width. */
export interface PageShape {
  /** Optimal content width in ch (mirrors the measure axis). */
  measureCh: number;
  /** Top margin fraction (content sits optically high on screen). */
  marginTop: number;
  /** Bottom margin fraction. */
  marginBottom: number;
  /** Inner (spine) margin fraction. */
  marginInner: number;
  /** Outer margin fraction. */
  marginOuter: number;
}

/** Rhythm: the vertical spacing scale, all in `lh` units. */
export interface Rhythm {
  /** The base spacing unit in lh (0.5lh per the spec). */
  unitLh: number;
  /** Named steps in lh: from tight (0.5lh) to sectional (3lh). */
  scaleLh: number[];
  /** Precomputed pixel rhythm (base * bodyLeading), for calc fallback where `lh` fails. */
  rhythmPx: number;
}

/** Detailing defaults baked into the emitted properties (G1). */
export interface Detailing {
  featProse: string;
  featUi: string;
  featTabular: string;
  textWrapBody: "pretty" | "balance" | "wrap";
  textWrapHeading: "balance" | "pretty" | "wrap";
  hangingPunctuation: string;
  hyphens: "auto" | "manual" | "none";
  opticalSizing: "auto" | "none";
}

/** The full derived register. Pure data; `emitCss` turns it into a stylesheet. */
export interface Register {
  axes: Axes;
  ramp: RampStep[];
  /** Heading leading (fixed, tighter than body). */
  headingLeading: number;
  bodyLeading: number;
  palette: Palette;
  page: PageShape;
  rhythm: Rhythm;
  detailing: Detailing;
  fonts: {
    prose: string;
    ui: string;
    mono: string;
  };
  /** Advisory contrast report, one entry per solved pairing. */
  contrast: ContrastReport[];
}

export interface ContrastReport {
  pair: string;
  wcag: number;
  apcaLc: number;
  passesAA: boolean;
}

/** Thrown at generation time when a register cannot satisfy WCAG AA. */
export class RegisterContrastError extends Error {
  constructor(
    message: string,
    public readonly failures: ContrastReport[],
  ) {
    super(message);
    this.name = "RegisterContrastError";
  }
}
