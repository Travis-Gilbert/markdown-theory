/**
 * Console fixture harness generator (SPEC-MDT-CONSOLE-FIXTURE M1/M3/M4).
 *
 * Renders the long technical brief through the BARE MOUNT (`galley--bare`)
 * inside fixed-width application hosts at 640 and 1040 px, across the console
 * register variants plus parchment. The host owns all page geometry, exactly as
 * the mount contract documents: it paints the ground and the pane surface,
 * fixes the pane width, pads the pane, and bounds the reading column with the
 * emitted `--gy-measure` token. The galley owns everything inside the column.
 *
 * The g7 gates then assert, in a real browser: bare-mount geometry (the column
 * fills the pane up to the measure, wraps, never clips), heading rhythm at pane
 * scale (nonzero computed margins after every h2, descender clearance), and the
 * shared overflow / contrast / widow / binding / block-spacing gates.
 * Run: `pnpm demo:briefs`.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { consoleDarkSans, consoleDarkSerif, emitCss, parchment } from "../src/tokens/index.js";
import type { Register } from "../src/tokens/index.js";
import { Galley } from "../src/react/index.js";
import { inlineFontFaceCss } from "./fonts.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../dist/briefs");
mkdirSync(outDir, { recursive: true });

const REGISTERS: Array<[string, Register]> = [
  ["console-dark-serif", consoleDarkSerif()],
  ["console-dark-sans", consoleDarkSans()],
  ["parchment", parchment()],
];
const PANE_WIDTHS = [640, 1040];

const doc = readFileSync(resolve(here, "../fixtures/briefs/technical-brief.md"), "utf8");
const galleyCss = readFileSync(resolve(here, "../src/css/galley.css"), "utf8");
const fontCss = inlineFontFaceCss();

/**
 * The documented bare-mount host recipe (README, "Two mounts"): the host owns
 * max width, measure, padding, and ground; the galley renders content only.
 * The pane width is the fixture's independent variable, so it is interpolated
 * here (host chrome, not a galley surface; the no-literals rule gates galley
 * css, and the gates measure the result either way).
 */
function hostCss(paneWidth: number): string {
  return [
    "html { background: var(--gy-ground); }",
    "body { margin: 0; padding: 4vh 0 12vh; }",
    `.host-pane { box-sizing: border-box; inline-size: min(${paneWidth}px, 100%);`,
    "  margin-inline: auto; background: var(--gy-surface);",
    "  padding: var(--gy-space-5) var(--gy-space-3); border-radius: var(--gy-radius); }",
    ".host-pane > .galley { max-inline-size: var(--gy-measure); margin-inline: auto; }",
  ].join("\n");
}

for (const [regName, register] of REGISTERS) {
  for (const width of PANE_WIDTHS) {
    const body = renderToStaticMarkup(
      createElement(Galley, { doc, register, className: "galley--bare" }),
    );
    const name = `bare-${width}-${regName}.html`;
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>bare ${width} / ${regName}</title>
<style>${fontCss}</style>
<style>${emitCss(register, ":root")}</style>
<style>${galleyCss}</style>
<style>${hostCss(width)}</style>
</head><body><div class="host-pane" data-pane-width="${width}">${body}</div></body></html>
`;
    writeFileSync(resolve(outDir, name), html, "utf8");
  }
}

writeFileSync(
  resolve(outDir, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>galley briefs</title><h1>Bare-mount brief harness</h1><ul>${REGISTERS.flatMap(
    ([regName]) =>
      PANE_WIDTHS.map(
        (w) => `<li><a href="./bare-${w}-${regName}.html">bare ${w} / ${regName}</a></li>`,
      ),
  ).join("")}</ul>`,
  "utf8",
);

console.log(`Wrote ${REGISTERS.length * PANE_WIDTHS.length} brief fixtures + index to ${outDir}`);
