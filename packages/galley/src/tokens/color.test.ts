import { describe, expect, it } from "vitest";
import { apcaLc, inGamut, type Oklch, oklchToSrgb, srgbToHex, wcagContrast } from "./color.js";

const WHITE: Oklch = { l: 1, c: 0, h: 0 };
const BLACK: Oklch = { l: 0, c: 0, h: 0 };

describe("OKLCH -> sRGB", () => {
  it("maps achromatic extremes to white and black", () => {
    expect(srgbToHex(WHITE)).toBe("#ffffff");
    expect(srgbToHex(BLACK)).toBe("#000000");
  });

  it("produces a neutral grey at mid lightness", () => {
    const { r, g, b } = oklchToSrgb({ l: 0.6, c: 0, h: 0 });
    expect(Math.abs(r - g)).toBeLessThan(0.001);
    expect(Math.abs(g - b)).toBeLessThan(0.001);
    expect(r).toBeGreaterThan(0.4);
    expect(r).toBeLessThan(0.7);
  });

  it("flags out-of-gamut colors", () => {
    // A wildly saturated color at mid lightness cannot fit in sRGB.
    expect(inGamut({ l: 0.6, c: 0.4, h: 150 })).toBe(false);
    // A near-neutral one fits comfortably.
    expect(inGamut({ l: 0.6, c: 0.02, h: 150 })).toBe(true);
  });
});

describe("WCAG contrast", () => {
  it("scores black on white at ~21:1", () => {
    expect(wcagContrast(BLACK, WHITE)).toBeGreaterThan(20.9);
  });

  it("scores a color against itself at 1:1", () => {
    const c: Oklch = { l: 0.5, c: 0.1, h: 200 };
    expect(wcagContrast(c, c)).toBeCloseTo(1, 5);
  });

  it("is order-independent", () => {
    const a: Oklch = { l: 0.3, c: 0.05, h: 40 };
    const b: Oklch = { l: 0.95, c: 0.01, h: 40 };
    expect(wcagContrast(a, b)).toBeCloseTo(wcagContrast(b, a), 10);
  });
});

describe("APCA (advisory)", () => {
  it("reports strong lightness contrast for black text on white", () => {
    expect(Math.abs(apcaLc(BLACK, WHITE))).toBeGreaterThan(90);
  });

  it("reports near-zero for same-color pairs", () => {
    const c: Oklch = { l: 0.5, c: 0, h: 0 };
    expect(apcaLc(c, c)).toBe(0);
  });
});
