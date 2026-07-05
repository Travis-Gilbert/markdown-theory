/**
 * Render a real document through <Galley> to a standalone HTML page, proving the
 * full G2 path: markdown-spine -> hast -> React -> static HTML, with a live
 * Shiki highlighter (G1 theme) and KaTeX math, styled by the token sheet +
 * galley/css. Run: `pnpm demo:render`.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { emitCss, parchment } from "../src/tokens/index.js";
import { createGalleyHighlighter, Galley } from "../src/react/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const outDir = resolve(here, "../dist");
mkdirSync(outDir, { recursive: true });

const doc = `---
type: article
title: Beauty is computed
---

# Beauty is computed, not themed

:::abstract
This page was rendered by \`<Galley>\`: markdown parsed by the spine, projected
to React, styled entirely by computed tokens. No value below is a literal.
:::

The reading page earns its calm from proportion. Line length sets leading;
leading sets rhythm; rhythm sets every gap. See the [engine](https://example.com).

:::note
Callouts written as \`:::note\` and as GitHub \`> [!NOTE]\` render the same component.
:::

> [!warning]
> A warning callout, authored in GitHub syntax, normalized by the spine.

## Code matches the register

\`\`\`ts
export function generateRegister(axes: Axes): Register {
  const ramp = buildRamp(axes);
  const palette = buildPalette(axes); // OKLCH, AA-gated
  return { ramp, palette, rhythm, page };
}
\`\`\`

## A little of everything

| Register | Min contrast | Primary ink |
|---|---|---|
| parchment | 3.97:1 | 10:1 |
| substrate | 4.45:1 | 8.5:1 |

- [x] type ramp
- [x] AA contrast solver
- [ ] your feedback

Euler's identity, $e^{i\\pi} + 1 = 0$, inline; and displayed:

$$\\int_{-\\infty}^{\\infty} e^{-x^2}\\,dx = \\sqrt{\\pi}$$

::figure{src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='320' height='140'%3E%3Crect width='320' height='140' fill='%23e9e4d8'/%3E%3Ctext x='160' y='78' font-family='sans-serif' font-size='16' fill='%236e675c' text-anchor='middle'%3Efigure%3C/text%3E%3C/svg%3E" width="60%" caption="A figure, sized and captioned from directive attributes."}

:::embed{view="ledger" query="kind:task status:open"}
A live ledger would render here in a host; standalone shows this fallback.
:::

> The primitives a typesetting compiler used to fake are in the engine.
`;

const register = parchment();
const highlighter = await createGalleyHighlighter(register, ["ts"]);
const body = renderToStaticMarkup(
  createElement(Galley, { doc, register, highlighter }),
);

const galleyCss = readFileSync(resolve(here, "../src/css/galley.css"), "utf8");
const katexCss = readFileSync(require.resolve("katex/dist/katex.min.css"), "utf8");
const tokensCss = emitCss(register, ":root");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>galley &middot; rendered by &lt;Galley&gt;</title>
<style>${tokensCss}</style>
<style>${katexCss}</style>
<style>${galleyCss}</style>
<style>
  html { background: var(--gy-ground); }
  body { margin: 0; padding: 4vh 0 12vh; }
  .galley { max-width: var(--gy-measure); margin-inline: auto; padding-inline: clamp(1rem, 5vw, 2rem); }
</style>
</head>
<body>
${body}
</body>
</html>
`;

writeFileSync(resolve(outDir, "render-demo.html"), html, "utf8");
console.log(`Wrote ${outDir}/render-demo.html (${(html.length / 1024).toFixed(0)} KB)`);
