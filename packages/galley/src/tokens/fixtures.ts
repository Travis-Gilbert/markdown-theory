/**
 * The three shipped registers.
 *
 * `parchment` is the proof the engine can hit a known-good target: its axes
 * resolve to roughly the Compose light values (warm off-white surface, off-black
 * ink, oxblood signal, teal link) without any hex being copied in.
 * `substrate` is the dark point in the same axis family; `print` is high
 * contrast on paper white.
 */

import { generateRegister } from "./register.js";
import type { Axes } from "./types.js";
import { RATIOS } from "./types.js";

export const PARCHMENT_AXES: Axes = {
  base: 17,
  ratio: RATIOS.minorThird,
  measure: 68,
  hue: 74,
  chroma: 0.008,
  signalHue: 24,
  signalChroma: 0.12,
  linkHue: 218,
  linkChroma: 0.06,
  mode: "light",
  density: "reading",
};

export const SUBSTRATE_AXES: Axes = {
  base: 17,
  ratio: RATIOS.minorThird,
  measure: 68,
  hue: 72,
  chroma: 0.006,
  signalHue: 26,
  signalChroma: 0.11,
  linkHue: 216,
  linkChroma: 0.07,
  mode: "dark",
  density: "reading",
};

export const PRINT_AXES: Axes = {
  base: 11,
  ratio: RATIOS.majorThird,
  measure: 66,
  hue: 74,
  chroma: 0.003,
  signalHue: 24,
  signalChroma: 0.13,
  linkHue: 218,
  linkChroma: 0.05,
  mode: "print",
  density: "reading",
};

export const parchment = () => generateRegister(PARCHMENT_AXES);
export const substrate = () => generateRegister(SUBSTRATE_AXES);
export const print = () => generateRegister(PRINT_AXES);

export const FIXTURE_AXES = {
  parchment: PARCHMENT_AXES,
  substrate: SUBSTRATE_AXES,
  print: PRINT_AXES,
} as const;
