# HANDOFF-COMPOSE-SURFACE

## Purpose

Ship the Compose writing surface: a markdown editor where the text is the file, the margins are the intelligence, and the rendered page reaches Quarkdown quality without touching AGPL code. One markdown text, three renders (Write, Read, Typeset/PDF), a margin apparatus fed by the graph, live components from the registered component library, and agent co-editing over the same bytes. Decisions of record: harness doc `doc_483da2cd23148a8f`.

## Governing principle

The markdown text is canonical. Every layer above it, decorations, margins, embeds, typeset output, is a projection that must round-trip to plain markdown a stranger's tool can read. Nothing writes IDs or markup pollution into the text to make a feature work. The surface is one color, lifted by tone: ground and surface differ by one lightness step of the same hue, hairline plus a contact shadow, no chrome of a second color anywhere on the writing plane.

## What exists, do not rebuild

- `kenforthewin/atomic-editor` (MIT): CodeMirror 6 Obsidian-style live preview, virtualized, layout-stable, themed entirely through CSS custom properties, extensible via a CM6 extensions prop. Adopt wrap-and-extend. Parts bin fallback: `blueberrycongee/codemirror-live-markdown` (MIT).
- harness-console's collaborative CodeMirror/Yjs editor: the CM6 plus Yjs wiring to grow from.
- `apps/copresence-editor`: the Velt plus Gemma co-writer seam (OpenAI-compatible, base-URL-swappable). Port the seam onto CM6/Yjs; retire the Tiptap host when parity lands.
- The block-view/OpenUI registry and ViewDescriptor contract: live components render only through this registry.
- MarginAnnotation and ScrollAnnotation from the essays site: the visual language for handwritten marginalia (Caveat, rough.js leader lines, alternating sides, responsive collapse). Carry it, do not reinvent it.
- Retrieval (PPR plus vector plus BM25) and `analogy.rs` structure mapping: the suggestion engines.
- The Stamp precompute from the Growth Layer workstream (GL7): ego-graph snapshot at write, explicit typed edges only, Mermaid export block with the `theorem:stamp` comment.
- `commonplace-tokens.css`: the token mechanism. Compose adds a register file; it does not fork the mechanism.
- The clipper: receives the send-as-email idea from markdown-here; no fork of markdown-here.

## Named decisions

- Engine: CodeMirror 6 live preview. Markdown text canonical, marks visible only at the cursor. This supersedes the `Compose editor: Tiptap + Blocknote + yrs` row in SPEC-UI-COMPONENT-SOURCING-AND-RESKIN. Monaco stays on code panes only.
- Live components are directive embeds bound to the block-view registry, not raw JSX in documents. Agents and users write `::embed{...}` text; the renderer restriction keeps generative output on brand by construction, mirroring the OpenUI rule. MDX is accepted at the import boundary: JSX elements that map to registered views convert to directives, unmapped JSX is preserved fenced. If raw JSX authoring is ever wanted, that is a different surface, not this one.
- Quarkdown (GPL-3.0) and CodiMD (AGPL-3.0) are visual references only, never dependencies. The typeset path is remark plus CSS on screen and Typst (Apache-2.0) for PDF.
- Fonts: prose is user-selectable from a curated set, apparatus is fixed. Defaults: Vollkorn prose, IBM Plex Sans apparatus and UI, JetBrains Mono code with code weight 500 as the default rendering weight. Kerning and ligatures on by default everywhere; a per-user toggle exists only for code ligatures.
- The stamp's Mermaid block renders as a live D3 force graph inside Compose, and the same renderer offers a Force toggle for any graph-flavored Mermaid block via a parse adapter.

## Deliverables

### D1. Editor core
Build: `packages/compose-editor`. Mount atomic-editor; extend with CM6 extensions: marks-at-cursor live preview across headings, emphasis, links, images, lists, tasks, tables, fences, footnote references, and highlights; callout and directive block decorations; a slash menu inserting blocks, callouts, figures, embeds, and the stamp; object mention chips (`@`-mention resolving to Items) measured by pretext rich-inline with `break: 'never'` and `extraWidth` for chip chrome; frontmatter folded to a single quiet strip. Font feature settings from the token block apply inside the editor.
Acceptance: typing through a heading reveals its `#` marks at the cursor and hides them on exit with zero layout shift; a 500-block document scrolls smoothly (the atomic-editor CLS probes pass); copy always yields raw markdown.

