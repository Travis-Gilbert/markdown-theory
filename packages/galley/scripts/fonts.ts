/**
 * Real fonts for the demos (P7).
 *
 * The package default stays system stacks (see DEFAULT_FONTS); this helper is
 * the *demo* path -- it inlines the self-hosted OFL faces (IBM Plex Sans for
 * body + ui, Encode Sans Semi Expanded for the title, JetBrains Mono for code)
 * as data: URIs so a standalone HTML file renders in the real fonts with zero
 * network and byte-identical across runs (which keeps the G7 snapshots
 * deterministic). If @fontsource is not installed it returns "" and the demo
 * falls back to system stacks, exactly like a fresh consumer would. Consumers
 * who want loaded fonts use the `galley/fonts` subpath (src/css/fonts.css)
 * instead of this build-time inliner.
 */

import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

interface Face {
  family: string;
  weight: number;
  style: "normal" | "italic";
  /** `@fontsource/<pkg>/files/<file>.woff2` */
  file: string;
}

const plex = (weight: number, style: "normal" | "italic"): Face => ({
  family: "IBM Plex Sans",
  weight,
  style,
  file: `@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-${weight}-${style}.woff2`,
});

/** The face set the demos actually use: Plex carries body + ui (regular,
 * italic, medium, bold), Encode the title, JetBrains the code. */
const FACES: Face[] = [
  {
    family: "Encode Sans Semi Expanded",
    weight: 600,
    style: "normal",
    file: "@fontsource/encode-sans-semi-expanded/files/encode-sans-semi-expanded-latin-600-normal.woff2",
  },
  plex(400, "normal"),
  plex(400, "italic"),
  plex(500, "normal"),
  plex(600, "normal"),
  {
    family: "JetBrains Mono",
    weight: 500,
    style: "normal",
    file: "@fontsource/jetbrains-mono/files/jetbrains-mono-latin-500-normal.woff2",
  },
];

/**
 * `<style>`-ready @font-face block with every face inlined as a data: URI, or
 * "" if the fonts are not installed (in which case the demo falls back to system
 * stacks wholesale, exactly like a fresh consumer would).
 */
export function inlineFontFaceCss(): string {
  const blocks: string[] = [];
  for (const face of FACES) {
    let dataUri: string;
    try {
      const buf = readFileSync(require.resolve(face.file));
      dataUri = `data:font/woff2;base64,${buf.toString("base64")}`;
    } catch {
      return ""; // any missing face -> fall back to system stacks wholesale
    }
    blocks.push(
      `@font-face{font-family:'${face.family}';font-style:${face.style};` +
        `font-weight:${face.weight};font-display:swap;src:url(${dataUri}) format('woff2');}`,
    );
  }
  return blocks.join("\n");
}
