# markdown-theory

**Computational beauty.** markdown-theory makes your files read like a personal website or blog
rather than a pile of files: markdown to HTML, markdown to React, with output that is good by
construction. MIT licensed. Published as
[`@travis-gilbert/markdown-theory`](https://www.npmjs.com/package/@travis-gilbert/markdown-theory).

A markdown renderer whose default output looks like a **publication, not a folder of files**,
because beauty is _computed_, not themed. Point it at a markdown string, a directory, or a bundle
and it renders a page that is good by construction, including content nobody stopped to style. It is
a clean-room alternative to Quarkdown (GPL-3.0) and CodiMD (AGPL-3.0): those are visual references
only, no code, no CSS, no ported themes.

## The three claims

1. **Beauty is computed, not themed.** A proportion engine derives every token (type ramp, leading,
   rhythm, page shape, an OKLCH palette solved for WCAG AA) from ~7 axes. Components contain no
   literal values. Change one axis and the whole sheet re-derives.
2. **Documents have types, and types have recipes.** Frontmatter selects a layout recipe; an
   article, a note, and a reference page share tokens but not shape.
3. **Collections read like a publication.** Pointed at a folder or a bundle, the shelf renders a
   personal blog, not a file listing.

## Package shape

Subpath exports of `@travis-gilbert/markdown-theory`:

| Export                                      | What it is                                                              | Status |
| ------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| `@travis-gilbert/markdown-theory/tokens`    | The proportion engine. Framework-free; emits CSS custom properties.     | G1     |
| `@travis-gilbert/markdown-theory/css`       | The static stylesheet consuming those properties. Usable without React. | G2     |
| `@travis-gilbert/markdown-theory/fonts`     | Optional self-hosted faces (Vollkorn, IBM Plex Sans, JetBrains Mono).   | G8     |
| `@travis-gilbert/markdown-theory/react`     | Components. Server-safe; interactive nodes are islands.                 | G2     |
| `@travis-gilbert/markdown-theory/templates` | Type recipes and their registry (article, note, reference, log).        | G3     |
| `@travis-gilbert/markdown-theory/shelf`     | Collection views plus the adapter interface (fs, okf, theorem).         | G4     |
| `@travis-gilbert/markdown-theory/mdx`       | Optional, trusted-authors-only MDX entry.                               | G5     |

Parsing lives in the sibling
[`@travis-gilbert/markdown-spine`](https://www.npmjs.com/package/@travis-gilbert/markdown-spine)
package (MIT). Theorem is a downstream consumer, not the other way around.

## Install

```bash
npm install @travis-gilbert/markdown-theory react react-dom
```

The package ships compiled ESM (`.js` plus `.d.ts`), so it works out of the box in any modern
bundler or React framework: no `transpilePackages` and no JSX config required.

```tsx
import { Galley } from "@travis-gilbert/markdown-theory/react";
import { parchment } from "@travis-gilbert/markdown-theory/tokens";
import "@travis-gilbert/markdown-theory/css";

export default function Page({ doc }: { doc: string }) {
  return <Galley doc={doc} register={parchment()} />;
}
```

Or drive the engine directly:

```ts
import { generateRegister, emitCss, parchment } from "@travis-gilbert/markdown-theory/tokens";

const css = emitCss(parchment()); // a ready-to-use :root sheet
const custom = generateRegister({ ratio: 1.618, hue: 250 }); // re-derives everything
```

## The page, the ground, and fonts

`.galley` **is** the page: a measure-bounded, centered sheet with register-derived elevation. It
paints its own surface (`--gy-surface`); the host paints the ground behind it. One line does that:

```css
body {
  background: var(--gy-ground);
}
```

Embedding inside a host that already owns the page geometry (for example Compose Read)? Add the
`--bare` modifier to render edge-to-edge with no page chrome, so nothing double-pads:

```tsx
<Galley doc={doc} className="galley--bare" />
```

There are four font roles, each just a CSS custom property, so **you can plug in whatever font you
want** for any of them:

| Role                  | Token             | Default                   |
| --------------------- | ----------------- | ------------------------- |
| body prose            | `--gy-font-prose` | IBM Plex Sans             |
| masthead title        | `--gy-font-title` | Encode Sans Semi Expanded |
| ui (byline, captions) | `--gy-font-ui`    | IBM Plex Sans             |
| code                  | `--gy-font-mono`  | JetBrains Mono            |

Override per instance through the register, or globally in CSS by setting the token:

```ts
import { generateRegister, SERIF_PROSE } from "@travis-gilbert/markdown-theory/tokens";

// A serif reading body (Vollkorn was the previous default; it ships in galley/fonts):
const register = generateRegister({}, { fonts: { prose: SERIF_PROSE } });
```

```css
/* or purely in CSS -- swap any role without touching the engine */
.galley {
  --gy-font-prose: "Vollkorn", Georgia, serif;
  --gy-font-title: "Fraunces", serif;
}
```

Fonts are host-supplied by default (system-stack fallbacks, no network fetch). To self-host the
register's intended faces, install the `@fontsource` peers and import the fonts subpath (Vollkorn is
bundled too, so the serif opt-in needs no extra install):

```bash
npm install @fontsource/vollkorn @fontsource/encode-sans-semi-expanded \
  @fontsource/ibm-plex-sans @fontsource/jetbrains-mono
```

```tsx
// IBM Plex Sans (prose + ui), Encode Sans Semi Expanded (title), JetBrains Mono (mono), Vollkorn (opt-in serif)
import "@travis-gilbert/markdown-theory/fonts";
```

A consumer that skips this still renders acceptably on the system stacks.

## Figures

Images sit in the measure by default; the figure directives cover the rest:

```md
::figure{src="chart.png" caption="In the measure: framed, radiused, captioned."}
::figure{src="hero.png" width="bleed" caption="Breaks out to the page edges."}
::figure{src="side.png" align="right" width="40%" caption="Floated; text wraps."}
::compare{before="old.jpg" after="new.jpg" caption="Two panels, corner labels."}
```

`width="bleed"` (also `page`/`full`) drops the frame and spans the page edges while the caption
stays with the reading column. `::compare` is a two-up that stacks on a narrow measure and can
itself bleed; `beforelabel`/`afterlabel` override the default "Then"/"Now".

## Develop

```bash
pnpm install
pnpm test          # unit tests: re-derivation, the AA contrast gate, render surface, masthead, shelf
pnpm test:visual   # G7 Chromium gates: overflow, rendered AA, widows, page-object, heading-binding, snapshots
pnpm demo:tokens   # emits packages/galley/dist/{tokens.css, demo.html}
pnpm format        # prettier: printWidth 100, proseWrap always for markdown
```

## Provenance and naming

MIT. markdown-theory was built under the working codename **galley** (the tray that holds set type
before imposition: same set type, many pages); the internal package directory keeps that name.
Visual references (Quarkdown, CodiMD) are named for provenance only; no code derives from them.
