# markdown-theory

**Computational beauty.** markdown-theory makes your files read like a personal
website or blog rather than a pile of files: markdown to HTML, markdown to React,
with output that is good by construction. MIT licensed. Published as
[`@travisgilbert/markdown-theory`](https://www.npmjs.com/package/@travisgilbert/markdown-theory).

A markdown renderer whose default output looks like a **publication, not a folder
of files**, because beauty is *computed*, not themed. Point it at a markdown
string, a directory, or a bundle and it renders a page that is good by
construction, including content nobody stopped to style. 

## The three claims

1. **Beauty is computed, not themed.** A proportion engine derives every token
   (type ramp, leading, rhythm, page shape, an OKLCH palette solved for WCAG AA)
   from ~7 axes. Components contain no literal values. Change one axis and the
   whole sheet re-derives.
2. **Documents have types, and types have recipes.** Frontmatter selects a
   layout recipe; an article, a note, and a reference page share tokens but not
   shape.
3. **Collections read like a publication.** Pointed at a folder or a bundle, the
   shelf renders a personal blog, not a file listing.

## Package shape

Subpath exports of `@travisgilbert/markdown-theory`:

| Export | What it is | Status |
|---|---|---|
| `@travisgilbert/markdown-theory/tokens` | The proportion engine. Framework-free; emits CSS custom properties. | G1 |
| `@travisgilbert/markdown-theory/css` | The static stylesheet consuming those properties. Usable without React. | G2 |
| `@travisgilbert/markdown-theory/react` | Components. Server-safe; interactive nodes are islands. | G2 |
| `@travisgilbert/markdown-theory/templates` | Type recipes and their registry (article, note, reference, log). | G3 |
| `@travisgilbert/markdown-theory/shelf` | Collection views plus the adapter interface (fs, okf, theorem). | G4 |
| `@travisgilbert/markdown-theory/mdx` | Optional, trusted-authors-only MDX entry. | G5 |

Parsing lives in the sibling [`@travisgilbert/markdown-spine`](https://www.npmjs.com/package/@travisgilbert/markdown-spine)
package (MIT). Theorem is a downstream consumer, not the other way around.

## Install

```bash
npm install @travisgilbert/markdown-theory react react-dom
```

The package ships compiled ESM (`.js` plus `.d.ts`), so it works out of the box
in any modern bundler or React framework: no `transpilePackages` and no JSX
config required.

```tsx
import { Galley } from "@travisgilbert/markdown-theory/react";
import { parchment } from "@travisgilbert/markdown-theory/tokens";
import "@travisgilbert/markdown-theory/css";

export default function Page({ doc }: { doc: string }) {
  return <Galley doc={doc} register={parchment()} />;
}
```

Or drive the engine directly:

```ts
import { generateRegister, emitCss, parchment } from "@travisgilbert/markdown-theory/tokens";

const css = emitCss(parchment());                            // a ready-to-use :root sheet
const custom = generateRegister({ ratio: 1.618, hue: 250 }); // re-derives everything
```

## Develop

```bash
pnpm install
pnpm test          # 74 unit tests: re-derivation, the AA contrast gate, render surface, shelf
pnpm test:visual   # G7 browser gates in Chromium: overflow, rendered AA, widows, snapshots (169)
pnpm demo:tokens   # emits packages/galley/dist/{tokens.css, demo.html}
```

## Provenance and naming

MIT. markdown-theory was built under the working codename **galley** (the tray
that holds set type before imposition: same set type, many pages); the internal
package directory keeps that name. 
