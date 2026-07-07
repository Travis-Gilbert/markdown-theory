# HANDOFF-DOCUMENT-TYPES

The document type taxonomy for Theorem memory, Compose, Galley, and OKF. Follows HANDOFF-GALLEY (G3
recipes), HANDOFF-COMPOSE-SURFACE (D4 marginalia), HANDOFF-OKF-BRIDGE (type mapping). Tenant slug
casing is load-bearing: `Travis-Gilbert`.

## Intent

A type is not a render template. A type is a contract across four layers at once:

1. **Structure**: which frontmatter fields and conventional headings the document carries.
2. **Render**: which Galley recipe shapes it.
3. **Marginalia**: what the rail does for it. A paper's margin holds citations; a recipe's margin
   holds timers; a concept's margin holds objections. The margin is where types earn their
   existence.
4. **Affordances**: which agent actions the type licenses. A meeting licenses action extraction; a
   readme licenses freshness checking; a paper licenses claim extraction.

Plus one cross-cutting dimension, the epistemic class: claim-bearing types feed the contradiction
machinery, procedural types license execution, records are provenance-heavy and immutable-leaning,
references anchor entities.

Types are data, never code. One canonical descriptor file, consumed by the TS side (Galley, spine,
Compose) and the Rust side (memory write path, OKF import, inference). Plugins register descriptors
through the same registry.

## The descriptor contract

```
TypeDescriptor {
  id: string,                      // the memory kind, lowercase
  family: prose|reference|procedure|record|working|structural,
  epistemic: claim_bearing|procedural|record|reference|generated,
  okf_type: string,                // Title Case for export ("Research Paper", "Playbook")
  fields: [{ key, required, shape }],
  headings: [string],              // conventional sections, never enforced
  recipe: { base: family_recipe, deltas: {...} },
  margin: [module_id],             // from the fixed rail vocabulary below
  affordances: [affordance_id],
  infer: { signals: [...] },       // heuristics for the classifier
}
```

The `id` is the storage `kind`. The taxonomy maps onto the existing kind space, never forks it:
`note`, `self_note`, `claim`, `finding`, `solution`, `postmortem`, `handoff`, `archive`,
`community_summary`, and `okf_log` keep their exact current strings and behavior; new types are new
kinds, which `create_memory_document` already accepts as open strings.

## Rail vocabulary (fixed module set, D4 extends)

`citations` (sidenote-rendered sources), `claims` (extracted claim chips), `objections`
(contradicting and tension edges), `analogies` (the analogy.rs candidates, distinct glyph),
`questions` (open questions anchored to blocks), `timers` (duration chips, tappable), `quantities`
(scalable amounts), `freshness` (staleness verdicts against live sources), `relationships` (the ego
stamp and entity links), `actions` (extracted action items with dispatch), `usages` (where this term
or entity appears across the tenant), `history` (supersession and revision chain), `suggestions`
(the D5 default, always available).

## The taxonomy

