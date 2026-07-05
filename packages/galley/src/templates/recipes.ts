/**
 * Type recipes (G3).
 *
 * A recipe is a declarative object over tokens -- a column plan, a ramp offset,
 * apparatus toggles, a card shape -- never freeform CSS. The actual visual shift
 * lives in galley/css keyed on `className`; the object just says which knobs are
 * on. The registry is keyed by frontmatter `type` (or memory `kind`) and is open
 * for registration. Unknown types fall back to `article` with a quiet chip.
 */

export type RecipeFamily = "prose" | "reference" | "record" | "working" | "structural";

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

/** Resolve a type to a recipe, falling back to article + a quiet chip. */
export function resolveRecipe(type?: string | Recipe): ResolvedRecipe {
  if (type && typeof type === "object") return { recipe: type, unknown: false };
  if (!type) return { recipe: ARTICLE, unknown: false };
  const found = registry.get(type);
  if (found) return { recipe: found, unknown: false };
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
