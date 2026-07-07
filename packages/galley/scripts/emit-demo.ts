/**
 * Emit the three fixture registers as CSS and the "Beauty, Computed" demo page.
 *
 * The demo renders through the real path -- `<Galley>` + galley/css -- so what
 * you see is the shipped default, not a bespoke preview: `.galley` IS the page
 * (bounded, centered, elevated on the ground), the masthead is composed from
 * frontmatter, and the register toggle re-typesets every token live. Only the
 * toolbar is host chrome. Run: `pnpm demo:tokens`.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildShikiTheme, emitCss, parchment, print, substrate } from "../src/tokens/index.js";
import { Galley } from "../src/react/index.js";
import { inlineFontFaceCss } from "./fonts.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../dist");
mkdirSync(outDir, { recursive: true });

const tokensCss =
  emitCss(parchment(), ":root") +
  "\n" +
  emitCss(substrate(), "html.gy-substrate") +
  "\n" +
  emitCss(print(), "html.gy-print");

writeFileSync(resolve(outDir, "tokens.css"), tokensCss, "utf8");

// A self-contained, wide (~2:1) architectural SVG so the demo can show how a
// figure is framed -- inlined as a data URI, no network. Three tones (a warm
// "day", a dim "then", a bright "now") drive the same colonnade so the bleed and
// then/now comparison have real, distinct images to work with.
function shade(hex: string, amt: number): string {
  const n = parseInt(hex.slice(1), 16);
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const ch = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => clamp(v + amt * 255));
  return "#" + ch.map((v) => v.toString(16).padStart(2, "0")).join("");
}
function palette(paper: string, structure: string, accent: string) {
  return {
    bg0: paper,
    bg1: shade(paper, -0.06),
    glow: shade(paper, 0.05),
    wall: shade(paper, -0.03),
    win: shade(paper, 0.06),
    winStroke: shade(structure, 0.05),
    cornice: shade(structure, 0.04),
    line: accent,
    chand: shade(accent, 0.07),
    chandStroke: shade(accent, -0.06),
    col: shade(structure, 0.07),
    cap: structure,
    base: shade(structure, -0.02),
    floor: shade(structure, -0.05),
    rug: shade(accent, -0.02),
    rug2: shade(structure, 0.05),
  };
}
type Pal = ReturnType<typeof palette>;

function lobbySvg(p: Pal): string {
  const W = 1280;
  const H = 600;
  const cols: string[] = [];
  for (let i = 0; i < 6; i++) {
    const x = 96 + i * 214;
    cols.push(
      `<rect x='${x}' y='150' width='58' height='330' rx='5' fill='${p.col}'/>` +
        `<rect x='${x - 10}' y='134' width='78' height='20' rx='4' fill='${p.cap}'/>` +
        `<rect x='${x - 12}' y='476' width='82' height='18' rx='4' fill='${p.base}'/>`,
    );
  }
  const windows: string[] = [];
  for (let i = 0; i < 5; i++) {
    const x = 150 + i * 214;
    windows.push(
      `<path d='M ${x} 200 v -80 a 44 44 0 0 1 88 0 v 80 z' fill='${p.win}' stroke='${p.winStroke}' stroke-width='3'/>`,
    );
  }
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${W} ${H}' role='img' aria-label='A grand hotel lobby: colonnade and chandelier'>` +
    `<defs>` +
    `<linearGradient id='sky' x1='0' x2='0' y1='0' y2='1'><stop offset='0' stop-color='${p.bg0}'/><stop offset='1' stop-color='${p.bg1}'/></linearGradient>` +
    `<radialGradient id='glow' cx='.5' cy='.5' r='.5'><stop offset='0' stop-color='${p.glow}'/><stop offset='1' stop-color='${p.bg1}' stop-opacity='0'/></radialGradient>` +
    `</defs>` +
    `<rect width='${W}' height='${H}' fill='url(#sky)'/>` +
    `<rect x='60' y='90' width='${W - 120}' height='400' fill='${p.wall}'/>` +
    windows.join("") +
    `<rect x='60' y='96' width='${W - 120}' height='10' fill='${p.cornice}'/>` +
    `<circle cx='${W / 2}' cy='150' r='120' fill='url(#glow)'/>` +
    `<line x1='${W / 2}' y1='96' x2='${W / 2}' y2='150' stroke='${p.line}' stroke-width='4'/>` +
    `<circle cx='${W / 2}' cy='158' r='26' fill='${p.chand}' stroke='${p.chandStroke}' stroke-width='3'/>` +
    cols.join("") +
    `<rect y='480' width='${W}' height='120' fill='${p.floor}'/>` +
    `<ellipse cx='${W / 2}' cy='545' rx='430' ry='46' fill='${p.rug}'/>` +
    `<ellipse cx='${W / 2}' cy='545' rx='360' ry='34' fill='${p.rug2}'/>` +
    `</svg>`
  );
}
const uri = (p: Pal) =>
  "data:image/svg+xml;base64," + Buffer.from(lobbySvg(p), "utf8").toString("base64");
const figureSrc = uri(palette("#ece3d0", "#cdbf9e", "#b7a67d"));
const thenSrc = uri(palette("#cbc0aa", "#ab9d7e", "#93835f"));
const nowSrc = uri(palette("#f4edde", "#dccfb1", "#c3b083"));

// The document. Frontmatter composes the masthead; the body is the vocabulary a
// reading page needs. No register/highlighter is passed, so the whole page --
// including code -- re-typesets when the toolbar swaps the register class.
const doc = `---
title: Beauty is computed, not themed
byline: The Galley Review
date: 2026-07-06
gist: Seven axes derive the type ramp, the leading, the rhythm, and an OKLCH palette solved for WCAG AA. Change one axis and the whole page re-derives.
---

:::abstract
This page holds no color, size, or spacing literal. A proportion engine reads a
handful of axes and derives everything below; the page you are reading is a pure
projection of that register.
:::

The classic reading page earns its calm from proportion, not decoration. Line
length sets leading; leading sets rhythm; rhythm sets the gaps between every
block. When those relationships are computed rather than typed by hand, a
document is good by construction, including the documents nobody stopped to
style. An inline reference like \`generateRegister(axes)\` reads as highlighted
text, not a chip.

::figure{src="${figureSrc}" caption="An image sits within the measure: framed by a hairline, gently radiused, centered, and captioned in the ui face."}

## The register carries the code, too

A syntax theme generated from the same ladders keeps code on brand:

\`\`\`ts
export function generateRegister(axes) {
  const ramp = buildRamp(axes);        // size[i] = base * ratio^i
  const palette = solvePalette(axes);  // OKLCH, AA-gated
  if (palette.unsolvable) throw new RegisterContrastError();
  return { ramp, palette, rhythm, page };
}
\`\`\`

:::note
Callouts carry their kind in the label, not a colored rail: a surface step, a
hairline perimeter, a small-caps label.
:::

Images have three widths: in the measure by default, a bleed hero that breaks to
the page edges, and a two-up comparison for a then and now.

::figure{src="${nowSrc}" width="bleed" caption="A bleed image meets the page edges, its frame off, while the caption stays with the reading column."}

::compare{before="${thenSrc}" after="${nowSrc}" width="bleed" caption="Then and now: two panels with corner labels, composed as one figure."}

## What falls out of the axes

| Role | Min contrast | Aim |
|---|---:|---:|
| primary ink | 4.5 | 10.0 |
| secondary ink | 4.5 | 7.0 |
| faint apparatus | 3.0 | 3.0 |

- A quarter-pixel type ramp from step minus two through five.
- Leading solved against the measure and clamped to a reading band.
- A warm ink ladder and a surface ladder: one hue, fixed lightness steps.
- Signal and link hues, each darkened until they clear AA on every surface.

> The primitives a typesetting compiler used to fake are now in the engine.
`;

const body = renderToStaticMarkup(createElement(Galley, { doc, template: "article" }));

const galleyCss = readFileSync(resolve(here, "../src/css/galley.css"), "utf8");
const fontCss = inlineFontFaceCss();

// Host chrome: the register toolbar and the ground. The page itself is entirely
// galley/css. The toolbar is the only place literals live (it is not the page).
const hostCss = `
* { box-sizing: border-box; }
html { background: var(--gy-ground); }
body { margin: 0; padding: 0 0 12vh; color: var(--gy-ink); font-family: var(--gy-font-prose); }
.toolbar {
  position: sticky; top: 0; z-index: 1;
  display: flex; gap: 0.5rem; align-items: center;
  padding: 0.75rem clamp(1rem, 5vw, 3rem);
  margin-bottom: 4vh;
  font-family: var(--gy-font-ui); font-size: var(--gy-text-small);
  color: var(--gy-ink-2);
  background: var(--gy-ground);
  border-bottom: 1px solid var(--gy-hairline);
}
.toolbar strong { font-family: var(--gy-font-ui); color: var(--gy-ink); }
.toolbar .spacer { flex: 1; }
.toolbar button {
  font: inherit; cursor: pointer;
  color: var(--gy-ink-2); background: var(--gy-surface);
  border: 1px solid var(--gy-hairline); border-radius: 999px;
  padding: 0.25rem 0.75rem;
}
.toolbar button[aria-pressed="true"] { color: var(--gy-signal); border-color: var(--gy-signal); }
`;

const toolbar = `<div class="toolbar" role="group" aria-label="Register">
  <strong>galley</strong>
  <span class="spacer"></span>
  <button data-reg="" aria-pressed="true">parchment</button>
  <button data-reg="gy-substrate" aria-pressed="false">substrate</button>
  <button data-reg="gy-print" aria-pressed="false">print</button>
</div>`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>galley &middot; beauty, computed</title>
<style>${fontCss}</style>
<style>${tokensCss}</style>
<style>${galleyCss}</style>
<style>${hostCss}</style>
</head>
<body>
${toolbar}
${body}
<script>
  const buttons = [...document.querySelectorAll('.toolbar button')];
  for (const b of buttons) {
    b.addEventListener('click', () => {
      document.documentElement.className = b.dataset.reg || '';
      for (const other of buttons) other.setAttribute('aria-pressed', String(other === b));
    });
  }
</script>
</body>
</html>
`;

writeFileSync(resolve(outDir, "demo.html"), html, "utf8");
writeFileSync(
  resolve(outDir, "shiki-parchment.json"),
  JSON.stringify(buildShikiTheme(parchment()), null, 2),
  "utf8",
);

// Print the contrast receipts so the run proves the AA gate held.
for (const [name, reg] of [
  ["parchment", parchment()],
  ["substrate", substrate()],
  ["print", print()],
] as const) {
  const worst = Math.min(...reg.contrast.map((c) => c.wcag));
  const line = reg.contrast.map((c) => `${c.pair.split(" ")[0]}=${c.wcag}:1`).join("  ");
  console.log(`${name.padEnd(10)} min=${worst}:1  ${line}`);
}
console.log(`\nWrote ${outDir}/{tokens.css, demo.html, shiki-parchment.json}`);
