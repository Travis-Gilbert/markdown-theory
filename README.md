# galley

A markdown renderer whose default output looks like a **publication, not a
folder of files** — because beauty is *computed*, not themed. MIT licensed.

Point it at a markdown string, a directory, or a bundle and it renders a page
that is good by construction, including content nobody stopped to style. It is a
clean-room alternative to Quarkdown (GPL-3.0) and CodiMD (AGPL-3.0): those are
visual references only — no code, no CSS, no ported themes.

## The three claims

1. **Beauty is computed, not themed.** A proportion engine derives every token
   — type ramp, leading, rhythm, page shape, an OKLCH palette solved for WCAG AA
   — from ~7 axes. Components contain no literal values. Change one axis and the
   whole sheet re-derives.
2. **Documents have types, and types have recipes.** Frontmatter selects a
   layout recipe; an article, a note, and a reference page share tokens but not
   shape.
3. **Collections read like a publication.** Pointed at a folder or a bundle, the
   shelf renders a personal blog, not a file listing.

## Package shape

| Export | What it is | Status |
|---|---|---|
| `galley/tokens` | The proportion engine. Framework-free; emits CSS custom properties. | **shipped (G1)** |
| `galley/css` | The static stylesheet consuming those properties. Usable without React. | G2 |
| `galley/react` | Components. Server-safe; interactive nodes are islands. | G2 |
| `galley/templates` | Type recipes and their registry (article, note, reference, log). | G3 |
| `galley/shelf` | Collection views plus the adapter interface (fs, okf, theorem). | G4 |
| `galley/mdx` | Optional, trusted-authors-only MDX entry. | G5 |

Parsing lives in the sibling `markdown-spine` package (MIT). Theorem is a
downstream consumer of galley, not the other way around.

## Try the engine now

```bash
pnpm install
pnpm test          # 25 tests: re-derivation, the AA contrast gate, color math
pnpm demo:tokens   # emits packages/galley/dist/{tokens.css, demo.html}
```

Open `packages/galley/dist/demo.html` — the same markup re-typesets across the
`parchment`, `substrate`, and `print` registers, and every value on the page is
derived from the engine.

```ts
import { generateRegister, emitCss, parchment } from "galley/tokens";

const css = emitCss(parchment());              // a ready-to-use :root sheet
const custom = generateRegister({ ratio: 1.618, hue: 250 }); // re-derives everything
```

## License and naming

MIT. The bare npm name `galley` is taken (v1.2.6); the published name will be
scoped (e.g. `@galley-md/galley`) — a one-token rename handled at packaging (G8).
Visual references (Quarkdown, CodiMD) are named for provenance; no code derives
from them.
