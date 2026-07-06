/**
 * Type recipes (G3).
 *
 * A recipe is a declarative object over tokens -- a column plan, a ramp offset,
 * apparatus toggles, a card shape -- never freeform CSS. The actual visual shift
 * lives in galley/css keyed on `className`; the object just says which knobs are
 * on. The registry is keyed by frontmatter `type` (or memory `kind`) and is open
 * for registration. Unknown types fall back to `article` with a quiet chip.
 */

import { getType } from "@travis-gilbert/document-types";
import type { TypeDescriptor } from "@travis-gilbert/document-types";

export type RecipeFamily =
  | "prose"
  | "reference"
  | "procedure"
  | "record"
  | "working"
  | "structural";

export interface RecipeApparatus {
  /** Note: the gist rendered as a standfirst line under the title. */
  standfirst?: boolean;
  /** Article: a page-margin author line from frontmatter. */
  authorLine?: boolean;
  /** How dates render: right-aligned (note), date-grouped (log), or hidden. */
  dates?: "right" | "grouped" | "none";
  /** Reference: definition-list styling. */
  definitionList?: boolean;
}

export interface Recipe {
  /** Matches a frontmatter `type` / memory `kind`. */
  id: string;
  family: RecipeFamily;
  /** Root modifier class; galley/css carries the shape under it. */
  className: string;
  /** Ramp shift in steps (reference is one step down); realized in CSS. */
  rampOffset: number;
  /** Numbered headings via CSS counters. */
  numberedHeadings: boolean;
  /** Persistent table of contents from the heading tree. */
  toc: boolean;
  apparatus: RecipeApparatus;
}

export const ARTICLE: Recipe = {
  id: "article",
  family: "prose",
  className: "galley-article",
  rampOffset: 0,
  numberedHeadings: false,
  toc: false,
  apparatus: { authorLine: true },
};

export const NOTE: Recipe = {
  id: "note",
  family: "record",
  className: "galley-note",
  rampOffset: 0,
  numberedHeadings: false,
  toc: false,
  apparatus: { standfirst: true, dates: "right" },
};

export const REFERENCE: Recipe = {
  id: "reference",
  family: "reference",
  className: "galley-reference",
  rampOffset: -1,
  numberedHeadings: false,
  toc: true,
  apparatus: { definitionList: true, dates: "none" },
};

export const LOG: Recipe = {
  id: "log",
  family: "structural",
  className: "galley-log",
  rampOffset: 0,
  numberedHeadings: false,
  toc: false,
  apparatus: { dates: "grouped" },
};

const registry = new Map<string, Recipe>([
  [ARTICLE.id, ARTICLE],
  [NOTE.id, NOTE],
  [REFERENCE.id, REFERENCE],
  [LOG.id, LOG],
]);

/** Register a custom recipe. Rejects a collision with an existing id. */
export function registerRecipe(recipe: Recipe): void {
  if (registry.has(recipe.id)) {
    throw new Error(`Recipe id "${recipe.id}" is already registered.`);
  }
  registry.set(recipe.id, recipe);
}

export function getRecipe(id: string): Recipe | undefined {
  return registry.get(id);
}

export interface ResolvedRecipe {
  recipe: Recipe;
  /** True when the requested type was unknown and fell back to article. */
  unknown: boolean;
  /** The type string that was requested (for the fallback chip). */
  requested?: string;
}

/**
 * The six family base recipes (T2). Family recipes carry the render load; a
 * document-type's declarative deltas adjust them per type. These are not in the
 * type registry -- they are the bases the document-types taxonomy resolves onto.
 */
export const FAMILY_PROSE: Recipe = {
  id: "family-prose",
  family: "prose",
  className: "galley-family-prose",
  rampOffset: 0,
  numberedHeadings: false,
  toc: false,
  apparatus: { standfirst: true },
};

