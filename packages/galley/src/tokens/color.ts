/**
 * Color math, dependency-free.
 *
 * The engine reasons in OKLCH (perceptually uniform lightness, so "one step
 * darker" means the same thing everywhere on the wheel) but must gate contrast
 * in sRGB (where WCAG and APCA are defined). So we convert OKLCH -> OKLab ->
 * linear sRGB -> gamma sRGB, then score.
 *
 * Matrices are Bjorn Ottosson's canonical OKLab constants.
 */

export interface Oklch {
  /** Perceptual lightness [0, 1]. */
  l: number;
  /** Chroma, >= 0. */
  c: number;
  /** Hue in degrees [0, 360). */
  h: number;
}

export interface Rgb {
  r: number;
  g: number;
  b: number;
}

const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x);

/** OKLCH string for CSS. Emitted verbatim; browsers interpolate in OKLCH. */
export function oklchCss({ l, c, h }: Oklch): string {
  const L = round(l * 100, 3);
  const C = round(c, 4);
  const H = round(h, 2);
  return `oklch(${L}% ${C} ${H})`;
}

function round(x: number, dp: number): number {
  const f = 10 ** dp;
  return Math.round(x * f) / f;
}

/** OKLCH -> linear-light sRGB (may fall outside [0,1] if out of gamut). */
function oklchToLinearSrgb({ l, c, h }: Oklch): Rgb {
  const hr = (h * Math.PI) / 180;
  const a = c * Math.cos(hr);
  const b = c * Math.sin(hr);

  const l_ = l + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = l - 0.0894841775 * a - 1.291485548 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  return {
    r: 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3,
    g: -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3,
    b: -0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3,
  };
}

/** Is this OKLCH color inside the sRGB gamut (before clamping)? */
export function inGamut(color: Oklch): boolean {
  const { r, g, b } = oklchToLinearSrgb(color);
  const eps = 1e-4;
  return (
    r >= -eps && r <= 1 + eps && g >= -eps && g <= 1 + eps && b >= -eps && b <= 1 + eps
  );
}

function linearToGamma(c: number): number {
  const x = clamp01(c);
  return x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
}

/** OKLCH -> gamma sRGB in [0,1], clamped into gamut. */
export function oklchToSrgb(color: Oklch): Rgb {
  const lin = oklchToLinearSrgb(color);
  return {
    r: linearToGamma(lin.r),
    g: linearToGamma(lin.g),
    b: linearToGamma(lin.b),
  };
}

export function srgbToHex(color: Oklch): string {
  const { r, g, b } = oklchToSrgb(color);
  const h = (x: number) =>
    Math.round(clamp01(x) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

// ---- WCAG 2.x contrast -----------------------------------------------------

function wcagChannel(c: number): number {
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance of a gamma-sRGB triple. */
function relativeLuminance({ r, g, b }: Rgb): number {
  return (
    0.2126 * wcagChannel(r) + 0.7152 * wcagChannel(g) + 0.0722 * wcagChannel(b)
  );
}

/** WCAG contrast ratio between two OKLCH colors. Range [1, 21]. */
export function wcagContrast(a: Oklch, b: Oklch): number {
  const la = relativeLuminance(oklchToSrgb(a));
  const lb = relativeLuminance(oklchToSrgb(b));
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

// ---- APCA (advisory only) --------------------------------------------------
// Faithful to APCA-W3 0.1.1 constants. Reported, never gated on, per the spec.

const APCA = {
  mainTRC: 2.4,
  Rco: 0.2126729,
  Gco: 0.7151522,
  Bco: 0.072175,
  normBG: 0.56,
  normTXT: 0.57,
  revTXT: 0.62,
  revBG: 0.65,
  blkThrs: 0.022,
  blkClmp: 1.414,
  scale: 1.14,
  loBoWoffset: 0.027,
  loWoBoffset: 0.027,
  deltaYmin: 0.0005,
  loClip: 0.1,
} as const;

function apcaY({ r, g, b }: Rgb): number {
  const t = (c: number) => Math.pow(clamp01(c), APCA.mainTRC);
  return APCA.Rco * t(r) + APCA.Gco * t(g) + APCA.Bco * t(b);
}

/**
 * APCA lightness contrast (Lc). Positive magnitude only is meaningful here.
 * Text on background: pass `text` and `background`.
 */
export function apcaLc(text: Oklch, background: Oklch): number {
  let ytxt = apcaY(oklchToSrgb(text));
  let ybg = apcaY(oklchToSrgb(background));

  ytxt = ytxt > APCA.blkThrs ? ytxt : ytxt + Math.pow(APCA.blkThrs - ytxt, APCA.blkClmp);
  ybg = ybg > APCA.blkThrs ? ybg : ybg + Math.pow(APCA.blkThrs - ybg, APCA.blkClmp);

  if (Math.abs(ybg - ytxt) < APCA.deltaYmin) return 0;

  let sapc: number;
  let out: number;
  if (ybg > ytxt) {
    // normal polarity: dark text on light bg
    sapc = (Math.pow(ybg, APCA.normBG) - Math.pow(ytxt, APCA.normTXT)) * APCA.scale;
    out = sapc < APCA.loClip ? 0 : sapc - APCA.loBoWoffset;
  } else {
    // reverse polarity: light text on dark bg
    sapc = (Math.pow(ybg, APCA.revBG) - Math.pow(ytxt, APCA.revTXT)) * APCA.scale;
    out = sapc > -APCA.loClip ? 0 : sapc + APCA.loWoBoffset;
  }
  return out * 100;
}
