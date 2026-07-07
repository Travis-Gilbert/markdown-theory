# galley

A standalone, MIT-licensed markdown renderer whose beauty is **computed, not themed**. Clean-room
alternative to Quarkdown (GPL-3.0) and CodiMD (AGPL-3.0): those are visual references only — never
dependencies, no ported code or CSS.

This file is the navigation map. Read it first. Order of truth: this map, then the code, then the
specs in `Specs/` (specs lag code). Update this file when a package or deliverable lands.

**Relationship to Theorem:** Theorem is a _downstream consumer_ of galley, not a parent. Some spec
text references Theorem because it will embed galley (Compose Read mode, the OKF bundle reader).
Everything in this repo is standalone and Theorem-free at runtime. Do not add a Theorem dependency
here.

## Tech stack

TypeScript (strict, ESNext, bundler resolution), React 19 (for `galley/react`), pnpm workspace
monorepo, vitest, Node >= 20. No build framework yet; tsx runs scripts, vitest runs tests off
source. Fonts are four overridable `--gy-font-*` roles, host-supplied with system-stack fallbacks:
IBM Plex Sans prose + UI, Encode Sans Semi Expanded title, JetBrains Mono code; Vollkorn ships as an
opt-in serif (`SERIF_PROSE`).

## Repository layout