| id             | family     | key fields beyond core                                      | headings                                 | margin                                        | affordances                          | okf_type        |
| -------------- | ---------- | ----------------------------------------------------------- | ---------------------------------------- | --------------------------------------------- | ------------------------------------ | --------------- |
| article        | prose      | byline, publication, source_url                             | none fixed                               | citations, claims, suggestions                | extract_claims, link_entities        | Article         |
| paper          | prose      | authors[], venue, year, doi                                 | Abstract, Method, Results, Citations     | citations, claims, objections                 | extract_claims, link_entities        | Research Paper  |
| concept        | prose      | maturity (seedling, working, settled), answers_question     | none fixed                               | objections, analogies, questions, suggestions | check_contradictions, find_analogies | Concept         |
| argument       | prose      | thesis, stance                                              | Position, Supports, Objections           | claims, objections, citations                 | extract_claims, check_contradictions | Argument        |
| question       | prose      | status (open, answered), resolved_by                        | none fixed                               | suggestions, claims, analogies                | answer_question                      | Question        |
| review         | prose      | subject_ref, verdict, rating                                | none fixed                               | citations, relationships                      | link_entities                        | Review          |
| profile        | reference  | subject_kind (person, org, place, project, work), aliases[] | none fixed                               | relationships, usages, history                | link_entities, check_freshness       | Profile         |
| reference      | reference  | subject_kind (api, dataset, table, tool), resource          | Schema, Examples                         | freshness, usages                             | check_freshness                      | Reference       |
| glossary       | reference  | term, domain                                                | none fixed                               | usages, suggestions                           | link_entities                        | Definition      |
| comparison     | reference  | subjects[], criteria[]                                      | none fixed                               | citations, freshness                          | compare_criteria                     | Comparison      |
| recipe         | procedure  | servings, prep_time, cook_time                              | Ingredients, Method                      | timers, quantities                            | scale_quantities                     | Recipe          |
| runbook        | procedure  | trigger, severity, owner                                    | Trigger, Steps, Rollback                 | actions, freshness, history                   | execute_steps (approval-gated)       | Playbook        |
| tutorial       | procedure  | prerequisites[], level                                      | Prerequisites, Steps                     | timers, suggestions, questions                | none v1                              | Tutorial        |
| readme         | procedure  | repo, package_manager                                       | Installation, Usage                      | freshness, relationships                      | check_freshness                      | Readme          |
| checklist      | procedure  | template_of                                                 | none fixed                               | actions                                       | instantiate_checklist                | Checklist       |
| note           | record     | (existing kind, unchanged)                                  | none                                     | suggestions                                   | none                                 | Note            |
| log            | record     | scope                                                       | dated entries                            | history                                       | none                                 | Log             |
| meeting        | record     | attendees[], date, project                                  | Decisions, Actions                       | actions, relationships                        | extract_actions                      | Meeting Notes   |
| decision       | record     | status, context_ref, supersedes                             | Context, Options, Decision, Consequences | history, objections, relationships            | check_contradictions                 | Decision Record |
| postmortem     | record     | (existing encode kind)                                      | Timeline, Root Cause, Actions            | actions, history, citations                   | extract_actions                      | Postmortem      |
| solution       | record     | (existing encode kind)                                      | Problem, Solution                        | suggestions, history                          | extract_claims                       | Solution        |
| transcript     | record     | speakers[], source_url, duration                            | speaker turns                            | claims, actions, relationships                | extract_claims, extract_actions      | Transcript      |
| clipping       | record     | source_url (required), captured_at                          | none fixed                               | citations, relationships, suggestions         | extract_claims, link_entities        | Web Clipping    |
| correspondence | record     | thread_id, from, to[]                                       | none fixed                               | actions, relationships, history               | extract_actions                      | Correspondence  |
| handoff        | record     | (existing kind, unchanged)                                  | none                                     | actions, history                              | none                                 | Handoff         |
| spec           | working    | register (north_star, execution), status                    | Intent, Deliverables, Acceptance         | actions, history, relationships               | dispatch_jobs, extract_actions       | Specification   |
| outline        | working    | expands_to                                                  | none fixed                               | suggestions, questions                        | expand_outline                       | Outline         |
| script         | working    | target_length, video_ref                                    | scene blocks, VO markers                 | timers, questions, suggestions                | none v1                              | Video Script    |
| index          | structural | (OKF reserved, shelf-rendered)                              | sections of links                        | none                                          | none                                 | Index           |
| timeline       | structural | scope, span                                                 | dated events                             | relationships, citations                      | none                                 | Timeline        |
| reading        | structural | items with status (queued, reading, done)                   | none fixed                               | suggestions                                   | none                                 | Reading List    |
| changelog      | structural | project_ref                                                 | versioned entries                        | history                                       | none                                 | Changelog       |

Family recipes carry the render load: six base recipes (prose = the article shape, reference = dense
with schema styling, procedure = ingredients-and-method with numbered steps, record = the note shape
with provenance apparatus, working = spec styling with status chrome, structural = list and timeline
shapes). Type deltas are declarative adjustments only. Unknown kinds fall back to their nearest
family by inference, else `note`.

## Spotlights (the types that showcase the system)

**concept.** The working-through-an-idea document. Maturity field renders as a quiet chip (seedling,
working, settled). The margin is the whole point: objections pulls MEMORY_CONTRADICTS and tension
edges against the doc's claims, analogies surfaces the analogy.rs structure-mapping candidates with
their one-line why, questions parks open threads at the blocks that raised them. Settling a concept
(maturity to settled) licenses claim extraction into MemoryNodes so the graph learns what the
concept concluded.

**paper.** Citations render as margin sidenotes at their reference points. extract_claims writes
claim MemoryNodes carrying MEMORY_CITES back to the paper, which makes imported literature
participate in contradiction detection against everything else the tenant believes. An imported
bundle of papers becomes an argued-with library, not a pile.

