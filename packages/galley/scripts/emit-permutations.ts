/**
 * G7 fixture generator: render representative documents across the register x
 * recipe matrix (3 registers x 4 recipes) plus a curated MIT-News-style article
 * (3 registers) into standalone HTML files. These are the exact snapshots the
 * visual-diff / overflow / contrast / page-object CI job screenshots in a real
 * browser (see docs/plan/g7-browser-harness.md). This generator runs without a
 * browser; the pixel-level gates do not.
 *
 * The host page is deliberately minimal: ground on the body, real fonts inlined,
 * and NOTHING that re-implements the page -- `.galley` is the page now
 * (galley/css), so these fixtures exercise the shipped default, which is what
 * lets the gates catch a page-object regression.
 * Run: `pnpm demo:permutations`.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { emitCss, parchment, print, substrate } from "../src/tokens/index.js";
import type { Register } from "../src/tokens/index.js";
import { Galley } from "../src/react/index.js";
import { inlineFontFaceCss } from "./fonts.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../dist/permutations");
mkdirSync(outDir, { recursive: true });

const REGISTERS: Array<[string, Register]> = [
  ["parchment", parchment()],
  ["substrate", substrate()],
  ["print", print()],
];
const RECIPES = ["article", "note", "reference", "log"] as const;

const doc = `---
byline: A. Reviewer
gist: One representative document, rendered every which way.
---

# The quick brown fox

A paragraph of body text long enough to wrap across the measure and exercise the
leading, so orphans and rags are visible to the overflow lint.

## A subhead

:::note
A callout, to check apparatus color and spacing.
:::

- a list item
- another, slightly longer, list item that may wrap

\`\`\`ts
const answer = 42;
\`\`\`

| Metric | Value |
|---|---|
| contrast | 10:1 |
`;

// A curated masthead + booktabs fixture: the MIT-News parity target. Frontmatter
// composes the title block; the numeric table (right-aligned via GFM) rides the
// booktabs kit; inline code exercises the tint.
const mitnews = `---
title: A computed page, measured against a newsroom
byline: The Galley Review
date: 2026-07-06
gist: How a proportion engine spends the Van de Graaf canon into a page that opens like a publication, not a file.
---

:::abstract
The reading page earns its calm from proportion, not decoration. This fixture is
the parity target: a composed masthead, justified prose in print, and a
booktabs table, all computed from seven axes.
:::

A newsroom page opens with a masthead and settles the eye before the first
sentence. The measure sets the leading; the leading sets the rhythm; the rhythm
sets every gap. Change one axis and the page re-typesets. Inline references like
\`generateRegister(axes)\` read as highlighted text, not chips.

## What the engine spends

The canon places the text block with asymmetric margins so content sits
optically high. The table below reports the minimum solved contrast per register.

| Register | Min contrast | Primary ink |
|---|---:|---:|
| parchment | 3.97 | 10.0 |
| substrate | 4.45 | 8.5 |
| print | 6.10 | 12.0 |

## Why it holds

Every pairing clears WCAG AA at generation time or the register never ships.

- The ramp is a geometric sequence, quarter-pixel snapped.
- Leading is a function of size and measure.
- The palette is solved in OKLCH and gated in sRGB.
`;

const galleyCss = readFileSync(resolve(here, "../src/css/galley.css"), "utf8");
const fontCss = inlineFontFaceCss();

// Host shell: ground on the page, real fonts, ground gap smaller above than
// below. No page geometry here -- that is the stylesheet's job now.
const hostCss = "html{background:var(--gy-ground)} body{margin:0;padding:4vh 0 12vh}";

function page(register: Register, body: string, titleAttr: string): string {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${titleAttr}</title>
<style>${fontCss}</style>
<style>${emitCss(register, ":root")}</style>
<style>${galleyCss}</style>
<style>${hostCss}</style>
</head><body>${body}</body></html>
`;
}

const links: string[] = [];
for (const [regName, register] of REGISTERS) {
  for (const recipe of RECIPES) {
    const body = renderToStaticMarkup(createElement(Galley, { doc, register, template: recipe }));
    const name = `${regName}-${recipe}.html`;
    writeFileSync(resolve(outDir, name), page(register, body, `${regName} / ${recipe}`), "utf8");
    links.push(`<li><a href="./${name}">${regName} / ${recipe}</a></li>`);
  }
  // The MIT-News parity fixture: article recipe, so it wears the paper kit.
  const mnBody = renderToStaticMarkup(
    createElement(Galley, { doc: mitnews, register, template: "article" }),
  );
  const mnName = `${regName}-mitnews.html`;
  writeFileSync(resolve(outDir, mnName), page(register, mnBody, `${regName} / mitnews`), "utf8");
  links.push(`<li><a href="./${mnName}">${regName} / mitnews</a></li>`);
}

writeFileSync(
  resolve(outDir, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>galley permutations</title><h1>Register x recipe matrix</h1><ul>${links.join("")}</ul>`,
  "utf8",
);

console.log(`Wrote ${REGISTERS.length * (RECIPES.length + 1)} permutations + index to ${outDir}`);