| Path                                   | What it is                                                                                                                                                                                                                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/galley/`                     | The renderer. Subpath exports: `tokens` (shipped), `css`, `react`, `templates`, `shelf`, `mdx`.                                                                                                                                                                                                         |
| `packages/galley/src/tokens/`          | **G1 proportion engine** (shipped): axes -> Register -> CSS custom properties. See below.                                                                                                                                                                                                               |
| `packages/galley/scripts/emit-demo.ts` | `pnpm demo:tokens`: emits `dist/{tokens.css, demo.html, shiki-*.json}` + AA receipts.                                                                                                                                                                                                                   |
| `packages/markdown-spine/`             | The remark parse pipeline (MIT), galley's mdast input. **Shipped**: `parseDocument` -> `{ frontmatter, tree, blocks }`; `remarkSpine` normalizes the directive vocabulary + GitHub/Obsidian callouts into `node.data.spine` (annotation only, never mutates node types); FNV-1a content-hash block ids. |
| `scripts/lint-literals.mjs`            | `pnpm lint:literals`: the no-literals oracle over `galley/react` + `galley/css`.                                                                                                                                                                                                                        |
| `Specs/`                               | The four handoff specs. GALLEY is the one this repo builds; the others are consumer-side context.                                                                                                                                                                                                       |
| `docs/plan/galley-build-checklist.md`  | The full build checklist (definition of done).                                                                                                                                                                                                                                                          |

## The G1 proportion engine (`packages/galley/src/tokens/`)

The keystone. `generateRegister(axes)` derives everything; nothing downstream holds a literal.
Modules:

| File           | Role                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------- |
| `types.ts`     | `Axes` (7 inputs), `Register` (all outputs), `RegisterContrastError`.                         |
| `color.ts`     | OKLCH <-> sRGB, WCAG contrast, APCA (advisory). Dependency-free.                              |
| `scale.ts`     | Type ramp (`base * ratio^i`, quarter-pixel), leading solve (f of size & measure), rhythm.     |
| `page.ts`      | Van de Graaf 2:3:4:6 page margins, screen-adapted (content optically high).                   |
| `palette.ts`   | OKLCH ladders + the **AA contrast solver**. Ink ladder anchors ends, interpolates the middle. |
| `detailing.ts` | OpenType features, text-wrap, hanging punctuation, hyphenation defaults.                      |
| `shiki.ts`     | A Shiki theme derived from the same ladders (so code matches the register).                   |
| `register.ts`  | `generateRegister` orchestration + the contrast gate (throws if unsolvable).                  |
| `emit.ts`      | `Register -> --gy-*` CSS custom properties, incl. the page object (pads, elevation, tint).    |
| `fixtures.ts`  | `parchment` (light), `substrate` (dark), `print`.                                             |

**Load-bearing invariants**

- No color/size/spacing literal in `galley/react` or `galley/css` (hairline excepted, via
  `--gy-hairline`). Enforced by `pnpm lint:literals`.
- Every register passes WCAG AA on every generated pairing, or `generateRegister` throws
  `RegisterContrastError` at generation time — an inaccessible register never ships.
- The engine reasons in OKLCH but gates contrast in sRGB (WCAG is defined there).
- Token prefix is `--gy-`.

## Build & dev commands

```bash
pnpm install
pnpm test            # vitest (packages/**/*.test.ts)
pnpm typecheck       # tsc --noEmit
pnpm lint:literals   # no-literals oracle
pnpm demo:tokens     # emit dist/{tokens.css, demo.html} + AA contrast receipts
pnpm test:visual     # G7 Chromium gates (overflow, AA, widows, page-object, heading-binding, snapshots)
pnpm format          # prettier: printWidth 100, proseWrap always for markdown
```

## Conventions

- No root Cargo/anything — this is a pnpm workspace; `-F <pkg>` or run scripts at root.
- No emojis in code/docs. No em/en dashes (use colons, parens, semicolons).
- No time/effort estimates in plans or reports.
- Fonts are host-supplied; never fetch Google Fonts at runtime.
- Publish name is scoped (`galley` bare is taken on npm); that is a G8 concern.

## Status

- **G1 proportion engine: shipped.** Re-derivation, AA gate on all three registers,
  unsolvable-register throw, OKLCH/WCAG/APCA math.
- **markdown-spine: shipped.** remark pipeline (parse/gfm/frontmatter/math/directive)
  - `remarkSpine` normalization + block ids.
- **G2 render surface: shipped (core).** `galley/react` `<Galley>` (mdast -> hast -> React,
  spine-aware handlers, overridable components, Shiki code + KaTeX math, 3 islands) + `galley/css`
  token-only stylesheet. `pnpm demo:render` -> `dist/render-demo.html`.
- **G3 type recipes: shipped.** `galley/templates` declarative recipe registry (article/note/
  reference/log + register/resolve, unknown -> article + chip); `<Galley template>` applies class +
  ramp offset + ToC/heading-slugs + standfirst/author apparatus.
- **G4 shelf: shipped.** `galley/shelf` adapter interface + arrayAdapter/fsAdapter/okfAdapter/
  theoremAdapter; `<Shelf>` stream/archive/tag/thread views; `successorOf`. `pnpm demo:shelf`.
- **G5 extension boundary: shipped.** `<Galley views>` host registry resolves `::embed`/`:::view`
  live (else fallback+chip); `galley/mdx` `renderMDX` trusted-input-only.
- **Page object (HANDOFF-GALLEY-PAGE): shipped.** `.galley` IS the page (bounded, centered,
  register-differentiated elevation), `.galley--bare` opts out; the canon is spent into
  `--gy-page-pad-*`/`--gy-shadow` in `emit.ts`. Composed frontmatter masthead
  (`.galley-titleblock`). Railless callouts + tinted inline code (`--gy-tint`, `--gy-radius-sm`); no
  colored rails on callouts/boxes. Heading binding + the article paper kit (booktabs, print-context
  justify). Real fonts via `galley/fonts` (@fontsource) with system-stack fallback default.
- **G7 gates: wired as blockers.** `pnpm test:visual` (Chromium) runs overflow, rendered AA, widows,
  **page-object present**, and **heading-binding** as OS-independent CI blockers; pixel snapshots
  (register x recipe + MIT-News fixture) are a local per-OS check.
- **230 unit tests green** + G7 visual suite green (439), typecheck + lint + `pnpm build` clean.
- All three headline claims stand: computed beauty (G1), types+recipes (G3),
  collections-as-publication (G4).
- **Remaining (product-direction):** **G8** packaging + showcase site (publish scope + a Vite app);
  an optional `paper`/Computer-Modern register fixture (skipped pending GUST-license verification).
- Full plan: `docs/plan/galley-build-checklist.md`; remediation:
  `docs/plan/galley-page-remediation-checklist.md`.
