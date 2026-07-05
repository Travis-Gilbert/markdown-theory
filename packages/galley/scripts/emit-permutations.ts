/**
 * G7 fixture generator: render one representative document across the register x
 * recipe matrix (3 registers x 4 recipes) into standalone HTML files. These are
 * the exact snapshots a visual-diff / overflow / contrast CI job screenshots in
 * a real browser (see docs/plan/g7-browser-harness.md). This generator runs
 * without a browser; the pixel-level gates do not.
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

const galleyCss = readFileSync(resolve(here, "../src/css/galley.css"), "utf8");

const links: string[] = [];
for (const [regName, register] of REGISTERS) {
  for (const recipe of RECIPES) {
    const body = renderToStaticMarkup(
      createElement(Galley, { doc, register, template: recipe }),
    );
    const name = `${regName}-${recipe}.html`;
    const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" />
<title>${regName} / ${recipe}</title>
<style>${emitCss(register, ":root")}</style>
<style>${galleyCss}</style>
<style>html{background:var(--gy-ground)} body{margin:0;padding:4vh 0} .galley{max-width:var(--gy-measure);margin-inline:auto;padding-inline:clamp(1rem,5vw,2rem)}</style>
</head><body>${body}</body></html>
`;
    writeFileSync(resolve(outDir, name), html, "utf8");
    links.push(`<li><a href="./${name}">${regName} / ${recipe}</a></li>`);
  }
}

writeFileSync(
  resolve(outDir, "index.html"),
  `<!doctype html><meta charset="utf-8"><title>galley permutations</title><h1>Register x recipe matrix</h1><ul>${links.join("")}</ul>`,
  "utf8",
);

console.log(`Wrote ${REGISTERS.length * RECIPES.length} permutations + index to ${outDir}`);
