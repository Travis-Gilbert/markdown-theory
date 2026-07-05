/**
 * Render the shelf over a directory of plain markdown files, proving G4's claim:
 * point `<Shelf>` at a folder and it reads as a personal blog with zero config.
 * Run: `pnpm demo:shelf`.
 */

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { emitCss, parchment } from "../src/tokens/index.js";
import { Shelf } from "../src/shelf/Shelf.js";
import { fsAdapter } from "../src/shelf/fsAdapter.js";

const here = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(here, "../dist");
mkdirSync(outDir, { recursive: true });

const register = parchment();
const shelf = fsAdapter(resolve(here, "../fixtures/notes"));
const body = renderToStaticMarkup(createElement(Shelf, { source: shelf, view: "stream" }));

const galleyCss = readFileSync(resolve(here, "../src/css/galley.css"), "utf8");
const tokensCss = emitCss(register, ":root");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>notes &middot; a galley shelf</title>
<style>${tokensCss}</style>
<style>${galleyCss}</style>
<style>
  html { background: var(--gy-ground); }
  body { margin: 0; padding: 6vh 0 12vh; }
  header.masthead { max-width: var(--gy-measure); margin: 0 auto var(--gy-space-5); padding-inline: clamp(1rem, 5vw, 2rem); }
  header.masthead h1 { font-family: var(--gy-font-prose); font-size: var(--gy-text-h2); color: var(--gy-ink); margin: 0; }
  header.masthead p { font-family: var(--gy-font-ui); font-size: var(--gy-text-small); color: var(--gy-ink-3); margin: 0; }
  .galley-shelf { padding-inline: clamp(1rem, 5vw, 2rem); }
</style>
</head>
<body>
<header class="masthead">
  <h1>Notes</h1>
  <p>Rendered by &lt;Shelf&gt; from a folder of plain markdown files &mdash; no config.</p>
</header>
${body}
</body>
</html>
`;

writeFileSync(resolve(outDir, "shelf-demo.html"), html, "utf8");
console.log(`Wrote ${outDir}/shelf-demo.html`);
