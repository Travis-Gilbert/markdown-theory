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
} from "./register.js";

export { emitCss, emitRegisterVars } from "./emit.js";

export {
  buildRamp,
  buildRhythm,
  HEADING_LEADING,
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
  oklchCss,
  type Oklch,
  oklchToSrgb,
  type Rgb,
  srgbToHex,
  wcagContrast,
} from "./color.js";

export {
  FIXTURE_AXES,
  parchment,
  PARCHMENT_AXES,
  print,
  PRINT_AXES,
  substrate,
  SUBSTRATE_AXES,
} from "./fixtures.js";
