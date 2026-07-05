/**
 * Emit the three fixture registers as CSS and a self-contained demo page.
 *
 * This is a *preview* of what G2 (galley/css + galley/react) will render; the
 * typeset stylesheet below consumes only `var(--gy-*)` tokens (no literals bar
 * the hairline), so the page you see is entirely a projection of the engine.
 * Run: `pnpm demo:tokens`.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildShikiTheme, emitCss, parchment, print, substrate } from "../src/tokens/index.js";

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

// A minimal typeset preview. Every value is a token; the hairline is the one
// literal the spec permits, and it comes through --gy-hairline too.
const previewCss = `
* { box-sizing: border-box; }
html { background: var(--gy-ground); }
body {
  margin: 0;
  color: var(--gy-ink);
  font-family: var(--gy-font-prose);
  font-optical-sizing: var(--gy-optical-sizing);
  -webkit-font-smoothing: antialiased;
}
.toolbar {
  font-family: var(--gy-font-ui);
  font-size: var(--gy-text-small);
  font-feature-settings: var(--gy-feat-ui);
  display: flex; gap: 0.5rem; align-items: center;
  padding: 1rem clamp(1rem, 5vw, 3rem);
  color: var(--gy-ink-2);
  position: sticky; top: 0;
  background: var(--gy-ground);
  border-bottom: 1px solid var(--gy-hairline);
}
.toolbar button {
  font: inherit; cursor: pointer;
  color: var(--gy-ink-2);
  background: var(--gy-surface);
  border: 1px solid var(--gy-hairline);
  border-radius: 999px;
  padding: 0.25rem 0.75rem;
}
.toolbar button[aria-pressed="true"] { color: var(--gy-signal); border-color: var(--gy-signal); }
.toolbar .spacer { flex: 1; }

.page {
  max-width: var(--gy-measure);
  margin: 0 auto;
  padding: calc(var(--gy-page-margin-top) * 100vh / 4) 0 6rem;
  padding-inline: clamp(1rem, 5vw, 2rem);
}
article {
  font-size: var(--gy-text-body);
  line-height: var(--gy-leading-body);
  font-feature-settings: var(--gy-feat-prose);
  text-wrap: var(--gy-text-wrap-body);
  hanging-punctuation: var(--gy-hanging-punctuation);
  hyphens: var(--gy-hyphens);
}
article > * { margin: 0; }
article > * + * { margin-top: var(--gy-space-3); }

h1, h2, h3 {
  line-height: var(--gy-leading-heading);
  text-wrap: var(--gy-text-wrap-heading);
  font-weight: 640;
  letter-spacing: -0.011em;
}
h1 { font-size: var(--gy-text-h1); margin-top: var(--gy-space-2); }
h2 { font-size: var(--gy-text-h2); margin-top: var(--gy-space-5); }
h3 { font-size: var(--gy-text-h3); margin-top: var(--gy-space-4); }

.eyebrow {
  font-family: var(--gy-font-ui);
  font-size: var(--gy-text-caption);
  font-feature-settings: var(--gy-feat-ui);
  letter-spacing: 0.09em; text-transform: uppercase;
  color: var(--gy-signal);
}
.byline { font-family: var(--gy-font-ui); font-size: var(--gy-text-small); color: var(--gy-ink-3); }

.abstract {
  max-width: 54ch;
  color: var(--gy-ink-2);
  border-left: 2px solid var(--gy-hairline);
  padding-left: var(--gy-space-3);
}
.abstract .label {
  display: block;
  font-family: var(--gy-font-ui);
  font-size: var(--gy-text-caption);
  font-variant-caps: all-small-caps; letter-spacing: 0.06em;
  color: var(--gy-ink-3);
}

a { color: var(--gy-link); text-underline-offset: 0.15em; text-decoration-thickness: from-font; }

blockquote {
  font-size: var(--gy-text-h4);
  line-height: 1.35;
  color: var(--gy-ink);
  border: 0; padding-left: var(--gy-space-3);
  border-left: 3px solid var(--gy-signal);
}
blockquote .attr { display: block; font-family: var(--gy-font-ui); font-size: var(--gy-text-small); color: var(--gy-ink-3); margin-top: var(--gy-space-1); }

ul { padding-left: 1.2em; }
li + li { margin-top: var(--gy-space-1); }

figure { text-align: center; }
figure img { width: 68%; border-radius: 6px; border: 1px solid var(--gy-hairline); }
figcaption { font-family: var(--gy-font-ui); font-size: var(--gy-text-caption); color: var(--gy-ink-3); margin-top: var(--gy-space-1); }

code { font-family: var(--gy-font-mono); font-size: 0.92em; font-feature-settings: 'zero' 1; }
pre {
  background: var(--gy-top);
  border: 1px solid var(--gy-hairline);
  border-radius: 8px;
  padding: var(--gy-space-3);
  overflow-x: auto;
  font-size: var(--gy-text-small);
  line-height: 1.55;
}
hr { border: 0; border-top: 1px solid var(--gy-hairline); margin-block: var(--gy-space-5); }
`;

const article = `
<div class="toolbar" role="group" aria-label="Register">
  <strong style="font-family: var(--gy-font-ui); color: var(--gy-ink);">galley</strong>
  <span class="spacer"></span>
  <button data-reg="" aria-pressed="true">parchment</button>
  <button data-reg="gy-substrate" aria-pressed="false">substrate</button>
  <button data-reg="gy-print" aria-pressed="false">print</button>
</div>
<main class="page">
  <article>
    <p class="eyebrow">Computed Typography</p>
    <h1>Beauty is computed, not themed</h1>
    <p class="byline">A demonstration page &middot; every value below is derived from seven axes</p>
    <div class="abstract">
      <span class="label">Abstract</span>
      This entire page holds no color, size, or spacing literal. A proportion
      engine reads a handful of axes &mdash; base size, scale ratio, measure, a
      surface hue, and accent hues &mdash; and derives the type ramp, the leading,
      the vertical rhythm, and an <a href="#">OKLCH palette solved for WCAG&nbsp;AA</a>
      at every size pairing. Change one axis and the whole sheet re-derives.
    </div>
    <p>
      The classic reading page earns its calm from proportion, not decoration.
      Line length sets leading; leading sets rhythm; rhythm sets the gaps between
      every block. When those relationships are computed rather than typed by
      hand, a document is good by construction &mdash; including the documents
      nobody stopped to style.
    </p>
    <h2>The register carries the code, too</h2>
    <p>
      A syntax theme generated from the same ladders keeps code blocks on brand
      instead of importing a foreign palette:
    </p>
    <pre><code>export function generateRegister(axes) {
  const ramp = buildRamp(axes);        // size[i] = base * ratio^i
  const palette = solvePalette(axes);  // OKLCH, AA-gated
  if (palette.unsolvable) throw new RegisterContrastError();
  return { ramp, palette, rhythm, page };
}</code></pre>
    <blockquote>
      The primitives a typesetting compiler used to fake are now in the engine.
      <span class="attr">&mdash; HANDOFF-GALLEY</span>
    </blockquote>
    <h3>What falls out of the axes</h3>
    <ul>
      <li>A quarter-pixel type ramp from step &minus;2 through 5.</li>
      <li>Leading solved against the measure and clamped to a reading band.</li>
      <li>A warm ink ladder and a surface ladder, one hue, fixed lightness steps.</li>
      <li>Signal and link hues, each darkened until they clear AA on every surface.</li>
    </ul>
    <hr />
    <p class="byline">Toggle the register above to watch the same markup re-typeset.</p>
  </article>
</main>
`;

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>galley &middot; computed typography</title>
<style>${tokensCss}</style>
<style>${previewCss}</style>
</head>
<body>
${article}
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
