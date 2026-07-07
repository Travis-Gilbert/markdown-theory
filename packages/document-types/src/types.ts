// The descriptor contract (HANDOFF-DOCUMENT-TYPES). A type is not a render
// template; it is a contract across four layers at once: structure (fields +
// headings), render (a family recipe + deltas), marginalia (which rail modules
// the type earns), and affordances (which agent actions it licenses). Plus one
// cross-cutting dimension: the epistemic class.
//
// Types are data, never code. This file is the shared TS view of `types.json`;
// a Rust reader in theorem-harness-core reads the same file (vendored at build).

/** The six base render families. Family recipes carry the render load; type
 * descriptors only declare deltas over them. */
export type Family = "prose" | "reference" | "procedure" | "record" | "working" | "structural";

/** The cross-cutting epistemic class. Claim-bearing types feed the
 * contradiction machinery; procedural types license execution; records are
 * provenance-heavy and immutable-leaning; references anchor entities;
 * generated types are synthesized (index, changelog). */
export type Epistemic = "claim_bearing" | "procedural" | "record" | "reference" | "generated";

/** The fixed rail vocabulary (D4 extends). A descriptor's `margin` draws only
 * from this set; a module renders nothing when its data source is empty. */
export const RAIL_MODULES = [
  "citations",
  "claims",
  "objections",
  "analogies",
  "questions",
  "timers",
  "quantities",
  "freshness",
  "relationships",
  "actions",
  "usages",
  "history",
  "suggestions",
] as const;

export type RailModule = (typeof RAIL_MODULES)[number];

/** A conventional frontmatter field. `shape` is a lightweight tag:
 * `"string"`, `"string[]"`, `"number"`, `"date"`, `"ref"`, or
 * `"enum:a|b|c"`. Headings are never enforced; fields drive structure. */
export interface FieldSpec {
  key: string;
  required: boolean;
  shape: string;
}

/** The render recipe: a base family plus declarative deltas (className hints,
 * rampOffset, apparatus toggles, `toc`, `numbered`). Galley G3 consumes this. */
export interface RecipeSpec {
  base: Family;
  deltas: Record<string, unknown>;
}

/** One document type. `id` is the storage `kind` (lowercase); the taxonomy maps
 * onto the existing kind space, never forks it. */
export interface TypeDescriptor {
  id: string;
  family: Family;
  epistemic: Epistemic;
  /** Title Case, for OKF export (e.g. "Research Paper"). */
  okf_type: string;
  fields: FieldSpec[];
  /** Conventional sections, never enforced. */
  headings: string[];
  recipe: RecipeSpec;
  /** Rail module ids from RAIL_MODULES. */
  margin: RailModule[];
  affordances: string[];
  /** Heuristic signals for the classifier (consumed by the write-path
   * inference pass, HANDOFF-DOCUMENT-TYPES T3). */
  infer: { signals: string[] };
}

/** The on-disk shape of types.json. */
export interface DescriptorFile {
  version: string;
  descriptors: TypeDescriptor[];
}