### D2. Surface and toolbar
Build: the lifted plane and its chrome, all on the surface color. Geometry: surface max-width 1120px, radius 14, prose column 68ch, margin rail 300px (min 240) with a 28px gap, rail collapses under the paragraph below 1280px. Top strip on the surface: document title, segmented Write / Read / Typeset control, Margins toggle, `aA` type popover (prose family, size 16 to 19, numeral style, code ligature toggle, code weight), export menu (Markdown, PDF via Typst, HTML, Send as email through the clipper pipeline), stamp button, overflow. Selection popover: Bold, Italic, Highlight, Code, Link, Annotate (creates a margin note on the selection), Ask (queues the agent on the selection, same async pattern as the omnibar Ask). Tokens:

```css
.compose-register {
  --compose-ground:   #F1EFE7;
  --compose-surface:  #FAF9F5;   /* the writing plane, one step lifted */
  --compose-top:      #FFFFFF;   /* popovers and menus only */
  --compose-hairline: rgba(20, 20, 19, 0.10);
  --compose-ink:      #2A2723;
  --compose-ink-2:    #6E675C;
  --compose-ink-3:    #9A9182;
  --compose-signal:   #7A2733;   /* oxblood; pressed #66202B */
  --compose-link:     #2D5F6B;   /* teal */
  --compose-shadow:   0 1px 2px rgba(42,36,32,0.05), 0 4px 14px rgba(42,36,32,0.05);
  /* dark register */
  --compose-ground-dark: #1F1E1D; --compose-surface-dark: #262624; --compose-raised-dark: #30302E;
  /* type */
  --compose-font-prose: 'Vollkorn', Georgia, serif;         /* user-swappable */
  --compose-font-ui:    'IBM Plex Sans', system-ui, sans-serif;
  --compose-font-mono:  'JetBrains Mono', monospace;
  --compose-code-weight: 500;
  --compose-feat-prose: 'kern' 1, 'liga' 1, 'calt' 1, 'onum' 1;
  --compose-feat-ui:    'kern' 1, 'liga' 1, 'calt' 1;
  --compose-feat-mono:  'kern' 1, 'liga' 1, 'calt' 1, 'zero' 1, 'ss01' 1, 'ss02' 1;
}
```

Tables set `font-variant-numeric: tabular-nums`; prose keeps oldstyle numerals.
Acceptance: changing one custom property repaints every Compose element; no element on the writing plane renders a hue other than the surface family, oxblood, or teal; the toolbar never leaves the surface color.

### D3. Markdown spine
Build: `packages/markdown-spine`. The remark pipeline shared by all renders: `remark-parse`, `remark-gfm`, `remark-frontmatter`, `remark-math`, `remark-directive`, plus a callout plugin accepting GitHub and Obsidian `> [!note]` syntax. Directive vocabulary of record: `:::abstract`, `:::note|tip|warning|danger|quote` (callout aliases), `::figure{src width align caption}`, `:::margin{author|note}`, `::embed{view ...props}` and `:::view{name ...props}` with fallback body, `:::stamp` (generated, never hand-written). Block identity: content-hash IDs per top-level block (hash of normalized text plus ordinal salt), computed in the spine, never written into the file. Position policy: Lezer drives editor decorations, mdast drives Read, Typeset, anchors, and export; the spine exposes block-level mapping between them, not token-level.
Acceptance: a document written in Compose parses identically in plain remark; a GitHub `> [!NOTE]` callout and a `:::note` directive render the same component.

### D4. Margin apparatus
Build: `packages/margin-apparatus`. Five typed renderers in the rail, polymorphic, never a uniform card: stamp (rail head), sidenotes (footnotes rendered in-margin), suggested related notes, user marginalia (Caveat, rough.js leader on hover, the essays-site language), agent notes. Anchor model, stored as graph annotation edges through GraphQL, never inline:

```
{ docId, blockHash, exactQuote, prefix, suffix, offsetFallback, kind, createdBy, createdAt }
```

Re-anchor order on any text change: exact quote within the hashed block, fuzzy quote with prefix/suffix window across the doc, offset fallback, then orphan. Orphans park at the rail foot with a re-attach affordance; nothing is silently dropped.
Layout is the pretext engine: `prepare()` once per note, `layout(railWidth)` for height, anchor Y from CM6 `coordsAtPos` (Write) or element offsets (Read), greedy top-aligned packing with 8px gaps, focused-block notes take priority, overflow collapses to chips. No DOM measurement in the packing loop.
Quiet rules: suggestions surface for the focused block only, cap 3, no counts, no badges, Margins toggle hides the rail entirely.
Acceptance: typing at 60fps with 40 margin notes shows no long tasks from the rail; deleting and retyping an annotated sentence re-anchors the note; an agent rewrite of a paragraph leaves its annotations attached or parked, never lost.

