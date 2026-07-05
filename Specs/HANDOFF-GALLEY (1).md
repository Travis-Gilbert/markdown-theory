# HANDOFF-GALLEY

The standalone markdown renderer. Builds on HANDOFF-COMPOSE-SURFACE (D3 markdown-spine, D8 typeset) and HANDOFF-COMPOSE-OKF (F4 bundle reader, F5 HTML export). Working name `galley`: the tray that holds set type before imposition. Same set type, many pages. Rename is one token.

## Intent

A publishable, MIT-licensed React markdown renderer whose default output rivals Quarkdown and CodiMD without a line of their code. Three claims define it:

1. Beauty is computed, not themed. A proportion engine derives every token from a handful of axes; components contain no literal values. Every page is good by construction, including content nobody curated.
2. Documents have types, and types have recipes. Frontmatter selects a layout recipe; an article, a note, and a reference page share tokens but not shape.
3. Collections read like a publication. Pointed at a folder, an OKF bundle, or a Theorem tenant's memory, the shelf renders a personal blog, not a file listing.

License wall: Quarkdown is GPL-3.0 (verified against the repo, July 2026) and CodiMD is AGPL-3.0. Both are visual references only. No code, no CSS, no ported theme files. Galley ships MIT.

Why now: `text-box-trim`/`text-box-edge` (Chrome/Edge 133+, Safari 18.2+) makes baseline arithmetic true by trimming the leading band, and `text-wrap: pretty` (Chrome/Edge 117+, Safari 26+) plus `balance` handle rags and orphans natively. Firefox falls back gracefully on both. The `lh` unit carries vertical rhythm. The primitives a typesetting compiler used to fake are in the engine.

## Governing principle

The renderer is a pure projection of mdast plus tokens. Nothing in `galley/react` or `galley/css` contains a color, a size, or a spacing literal (hairlines excepted); everything derives from the register the proportion engine emits. Interactivity enters only through the registered component boundary. One renderer serves Compose Read, the OKF bundle reader, the styled HTML export, and the docs site; divergence between those surfaces is a bug.

## Package shape

`packages/galley`, published MIT, subpath exports:

- `galley/tokens`: the proportion engine, framework-free, emits CSS custom properties.
- `galley/css`: the static stylesheet consuming those properties. Usable without React: plain HTML plus class names (the HTML export path, email path, and any rehype user).
- `galley/react`: components. Server-safe; interactive nodes are islands.
- `galley/templates`: the type recipes and their registry.
- `galley/shelf`: collection views plus the adapter interface.
- `galley/mdx`: optional, trusted-authors-only MDX entry.

Parsing stays in `packages/markdown-spine` (published alongside, MIT). Galley consumes its mdast; the directive vocabulary of record is the D3 list. The D9 Typst crate remains the PDF path; galley hands it mdast and never grows a second PDF pipeline.

## Deliverables

### G1. Proportion engine
Build: `galley/tokens`. `generateRegister(axes) -> Register` where axes are: base size (default 17px), scale ratio (default 1.2 minor third; 1.25, 1.333, 1.414, 1.618 selectable), measure (default 68ch, clamped 45 to 75), hue and chroma seeds, mode (light, dark, print), density (reading, reference). Derivations, and the shape of each is the requirement even where a constant gets tuned:

- Type ramp: `size[i] = base * ratio^i` for steps -2 through 5, snapped to quarter-pixel.
- Leading solve: line-height as a function of size and measure, wider measure and smaller size increase it, clamped to the 1.3 to 1.75 band; headings at 1.15 with `text-box: trim-both cap alphabetic`.
- Rhythm: the spacing unit is `0.5lh`; all block margins are expressed in `lh` units so changing leading re-derives every gap.
- Page shape: typeset margins from a Van de Graaf-derived 2:3:4:6 proportion adapted to viewport; on screen, content sits optically high.
- Color: OKLCH ladders. One surface hue with fixed lightness steps (ground, surface at plus one step, top at plus two: the surface-step rule generalized), a warm near-neutral ink ladder, signal and link hues taken from the axes. A contrast solver adjusts ink lightness until WCAG AA passes at every generated size pairing, with APCA reported as advisory; an unsolvable register throws at generation time, never ships.
- Detailing defaults baked into the emitted properties: `font-optical-sizing: auto`, oldstyle numerals in prose and tabular in tables, `text-wrap: pretty` on body, `balance` on headings of four lines or fewer, `hanging-punctuation` where supported, `hyphens: auto` when measure is narrow or text justified.
- A syntax-highlight theme is generated from the same ladders and handed to Shiki, so code blocks match the register instead of shipping a foreign theme.

