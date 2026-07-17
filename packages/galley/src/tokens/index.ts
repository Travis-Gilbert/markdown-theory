/**
 * galley/tokens -- the proportion engine.
 *
 * Framework-free. Give it axes, get a Register; emit the Register as CSS custom
 * properties. Nothing here imports React or the DOM.
 */

export type {
  Axes,
  ContrastReport,
  Density,
  Detailing,
  HeadingRhythm,
  Mode,
  PageShape,
  Palette,
  RampStep,
  Register,
  Rhythm,
} from "./types.js";
export { RATIOS, RegisterContrastError } from "./types.js";

export {
  DEFAULT_AXES,
  generateRegister,
  type GenerateOptions,
  resolveAxes,
  SERIF_PROSE,
} from "./register.js";

export { emitCss, emitRegisterVars } from "./emit.js";

export { FIXTURE_CSS_ARTIFACTS, fixtureCss } from "./fixture-css.js";

export {
  buildRamp,
  buildRhythm,
  HEADING_LEADING,
  headingRhythm,
  quarterPixel,
  solveLeading,
} from "./scale.js";

export { buildPage } from "./page.js";

export {
  type Band,
  buildPalette,
  DEFAULT_TARGETS,
  defaultBands,
  type PaletteBands,
  solveLightness,
  type SolvedPalette,
  type Targets,
} from "./palette.js";

export { buildShikiTheme, type ShikiTheme } from "./shiki.js";

export {
  apcaLc,
  inGamut,
  mixOklch,
  oklchCss,
  type Oklch,
  oklchToSrgb,
  type Rgb,
  srgbToHex,
  wcagContrast,
} from "./color.js";

export {
  CONSOLE_DARK_AXES,
  CONSOLE_DARK_VARIANTS,
  consoleDark,
  consoleDarkSans,
  consoleDarkSerif,
  FIXTURE_AXES,
  FIXTURE_REGISTERS,
  type FixtureVariant,
  parchment,
  PARCHMENT_AXES,
  print,
  PRINT_AXES,
  substrate,
  SUBSTRATE_AXES,
} from "./fixtures.js";