### D5. Suggested notes pipeline
Build: on block focus (debounced, cached by block hash), run tier-1 retrieval (PPR plus vector over the graph, scoped to the tenant) and tier-2 analogy candidates from the `analogy.rs` structure-mapping pass, rendered with a distinct glyph. Each suggestion carries a one-line why. Link promotes to a typed edge (mutation) and may insert an inline wiki-link at the cursor on request; Dismiss writes the negative training signal. Promoted edges are exactly what the stamp renders: the margin feeds the hallmark.
Acceptance: focusing a paragraph about a topic with known neighbors surfaces at most three suggestions inside 500ms warm; Link creates the edge and the stamp's connection count increments on next snapshot; Dismiss suppresses that pair for the doc.

### D6. Live components
Build: `::embed` and `:::view` render through the ViewDescriptor/block-view registry. Write mode renders a block widget decoration with a props popover form; Read renders full; Typeset and PDF render a static snapshot (SVG or PNG) with the fallback body as caption; unknown view names render the fallback body plus a quiet chip. MDX import per the named decision.
Acceptance: an agent that emits `::embed{view="ledger" query="kind:task status:open"}` into a doc produces a live Ledger lens in Read mode; exporting the same doc to PDF produces the snapshot, and the markdown remains legal CommonMark plus directives.

### D7. The stamp and Mermaid force rendering
Build: rail-head stamp glyph from the precomputed ego snapshot, explicit edges only; click opens the live D3 force panel. Renderer rule: a fenced `mermaid` block followed by a `<!-- theorem:stamp doc=... -->` comment upgrades to the live D3 force graph, hydrating from the snapshot by doc id and falling back to parsing the Mermaid text. Any other `graph TD|LR` Mermaid block gets a Force toggle that routes through a Mermaid-parse adapter into the same D3 renderer; non-graph Mermaid renders via the mermaid library (MIT). Export appends the GL7 block: Mermaid text, machine comment, italic hallmark line.
Acceptance: an exported note pasted into GitHub shows the Mermaid stamp; the same file reopened in Compose shows the live force graph; the GL7 round-trip acceptance line holds.

### D8. Typeset render and CSS
Build: `packages/typeset`. mdast through rehype into `typeset.css`: heading numbering via CSS counters (toggleable), `.abstract` with a small-caps label and narrowed measure, `::figure` floats with percentage inline-size and small sans captions, pull-quote blockquotes with attribution lines, hairline rules, footnotes transformed to Tufte sidenotes at 1280px and collapsed inline below, page-margin author line from frontmatter. The reference target is the Quarkdown MIT News sample: reproduce its classes of layout (numbered title, floated figure, abstract block, attributed pull quote, margin author) from directives alone.
Acceptance: the MIT News fixture, rewritten in the directive vocabulary, renders visually equivalent in the Typeset view; the same file renders acceptably in plain GitHub preview.

### D9. Typst PDF export
Build: a Rust crate (working name `commonplace-typeset`) with an mdast-to-Typst emitter and PDF compilation through the `typst` and `typst-pdf` crates (Apache-2.0), embedded, no headless browser. Coverage table: headings, paragraphs, emphasis, strong, links, images, `::figure` with width, lists and tasks, tables, blockquotes, footnotes (Typst footnotes; margin placement where supported), math (native), callouts as styled blocks, `::embed` snapshots, stamp as embedded SVG plus comment. Fonts embedded from the OFL set in use.
Acceptance: golden-file tests per node type; the MIT News fixture exports to a PDF a reviewer cannot distinguish in structure from the Quarkdown reference; export of a 10k-word doc completes without network.

### D10. Agent co-editing
Build: Yjs binding via `y-codemirror.next` on the provider harness-console already uses. Each doc opens a coordination room keyed `doc:<id>`; presence chips render in the toolbar strip; agent heads join as Yjs peers through the ported copresence seam, cursor color per actor. Async path: an agent file write outside the session reconciles on load and anchors re-resolve per D4. Agent margin notes arrive as annotation-edge writes and render in the rail live. Canonical publish keeps the existing permission round trip; approval cards render inline, consistent with the mobile approvals surface.
Acceptance: a Claude Code head and the browser edit one doc concurrently without divergence; an agent margin note appears in the rail without reload; a publish request from an agent produces an approval card and the receipt lands in the doc's room feed.