Ships three registers as fixtures: `parchment` (the compose light values resolve as one point in axis space), `substrate` (dark), `print`.
Acceptance: changing base or ratio re-derives the entire sheet; grep of `galley/react` and `galley/css` finds no hex, no px sizes, no rem literals outside the token file and hairlines; the contrast gate fails a deliberately low-chroma register in CI.

### G2. Render surface and detailing
Build: `galley/react` and `galley/css`. `<Galley doc={mdast|string} register components? template?>` rendering the full D3 vocabulary: CommonMark, GFM, frontmatter, math (KaTeX default, MathML output behind a flag), callouts in both GitHub and directive syntax, footnotes as Tufte sidenotes at wide viewports and inline collapses below (the D8 rule), figures with percentage inline-size and small sans captions, pull-quote blockquotes with attribution, task lists, tables with tabular numerals. Code via Shiki with the G1 generated theme and JetBrains Mono at the compose weight default. Every node type maps to an overridable component (the safe interactivity level); the default set is server-renderable with three shipped islands: code copy, footnote popover, image lightbox.
Acceptance: the MIT News fixture from D8 renders visually equivalent through `<Galley>`; a dozen uncurated READMEs pulled from popular repos render with zero horizontal overflow, zero AA contrast failures, and no single-word last lines in any of the three registers (the standardize-away claim, tested on content nobody styled).

### G3. Type recipes
Build: `galley/templates`. A recipe is a declarative object over tokens (column plan, ramp offsets, apparatus toggles, card shape), never freeform CSS. Registry keyed by frontmatter `type` or memory `kind`, open for registration. Core four:

- `article`: the Quarkdown-class page. Optional numbered headings, `.abstract` block with small-caps label and narrowed measure, floated figures, attributed pull quotes, page-margin author line.
- `note`: the memory atom. Gist as a standfirst line under the title, quieter heading ramp, kind and tags as ink-2 apparatus, dates right-aligned.
- `reference`: docs density. One ramp step down, persistent table of contents from the heading tree, anchor affordances, definition-list styling.
- `log`: a timeline recipe for OKF `log.md` and supersession histories, date-grouped.

Unknown types fall back to `article` with a quiet chip, mirroring the OKF unknown-type rule. The OKF concept header from HANDOFF-COMPOSE-OKF F3 renders here when frontmatter carries `type`.
Acceptance: the same markdown body rendered under `article` and `note` differs in shape but shares every token; registering a custom recipe requires no CSS authoring; an OKF concept renders with its header under whichever recipe its type maps to.

