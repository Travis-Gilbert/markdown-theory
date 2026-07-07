/**
 * G7 robustness-corpus generator: render every uncurated README fixture through
 * <Galley> (no recipe -- the raw render path) across all three registers into
 * standalone HTML. These are the files the browser harness screenshots and runs
 * the overflow / contrast / orphan gates against (docs/plan/g7-browser-harness.md).
 * Runs without a browser; the pixel gates do not.
 * Run: `pnpm demo:readmes`.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { emitCss, parchment, print, substrate } from "../src/tokens/index.js";
import type { Register } from "../src/tokens/index.js";
import { Galley } from "../src/react/index.js";
import { inlineFontFaceCss } from "./fonts.js";

const here = dirname(fileURLToPath(import.meta.url));
const readmeDir = resolve(here, "../fixtures/readmes");
const outDir = resolve(here, "../dist/readmes");
mkdirSync(outDir, { recursive: true });

const REGISTERS: Array<[string, Register]> = [
  ["parchment", parchment()],
  ["substrate", substrate()],
  ["print", print()],
];

const galleyCss = readFileSync(resolve(here, "../src/css/galley.css"), "utf8");
const fontCss = inlineFontFaceCss();

const readmes = readdirSync(readmeDir)
  .filter((f) => f.endsWith(".md"))
  .sort();

const links: string[] = [];
for (const file of readmes) {
  const slug = file.replace(/\.md$/, "");
  const doc = readFileSync(resolve(readmeDir, file), "utf8");
  for (const [regName, register] of REGISTERS) {
    const body = renderToStaticMarkup(createElement(Galley, { doc, register }));
    const name = `${regName}-${slug}.html`;
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${regName} / ${slug}</title>
<style>${fontCss}</style>
<style>${emitCss(register, ":root")}</style>
<style>${galleyCss}</style>
<style>html{background:var(--gy-ground)} body{margin:0;padding:4vh 0 12vh}</style>
</head><body>${body}</body></html>
`;
    writeFileSync(resolve(outDir, name), html, "utf8");
    links.push(`<li><a href="./${name}">${regName} / ${slug}</a></li>`);
  }
}

writeFileSync(
  resolve(outDir, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>galley readme corpus</title><h1>Uncurated README robustness corpus</h1><ul>${links.join("")}</ul>`,
  "utf8",
);

console.log(
  `Wrote ${readmes.length * REGISTERS.length} README renders (${readmes.length} docs x ${REGISTERS.length} registers) + index to ${outDir}`,
);