### D11. Type system and picker
Build: prose font picker (prose only; apparatus and mono fixed): Vollkorn (default), Literata, Source Serif 4, IBM Plex Serif, system serif. Sizes 16 to 19 with leading locked to a 1.6 to 1.7 band. Code weight control defaulting to 500. Feature defaults per the D2 token block; the only ligature toggle exposed is for code. Choices persist per user and apply across Write, Read, and Typeset.
Acceptance: switching prose to Literata changes Write, Read, and Typeset in one action and survives reload; code ligatures off renders `!=` as two glyphs while prose ligatures remain on.

## The pretext ideas, explicit

1. Margin packing: note heights by arithmetic (`prepare` once, `layout` per width), zero reflow in the packing loop. This is the enabling trick for a live rail while typing.
2. Chip measurement: `prepareRichInline` with `break: 'never'` and `extraWidth` for mention pills, so composer wrapping never splits a chip.
3. Virtualized Read view: paragraph heights computed without DOM for instant long-doc open and stable scroll anchoring.
4. Balanced pull quotes: `walkLineRanges` binary search for the tightest width that keeps a pleasing line count.
5. Dev-time overflow lint: a CI probe that measures toolbar labels and directive chips against their containers, in the spirit of atomic-editor's Playwright CLS suite.
6. Reserved: `layoutNextLineRange` figure text-wrap for a future canvas or paged preview. The DOM Typeset view uses CSS floats today; do not build the canvas path in this handoff.

## Build table

| # | Current state | Feature | Location | Action | Desired outcome | Test |
|---|---|---|---|---|---|---|
| 1 | Tiptap in copresence, Monaco on code | Editor core, live preview | packages/compose-editor | build | Marks at cursor, chips, slash menu | [-] |
| 2 | Parchment shell, no compose chrome | Surface, tokens, toolbar | compose register css, toolbar | build | One-color lifted plane, quiet chrome | [-] |
| 3 | Ad hoc markdown handling | Remark spine, directives | packages/markdown-spine | build | One pipeline, directive vocabulary | [-] |
| 4 | MarginAnnotation on essays only | Margin apparatus | packages/margin-apparatus | build | Five renderers, durable anchors, pretext pack | [-] |
| 5 | Retrieval and analogy agent-only | Suggested notes | apparatus plus GraphQL | build | Cap-3 suggestions, Link/Dismiss signals | [-] |
| 6 | Registry exists, no doc embeds | Live components | spine plus registry binding | build | ::embed renders registered views | [-] |
| 7 | Stamp spec in GL7 | Stamp plus Mermaid force | packages/typeset stamp renderer | build | Live D3 in-app, Mermaid on export | [-] |
| 8 | No typeset view | Typeset render, typeset.css | packages/typeset | build | MIT News fixture parity on screen | [-] |
| 9 | No PDF path | Typst export | crates/commonplace-typeset | build | Golden-file PDF, no browser | [-] |
| 10 | CM6/Yjs in console, seam in copresence | Agent co-editing | provider plus room per doc | build | Human and head co-edit, live agent notes | [-] |
| 11 | Fonts hardcoded | Type system and picker | settings plus tokens | build | Prose picker, features on, code weight 500 | [-] |

## Verify first

- The package root for Compose: the CommonPlace `apps/web` v2 area versus the harness-console CommonPlace shell. Place `packages/compose-editor`, `packages/markdown-spine`, `packages/margin-apparatus`, `packages/typeset` wherever the v2 port is consuming FEATURE-EXPOSURE-MAP rows, and note the choice in the doc room.
- CodeMirror package identity: atomic-editor's CM6 peer versions against harness-console's; a duplicated `@codemirror/state` silently breaks extensions. Dedupe to one version set.
- The Yjs provider in harness-console (y-websocket, custom relay, or Velt) and whether the mesh relay is the transport for doc rooms.
- The GraphQL mutation names for annotation edges and typed link edges; reuse, do not invent parallel mutations.
- Stamp snapshot precompute status in the GL7 workstream; if the snapshot API is not live, the rail glyph renders from a synchronous ego query behind the same interface.
- `typst` and `typst-pdf` crate embedding pattern and font-loading path inside the monorepo build.
- Vollkorn, Literata, Source Serif 4 variable-font files and licenses staged locally; no runtime Google Fonts fetch in the app.
- The exact interpretation of code weight: 500 as the default JetBrains Mono rendering weight for code spans and fences, user-adjustable. If a different weight was meant, it is one token.

## Where it lands

The four packages plus the Rust export crate, the compose token register, and a `Compose` route replacing the current compose dir surface. The copresence-editor Tiptap host retires when the D10 seam reaches parity. The five-minute test on this face: open a note, write a paragraph, watch a relevant margin suggestion appear, link it, click the stamp and see the new edge, then export a PDF that looks typeset. If any step feels like a markdown editor instead of an instrument, the surface is not done.
