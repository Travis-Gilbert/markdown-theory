# HANDOFF-GALLEY-PAGE remediation checklist

Definition of done for the page-object remediation. Every box traces to a punch item (P1-P8) or a
named decision in `~/Downloads/HANDOFF-GALLEY-PAGE.md`. CSS + render-layer + gate-enforcement only;
the proportion engine's math is untouched except to emit new tokens.

## Named decisions (invariants after this lands)

- [ ] The page is an object and it is the default: `.galley` alone produces the page;
      `.galley--bare` opts out (embedding contexts supply their own page).
- [ ] Radius is not a brand element: `--gy-radius-sm` (hairline-adjacent, 2-3px, derived + capped);
      existing radii reserved for cards and pre only; nothing inline is a pill.
- [ ] Kind is expressed through the label, not colored rails: zero `border-left` colored rails on
      callouts/boxes after this lands.

## P1 Spend the canon: the page object

- [ ] `emitRegisterVars` emits `--gy-page-pad-inline` (clamped, canon-derived),
      `--gy-page-pad-block-start/end` (top < bottom, content optically high).
- [ ] `emitRegisterVars` emits `--gy-shadow` + `--gy-page-border`, register- differentiated
      (parchment/print = hairline perimeter + faint two-layer shadow; substrate = surface step
      alone, shadow `none`).
- [ ] `.galley` renders the page: surface bg, `max-inline-size: calc(measure +     2*pad-inline)`,
      centered, block/inline pads, elevation.
- [ ] `.galley--bare` renders edge-to-edge (no max-inline-size, pad, elevation).
- [ ] Orphaned `.galley-page` deleted; host ground rule documented; demos set
      `body { background: var(--gy-ground) }`.
- [ ] Acceptance: bounded page on a distinct ground 360->2560; prose never touches the edge; ground
      gap above < below; `--bare` is edge-to-edge.

## P2 Title block

- [ ] `<Galley>` composes frontmatter (title, byline/author, date, standfirst/description) into
      `.galley-titleblock` (title h1-scale, meta ui font small, hairline rule below,
      abstract/standfirst slot).
- [ ] Article recipe centers the block; note/reference start-aligned.
- [ ] A body h1 with no frontmatter still gets masthead spacing (space-6).
- [ ] Acceptance: frontmatter title+author -> composed masthead; stripped -> still opens with
      settled space, not a flush title.

## P3 Callout redesign

- [ ] Remove the left rail and the ground-colored box; background one surface step (`--gy-top`),
      full hairline perimeter at `--gy-radius-sm`.
- [ ] Small-caps label in the kind color (link for note/tip, signal for warning/danger, ink-3 for
      quote); body ink at body size.
- [ ] Acceptance: railless callout with small-caps colored label; zero `border-left` on
      callouts/boxes (plain blockquote hairline may remain).

## P4 Inline code as highlight

- [ ] `--gy-tint` token (ink mixed into surface 6-8% via OKLCH, contrast-checked).
- [ ] `:not(pre) > code`: tint bg, border 0, radius-sm, padding `0 0.25em`,
      `box-decoration-break: clone`, no vertical padding.
- [ ] Pre keeps the card but drops to `--gy-radius` from `--gy-radius-lg`.
- [ ] Acceptance: inline code reads as highlighted text not a chip; wrapped run keeps tint on both
      fragments; line-height identical with/without code.

## P5 Heading binding

- [ ] `:is(h2,h3,h4) + *` gets `margin-top: var(--gy-space-1)` (after < before).
- [ ] h1 in flow gets `margin-top: var(--gy-space-6)`; owl stays for the rest.
- [ ] Acceptance: gap above any h2 >= 2x the gap below it (snapshot-measured).

## P6 The paper kit on the article recipe

- [ ] `justify` (text-align justify + hyphens auto on prose; off by default; on for article in
      print/typeset), gated by axes/recipe.
- [ ] `booktabs` tables (no vertical rules, doubled top/bottom hairline, thin header midrule,
      numeric columns right-aligned).
- [ ] Acceptance: MIT-News fixture as article w/ justify+booktabs comparable to the Quarkdown
      table/abstract; ragged-right default for note/reference.

## P7 Real fonts where humans look

- [ ] Package default stays system stacks (DEFAULT_FONTS unchanged).
- [ ] Documented loaded-font path: `galley/fonts` subpath (@fontsource: Vollkorn prose, IBM Plex
      Sans ui, JetBrains Mono 500 mono).
- [ ] Docs + both demos load the real fonts (deterministic, network-free).
- [ ] Optional `paper`/Computer-Modern fixture: SKIPPED (GUST licensing not verified here; spec
      permits skip). Surfaced, not silently cut.
- [ ] Acceptance: published demo renders in Vollkorn/Plex; a fresh consumer without the import still
      renders on system stacks.

## P8 Gates become blockers

- [ ] New CI-run (OS-independent) assertion: page-object present (page bg != ground; content
      inline-start offset > 0 at every viewport).
- [ ] New CI-run assertion: heading-binding ratio (P5).
- [ ] MIT-News + Beauty-Computed article fixtures in the snapshot/geometry set across 3 registers x
      2 viewports.
- [ ] Snapshot changes carry a punch-item reference; darwin baselines regenerated after P1-P7.
- [ ] Acceptance: reverting P1 fails CI on the page-object assertion; suite green on main after
      P1-P7.

## Repo hygiene

- [ ] `.prettierrc` (printWidth 100, proseWrap always for markdown), `pnpm     format`, tree
      formatted once.

## Validation

- [ ] `pnpm typecheck`, `pnpm test`, `pnpm lint:literals` green.
- [ ] `pnpm demo:tokens|render|permutations|readmes` emit without error.
- [ ] `pnpm test:visual` (local, Chromium) green including new assertions.
