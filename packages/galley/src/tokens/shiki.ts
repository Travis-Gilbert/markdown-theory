/**
 * A Shiki (TextMate) theme derived from the register's own ladders.
 *
 * Code blocks are the classic place a "beautiful by construction" system leaks:
 * you ship a gorgeous page and then paste in Dracula. Instead we spread a few
 * hues around the wheel, anchor them to the register's surface, solve each for
 * AA readability, and hand Shiki hex it can actually parse.
 */

import { srgbToHex } from "./color.js";
import { buildPalette, defaultBands, solveLightness } from "./palette.js";
import type { Register } from "./types.js";

export interface ShikiTheme {
  name: string;
  type: "light" | "dark";
  colors: Record<string, string>;
  tokenColors: Array<{
    scope: string | string[];
    settings: { foreground?: string; fontStyle?: string };
  }>;
}

/** Syntax roles as hue offsets; assignments read from the register's accents. */
const SYNTAX_HUES = {
  keyword: 0, // anchored to signal
  string: 150, // green
  function: 250, // blue
  number: 310, // violet
  type: 200, // cyan
  regexp: 30, // amber
} as const;

export function buildShikiTheme(reg: Register, name = "galley"): ShikiTheme {
  const axes = reg.axes;
  const pal = buildPalette(axes);
  const surfaces = [pal.ground, pal.surface, pal.top];
  const bands = defaultBands(axes.mode);
  const chroma = 0.1;
  const target = 4.5;

  const hex = (hue: number): string => {
    const l = solveLightness(surfaces, hue, chroma, target, axes.mode, bands.accent);
    // Fall back to ink if a hue cannot be solved (never expected for code hues).
    const band = axes.mode === "dark" ? bands.accent.hi : bands.accent.lo;
    return srgbToHex({ l: l ?? band, c: chroma, h: hue });
  };

  const keyword = hex(axes.signalHue + SYNTAX_HUES.keyword);
  const str = hex(SYNTAX_HUES.string);
  const fn = hex(SYNTAX_HUES.function);
  const num = hex(SYNTAX_HUES.number);
  const type = hex(SYNTAX_HUES.type);
  const regexp = hex(SYNTAX_HUES.regexp);

  const ink = srgbToHex(pal.ink);
  const ink2 = srgbToHex(pal.ink2);
  const ink3 = srgbToHex(pal.ink3);
  const surfaceHex = srgbToHex(pal.top);

  return {
    name,
    type: axes.mode === "dark" ? "dark" : "light",
    colors: {
      "editor.background": surfaceHex,
      "editor.foreground": ink,
    },
    tokenColors: [
      { scope: ["comment", "punctuation.definition.comment"], settings: { foreground: ink3, fontStyle: "italic" } },
      { scope: ["punctuation", "meta.brace"], settings: { foreground: ink2 } },
      { scope: ["variable", "meta.definition.variable"], settings: { foreground: ink } },
      { scope: ["keyword", "storage", "keyword.control", "storage.type"], settings: { foreground: keyword } },
      { scope: ["string", "string.quoted", "punctuation.definition.string"], settings: { foreground: str } },
      { scope: ["entity.name.function", "support.function", "meta.function-call"], settings: { foreground: fn } },
      { scope: ["constant.numeric", "constant.language"], settings: { foreground: num } },
      { scope: ["entity.name.type", "support.type", "entity.name.class"], settings: { foreground: type } },
      { scope: ["string.regexp", "constant.character.escape"], settings: { foreground: regexp } },
      { scope: ["markup.bold"], settings: { fontStyle: "bold" } },
      { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
    ],
  };
}
