# HANDOFF-COMPOSE-OKF

Follow-up to HANDOFF-COMPOSE-SURFACE. Depends on HANDOFF-OKF-BRIDGE (crate `rustyred-thg-okf`, MCP tools `okf_import` / `okf_export`). Scope: one-click OKF save and import in Compose, OKF-aware rendering, and the styled HTML artifact. Tenant slug casing is load-bearing: `Travis-Gilbert`.

## Governing principle

The mapping lives in one place: `rustyred-thg-okf`. The frontend never re-implements kind-to-type, gist-to-description, or edge serialization; it calls the server. Compose's one-color rule holds everywhere below: surface family, oxblood signal, teal links, nothing else on the writing plane.

## Cross-spec amendment (one field)

`OkfExportInput` in `rustyred-thg-okf` gains `pub doc_ids: Vec<String>` (empty means the existing tenant/project scope). Single-document save-as is `export_bundle` with one doc_id; the receipt and byte-stability guarantees are unchanged. Land this in the bridge crate before F1.

## Named decisions

- OKF appearance is not a fourth render mode. Read mode upgrades when frontmatter carries a non-empty `type`; Write and Typeset are untouched.
- HTML render already exists in the D2 export menu; F5 defines what that artifact is (self-contained, tokenized, zero-network). No new render pipeline; it is the D3 spine through D8's `typeset.css`.
- The bundle reader (F4) is public-shareable. It is the consumer artifact the /okf page points at, and it reuses the D7 force renderer rather than growing a second graph view.
- Imported documents default to agent-relevant (the Compose memory-relevance flag from the parent spec), because an OKF bundle is knowledge by declaration. The dry-run preview exposes the toggle before commit.

## Deliverables

### F1. Save as OKF
Build: two entries in the D2 export menu. "OKF concept (.md)" calls export with the current doc_id and downloads the single conformant file. "OKF bundle (.tar.gz)" exports the current project scope (or a multi-select from the workspace list) and downloads the archive. Both route through the server export; no client-side frontmatter assembly. When the document's kind maps to no verbatim `okf_type`, the export dialog shows the type it will write (Title Case of kind) with an inline override field, persisted to `metadata.okf_type`.
Acceptance: a Compose note saved as OKF passes `okf validate`; its frontmatter carries type, title, description, tags, timestamp, and the x-theorem keys; pasted into a GitHub repo it renders clean; re-importing it round-trips to the same doc_id with `concepts_updated == 1`.

### F2. Import drop
Build: drag a bundle directory archive (.tar.gz, .zip) or a single concept .md onto the Compose workspace. Flow: upload, server `okf_import` with `dry_run: true`, preview card rendering the receipt (concepts created/updated, edges, forward refs, warnings) plus the agent-relevance toggle, confirm to commit. Single concept files import as a one-concept bundle with `bundle_id` derived from the filename. Errors from non-conformant input render the validator report, never a bare failure.
Acceptance: dropping the vendored crypto_bitcoin fixture shows a preview whose counts match the CLI run, and confirming makes the concepts appear in the workspace list and in recall; dropping a text file that is not OKF yields the conformance report with the failing path named.

### F3. Concept header in Read
Build: in `packages/markdown-spine`, expose parsed OKF frontmatter (`type`, `title`, `description`, `resource`, `tags`, `timestamp`, extension keys) on the document model. In Read, when `type` is non-empty, the folded frontmatter strip renders as a concept header component: type as a small-caps ink-2 badge, title as the page title, description as the lede line, tags as quiet chips, resource as a teal external link, timestamp right-aligned in ink-3, and a small conformance mark when the client-side check passes. Unknown and x-theorem keys stay folded behind a disclosure. Documents without `type` keep the existing quiet strip.
Acceptance: an imported stackoverflow sample concept opens with the header populated; toggling Write and Read produces zero layout shift in the first viewport; no hue outside the compose register appears.

### F4. Bundle reader
Build: route `/okf/view/:bundleId` in the harness console app, with a public unauthenticated mode for shared bundles. Three regions on the compose surface geometry: left rail is the bundle tree driven by `index.md` files (synthesized per SPEC section 6 when absent), center is the concept in the Read renderer with the F3 header, and a Graph toggle renders the bundle's link graph through the D7 D3 force renderer (nodes are concepts, edges are links plus typed x-theorem edges with distinct stroke). In-bundle links navigate inside the reader; broken links render as ghost chips labeled "not yet written," with a create affordance when authenticated. `log.md` renders as a History panel when present.
Acceptance: pointing the reader at the imported stackoverflow bundle allows navigation from the root index through three link hops without leaving the route; the Graph toggle shows the link graph and clicking a node opens that concept; a broken-link ghost chip appears for a known dangling link in the fixture; the public mode renders with no console chrome and no auth.

### F5. Styled HTML export
Build: the D2 export menu's HTML entry emits a single self-contained file: D3 spine to rehype to `typeset.css` with the compose register tokens inlined, fonts as system-stack fallbacks (no network fetch, no embedded font binaries in v1), `::embed` blocks as static snapshots with fallback captions per the D6 rule, and the F3 concept header when frontmatter carries `type`. The stamp exports per the D7 rule (Mermaid text plus comment) with a static SVG render inline.
Acceptance: the exported file opens from `file://` with the network tab empty and matches Read visually within token substitutions; exporting the MIT News fixture produces the same structural classes the D8 acceptance names; an OKF-typed document's HTML shows the concept header.

## Verify first

- Whether harness-console reaches the harness through GraphQL mutations or the MCP tool surface for writes; wire F1/F2 through whichever the console already uses (the D4/D5 annotation mutations are the precedent), and if a GraphQL wrapper is added, it is a thin passthrough to the crate functions, no logic.
- The cross-spec amendment (`doc_ids` on `OkfExportInput`) has landed in `rustyred-thg-okf` before F1 starts.
- Public route hosting for `/okf/view`: confirm the console app can serve an unauthenticated route, or place the reader on the marketing site app and share the Read renderer package.
- Archive upload size limits on the server path `okf_import` uses; the stackoverflow sample must clear them.
- The frontmatter strip component name in `packages/compose-editor` so F3 replaces it rather than wrapping it.

## Where it lands

Export menu grows two entries, the workspace accepts a dropped bundle, Read knows what a concept is, and one public route renders any bundle as a readable site with a live graph. The five-minute test: write a note, save it as OKF, watch GitHub render it; drop Google's sample back in, read it in the bundle reader, flip the Graph toggle. If the reader feels like a file browser instead of a book with a map, F4 is not done.