export const FAMILY_REFERENCE: Recipe = {
  id: "family-reference",
  family: "reference",
  className: "galley-family-reference",
  rampOffset: -1,
  numberedHeadings: false,
  toc: true,
  apparatus: { definitionList: true, dates: "none" },
};

export const FAMILY_PROCEDURE: Recipe = {
  id: "family-procedure",
  family: "procedure",
  className: "galley-family-procedure",
  rampOffset: 0,
  numberedHeadings: true,
  toc: false,
  apparatus: {},
};

export const FAMILY_RECORD: Recipe = {
  id: "family-record",
  family: "record",
  className: "galley-family-record",
  rampOffset: 0,
  numberedHeadings: false,
  toc: false,
  apparatus: { standfirst: true, dates: "right" },
};

export const FAMILY_WORKING: Recipe = {
  id: "family-working",
  family: "working",
  className: "galley-family-working",
  rampOffset: 0,
  numberedHeadings: false,
  toc: false,
  apparatus: { standfirst: true },
};

export const FAMILY_STRUCTURAL: Recipe = {
  id: "family-structural",
  family: "structural",
  className: "galley-family-structural",
  rampOffset: 0,
  numberedHeadings: false,
  toc: false,
  apparatus: { dates: "grouped" },
};

const FAMILY_BASES: Record<RecipeFamily, Recipe> = {
  prose: FAMILY_PROSE,
  reference: FAMILY_REFERENCE,
  procedure: FAMILY_PROCEDURE,
  record: FAMILY_RECORD,
  working: FAMILY_WORKING,
  structural: FAMILY_STRUCTURAL,
};

function isApparatus(value: unknown): value is RecipeApparatus {
  return typeof value === "object" && value !== null;
}

/**
 * Build an effective recipe from a document-type descriptor: the family base
 * with declarative deltas (className, rampOffset, `numbered`, `toc`, apparatus)
 * applied (T2). The effective recipe carries the type's own id.
 */
export function recipeFromDescriptor(descriptor: TypeDescriptor): Recipe {
  const base = FAMILY_BASES[descriptor.family as RecipeFamily] ?? FAMILY_PROSE;
  const deltas = descriptor.recipe?.deltas ?? {};
  return {
    id: descriptor.id,
    family: descriptor.family as RecipeFamily,
    className: typeof deltas.className === "string" ? deltas.className : base.className,
    rampOffset: typeof deltas.rampOffset === "number" ? deltas.rampOffset : base.rampOffset,
    numberedHeadings:
      typeof deltas.numbered === "boolean" ? deltas.numbered : base.numberedHeadings,
    toc: typeof deltas.toc === "boolean" ? deltas.toc : base.toc,
    apparatus: { ...base.apparatus, ...(isApparatus(deltas.apparatus) ? deltas.apparatus : {}) },
  };
}

/**
 * Resolve a memory `kind` / frontmatter `type` through the document-types
 * taxonomy to its effective recipe. Returns undefined when the kind is not in
 * the taxonomy (the caller decides the fallback).
 */
export function resolveType(kind: string): Recipe | undefined {
  const descriptor = getType(kind);
  return descriptor ? recipeFromDescriptor(descriptor) : undefined;
}

/**
 * Resolve a type to a recipe. Precedence: an explicit Recipe object, then a
 * registered recipe (the legacy core four + plugins), then the document-types
 * taxonomy (family base + per-type deltas), then article + a quiet chip.
 */
export function resolveRecipe(type?: string | Recipe): ResolvedRecipe {
  if (type && typeof type === "object") return { recipe: type, unknown: false };
  if (!type) return { recipe: ARTICLE, unknown: false };
  const found = registry.get(type);
  if (found) return { recipe: found, unknown: false };
  const fromTaxonomy = resolveType(type);
  if (fromTaxonomy) return { recipe: fromTaxonomy, unknown: false };
  return { recipe: ARTICLE, unknown: true, requested: type };
}

/** GitHub-style slug for heading anchors and the table of contents. */
export function slugify(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
