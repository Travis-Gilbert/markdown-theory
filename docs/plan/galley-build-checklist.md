# galley build checklist

The definition of done for the GALLEY spec (`Specs/HANDOFF-GALLEY (1).md`), built
standalone. Nothing here is silently deferred; each row is spec-anchored.

## Status legend
- [x] done + verified
- [~] in progress
- [ ] not started

## S0. Scaffold
- [x] pnpm workspace monorepo, TS strict, MIT license, `.gitignore`
- [x] `packages/galley` with subpath exports (`tokens`, `css`, `react`, `templates`, `shelf`, `mdx`)
- [x] vitest + typecheck wired; project CLAUDE.md navigation map
- [x] `pnpm lint:literals` no-literals oracle (real; scans react + css)

## G1. Proportion engine (`galley/tokens`) — SHIPPED
- [x] `generateRegister(axes)` over 7 axes (base, ratio, measure, hue/chroma, signal, link, mode, density)
- [x] Type ramp `base * ratio^i`, steps -2..5, quarter-pixel snapped
- [x] Leading solve as f(size, measure), clamped [1.3, 1.75]; headings 1.15
- [x] Rhythm: 0.5lh unit, block margins in lh, px fallback
- [x] Page shape: Van de Graaf 2:3:4:6, screen-adapted (content optically high)
- [x] OKLCH ladders: surface (ground/surface/top), warm ink (ink/2/3), signal, link
- [x] WCAG-AA contrast solver; ink ladder anchors ends + interpolates middle
- [x] `RegisterContrastError` thrown at generation time for an unsolvable register
- [x] Detailing defaults (optical sizing, onum/tnum, text-wrap, hanging punct, hyphens)
- [x] Shiki theme generated from the ladders (hex output)
- [x] Three fixtures: parchment (light), substrate (dark), print
- [x] Acceptance: re-derivation test, AA gate on all fixtures, contrast throw, no-hex in emitted sheet
- [ ] `text-box: trim-both cap alphabetic` verified across the browser matrix (needs G2 render + visual gate)

## markdown-spine (sibling package) — SHIPPED
- [x] remark pipeline: parse, gfm, frontmatter, math, directive, callout (GitHub + Obsidian)
- [x] Directive vocabulary of record (abstract, callouts, figure, margin, embed, view, stamp)
- [x] Content-hash block IDs (FNV-1a, ordinal-salted); block-level mapping seam
- [x] Acceptance: a directive doc parses identically in plain remark (annotation additive); `> [!NOTE]` == `:::note`
- [ ] Lezer<->mdast token-level position bridge (deferred until the editor consumer needs it; not a galley-render concern)

## G2. Render surface + `galley/css` — SHIPPED (core; robustness suite is G7)
- [x] `<Galley doc register components? highlighter?>` over the mdast vocabulary (mdast -> hast -> React)
- [x] Callouts (both syntaxes), abstract, figures, embed fallback+chip, task lists, tables (tabular nums), footnotes (default section)
- [x] Code via Shiki with the G1 generated theme (sync, server-safe: host loads highlighter once, passes it in)
- [x] Every node type overridable via `components`; 3 islands (code copy wired; footnote popover + image lightbox opt-in)
- [x] Math via KaTeX (server-rendered, sync)
- [x] `galley/css` static stylesheet, token-only (lint passes)
- [x] Acceptance (unit): SSR renders the full vocabulary; `:::note` == `> [!NOTE]`; override works; raw HTML dropped
- [ ] `template` prop wiring (needs G3 recipes) and footnotes-as-Tufte-sidenotes (wide-viewport CSS/JS enhancement)
- [ ] Acceptance (visual, -> G7): MIT News fixture parity; uncurated-README robustness (zero overflow / AA / widows), needs a browser harness

## G3. Type recipes (`galley/templates`) — SHIPPED
- [x] Declarative recipe object over tokens (className, rampOffset, apparatus toggles, toc, numbered); registry keyed by frontmatter `type`, open for registration
- [x] Core four: article, note, reference, log; unknown -> article + quiet chip
- [x] `<Galley template>` applies recipe: root class, ramp-offset (CSS), ToC + heading slugs, standfirst/author-line apparatus
- [x] Acceptance: recipe resolves from frontmatter; reference renders a ToC with anchors; unknown -> article + chip; collision rejected; untyped doc stays plain

## G4. Shelf (`galley/shelf`) — SHIPPED
- [x] Adapter interface `{ list, get, edges? }`; adapters: `arrayAdapter` (base), `fsAdapter` (Node), `okfAdapter`, `theoremAdapter` (host-resolved docs)
- [x] Views: stream (reverse-chron), archive (year), tag lens, thread (supersession lineage + relates)
- [x] `successorOf` surfaces a superseded doc's current version
- [x] Acceptance: `fsAdapter('./fixtures/notes')` reads a folder as a blog (`pnpm demo:shelf`); thread shows revised-from lineage; superseded item is not its own head
- [ ] The `theorem` adapter's live tenant read path (needs Theorem's console GraphQL; standalone takes pre-resolved docs)
- [ ] Reader chrome (prev/next within a lens, position marker) — a single-doc reading concern, not the list views

## G5. Extension boundary — SHIPPED
- [x] `::embed` / `:::view` -> host view registry (`views` prop); standalone default = fallback + quiet chip; unknown name -> fallback + chip
- [x] `galley/mdx` `renderMDX(source, components)`, trusted-input-only (evaluate = new Function), documented in red letters; user content never routes through it
- [x] Acceptance: same doc renders a live registered view in a host, fallback+chip standalone; MDX renders a custom component

## G7. Quality gates — PARTIAL (browser gates specified, not runnable in this env)
- [x] Contrast gate (G1) fails a deliberately bad register (generation-time throw, in the vitest suite)
- [x] Register-permutation snapshot generator (3 registers x 4 recipes) — `pnpm demo:permutations` -> `dist/permutations/`
- [x] Uncurated-README robustness corpus started — `fixtures/readmes/`
- [x] Browser harness specified precisely for CI — `docs/plan/g7-browser-harness.md` (overflow lint, rendered-contrast gate, orphan gate, snapshot diffing)
- [ ] RUN the browser gates green — blocked here (Playwright has no system Chrome); needs `@playwright/test` + Chromium in CI

## G8. Packaging + showcase
- [ ] npm publish `galley` (scoped) + `markdown-spine`, MIT, license provenance notes
- [ ] OFL font subsetting strategy documented; system-stack fallback default
- [ ] Showcase site: MIT News fixture, live register-axis playground, blog-of-memory demo

## Out of scope (stated so nobody descopes into it)
- Slides doctype — its own spec if wanted.
- PDF — the Typst crate (D9) owns it; galley hands it mdast.
- Canvas/paged preview — reserved.
- WYSIWYG editing — Compose owns the editor; galley renders.
- G6 "consolidation" (swapping Theorem's consumers) lands in the Theorem repo, not here.