### G4. Shelf
Build: `galley/shelf`. `<Shelf source>` over an adapter interface `{ list(scope), get(id), edges?(id) }` with three adapters: `fs` (a directory of markdown files), `okf` (a parsed bundle, giving F4 its data layer), `theorem` (tenant memory through the console's existing read path, items being memory documents with gist, kind, tags, dates, and typed edges). Views: stream (reverse-chronological cards, card shape per kind recipe, gist as the deck line), archive (year and month grouping), tag and project lenses, and thread (follows `MEMORY_SUPERSEDES` into a revision lineage rendered as "revised from" chains and `MEMORY_RELATES` into a "connected" footer, so browsing memory has continuity instead of adjacency). Reading chrome: previous and next within the active lens, position marker, no counts and no badges per the compose quiet rules.
Acceptance: `<Shelf source={fs('./notes')}>` over thirty plain markdown files reads as a credible personal blog with zero configuration; the theorem adapter over a live tenant renders self_notes, solutions, and postmortems with distinct card shapes; opening a superseded document surfaces its successor at the top.

### G5. Extension boundary
Build: the directive-to-registry binding and the MDX door. `::embed{view ...}` and `:::view` resolve against a host-injected registry compatible with the ViewDescriptor contract; standalone consumers get the three G2 islands as the default registry; unknown views render fallback body plus a quiet chip (the D6 rule verbatim). `galley/mdx` exposes `renderMDX(source, components)` for developer-authored pages, documented as trusted-input-only in red letters; user content never routes through it. The import boundary from the compose named decision holds: JSX mapping to registered views converts to directives, the rest is preserved fenced.
Acceptance: a Theorem host renders a live ledger embed through the same document a standalone consumer renders as fallback-plus-chip; the docs site renders an MDX page with a custom component; no code path feeds user memory content into `renderMDX`.

### G6. Consolidation
Build: swap the consumers. Compose Read mode renders through `<Galley>` with the compose register and the app registry; `typeset.css` becomes `galley/css` (D8's classes preserved, file moves, one import changes); the OKF bundle reader's center pane (F4) and the styled HTML export (F5) consume galley; the theoremharness.com docs pages render through it. The D7 stamp and Mermaid force renderer registers as a galley view rather than a special case.
Acceptance: the D8, F4, and F5 acceptance lines all still pass with galley underneath; a visual diff of Compose Read before and after the swap shows only intended changes; deleting the pre-galley read renderer leaves zero dead imports.

### G7. Quality gates
Build: the fixture and CI suite. MIT News parity (inherited), the uncurated-README robustness suite from G2, register permutation snapshots (three registers by four recipes by two viewports), the contrast gate from G1, and the overflow lint from the compose pretext ideas measuring rendered blocks against their containers. Balanced pull quotes use `text-wrap: balance` in static render; the pretext `walkLineRanges` path stays reserved for app contexts per the compose spec, and this handoff does not build the canvas path.
Acceptance: CI runs the full matrix headless and fails on any overflow, contrast, or orphan regression; snapshot churn requires an intentional token change to explain it.

### G8. Packaging and showcase
Build: npm publish of `galley` and `markdown-spine` under MIT with license provenance notes (visual references named, no derived code), OFL font subsetting strategy documented (system-stack fallback in `galley/css` by default, host opts into embedded fonts), README with the claims inventory only (computed registers, type recipes, shelf, the robustness suite results), and a showcase route on theoremharness.com: the MIT News fixture, a live register-axis playground (drag ratio and hue, watch the page re-derive), and the blog-of-memory demo rendering a seeded tenant through the theorem adapter. The /okf page's bundle reader links here as "the renderer is a standalone MIT package."
Acceptance: `npm i galley` in a fresh Vite React app renders a markdown string beautifully in under ten lines; the playground demonstrates a full re-derivation from one axis change; the showcase deploys with the marketing site.

## Out of scope, stated so nobody descopes into it accidentally

Slides doctype (Quarkdown's `slides`): not this handoff, and not a silent stretch goal; if wanted it is its own spec. PDF: D9 owns it. A canvas or paged screen preview: reserved per compose. WYSIWYG editing: Compose owns the editor; galley renders.

## Verify first

- npm name availability for `galley` and `markdown-spine`; scope under the org if bare names are taken, the name is one token.
- The exact ViewDescriptor registry export the block-view work ships, so G5 binds to the real contract.
- Shiki theme-from-tokens: confirm the JSON theme surface accepts the generated ladder cleanly, else emit a textmate theme file from the same values.
- KaTeX CSS weight in the standalone bundle; if it dominates, gate math styles behind first use.
- RSC boundaries: which subpath exports need `use client` and whether the islands pattern survives the host's bundler matrix (Vite, Next).
- The theorem adapter's read path: console GraphQL versus the documents-since watermark surface; use whichever F2 wired, one adapter, no parallel query shape.
- `lh` unit inside CSS custom property math across the browser matrix; where it fails in a calc, precompute in the token generator.

## Where it lands

One published renderer behind every reading surface, a token sheet that computes itself, four shapes of document, and a shelf that makes a memory look like a body of work. The five-minute test: point `<Shelf>` at your own tenant, scroll last month's notes as a blog, open a solution and see it typeset like a paper, drag the ratio slider and watch the whole publication re-derive without a single style breaking.