**readme as recipe.** The structural rhyme, made literal: dependencies render as an ingredients
list, installation as the numbered method, badges fold into apparatus, usage examples as the plated
result. The freshness module is the killer: the margin compares Installation against the repo's
actual manifest through the code graph (package.json, Cargo.toml) and flags drift ("readme says pnpm
8, repo lockfile is pnpm 10"). Docs that know when they are lying.

**spec.** Native to how this ecosystem actually works. Deliverable headings gain margin status from
coordination rooms: which head claimed it, last intent, done or not. dispatch_jobs sends enumerated
deliverables to the job board as typed Job nodes. The margin makes a handoff document a live
dashboard of its own execution.

**question.** Open questions as first-class docs. The margin runs standing retrieval: candidate
answers from the tenant graph ranked under the doc, each with provenance. Accepting one writes
resolved_by, links the answering doc, and flips status. A research workflow where questions close
themselves when the answer arrives in memory.

## Deliverables

### T1. Descriptor registry

Build: `packages/document-types/` holding `types.json` (the canonical descriptor set) plus a thin TS
reader with types and a Rust reader in `theorem-harness-core` (serde over the same file, vendored at
build). Registry API: `getType(kind)`, `byFamily(family)`, `register(descriptor)` for plugins,
collision rejection on existing ids. Galley G3 consumes recipes from here; margin-apparatus consumes
margin sets from here. Acceptance: TS and Rust readers parse the same file byte-identically into
equivalent structures (cross-checked in CI); registering a duplicate id fails loudly; deleting a
descriptor breaks the CI check that every shipped kind resolves.

### T2. The shipped set

Build: the table above as descriptors, six family recipes in Galley with per-type deltas, OKF export
mapping reading `okf_type` from the descriptor (replacing the Title-Case-of-kind fallback in the
bridge for known types). Acceptance: each of the 32 types renders through its family recipe with
deltas applied in the Galley fixture matrix; an OKF export of one document per type produces the
descriptor's exact okf_type string; a round trip preserves the kind.

### T3. Type inference

Build: a heuristic pass in the memory write path and OKF import, filling `kind` only when the writer
declared none. Signals live in the descriptor's `infer` block: ingredient list plus numbered steps
yields recipe; speaker-turn pattern yields transcript; Context, Decision, Consequences headings
yield decision; abstract plus numbered citations yields paper; badges plus an Installation heading
yields readme; interrogative title yields question; Deliverables plus Acceptance yields spec.
Ambiguity resolves to the family default, then `note`. Inferred types write `type_inferred: true`;
the Read header renders a quiet chip with one-tap correction, and a correction writes an encode-kind
feedback document so the signal set can learn. Acceptance: a corpus of fifty unlabeled real
documents (pulled from the tenant plus Google's OKF samples) infers at 80 percent or better against
a hand-labeled key; every inference carries the flag; a correction round-trips into a feedback
document.

### T4. Marginalia module binding

Build: the rail vocabulary above as typed renderers in `packages/margin-apparatus` (extending the D4
five), with per-type module sets read from the registry. Modules degrade to absent when their data
source is empty; no placeholder cards. Acceptance: opening a paper shows citations in-margin at
their anchors; opening a recipe shows tappable timers; opening a plain note shows only suggestions;
the D4 packing and quiet rules hold with the new modules.

### T5. Affordance contract and the first three

Build: affordance descriptors `{ id, input: doc_id, output_shape, approval_tier }` registered beside
types, wired through the existing harness tool surface. Ship three end to end: `extract_claims`
(claim-bearing types to claim and finding MemoryNodes with MEMORY_CITES back), `extract_actions`
(meeting, postmortem, correspondence to action items, dispatchable to the job board),
`check_freshness` (readme and reference against the code graph and live resource, verdict rendered
by the freshness module). The rest of the affordance column lands per-affordance in follow-ups; the
contract ships now so descriptors can name them. Acceptance: extract_claims on an imported paper
produces claim nodes visible in recall with provenance; extract_actions on a meeting doc produces
items that dispatch as Jobs; check_freshness on this repo's README flags a deliberately staled
install line in the fixture.

### T6. Plugin registration

Build: three customization tiers, boundaries explicit. Tier 0, declarative: plugins ship
descriptors, recipe deltas, and register axes in a manifest; no code executes; this tier is the
default and the docs lead with it. Tier 1, sandboxed compute: custom inference signals and custom
affordances as Extism WASM modules, authored in TypeScript through the js-pdk (QuickJS-ng, no I/O,
no OS access, host-gated HTTP, memory and time limits), loaded by the existing harness WASM plugin
lane on the Rust side and the universal Extism JS SDK in the browser and desktop; the plugin API is
an XTP schema so authors get typed scaffolds. One .wasm runs on every surface. Tier 2, full trust:
desktop only, for plugins that need the DOM (custom interactive views), signed manifest, explicit
user consent per install, Obsidian model. Acceptance: a sample plugin adds a `poem` type with a
recipe delta and renders through Galley with zero code (Tier 0); a second sample ships a TS-authored
WASM affordance that runs identically under the Rust harness and the browser SDK with filesystem
access provably absent (Tier 1); Tier 2 is documented and gated but ships no example in this
handoff.

## Verify first

- `normalize_kind` constraints in theorem-harness-runtime: charset, casing, length; the 32 ids must
  pass it unchanged.
- The existing kind census in production memory: confirm no live kind collides with a new id under a
  different meaning.
- The margin-apparatus renderer seam from D4: whether module renderers register or are enumerated;
  extend whichever exists.
- The harness affordance and tool registration surface for T5: register through it, no parallel
  registry.
- The desktop shell for Tier 2: which app hosts it (the Tauri lane or the console); Tier 2 stays
  documented-only until that exists.
- Extism embed cost in the browser bundle; lazy-load the SDK behind first plugin use.
- Whether `script` conventions should read from the youtube-production scene format; align the
  heading conventions if so.

## Where it lands

One data file that Compose, Galley, the memory engine, OKF import, and plugins all read. A margin
that knows the difference between a paper and a recipe. Agents that know what a document licenses
them to do. The five-minute test: import a paper, watch citations land in the margin and claims land
in the graph; open a readme and watch it admit its install steps are stale; write a spec and watch
its deliverables report their own status.
