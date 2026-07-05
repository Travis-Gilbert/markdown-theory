# galley

A standalone, MIT-licensed markdown renderer whose beauty is **computed, not
themed**. Clean-room alternative to Quarkdown (GPL-3.0) and CodiMD (AGPL-3.0):
those are visual references only — never dependencies, no ported code or CSS.

This file is the navigation map. Read it first. Order of truth: this map, then
the code, then the specs in `Specs/` (specs lag code). Update this file when a
package or deliverable lands.

**Relationship to Theorem:** Theorem is a *downstream consumer* of galley, not a
parent. Some spec text references Theorem because it will embed galley (Compose
Read mode, the OKF bundle reader). Everything in this repo is standalone and
Theorem-free at runtime. Do not add a Theorem dependency here.

## Tech stack

TypeScript (strict, ESNext, bundler resolution), React 19 (for `galley/react`),
pnpm workspace monorepo, vitest, Node >= 20. No build framework yet; tsx runs
scripts, vitest runs tests off source. Fonts are host-supplied (system-stack
fallbacks by default): Vollkorn prose, IBM Plex Sans UI, JetBrains Mono code.

## Repository layout

| Path | What it is |
|------|------------|
| `packages/galley/` | The renderer. Subpath exports: `tokens` (shipped), `css`, `react`, `templates`, `shelf`, `mdx`. |
| `packages/galley/src/tokens/` | **G1 proportion engine** (shipped): axes -> Register -> CSS custom properties. See below. |
| `packages/galley/scripts/emit-demo.ts` | `pnpm demo:tokens`: emits `dist/{tokens.css, demo.html, shiki-*.json}` + AA receipts. |
| `packages/markdown-spine/` | The remark parse pipeline (MIT), galley's mdast input. **Shipped**: `parseDocument` -> `{ frontmatter, tree, blocks }`; `remarkSpine` normalizes the directive vocabulary + GitHub/Obsidian callouts into `node.data.spine` (annotation only, never mutates node types); FNV-1a content-hash block ids. |
| `scripts/lint-literals.mjs` | `pnpm lint:literals`: the no-literals oracle over `galley/react` + `galley/css`. |
| `Specs/` | The four handoff specs. GALLEY is the one this repo builds; the others are consumer-side context. |
| `docs/plan/galley-build-checklist.md` | The full build checklist (definition of done). |

## The G1 proportion engine (`packages/galley/src/tokens/`)

The keystone. `generateRegister(axes)` derives everything; nothing downstream
holds a literal. Modules:

| File | Role |
|------|------|
| `types.ts` | `Axes` (7 inputs), `Register` (all outputs), `RegisterContrastError`. |
| `color.ts` | OKLCH <-> sRGB, WCAG contrast, APCA (advisory). Dependency-free. |
| `scale.ts` | Type ramp (`base * ratio^i`, quarter-pixel), leading solve (f of size & measure), rhythm. |
| `page.ts` | Van de Graaf 2:3:4:6 page margins, screen-adapted (content optically high). |
| `palette.ts` | OKLCH ladders + the **AA contrast solver**. Ink ladder anchors ends, interpolates the middle. |
| `detailing.ts` | OpenType features, text-wrap, hanging punctuation, hyphenation defaults. |
| `shiki.ts` | A Shiki theme derived from the same ladders (so code matches the register). |
| `register.ts` | `generateRegister` orchestration + the contrast gate (throws if unsolvable). |
| `emit.ts` | `Register -> --gy-*` CSS custom properties. |
| `fixtures.ts` | `parchment` (light), `substrate` (dark), `print`. |

**Load-bearing invariants**
- No color/size/spacing literal in `galley/react` or `galley/css` (hairline
  excepted, via `--gy-hairline`). Enforced by `pnpm lint:literals`.
- Every register passes WCAG AA on every generated pairing, or `generateRegister`
  throws `RegisterContrastError` at generation time — an inaccessible register
  never ships.
- The engine reasons in OKLCH but gates contrast in sRGB (WCAG is defined there).
- Token prefix is `--gy-`.

## Build & dev commands

```bash
pnpm install
pnpm test            # vitest (packages/**/*.test.ts)
pnpm typecheck       # tsc --noEmit
pnpm lint:literals   # no-literals oracle
pnpm demo:tokens     # emit dist/{tokens.css, demo.html} + AA contrast receipts
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
  + `remarkSpine` normalization + block ids.
- **G2 render surface: shipped (core).** `galley/react` `<Galley>` (mdast -> hast -> React,
  spine-aware handlers, overridable components, Shiki code + KaTeX math, 3 islands) +
  `galley/css` token-only stylesheet. `pnpm demo:render` -> `dist/render-demo.html`.
- **G3 type recipes: shipped.** `galley/templates` declarative recipe registry (article/note/
  reference/log + register/resolve, unknown -> article + chip); `<Galley template>` applies
  class + ramp offset + ToC/heading-slugs + standfirst/author apparatus.
- **G4 shelf: shipped.** `galley/shelf` adapter interface + arrayAdapter/fsAdapter/okfAdapter/
  theoremAdapter; `<Shelf>` stream/archive/tag/thread views; `successorOf`. `pnpm demo:shelf`.
- **G5 extension boundary: shipped.** `<Galley views>` host registry resolves `::embed`/`:::view`
  live (else fallback+chip); `galley/mdx` `renderMDX` trusted-input-only.
- **74 tests green total** (25 tokens + 13 spine + 11 react + 10 templates + 11 shelf + 4 extension), typecheck + lint clean.
- All three headline claims stand: computed beauty (G1), types+recipes (G3), collections-as-publication (G4).
- **Remaining (env-blocked / product-direction):** **G7** browser robustness gates (needs a real browser;
  Playwright here has no system Chrome), **G8** packaging + showcase site (publish scope decision + a Vite app).
- Full plan: `docs/plan/galley-build-checklist.md`.
